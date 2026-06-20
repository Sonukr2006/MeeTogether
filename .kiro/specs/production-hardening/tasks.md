# Implementation Plan: Production Hardening

## Overview

Systematic production hardening of MeeTogether for a 10,000-user public launch. Implementation follows priority group order: P0 (critical security) → P1 (authorization bugs) → P2 (resilience) → P3 (scalability) → P4 (authorization model) → P5 (observability) → P6 (operations & quality). Each group is independently deployable and testable.

## Tasks

- [x] 1. P0 — Critical Security: Token Leakage Removal
  - [x] 1.1 Remove token leakage from AuthService responses
    - Remove `buildTokenPreview()` calls from `signup()`, `resendVerification()`, and `forgotPassword()` response objects
    - Delete the `buildTokenPreview()` private method entirely
    - Verify that verification and reset tokens are only sent via `EmailService` and never appear in HTTP response bodies
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Add debug-only token inspection endpoint
    - Create a `DebugAuthController` with `GET /auth/debug/last-token` gated behind `DEBUG_TOKEN_INSPECT=true` env var
    - Register the controller only when `NODE_ENV !== 'production'` using a conditional module import
    - Store the last generated token in a module-scoped variable for debug access
    - _Requirements: 1.4_

  - [ ]* 1.3 Write property test for token exclusion from auth responses
    - **Property 1: Token Exclusion from Auth Responses**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 2. P0 — Critical Security: CSRF Enforcement for All Sessions
  - [x] 2.1 Enforce CSRF validation for null-hash sessions
    - In `AuthService.validateCsrfForSession()`, replace the early `return` when `sessionCsrfTokenHash` is null/undefined with `throw new UnauthorizedException('Session expired — please log in again')`
    - Ensure legacy sessions without CSRF tokens are rejected on refresh and logout
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 2.2 Write property test for CSRF null-hash rejection
    - **Property 6: CSRF Rejection for Null-Hash Sessions**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 3. P0 — Critical Security: Frontend Token Storage Migration
  - [x] 3.1 Migrate Token_Client to memory-only token storage
    - In `client/src/lib/api.js`, replace `localStorage.getItem(AUTH_TOKEN_KEY)` with a module-scoped `let accessToken = null` variable
    - Remove all `localStorage.setItem(AUTH_TOKEN_KEY, ...)` and `localStorage.getItem(AUTH_TOKEN_KEY)` calls
    - On module load, call `localStorage.removeItem('meetogether_access_token')` and `localStorage.removeItem('meetogether_current_user')` for migration cleanup
    - Update `refreshAccessToken()` to set the module-scoped variable instead of localStorage
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Update authSlice to use memory-only token management
    - In `client/src/store/authSlice.js`, remove all `localStorage.setItem(AUTH_TOKEN_KEY, ...)` and `localStorage.getItem(AUTH_TOKEN_KEY)` calls
    - Remove `localStorage.setItem(AUTH_USER_KEY, ...)` and `localStorage.getItem(AUTH_USER_KEY)` calls
    - Change `initialToken` to `null` (no longer reading from localStorage)
    - Ensure `restoreSession` thunk calls refresh endpoint on app boot to get a fresh token
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.3 Add refresh retry cap and redirect logic
    - In `client/src/lib/api.js`, add a `refreshAttemptCount` tracker that increments on each failed refresh
    - After 2 failed refresh attempts, redirect to `/sign-in` page and reset the counter
    - Reset `refreshAttemptCount` to 0 on successful refresh
    - _Requirements: 3.4, 3.5_

  - [ ]* 3.4 Write property test for memory-only token storage
    - **Property 4: Memory-Only Token Storage**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 3.5 Write property test for refresh deduplication
    - **Property 5: Refresh Request Deduplication**
    - **Validates: Requirements 3.4**

- [x] 4. Checkpoint — P0 Critical Security
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. P1 — Authorization Bugs: Upload Ownership Validation
  - [x] 5.1 Add ownership validation to StorageService
    - Inject `PrismaService` into `StorageService`
    - Add a `validateOwnership()` private method that checks project/post ownership before generating upload URLs
    - For `project_cover` + `entityId`: query `Project` where `id = entityId AND ownerUserId = user.sub`, throw `ForbiddenException` if mismatch
    - For `post_image` + `entityId`: query `Post` where `id = entityId AND authorUserId = user.sub`, throw `ForbiddenException` if mismatch
    - Throw `NotFoundException` if entityId doesn't exist
    - Call `validateOwnership()` at the start of `createUploadTarget()` when `entityId` is provided
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 5.2 Write property test for upload ownership enforcement
    - **Property 2: Upload Ownership Enforcement**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 5.3 Write property test for upload entity existence validation
    - **Property 3: Upload Entity Existence Validation**
    - **Validates: Requirements 2.4**

