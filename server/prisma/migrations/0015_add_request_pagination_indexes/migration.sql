CREATE INDEX IF NOT EXISTS "Request_toUserId_createdAt_id_idx"
ON "Request"("toUserId", "createdAt" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "Request_fromUserId_createdAt_id_idx"
ON "Request"("fromUserId", "createdAt" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "Request_toUserId_unread_createdAt_id_idx"
ON "Request"("toUserId", "unread", "createdAt" DESC, "id" DESC);
