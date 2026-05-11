DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostType') THEN
    CREATE TYPE "PostType" AS ENUM ('BUILD_LOG', 'HELP_NEEDED', 'MENTOR_REVIEW', 'LAUNCH');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Post" (
  "id" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "projectId" TEXT,
  "type" "PostType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT,
  "likesCount" INTEGER NOT NULL DEFAULT 0,
  "commentsCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PostTag" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PostTag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Post_authorUserId_createdAt_idx"
ON "Post"("authorUserId", "createdAt");

CREATE INDEX IF NOT EXISTS "Post_projectId_createdAt_idx"
ON "Post"("projectId", "createdAt");

CREATE INDEX IF NOT EXISTS "Post_type_createdAt_idx"
ON "Post"("type", "createdAt");

CREATE INDEX IF NOT EXISTS "PostTag_postId_sortOrder_idx"
ON "PostTag"("postId", "sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Post_authorUserId_fkey'
  ) THEN
    ALTER TABLE "Post"
      ADD CONSTRAINT "Post_authorUserId_fkey"
      FOREIGN KEY ("authorUserId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Post_projectId_fkey'
  ) THEN
    ALTER TABLE "Post"
      ADD CONSTRAINT "Post_projectId_fkey"
      FOREIGN KEY ("projectId")
      REFERENCES "Project"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PostTag_postId_fkey'
  ) THEN
    ALTER TABLE "PostTag"
      ADD CONSTRAINT "PostTag_postId_fkey"
      FOREIGN KEY ("postId")
      REFERENCES "Post"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;
