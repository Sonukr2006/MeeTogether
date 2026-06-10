CREATE UNIQUE INDEX IF NOT EXISTS "Request_active_unique_idx"
ON "Request" (
  "fromUserId",
  "toUserId",
  "type",
  (COALESCE("relatedProjectId", '')),
  (COALESCE("relatedThreadId", ''))
)
WHERE "status" IN ('Pending', 'Replying');
