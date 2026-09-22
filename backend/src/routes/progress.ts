import { Router } from "express";
import prisma from "../db";
import { requireAuth } from "../middleware/auth";
import { loadMastery, tierOf } from "../lib/adaptive";

const router = Router();
router.use(requireAuth);

router.get("/mastery", async (req: any, res) => {
  const m = await loadMastery(req.user!.id);
  res.json([...m.values()].map((r) => ({ ...r, tier: tierOf(r.mastery) })));
});

router.get("/achievements", async (req: any, res) => {
  const achievements = await prisma.achievement.findMany({ orderBy: { code: "asc" } });
  const owned = await prisma.userAchievement.findMany({ where: { userId: req.user!.id } });
  const ownedSet = new Map(owned.map((o) => [o.achievementId, o.unlockedAt]));
  res.json(achievements.map((a) => ({ ...a, unlocked: ownedSet.has(a.id), unlockedAt: ownedSet.get(a.id) ?? null })));
});

router.get("/activity", async (req: any, res) => {
  const logs = await prisma.activityLog.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, take: 50 });
  res.json(logs);
});

router.get("/leaderboard", async (_req, res) => {
  const profiles = await prisma.learningProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ totalXp: "desc" }, { level: "desc" }],
    take: 50,
  });
  res.json(profiles.map((p, i) => ({
    rank: i + 1,
    user: p.user,
    totalXp: p.totalXp,
    level: p.level,
    streakDays: p.streakDays,
  })));
});

router.get("/summary", async (req: any, res) => {
  const userId = req.user!.id;
  const profile = await prisma.learningProfile.findUnique({ where: { userId } });
  const mastery = await loadMastery(userId);
  const simStats = await prisma.simulationAttempt.aggregate({ where: { userId }, _avg: { score: true }, _count: true });
  const successCount = await prisma.simulationAttempt.count({ where: { userId, success: true } });
  const quizSessions = await prisma.quizSession.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 5 });
  const materialReads = await prisma.materialRead.count({ where: { userId } });
  const achievementCount = await prisma.userAchievement.count({ where: { userId } });
  const masteryRows = [...mastery.values()];
  const avgMastery = masteryRows.reduce((s, r) => s + r.mastery, 0) / (masteryRows.length || 1);
  res.json({
    profile,
    totalCases: simStats._count,
    successCases: successCount,
    avgScore: Math.round(simStats._avg.score ?? 0),
    materialReads,
    achievementCount,
    avgMastery: Math.round(avgMastery * 1000) / 1000,
    recentQuizzes: quizSessions,
    masteryBySkill: masteryRows.map((r) => ({ code: r.code, name: r.name, mastery: r.mastery, tier: tierOf(r.mastery) })),
  });
});

export default router;