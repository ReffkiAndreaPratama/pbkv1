import { Router } from "express";
import { z } from "zod";
import prisma from "../db";
import { requireAuth } from "../middleware/auth";
import { updateMasteryFromQuiz } from "../lib/adaptive";
import { awardQuizCorrect, awardPretestDone, awardPosttestDone, touchStreak, checkAchievements } from "../lib/gamification";
import {
  EXAM_CONFIG,
  examDeadline,
  examRemainingSec,
  hashSeed,
  pickExamQuestions,
  scoreExam,
} from "../lib/exam";

const router = Router();
router.use(requireAuth);

// --- helpers ---
const pick = <T>(arr: T[], n: number) => {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length > 0 && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy[i]!);
    copy.splice(i, 1);
  }
  return out;
};

const selectPublic = (q: { id: string; prompt: string; options: unknown; difficulty: string; imageUrl: string | null; videoUrl: string | null }) => {
  const opts = (q.options ?? []) as { id?: string; key?: string; text: string }[];
  return {
    id: q.id,
    prompt: q.prompt,
    options: opts.map((o) => ({ key: o.key ?? o.id ?? "", text: o.text })),
    difficulty: q.difficulty,
    imageUrl: q.imageUrl,
    videoUrl: q.videoUrl,
  };
};

// --- Pretest ---
router.get("/pretest", async (_req, res) => {
  const all = await prisma.question.findMany({ where: { isActive: true }, orderBy: { id: "asc" } });
  const qs = all.filter((q) => (q.phases as string[] ?? []).includes("PRETEST"));
  res.json(pick(qs, 10).map(selectPublic));
});

router.post("/pretest/start", async (req: any, res) => {
  await touchStreak(req.user!.id);
  const session = await prisma.quizSession.create({
    data: { userId: req.user!.id, type: "PRETEST" },
  });
  res.status(201).json({ sessionId: session.id });
});

const answerSchema = z.object({
  sessionId: z.string(),
  answers: z.array(z.object({ questionId: z.string(), selectedKeys: z.array(z.string()) })),
});

// Pembahasan per jawaban untuk layar review setelah kuis selesai.
const buildReview = (
  answers: { questionId: string; selectedKeys: string[] }[],
  questions: { id: string; prompt: string; options: unknown; correctKeys: unknown; explanation: string }[]
) => {
  return answers
    .map((a) => {
      const q = questions.find((x) => x.id === a.questionId);
      if (!q) return null;
      const opts = (q.options ?? []) as { id?: string; key?: string; text: string }[];
      const selected = (a.selectedKeys ?? []).slice().sort();
      const correct = ((q.correctKeys as string[]) ?? []).slice().sort();
      const isCorrect = JSON.stringify(selected) === JSON.stringify(correct);
      return {
        prompt: q.prompt,
        options: opts.map((o) => ({ key: o.key ?? o.id ?? "", text: o.text })),
        selectedKeys: a.selectedKeys,
        correctKeys: q.correctKeys as string[],
        isCorrect,
        explanation: q.explanation,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
};

router.post("/pretest/submit", async (req: any, res) => {
  const userId = req.user!.id;
  const { sessionId, answers } = answerSchema.parse(req.body);
  const session = await prisma.quizSession.findFirst({ where: { id: sessionId, userId, type: "PRETEST" } });
  if (!session) { res.status(404).json({ error: "Session not found." }); return; }
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });

  let correctCount = 0;
  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId);
    if (!q) continue;
    const isCorrect = JSON.stringify(a.selectedKeys.sort()) === JSON.stringify((q.correctKeys as string[]).sort());
    if (isCorrect) correctCount++;
    await prisma.quizAnswer.create({
      data: { sessionId, questionId: q.id, selectedKeys: a.selectedKeys, isCorrect, hintUsed: false },
    });
    // Update mastery per skill
    const sm = await prisma.skillMastery.findFirst({ where: { userId, skillId: q.skillId } });
    const current = sm?.mastery ?? 0;
    const newM = updateMasteryFromQuiz(current, isCorrect, false, q.difficulty as "EASY" | "MEDIUM" | "HARD");
    await prisma.skillMastery.upsert({
      where: { userId_skillId: { userId, skillId: q.skillId } },
      create: { userId, skillId: q.skillId, mastery: newM },
      update: { mastery: newM },
    });
    if (isCorrect) await awardQuizCorrect(userId, q.skillId);
  }

  const totalCount = answers.length || 1;
  const score = Math.round((correctCount / totalCount) * 100);
  await prisma.quizSession.update({ where: { id: sessionId }, data: { completedAt: new Date(), correctCount, totalCount, score } });
  await prisma.learningProfile.update({ where: { userId }, data: { pretestDone: true } });
  await awardPretestDone(userId, score);
  await checkAchievements(userId);
  res.json({ score, correctCount, totalCount, review: buildReview(answers, questions) });
});

