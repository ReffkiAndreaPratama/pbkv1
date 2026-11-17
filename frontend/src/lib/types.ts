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
  /** Hanya tersedia pada data pratinjau/admin, tidak dikirim saat bermain. */
  isCorrect?: boolean;
  condition?: { signal?: string; equals?: string | boolean | number } | null;
  effect?: { setSignal?: Record<string, string | boolean | number>; forceFail?: boolean } | null;
  feedbackText?: string | null;
  /** Dihitung server dari sinyal saat ini; opsi tidak tersedia tetap ditampilkan terkunci. */
  available?: boolean;
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

export interface SimDebriefStep {
  step: number;
  nodeKey: string;
  nodeText: string;
  nodeType: NodeType;
  optionLabel: string;
  wasCorrect: boolean;
  hintLevel: number;
  at: string;
}

export interface SimDebrief {
  caseTitle: string;
  skill: { code: string; name: string };
  status: string;
  success: boolean | null;
  score: number | null;
  accuracy: number | null;
  timeSec: number | null;
  hintsUsed: number;
  signalState: Record<string, string | boolean | number>;
  timeline: SimDebriefStep[];
}

export interface SimSubmitResponse {
  terminal: boolean;
  success?: boolean;
  wasCorrect?: boolean;
  feedbackText: string | null;
  score?: SimResult;
  xpGained?: number;
  nextNode?: SimNode | null;
  signalState?: Record<string, string | boolean | number>;
  debrief?: SimDebriefStep[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: { key: string; text: string }[];
  difficulty: Difficulty;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export interface QuizReviewItem {
  prompt: string;
  options: { key: string; text: string }[];
  selectedKeys: string[];
  correctKeys: string[];
  isCorrect: boolean;
  explanation: string;
}

export interface SubmitRes {
  score: number;
  correctCount: number;
  totalCount: number;
  passed?: boolean;
  review?: QuizReviewItem[];
}

// --- Latihan (practice) ---
export interface PracticeAnswerRes {
  isCorrect: boolean;
  correctKeys: string[];
  explanation: string;
  difficulty: Difficulty;
}

export interface PracticeResult {
  score: number;
  correctCount: number;
  totalCount: number;
  review: QuizReviewItem[];
}

// --- Ujian (exam) ---
export interface ExamSkillRow {
  code: string;
  name: string;
  total: number;
  correct: number;
}

export interface ExamResult {
  sessionId: string;
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  passScore: number;
  timedOut: boolean;
  perSkill: ExamSkillRow[];
  review: QuizReviewItem[];
}

export interface ExamSavedAnswer {
  questionId: string;
  selectedKeys: string[];
}

export interface ExamInfo {
  attemptsUsed: number;
  maxAttempts: number;
  remainingAttempts: number;
  passScore: number;
  durationSec: number;
  questionCount: number;
  bestScore: number | null;
  activeSessionId: string | null;
  activeRemainingSec: number;
}

export interface ExamStateRes {
  completed: boolean;
  sessionId?: string;
  startedAt?: string;
  deadlineAt?: string;
  durationSec?: number;
  passScore?: number;
  maxAttempts?: number;
  questionCount?: number;
  remainingSec?: number;
  questions?: QuizQuestion[];
  savedAnswers?: ExamSavedAnswer[];
  attemptsUsed?: number;
  result?: ExamResult;
}

export interface QuizOption {
  key: string;
  text: string;
}

export interface MaterialLink {
  title: string;
  url: string;
}

export interface Material {
  id: string;
  skillId: string;
  title: string;
  summary: string;
  content: string;
  order: number;
  isActive: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  links?: MaterialLink[] | null;
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

// ---------------------------------------------------------------- Bengkel PC
export type RepairTool = "VISUAL" | "MULTIMETER" | "POST_CARD" | "SOFTWARE";
export type RepairFixType = "REPLACE" | "RESEAT" | "CLEAN" | "RECONNECT";
export type RepairStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type RepairDeviceType = "PC" | "LAPTOP";

export interface RepairJobListItem {
  id: string;
  title: string;
  symptom: string;
  deviceType: RepairDeviceType;
  difficulty: Difficulty;
  timeLimitSec: number;
  maxHearts: number;
  skill: { code: string; name: string };
  bestScore: number | null;
  attempts: number;
  successCount: number;
}

export interface RepairComponentState {
  key: string;
  name: string;
  category: string;
  slot: string;
  replacementName: string | null;
  fixed: boolean;
  inspected: boolean;
  clue: string | null;
  testedTools: string[];
  readings: Record<string, string>;
}

export interface RepairAttemptState {
  id: string;
  status: RepairStatus;
  elapsedSec: number;
  timeLeftSec: number;
  job: {
    id: string;
    title: string;
    scenario: string;
    symptom: string;
    deviceType: RepairDeviceType;
    difficulty: Difficulty;
    timeLimitSec: number;
    maxHearts: number;
    skill: { code: string; name: string };
  };
  hearts: number;
  combo: number;
  maxCombo: number;
  actions: number;
  correctActions: number;
  wrongActions: number;
  faultsTotal: number;
  faultsFixed: number;
  components: RepairComponentState[];
}

export interface RepairEvent {
  kind: string;
  ok: boolean;
  title: string;
  message: string;
  componentKey?: string;
  reading?: string;
  heartsLost?: number;
}

export interface RepairResult {
  score: number;
  accuracy: number;
  speed: number;
  comboBonus: number;
  heartBonus: number;
  grade: string;
  stars: number;
  success: boolean;
  xpGained: number;
  timeSec: number;
}

export interface RepairHistoryItem {
  id: string;
  jobId: string;
  jobTitle: string;
  deviceType: RepairDeviceType;
  skill: { code: string; name: string };
  difficulty: Difficulty;
  score: number;
  success: boolean;
  grade: string;
  stars: number;
  hearts: number;
  maxHearts: number;
  wrongActions: number;
  timeSec: number;
  completedAt: string | null;
}

export interface RepairActionResponse {
  event: RepairEvent;
  state: RepairAttemptState;
  result?: RepairResult;
}

export interface SummaryData {
  profile: LearningProfile;
  totalCases: number;
  successCases: number;
  avgScore: number;
  materialReads: number;
  achievementCount: number;
  avgMastery: number;
  repairAttempts: number;
  repairSuccess: number;
  repairAvgScore: number;
  repairBestScore: number;
  recentQuizzes: QuizSessionRow[];
  masteryBySkill: { code: string; name: string; mastery: number; tier: Tier }[];
}