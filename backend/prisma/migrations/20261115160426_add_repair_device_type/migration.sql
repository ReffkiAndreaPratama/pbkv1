-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RepairJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "symptom" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL DEFAULT 'PC',
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "timeLimitSec" INTEGER NOT NULL DEFAULT 180,
    "maxHearts" INTEGER NOT NULL DEFAULT 3,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepairJob_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RepairJob" ("createdAt", "difficulty", "id", "isActive", "maxHearts", "order", "scenario", "skillId", "symptom", "timeLimitSec", "title") SELECT "createdAt", "difficulty", "id", "isActive", "maxHearts", "order", "scenario", "skillId", "symptom", "timeLimitSec", "title" FROM "RepairJob";
DROP TABLE "RepairJob";
ALTER TABLE "new_RepairJob" RENAME TO "RepairJob";
CREATE INDEX "RepairJob_skillId_idx" ON "RepairJob"("skillId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
