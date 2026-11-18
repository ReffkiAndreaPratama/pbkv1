import { Router } from "express";
import prisma from "../db";
import { requireAuth } from "../middleware/auth";
import { awardMaterialRead, touchStreak, checkAchievements } from "../lib/gamification";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: any, res) => {
  const skillId = req.query.skillId as string | undefined;
  const where = skillId ? { isActive: true, skillId } : { isActive: true };
  const materials = await prisma.material.findMany({ where, include: { skill: { select: { id: true, code: true, name: true } } }, orderBy: [{ order: "asc" }] });
  const reads = await prisma.materialRead.findMany({ where: { userId: req.user!.id } });
  const readSet = new Set(reads.map((r) => r.materialId));
  res.json(materials.map((m) => ({ ...m, completed: readSet.has(m.id) })));
});

router.get("/:id", async (req: any, res) => {
  const m = await prisma.material.findUnique({ where: { id: req.params.id }, include: { skill: true } });
  if (!m) { res.status(404).json({ error: "Material not found." }); return; }
  const userId = req.user!.id;
  const [read, relatedCases, skillTotal, skillReads] = await Promise.all([
    prisma.materialRead.findFirst({ where: { userId, materialId: m.id } }),
    prisma.caseModel.findMany({
      where: { skillId: m.skillId, isActive: true },
      select: { id: true, title: true, difficulty: true, targetSteps: true },
      orderBy: [{ order: "asc" }],
      take: 4,
    }),
    prisma.material.count({ where: { skillId: m.skillId, isActive: true } }),
    prisma.materialRead.findMany({
      where: { userId, material: { skillId: m.skillId, isActive: true } },
      select: { materialId: true },
    }),
  ]);
  res.json({
    ...m,
    completed: !!read,
    readAt: read?.readAt ?? null,
    relatedCases,
    skillProgress: { read: skillReads.length, total: skillTotal },
  });
});

router.post("/:id/read", async (req: any, res) => {
  const userId = req.user!.id;
  const m = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!m) { res.status(404).json({ error: "Material not found." }); return; }
  const existing = await prisma.materialRead.findFirst({ where: { userId, materialId: m.id } });
  if (!existing) {
    await prisma.materialRead.create({ data: { userId, materialId: m.id } });
    await touchStreak(userId);
    await awardMaterialRead(userId, m.id);
    await checkAchievements(userId);
  }
  res.json({ ok: true });
});

export default router;