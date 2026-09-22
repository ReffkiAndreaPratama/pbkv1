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
  const read = await prisma.materialRead.findFirst({ where: { userId: req.user!.id, materialId: m.id } });
  res.json({ ...m, completed: !!read, readAt: read?.readAt ?? null });
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