// --- Posttest ---
router.get("/posttest", async (_req, res) => {
  const all = await prisma.question.findMany({ where: { isActive: true } });
  const qs = all.filter((q) => (q.phases as string[] ?? []).includes("POSTTEST"));
  // distribution: 4E 4M 2H
  const easy = pick(qs.filter((q) => q.difficulty === "EASY"), 4);
  const med = pick(qs.filter((q) => q.difficulty === "MEDIUM"), 4);
  const hard = pick(qs.filter((q) => q.difficulty === "HARD"), 2);
  res.json([...easy, ...med, ...hard].map(selectPublic));
});

router.post("/posttest/start", async (req: any, res) => {
  const session = await prisma.quizSession.create({ data: { userId: req.user!.id, type: "POSTTEST" } });
  res.status(201).json({ sessionId: session.id });
});

router.post("/posttest/submit", async (req: any, res) => {
  const userId = req.user!.id;
  const { sessionId, answers } = answerSchema.parse(req.body);
  const session = await prisma.quizSession.findFirst({ where: { id: sessionId, userId, type: "POSTTEST" } });
  if (!session) { res.status(404).json({ error: "Session not found." }); return; }
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });

  let correctCount = 0;
  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId);
    if (!q) continue;
    const isCorrect = JSON.stringify(a.selectedKeys.sort()) === JSON.stringify((q.correctKeys as string[]).sort());
    if (isCorrect) correctCount++;
    await prisma.quizAnswer.create({
      data: { sessionId, questionId: q.id, selectedKeys: a.selectedKeys, isCorrect, hintUsed: false },
    });
  }

  const totalCount = answers.length || 1;
  const score = Math.round((correctCount / totalCount) * 100);
  await prisma.quizSession.update({ where: { id: sessionId }, data: { completedAt: new Date(), correctCount, totalCount, score } });
  await prisma.learningProfile.update({ where: { userId }, data: { posttestDone: true, posttestScore: score } });
  await awardPosttestDone(userId, score);
  await checkAchievements(userId);
  res.json({ score, correctCount, totalCount, passed: score >= 70, review: buildReview(answers, questions) });
});

// --- Adaptive ---
router.get("/adaptive", async (req, res) => {
  const skillId = req.query.skillId as string;
  const where = skillId ? { skillId, isActive: true } : { isActive: true };
  const all = await prisma.question.findMany({ where });
  const qs = all.filter((q) => (q.phases as string[] ?? []).includes("ADAPTIVE"));
  res.json(pick(qs, 10).map(selectPublic));
});

router.post("/adaptive/start", async (req: any, res) => {
  const session = await prisma.quizSession.create({ data: { userId: req.user!.id, type: "ADAPTIVE" } });
  res.status(201).json({ sessionId: session.id });
});

