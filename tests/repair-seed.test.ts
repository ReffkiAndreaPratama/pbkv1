import { describe, it, expect } from "vitest";
import { REPAIR_JOBS, type SeedRepairJob } from "../backend/prisma/seed/repair-data";
import {
  PC_SPOTS,
  LAPTOP_SPOTS,
  PC_TRAY_SLOTS,
  LAPTOP_TRAY_SLOTS,
  type ChassisSpot,
} from "../frontend/src/components/repair/chassis-layout";

const FIX_TYPES = ["REPLACE", "RESEAT", "CLEAN", "RECONNECT"] as const;
const SKILLS = ["POWER", "BOOT", "NETWORK", "STORAGE", "DISPLAY", "PERIPHERAL"] as const;
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

type Device = "PC" | "LAPTOP";

function deviceOf(job: SeedRepairJob): Device {
  return job.deviceType ?? "PC";
}

function layoutFor(device: Device): { spotSlots: Set<string>; traySlots: Set<string> } {
  const spots: ChassisSpot[] = device === "PC" ? PC_SPOTS : LAPTOP_SPOTS;
  const tray: readonly string[] = device === "PC" ? PC_TRAY_SLOTS : LAPTOP_TRAY_SLOTS;
  return { spotSlots: new Set(spots.map((s) => s.slot)), traySlots: new Set(tray) };
}

describe("seed Bengkel PC & Laptop", () => {
  it("berisi 18 misi dengan komposisi 12 PC + 6 laptop dan 110 komponen", () => {
    expect(REPAIR_JOBS).toHaveLength(18);
    expect(REPAIR_JOBS.filter((j) => deviceOf(j) === "PC")).toHaveLength(12);
    expect(REPAIR_JOBS.filter((j) => deviceOf(j) === "LAPTOP")).toHaveLength(6);
    expect(REPAIR_JOBS.reduce((n, j) => n + j.components.length, 0)).toBe(110);
  });

  it("judul misi unik dan setiap misi punya minimal satu komponen rusak", () => {
    const titles = REPAIR_JOBS.map((j) => j.title);
    expect(new Set(titles).size).toBe(titles.length);

    for (const job of REPAIR_JOBS) {
      const faulty = job.components.filter((c) => c.isFaulty);
      expect(faulty.length, job.title).toBeGreaterThanOrEqual(1);
      expect(faulty.length, `${job.title}: jangan semua komponen rusak`).toBeLessThan(job.components.length);
    }
  });

  it("setiap komponen punya key unik, fixType valid, dan petunjuk inspeksi", () => {
    for (const job of REPAIR_JOBS) {
      const keys = job.components.map((c) => c.key);
      expect(new Set(keys).size, `${job.title}: key komponen duplikat`).toBe(keys.length);

      for (const c of job.components) {
        const where = `${job.title}/${c.key}`;
        expect(FIX_TYPES, `${where}: fixType tidak dikenal`).toContain(c.fixType);
        expect(c.name.trim().length, `${where}: nama kosong`).toBeGreaterThan(0);
        expect(c.slot.trim().length, `${where}: slot kosong`).toBeGreaterThan(0);
        expect(c.inspectClue.trim().length, `${where}: inspectClue kosong`).toBeGreaterThan(0);
        if (c.isFaulty) {
          expect(c.faultLabel?.trim().length ?? 0, `${where}: faultLabel wajib untuk komponen rusak`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("setiap slot komponen ada di chassis atau baki meja perangkatnya", () => {
    for (const job of REPAIR_JOBS) {
      const device = deviceOf(job);
      const { spotSlots, traySlots } = layoutFor(device);
      for (const c of job.components) {
        const placed = spotSlots.has(c.slot) || traySlots.has(c.slot);
        expect(
          placed,
          `${job.title}/${c.key}: slot "${c.slot}" tidak punya hotspot atau tray untuk ${device}`
        ).toBe(true);
      }
    }
  });

  it("slot chassis dan baki tidak tumpang tindih, dan slot hotspot unik", () => {
    for (const [device, spots, tray] of [
      ["PC", PC_SPOTS, PC_TRAY_SLOTS],
      ["LAPTOP", LAPTOP_SPOTS, LAPTOP_TRAY_SLOTS],
    ] as const) {
      const spotSlots = spots.map((s) => s.slot);
      expect(new Set(spotSlots).size, `${device}: slot hotspot duplikat`).toBe(spotSlots.length);

      for (const slot of tray) {
        expect(spotSlots, `${device}: "${slot}" ada di chassis sekaligus di baki`).not.toContain(slot);
      }
    }
  });

  it("setiap misi punya skill, difficulty, waktu, dan nyawa yang masuk akal", () => {
    for (const job of REPAIR_JOBS) {
      expect(SKILLS, `${job.title}: skill tidak dikenal`).toContain(job.skill as (typeof SKILLS)[number]);
      expect(DIFFICULTIES, `${job.title}: difficulty tidak dikenal`).toContain(job.difficulty);
      expect(job.timeLimitSec, `${job.title}: waktu harus positif`).toBeGreaterThan(0);
      expect(job.maxHearts, `${job.title}: nyawa harus positif`).toBeGreaterThan(0);
      expect(job.scenario.trim().length, `${job.title}: scenario kosong`).toBeGreaterThan(0);
      expect(job.symptom.trim().length, `${job.title}: symptom kosong`).toBeGreaterThan(0);
    }
  });

  it("setiap skill punya minimal dua misi PC sebagai jalur utama", () => {
    for (const skill of SKILLS) {
      const pcCount = REPAIR_JOBS.filter((j) => j.skill === skill && deviceOf(j) === "PC").length;
      expect(pcCount, `skill ${skill} butuh minimal 2 misi PC`).toBeGreaterThanOrEqual(2);
    }
  });
});
