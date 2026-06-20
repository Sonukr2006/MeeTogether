# Runbook: Database Connection Failure

## Symptom
`/health` or `/ready` endpoint returns unhealthy. 500 errors across all endpoints that access the database.

## Investigation Steps
1. Check `/api/v1/health` response for database status
2. Review Prisma connection error logs (search for `PrismaClientInitializationError`)
3. Verify DATABASE_URL environment variable is correct
4. Check PostgreSQL instance status (provider dashboard or `pg_isready`)
5. Check connection pool limits — are connections exhausted?

## Mitigation
- If transient: NestJS/Prisma will auto-reconnect on next request
- If connection pool exhausted: restart the service to reset pool
- If DB is down: contact hosting provider, check for maintenance windows
- If DNS issue: verify DIRECT_URL fallback is configured

## Recovery
- Confirm `/api/v1/health` returns healthy
- Monitor error rate drop to baseline
- Run a test query to confirm read/write works
