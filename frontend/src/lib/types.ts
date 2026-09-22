// Shared domain types for the TechTutor frontend.

export type Role = "USER" | "ADMIN";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type Tier = "NOVICE" | "DEVELOPING" | "PROFICIENT";
export type LearningStyle = "VISUAL" | "TEKS" | "PRAKTIK";
export type TargetLevel = "DASAR" | "MENENGAH" | "MAHIR";
export type QuizType = "PRETEST" | "POSTTEST" | "ADAPTIVE";
export type SimStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type NodeType = "START" | "DIAGNOSIS" | "ACTION" | "SOLUTION" | "FAIL";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface LearningProfile {
  id?: string;
  userId?: string;
  learningStyle?: LearningStyle | null;
  targetLevel?: TargetLevel | null;
  waktuPerSesiMin?: number | null;
  skillPriority?: string[];
  pretestDone: boolean;
  posttestDone: boolean;
  posttestScore: number | null;
  totalXp: number;
  level: number;
  streakDays: number;
  lastActiveDate?: string | null;
}

export interface MasteryRow {
  skillId: string;
  code: string;
  name: string;
  mastery: number;
  attempts: number;
  successes: number;
  tier: Tier;
}

export interface CaseListItem {
  id: string;
  title: string;
  difficulty: Difficulty;
  skill: { code: string; name: string };
  targetSteps: number;
  locked: boolean;
  tries: number;
  urgency: number;
  tier: Tier;
}

export interface CaseOption {
  optionId: string;
  label: string;
  targetNodeKey: string | null;
  isCorrect: boolean;
  condition: { signal?: string; equals?: string | boolean | number } | null;
  effect: { setSignal?: Record<string, string | boolean | number>; forceFail?: boolean } | null;
  feedbackText: string | null;
}

export interface CaseNode {
  nodeKey: string;
  type: NodeType;
  text: string;
  detail: string | null;
  isOnBestPath?: boolean;
  options?: CaseOption[];
}

export interface CaseDetail {
  id: string;
  title: string;
  scenario: string;
  difficulty: Difficulty;
  skill: { code: string; name: string };
  targetSteps: number;
  expectedTimeSec: number;
  nodes: CaseNode[];
}

export interface SimNode {
  nodeKey: string;
  type: NodeType;
  text: string;
  detail: string | null;
  options?: CaseOption[];
}

export interface SimResult {
  score: number;
  accuracy: number;
  efficiency: number;
  timeScore: number;
  hintPenalty: number;
  grade: string;
  stars: number;
}

export interface SimSubmitResponse {
  terminal: boolean;
  success?: boolean;
  feedbackText: string | null;
  score?: SimResult;
  xpGained?: number;
  nextNode?: SimNode | null;
  signalState?: Record<string, string | boolean | number>;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: { key: string; text: string }[];
  difficulty: Difficulty;
}

export interface QuizOption {
  key: string;
  text: string;
}

export interface Material {
  id: string;
  skillId: string;
  title: string;
  summary: string;
  content: string;
  order: number;
  isActive: boolean;
  completed: boolean;
  readAt?: string | null;
  skill: { id: string; code: string; name: string };
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface LeaderboardRow {
  rank: number;
  user: { id: string; name: string; email: string };
  totalXp: number;
  level: number;
  streakDays: number;
}

export interface PathItem {
  type: "MATERIAL" | "CASE" | "QUIZ" | "POSTTEST";
  refId: string;
  skillId: string;
  skillCode: string;
  reason: string;
  urgency: number;
}

export interface ActivityLog {
  id: string;
  type: string;
  refId: string | null;
  meta: any;
  points: number;
  createdAt: string;
}

export interface QuizSessionRow {
  id: string;
  type: QuizType;
  score: number | null;
  correctCount: number;
  totalCount: number;
  startedAt: string;
  completedAt: string | null;
}

export interface SimHistoryRow {
  id: string;
  caseTitle: string;
  skill: { code: string; name: string };
  difficulty: Difficulty;
  score: number | null;
  accuracy: number | null;
  success: boolean | null;
  status: SimStatus;
  timeSec: number;
  hintsUsed: number;
  startedAt: string;
}

export interface SummaryData {
  profile: LearningProfile;
  totalCases: number;
  successCases: number;
  avgScore: number;
  materialReads: number;
  achievementCount: number;
  avgMastery: number;
  recentQuizzes: QuizSessionRow[];
  masteryBySkill: { code: string; name: string; mastery: number; tier: Tier }[];
}