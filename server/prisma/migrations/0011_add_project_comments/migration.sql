ALTER TABLE "Project"
ADD COLUMN IF NOT EXISTS "commentsCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ProjectComment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectComment_projectId_createdAt_idx"
ON "ProjectComment"("projectId", "createdAt");

CREATE INDEX IF NOT EXISTS "ProjectComment_authorUserId_createdAt_idx"
ON "ProjectComment"("authorUserId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectComment_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectComment"
      ADD CONSTRAINT "ProjectComment_projectId_fkey"
      FOREIGN KEY ("projectId")
      REFERENCES "Project"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectComment_authorUserId_fkey'
  ) THEN
    ALTER TABLE "ProjectComment"
      ADD CONSTRAINT "ProjectComment_authorUserId_fkey"
      FOREIGN KEY ("authorUserId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;
