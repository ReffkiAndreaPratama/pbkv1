import { Router } from "express";
import prisma from "../db";
import { requireAuth } from "../middleware/auth";
import { updateMasteryFromSimulation } from "../lib/adaptive";
import { scoreSimulation, type SimScoringInput } from "../lib/scoring";
import { HINT_MAX_LEVEL, buildSimulationHint } from "../lib/hint";
import { pickNextCase } from "../lib/recommend";
import { awardSimSuccess, awardSimFail, checkAchievements } from "../lib/gamification";

const router = Router();
router.use(requireAuth);

async function resolveCurrentNode(attemptId: string, caseId: string) {
  const lastStep = await prisma.simulationStep.findFirst({ where: { attemptId }, orderBy: { at: "desc" } });
  if (!lastStep) return prisma.caseNode.findFirst({ where: { caseId, type: "START" } });
  const lastOption = await prisma.caseOption.findFirst({
    where: { caseId, label: lastStep.optionLabel },
    include: { nextNode: true },
  });
  return lastOption?.nextNode ?? prisma.caseNode.findFirst({ where: { caseId, type: "START" } });
}

async function currentNodeWithOptions(
  attemptId: string,
  caseId: string,
  signals: Record<string, string | boolean | number>
) {
  const node = await resolveCurrentNode(attemptId, caseId);
  if (!node) return null;
  const options = await prisma.caseOption.findMany({ where: { nodeId: node.id }, include: { nextNode: true } });
  return {
    node: {
      nodeKey: node.nodeKey,
      type: node.type,
      text: node.text,
      detail: node.detail,
      options: options.map(playOption(signals)),
    },
    signals,
  };
}

/**
 * Opsi yang dikirim saat bermain tidak membocorkan jawaban.
 * Hanya label, tujuan, dan ketersediaan (dihitung dari sinyal) yang terlihat.
 */
const playOption = (signals: Record<string, string | boolean | number>) => (o: {
  id: string;
  label: string;
  nextNode: { nodeKey: string } | null;
  condition: unknown;
}) => {
  const cond = o.condition as { signal?: string; equals?: string | boolean | number } | null;
  const available = !cond?.signal || signals[cond.signal] === cond.equals;
  return {
    optionId: o.id,
    label: o.label,
    targetNodeKey: o.nextNode?.nodeKey ?? null,
    available,
  };
};

async function buildDebrief(attemptId: string, caseId: string) {
  const [steps, nodes] = await Promise.all([
    prisma.simulationStep.findMany({ where: { attemptId }, orderBy: { at: "asc" } }),
    prisma.caseNode.findMany({
      where: { caseId },
      select: { nodeKey: true, text: true, type: true },
    }),
  ]);
  const byKey = new Map(nodes.map((n) => [n.nodeKey, n]));
  return steps.map((s, i) => ({
    step: i + 1,
    nodeKey: s.nodeKey,
    nodeText: byKey.get(s.nodeKey)?.text ?? s.nodeKey,
    nodeType: byKey.get(s.nodeKey)?.type ?? "ACTION",
    optionLabel: s.optionLabel,
    wasCorrect: s.wasCorrect,
    hintLevel: s.hintLevel,
    at: s.at,
  }));
}

/**
 * Riwayat misi yang sudah selesai/ditinggalkan.
 * Dipakai halaman simulasi untuk membuka ulang debrief tanpa mengulang misi.
 */
router.get("/history", async (req: any, res) => {
  const attempts = await prisma.simulationAttempt.findMany({
    where: { userId: req.user!.id, status: { not: "IN_PROGRESS" } },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: { case: { include: { skill: true } } },
  });
  res.json(
    attempts.map((a) => ({
      id: a.id,
      caseId: a.caseId,
      caseTitle: a.case.title,
      skill: a.case.skill,
      difficulty: a.case.difficulty,
      status: a.status,
      success: a.success,
      score: a.score,
      accuracy: a.accuracy,
      timeSec: a.timeSec,
      hintsUsed: a.hintsUsed,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
    }))
  );
});

