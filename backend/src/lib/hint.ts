// Adaptive hint engine: 4 level escalation. Level ditentukan per langkah/node.
export const HINT_MAX_LEVEL = 4;

export interface HintContext {
  nodeText: string;
  attemptsAtNode: number; // berapa kali gagal/salah di node ini
  hintsRequested: number; // berapa kali hint diminta di node ini (inkremental)
  caseTitle: string;
}

const S = (s: string) => ({ reply: s });

const T: Record<number, string> = {
  0: "",
  1: "Coba pikirkan: gejala seperti ini, bagian mana yang paling mungkin bermasalah? Sebutkan hipotesismu dulu — baru pilih langkah.",
  2: "Konsep relevan: urutan kerja sistem dimulai dari sumber daya paling dasar (fisik/listrik) menuju lapis lebih tinggi (software/konfigurasi). Cocokkan dengan gejala pada kasus ini.",
  3: "Petunjuk spesifik: bunyi, indikator LED, atau kode beep pada kasus ini memberi petunjuk besar. Periksa komponen yang datanya sudah tertera di deskripsi kasus.",
  4: "Solusi langkah-per-langkah: berikut penjelasannya supaya kamu tahu alurnya untuk kasus serupa di masa depan.",
};

export function hintLevelToUse(ctx: HintContext): number {
  if (ctx.hintsRequested >= 2) return 4;
  if (ctx.attemptsAtNode >= 3 || (ctx.hintsRequested >= 1 && ctx.attemptsAtNode >= 2)) return 3;
  if (ctx.attemptsAtNode >= 1 || ctx.hintsRequested >= 1) return 2;
  return 1;
}

export function buildHintText(ctx: HintContext): { level: number; text: string } {
  const level = hintLevelToUse(ctx);
  return { level, text: T[level] };
}

export { S };