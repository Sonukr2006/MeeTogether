DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IssueStatus') THEN
    CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IssuePriority') THEN
    CREATE TYPE "IssuePriority" AS ENUM ('HIGH', 'MEDIUM', 'NORMAL');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Issue" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "assignedToUserId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "IssuePriority" NOT NULL DEFAULT 'NORMAL',
  "roleNeed" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Issue_projectId_fkey'
  ) THEN
    ALTER TABLE "Issue"
      ADD CONSTRAINT "Issue_projectId_fkey"
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
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Issue_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "Issue"
      ADD CONSTRAINT "Issue_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Issue_assignedToUserId_fkey'
  ) THEN
    ALTER TABLE "Issue"
      ADD CONSTRAINT "Issue_assignedToUserId_fkey"
      FOREIGN KEY ("assignedToUserId")
      REFERENCES "User"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "Issue_projectId_status_idx" ON "Issue"("projectId", "status");
CREATE INDEX IF NOT EXISTS "Issue_assignedToUserId_idx" ON "Issue"("assignedToUserId");
