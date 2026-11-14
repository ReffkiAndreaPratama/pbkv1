import { describe, it, expect } from "vitest";
import { scoreRepair, repairGradeOf, repairStarsOf } from "../backend/src/lib/repair-scoring";

const base = {
  heartsLeft: 3,
  maxHearts: 3,
  actions: 5,
  correctActions: 4,
  wrongActions: 1,
  maxCombo: 4,
  timeSec: 30,
  timeLimitSec: 120,
  success: true,
};

describe("scoreRepair", () => {
  it("run sukses cepat dengan combo tinggi mendapat grade A/S dan 3 bintang", () => {
    const r = scoreRepair(base);
    expect(r.score).toBeGreaterThanOrEqual(88);
    expect(["A", "S"]).toContain(r.grade);
    expect(r.stars).toBe(3);
  });

  it("run gagal selalu 0 bintang dan skor rendah", () => {
    const r = scoreRepair({ ...base, success: false });
    expect(r.stars).toBe(0);
    expect(r.score).toBeLessThan(60);
  });

  it("combo bonus di-cap 15", () => {
    const r = scoreRepair({ ...base, maxCombo: 20 });
    expect(r.comboBonus).toBe(15);
  });

  it("kehilangan nyawa menurunkan bonus nyawa", () => {
    const full = scoreRepair(base);
    const hurt = scoreRepair({ ...base, heartsLeft: 1 });
    expect(hurt.heartBonus).toBeLessThan(full.heartBonus);
    expect(hurt.score).toBeLessThan(full.score);
  });

  it("waktu lebih lama menurunkan skor (input lain sama)", () => {
    const fast = scoreRepair(base);
    const slow = scoreRepair({ ...base, timeSec: 110 });
    expect(slow.speed).toBeLessThan(fast.speed);
    expect(slow.score).toBeLessThan(fast.score);
  });
});

describe("repairGradeOf / repairStarsOf", () => {
  it("memetakan grade sesuai ambang skor", () => {
    expect(repairGradeOf(96)).toBe("S");
    expect(repairGradeOf(86)).toBe("A");
    expect(repairGradeOf(76)).toBe("B");
    expect(repairGradeOf(66)).toBe("C");
    expect(repairGradeOf(50)).toBe("D");
  });

  it("bintang hanya diberikan saat sukses", () => {
    expect(repairStarsOf(100, false)).toBe(0);
    expect(repairStarsOf(90, true)).toBe(3);
    expect(repairStarsOf(75, true)).toBe(2);
    expect(repairStarsOf(60, true)).toBe(1);
  });
});