- [x] 6. P1 — Authorization Bugs: Like Count Floor
  - [x] 6.1 Prevent negative like count drift for posts and projects
    - In `PostsService` unlike handler, replace the simple `decrement` with a conditional update: `UPDATE "Post" SET "likesCount" = GREATEST("likesCount" - 1, 0) WHERE id = $postId AND "likesCount" > 0`
    - In `ProjectsService` unlike handler, apply the same pattern: `UPDATE "Project" SET "likesCount" = GREATEST("likesCount" - 1, 0) WHERE id = $projectId AND "likesCount" > 0`
    - Use `prisma.$executeRaw` for the conditional update to prevent race conditions
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 6.2 Write property test for like count floor at zero
    - **Property 10: Like Count Floor at Zero**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 7. P1 — Authorization Bugs: Discussion Cache Fix and Race Condition
  - [x] 7.1 Fix discussion cache cross-user data leak
    - In `DiscussionService`, change the cache key from `threadId` to `${threadId}:${userId}` for thread messages
    - Update `markThreadRead()` to invalidate cache for the specific `${threadId}:${userId}` combination
    - Ensure different users get independently cached responses for the same thread
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 7.2 Fix unread count race condition
    - In the message creation transaction, replace the blind `updateMany` increment for other participants with a conditional raw SQL query
    - Only increment `unreadCountSnapshot` for participants whose `lastReadAt` is NULL or earlier than the new message's `createdAt` timestamp
    - Use `prisma.$executeRaw` to ensure atomicity: `UPDATE "ThreadParticipantState" SET "unreadCountSnapshot" = "unreadCountSnapshot" + 1 WHERE "threadId" = $threadId AND "userId" != $authorId AND ("lastReadAt" IS NULL OR "lastReadAt" < $messageCreatedAt)`
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 7.3 Write property test for discussion cache user isolation
    - **Property 11: Discussion Cache User Isolation**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 7.4 Write property test for unread count timestamp consistency
    - **Property 12: Unread Count Timestamp Consistency**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 8. Checkpoint — P1 Authorization Bugs
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. P2 — Resilience: Rate Limiter Memory Leak Fix
  - [x] 9.1 Add periodic cleanup and bucket cap to rate limiter
    - Add a `setInterval` cleanup loop (every 30 seconds) that iterates the `buckets` map and deletes entries where `resetAt <= Date.now()`
    - Add a `MAX_BUCKETS` constant (default 100,000) configurable via `RATE_LIMIT_MAX_BUCKETS` env var
    - When `buckets.size >= MAX_BUCKETS`, return 429 immediately for new keys
    - Export a `shutdownRateLimiter()` function that calls `clearInterval` and clears the map
    - Call `shutdownRateLimiter()` from a NestJS `onModuleDestroy` lifecycle hook
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 9.2 Write property test for rate limiter expired entry eviction
    - **Property 8: Rate Limiter Expired Entry Eviction**
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 9.3 Write property test for rate limiter bucket cap
    - **Property 9: Rate Limiter Bucket Cap**
    - **Validates: Requirements 7.4**

- [x] 10. P2 — Resilience: Redis Reconnection Logic
  - [x] 10.1 Implement Redis reconnection with exponential backoff
    - Replace the current `redisClient = null` on error/end events with reconnection logic
    - Implement exponential backoff: delays of 1s, 2s, 4s, 8s, 16s, 30s (cap at 30s)
    - Track `reconnectAttempts` counter, cap at 10 before entering permanent fallback state
    - During fallback, log a warning on each request indicating degraded mode
    - On successful reconnection, reset attempt counter and log info-level event
    - After 10 failures, log error-level alert and use in-memory permanently
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ]* 10.2 Write property test for Redis reconnection exponential backoff
    - **Property 17: Redis Reconnection Exponential Backoff**
    - **Validates: Requirements 15.1, 15.4**

