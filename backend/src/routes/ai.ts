import { Router } from "express";
import { z } from "zod";
import { respondToUser, SYSTEM_PROMPT } from "../lib/ai-tutor";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  skillId: z.string().optional(),
  skillName: z.string().optional(),
  contextPage: z.string().optional(),
});

router.post("/chat", async (req: any, res) => {
  const { message, skillId, skillName, contextPage } = chatSchema.parse(req.body);
  const response = respondToUser({ message, skillName, contextPage });
  res.json({ ...response, model: "techtutor-mock" });
});

router.get("/system-prompt", (_req, res) => {
  res.json({ prompt: SYSTEM_PROMPT });
});

export default router;