import { Router } from "express";
import { z } from "zod";
import prisma from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const updateSchema = z.object({
  learningStyle: z.enum(["VISUAL", "TEKS", "PRAKTIK"]).optional(),
  targetLevel: z.enum(["DASAR", "MENENGAH", "MAHIR"]).optional(),
  waktuPerSesiMin: z.number().int().min(10).max(120).optional(),
  skillPriority: z.array(z.string()).optional(),
});

router.get("/", async (req: any, res) => {
  const p = await prisma.learningProfile.findUnique({ where: { userId: req.user!.id } });
  res.json(p);
});

router.put("/", async (req: any, res) => {
  const data = updateSchema.parse(req.body);
  const p = await prisma.learningProfile.update({ where: { userId: req.user!.id }, data });
  res.json(p);
});

router.post("/complete", async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { profile: true } });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ ok: true, message: "Onboarding completed." });
});

export default router;