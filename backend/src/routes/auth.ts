import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../db";
import { requireAuth, signToken } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8).regex(/[A-Za-z]/).regex(/[0-9]/, "Password must contain at least one number"),
});

const loginSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string(),
});

router.post("/register", async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ error: "Email already registered." });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, password: passwordHash, profile: { create: { skillPriority: [] } } },
  });
  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: { select: { pretestDone: true, posttestDone: true, level: true, totalXp: true } } } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, profile: user.profile },
  });
});

router.use(requireAuth);

router.get("/me", async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { profile: { select: { pretestDone: true, posttestDone: true, posttestScore: true, totalXp: true, level: true, streakDays: true, learningStyle: true, targetLevel: true } } },
  });
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  const { password, ...safe } = user;
  res.json(safe);
});

router.post("/logout", (_req, res) => { res.json({ ok: true }); });

export default router;