router.get("/:attemptId", async (req: any, res) => {
  const attempt = await prisma.simulationAttempt.findUnique({ where: { id: req.params.attemptId }, include: { case: { include: { skill: true } } } });
  if (!attempt || attempt.userId !== req.user!.id) { res.status(404).json({ error: "Attempt not found." }); return; }

  if (attempt.status !== "IN_PROGRESS") {
    res.json({
      id: attempt.id,
      caseId: attempt.caseId,
      status: attempt.status === "ABANDONED" ? "ABANDONED" : "COMPLETED",
      caseTitle: attempt.case.title,
      skill: attempt.case.skill,
      difficulty: attempt.case.difficulty,
      score: attempt.score,
      accuracy: attempt.accuracy,
      success: attempt.success,
      totalMoves: attempt.totalMoves,
      wrongMoves: attempt.wrongMoves,
      targetSteps: attempt.case.targetSteps,
      expectedTimeSec: attempt.case.expectedTimeSec,
      timeSec: attempt.timeSec,
      hintsUsed: attempt.hintsUsed,
      signalState: attempt.signalState ?? {},
      debrief: await buildDebrief(attempt.id, attempt.caseId),
    });
    return;
  }

  const signals = (attempt.signalState ?? {}) as Record<string, string | boolean | number>;
  const state = await currentNodeWithOptions(attempt.id, attempt.caseId, signals);
  if (!state) { res.status(500).json({ error: "Could not determine current node." }); return; }
  const { node } = state;

  res.json({
    status: "IN_PROGRESS",
    caseId: attempt.caseId,
    caseTitle: attempt.case.title,
    skill: attempt.case.skill,
    targetSteps: attempt.case.targetSteps,
    expectedTimeSec: attempt.case.expectedTimeSec,
    totalMoves: attempt.totalMoves,
    wrongMoves: attempt.wrongMoves,
    hintsUsed: attempt.hintsUsed,
    elapsedSec: Math.round((Date.now() - attempt.startedAt.getTime()) / 1000),
    currentNode: node,
    signalState: signals,
  });
});

router.get("/:attemptId/debrief", async (req: any, res) => {
  const attempt = await prisma.simulationAttempt.findUnique({
    where: { id: req.params.attemptId },
    include: { case: { include: { skill: true } } },
  });
  if (!attempt || attempt.userId !== req.user!.id) {
    res.status(404).json({ error: "Attempt not found." });
    return;
  }
  res.json({
    id: attempt.id,
    caseId: attempt.caseId,
    caseTitle: attempt.case.title,
    skill: attempt.case.skill,
    difficulty: attempt.case.difficulty,
    status: attempt.status,
    success: attempt.success,
    score: attempt.score,
    accuracy: attempt.accuracy,
    timeSec: attempt.timeSec,
    hintsUsed: attempt.hintsUsed,
    totalMoves: attempt.totalMoves,
    wrongMoves: attempt.wrongMoves,
    targetSteps: attempt.case.targetSteps,
    expectedTimeSec: attempt.case.expectedTimeSec,
    signalState: attempt.signalState ?? {},
    timeline: await buildDebrief(attempt.id, attempt.caseId),
  });
});

/**
 * Rekomendasi lanjutan setelah misi: materi pendukung, kasus berikutnya,
 * dan progres penguasaan skill. Dipakai panel "Langkah berikutnya" pada debrief.
 */
