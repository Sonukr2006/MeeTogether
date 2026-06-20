# Runbook: Broken Discussion Posting

## Symptom
Users cannot post messages in discussions. 500 errors on `POST /threads/:threadId/messages`.

## Investigation Steps
1. Check logs for `P2002` Prisma errors (unique constraint violation on sequence number)
2. Verify the retry logic is working (should retry up to 3 times on sequence conflicts)
3. Check if the thread exists and has valid state
4. Check database connectivity and transaction timeout settings
5. Look for deadlocks in PostgreSQL logs

## Mitigation
- If sequence conflict exhaustion: the retry limit may need increasing under extreme concurrency
- If thread state corruption: manually inspect the thread's latest sequence number
- If deadlock: check for long-running transactions, restart service if needed

## Recovery
- Confirm message posting works for affected thread
- Monitor message creation rate returns to normal
- Check no messages were lost (compare sequence numbers)
