import { describe, it, expect } from "vitest";
import { respondToUser, type TutorRequest } from "../backend/src/lib/ai-tutor";

const runr = (message: string, extra: Partial<TutorRequest> = {}) => respondToUser({ message, ...extra });

describe("respondToUser — deteksi intent deterministik", () => {
  const samples: Array<[string, string]> = [
    ["jawabannya apa?", "cheat"],
    ["kasih tahu jawaban", "cheat"],
    ["langsung bilang solusinya", "cheat"],
    ["minta petunjuk dong", "hint"],
    ["kasih hint", "hint"],
    ["apa itu DHCP?", "concept"],
    ["kenapa komputernya mati?", "concept"],
    ["aku pikir ini masalah RAM", "symptom"],
    ["menurut saya power supply nya", "symptom"],
    ["halo apa kabar?", "casual"],
  ];

  it("message yang sama selalu menghasilkan intent yang sama", () => {
    for (const [msg, intent] of samples) {
      expect(runr(msg).intent).toBe(intent);
      expect(runr(msg).intent).toBe(intent);
    }
  });
});

describe("respondToUser — tidak pernah spoiler jawaban", () => {
  it("permintaan cheat diformat sebagai tolak-lembut + pemancingan, bukan jawaban", () => {
    const r = runr("jawabannya apa?");
    expect(r.intent).toBe("cheat");
    expect(r.reply.length).toBeGreaterThan(0);
    expect(r.reply.endsWith("?") || /coba|tidak\s+(bisa|langsung)|pemahamanmu/i.test(r.reply)).toBe(true);
    expect(/ganti\s+(PSU|RAM)|periksa\s*komponen\s+X|solusi.*\b(ganti|cek|pasang)\b/i.test(r.reply)).toBe(false);
  });

  it("hipotesis gejala tidak dikonfirmasi sebagai jawaban", () => {
    const r = runr("aku pikir ini masalah RAM", { skillName: "Hardware" });
    expect(r.intent).toBe("symptom");
    const forbidden = [/ganti RAM/i, /betul\s*(saja|kemungkinan)|ya,\s*itu\s*(benar|tepat)/i, /jawabannya/i];
    for (const re of forbidden) expect(re.test(r.reply)).toBe(false);
  });

  it("hint mengarahkan ke tombol petunjuk, tidak berisi jawaban node", () => {
    const r = runr("minta petunjuk");
    expect(r.intent).toBe("hint");
    expect(/tombol '💡 Petunjuk'|tombol petunjuk/i.test(r.reply)).toBe(true);
    expect(/periksa\s*komponen?\s+X|ganti\s*komponen|jawabannya/i.test(r.reply)).toBe(false);
  });
});

describe("respondToUser — konten konsep & fallback", () => {
  it("konsep DHCP menghasilkan penjelasan berisi DHCP", () => {
    const r = runr("apa itu DHCP?");
    expect(r.intent).toBe("concept");
    expect(/DHCP/i.test(r.reply)).toBe(true);
  });

  it("konsep yang dikenali tidak pernah berisi solusi kasus", () => {
    const r = runr("apa itu safe mode?");
    expect(r.intent).toBe("concept");
    expect(/jawabannya|mulai.*langkah.*1/i.test(r.reply)).toBe(false);
  });

  it("unknown → respons default yang membantu", () => {
    const r = runr("blablabla");
    expect(r.intent).toBe("unknown");
    expect(/tolong jelaskan/i.test(r.reply)).toBe(true);
  });
});