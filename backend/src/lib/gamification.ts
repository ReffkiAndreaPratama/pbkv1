import prisma from "../db";
import { levelFromXp, type Tier } from "./adaptive";

export async function addXp(userId: string, points: number) {
  const profile = await prisma.learningProfile.findUnique({ where: { userId } });
  if (!profile) return;
  const newTotal = profile.totalXp + points;
  const newLevel = levelFromXp(newTotal);
  const levelUp = newLevel > profile.level;
  await prisma.learningProfile.update({
    where: { userId },
    data: { totalXp: newTotal, level: newLevel },
  });
  return { totalXp: newTotal, level: newLevel, levelUp };
}

export async function touchStreak(userId: string) {
  const profile = await prisma.learningProfile.findUnique({ where: { userId } });
  if (!profile) return { streakDays: 0 };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null;
  last?.setHours(0, 0, 0, 0);
  let streak = profile.streakDays;
  if (!last || last.getTime() < today.getTime()) {
    const diffDays = last ? Math.floor((today.getTime() - last.getTime()) / 86_400_000) : 999;
    streak = diffDays === 1 ? streak + 1 : 1;
    await prisma.learningProfile.update({
      where: { userId },
      data: { streakDays: streak, lastActiveDate: new Date() },
    });
  }
  return { streakDays: streak };
}

export async function checkAchievements(userId: string) {
  const profile = await prisma.learningProfile.findUnique({ where: { userId } });
  if (!profile) return [];

  const attemptStats = await prisma.simulationAttempt.groupBy({
    by: ["success"],
    where: { userId },
    _count: true,
  });
  const successCount = attemptStats.find((s) => s.success)?._count ?? 0;

  const perfectCount = await prisma.simulationAttempt.count({
    where: { userId, success: true, accuracy: { gte: 0.9 }, hintsUsed: 0 },
  });

  const noHintSuccessCount = await prisma.simulationAttempt.count({
    where: { userId, success: true, hintsUsed: 0 },
  });

  const materialReadCount = await prisma.materialRead.count({ where: { userId } });

  const quizCorrectCount = await prisma.quizAnswer.count({ where: { session: { userId }, isCorrect: true } });

  const achievements = await prisma.achievement.findMany();
  const existing = await prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } });
  const owned = new Set(existing.map((e) => e.achievementId));

  const stats = {
    PRETEST_DONE: profile.pretestDone ? 1 : 0,
    CASE_SUCCESS: successCount,
    SIM_PERFECT: perfectCount,
    SIM_NO_HINT: noHintSuccessCount,
    SIM_UNDER_HALF_TIME: (await prisma.simulationAttempt.findMany({ where: { userId, success: true }, include: { case: { select: { expectedTimeSec: true } } } })).filter((a) => a.timeSec <= (a.case.expectedTimeSec / 2)).length,
    MATERIAL_READ: materialReadCount,
    QUIZ_CORRECT: quizCorrectCount,
    STREAK: profile.streakDays,
    LEVEL: profile.level,
    POSTTEST_PASS: profile.posttestDone && (profile.posttestScore ?? 0) >= 70 ? 1 : 0,
  } as Record<string, number>;

  const newly: string[] = [];

  for (const ach of achievements) {
    if (owned.has(ach.id)) continue;
    const cond = ach.condition as Record<string, string | number>;
    const type = String(cond.type);
    const target = Number(cond.count) || 1;
    const value = stats[type] ?? 0;
    if (value >= target) {
      await prisma.userAchievement.create({ data: { userId, achievementId: ach.id } });
      await addXp(userId, ach.xpReward);
      await prisma.activityLog.create({ data: { userId, type: "ACHIEVEMENT", refId: ach.id, points: ach.xpReward } });
      newly.push(ach.code);
    }
  }
  return newly;
}

export async function awardQuizCorrect(userId: string, skillId: string) {
  await addXp(userId, 10);
  await prisma.activityLog.create({ data: { userId, type: "QUIZ_ANSWER", refId: skillId, points: 10 } });
}

export async function awardSimSuccess(userId: string, skillId: string, score: number) {
  const xp = 30 + Math.round(score / 10);
  await addXp(userId, xp);
  await prisma.activityLog.create({ data: { userId, type: "CASE_SUBMIT", refId: skillId, meta: { score }, points: xp } });
}

export async function awardSimFail(userId: string, skillId: string) {
  await addXp(userId, 5);
  await prisma.activityLog.create({ data: { userId, type: "CASE_SUBMIT", refId: skillId, meta: { score: 0 }, points: 5 } });
}

export async function awardMaterialRead(userId: string, materialId: string) {
  await addXp(userId, 15);
  await prisma.activityLog.create({ data: { userId, type: "MATERIAL_READ", refId: materialId, points: 15 } });
}

export async function awardPretestDone(userId: string, score: number) {
  await addXp(userId, 40);
  await prisma.activityLog.create({ data: { userId, type: "PRETEST", meta: { score }, points: 40 } });
}

export async function awardPosttestDone(userId: string, score: number) {
  await addXp(userId, score >= 70 ? 100 : 40);
  await prisma.activityLog.create({ data: { userId, type: "POSTTEST", meta: { score }, points: score >= 70 ? 100 : 40 } });
}