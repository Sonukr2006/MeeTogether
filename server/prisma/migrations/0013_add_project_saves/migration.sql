CREATE TABLE "ProjectSave" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSave_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectSave_projectId_userId_key" ON "ProjectSave"("projectId", "userId");
CREATE INDEX "ProjectSave_userId_idx" ON "ProjectSave"("userId");

ALTER TABLE "ProjectSave"
ADD CONSTRAINT "ProjectSave_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectSave"
ADD CONSTRAINT "ProjectSave_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
