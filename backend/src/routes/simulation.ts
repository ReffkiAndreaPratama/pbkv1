import { Router } from "express";
import prisma from "../db";
import { requireAuth } from "../middleware/auth";
import { updateMasteryFromSimulation } from "../lib/adaptive";
import { scoreSimulation, type SimScoringInput } from "../lib/scoring";
import { HINT_MAX_LEVEL, buildHintText } from "../lib/hint";
import { awardSimSuccess, awardSimFail, checkAchievements } from "../lib/gamification";

const router = Router();
router.use(requireAuth);

async function currentNodeWithOptions(attemptId: string, caseId: string) {
  const lastStep = await prisma.simulationStep.findFirst({ where: { attemptId }, orderBy: { at: "desc" } });
  let node;
  if (!lastStep) {
    node = await prisma.caseNode.findFirst({ where: { caseId, type: "START" } });
  } else {
    const lastOption = await prisma.caseOption.findFirst({
      where: { caseId, label: lastStep.optionLabel },
      include: { nextNode: true },
    });
    node = lastOption?.nextNode ?? (await prisma.caseNode.findFirst({ where: { caseId, type: "START" } }));
  }
  if (!node) return null;
  const options = await prisma.caseOption.findMany({ where: { nodeId: node.id }, include: { nextNode: true } });
  return {
    node: {
      nodeKey: node.nodeKey,
      type: node.type,
      text: node.text,
      detail: node.detail,
      options: options.map((o) => ({
        optionId: o.id,
        label: o.label,
        targetNodeKey: o.nextNode?.nodeKey ?? null,
        isCorrect: o.isCorrect,
        condition: o.condition ?? null,
        effect: o.effect ?? null,
        feedbackText: o.feedbackText ?? null,
      })),
    },
    signals: {} as Record<string, string | boolean | number>,
  };
}

router.get("/:attemptId", async (req: any, res) => {
  const attempt = await prisma.simulationAttempt.findUnique({ where: { id: req.params.attemptId }, include: { case: { include: { skill: true } } } });
  if (!attempt || attempt.userId !== req.user!.id) { res.status(404).json({ error: "Attempt not found." }); return; }

  if (attempt.status !== "IN_PROGRESS") {
    res.json({
      status: attempt.status === "ABANDONED" ? "ABANDONED" : "COMPLETED",
      caseTitle: attempt.case.title,
      skill: attempt.case.skill,
      score: attempt.score,
      accuracy: attempt.accuracy,
      success: attempt.success,
      totalMoves: attempt.totalMoves,
      wrongMoves: attempt.wrongMoves,
      timeSec: attempt.timeSec,
      hintsUsed: attempt.hintsUsed,
    });
    return;
  }

  const state = await currentNodeWithOptions(attempt.id, attempt.caseId);
  if (!state) { res.status(500).json({ error: "Could not determine current node." }); return; }
  const { node, signals } = state;

  res.json({
    status: "IN_PROGRESS",
    caseTitle: attempt.case.title,
    skill: attempt.case.skill,
    currentNode: node,
    signalState: attempt.signalState ?? signals,
  });
});

router.post("/:attemptId/submit", async (req: any, res) => {
  const { attemptId } = req.params;
  const { optionId } = req.body as { optionId: string };
  if (!optionId) { res.status(422).json({ error: "optionId required." }); return; }

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
    data: { attemptId, nodeKey: attempt.case.nodes.find((n) => n.options.some((o) => o.id === option.id))?.nodeKey ?? "", optionLabel: option.label, wasCorrect: option.isCorrect, hintLevel: 0 },
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
        options: nextOptions.map((o) => ({
          optionId: o.id,
          label: o.label,
          targetNodeKey: o.nextNode?.nodeKey ?? null,
          isCorrect: o.isCorrect,
          condition: o.condition ?? null,
          effect: o.effect ?? null,
          feedbackText: o.feedbackText ?? null,
        })),
      },
      signalState: signals,
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
    feedbackText: option.feedbackText ?? null,
    score: result,
    xpGained: success ? 30 + Math.round(result.score / 10) : 5,
    nextNode: option.nextNode ? { nodeKey: option.nextNode.nodeKey, type: option.nextNode.type, text: option.nextNode.text } : null,
  });
});

router.post("/:attemptId/hint", async (req: any, res) => {
  const attempt = await prisma.simulationAttempt.findUnique({ where: { id: req.params.attemptId }, include: { case: { include: { nodes: true } } } });
  if (!attempt || attempt.userId !== req.user!.id || attempt.status !== "IN_PROGRESS") {
    res.status(404).json({ error: "Active attempt not found." }); return;
  }
  const lastStep = await prisma.simulationStep.findFirst({ where: { attemptId: req.params.attemptId }, orderBy: { at: "desc" } });
  const currentNode = lastStep?.nodeKey ?? "start";
  const stepsAtNode = await prisma.simulationStep.count({ where: { attemptId: req.params.attemptId, nodeKey: currentNode } });
  const currentLevel = attempt.hintsUsed;
  if (currentLevel >= HINT_MAX_LEVEL) { res.json({ level: currentLevel, text: "Kamu sudah mencapai level hint maksimum. Gunakan tombol 'Jawab Langsung' jika benar-benar stuck.", maxed: true }); return; }

  const ctx = { nodeText: "", attemptsAtNode: stepsAtNode, hintsRequested: currentLevel, caseTitle: attempt.case.title };
  const { level, text } = buildHintText(ctx);
  const finalLevel = Math.min(level, currentLevel + 1);
  const fullAnswerGiven = finalLevel === 4 || currentLevel + 1 >= HINT_MAX_LEVEL;
  await prisma.simulationAttempt.update({ where: { id: req.params.attemptId }, data: { hintsUsed: finalLevel, fullAnswerGiven: fullAnswerGiven ? true : attempt.fullAnswerGiven } });

  res.json({ level: finalLevel, text, fullAnswer: finalLevel === 4 });
});

router.post("/:attemptId/abandon", async (req: any, res) => {
  const attempt = await prisma.simulationAttempt.findUnique({ where: { id: req.params.attemptId } });
  if (!attempt || attempt.userId !== req.user!.id) { res.status(404).json({ error: "Not found." }); return; }
  await prisma.simulationAttempt.update({ where: { id: req.params.attemptId }, data: { status: "ABANDONED", completedAt: new Date(), success: false, score: 0 } });
  res.json({ ok: true });
});

export default router;