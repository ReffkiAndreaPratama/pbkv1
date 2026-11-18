import { describe, it, expect } from "vitest";
import { buildHintText, buildSimulationHint, hintLevelToUse, HINT_MAX_LEVEL } from "../backend/src/lib/hint";

const base = { nodeText: "Periksa kabel power", attemptsAtNode: 0, hintsRequested: 0, caseTitle: "PC tidak menyala" };

describe("hintLevelToUse / buildHintText", () => {
  it("belum ada usaha → level 1 (pemancing)", () => {
    expect(hintLevelToUse(base)).toBe(1);
    const r = buildHintText(base);
    expect(r.level).toBe(1);
    expect(r.text.length).toBeGreaterThan(0);
  });

  it("sudah 2+ hint → level 4 (jawaban penuh)", () => {
    expect(hintLevelToUse({ ...base, hintsRequested: 2 })).toBe(4);
    expect(buildHintText({ ...base, hintsRequested: 2 }).level).toBe(4);
  });

  it("3+ percobaan di node → level 3", () => {
    expect(hintLevelToUse({ ...base, attemptsAtNode: 3 })).toBe(3);
  });

  it("1+ percobaan dan 1+ hint → level 3", () => {
    expect(hintLevelToUse({ ...base, attemptsAtNode: 2, hintsRequested: 1 })).toBe(3);
  });

  it("1 percobaan (tanpa hint) → level 2", () => {
    expect(hintLevelToUse({ ...base, attemptsAtNode: 1 })).toBe(2);
  });

  it("tidak pernah melebihi HINT_MAX_LEVEL", () => {
    const r = buildHintText({ ...base, hintsRequested: 99, attemptsAtNode: 99 });
    expect(r.level).toBeLessThanOrEqual(HINT_MAX_LEVEL);
    expect(HINT_MAX_LEVEL).toBe(4);
  });
});

describe("buildSimulationHint (hint sadar-kasus)", () => {
  const sim = {
    caseTitle: "Komputer Mati Total",
    nodeType: "DIAGNOSTIC",
    nodeText: "Periksa steker AC ke PSU dan pastikan semua rapat.",
    nodeDetail: "Kabel daya longgar adalah penyebab paling umum PC mati total.",
    options: [
      { label: "Ada steker longgar ditemukan", isCorrect: true, feedbackText: "Ini tersangka utama." },
      { label: "Semua sudah rapat", isCorrect: true, feedbackText: "Lanjutkan ke pengujian stopkontak." },
      { label: "Langsung ganti motherboard", isCorrect: false },
    ],
    attemptsAtNode: 0,
    hintsRequested: 0,
  };

  it("level 1 menyebut konteks kasus tanpa membocorkan jawaban", () => {
    const r = buildSimulationHint(sim);
    expect(r.level).toBe(1);
    expect(r.text).toContain("Komputer Mati Total");
    expect(r.text).not.toContain("Ada steker longgar ditemukan");
  });

  it("level 2 memakai detail node sebagai petunjuk konteks", () => {
    const r = buildSimulationHint({ ...sim, attemptsAtNode: 1 });
    expect(r.level).toBe(2);
    expect(r.text).toContain("Kabel daya longgar");
  });

  it("level 3 mencoret opsi berisiko dan tidak menyebut jawaban benar", () => {
    const r = buildSimulationHint({ ...sim, attemptsAtNode: 3 });
    expect(r.level).toBe(3);
    expect(r.text).toContain("Langsung ganti motherboard");
    expect(r.text).not.toContain("Ada steker longgar ditemukan");
  });

  it("level 3 melewati opsi berisiko yang sedang terkunci", () => {
    const r = buildSimulationHint({
      ...sim,
      attemptsAtNode: 3,
      options: sim.options.map((o) => (o.isCorrect ? o : { ...o, available: false })),
    });
    expect(r.level).toBe(3);
    expect(r.text).not.toContain("Langsung ganti motherboard");
    expect(r.text).toContain("tidak invasif");
  });

  it("level 4 menampilkan jawaban benar beserta alasannya", () => {
    const r = buildSimulationHint({ ...sim, hintsRequested: 2 });
    expect(r.level).toBe(4);
    expect(r.text).toContain("Ada steker longgar ditemukan");
    expect(r.text).toContain("Ini tersangka utama.");
  });

  it("eskalasi dibatasi satu level per permintaan", () => {
    const r = buildSimulationHint({ ...sim, hintsRequested: 2 }, 3);
    expect(r.level).toBe(3);
    expect(r.text).toContain("Coret opsi yang berisiko");
    expect(r.text).not.toContain("Jawaban untuk langkah ini");
  });
});