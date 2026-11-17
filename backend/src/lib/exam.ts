// Mesin ujian akhir.
// Semua logika murni di sini supaya bisa diuji tanpa database.

export const EXAM_CONFIG = {
  /** Jumlah soal yang harus dijawab. */
  questionCount: 15,
  /** Durasi ujian dalam detik (20 menit). */
  durationSec: 20 * 60,
  /** Nilai minimal kelulusan. */
  passScore: 70,
  /** Batas percobaan ujian. */
  maxAttempts: 5,
  /** Toleransi keterlambatan kirim (detik) sebelum dianggap lewat waktu. */
  graceSec: 20,
  /** Distribusi kesulitan soal. */
  distribution: { EASY: 5, MEDIUM: 6, HARD: 4 } as Record<string, number>,
} as const;

export type ExamDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface ExamQuestionLike {
  id: string;
  difficulty: string;
}

/** Hash string sederhana (FNV-1a) untuk seed deterministik per sesi. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** PRNG kecil yang deterministik. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates dengan seed agar urutan soal stabil untuk satu sesi. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const random = mulberry32(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Pilih soal ujian: distribusi kesulitan dijaga, lalu diisi dari sisa soal
 * bila salah satu tingkat tidak cukup. Hasil selalu unik dan deterministik
 * terhadap `seed` (dipakai: id sesi).
 */
export function pickExamQuestions<T extends ExamQuestionLike>(
  questions: readonly T[],
  seed: number
): T[] {
  const picked: T[] = [];
  const used = new Set<string>();

  for (const [difficulty, count] of Object.entries(EXAM_CONFIG.distribution)) {
    const pool = questions.filter((q) => q.difficulty === difficulty && !used.has(q.id));
    const take = seededShuffle(pool, seed + hashSeed(difficulty)).slice(0, count);
    for (const q of take) {
      picked.push(q);
      used.add(q.id);
    }
  }

  if (picked.length < EXAM_CONFIG.questionCount) {
    const rest = seededShuffle(
      questions.filter((q) => !used.has(q.id)),
      seed + 0x9e3779b9
    );
    picked.push(...rest.slice(0, EXAM_CONFIG.questionCount - picked.length));
  }

  return seededShuffle(picked, seed + 0x85ebca6b).slice(0, EXAM_CONFIG.questionCount);
}

export function examDeadline(startedAt: Date): Date {
  return new Date(startedAt.getTime() + EXAM_CONFIG.durationSec * 1000);
}

export function examRemainingSec(startedAt: Date, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((examDeadline(startedAt).getTime() - now) / 1000));
}

export function scoreExam(correctCount: number, totalCount: number) {
  const total = Math.max(1, totalCount);
  const score = Math.round((Math.max(0, correctCount) / total) * 100);
  return {
    score,
    passed: score >= EXAM_CONFIG.passScore,
    passScore: EXAM_CONFIG.passScore,
  };
}
