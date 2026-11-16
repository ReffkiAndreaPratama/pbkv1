import { Router } from "express";
import prisma from "../db";
import { requireAuth } from "../middleware/auth";
import { updateMasteryFromSimulation } from "../lib/adaptive";
import { scoreRepair, repairGradeOf, repairStarsOf } from "../lib/repair-scoring";
import { addXp, checkAchievements, touchStreak } from "../lib/gamification";

const router = Router();
router.use(requireAuth);

const TOOLS = ["VISUAL", "MULTIMETER", "POST_CARD", "SOFTWARE"] as const;
const FIX_TYPES = ["REPLACE", "RESEAT", "CLEAN", "RECONNECT"] as const;
type Tool = (typeof TOOLS)[number];
type FixType = (typeof FIX_TYPES)[number];

const FIX_LABELS: Record<FixType, string> = {
  REPLACE: "ganti komponen",
  RESEAT: "reseat",
  CLEAN: "bersihkan",
  RECONNECT: "sambung ulang",
};

// Umpan balik salah tindakan: jelaskan kenapa tindakan itu belum menyentuh akar
// masalah, tanpa membocorkan tindakan yang benar.
const FIX_RULE_OUT: Record<FixType, string> = {
  REPLACE:
    "Mengganti komponen belum tentu perlu — periksa dulu apakah masalahnya hanya pada kontak, kotoran, atau sambungan.",
  RESEAT:
    "Memasang ulang posisi komponen belum menyelesaikan masalah — periksa kondisi kotoran atau kerusakan pada komponen.",
  CLEAN:
    "Membersihkan permukaan saja belum cukup — periksa apakah ada bagian yang longgar, rusak, atau salah sambung.",
  RECONNECT:
    "Menyambung ulang kabel belum memperbaiki masalah — periksa apakah komponennya perlu diganti, dibersihkan, atau dipasang ulang.",
};

function wrongFixReason(
  component: { name: string; isFaulty: boolean; faultLabel: string | null },
  chosen: FixType
): string {
  if (!component.isFaulty) {
    return `${component.name} tidak menunjukkan tanda kerusakan. Tindakan "${FIX_LABELS[chosen]}" hanya membuang waktu — pilih komponen yang benar-benar bermasalah.`;
  }
  const fault = component.faultLabel ? ` (${component.faultLabel.toLowerCase()})` : "";
  return `${component.name} memang bermasalah${fault}. ${FIX_RULE_OUT[chosen]} Baca lagi hasil inspeksi dan pengukuran untuk menentukan tindakan yang tepat.`;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function asTestedMap(v: unknown): Record<string, string[]> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(v as Record<string, unknown>)) out[key] = asStringArray(val);
  return out;
}

type JobWithComponents = Awaited<ReturnType<typeof loadJobWithComponents>>;

async function loadJobWithComponents(jobId: string) {
  return prisma.repairJob.findUnique({
    where: { id: jobId },
    include: { skill: true, components: { orderBy: { name: "asc" } } },
  });
}

type AttemptWithJob = Awaited<ReturnType<typeof loadAttemptWithJob>>;

async function loadAttemptWithJob(attemptId: string) {
  return prisma.repairAttempt.findUnique({
    where: { id: attemptId },
    include: { job: { include: { skill: true, components: { orderBy: { name: "asc" } } } } },
  });
}

function elapsedSec(startedAt: Date): number {
  return Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000));
}

function componentDto(c: NonNullable<JobWithComponents>["components"][number], attempt: NonNullable<AttemptWithJob>) {
  const inspected = asStringArray(attempt.inspectedKeys);
  const fixed = asStringArray(attempt.fixedKeys);
  const tested = asTestedMap(attempt.testedKeys);
  const readings = (c.readings ?? {}) as Record<string, string>;
  const testedTools = tested[c.key] ?? [];
  const revealed: Record<string, string> = {};
  for (const tool of testedTools) {
    if (readings[tool]) revealed[tool] = readings[tool];
  }
  return {
    key: c.key,
    name: c.name,
    category: c.category,
    slot: c.slot,
    replacementName: c.replacementName,
    fixed: fixed.includes(c.key),
    inspected: inspected.includes(c.key),
    clue: inspected.includes(c.key) ? c.inspectClue : null,
    testedTools,
    readings: revealed,
  };
}

function attemptState(attempt: NonNullable<AttemptWithJob>) {
  const components = attempt.job.components;
  const fixedKeys = asStringArray(attempt.fixedKeys);
  const faultsTotal = components.filter((c) => c.isFaulty).length;
  const faultsFixed = components.filter((c) => c.isFaulty && fixedKeys.includes(c.key)).length;
  const elapsed = attempt.timeSec > 0 ? attempt.timeSec : elapsedSec(attempt.startedAt);
  return {
    id: attempt.id,
    status: attempt.status,
    elapsedSec: elapsed,
    timeLeftSec: Math.max(0, attempt.job.timeLimitSec - elapsed),
    job: {
      id: attempt.job.id,
      title: attempt.job.title,
      scenario: attempt.job.scenario,
      symptom: attempt.job.symptom,
      deviceType: attempt.job.deviceType,
      difficulty: attempt.job.difficulty,
      timeLimitSec: attempt.job.timeLimitSec,
      maxHearts: attempt.job.maxHearts,
      skill: { code: attempt.job.skill.code, name: attempt.job.skill.name },
    },
    hearts: attempt.hearts,
    combo: attempt.combo,
    maxCombo: attempt.maxCombo,
    actions: attempt.actions,
    correctActions: attempt.correctActions,
    wrongActions: attempt.wrongActions,
    faultsTotal,
    faultsFixed,
    components: components.map((c) => componentDto(c, attempt)),
  };
}

async function completeAttempt(
  attempt: NonNullable<AttemptWithJob>,
  success: boolean,
  extra: { hearts?: number; wrongActions?: number; combo?: number; maxCombo?: number; actions?: number }
) {
  const hearts = extra.hearts ?? attempt.hearts;
  const actions = extra.actions ?? attempt.actions;
  const correctActions = attempt.correctActions;
  const wrongActions = extra.wrongActions ?? attempt.wrongActions;
  const maxCombo = extra.maxCombo ?? attempt.maxCombo;
  const timeSec = elapsedSec(attempt.startedAt);

  const result = scoreRepair({
    heartsLeft: hearts,
    maxHearts: attempt.job.maxHearts,
    actions,
    correctActions,
    wrongActions,
    maxCombo,
    timeSec,
    timeLimitSec: attempt.job.timeLimitSec,
    success,
  });

  const updated = await prisma.repairAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      hearts,
      actions,
      wrongActions,
      maxCombo,
      timeSec,
      score: result.score,
      success,
    },
    include: { job: { include: { skill: true, components: { orderBy: { name: "asc" } } } } },
  });

  // mastery per skill
  const sm = await prisma.skillMastery.findFirst({ where: { userId: attempt.userId, skillId: attempt.job.skillId } });
  const newM = updateMasteryFromSimulation(sm?.mastery ?? 0, success, result.accuracy);
  await prisma.skillMastery.upsert({
    where: { userId_skillId: { userId: attempt.userId, skillId: attempt.job.skillId } },
    create: { userId: attempt.userId, skillId: attempt.job.skillId, mastery: newM, attempts: 1, successes: success ? 1 : 0 },
    update: { mastery: newM, attempts: { increment: 1 }, successes: success ? { increment: 1 } : undefined },
  });

  const xpGained = success ? 35 + Math.round(result.score / 6) : 8;
  await addXp(attempt.userId, xpGained);
  await prisma.activityLog.create({
    data: {
      userId: attempt.userId,
      type: "CASE_SUBMIT",
      refId: attempt.job.skillId,
      meta: { mode: "REPAIR", jobId: attempt.jobId, score: result.score, success },
      points: xpGained,
    },
  });
  await checkAchievements(attempt.userId);

  return { state: attemptState(updated), result: { ...result, success, xpGained, timeSec } };
}