router.post("/adaptive/submit", async (req: any, res) => {
  const userId = req.user!.id;
  const { sessionId, answers } = answerSchema.parse(req.body);
  const session = await prisma.quizSession.findFirst({ where: { id: sessionId, userId, type: "ADAPTIVE" } });
  if (!session) { res.status(404).json({ error: "Session not found." }); return; }
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
  let correctCount = 0;
  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId);
    if (!q) continue;
    const isCorrect = JSON.stringify(a.selectedKeys.sort()) === JSON.stringify((q.correctKeys as string[]).sort());
    if (isCorrect) correctCount++;
    await prisma.quizAnswer.create({ data: { sessionId, questionId: q.id, selectedKeys: a.selectedKeys, isCorrect, hintUsed: false } });
    const sm = await prisma.skillMastery.findFirst({ where: { userId, skillId: q.skillId } });
    const newM = updateMasteryFromQuiz(sm?.mastery ?? 0, isCorrect, false, q.difficulty as any);
    await prisma.skillMastery.upsert({ where: { userId_skillId: { userId, skillId: q.skillId } }, create: { userId, skillId: q.skillId, mastery: newM }, update: { mastery: newM } });
    if (isCorrect) await awardQuizCorrect(userId, q.skillId);
  }
  const totalCount = answers.length || 1;
  const score = Math.round((correctCount / totalCount) * 100);
  await prisma.quizSession.update({ where: { id: sessionId }, data: { completedAt: new Date(), correctCount, totalCount, score } });
  await checkAchievements(userId);
  res.json({ score, correctCount, totalCount, review: buildReview(answers, questions) });
});

// --- Latihan (adaptive practice) ------------------------------------------------
// Mode latihan berbeda dari ujian: jawaban diperiksa satu per satu, pembahasan
// langsung muncul, dan tidak ada timer maupun batas percobaan.

const asKeys = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);
const sameKeys = (a: string[], b: string[]) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

const practiceAnswerSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  selectedKeys: z.array(z.string()).min(1),
  hintUsed: z.boolean().optional(),
});

router.post("/adaptive/answer", async (req: any, res) => {
  const userId = req.user!.id;
  const body = practiceAnswerSchema.parse(req.body);
  const session = await prisma.quizSession.findFirst({
    where: { id: body.sessionId, userId, type: "ADAPTIVE" },
  });
  if (!session) {
    res.status(404).json({ error: "Sesi latihan tidak ditemukan." });
    return;
  }
  if (session.completedAt) {
    res.status(409).json({ error: "Sesi latihan sudah selesai." });
    return;
  }

  const q = await prisma.question.findFirst({ where: { id: body.questionId, isActive: true } });
  if (!q) {
    res.status(404).json({ error: "Soal tidak ditemukan." });
    return;
  }

  const correctKeys = asKeys(q.correctKeys);
  const isCorrect = sameKeys(body.selectedKeys, correctKeys);
  await prisma.quizAnswer.create({
    data: {
      sessionId: body.sessionId,
      questionId: q.id,
      selectedKeys: body.selectedKeys,
      isCorrect,
      hintUsed: !!body.hintUsed,
    },
  });

  const sm = await prisma.skillMastery.findFirst({ where: { userId, skillId: q.skillId } });
  const newM = updateMasteryFromQuiz(
    sm?.mastery ?? 0,
    isCorrect,
    !!body.hintUsed,
    q.difficulty as "EASY" | "MEDIUM" | "HARD"
  );
  await prisma.skillMastery.upsert({
    where: { userId_skillId: { userId, skillId: q.skillId } },
    create: { userId, skillId: q.skillId, mastery: newM },
    update: { mastery: newM },
  });
  if (isCorrect) await awardQuizCorrect(userId, q.skillId);

  res.json({
    isCorrect,
    correctKeys,
    explanation: q.explanation,
    difficulty: q.difficulty,
  });
});

const hintSchema = z.object({ questionId: z.string() });

router.post("/adaptive/hint", async (req, res) => {
  const { questionId } = hintSchema.parse(req.body);
  const q = await prisma.question.findFirst({ where: { id: questionId, isActive: true } });
  if (!q) {
    res.status(404).json({ error: "Soal tidak ditemukan." });
    return;
  }
  const options = (q.options ?? []) as { id?: string; key?: string; text: string }[];
  const keys = options.map((o) => o.key ?? o.id ?? "").filter(Boolean);
  const correct = asKeys(q.correctKeys);
  const wrong = keys.filter((k) => !correct.includes(k));
  // Sisakan minimal satu opsi salah agar jawaban tidak langsung terbuka.
  const eliminate = pick(wrong, Math.min(2, Math.max(0, wrong.length - 1)));
  res.json({ eliminate });
});

