import type { Difficulty } from "@prisma/client";

export type NextCaseCandidate = {
  id: string;
  title: string;
  difficulty: Difficulty;
  targetSteps: number;
  order: number;
  locked: boolean;
};

export type NextCasePick = NextCaseCandidate & { reason: string };

const DIFFICULTY_RANK: Record<Difficulty, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

/**
 * Pilih kasus lanjutan di skill yang sama setelah sebuah misi selesai.
 *
 * Urutan prioritas:
 * 1. kasus yang belum terkunci,
 * 2. satu tingkat lebih sulit → tingkat sama → lebih mudah,
 * 3. urutan kurikulum (order terkecil lebih dulu).
 *
 * `escalate: false` dipakai setelah misi gagal: setingkat → lebih mudah →
 * lebih sulit, agar siswa memperkuat dasar sebelum naik level.
 */
export function pickNextCase(
  current: { id: string; difficulty: Difficulty },
  candidates: NextCaseCandidate[],
  options: { escalate?: boolean } = {}
): NextCasePick | null {
  const escalate = options.escalate ?? true;
  const pool = candidates.filter((c) => c.id !== current.id);
  if (pool.length === 0) return null;

  const currentRank = DIFFICULTY_RANK[current.difficulty];
  const ranked = pool
    .map((candidate) => {
      const delta = DIFFICULTY_RANK[candidate.difficulty] - currentRank;
      const stepScore = escalate
        ? delta === 1
          ? 0
          : delta === 0
            ? 1
            : delta === -1
              ? 2
              : 3 + Math.abs(delta)
        : delta === 0
          ? 0
          : delta === -1
            ? 1
            : delta === 1
              ? 2
              : 3 + Math.abs(delta);
      return { candidate, stepScore };
    })
    .sort((a, b) => {
      if (a.candidate.locked !== b.candidate.locked) return a.candidate.locked ? 1 : -1;
      if (a.stepScore !== b.stepScore) return a.stepScore - b.stepScore;
      return a.candidate.order - b.candidate.order;
    });

  const pick = ranked[0].candidate;
  const delta = DIFFICULTY_RANK[pick.difficulty] - currentRank;
  const reason = escalate
    ? delta > 0
      ? "Naik satu tingkat: uji kemampuanmu di kasus yang lebih menantang."
      : delta === 0
        ? "Latihan penguatan: kasus lain dengan tingkat kesulitan yang sama."
        : "Pemanasan ulang: kuasai dulu kasus yang lebih sederhana."
    : delta === 0
      ? "Ulangi pola serupa di kasus setingkat sebelum menaikkan level."
      : delta < 0
        ? "Pemanasan ulang: kuasai dulu kasus yang lebih sederhana."
        : "Setelah materi dipelajari, coba tantangan yang lebih tinggi.";

  return { ...pick, reason };
}