- [x] 11. P2 — Resilience: Rate Limits on Verification and Reset Endpoints
  - [x] 11.1 Add rate limits to auth verification and reset endpoints
    - Apply rate limit middleware to `POST /auth/resend-verification`: 3 requests per 15 minutes per authenticated user (keyed by userId from JWT)
    - Apply rate limit middleware to `POST /auth/verify-email`: 5 requests per 15 minutes per IP address
    - Apply rate limit middleware to `POST /auth/reset-password`: 5 requests per 15 minutes per IP address
    - Ensure 429 responses include a `Retry-After` header with remaining seconds
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 11.2 Write property test for rate limit threshold enforcement
    - **Property 15: Rate Limit Threshold Enforcement**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [x] 12. P2 — Resilience: Production Email Enforcement
  - [x] 12.1 Enforce fail-closed email delivery in production
    - Add an `onModuleInit()` lifecycle hook to `EmailService`
    - In production: verify email provider is not `console` and credentials (e.g., `RESEND_API_KEY`) exist; throw startup error if invalid
    - Remove the fallback-to-console path in production — throw an error instead of logging to console
    - Ensure failed email delivery returns an error to the caller with structured error details
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 12.2 Write property test for production email fail-closed
    - **Property 7: Production Email Fail-Closed**
    - **Validates: Requirements 6.3, 6.4**

- [x] 13. Checkpoint — P2 Resilience
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. P3 — Scalability: Database Indexes
  - [x] 14.1 Add Session.refreshTokenHash index
    - Add `@@index([refreshTokenHash])` to the `Session` model in `prisma/schema.prisma`
    - _Requirements: 4.1, 4.2_

  - [x] 14.2 Add composite indexes for Request model
    - Add `@@index([toUserId, status, createdAt])` for inbox queries with status filtering
    - Add `@@index([fromUserId, createdAt])` for sent-request queries
    - Add `@@index([fromUserId, toUserId, type, status])` for duplicate active request checks
    - _Requirements: 17.1, 17.2, 17.3_

  - [x] 14.3 Add descending indexes for Post and Project feed ordering
    - Add `@@index([createdAt(sort: Desc)])` to the `Post` model
    - Add `@@index([createdAt(sort: Desc)])` to the `Project` model
    - Generate and apply a Prisma migration for all new indexes
    - _Requirements: 17.4, 17.5_

- [x] 15. P3 — Scalability: JWT Overhead Reduction
  - [x] 15.1 Add emailVerified claim to JWT payload and update guards
    - In `AuthService.issueSession()`, include `emailVerified: user.emailVerified` in the JWT payload
    - Update `VerifiedAccountGuard` to check `request.user.emailVerified` from the JWT instead of querying the User table
    - Update `JwtStrategy.validate()` to pass through the `emailVerified` claim
    - _Requirements: 11.1, 11.2_

  - [x] 15.2 Add session existence cache to JwtStrategy
    - Import `TtlCache` utility and create a session cache with 30-second TTL keyed by session ID
    - In `JwtStrategy.validate()`, check the cache before querying the Session table
    - On cache miss, query DB, cache the result for 30 seconds
    - Expose an `invalidateSessionCache(sessionId)` method for use when sessions are revoked
    - On email verification, issue a new access token with updated `emailVerified` claim
    - _Requirements: 11.3, 11.4_

  - [ ]* 15.3 Write property test for JWT emailVerified claim correctness
    - **Property 13: JWT emailVerified Claim Correctness**
    - **Validates: Requirements 11.1**

  - [ ]* 15.4 Write property test for session cache TTL and invalidation
    - **Property 14: Session Cache TTL and Invalidation**
    - **Validates: Requirements 11.3, 11.4**

- [x] 16. P3 — Scalability: MaxLength Validation on Content DTOs
  - [x] 16.1 Add MaxLength decorators to all content DTOs
    - Add `@MaxLength(10000)` to `description` field in `CreatePostDto`
    - Add `@MaxLength(2000)` to `message` field in `CreatePostCommentDto` and `CreateProjectCommentDto`
    - Add `@MaxLength(5000)` to `message` field in `CreateMessageDto` (discussions)
    - Add `@MaxLength(500)` to `title` and `@MaxLength(5000)` to `description` in issue-related DTOs
    - Ensure `ValidationPipe` is configured with `whitelist: true` in `main.ts` for automatic enforcement
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 16.2 Write property test for content length validation
    - **Property 16: Content Length Validation**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