router.post("/adaptive/finish", async (req: any, res) => {
  const userId = req.user!.id;
  const { sessionId } = z.object({ sessionId: z.string() }).parse(req.body);
  const session = await prisma.quizSession.findFirst({
    where: { id: sessionId, userId, type: "ADAPTIVE" },
  });
  if (!session) {
    res.status(404).json({ error: "Sesi latihan tidak ditemukan." });
    return;
  }

  const answers = await prisma.quizAnswer.findMany({ where: { sessionId } });
  const questions = await prisma.question.findMany({
    where: { id: { in: answers.map((a) => a.questionId) } },
  });
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalCount = answers.length || 1;
  const score = Math.round((correctCount / totalCount) * 100);

  if (!session.completedAt) {
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { completedAt: new Date(), correctCount, totalCount: answers.length, score },
    });
    await checkAchievements(userId);
  }

  res.json({
    score,
    correctCount,
    totalCount: answers.length,
    review: buildReview(
      answers.map((a) => ({ questionId: a.questionId, selectedKeys: asKeys(a.selectedKeys) })),
      questions
    ),
  });
});

// --- Ujian akhir (exam) --------------------------------------------------------
// Berbeda dari latihan: soal terikat ke sesi, ada countdown, tidak ada hint,
// tidak ada umpan balik sebelum submit, dan kelulusan memakai KKM.

async function loadExamSet(sessionId: string) {
  const all = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
    include: { skill: true },
  });
  const pool = all.filter((q) => ((q.phases as string[] | null) ?? []).includes("POSTTEST"));
  return pickExamQuestions(pool, hashSeed(sessionId));
}

async function examPayload(session: { id: string; startedAt: Date }) {
  const set = await loadExamSet(session.id);
  const saved = await prisma.quizAnswer.findMany({ where: { sessionId: session.id } });
  return {
    sessionId: session.id,
    startedAt: session.startedAt,
    deadlineAt: examDeadline(session.startedAt),
    durationSec: EXAM_CONFIG.durationSec,
    passScore: EXAM_CONFIG.passScore,
    maxAttempts: EXAM_CONFIG.maxAttempts,
    questionCount: set.length,
    remainingSec: examRemainingSec(session.startedAt),
    questions: set.map(selectPublic),
    savedAnswers: saved.map((a) => ({
      questionId: a.questionId,
      selectedKeys: asKeys(a.selectedKeys),
    })),
  };
}

async function buildExamResult(
  session: { id: string; startedAt: Date; completedAt: Date | null },
  timedOut: boolean
) {
  const set = await loadExamSet(session.id);
  const ids = new Set(set.map((q) => q.id));
  const answers = await prisma.quizAnswer.findMany({ where: { sessionId: session.id } });
  const byQuestion = new Map(
    answers.filter((a) => ids.has(a.questionId)).map((a) => [a.questionId, a])
  );
  const correctCount = [...byQuestion.values()].filter((a) => a.isCorrect).length;
  const { score, passed, passScore } = scoreExam(correctCount, set.length);

  const skillMap = new Map<string, { code: string; name: string; total: number; correct: number }>();
  for (const q of set) {
    const key = q.skill?.code ?? q.skillId;
    const row = skillMap.get(key) ?? {
      code: q.skill?.code ?? key,
      name: q.skill?.name ?? key,
      total: 0,
      correct: 0,
    };
    row.total += 1;
    if (byQuestion.get(q.id)?.isCorrect) row.correct += 1;
    skillMap.set(key, row);
  }

  const elapsedAtSubmit = session.completedAt
    ? (session.completedAt.getTime() - session.startedAt.getTime()) / 1000
    : 0;
  const actuallyTimedOut =
    timedOut || elapsedAtSubmit > EXAM_CONFIG.durationSec + EXAM_CONFIG.graceSec;

  return {
    sessionId: session.id,
    score,
    correctCount,
    totalCount: set.length,
    passed,
    passScore,
    timedOut: actuallyTimedOut,
    perSkill: [...skillMap.values()],
    review: set.map((q) => {
      const answer = byQuestion.get(q.id);
      const selectedKeys = answer ? asKeys(answer.selectedKeys) : [];
      const correctKeys = asKeys(q.correctKeys);
      return {
        prompt: q.prompt,
        options: ((q.options ?? []) as { id?: string; key?: string; text: string }[]).map((o) => ({
          key: o.key ?? o.id ?? "",
          text: o.text,
        })),
        selectedKeys,
        correctKeys,
        isCorrect: !!answer?.isCorrect,
        explanation: q.explanation,
      };
    }),
  };
}

