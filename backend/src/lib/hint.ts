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

// --- Hint simulator berbasis data kasus -------------------------------------
// Hint tidak lagi generik: level 1-4 memakai teks node, opsi, dan feedback
// yang tersimpan di kasus, sehingga petunjuk benar-benar relevan.

export interface SimHintOption {
  label: string;
  isCorrect: boolean;
  feedbackText?: string | null;
  available?: boolean;
}

export interface SimHintContext {
  caseTitle: string;
  nodeType: string;
  nodeText: string;
  nodeDetail?: string | null;
  options: SimHintOption[];
  attemptsAtNode: number;
  hintsRequested: number;
}

const STAGE: Record<string, string> = {
  START: "membaca gejala awal",
  DIAGNOSTIC: "mengumpulkan bukti diagnosis",
  ACTION: "melakukan tindakan perbaikan",
  SOLUTION: "mengunci solusi",
  FAIL: "meninjau langkah yang gagal",
};

export function buildSimulationHint(ctx: SimHintContext, maxLevel: number = HINT_MAX_LEVEL): { level: number; text: string } {
  const level = Math.min(
    hintLevelToUse({
      nodeText: ctx.nodeText,
      attemptsAtNode: ctx.attemptsAtNode,
      hintsRequested: ctx.hintsRequested,
      caseTitle: ctx.caseTitle,
    }),
    maxLevel
  );

  const correct = ctx.options.filter((o) => o.isCorrect && o.available !== false);
  const wrong = ctx.options.filter((o) => !o.isCorrect && o.available !== false);

  if (level === 1) {
    return {
      level,
      text: `Kamu sedang ${STAGE[ctx.nodeType] ?? "menangani kasus"} pada "${ctx.caseTitle}". Baca ulang gejalanya, lalu tanyakan: bukti apa yang paling murah untuk mempersempit penyebab?`,
    };
  }

  if (level === 2) {
    const clue = (ctx.nodeDetail ?? "").trim();
    return {
      level,
      text: clue
        ? `Petunjuk konteks: ${clue}`
        : "Fokus pada langkah yang paling dekat dengan sumber masalah. Opsi yang langsung melompat ke penggantian komponen biasanya bukan langkah diagnosis yang tepat.",
    };
  }

  if (level === 3) {
    if (wrong.length > 0) {
      return {
        level,
        text: `Coret opsi yang berisiko: ${wrong.map((o) => `"${o.label}"`).join(", ")}. Opsi itu tidak didukung bukti pada langkah ini. Sisanya mengarah ke pemeriksaan yang lebih masuk akal.`,
      };
    }
    return {
      level,
      text: "Semua opsi yang tersedia terlihat masuk akal. Pilih langkah yang paling tidak invasif dan paling mudah diverifikasi lebih dulu.",
    };
  }

  const answer = correct.length > 0
    ? correct.map((o) => `"${o.label}"`).join(" atau ")
    : "langkah yang paling dekat dengan sumber masalah";
  const why = correct.find((o) => o.feedbackText)?.feedbackText;
  return {
    level,
    text: `Jawaban untuk langkah ini: ${answer}.${why ? ` Alasan: ${why}` : ""}`,
  };
}

export { S };