- [ ] 17. P3 — Scalability: Cursor Pagination for All List Endpoints
  - [x] 17.1 Create shared pagination DTO and response interface
    - Create `server/src/common/dto/cursor-pagination.dto.ts` with `cursor` (optional string) and `limit` (optional int, min 1, max 50) fields
    - Create `server/src/common/interfaces/paginated-response.interface.ts` with `data`, `pagination: { nextCursor, hasMore, total? }` shape
    - _Requirements: 18.8, 18.9_

  - [x] 17.2 Add cursor pagination to posts feed and project listing
    - Update `GET /posts` to accept `CursorPaginationDto`, default page size 20, max 50
    - Update `GET /projects` to accept `CursorPaginationDto`, default page size 20, max 50
    - Implement the fetch-one-extra pattern: `take: limit + 1`, slice, determine `hasMore` and `nextCursor`
    - _Requirements: 18.1, 18.2_

  - [x] 17.3 Add cursor pagination to comment endpoints
    - Update `GET /posts/:postId/comments` with default 30, max 50
    - Update `GET /projects/:projectId/comments` with default 30, max 50
    - _Requirements: 18.3, 18.4_

  - [x] 17.4 Add cursor pagination to discussions, issues, and deployments
    - Update discussion thread messages endpoint with default 40, max 50
    - Update `GET /issues` with default 20, max 50
    - Update `GET /deployments` with default 20, max 50
    - _Requirements: 18.5, 18.6, 18.7_

  - [ ]* 17.5 Write property test for pagination bounds and metadata
    - **Property 18: Pagination Bounds and Metadata**
    - **Validates: Requirements 18.1–18.9**

- [x] 18. Checkpoint — P3 Scalability
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. P4 — Authorization Model: Centralized Permission Service
  - [~] 19.1 Create PermissionService module
    - Create `server/src/modules/permissions/permission.service.ts` with methods: `canViewProject`, `canEditProject`, `canPostDiscussionMessage`, `canViewRequest`, `canManageIssue`, `canManageDeployment`, `canViewComments`
    - Each method accepts the authenticated user context (or null for anonymous) and target resource, returns a boolean access decision
    - Create `server/src/modules/permissions/permissions.module.ts` and export the service
    - _Requirements: 20.1, 20.2_

  - [ ]* 19.2 Write unit tests for PermissionService role matrix
    - Test each permission rule against the role matrix: anonymous, authenticated, verified, project member, project owner, admin
    - _Requirements: 20.4_

- [ ] 20. P4 — Authorization Model: Issues and Deployments Auth
  - [~] 20.1 Add authentication guards to issues and deployments endpoints
    - Add `@UseGuards(JwtAuthGuard)` to all routes in Issues and Deployments controllers
    - For write operations (create, update), additionally check via `PermissionService.canManageIssue()` / `canManageDeployment()` and throw `ForbiddenException` on denial
    - Verify user has view access to the project before returning issue/deployment results
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

  - [ ]* 20.2 Write property test for authorization role enforcement
    - **Property 19: Authorization Role Enforcement**
    - **Validates: Requirements 19.2, 19.3, 19.5**

- [ ] 21. P4 — Authorization Model: Comment Visibility
  - [~] 21.1 Align public vs authenticated comment visibility
    - For unauthenticated project comment requests, return comments only on projects with `visibility: 'public'`
    - For unauthenticated post comment requests, return comments only on posts in the public discovery feed
    - Use `PermissionService.canViewComments()` to centralize this logic
    - Document the visibility policy in controller-level comments or swagger annotations
    - _Requirements: 16.1, 16.2, 16.3_

- [~] 22. Checkpoint — P4 Authorization Model
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. P5 — Observability: Structured Logging
  - [~] 23.1 Replace default logger with Pino structured logging
    - Install `pino-http` and `pino-pretty` (dev) if not already present
    - Create `server/src/common/logger/pino.config.ts` with level from `LOG_LEVEL` env var (default `info`)
    - Configure redaction paths: `['req.headers.authorization', 'req.body.password', 'req.body.token', 'req.body.newPassword']`
    - Wire Pino into NestJS as the application logger (replace default `Logger`)
    - Include requestId, HTTP method, route, response status, latency, and userId in every request log entry
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

  - [ ]* 23.2 Write property test for request log completeness
    - **Property 20: Request Log Completeness**
    - **Validates: Requirements 21.2**

  - [ ]* 23.3 Write property test for sensitive field redaction
    - **Property 21: Sensitive Field Redaction**
    - **Validates: Requirements 21.4**

- [ ] 24. P5 — Observability: Error Monitoring
  - [~] 24.1 Integrate Sentry for error monitoring
    - Add `@sentry/node` dependency
    - Initialize Sentry in `main.ts` before NestJS bootstrap, gated by `SENTRY_DSN` env var (skip if not set)
    - Create a global exception filter that reports unhandled errors to Sentry with request context (requestId, route, userId, method)
    - Ensure the filter returns a generic 500 response without leaking stack traces or internal details
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

  - [ ]* 24.2 Write property test for generic error response without stack traces
    - **Property 22: Generic Error Response Without Stack Traces**
    - **Validates: Requirements 22.4**

