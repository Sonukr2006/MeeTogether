# Backend Ops

This document covers launch-oriented backend operations for MeeTogether.

Target:

- first real launch
- around 10k users in one month

## Environments

Use at least:

- `local`
- `staging`
- `production`

Do not collapse staging and production if avoidable.

## Required environment variables

Baseline:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`

Optional later:

- redis url
- object storage config
- email provider config
- error monitoring DSN

## Health endpoints

Add:

- `/health`
- `/ready`

Purpose:

- container/platform health checks
- db readiness confirmation

## Logging and observability

Need:

- structured logs
- request ids
- latency
- error tracking

Recommended:

- `pino` or `winston`
- Sentry or equivalent error monitoring

Log fields:

- timestamp
- requestId
- route
- method
- status
- latency
- userId when available

## Metrics worth tracking

Launch metrics:

- requests per minute
- auth failures
- signup count
- discussion messages per hour
- issue updates per hour
- request inbox creation count
- p95 latency
- error rate

## Database ops

Need:

- backups
- unique indexes
- query indexes for hot paths

High-value indexes:

- `users.email`
- `users.username`
- `projects.ownerUserId`
- `issues.projectId + status`
- `threads.projectId`
- `messages.threadId + sentAt`
- `requests.toUserId + unread`

## Deployment strategy

For early production:

- single backend service is fine
- single primary database is fine
- no need for microservices

But:

- use proper env separation
- have rollback ability
- track deployed version

## Error budgets and incidents

At this stage, keep it practical.

When incidents happen, at minimum capture:

- what failed
- affected routes
- start time
- fix time
- root cause
- follow-up action

## Backups and recovery

Minimum standard:

- daily backups
- tested restore process

Without restore confidence, backups are only comforting paperwork.

## Migration strategy

Need a plan for:

- adding fields safely
- introducing indexes
- backfilling derived values

Prefer:

- additive schema changes first
- lazy backfill or explicit migration jobs

## Queue / async work

Likely later candidates:

- notification fanout
- resume generation
- email sending
- activity aggregation

For 10k users, these can stay synchronous at first if kept lightweight, but queue support should be anticipated.

## Runbook basics

Need short runbooks for:

- login failures spike
- db connection failures
- deployment rollback
- high error rate
- broken discussion posting

## Launch checklist

1. env vars verified
2. indexes created
3. backups configured
4. health endpoints working
5. structured logs live
6. error monitoring live
7. staging smoke test passed
8. rollback plan written

