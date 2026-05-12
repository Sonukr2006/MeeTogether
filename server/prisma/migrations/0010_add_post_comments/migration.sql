CREATE TABLE IF NOT EXISTS "PostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PostComment_postId_createdAt_idx"
ON "PostComment"("postId", "createdAt");

CREATE INDEX IF NOT EXISTS "PostComment_authorUserId_createdAt_idx"
ON "PostComment"("authorUserId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PostComment_postId_fkey'
  ) THEN
    ALTER TABLE "PostComment"
      ADD CONSTRAINT "PostComment_postId_fkey"
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
    SELECT 1 FROM pg_constraint WHERE conname = 'PostComment_authorUserId_fkey'
  ) THEN
    ALTER TABLE "PostComment"
      ADD CONSTRAINT "PostComment_authorUserId_fkey"
      FOREIGN KEY ("authorUserId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;