// ---------------------------------------------------------------- jobs
router.get("/jobs", async (req: any, res) => {
  const userId = req.user!.id;
  const jobs = await prisma.repairJob.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { skill: true },
  });

  const attempts = await prisma.repairAttempt.findMany({
    where: { userId, status: "COMPLETED" },
    select: { jobId: true, score: true, success: true },
  });

  const byJob = new Map<string, { best: number; attempts: number; success: number }>();
  for (const a of attempts) {
    const cur = byJob.get(a.jobId) ?? { best: 0, attempts: 0, success: 0 };
    cur.best = Math.max(cur.best, a.score ?? 0);
    cur.attempts += 1;
    if (a.success) cur.success += 1;
    byJob.set(a.jobId, cur);
  }

  res.json(
    jobs.map((j) => {
      const stat = byJob.get(j.id);
      return {
        id: j.id,
        title: j.title,
        symptom: j.symptom,
        deviceType: j.deviceType,
        difficulty: j.difficulty,
        timeLimitSec: j.timeLimitSec,
        maxHearts: j.maxHearts,
        skill: { code: j.skill.code, name: j.skill.name },
        bestScore: stat?.best ?? null,
        attempts: stat?.attempts ?? 0,
        successCount: stat?.success ?? 0,
      };
    })
  );
});

router.get("/jobs/:id", async (req: any, res) => {
  const job = await loadJobWithComponents(req.params.id);
  if (!job || !job.isActive) {
    res.status(404).json({ error: "Misi perbaikan tidak ditemukan." });
    return;
  }
  res.json({
    id: job.id,
    title: job.title,
    scenario: job.scenario,
    symptom: job.symptom,
    deviceType: job.deviceType,
    difficulty: job.difficulty,
    timeLimitSec: job.timeLimitSec,
    maxHearts: job.maxHearts,
    skill: { code: job.skill.code, name: job.skill.name },
    componentCount: job.components.length,
  });
});

router.post("/jobs/:id/start", async (req: any, res) => {
  const userId = req.user!.id;
  const job = await loadJobWithComponents(req.params.id);
  if (!job || !job.isActive) {
    res.status(404).json({ error: "Misi perbaikan tidak ditemukan." });
    return;
  }
  await touchStreak(userId);
  const attempt = await prisma.repairAttempt.create({
    data: {
      userId,
      jobId: job.id,
      hearts: job.maxHearts,
      inspectedKeys: [],
      testedKeys: {},
      fixedKeys: [],
    },
    include: { job: { include: { skill: true, components: { orderBy: { name: "asc" } } } } },
  });
  res.status(201).json({ state: attemptState(attempt) });
});

// ---------------------------------------------------------------- attempts
router.get("/attempts/:id", async (req: any, res) => {
  const attempt = await loadAttemptWithJob(req.params.id);
  if (!attempt || attempt.userId !== req.user!.id) {
    res.status(404).json({ error: "Sesi perbaikan tidak ditemukan." });
    return;
  }
  const state = attemptState(attempt);
  if (attempt.status === "COMPLETED" && attempt.score !== null) {
    const result = scoreRepair({
      heartsLeft: attempt.hearts,
      maxHearts: attempt.job.maxHearts,
      actions: attempt.actions,
      correctActions: attempt.correctActions,
      wrongActions: attempt.wrongActions,
      maxCombo: attempt.maxCombo,
      timeSec: attempt.timeSec,
      timeLimitSec: attempt.job.timeLimitSec,
      success: !!attempt.success,
    });
    res.json({ state, result: { ...result, success: !!attempt.success, xpGained: 0, timeSec: attempt.timeSec } });
    return;
  }
  res.json({ state });
});