router.get("/:attemptId/recommendations", async (req: any, res) => {
  const attempt = await prisma.simulationAttempt.findUnique({
    where: { id: req.params.attemptId },
    include: { case: { include: { skill: true } } },
  });
  if (!attempt || attempt.userId !== req.user!.id) {
    res.status(404).json({ error: "Attempt not found." });
    return;
  }

  const userId = req.user!.id;
  const skillId = attempt.case.skillId;

  const [materials, reads, mastery, caseRows] = await Promise.all([
    prisma.material.findMany({
      where: { skillId, isActive: true },
      select: { id: true, title: true, summary: true, order: true },
      orderBy: { order: "asc" },
    }),
    prisma.materialRead.findMany({ where: { userId }, select: { materialId: true } }),
    prisma.skillMastery.findUnique({ where: { userId_skillId: { userId, skillId } } }),
    prisma.caseModel.findMany({
      where: { skillId, isActive: true },
      select: { id: true, title: true, difficulty: true, targetSteps: true, order: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const readSet = new Set(reads.map((r) => r.materialId));
  const masteryValue = mastery?.mastery ?? 0;

  // Materi yang belum dibaca tampil lebih dulu agar loop belajar berlanjut.
  const rankedMaterials = [...materials]
    .sort((a, b) => Number(readSet.has(a.id)) - Number(readSet.has(b.id)) || a.order - b.order)
    .slice(0, 3)
    .map((m) => ({ ...m, completed: readSet.has(m.id) }));

  const candidates = caseRows.map((c) => ({
    ...c,
    locked: (c.difficulty === "HARD" && masteryValue < 0.4) || (c.difficulty === "MEDIUM" && masteryValue < 0.25),
  }));
  const nextCase = pickNextCase(
    { id: attempt.caseId, difficulty: attempt.case.difficulty },
    candidates,
    { escalate: attempt.success !== false }
  );

  res.json({
    skill: { id: skillId, code: attempt.case.skill.code, name: attempt.case.skill.name },
    mastery: Math.round(masteryValue * 100),
    materials: rankedMaterials,
    totalMaterials: materials.length,
    completedMaterials: materials.filter((m) => readSet.has(m.id)).length,
    nextCase,
  });
});

router.post("/:attemptId/submit", async (req: any, res) => {
  const { attemptId } = req.params;
  const { optionId, hintLevel } = req.body as { optionId: string; hintLevel?: number };
  if (!optionId) { res.status(422).json({ error: "optionId required." }); return; }
  const stepHintLevel = Math.max(0, Math.min(HINT_MAX_LEVEL, Math.round(Number(hintLevel) || 0)));

  const attempt = await prisma.simulationAttempt.findUnique({ where: { id: attemptId }, include: { case: { include: { skill: true, nodes: { include: { options: true } } } } } });
  if (!attempt || attempt.userId !== req.user!.id || attempt.status !== "IN_PROGRESS") {
    res.status(404).json({ error: "Active attempt not found." }); return;
  }

  const option = await prisma.caseOption.findUnique({ where: { id: optionId }, include: { nextNode: true } });
  if (!option || option.caseId !== attempt.caseId) {
    res.status(422).json({ error: "Invalid option for this case." }); return;
  }

  // condition check
  const signals = (attempt.signalState ?? {}) as Record<string, string | boolean | number>;
  if (option.condition) {
    const cond = option.condition as { signal?: string; equals?: string | boolean | number };
    if (cond.signal && signals[cond.signal] !== cond.equals) {
      res.status(422).json({ error: "Option not available under current conditions.", reason: "condition_mismatch" }); return;
    }
  }

  // effect
  const effect = (option.effect ?? {}) as { setSignal?: Record<string, string | boolean | number>; forceFail?: boolean };
  if (effect.setSignal) Object.assign(signals, effect.setSignal);

  const totalMoves = attempt.totalMoves + 1;
  const wrongMoves = attempt.wrongMoves + (option.isCorrect ? 0 : 1);
  await prisma.simulationStep.create({
    data: { attemptId, nodeKey: attempt.case.nodes.find((n) => n.options.some((o) => o.id === option.id))?.nodeKey ?? "", optionLabel: option.label, wasCorrect: option.isCorrect, hintLevel: stepHintLevel },
  });

  const isForceFail = effect.forceFail === true;
  const isTerminal = isForceFail || option.nextNode?.type === "SOLUTION" || option.nextNode?.type === "FAIL";

  if (!isTerminal) {
    await prisma.simulationAttempt.update({ where: { id: attemptId }, data: { totalMoves, wrongMoves, signalState: signals } });
    const nextN = option.nextNode!;
    const nextOptions = await prisma.caseOption.findMany({ where: { nodeId: nextN.id }, include: { nextNode: true } });
    return res.json({
      terminal: false,
      nextNode: {
        nodeKey: nextN.nodeKey,
        type: nextN.type,
        text: nextN.text,
        detail: nextN.detail,
        options: nextOptions.map(playOption(signals)),
      },
      signalState: signals,
      wasCorrect: option.isCorrect,
      feedbackText: option.feedbackText ?? null,
    });
  }

  // terminal
  const success = (isForceFail ? false : (option.nextNode?.type === "SOLUTION"));
  const timeSec = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);
  const input: SimScoringInput = {
    targetSteps: attempt.case.targetSteps,
    totalMoves,
    wrongMoves,
    hintsUsed: attempt.hintsUsed,
    timeSec,
    expectedTimeSec: attempt.case.expectedTimeSec,
    success,
  };
  const result = scoreSimulation(input);

  await prisma.simulationAttempt.update({
    where: { id: attemptId },
    data: { status: "COMPLETED", completedAt: new Date(), totalMoves, wrongMoves, timeSec, success, score: result.score, accuracy: result.accuracy, signalState: signals },
  });

  // mastery
  const sm = await prisma.skillMastery.findFirst({ where: { userId: req.user!.id, skillId: attempt.case.skillId } });
  const newM = updateMasteryFromSimulation(sm?.mastery ?? 0, success, result.accuracy);
  await prisma.skillMastery.upsert({
    where: { userId_skillId: { userId: req.user!.id, skillId: attempt.case.skillId } },
    create: { userId: req.user!.id, skillId: attempt.case.skillId, mastery: newM, attempts: 1, successes: success ? 1 : 0 },
    update: { mastery: newM, attempts: { increment: 1 }, successes: success ? { increment: 1 } : undefined },
  });

  if (success) await awardSimSuccess(req.user!.id, attempt.case.skillId, result.score);
  else await awardSimFail(req.user!.id, attempt.case.skillId);
  await checkAchievements(req.user!.id);

  res.json({
    terminal: true,
    success,
    wasCorrect: option.isCorrect,
    feedbackText: option.feedbackText ?? null,
    score: result,
    xpGained: success ? 30 + Math.round(result.score / 10) : 5,
    signalState: signals,
    debrief: await buildDebrief(attemptId, attempt.caseId),
    nextNode: option.nextNode ? { nodeKey: option.nextNode.nodeKey, type: option.nextNode.type, text: option.nextNode.text } : null,
  });
});

router.post("/:attemptId/hint", async (req: any, res) => {
  const attempt = await prisma.simulationAttempt.findUnique({ where: { id: req.params.attemptId }, include: { case: { include: { nodes: true } } } });
  if (!attempt || attempt.userId !== req.user!.id || attempt.status !== "IN_PROGRESS") {
    res.status(404).json({ error: "Active attempt not found." }); return;
  }
  const currentLevel = attempt.hintsUsed;
  if (currentLevel >= HINT_MAX_LEVEL) { res.json({ level: currentLevel, text: "Kamu sudah mencapai level hint maksimum. Gunakan tombol 'Jawab Langsung' jika benar-benar stuck.", maxed: true }); return; }

  const node = await resolveCurrentNode(attempt.id, attempt.caseId);
  if (!node) { res.status(500).json({ error: "Could not determine current node." }); return; }

  const signals = (attempt.signalState ?? {}) as Record<string, string | boolean | number>;
  const options = await prisma.caseOption.findMany({ where: { nodeId: node.id } });
  const hintOptions = options.map((o) => {
    const cond = o.condition as { signal?: string; equals?: string | boolean | number } | null;
    const available = !cond?.signal || signals[cond.signal] === cond.equals;
    return { label: o.label, isCorrect: o.isCorrect, feedbackText: o.feedbackText, available };
  });
  const stepsAtNode = await prisma.simulationStep.count({ where: { attemptId: attempt.id, nodeKey: node.nodeKey } });

  const { level, text } = buildSimulationHint({
    caseTitle: attempt.case.title,
    nodeType: node.type,
    nodeText: node.text,
    nodeDetail: node.detail,
    options: hintOptions,
    attemptsAtNode: stepsAtNode,
    hintsRequested: currentLevel,
  }, currentLevel + 1);
  const finalLevel = level;
  const fullAnswerGiven = finalLevel === 4 || currentLevel + 1 >= HINT_MAX_LEVEL;
  await prisma.simulationAttempt.update({ where: { id: attempt.id }, data: { hintsUsed: finalLevel, fullAnswerGiven: fullAnswerGiven ? true : attempt.fullAnswerGiven } });

  res.json({ level: finalLevel, text, fullAnswer: finalLevel === 4 });
});

router.post("/:attemptId/abandon", async (req: any, res) => {
  const attempt = await prisma.simulationAttempt.findUnique({ where: { id: req.params.attemptId } });
  if (!attempt || attempt.userId !== req.user!.id) { res.status(404).json({ error: "Not found." }); return; }
  await prisma.simulationAttempt.update({ where: { id: req.params.attemptId }, data: { status: "ABANDONED", completedAt: new Date(), success: false, score: 0 } });
  res.json({ ok: true });
});

export default router;