ALTER TABLE "Project"
ADD COLUMN IF NOT EXISTS "likesCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "PostLike" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PostLike_postId_userId_key"
ON "PostLike"("postId", "userId");

CREATE INDEX IF NOT EXISTS "PostLike_userId_idx"
ON "PostLike"("userId");

CREATE TABLE IF NOT EXISTS "ProjectLike" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectLike_projectId_userId_key"
ON "ProjectLike"("projectId", "userId");

CREATE INDEX IF NOT EXISTS "ProjectLike_userId_idx"
ON "ProjectLike"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PostLike_postId_fkey'
  ) THEN
    ALTER TABLE "PostLike"
      ADD CONSTRAINT "PostLike_postId_fkey"
      FOREIGN KEY ("postId")
      REFERENCES "Post"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PostLike_userId_fkey'
  ) THEN
    ALTER TABLE "PostLike"
      ADD CONSTRAINT "PostLike_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectLike_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectLike"
      ADD CONSTRAINT "ProjectLike_projectId_fkey"
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
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectLike_userId_fkey'
  ) THEN
    ALTER TABLE "ProjectLike"
      ADD CONSTRAINT "ProjectLike_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;
