# Runbook: High Error Rate

## Symptom
Error rate exceeds 5% of total requests. Sentry alerts firing.

## Investigation Steps
1. Check Sentry for most common unhandled exceptions
2. Filter logs by `level=error` to identify the failing route(s)
3. Check if error is isolated to one module or system-wide
4. Verify all environment variables are correctly set
5. Check memory usage — is the process approaching OOM?

## Mitigation
- If single route: consider disabling/feature-flagging the broken endpoint
- If memory: restart the process, investigate memory leak (rate limiter buckets, caches)
- If dependency failure (Redis, S3, email): check that service and degrade gracefully
- If bad deployment: rollback to previous version

## Recovery
- Error rate returns to < 1%
- Sentry issues resolved or acknowledged
- Root cause documented
