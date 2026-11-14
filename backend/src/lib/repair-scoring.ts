import { clamp } from "./adaptive";

export interface RepairScoreInput {
  heartsLeft: number;
  maxHearts: number;
  actions: number;
  correctActions: number;
  wrongActions: number;
  maxCombo: number;
  timeSec: number;
  timeLimitSec: number;
  success: boolean;
}

export interface RepairScoreResult {
  score: number;
  accuracy: number;
  speed: number;
  comboBonus: number;
  heartBonus: number;
  grade: string;
  stars: number;
}

export function repairGradeOf(score: number): string {
  if (score >= 95) return "S";
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  return "D";
}

export function repairStarsOf(score: number, success: boolean): number {
  if (!success) return 0;
  if (score >= 88) return 3;
  if (score >= 72) return 2;
  return 1;
}

export function scoreRepair(input: RepairScoreInput): RepairScoreResult {
  const attempts = Math.max(1, input.correctActions + input.wrongActions);
  const accuracy = clamp(input.correctActions / attempts, 0, 1);
  const speed = clamp(1 - input.timeSec / Math.max(1, input.timeLimitSec), 0, 1);
  const comboBonus = Math.min(15, input.maxCombo * 3);
  const heartBonus = Math.round(clamp(input.heartsLeft / Math.max(1, input.maxHearts), 0, 1) * 10);

  let score = 45 + accuracy * 30 + speed * 15 + comboBonus + heartBonus;
  if (!input.success) score = Math.max(10, score * 0.4);
  score = clamp(Math.round(score), 0, 100);

  return {
    score,
    accuracy,
    speed,
    comboBonus,
    heartBonus,
    grade: repairGradeOf(score),
    stars: repairStarsOf(score, input.success),
  };
}