router.post("/attempts/:id/action", async (req: any, res) => {
  const attempt = await loadAttemptWithJob(req.params.id);
  if (!attempt || attempt.userId !== req.user!.id) {
    res.status(404).json({ error: "Sesi perbaikan tidak ditemukan." });
    return;
  }
  if (attempt.status !== "IN_PROGRESS") {
    res.status(409).json({ error: "Sesi perbaikan sudah selesai.", state: attemptState(attempt) });
    return;
  }

  const body = (req.body ?? {}) as { type?: string; componentKey?: string; tool?: string; fixType?: string };
  const type = String(body.type ?? "").toUpperCase();

  // waktu habis → gagal
  const elapsed = elapsedSec(attempt.startedAt);
  if (elapsed >= attempt.job.timeLimitSec) {
    const done = await completeAttempt(attempt, false, { hearts: attempt.hearts });
    res.json({
      event: {
        kind: "TIMEOUT",
        ok: false,
        title: "Waktu Habis",
        message: `Waktu perbaikan habis sebelum ${attempt.job.deviceType === "LAPTOP" ? "laptop" : "PC"} kembali normal.`,
      },
      ...done,
    });
    return;
  }

  const component = body.componentKey ? attempt.job.components.find((c) => c.key === body.componentKey) : undefined;
  const inspected = asStringArray(attempt.inspectedKeys);
  const fixed = asStringArray(attempt.fixedKeys);
  const tested = asTestedMap(attempt.testedKeys);

  let actions = attempt.actions;
  let correctActions = attempt.correctActions;
  let wrongActions = attempt.wrongActions;
  let hearts = attempt.hearts;
  let combo = attempt.combo;
  let maxCombo = attempt.maxCombo;
  let event: { kind: string; ok: boolean; title: string; message: string; componentKey?: string; reading?: string; heartsLost?: number } = {
    kind: "INFO",
    ok: true,
    title: "Info",
    message: "",
  };

  if (type === "INSPECT") {
    if (!component) {
      res.status(422).json({ error: "Komponen tidak valid." });
      return;
    }
    if (!inspected.includes(component.key)) {
      inspected.push(component.key);
      actions += 1;
    }
    event = {
      kind: "INSPECT",
      ok: true,
      title: `Inspeksi: ${component.name}`,
      message: component.inspectClue,
      componentKey: component.key,
    };
  } else if (type === "TEST") {
    const tool = String(body.tool ?? "").toUpperCase() as Tool;
    if (!component || !TOOLS.includes(tool)) {
      res.status(422).json({ error: "Komponen atau alat tidak valid." });
      return;
    }
    const toolsForComponent = tested[component.key] ?? [];
    if (!toolsForComponent.includes(tool)) {
      toolsForComponent.push(tool);
      tested[component.key] = toolsForComponent;
      actions += 1;
    }
    const readings = (component.readings ?? {}) as Record<string, string>;
    const reading = readings[tool] ?? "Alat ini tidak memberikan indikasi khusus pada komponen ini.";
    event = {
      kind: "TEST",
      ok: true,
      title: `Tes ${tool.replace("_", " ")}: ${component.name}`,
      message: reading,
      reading,
      componentKey: component.key,
    };
  } else if (type === "FIX") {
    const fixType = String(body.fixType ?? "").toUpperCase() as FixType;
    if (!component || !FIX_TYPES.includes(fixType)) {
      res.status(422).json({ error: "Komponen atau tindakan tidak valid." });
      return;
    }
    if (fixed.includes(component.key)) {
      event = {
        kind: "INFO",
        ok: true,
        title: `${component.name} sudah diperbaiki`,
        message: "Komponen ini sudah dalam kondisi baik. Lanjutkan ke komponen lain atau lakukan tes nyala.",
        componentKey: component.key,
      };
    } else {
      actions += 1;
      const isRight = component.isFaulty && component.fixType === fixType;
      if (isRight) {
        fixed.push(component.key);
        correctActions += 1;
        combo += 1;
        maxCombo = Math.max(maxCombo, combo);
        const labels: Record<FixType, string> = {
          REPLACE: component.replacementName ? `Komponen diganti dengan ${component.replacementName}.` : "Komponen berhasil diganti.",
          RESEAT: "Komponen dilepas dan dipasang ulang dengan benar.",
          CLEAN: "Debu dan kotoran berhasil dibersihkan.",
          RECONNECT: "Kabel dicabut dan disambungkan ulang dengan rapi.",
        };
        event = {
          kind: "FIX",
          ok: true,
          title: `Berhasil: ${component.name}`,
          message: `${component.faultLabel ?? "Komponen bermasalah"} — ${labels[fixType]} Combo +1!`,
          componentKey: component.key,
        };
      } else {
        wrongActions += 1;
        combo = 0;
        hearts = Math.max(0, hearts - 1);
        const reason = wrongFixReason(component, fixType);
        event = {
          kind: "HEART_LOST",
          ok: false,
          title: `Nyawa -1: ${component.name}`,
          message: reason,
          componentKey: component.key,
          heartsLost: 1,
        };
      }
    }
  } else if (type === "POWER_TEST") {
    actions += 1;
    const deviceLabel = attempt.job.deviceType === "LAPTOP" ? "Laptop" : "PC";
    const faults = attempt.job.components.filter((c) => c.isFaulty);
    const allFixed = faults.every((c) => fixed.includes(c.key));
    if (allFixed) {
      const done = await completeAttempt(attempt, true, { hearts, actions, wrongActions, maxCombo, combo });
      res.json({
        event: {
          kind: "WIN",
          ok: true,
          title: `${deviceLabel} Menyala Normal! 🎉`,
          message: "Semua komponen bermasalah sudah diperbaiki. Misi selesai!",
        },
        ...done,
      });
      return;
    }
    wrongActions += 1;
    combo = 0;
    hearts = Math.max(0, hearts - 1);
    event = {
      kind: "HEART_LOST",
      ok: false,
      title: `${deviceLabel} Masih Gagal Menyala`,
      message: "Masih ada komponen bermasalah yang belum diperbaiki. Periksa kembali hasil diagnosismu.",
      heartsLost: 1,
    };
  } else {
    res.status(422).json({ error: "Aksi tidak dikenal." });
    return;
  }

  if (hearts <= 0 && type !== "POWER_TEST") {
    const done = await completeAttempt(attempt, false, { hearts, actions, wrongActions, maxCombo, combo });
    res.json({
      event: { ...event, kind: "LOSE", title: "Nyawa Habis", message: "Kamu kehabisan nyawa. Pelajari kembali gejala dan coba lagi." },
      ...done,
    });
    return;
  }

  const updated = await prisma.repairAttempt.update({
    where: { id: attempt.id },
    data: {
      hearts,
      combo,
      maxCombo,
      actions,
      correctActions,
      wrongActions,
      inspectedKeys: inspected,
      testedKeys: tested,
      fixedKeys: fixed,
    },
    include: { job: { include: { skill: true, components: { orderBy: { name: "asc" } } } } },
  });

  if (hearts <= 0) {
    const done = await completeAttempt(updated, false, {});
    res.json({
      event: { ...event, kind: "LOSE", title: "Nyawa Habis", message: "Kamu kehabisan nyawa. Pelajari kembali gejala dan coba lagi." },
      ...done,
    });
    return;
  }

  res.json({ event, state: attemptState(updated) });
});