- [ ] 25. P5 — Observability: Production Metrics
  - [~] 25.1 Add Prometheus metrics with prom-client
    - Add `prom-client` dependency
    - Create `server/src/modules/metrics/metrics.module.ts` with a `MetricsService`
    - Implement HTTP request duration histogram (labels: method, route, status_code)
    - Implement HTTP request counter (labels: method, route, status_code)
    - Implement business event counters: `signup_total`, `login_total`, `message_created_total`, `request_created_total`
    - Expose `GET /metrics` endpoint protected by an API key header or internal network restriction
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

- [~] 26. Checkpoint — P5 Observability
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27. P6 — Operations & Quality: Environment Validation
  - [~] 27.1 Extend env validation with production-only requirements
    - In `server/src/config/env.validation.ts`, add production-only validation:
    - Require `REDIS_URL` to be set and non-empty
    - Require `EMAIL_PROVIDER` to be a non-console value with valid credentials
    - Require `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to be at least 32 characters
    - Require `STORAGE_PROVIDER` to be set with valid credentials
    - Log the specific missing variables and call `process.exit(1)` on failure
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 28. P6 — Operations & Quality: CI Pipeline and Client Lint
  - [~] 28.1 Fix all existing client lint errors
    - Run `npm run lint` in the client directory and fix all errors
    - Resolve React hook dependency warnings and unused variable errors
    - _Requirements: 26.1, 26.3_

  - [~] 28.2 Add client lint gate to CI pipeline
    - Add `npm run lint` step to the client CI job in `.github/workflows/ci.yml` before the build step
    - Ensure the lint step blocks merging on failure
    - _Requirements: 26.2_

- [ ] 29. P6 — Operations & Quality: Integration Tests and Permission Matrix
  - [~] 29.1 Create auth flow integration tests
    - Create `server/test/auth-flow.integration.ts` covering: signup → email verification → login → refresh token rotation → reuse detection → logout → logout-all
    - Verify session revocation propagates to subsequent requests
    - _Requirements: 25.2, 25.3_

  - [~] 29.2 Create permission matrix integration tests
    - Create `server/test/permission-matrix.integration.ts` testing each role (anonymous, authenticated, verified, project member, project owner, admin) against each protected endpoint
    - Ensure CI pipeline blocks deployment on permission test failure
    - _Requirements: 25.1, 25.4_

- [ ] 30. P6 — Operations & Quality: Operations Infrastructure Documentation
  - [~] 30.1 Create operations infrastructure documentation and scripts
    - Create `docs/runbooks/` directory with runbook files for: login failure spike, database connection failure, high error rate, broken discussion posting
    - Create `docs/operations/backup-restore.md` documenting the daily backup configuration and restore procedure
    - Create `docs/operations/rollback.md` documenting deployment rollback procedures including database migration rollback
    - Document staging environment configuration requirements
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

- [~] 31. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between priority groups
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The priority group order (P0→P6) ensures critical security fixes ship first
- All backend code is TypeScript (NestJS + Prisma), all frontend code is React + Vite

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "3.2"] },
    { "id": 2, "tasks": ["3.3", "3.4", "3.5"] },
    { "id": 3, "tasks": ["5.1", "6.1", "7.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.2", "7.2"] },
    { "id": 5, "tasks": ["7.3", "7.4"] },
    { "id": 6, "tasks": ["9.1", "10.1", "11.1", "12.1"] },
    { "id": 7, "tasks": ["9.2", "9.3", "10.2", "11.2", "12.2"] },
    { "id": 8, "tasks": ["14.1", "14.2", "14.3", "15.1", "16.1"] },
    { "id": 9, "tasks": ["15.2", "15.3", "16.2", "17.1"] },
    { "id": 10, "tasks": ["15.4", "17.2", "17.3"] },
    { "id": 11, "tasks": ["17.4", "17.5"] },
    { "id": 12, "tasks": ["19.1"] },
    { "id": 13, "tasks": ["19.2", "20.1", "21.1"] },
    { "id": 14, "tasks": ["20.2"] },
    { "id": 15, "tasks": ["23.1", "24.1", "25.1"] },
    { "id": 16, "tasks": ["23.2", "23.3", "24.2"] },
    { "id": 17, "tasks": ["27.1", "28.1"] },
    { "id": 18, "tasks": ["28.2", "29.1", "29.2"] },
    { "id": 19, "tasks": ["30.1"] }
  ]
}
```
