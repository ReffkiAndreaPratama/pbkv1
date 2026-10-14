import { Router } from "express";
import prisma from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireAdmin);

// Users overview
router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, profile: { select: { totalXp: true, level: true, pretestDone: true, posttestDone: true, posttestScore: true, streakDays: true, learningStyle: true, targetLevel: true } } },
    orderBy: { createdAt: "desc" },
  });
  const simCounts = await prisma.simulationAttempt.groupBy({ by: ["userId"], _count: true });
  const countMap = new Map(simCounts.map((s) => [s.userId, s._count]));
  const profileDefault = { totalXp: 0, level: 1, pretestDone: false, posttestDone: false, posttestScore: null, streakDays: 0, learningStyle: null, targetLevel: null };
  res.json(users.map((u) => ({ ...u, profile: u.profile ?? profileDefault, simCount: countMap.get(u.id) ?? 0 })));
});

// Detail user
router.get("/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, profile: true },
  });
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  const mastery = await prisma.skillMastery.findMany({ where: { userId: user.id }, include: { skill: true } });
  const recentSims = await prisma.simulationAttempt.findMany({ where: { userId: user.id }, include: { case: { select: { title: true, difficulty: true, skill: { select: { code: true, name: true } } } } }, orderBy: { startedAt: "desc" }, take: 10 });
  const recentQuizzes = await prisma.quizSession.findMany({ where: { userId: user.id }, orderBy: { startedAt: "desc" }, take: 10 });
  const profileDefault = { totalXp: 0, level: 1, pretestDone: false, posttestDone: false, posttestScore: null, streakDays: 0 };
  res.json({ ...user, profile: user.profile ?? profileDefault, mastery: mastery.map((m) => ({ code: m.skill.code, name: m.skill.name, mastery: m.mastery, attempts: m.attempts, successes: m.successes })), recentSims, recentQuizzes });
});

// Cases management
router.get("/cases", async (_req, res) => {
  const cases = await prisma.caseModel.findMany({ include: { skill: true, _count: { select: { attempts: true } } }, orderBy: { order: "asc" } });
  res.json(cases.map((c) => ({ ...c, attemptCount: c._count.attempts })));
});

router.put("/cases/:id", async (req, res) => {
  const { isActive, difficulty, title } = req.body as { isActive?: boolean; difficulty?: string; title?: string };
  const data: any = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (difficulty && ["EASY", "MEDIUM", "HARD"].includes(difficulty)) data.difficulty = difficulty;
  if (title) data.title = title;
  const updated = await prisma.caseModel.update({ where: { id: req.params.id }, data, include: { skill: true } });
  res.json(updated);
});

// Questions management
router.get("/questions", async (_req, res) => {
  const questions = await prisma.question.findMany({ include: { skill: { select: { code: true, name: true } } }, orderBy: [{ difficulty: "asc" }, { skill: { code: "asc" } }] });
  res.json(questions.map((q) => ({ ...q, correctKeys: q.correctKeys })));
});

router.post("/questions", async (req, res) => {
  const { skillId, prompt, options, correctKeys, difficulty, phases, explanation, imageUrl, videoUrl } = req.body;
  const q = await prisma.question.create({
    data: {
      skillId,
      prompt,
      options,
      correctKeys,
      difficulty,
      phases,
      explanation,
      imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
      videoUrl: typeof videoUrl === "string" && videoUrl.trim() ? videoUrl.trim() : null,
      isActive: true,
    },
  });
  res.status(201).json(q);
});

router.put("/questions/:id", async (req, res) => {
  const { isActive, prompt, difficulty, options, correctKeys, explanation, phases, imageUrl, videoUrl } = req.body;
  const data: any = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (prompt) data.prompt = prompt;
  if (difficulty) data.difficulty = difficulty;
  if (options) data.options = options;
  if (correctKeys) data.correctKeys = correctKeys;
  if (typeof explanation === "string") data.explanation = explanation;
  if (phases) data.phases = phases;
  if (imageUrl !== undefined) data.imageUrl = typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;
  if (videoUrl !== undefined) data.videoUrl = typeof videoUrl === "string" && videoUrl.trim() ? videoUrl.trim() : null;
  const updated = await prisma.question.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

// Materials management
router.get("/skills", async (_req, res) => {
  const skills = await prisma.skill.findMany({ orderBy: { code: "asc" } });
  res.json(skills);
});

router.get("/materials", async (_req, res) => {
  const materials = await prisma.material.findMany({ include: { skill: { select: { id: true, code: true, name: true } }, _count: { select: { materialRead: true } } }, orderBy: [{ skill: { code: "asc" } }, { order: "asc" }] });
  res.json(materials.map((m) => ({ ...m, readCount: m._count.materialRead })));
});

router.put("/materials/:id", async (req, res) => {
  const { isActive, title, summary, content, order, skillId, imageUrl, videoUrl, links } = req.body;
  const data: any = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (typeof title === "string" && title.trim()) data.title = title.trim();
  if (typeof summary === "string") data.summary = summary;
  if (typeof content === "string") data.content = content;
  if (order !== undefined) data.order = Number(order);
  if (typeof skillId === "string") data.skillId = skillId;
  if (imageUrl !== undefined) data.imageUrl = typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;
  if (videoUrl !== undefined) data.videoUrl = typeof videoUrl === "string" && videoUrl.trim() ? videoUrl.trim() : null;
  if (links !== undefined) data.links = links;
  const updated = await prisma.material.update({ where: { id: req.params.id }, data, include: { skill: { select: { id: true, code: true, name: true } } } });
  res.json(updated);
});

// Stats overview
router.get("/stats", async (_req, res) => {
  const [userCount, caseCount, simCount, quizCount, materialCount] = await Promise.all([
    prisma.user.count(),
    prisma.caseModel.count(),
    prisma.simulationAttempt.count(),
    prisma.quizSession.count({ where: { completedAt: { not: null } } }),
    prisma.material.count(),
  ]);
  const successRateData = await prisma.simulationAttempt.groupBy({ by: ["success"], _count: true });
  const successCount = successRateData.find((s) => s.success)?._count ?? 0;
  const failCount = successRateData.find((s) => !s.success)?._count ?? 0;
  const avgScore = await prisma.simulationAttempt.aggregate({ _avg: { score: true }, where: { score: { gt: 0 } } });
  const skillMastery = await prisma.skillMastery.findMany({ include: { skill: true, user: { select: { id: true, name: true } } } });
  const avgBySkill = new Map<string, { name: string; total: number; count: number }>();
  for (const sm of skillMastery) {
    const cur = avgBySkill.get(sm.skillId) ?? { name: sm.skill.name, total: 0, count: 0 };
    cur.total += sm.mastery;
    cur.count += 1;
    avgBySkill.set(sm.skillId, cur);
  }
  const skillAverages = [...avgBySkill.values()].map((v) => ({ name: v.name, avgMastery: v.count > 0 ? Math.round((v.total / v.count) * 1000) / 1000 : 0, count: v.count }));

  res.json({
    totalUsers: userCount,
    totalCases: caseCount,
    totalSims: simCount,
    totalQuizzes: quizCount,
    totalMaterials: materialCount,
    successRate: simCount > 0 ? Math.round((successCount / simCount) * 100) : 0,
    avgSimScore: Math.round(avgScore._avg.score ?? 0),
    skillAverages,
  });
});

// Reset a user's learning progress
router.post("/users/:id/reset", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  await prisma.$transaction([
    prisma.simulationStep.deleteMany({ where: { attempt: { userId: user.id } } }),
    prisma.simulationAttempt.deleteMany({ where: { userId: user.id } }),
    prisma.quizAnswer.deleteMany({ where: { session: { userId: user.id } } }),
    prisma.quizSession.deleteMany({ where: { userId: user.id } }),
    prisma.skillMastery.deleteMany({ where: { userId: user.id } }),
    prisma.materialRead.deleteMany({ where: { userId: user.id } }),
    prisma.activityLog.deleteMany({ where: { userId: user.id } }),
    prisma.userAchievement.deleteMany({ where: { userId: user.id } }),
    prisma.learningProfile.update({
      where: { userId: user.id },
      data: { totalXp: 0, level: 1, streakDays: 0, lastActiveDate: null, pretestDone: false, posttestDone: false, posttestScore: null, skillPriority: [] },
    }),
  ]);
  res.json({ ok: true });
});

router.delete("/cases/:id", async (req, res) => {
  const c = await prisma.caseModel.findUnique({ where: { id: req.params.id } });
  if (!c) { res.status(404).json({ error: "Case not found." }); return; }
  await prisma.$transaction([
    prisma.simulationStep.deleteMany({ where: { attempt: { caseId: c.id } } }),
    prisma.simulationAttempt.deleteMany({ where: { caseId: c.id } }),
    prisma.caseOption.deleteMany({ where: { caseId: c.id } }),
    prisma.caseNode.deleteMany({ where: { caseId: c.id } }),
  ]);
  await prisma.caseModel.delete({ where: { id: c.id } });
  res.json({ ok: true });
});

router.delete("/questions/:id", async (req, res) => {
  await prisma.quizAnswer.deleteMany({ where: { questionId: req.params.id } });
  const q = await prisma.question.delete({ where: { id: req.params.id } });
  res.json({ ok: true, id: q.id });
});

router.delete("/materials/:id", async (req, res) => {
  await prisma.materialRead.deleteMany({ where: { materialId: req.params.id } });
  const m = await prisma.material.delete({ where: { id: req.params.id } });
  res.json({ ok: true, id: m.id });
});

router.post("/materials", async (req, res) => {
  const { skillId, title, summary, content, order, imageUrl, videoUrl, links } = req.body;
  if (!skillId || !title || !content) { res.status(422).json({ error: "skillId, title, dan content wajib diisi." }); return; }
  const m = await prisma.material.create({
    data: {
      skillId,
      title,
      summary: summary ?? "",
      content,
      order: Number(order) || 1,
      isActive: true,
      imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
      videoUrl: typeof videoUrl === "string" && videoUrl.trim() ? videoUrl.trim() : null,
      links: links ?? null,
    },
    include: { skill: { select: { id: true, code: true, name: true } } },
  });
  res.status(201).json({ ...m, readCount: 0 });
});

router.post("/cases", async (req, res) => {
  const { skillId, title, scenario, difficulty, targetSteps, expectedTimeSec, order } = req.body;
  if (!skillId || !title) { res.status(422).json({ error: "skillId dan title wajib diisi." }); return; }
  const c = await prisma.caseModel.create({
    data: {
      skillId,
      title,
      scenario: scenario ?? "",
      difficulty: ["EASY", "MEDIUM", "HARD"].includes(difficulty) ? difficulty : "MEDIUM",
      targetSteps: Number(targetSteps) || 1,
      expectedTimeSec: Number(expectedTimeSec) || 600,
      order: Number(order) || 999,
      isActive: true,
    },
    include: { skill: true },
  });
  res.status(201).json({ ...c, attemptCount: 0 });
});

export default router;