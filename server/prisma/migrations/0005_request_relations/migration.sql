CREATE INDEX IF NOT EXISTS "Request_relatedProjectId_idx"
ON "Request"("relatedProjectId");

CREATE INDEX IF NOT EXISTS "Request_relatedThreadId_idx"
ON "Request"("relatedThreadId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Request_relatedProjectId_fkey'
  ) THEN
    ALTER TABLE "Request"
      ADD CONSTRAINT "Request_relatedProjectId_fkey"
      FOREIGN KEY ("relatedProjectId")
      REFERENCES "Project"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Request_relatedThreadId_fkey'
  ) THEN
    ALTER TABLE "Request"
      ADD CONSTRAINT "Request_relatedThreadId_fkey"
      FOREIGN KEY ("relatedThreadId")
      REFERENCES "DiscussionThread"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;
