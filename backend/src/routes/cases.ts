import { Router } from "express";
import prisma from "../db";
import { requireAuth } from "../middleware/auth";
import { recommendPath, loadMastery, allowedDifficulty, tierOf } from "../lib/adaptive";
import { touchStreak } from "../lib/gamification";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: any, res) => {
  const userId = req.user!.id;
  const cases = await prisma.caseModel.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, include: { skill: true } });
  const mastery = await loadMastery(userId);
  const attemptsMap = new Map<string, number>();
  const allAttempts = await prisma.simulationAttempt.groupBy({ by: ["caseId"], where: { userId, success: true }, _count: true });
  allAttempts.forEach((a) => attemptsMap.set(a.caseId, a._count));

  const result = cases.map((c) => {
    const m = mastery.get(c.skill.code)!;
    const cap = allowedDifficulty(m.mastery);
    const locked = c.difficulty === "HARD" && m.mastery < 0.4 || (c.difficulty === "MEDIUM" && m.mastery < 0.25);
    const tries = attemptsMap.get(c.id) ?? 0;
    const priority = (req.user as any).profile?.skillPriority?.includes(c.skill.code) ? 1 : 0;
    const gap = 1 - m.mastery;
    const urgency = Math.round(gap * 60 + (tries === 0 ? 15 : 5) + priority * 25);
    return {
      id: c.id,
      title: c.title,
      difficulty: c.difficulty,
      skill: { code: c.skill.code, name: c.skill.name },
      targetSteps: c.targetSteps,
      locked,
      tries,
      urgency,
      tier: tierOf(m.mastery),
    };
  });
  result.sort((a, b) => b.urgency - a.urgency);
  res.json(result);
});

router.get("/path", async (req: any, res) => {
  const items = await recommendPath(req.user!.id);
  res.json(items);
});

router.get("/history", async (req: any, res) => {
  const rows = await prisma.simulationAttempt.findMany({ where: { userId: req.user!.id }, include: { case: { include: { skill: true } } }, orderBy: { startedAt: "desc" }, take: 50 });
  res.json(rows.map((a) => ({
    id: a.id,
    caseTitle: a.case.title,
    skill: { code: a.case.skill.code, name: a.case.skill.name },
    difficulty: a.case.difficulty,
    score: a.score,
    accuracy: a.accuracy,
    success: a.success,
    status: a.status,
    timeSec: a.timeSec,
    hintsUsed: a.hintsUsed,
    startedAt: a.startedAt,
  })));
});

router.get("/:id", async (req: any, res) => {
  const c = await prisma.caseModel.findUnique({ where: { id: req.params.id }, include: { skill: true, nodes: { include: { options: { include: { nextNode: true } } }, orderBy: { nodeKey: "asc" } } } });
  if (!c) { res.status(404).json({ error: "Case not found." }); return; }
  const nodes = c.nodes.map((n) => ({
    nodeKey: n.nodeKey,
    type: n.type,
    text: n.text,
    detail: n.detail,
    isOnBestPath: n.isOnBestPath,
    options: n.options.map((o) => ({
      optionId: o.id,
      label: o.label,
      targetNodeKey: o.nextNode?.nodeKey ?? null,
      isCorrect: o.isCorrect,
      condition: o.condition ?? null,
      effect: o.effect ?? null,
      feedbackText: o.feedbackText ?? null,
    })),
  }));
  res.json({
    id: c.id,
    title: c.title,
    scenario: c.scenario,
    difficulty: c.difficulty,
    skill: { code: c.skill.code, name: c.skill.name },
    targetSteps: c.targetSteps,
    expectedTimeSec: c.expectedTimeSec,
    nodes,
  });
});

// --- Simulator ---
router.post("/:id/start", async (req: any, res) => {
  const userId = req.user!.id;
  const caseItem = await prisma.caseModel.findUnique({ where: { id: req.params.id }, include: { nodes: true } });
  if (!caseItem) { res.status(404).json({ error: "Case not found." }); return; }
  const startNode = caseItem.nodes.find((n) => n.type === "START");
  if (!startNode) { res.status(500).json({ error: "Case has no START node." }); return; }
  await touchStreak(userId);
  const attempt = await prisma.simulationAttempt.create({
    data: { userId, caseId: caseItem.id, signalState: {} },
  });
  res.status(201).json({ attemptId: attempt.id, currentNode: { nodeKey: startNode.nodeKey, type: startNode.type, text: startNode.text, detail: startNode.detail }, signalState: {} });
});

export default router;