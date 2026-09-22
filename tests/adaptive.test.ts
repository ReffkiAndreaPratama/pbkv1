import { describe, it, expect } from "vitest";
import {
  clamp,
  tierOf,
  updateMasteryFromQuiz,
  updateMasteryFromSimulation,
  xpForLevel,
  levelFromXp,
  caseRecommendationScore,
  allowedDifficulty,
} from "../backend/src/lib/adaptive";

describe("clamp / tierOf", () => {
  it("clamp membatasi nilai pada range", () => {
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it("tierOf mengikuti ambang mastery", () => {
    expect(tierOf(0)).toBe("NOVICE");
    expect(tierOf(0.2)).toBe("NOVICE");
    expect(tierOf(0.4)).toBe("DEVELOPING");
    expect(tierOf(0.74)).toBe("DEVELOPING");
    expect(tierOf(0.75)).toBe("PROFICIENT");
    expect(tierOf(1)).toBe("PROFICIENT");
  });
});

describe("updateMasteryFromQuiz", () => {
  it("jawaban benar menaikkan mastery; salah menurunkan", () => {
    const up = updateMasteryFromQuiz(0.4, true, false, "MEDIUM");
    const down = updateMasteryFromQuiz(0.4, false, false, "MEDIUM");
    expect(up).toBeGreaterThan(0.4);
    expect(down).toBeLessThan(0.4);
  });

  it("memakai hint mengurangi gain (dengan input sama)", () => {
    const noHint = updateMasteryFromQuiz(0.4, true, false, "EASY");
    const withHint = updateMasteryFromQuiz(0.4, true, true, "EASY");
    expect(withHint).toBeLessThan(noHint);
  });

  it("hasil selalu di antara 0 dan 1", () => {
    for (const correct of [true, false]) {
      for (const d of ["EASY", "MEDIUM", "HARD"] as const) {
        const v = updateMasteryFromQuiz(0.9, correct, false, d);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("updateMasteryFromSimulation", () => {
  it("sukses & akurasi bagus memberi gain besar; gagal menurunkan", () => {
    const ok = updateMasteryFromSimulation(0.4, true, 0.9);
    const okLowAcc = updateMasteryFromSimulation(0.4, true, 0.5);
    const fail = updateMasteryFromSimulation(0.4, false, 0.5);
    expect(ok).toBeGreaterThan(okLowAcc);
    expect(okLowAcc).toBeGreaterThan(0.4);
    expect(fail).toBeLessThan(0.4);
  });

  it("mastery tidak pernah negatif atau melebihi 1", () => {
    expect(updateMasteryFromSimulation(0.05, false, 0.5)).toBeGreaterThanOrEqual(0);
    expect(updateMasteryFromSimulation(1, true, 1)).toBeLessThanOrEqual(1);
  });
});

describe("xpForLevel / levelFromXp (konsistensi gamification)", () => {
  it("level round-trip: level dari XP yang dibutuhkan kembali ke level semula", () => {
    for (let lvl = 1; lvl <= 30; lvl++) {
      const xp = xpForLevel(lvl);
      expect(levelFromXp(xp)).toBe(lvl);
    }
  });

  it("level monotonik naik terhadap XP (tidak pernah turun)", () => {
    let prev = 1;
    for (let xp = 0; xp <= 200_000; xp += 5000) {
      const lvl = levelFromXp(xp);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });

  it("total XP akumulatif untuk level n sesuai rumus", () => {
    const L4 = xpForLevel(4); // 200 + 250 + 300
    expect(L4).toBe(750);
    expect(xpForLevel(1)).toBe(0);
  });

  it("leaderboard tetap konsisten: level lebih tinggi → setidaknya XP level tsb dibutuhkan", () => {
    for (let xp = 0; xp <= 50_000; xp += 1111) {
      const lvl = levelFromXp(xp);
      expect(xp).toBeGreaterThanOrEqual(xpForLevel(lvl));
      if (xp > 0) expect(xp).toBeLessThan(xpForLevel(lvl + 1));
    }
  });
});

describe("allowedDifficulty / caseRecommendationScore", () => {
  it("allowedDifficulty mengikuti mastery", () => {
    expect(allowedDifficulty(0.2)).toBe("EASY");
    expect(allowedDifficulty(0.5)).toBe("MEDIUM");
    expect(allowedDifficulty(0.8)).toBe("HARD");
  });

  it("gap mastery lebih besar → skor rekomendasi lebih tinggi", () => {
    const weak = caseRecommendationScore(0.2, "MEDIUM", 0, 3);
    const strong = caseRecommendationScore(0.9, "MEDIUM", 0, 3);
    expect(weak).toBeGreaterThan(strong);
  });

  it("skill prioritas lebih tinggi → skor rekomendasi lebih tinggi", () => {
    const low = caseRecommendationScore(0.5, "MEDIUM", 0, 1);
    const high = caseRecommendationScore(0.5, "MEDIUM", 0, 5);
    expect(high).toBeGreaterThan(low);
  });

  it("kasus HARD hanya diunggulkan setelah mastery cukup (>=0.75)", () => {
    const atLow = caseRecommendationScore(0.5, "HARD", 0, 3);
    const mediumAtLow = caseRecommendationScore(0.5, "MEDIUM", 0, 3);
    const atHigh = caseRecommendationScore(0.85, "HARD", 0, 3);
    const mediumAtHigh = caseRecommendationScore(0.85, "MEDIUM", 0, 3);
    expect(atLow).toBeLessThan(mediumAtLow);
    expect(atHigh).toBeGreaterThan(mediumAtHigh);
  });
});