router.get("/history", async (req: any, res) => {
  const userId = req.user!.id;
  const attempts = await prisma.repairAttempt.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 12,
    include: { job: { include: { skill: true } } },
  });
  res.json(
    attempts.map((a) => {
      const score = a.score ?? 0;
      return {
        id: a.id,
        jobId: a.jobId,
        jobTitle: a.job.title,
        deviceType: a.job.deviceType,
        skill: { code: a.job.skill.code, name: a.job.skill.name },
        difficulty: a.job.difficulty,
        score,
        success: !!a.success,
        grade: repairGradeOf(score),
        stars: repairStarsOf(score, !!a.success),
        hearts: a.hearts,
        maxHearts: a.job.maxHearts,
        wrongActions: a.wrongActions,
        timeSec: a.timeSec,
        completedAt: a.completedAt,
      };
    })
  );
});

router.post("/attempts/:id/abandon", async (req: any, res) => {
  const attempt = await prisma.repairAttempt.findUnique({ where: { id: req.params.id } });
  if (!attempt || attempt.userId !== req.user!.id) {
    res.status(404).json({ error: "Sesi perbaikan tidak ditemukan." });
    return;
  }
  await prisma.repairAttempt.update({
    where: { id: attempt.id },
    data: { status: "ABANDONED", completedAt: new Date(), success: false, score: 0, timeSec: elapsedSec(attempt.startedAt) },
  });
  res.json({ ok: true });
});

export default router;
