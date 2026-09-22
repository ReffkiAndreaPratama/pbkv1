import prisma from "../db";

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export type Tier = "NOVICE" | "DEVELOPING" | "PROFICIENT";

export function tierOf(m: number): Tier {
  if (m >= 0.75) return "PROFICIENT";
  if (m >= 0.4) return "DEVELOPING";
  return "NOVICE";
}

// Quiz formula:  benar (1st try) m += gain*(1-m); benar+hint gain*0.6; salah m -= 0.06*m
const QUIZ_GAIN = { EASY: 0.08, MEDIUM: 0.1, HARD: 0.13 } as const;

export function updateMasteryFromQuiz(current: number, correct: boolean, hintUsed: boolean, difficulty: "EASY" | "MEDIUM" | "HARD"): number {
  const gain = QUIZ_GAIN[difficulty];
  let next = current;
  if (correct) {
    const g = hintUsed ? gain * 0.6 : gain;
    next = current + g * (1 - current);
  } else {
    next = current - 0.06 * current;
  }
  return clamp(next, 0, 1);
}

// Simulation formula: sukses&acc>=0.85: +0.18*(1-m); sukses&acc<0.85: +0.10*(1-m); gagal: -0.08*m
export function updateMasteryFromSimulation(current: number, success: boolean, accuracy: number): number {
  let next = current;
  if (success) {
    const g = accuracy >= 0.85 ? 0.18 : 0.1;
    next = current + g * (1 - current);
  } else {
    next = current - 0.08 * current;
  }
  return clamp(next, 0, 1);
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) total += 200 + 50 * (l - 1);
  return total;
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

// Rekomendasi skor sebuah kasus utk pengguna (makin tinggi = makin dianjurkan).
export function caseRecommendationScore(mastery: number, difficulty: "EASY" | "MEDIUM" | "HARD", sudahDicoba: number, priority: number): number {
  const gapScore = (1 - mastery) * 60;
  const priorityScore = priority * 25;
  const freshScore = sudahDicoba === 0 ? 15 : 6;
  let diffScore = 10;
  if (difficulty === "HARD") diffScore = mastery >= 0.75 ? 12 : 2;
  if (difficulty === "MEDIUM") diffScore = mastery >= 0.4 ? 10 : 4;
  return Math.round(gapScore + priorityScore + freshScore + diffScore);
}

export function allowedDifficulty(mastery: number): "EASY" | "MEDIUM" | "HARD" {
  if (mastery < 0.4) return "EASY";
  if (mastery < 0.75) return "MEDIUM";
  return "HARD";
}

export interface MasteryRow {
  skillId: string;
  code: string;
  name: string;
  mastery: number;
  attempts: number;
  successes: number;
}

export async function loadMastery(userId: string): Promise<Map<string, MasteryRow>> {
  const skills = await prisma.skill.findMany({ orderBy: { code: "asc" } });
  const existing = await prisma.skillMastery.findMany({ where: { userId } });
  const map = new Map<string, MasteryRow>();
  for (const s of skills) {
    const sm = existing.find((e) => e.skillId === s.id);
    map.set(s.code, {
      skillId: s.id,
      code: s.code,
      name: s.name,
      mastery: sm?.mastery ?? 0,
      attempts: sm?.attempts ?? 0,
      successes: sm?.successes ?? 0,
    });
  }
  return (map as Map<string, MasteryRow>) as unknown as Map<string, MasteryRow>;
}

export async function ensureSkillMastery(userId: string, skillId: string) {
  return prisma.skillMastery.upsert({
    where: { userId_skillId: { userId, skillId } },
    create: { userId, skillId, mastery: 0 },
    update: {},
  });
}

export type PathItemType = "MATERIAL" | "CASE" | "QUIZ" | "POSTTEST";

export interface PathItem {
  type: PathItemType;
  refId: string;
  skillId: string;
  skillCode: string;
  reason: string;
  urgency: number;
}

export async function recommendPath(userId: string): Promise<PathItem[]> {
  const profile = await prisma.learningProfile.findUnique({ where: { userId } });
  const mastery = await loadMastery(userId);
  const priorityCodes: string[] = (profile?.skillPriority as string[] | null) ?? [];

  const rows = [...mastery.values()];
  rows.sort((a, b) => a.mastery - b.mastery);

  const items: PathItem[] = [];
  const allLearned = rows.every((r) => r.mastery >= 0.75 && r.successes >= 1);

  // 1. weaknesses
  for (const row of rows) {
    if (row.mastery >= 0.75) continue;
    const tier = tierOf(row.mastery);
    const materials = await prisma.material.findMany({ where: { skillId: row.skillId, isActive: true }, orderBy: { order: "asc" } });
    const reads = await prisma.materialRead.count({ where: { userId, materialId: { in: materials.map((m) => m.id) } } });

    if (tier === "NOVICE" && materials.length > 0 && reads < materials.length) {
      const next = materials[reads] ?? materials[0];
      items.push({
        type: "MATERIAL",
        refId: next.id,
        skillId: row.skillId,
        skillCode: row.code,
        reason: `${row.name} masih NOVICE — baca materi dulu.`,
        urgency: Math.round((1 - row.mastery) * 100),
      });
    }
    const diff = allowedDifficulty(row.mastery);
    const cases = await prisma.caseModel.findMany({
      where: { skillId: row.skillId, isActive: true, difficulty: diff },
      orderBy: { order: "asc" },
      include: { attempts: { where: { userId, success: true } } },
    });
    const tries = await prisma.simulationAttempt.count({ where: { userId, case: { skillId: row.skillId } } });
    for (const c of cases.slice(0, 1)) {
      const priority = priorityCodes.includes(row.code) ? 1 : 0;
      items.push({
        type: "CASE",
        refId: c.id,
        skillId: row.skillId,
        skillCode: row.code,
        reason: `Latih ${row.name} lewat simulasi kasus (${diff}).`,
        urgency: caseRecommendationScore(row.mastery, c.difficulty, c.attempts.length, priority),
      });
    }
    items.push({
      type: "QUIZ",
      refId: row.skillId,
      skillId: row.skillId,
      skillCode: row.code,
      reason: `Asah pemahaman ${row.name} dengan kuis adaptif.`,
      urgency: tier === "NOVICE" ? 60 : 40,
    });
    if (items.length >= 6) break;
  }

  // Posttest tersedia bila semua skill dikuasai & belum lulus
  if (allLearned && !profile?.posttestDone) {
    items.push({
      type: "POSTTEST",
      refId: userId,
      skillId: "",
      skillCode: "LULUS",
      reason: "Semua skill dikuasai — ambil posttest untuk kelulusan.",
      urgency: 100,
    });
  }

  return items.slice(0, 5);
}