import { Router } from "express";
import { z } from "zod";
import prisma from "../db";
import { requireAuth } from "../middleware/auth";
import { updateMasteryFromQuiz } from "../lib/adaptive";
import { awardQuizCorrect, awardPretestDone, awardPosttestDone, touchStreak, checkAchievements } from "../lib/gamification";

const router = Router();
router.use(requireAuth);

// --- helpers ---
const pick = <T>(arr: T[], n: number) => {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length > 0 && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy[i]!);
    copy.splice(i, 1);
  }
  return out;
};

const selectPublic = (q: { id: string; prompt: string; options: unknown; difficulty: string }) => {
  const opts = (q.options ?? []) as { id?: string; key?: string; text: string }[];
  return {
    id: q.id,
    prompt: q.prompt,
    options: opts.map((o) => ({ key: o.key ?? o.id ?? "", text: o.text })),
    difficulty: q.difficulty,
  };
};

// --- Pretest ---
router.get("/pretest", async (_req, res) => {
  const all = await prisma.question.findMany({ where: { isActive: true }, orderBy: { id: "asc" } });
  const qs = all.filter((q) => (q.phases as string[] ?? []).includes("PRETEST"));
  res.json(pick(qs, 10).map(selectPublic));
});

router.post("/pretest/start", async (req: any, res) => {
  await touchStreak(req.user!.id);
  const session = await prisma.quizSession.create({
    data: { userId: req.user!.id, type: "PRETEST" },
  });
  res.status(201).json({ sessionId: session.id });
});

const answerSchema = z.object({
  sessionId: z.string(),
  answers: z.array(z.object({ questionId: z.string(), selectedKeys: z.array(z.string()) })),
});

router.post("/pretest/submit", async (req: any, res) => {
  const userId = req.user!.id;
  const { sessionId, answers } = answerSchema.parse(req.body);
  const session = await prisma.quizSession.findFirst({ where: { id: sessionId, userId, type: "PRETEST" } });
  if (!session) { res.status(404).json({ error: "Session not found." }); return; }
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });

  let correctCount = 0;
  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId);
    if (!q) continue;
    const isCorrect = JSON.stringify(a.selectedKeys.sort()) === JSON.stringify((q.correctKeys as string[]).sort());
    if (isCorrect) correctCount++;
    await prisma.quizAnswer.create({
      data: { sessionId, questionId: q.id, selectedKeys: a.selectedKeys, isCorrect, hintUsed: false },
    });
    // Update mastery per skill
    const sm = await prisma.skillMastery.findFirst({ where: { userId, skillId: q.skillId } });
    const current = sm?.mastery ?? 0;
    const newM = updateMasteryFromQuiz(current, isCorrect, false, q.difficulty as "EASY" | "MEDIUM" | "HARD");
    await prisma.skillMastery.upsert({
      where: { userId_skillId: { userId, skillId: q.skillId } },
      create: { userId, skillId: q.skillId, mastery: newM },
      update: { mastery: newM },
    });
    if (isCorrect) await awardQuizCorrect(userId, q.skillId);
  }

  const totalCount = answers.length || 1;
  const score = Math.round((correctCount / totalCount) * 100);
  await prisma.quizSession.update({ where: { id: sessionId }, data: { completedAt: new Date(), correctCount, totalCount, score } });
  await prisma.learningProfile.update({ where: { userId }, data: { pretestDone: true } });
  await awardPretestDone(userId, score);
  await checkAchievements(userId);
  res.json({ score, correctCount, totalCount });
});

// --- Posttest ---
router.get("/posttest", async (_req, res) => {
  const all = await prisma.question.findMany({ where: { isActive: true } });
  const qs = all.filter((q) => (q.phases as string[] ?? []).includes("POSTTEST"));
  // distribution: 4E 4M 2H
  const easy = pick(qs.filter((q) => q.difficulty === "EASY"), 4);
  const med = pick(qs.filter((q) => q.difficulty === "MEDIUM"), 4);
  const hard = pick(qs.filter((q) => q.difficulty === "HARD"), 2);
  res.json([...easy, ...med, ...hard].map(selectPublic));
});