async function finalizeExam(
  session: { id: string; userId: string; startedAt: Date; completedAt: Date | null },
  timedOut: boolean
) {
  if (session.completedAt) return buildExamResult(session, timedOut);

  const set = await loadExamSet(session.id);
  const ids = new Set(set.map((q) => q.id));
  const answers = await prisma.quizAnswer.findMany({ where: { sessionId: session.id } });
  const correctCount = answers.filter((a) => ids.has(a.questionId) && a.isCorrect).length;
  const { score } = scoreExam(correctCount, set.length);

  await prisma.quizSession.update({
    where: { id: session.id },
    data: { completedAt: new Date(), score, correctCount, totalCount: set.length },
  });

  const priorAttempts = await prisma.quizSession.count({
    where: {
      userId: session.userId,
      type: "POSTTEST",
      completedAt: { not: null },
      id: { not: session.id },
    },
  });
  const profile = await prisma.learningProfile.findUnique({ where: { userId: session.userId } });
  const bestScore = Math.max(profile?.posttestScore ?? 0, score);
  await prisma.learningProfile.update({
    where: { userId: session.userId },
    data: { posttestDone: true, posttestScore: bestScore },
  });
  // XP ujian hanya diberikan pada penyelesaian pertama, bukan setiap remedial.
  if (priorAttempts === 0) await awardPosttestDone(session.userId, score);
  await checkAchievements(session.userId);

  return buildExamResult(
    { ...session, completedAt: new Date() },
    timedOut
  );
}

const examStartSchema = z.object({ sessionId: z.string().optional() }).optional();

router.post("/exam/start", async (req: any, res) => {
  const userId = req.user!.id;
  const body = examStartSchema.parse(req.body ?? {});

  if (body?.sessionId) {
    const existing = await prisma.quizSession.findFirst({
      where: { id: body.sessionId, userId, type: "POSTTEST" },
    });
    if (existing) {
      if (existing.completedAt) {
        res.json({ completed: true, result: await buildExamResult(existing, false) });
        return;
      }
      if (examRemainingSec(existing.startedAt) > 0) {
        res.json({ completed: false, ...(await examPayload(existing)) });
        return;
      }
      const result = await finalizeExam(existing, true);
      res.json({ completed: true, result });
      return;
    }
  }

  const active = await prisma.quizSession.findFirst({
    where: { userId, type: "POSTTEST", completedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (active) {
    if (examRemainingSec(active.startedAt) > 0) {
      res.json({ completed: false, ...(await examPayload(active)) });
      return;
    }
    const result = await finalizeExam(active, true);
    res.json({ completed: true, result });
    return;
  }

  const attemptsUsed = await prisma.quizSession.count({
    where: { userId, type: "POSTTEST", completedAt: { not: null } },
  });
  if (attemptsUsed >= EXAM_CONFIG.maxAttempts) {
    res.status(403).json({
      error: `Batas ${EXAM_CONFIG.maxAttempts} percobaan ujian sudah tercapai. Hubungi instruktur untuk reset.`,
    });
    return;
  }

  const session = await prisma.quizSession.create({
    data: { userId, type: "POSTTEST" },
  });
  res.status(201).json({
    completed: false,
    attemptsUsed,
    ...(await examPayload(session)),
  });
});

router.get("/exam/info", async (req: any, res) => {
  const userId = req.user!.id;
  const profile = await prisma.learningProfile.findUnique({ where: { userId } });
  let active = await prisma.quizSession.findFirst({
    where: { userId, type: "POSTTEST", completedAt: null },
    orderBy: { startedAt: "desc" },
  });
  // Sesi yang sudah lewat waktu langsung diselesaikan agar hitungan percobaan akurat.
  if (active && examRemainingSec(active.startedAt) <= 0) {
    await finalizeExam(active, true);
    active = null;
  }
  const attemptsUsed = await prisma.quizSession.count({
    where: { userId, type: "POSTTEST", completedAt: { not: null } },
  });
  res.json({
    attemptsUsed,
    maxAttempts: EXAM_CONFIG.maxAttempts,
    remainingAttempts: Math.max(0, EXAM_CONFIG.maxAttempts - attemptsUsed),
    passScore: EXAM_CONFIG.passScore,
    durationSec: EXAM_CONFIG.durationSec,
    questionCount: EXAM_CONFIG.questionCount,
    bestScore: profile?.posttestScore ?? null,
    activeSessionId: active?.id ?? null,
    activeRemainingSec: active ? examRemainingSec(active.startedAt) : 0,
  });
});

router.get("/exam/:sessionId", async (req: any, res) => {
  const session = await prisma.quizSession.findFirst({
    where: { id: req.params.sessionId, userId: req.user!.id, type: "POSTTEST" },
  });
  if (!session) {
    res.status(404).json({ error: "Sesi ujian tidak ditemukan." });
    return;
  }
  if (session.completedAt) {
    res.json({ completed: true, result: await buildExamResult(session, false) });
    return;
  }
  if (examRemainingSec(session.startedAt) <= 0) {
    const result = await finalizeExam(session, true);
    res.json({ completed: true, result });
    return;
  }
  res.json({ completed: false, ...(await examPayload(session)) });
});

const examAnswerSchema = z.object({
  questionId: z.string(),
  selectedKeys: z.array(z.string()),
});

router.post("/exam/:sessionId/answer", async (req: any, res) => {
  const userId = req.user!.id;
  const body = examAnswerSchema.parse(req.body);
  const session = await prisma.quizSession.findFirst({
    where: { id: req.params.sessionId, userId, type: "POSTTEST" },
  });
  if (!session || session.completedAt) {
    res.status(409).json({ error: "Sesi ujian tidak aktif." });
    return;
  }

  const set = await loadExamSet(session.id);
  const question = set.find((q) => q.id === body.questionId);
  if (!question) {
    res.status(422).json({ error: "Soal bukan bagian dari ujian ini." });
    return;
  }

  const isCorrect = sameKeys(body.selectedKeys, asKeys(question.correctKeys));
  const existing = await prisma.quizAnswer.findFirst({
    where: { sessionId: session.id, questionId: body.questionId },
  });
  if (existing) {
    await prisma.quizAnswer.update({
      where: { id: existing.id },
      data: { selectedKeys: body.selectedKeys, isCorrect },
    });
  } else {
    await prisma.quizAnswer.create({
      data: {
        sessionId: session.id,
        questionId: body.questionId,
        selectedKeys: body.selectedKeys,
        isCorrect,
      },
    });
  }

  res.json({ ok: true, savedAt: new Date() });
});

const examSubmitSchema = z
  .object({
    answers: z
      .array(z.object({ questionId: z.string(), selectedKeys: z.array(z.string()) }))
      .optional(),
  })
  .optional();

router.post("/exam/:sessionId/submit", async (req: any, res) => {
  const userId = req.user!.id;
  const session = await prisma.quizSession.findFirst({
    where: { id: req.params.sessionId, userId, type: "POSTTEST" },
  });
  if (!session) {
    res.status(404).json({ error: "Sesi ujian tidak ditemukan." });
    return;
  }
  if (session.completedAt) {
    res.json(await buildExamResult(session, false));
    return;
  }

  const body = examSubmitSchema.parse(req.body ?? {});
  if (body?.answers?.length) {
    const set = await loadExamSet(session.id);
    const byId = new Map(set.map((q) => [q.id, q]));
    for (const answer of body.answers) {
      const question = byId.get(answer.questionId);
      if (!question) continue;
      const isCorrect = sameKeys(answer.selectedKeys, asKeys(question.correctKeys));
      const existing = await prisma.quizAnswer.findFirst({
        where: { sessionId: session.id, questionId: answer.questionId },
      });
      if (existing) {
        await prisma.quizAnswer.update({
          where: { id: existing.id },
          data: { selectedKeys: answer.selectedKeys, isCorrect },
        });
      } else {
        await prisma.quizAnswer.create({
          data: {
            sessionId: session.id,
            questionId: answer.questionId,
            selectedKeys: answer.selectedKeys,
            isCorrect,
          },
        });
      }
    }
  }

  const timedOut = examRemainingSec(session.startedAt) <= 0;
  res.json(await finalizeExam(session, timedOut));
});

export default router;