CREATE TABLE IF NOT EXISTS "PostLink" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PostLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PostLink_postId_sortOrder_idx"
ON "PostLink"("postId", "sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PostLink_postId_fkey'
  ) THEN
    ALTER TABLE "PostLink"
      ADD CONSTRAINT "PostLink_postId_fkey"
      FOREIGN KEY ("postId")
      REFERENCES "Post"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;
