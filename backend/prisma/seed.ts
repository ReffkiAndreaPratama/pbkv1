import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CASES, SKILLS, type SeedCase } from "./seed/cases-data";
import { QUESTIONS, MATERIALS, ACHIEVEMENTS, SKILL_QUESTION_MEDIA } from "./seed/static-data";
import { EXTRA_QUESTIONS, EXTRA_MATERIALS } from "./seed/static-data-extra";
import { EXTRA_CASES } from "./seed/cases-data-extra";

const prisma = new PrismaClient();

async function wipe() {
  // Delete in dependency order (children first).
  await prisma.$transaction([
    prisma.caseOption.deleteMany(),
    prisma.caseNode.deleteMany(),
    prisma.caseModel.deleteMany(),
    prisma.materialRead.deleteMany(),
    prisma.material.deleteMany(),
    prisma.quizAnswer.deleteMany(),
    prisma.quizSession.deleteMany(),
    prisma.question.deleteMany(),
    prisma.simulationStep.deleteMany(),
    prisma.simulationAttempt.deleteMany(),
    prisma.skillMastery.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.userAchievement.deleteMany(),
    prisma.achievement.deleteMany(),
    prisma.learningProfile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.skill.deleteMany(),
  ]);
}

async function seedSkills() {
  const map = new Map<string, string>();
  for (const s of SKILLS) {
    const skill = await prisma.skill.create({ data: { code: s.code, name: s.name, description: s.description } });
    map.set(s.code, skill.id);
  }
  return (code: string) => {
    const id = map.get(code);
    if (!id) throw new Error(`Skill not found: ${code}`);
    return id;
  };
}

async function seedCase(c: SeedCase, skillId: (code: string) => string) {
  const created = await prisma.caseModel.create({
    data: {
      skillId: skillId(c.skill),
      title: c.title,
      scenario: c.scenario,
      difficulty: c.difficulty,
      targetSteps: c.targetSteps,
      expectedTimeSec: c.targetSteps * 50,
    },
  });

  const keyToId = new Map<string, string>();
  for (const n of c.nodes) {
    const node = await prisma.caseNode.create({
      data: {
        caseId: created.id,
        nodeKey: n.key,
        type: n.type,
        text: n.text,
        detail: n.detail ?? null,
        isOnBestPath: n.best ?? false,
      },
    });
    keyToId.set(n.key, node.id);
  }

  for (const n of c.nodes) {
    if (!n.options) continue;
    const nodeId = keyToId.get(n.key)!;
    for (const o of n.options) {
      const nextId = o.target ? keyToId.get(o.target) : null;
      await prisma.caseOption.create({
        data: {
          caseId: created.id,
          nodeId,
          label: o.label,
          nextNodeId: nextId ?? null,
          isCorrect: o.correct ?? false,
          condition: o.condition ?? null,
          effect: o.effect ?? null,
          feedbackText: o.feedback ?? null,
        },
      });
    }
  }
}

async function seedUsers() {
  const password = (pwd: string) => bcrypt.hashSync(pwd, 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@techtutor.app",
      name: "Admin TechTutor",
      password: password("admin1234"),
      role: "ADMIN",
      profile: {
        create: { learningStyle: "TEKS", targetLevel: "MAHIR", waktuPerSesiMin: 60, skillPriority: [] },
      },
    },
  });

  const demo = await prisma.user.create({
    data: {
      email: "demo1@techtutor.app",
      name: "Demo Mahasiswa",
      password: password("demo1234"),
      profile: {
        create: {
          learningStyle: "PRAKTIK",
          targetLevel: "MENENGAH",
          waktuPerSesiMin: 30,
          skillPriority: [],
          pretestDone: true,
          posttestDone: true,
          posttestScore: 85,
          totalXp: 340,
          level: 2,
          streakDays: 3,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "demo2@techtutor.app",
      name: "Demo Siswa",
      password: password("demo1234"),
    },
  });

  return { admin, demo };
}

async function seedDemoProgress(demoId: string) {
  const skills = await prisma.skill.findMany({ select: { id: true, code: true } });
  const skillByCode = new Map(skills.map((s) => [s.code, s.id]));
  const partialMastery: Record<string, number> = {
    POWER: 0.8,
    BOOT: 0.55,
    NETWORK: 0.4,
    STORAGE: 0.6,
    DISPLAY: 0.85,
    PERIPHERAL: 0.3,
  };
  for (const [code, mastery] of Object.entries(partialMastery)) {
    await prisma.skillMastery.create({
      data: {
        userId: demoId,
        skillId: skillByCode.get(code)!,
        mastery,
        attempts: 2,
        successes: code === "POWER" || code === "DISPLAY" ? 2 : 1,
      },
    });
  }
  await prisma.activityLog.create({
    data: { userId: demoId, type: "PRETEST", meta: { score: 62 }, points: 40 },
  });
  await prisma.activityLog.create({
    data: { userId: demoId, type: "POSTTEST", meta: { score: 85 }, points: 100 },
  });
  const firstStep = await prisma.achievement.findUnique({ where: { code: "FIRST_STEP" } });
  if (firstStep) {
    await prisma.userAchievement.create({ data: { userId: demoId, achievementId: firstStep.id } });
    await prisma.activityLog.create({
      data: { userId: demoId, type: "ACHIEVEMENT", refId: firstStep.id, points: firstStep.xpReward },
    });
  }
}

async function main() {
  console.log("🧹 wiping...");
  await wipe();

  console.log("🎯 seeding skills...");
  const skillId = await seedSkills();

  console.log("🧩 seeding cases...");
  for (const c of [...CASES, ...EXTRA_CASES]) {
    await seedCase(c, skillId);
  }

  console.log("📚 seeding materials...");
  for (const m of [...MATERIALS, ...EXTRA_MATERIALS]) {
    const content = m.sections.map((s) => `## ${s.title}\n\n${s.body}`).join("\n\n");
    await prisma.material.create({
      data: { skillId: skillId(m.skill), title: m.title, summary: m.summary, content, order: m.order, imageUrl: m.imageUrl ?? null, videoUrl: m.videoUrl ?? null, links: null },
    });
  }

  console.log("❓ seeding questions...");
  const questionMediaCount: Record<string, number> = {};
  for (const q of [...QUESTIONS, ...EXTRA_QUESTIONS]) {
    const media = SKILL_QUESTION_MEDIA[q.skill];
    const count = (questionMediaCount[q.skill] ?? 0) + 1;
    questionMediaCount[q.skill] = count;
    await prisma.question.create({
      data: {
        skillId: skillId(q.skill),
        prompt: q.prompt,
        options: q.options,
        correctKeys: q.correctKeys,
        explanation: q.explanation,
        difficulty: q.difficulty,
        phases: q.phases,
        imageUrl: q.imageUrl ?? (media?.images[(count - 1) % media.images.length] ?? null),
        videoUrl: q.videoUrl ?? media?.video ?? null,
      },
    });
  }

  console.log("🏆 seeding achievements...");
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.create({
      data: { code: a.code, name: a.name, description: a.description, icon: a.icon, condition: a.condition, xpReward: a.xpReward },
    });
  }

  console.log("👤 seeding users...");
  const { demo } = await seedUsers();
  await seedDemoProgress(demo.id);

  const counts = {
    cases: await prisma.caseModel.count(),
    nodes: await prisma.caseNode.count(),
    options: await prisma.caseOption.count(),
    questions: await prisma.question.count(),
    materials: await prisma.material.count(),
    achievements: await prisma.achievement.count(),
    users: await prisma.user.count(),
  };
  console.log("✅ seed selesai:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });