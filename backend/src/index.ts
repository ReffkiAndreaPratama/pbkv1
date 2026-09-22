import "express-async-errors";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { config } from "./config";
import prisma from "./db";
import { errorHandler, ZodErrorHandler } from "./middleware/error";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import quizRoutes from "./routes/quiz";
import casesRoutes from "./routes/cases";
import simulationRoutes from "./routes/simulation";
import materialsRoutes from "./routes/materials";
import aiRoutes from "./routes/ai";
import progressRoutes from "./routes/progress";
import adminRoutes from "./routes/admin";

const app = express();
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "techtutor-api", version: "1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/cases", casesRoutes);
app.use("/api/simulation", simulationRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);

// 404
app.use((_req, res) => { res.status(404).json({ error: "Not found" }); });

// Zod error handler (must be before generic error handler)
app.use(ZodErrorHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`TechTutor API listening on port ${config.port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});