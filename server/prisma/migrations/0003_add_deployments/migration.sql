DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeploymentStatus') THEN
    CREATE TYPE "DeploymentStatus" AS ENUM ('LIVE', 'PREVIEW', 'QUEUED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Deployment" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "status" "DeploymentStatus" NOT NULL DEFAULT 'QUEUED',
  "environment" TEXT NOT NULL,
  "liveUrl" TEXT,
  "repoUrl" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "buildHealth" TEXT,
  "currentFocus" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Deployment_projectId_fkey'
  ) THEN
    ALTER TABLE "Deployment"
      ADD CONSTRAINT "Deployment_projectId_fkey"
      FOREIGN KEY ("projectId")
      REFERENCES "Project"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "Deployment_projectId_idx" ON "Deployment"("projectId");
CREATE INDEX IF NOT EXISTS "Deployment_status_idx" ON "Deployment"("status");
