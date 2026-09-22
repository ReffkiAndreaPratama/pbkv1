import { clamp } from "./adaptive";

export interface SimScoringInput {
  targetSteps: number;
  totalMoves: number;
  wrongMoves: number;
  hintsUsed: number;
  timeSec: number;
  expectedTimeSec: number;
  success: boolean;
}

export interface SimScoringResult {
  score: number;
  accuracy: number;
  efficiency: number;
  timeScore: number;
  hintPenalty: number;
  grade: string;
  stars: number;
}

export function gradeOf(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

export function starsOf(score: number): number {
  if (score >= 85) return 4;
  if (score >= 70) return 3;
  if (score >= 55) return 2;
  return 1;
}

export function scoreSimulation(input: SimScoringInput): SimScoringResult {
  const accuracy = clamp(1 - input.wrongMoves / Math.max(1, input.targetSteps), 0, 1);
  const efficiency = clamp(1 - (input.totalMoves - input.targetSteps) / Math.max(1, input.targetSteps), 0, 1);
  const timeScore = clamp(1 - Math.max(0, input.timeSec - input.expectedTimeSec) / Math.max(1, input.expectedTimeSec), 0, 1);
  const hintPenalty = Math.min(10, input.hintsUsed * 2.5);

  let score = 50 + accuracy * 25 + efficiency * 15 + timeScore * 10 - hintPenalty;
  if (!input.success) score = Math.max(20, score * 0.4);
  score = Math.round(score);

  return { score, accuracy, efficiency, timeScore, hintPenalty, grade: gradeOf(score), stars: starsOf(score) };
}