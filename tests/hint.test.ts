import { describe, it, expect } from "vitest";
import { buildHintText, hintLevelToUse, HINT_MAX_LEVEL } from "../backend/src/lib/hint";

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