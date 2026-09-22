import { describe, it, expect } from "vitest";
import { scoreSimulation, gradeOf, starsOf } from "../backend/src/lib/scoring";

const base = { targetSteps: 6, totalMoves: 6, wrongMoves: 0, hintsUsed: 0, timeSec: 200, expectedTimeSec: 600, success: true };

describe("scoreSimulation", () => {
  it("memberi skor 100 untuk run sempurna (akurasi, efisiensi, waktu ideal)", () => {
    const r = scoreSimulation(base);
    expect(r.score).toBe(100);
    expect(r.grade).toBe("A");
    expect(r.stars).toBe(4);
    expect(r.accuracy).toBe(1);
    expect(r.efficiency).toBe(1);
    expect(r.timeScore).toBe(1);
    expect(r.hintPenalty).toBe(0);
  });

  it("run gagal tidak pernah di bawah 20", () => {
    const r = scoreSimulation({ ...base, success: false });
    expect(r.score).toBeGreaterThanOrEqual(20);
    expect(r.score).toBeLessThan(60);
    expect(r.grade).toBe("E");
  });

  it("penalti hint di-cap 10", () => {
    const r = scoreSimulation({ ...base, hintsUsed: 8 });
    expect(r.hintPenalty).toBe(10);
  });

  it("semakin banyak hint → skor semakin rendah (dengan input lain sama)", () => {
    const r0 = scoreSimulation({ ...base, hintsUsed: 0 }).score;
    const r1 = scoreSimulation({ ...base, hintsUsed: 2 }).score;
    const r2 = scoreSimulation({ ...base, hintsUsed: 4 }).score;
    expect(r0).toBeGreaterThan(r1);
    expect(r1).toBeGreaterThan(r2);
  });

  it("semakin banyak langkah salah → skor turun", () => {
    const good = scoreSimulation({ ...base, wrongMoves: 0 }).score;
    const bad = scoreSimulation({ ...base, wrongMoves: 3 }).score;
    expect(good).toBeGreaterThan(bad);
  });

  it("metrik selalu berada pada range 0..1", () => {
    const r = scoreSimulation({ ...base, totalMoves: 40, wrongMoves: 30, timeSec: 3000, hintsUsed: 4, success: false });
    expect(r.accuracy).toBeGreaterThanOrEqual(0);
    expect(r.accuracy).toBeLessThanOrEqual(1);
    expect(r.efficiency).toBeGreaterThanOrEqual(0);
    expect(r.efficiency).toBeLessThanOrEqual(1);
    expect(r.timeScore).toBeGreaterThanOrEqual(0);
    expect(r.timeScore).toBeLessThanOrEqual(1);
  });
});

describe("gradeOf / starsOf", () => {
  it("grade sesuai rentang skor", () => {
    expect(gradeOf(95)).toBe("A");
    expect(gradeOf(85)).toBe("B");
    expect(gradeOf(75)).toBe("C");
    expect(gradeOf(65)).toBe("D");
    expect(gradeOf(40)).toBe("E");
  });

  it("stars sesuai rentang skor", () => {
    expect(starsOf(90)).toBe(4);
    expect(starsOf(75)).toBe(3);
    expect(starsOf(60)).toBe(2);
    expect(starsOf(20)).toBe(1);
  });
});