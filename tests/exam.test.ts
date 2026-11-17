import { describe, it, expect } from "vitest";
import {
  EXAM_CONFIG,
  examDeadline,
  examRemainingSec,
  hashSeed,
  pickExamQuestions,
  scoreExam,
  seededShuffle,
  type ExamQuestionLike,
} from "../backend/src/lib/exam";

function pool(count: number, difficulty: string, prefix: string): ExamQuestionLike[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${difficulty}-${i}`,
    difficulty,
  }));
}

// Pool realistis: cukup soal untuk semua tingkat kesulitan.
const FULL_POOL: ExamQuestionLike[] = [
  ...pool(14, "EASY", "q"),
  ...pool(33, "MEDIUM", "q"),
  ...pool(7, "HARD", "q"),
];

describe("konfigurasi ujian", () => {
  it("memakai 15 soal, 20 menit, KKM 70, dan 5 percobaan", () => {
    expect(EXAM_CONFIG.questionCount).toBe(15);
    expect(EXAM_CONFIG.durationSec).toBe(20 * 60);
    expect(EXAM_CONFIG.passScore).toBe(70);
    expect(EXAM_CONFIG.maxAttempts).toBe(5);
  });

  it("distribusi kesulitan berjumlah tepat sebanyak soal ujian", () => {
    const sum = Object.values(EXAM_CONFIG.distribution).reduce((a, b) => a + b, 0);
    expect(sum).toBe(EXAM_CONFIG.questionCount);
  });
});

describe("hashSeed / seededShuffle", () => {
  it("hashSeed deterministik dan berbeda antar string", () => {
    expect(hashSeed("sesi-a")).toBe(hashSeed("sesi-a"));
    expect(hashSeed("sesi-a")).not.toBe(hashSeed("sesi-b"));
  });

  it("seededShuffle stabil untuk seed yang sama", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    expect(seededShuffle(items, 12345)).toEqual(seededShuffle(items, 12345));
  });

  it("seededShuffle tidak menghilangkan atau menggandakan item", () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const shuffled = seededShuffle(items, 777);
    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });
});

describe("pickExamQuestions", () => {
  it("mengambil tepat 15 soal unik dari pool besar", () => {
    const picked = pickExamQuestions(FULL_POOL, hashSeed("sesi-1"));
    expect(picked).toHaveLength(15);
    expect(new Set(picked.map((q) => q.id)).size).toBe(15);
  });

  it("menjaga distribusi 5 mudah, 6 sedang, 4 sulit", () => {
    const picked = pickExamQuestions(FULL_POOL, hashSeed("sesi-2"));
    const byDifficulty = picked.reduce<Record<string, number>>((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1;
      return acc;
    }, {});
    expect(byDifficulty.EASY).toBe(5);
    expect(byDifficulty.MEDIUM).toBe(6);
    expect(byDifficulty.HARD).toBe(4);
  });

  it("deterministik untuk sesi yang sama", () => {
    const seed = hashSeed("sesi-tetap");
    const a = pickExamQuestions(FULL_POOL, seed).map((q) => q.id);
    const b = pickExamQuestions(FULL_POOL, seed).map((q) => q.id);
    expect(a).toEqual(b);
  });

  it("menghasilkan set berbeda untuk sesi berbeda", () => {
    const a = pickExamQuestions(FULL_POOL, hashSeed("sesi-a")).map((q) => q.id);
    const b = pickExamQuestions(FULL_POOL, hashSeed("sesi-b")).map((q) => q.id);
    expect(a).not.toEqual(b);
  });

  it("tetap 15 soal walau salah satu tingkat kesulitan kurang", () => {
    const scarce: ExamQuestionLike[] = [
      ...pool(10, "EASY", "q"),
      ...pool(10, "MEDIUM", "q"),
      ...pool(1, "HARD", "q"),
    ];
    const picked = pickExamQuestions(scarce, hashSeed("sesi-langka"));
    expect(picked).toHaveLength(15);
    expect(new Set(picked.map((q) => q.id)).size).toBe(15);
    expect(picked.filter((q) => q.difficulty === "HARD")).toHaveLength(1);
  });

  it("tidak pernah memilih soal yang sama dua kali", () => {
    const picked = pickExamQuestions(FULL_POOL, hashSeed("sesi-duplikat"));
    const ids = picked.map((q) => q.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("membatasi jumlah soal bila pool lebih kecil dari 15", () => {
    const small = pool(6, "EASY", "q");
    expect(pickExamQuestions(small, 1)).toHaveLength(6);
  });
});

describe("timer ujian", () => {
  const started = new Date("2026-01-01T10:00:00.000Z");

  it("deadline tepat 20 menit setelah mulai", () => {
    expect(examDeadline(started).toISOString()).toBe("2026-01-01T10:20:00.000Z");
  });

  it("sisa waktu penuh di awal ujian", () => {
    expect(examRemainingSec(started, started.getTime())).toBe(EXAM_CONFIG.durationSec);
  });

  it("sisa waktu berkurang seiring waktu berjalan", () => {
    expect(examRemainingSec(started, started.getTime() + 60_000)).toBe(EXAM_CONFIG.durationSec - 60);
  });

  it("tidak pernah negatif setelah deadline", () => {
    expect(examRemainingSec(started, started.getTime() + 3_600_000)).toBe(0);
  });
});

describe("scoreExam", () => {
  it("menghitung skor persentase dari jumlah benar", () => {
    expect(scoreExam(12, 15).score).toBe(80);
    expect(scoreExam(15, 15).score).toBe(100);
    expect(scoreExam(0, 15).score).toBe(0);
  });

  it("lulus tepat di KKM 70", () => {
    const result = scoreExam(70, 100);
    expect(result.score).toBe(70);
    expect(result.passed).toBe(true);
    expect(result.passScore).toBe(70);
  });

  it("gagal di bawah KKM", () => {
    expect(scoreExam(69, 100).passed).toBe(false);
  });

  it("aman saat totalCount nol", () => {
    const result = scoreExam(0, 0);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });
});
