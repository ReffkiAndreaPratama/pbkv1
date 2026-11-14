-- CreateTable
CREATE TABLE "RepairJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "symptom" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "timeLimitSec" INTEGER NOT NULL DEFAULT 180,
    "maxHearts" INTEGER NOT NULL DEFAULT 3,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepairJob_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "isFaulty" BOOLEAN NOT NULL DEFAULT false,
    "fixType" TEXT NOT NULL,
    "faultLabel" TEXT,
    "inspectClue" TEXT NOT NULL,
    "readings" JSONB,
    "replacementName" TEXT,
    CONSTRAINT "RepairComponent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RepairJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "hearts" INTEGER NOT NULL DEFAULT 3,
    "combo" INTEGER NOT NULL DEFAULT 0,
    "maxCombo" INTEGER NOT NULL DEFAULT 0,
    "actions" INTEGER NOT NULL DEFAULT 0,
    "correctActions" INTEGER NOT NULL DEFAULT 0,
    "wrongActions" INTEGER NOT NULL DEFAULT 0,
    "timeSec" INTEGER NOT NULL DEFAULT 0,
    "score" REAL,
    "success" BOOLEAN,
    "fixedKeys" JSONB,
    "inspectedKeys" JSONB,
    "testedKeys" JSONB,
    CONSTRAINT "RepairAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RepairAttempt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RepairJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RepairJob_skillId_idx" ON "RepairJob"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "RepairComponent_jobId_key_key" ON "RepairComponent"("jobId", "key");

-- CreateIndex
CREATE INDEX "RepairAttempt_userId_idx" ON "RepairAttempt"("userId");