router.post("/posttest/start", async (req: any, res) => {
  const session = await prisma.quizSession.create({ data: { userId: req.user!.id, type: "POSTTEST" } });
  res.status(201).json({ sessionId: session.id });
});

router.post("/posttest/submit", async (req: any, res) => {
  const userId = req.user!.id;
  const { sessionId, answers } = answerSchema.parse(req.body);
  const session = await prisma.quizSession.findFirst({ where: { id: sessionId, userId, type: "POSTTEST" } });
  if (!session) { res.status(404).json({ error: "Session not found." }); return; }
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });

  let correctCount = 0;
  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId);
    if (!q) continue;
    const isCorrect = JSON.stringify(a.selectedKeys.sort()) === JSON.stringify((q.correctKeys as string[]).sort());
    if (isCorrect) correctCount++;
    await prisma.quizAnswer.create({
      data: { sessionId, questionId: q.id, selectedKeys: a.selectedKeys, isCorrect, hintUsed: false },
    });
  }

  const totalCount = answers.length || 1;
  const score = Math.round((correctCount / totalCount) * 100);
  await prisma.quizSession.update({ where: { id: sessionId }, data: { completedAt: new Date(), correctCount, totalCount, score } });
  await prisma.learningProfile.update({ where: { userId }, data: { posttestDone: true, posttestScore: score } });
  await awardPosttestDone(userId, score);
  await checkAchievements(userId);
  res.json({ score, correctCount, totalCount, passed: score >= 70 });
});

// --- Adaptive ---
router.get("/adaptive", async (req, res) => {
  const skillId = req.query.skillId as string;
  const where = skillId ? { skillId, isActive: true } : { isActive: true };
  const all = await prisma.question.findMany({ where });
  const qs = all.filter((q) => (q.phases as string[] ?? []).includes("ADAPTIVE"));
  res.json(pick(qs, 5).map(selectPublic));
});

router.post("/adaptive/start", async (req: any, res) => {
  const session = await prisma.quizSession.create({ data: { userId: req.user!.id, type: "ADAPTIVE" } });
  res.status(201).json({ sessionId: session.id });
});

router.post("/adaptive/submit", async (req: any, res) => {
  const userId = req.user!.id;
  const { sessionId, answers } = answerSchema.parse(req.body);
  const session = await prisma.quizSession.findFirst({ where: { id: sessionId, userId, type: "ADAPTIVE" } });
  if (!session) { res.status(404).json({ error: "Session not found." }); return; }
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
  let correctCount = 0;
  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId);
    if (!q) continue;
    const isCorrect = JSON.stringify(a.selectedKeys.sort()) === JSON.stringify((q.correctKeys as string[]).sort());
    if (isCorrect) correctCount++;
    await prisma.quizAnswer.create({ data: { sessionId, questionId: q.id, selectedKeys: a.selectedKeys, isCorrect, hintUsed: false } });
    const sm = await prisma.skillMastery.findFirst({ where: { userId, skillId: q.skillId } });
    const newM = updateMasteryFromQuiz(sm?.mastery ?? 0, isCorrect, false, q.difficulty as any);
    await prisma.skillMastery.upsert({ where: { userId_skillId: { userId, skillId: q.skillId } }, create: { userId, skillId: q.skillId, mastery: newM }, update: { mastery: newM } });
    if (isCorrect) await awardQuizCorrect(userId, q.skillId);
  }
  const totalCount = answers.length || 1;
  const score = Math.round((correctCount / totalCount) * 100);
  await prisma.quizSession.update({ where: { id: sessionId }, data: { completedAt: new Date(), correctCount, totalCount, score } });
  await checkAchievements(userId);
  res.json({ score, correctCount, totalCount });
});

export default router;