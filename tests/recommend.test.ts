import { describe, it, expect } from "vitest";
import { pickNextCase, type NextCaseCandidate } from "../backend/src/lib/recommend";

const c = (
  id: string,
  difficulty: NextCaseCandidate["difficulty"],
  order: number,
  locked = false
): NextCaseCandidate => ({
  id,
  title: `Kasus ${id}`,
  difficulty,
  targetSteps: 5,
  order,
  locked,
});

describe("pickNextCase", () => {
  it("memilih kasus satu tingkat lebih sulit", () => {
    const pick = pickNextCase({ id: "now", difficulty: "EASY" }, [
      c("easy-2", "EASY", 1),
      c("hard", "HARD", 2),
      c("medium", "MEDIUM", 3),
    ]);
    expect(pick?.id).toBe("medium");
    expect(pick?.reason).toMatch(/naik satu tingkat/i);
  });

  it("mendahulukan kasus yang belum terkunci", () => {
    const pick = pickNextCase({ id: "now", difficulty: "EASY" }, [
      c("medium-locked", "MEDIUM", 1, true),
      c("medium-open", "MEDIUM", 9, false),
    ]);
    expect(pick?.id).toBe("medium-open");
  });

  it("memakai tingkat yang sama bila tidak ada yang lebih sulit", () => {
    const pick = pickNextCase({ id: "now", difficulty: "HARD" }, [
      c("easy", "EASY", 1),
      c("hard-2", "HARD", 2),
    ]);
    expect(pick?.id).toBe("hard-2");
    expect(pick?.reason).toMatch(/penguatan/i);
  });

  it("turun ke kasus lebih mudah bila hanya itu pilihannya", () => {
    const pick = pickNextCase({ id: "now", difficulty: "MEDIUM" }, [
      c("easy", "EASY", 1),
    ]);
    expect(pick?.id).toBe("easy");
    expect(pick?.reason).toMatch(/pemanasan/i);
  });

  it("tidak pernah merekomendasikan kasus yang sedang dimainkan", () => {
    const pick = pickNextCase({ id: "now", difficulty: "MEDIUM" }, [
      c("now", "MEDIUM", 0),
      c("other", "MEDIUM", 1),
    ]);
    expect(pick?.id).toBe("other");
  });

  it("mengurutkan kandidat dengan order kurikulum", () => {
    const pick = pickNextCase({ id: "now", difficulty: "EASY" }, [
      c("medium-b", "MEDIUM", 7),
      c("medium-a", "MEDIUM", 2),
    ]);
    expect(pick?.id).toBe("medium-a");
  });

  it("tidak menaikkan level setelah misi gagal", () => {
    const pick = pickNextCase(
      { id: "now", difficulty: "MEDIUM" },
      [c("hard", "HARD", 1), c("medium", "MEDIUM", 2)],
      { escalate: false }
    );
    expect(pick?.id).toBe("medium");
    expect(pick?.reason).toMatch(/pola serupa/i);
  });

  it("turun ke kasus lebih mudah saat gagal bila tidak ada setingkat", () => {
    const pick = pickNextCase(
      { id: "now", difficulty: "MEDIUM" },
      [c("hard", "HARD", 1), c("easy", "EASY", 2)],
      { escalate: false }
    );
    expect(pick?.id).toBe("easy");
  });

  it("mengembalikan null bila tidak ada kandidat lain", () => {
    expect(pickNextCase({ id: "now", difficulty: "MEDIUM" }, [])).toBeNull();
    expect(pickNextCase({ id: "now", difficulty: "MEDIUM" }, [c("now", "MEDIUM", 0)])).toBeNull();
  });
});
