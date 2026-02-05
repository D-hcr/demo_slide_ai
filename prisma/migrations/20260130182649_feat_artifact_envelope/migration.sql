-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL DEFAULT 'slides',
    "version" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB,
    "themeName" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("content", "createdAt", "id", "themeName", "title", "updatedAt", "userId") SELECT "content", "createdAt", "id", "themeName", "title", "updatedAt", "userId" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_artifactType_idx" ON "Document"("artifactType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
