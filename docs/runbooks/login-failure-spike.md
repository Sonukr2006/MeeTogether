# Runbook: Login Failure Spike

## Symptom
Spike in 401 responses on `/api/v1/auth/login` beyond normal baseline.

## Investigation Steps
1. Check rate limiter metrics — are specific IPs being rate limited?
2. Review structured logs filtered by `path=/api/v1/auth/login` and `statusCode=401`
3. Check if bcrypt comparison is timing out (high latency on login requests)
4. Verify database connectivity — can the auth service reach PostgreSQL?
5. Check if a deployment changed JWT secrets without session revocation

## Mitigation
- If brute-force attack: rate limiter should auto-mitigate. Verify Redis is connected.
- If DB issue: check connection pool, restart service if needed.
- If secret rotation issue: rollback deployment, revoke all sessions, re-deploy with correct secret.

## Recovery
- Monitor login success rate return to baseline (>95%)
- Verify no accounts were compromised
- Document root cause for post-incident review
