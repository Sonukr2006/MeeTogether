# MeeTogether Production Readiness

Production is the aim.

This README is the working checklist for turning MeeTogether from a strong prototype into a launch-grade product. It summarizes the existing docs and the current code review state, with special attention to security, scalability, maintainability, performance, and reliability.

Target launch shape:

- NestJS + Prisma + PostgreSQL monolith
- real authenticated users
- strict resource authorization
- paginated public and authenticated reads
- production-safe media upload flow
- observable backend with health checks, logs, metrics, backups, and rollback
- clean CI gates before deploy

## Current Verdict

The codebase is not production-ready yet.

It has a good foundation: NestJS modules, Prisma schema, JWT auth, refresh-token sessions, email verification, password reset, DTO validation, and media upload-target support. The remaining work is mostly around production hardening: authorization, pagination, secrets, tests, observability, and operational discipline.

## Status Legend

- `Done`: implemented, tested, documented, and production-verifiable
- `Partial`: implemented partly, but still missing production guarantees
- `Not started`: no meaningful production implementation yet
- `Blocked`: cannot be safely completed until another item is handled
- `Needs review`: exists, but requires deeper verification before launch

## Production Blockers

These must be fixed before a real public launch.

| Status | Task |
| --- | --- |
| `Partial` | Remove `server/.env` from git tracking and rotate any secrets that may have been committed. Repo-side untracking is done; external credential rotation is still required. |
| `Partial` | Sanitize `server/.env.example`; it must contain placeholders only. Placeholder cleanup is done; rotate any real database credential that may have been exposed there. |
| `Partial` | Add auth and sender/recipient authorization to requests. Received inbox reads, sent-request reads, request creation, sender-only cancel, recipient status updates, and mark-all-read are now authenticated and scoped. Active duplicate requests are protected by a database index, status/cancel writes use conditional active-state updates, inbox/sent reads support cursor pagination, and request creation has DB-backed abuse caps; frontend create/cancel wiring, tests, monitoring, and tuning are still required. |
| `Partial` | Require authenticated access for discussion messages according to the visibility model. Thread lists and messages now require verified auth and apply project visibility checks; pagination and permission tests are still required. |
| `Partial` | Enforce project membership or explicit participant access before posting discussion messages. Posting now requires thread creator, project owner, or project member; automated permission tests and a richer participant model are still required. |
| `Not started` | Align public discovery routes with the product visibility model. Feed, public projects, public profiles, and public resumes should not all be forced behind verified login if they are acquisition surfaces. |
| `Not started` | Add pagination to all list endpoints: posts, projects, project comments, post comments, threads, messages, issues, requests, deployments, saved projects, and profile activity. |
| `Not started` | Add ownership checks for upload targets. Users must not be able to mint project/post media paths for resources they do not own or cannot edit. |
| `Partial` | Add database indexes for hot paths, especially session refresh lookup, requests inbox, feeds, comments, and discussion messages. Some indexes exist, but key launch paths are still missing. |
| `Partial` | Make rate limiting production-safe with Redis required in production or an explicitly monitored fallback. Current implementation supports Redis but silently falls back to process memory. |
| `Not started` | Stop storing access tokens in `localStorage`; move toward memory-only access token handling plus refresh-cookie rotation. |
| `Not started` | Make production email delivery fail closed. Verification/reset emails must not silently fall back to console logging in production. |
| `Partial` | Fix all lint errors in server and client. Server lint now passes and is a CI gate; client lint still fails on existing React/unused-variable issues. |
| `Partial` | Add automated tests for auth, permissions, discussions, requests, uploads, pagination, and session revocation. Server integration test setup now covers discussion message concurrency and non-member write denial; broad auth, request, upload, pagination, and session tests are still missing. |
| `Partial` | Update the root `README.md` so it matches the current NestJS/Prisma backend reality instead of describing only a frontend-first mocked prototype. Backend checks and current limitations are now documented; the full product overview still needs a deeper refresh. |
| `Not started` | Add production error monitoring and alerting. |
| `Not started` | Confirm backups and tested restore process. |
| `Not started` | Create a staging environment and smoke-test checklist. |
| `Not started` | Document rollback and incident response steps. |

## Current Production Status By Area

| Area | Status | Notes |
| --- | --- | --- |
| Auth basics | `Partial` | Signup, login, JWT, refresh sessions, logout, email verification, and password reset exist, but need tests and token-storage hardening. |
| Authorization | `Partial` | Requests and discussions now have stronger route guards and resource-level checks, but issues, deployments, uploads, and broader permission tests are still missing. |
| Projects | `Partial` | Create/read/like/save/comment exist, but pagination, edit APIs, visibility rules, and permission tests are missing. |
| Posts/feed | `Partial` | Create/read/like/comment exist, but feed pagination, edit/delete policy, moderation, and URL safety need hardening. |
| Discussions | `Partial` | Thread/message reads require verified auth and project visibility checks, message posting is owner/member/creator scoped, and message sequence writes retry on unique conflicts with integration coverage; pagination and broader permission tests are still missing. |
| Issues | `Partial` | Read API exists, but create/update/assign workflows and permissions are missing. |
| Requests | `Partial` | Received inbox reads, sent-request reads, request creation, sender-only cancel, recipient status updates, and mark-all-read are authenticated and user-scoped. Duplicate active requests, cancel/status races, unbounded inbox/sent reads, and basic request-creation spam are now guarded, but frontend create/cancel wiring, tests, monitoring, and tuning are missing. |
| Profiles/proof resume | `Partial` | Profile read/update exists, but public/private response tests, pagination, proof-source rules, and resume backend contract need work. |
| Media storage | `Partial` | Upload-target flow exists, but ownership validation, storage-level size enforcement, and final provider decision are missing. |
| Database scalability | `Partial` | Prisma schema has useful relations and some indexes, but pagination and several hot-path indexes are missing. |
| Rate limiting | `Partial` | Auth limits exist, but production fallback behavior and broader abuse limits are not launch-grade. |
| Observability | `Partial` | Request IDs and JSON logs exist, but structured logger, error monitoring, metrics, and readiness checks are incomplete. |
| Tests/CI | `Partial` | GitHub Actions now runs server install, Prisma schema validation, test database migrations, server lint, discussion integration tests, server build, client install, and client build on push, pull request, and manual dispatch. Client lint still fails and broader production-critical test coverage is missing. |
| Operations | `Not started` | Staging, backups, restore test, runbooks, rollback process, and monitoring need to be established. |
| Documentation | `Partial` | Production README exists, but root README and older docs still need alignment with the current backend and launch model. |

## Remaining Product Tasks

### Auth And Account Safety

- [ ] `Not started` Keep refresh-token rotation and reuse detection covered by integration tests.
- [ ] `Not started` Add cooldown/rate limit for resend verification.
- [ ] `Not started` Add stronger password policy or compromised-password checks before wider launch.
- [ ] `Partial` Add account suspension behavior across all protected routes.
- [ ] `Not started` Add audit logs for logout-all, token reuse, password reset, and suspicious auth failures.
- [ ] `Not started` Add session cleanup job for expired/revoked sessions.
- [ ] `Needs review` Decide whether access token should include only stable identifiers and fetch fresh user/session state when needed.
- [ ] `Not started` Make production email provider configuration mandatory. Do not allow verification or password reset emails to fall back to console output in production.
- [ ] `Not started` Add tests that prove reset and verification tokens are never returned in production responses or exposed through logs.

### Authorization And Visibility

- [ ] `Not started` Centralize permission helpers, for example `canViewProject`, `canPostDiscussionMessage`, `canViewRequest`, `canEditProject`, and `canManageDeployment`.
- [ ] `Partial` Implement the visibility model from `visibility-and-access-model.md`.
- [ ] `Partial` Ensure public can read only feed, public projects, and public proof profiles.
- [ ] `Not started` Split frontend routes into public discovery routes and authenticated collaboration routes. Public product surfaces should not depend on `RequireAuth` unless the launch policy changes.
- [ ] `Partial` Ensure saved projects are private to the owner unless explicitly made public later.
- [ ] `Partial` Ensure requests are private to sender/recipient. Received inbox reads, sent-request reads, request creation, sender-only cancel, recipient status updates, and mark-all-read are current-user scoped. Related project/thread references now require sender visibility or participation, and request creation has DB-backed abuse caps; frontend creation wiring, tests, monitoring, and tuning are still required.
- [ ] `Not started` Ensure issues follow project visibility and write permissions.
- [ ] `Not started` Ensure deployments follow project visibility and restrict write access to owner/admin/service identity.
- [ ] `Not started` Add permission matrix tests from `authorization-rules.md`.

### Projects

- [ ] `Not started` Add project update/edit APIs with owner/admin authorization.
- [ ] `Not started` Add contributor management APIs with owner/admin authorization.
- [ ] `Not started` Add project membership role semantics beyond free-form `roleLabel`.
- [ ] `Not started` Add pagination and filters to project listing.
- [ ] `Partial` Add project visibility enforcement for future private projects.
- [ ] `Partial` Validate and normalize project links more strictly.
- [ ] `Not started` Add project deletion or archival policy.
- [ ] `Not started` Add cache invalidation tests for create/update/like/comment flows.

### Posts And Feed

- [ ] `Not started` Add cursor pagination to feed posts.
- [ ] `Needs review` Decide whether feed is posts-only, projects-only, or mixed stream with stable ordering.
- [ ] `Partial` Enforce URL safety for post links and image URLs.
- [ ] `Not started` Add edit/delete policy for posts.
- [ ] `Not started` Add moderation/reporting path for public content.
- [ ] `Not started` Add tests for linked project validation and ownership-sensitive actions.

### Discussions

- [ ] `Partial` Require auth for thread/message reads unless a thread is explicitly public-read. Backend now requires verified auth and checks project visibility for thread lists and messages; pagination and read-path tests are still missing.
- [ ] `Partial` Enforce project membership or allowed participant status before message creation. Backend now allows posting only for thread creator, project owner, or project member; integration coverage verifies member success and public-thread non-member denial, but explicit participant roles and full permission matrix tests are still missing.
- [ ] `Not started` Add cursor pagination for thread messages with a default page size of 30 to 50.
- [x] `Done` Fix sequence-number race risk by using a transaction or database-safe sequence strategy. Message creation now writes in a transaction, retries bounded unique-sequence conflicts, and has integration coverage for concurrent sends.
- [ ] `Partial` Add edit/delete fields and policy if message editing becomes launch scope.
- [ ] `Partial` Keep one default thread per project for launch, but verify this with tests and make thread creation idempotent.
- [ ] `Partial` Add tests for non-member read/write denial, member write success, and read-state updates. Integration coverage now verifies public-thread non-member write denial and member concurrent write success; read denial and read-state update tests are still missing.

### Issues

- [ ] `Not started` Add create issue API.
- [ ] `Not started` Add update issue status API.
- [ ] `Not started` Add issue assignment API.
- [ ] `Not started` Enforce role rules: assignee/project owner/admin for status updates; owner/admin for assignment.
- [ ] `Partial` Add pagination and project/status filters.
- [ ] `Not started` Add issue activity/audit history if issue status becomes proof evidence.
- [ ] `Not started` Add permission tests for each issue action.

### Requests

- [ ] `Partial` Add authenticated `GET /requests` for current user's inbox. Backend and frontend now use the current authenticated user, and the endpoint supports cursor pagination plus unread filtering; tests are still missing.
- [ ] `Partial` Add create request API. Authenticated users can create validated requests for an existing recipient, self-requests are blocked, related project/thread references require visibility or participation, duplicate active requests are rejected with a database-backed guard, and sender/recipient creation caps return `429`; frontend profile actions and tests still need wiring.
- [ ] `Partial` Add update request status API. Recipients can update active received requests through conditional active-state writes, and terminal/cancelled requests are protected from later status changes; tests are still missing.
- [ ] `Partial` Add cancel sent request API. Senders can cancel their own pending/replying requests through conditional active-state writes; frontend wiring and tests are still missing.
- [ ] `Partial` Enforce sender/recipient authorization. Inbox, sent, create, cancel, status, and read-all actions now use the authenticated user scope; permission tests are still missing.
- [ ] `Partial` Replace frontend local-only request status and read-state updates with backend persistence. Backend-loaded requests now persist status and mark-all-read changes; local profile-action placeholders remain until real request creation exists.
- [ ] `Not started` Replace frontend profile-action request placeholders with real request creation.
- [ ] `Partial` Add request spam rate limits. Request creation now caps per-sender hourly volume, per-recipient daily volume, and active outgoing backlog; production monitoring, tuning, and automated tests are still missing.
- [ ] `Partial` Add pagination and unread filters. `GET /requests` and `GET /requests/sent` support cursor pagination with a maximum page size of 50, and inbox reads support unread filtering; automated tests are still missing.
- [ ] `Not started` Add tests for inbox privacy, sent privacy, create validation, cancel authorization, and status transitions.

### Profiles And Proof Resume

- [ ] `Needs review` Confirm public profile response never leaks private saved projects for non-owner viewers.
- [ ] `Not started` Add pagination/limits for profile projects, posts, saved projects, and timeline.
- [ ] `Partial` Define source-of-truth rules for proof score, builder level, and trust signals.
- [ ] `Not started` Add recompute strategy for proof profile aggregates.
- [ ] `Not started` Add tests for owner vs public profile response shapes.
- [ ] `Not started` Add proof resume backend contract if resume is meant to be shareable outside the app.

### Media Storage

- [ ] `Needs review` Decide final provider for production. Docs prefer S3 + CloudFront; code currently supports Supabase and S3.
- [ ] `Partial` Require S3/CloudFront config for production if S3 is the launch decision.
- [ ] `Not started` Verify upload target ownership for avatar, project cover, and post image.
- [ ] `Partial` Enforce file size and content type at the storage policy layer, not only in DTOs.
- [ ] `Partial` Store `storageKey` as source of truth where possible, not only public URL.
- [ ] `Not started` Add image replacement/removal behavior.
- [ ] `Not started` Add optional image processing later: resize, thumbnail, metadata stripping, format normalization.

### Operations

- [ ] `Done` Add `/health` and `/ready` endpoints that check service and database readiness.
- [ ] `Partial` Add structured logger such as Pino instead of raw `console.log`.
- [ ] `Partial` Include request id, route, method, status, latency, and authenticated user id when available.
- [ ] `Not started` Add error monitoring such as Sentry or equivalent.
- [ ] `Not started` Track launch metrics: p95 latency, error rate, auth failures, signup count, message rate, request creation rate.
- [ ] `Not started` Configure daily backups and test restore.
- [ ] `Not started` Add migration rollout rules for additive changes, backfills, and indexes.
- [ ] `Not started` Write runbooks for login failure spike, DB connection failure, high error rate, rollback, and broken discussion posting.

### Testing And CI

- [ ] `Partial` Add server unit and integration test setup. Node test-runner integration setup exists for database-backed service tests; unit test conventions and broader coverage are still missing.
- [ ] `Not started` Add client component and integration test setup for auth and core flows.
- [ ] `Not started` Add e2e smoke tests for signup, login, create project, post discussion message, save project, and request inbox.
- [x] `Done` Make `npm run lint` pass in server.
- [ ] `Not started` Make `npm run lint` pass in client.
- [ ] `Partial` Make server build, client build, lint, tests, Prisma generate, and migrations required CI gates. GitHub Actions now gates server build, server lint, server integration tests, test database migrations, client build, and Prisma schema validation; client lint and Prisma generate checks are still missing.
- [ ] `Partial` Add production cookie/session config test to CI.
- [ ] `Not started` Add permission matrix tests as release blockers.

### Documentation And Product Alignment

- [ ] `Not started` Update root `README.md` to describe the current full-stack app, not only the older frontend-first prototype state.
- [ ] `Not started` Align API examples in `docs/api-contract.md` with current response names such as `accessToken`.
- [ ] `Not started` Resolve older MongoDB references in docs now that the implementation uses PostgreSQL and Prisma.
- [ ] `Not started` Add a clear launch policy table for public, authenticated, verified, project-member, owner, and admin surfaces.
- [ ] `Not started` Add a product acceptance checklist for the core proof loop: create project, publish update, discuss, complete issue, update profile proof, create/respond to request, view proof resume.
- [ ] `Not started` Keep `docs/README.md` statuses updated after every production-hardening PR.

## Code Not Yet Production Grade

This section names current code areas that need hardening before production.

### Secrets And Configuration

- `server/.env` was tracked by git; this cleanup removes it from the index, but any exposed credentials still need external rotation.
- `server/.env.example` has been sanitized to placeholders. Treat any previously exposed database URL as compromised until rotated.
- `server/src/config/env.validation.ts` validates many env vars, but provider-specific production requirements still need to be stricter.
- `server/src/config/configuration.ts` has defaults useful for local dev, but production should fail closed when critical config is missing.

### Auth And Session Handling

- `client/src/lib/api.js` and `client/src/store/authSlice.js` store access tokens in `localStorage`, increasing XSS blast radius.
- `server/prisma/schema.prisma` lacks an index or unique constraint on `Session.refreshTokenHash`, even though refresh/logout paths query it.
- `server/src/modules/auth/auth.service.ts` has strong refresh-token ideas, but needs integration tests for rotation, reuse detection, CSRF checks, expiry, logout, logout-all, and password reset session revocation.

### Authorization

- `server/src/modules/requests/requests.controller.ts` now guards received inbox reads, sent-request reads, request creation, sender-only cancel, recipient status updates, and mark-all-read, but still needs abuse limits and tests.
- `server/src/modules/requests/requests.service.ts` now scopes request reads and writes to the authenticated sender or recipient, rejects self/duplicate active requests, validates related project/thread access, paginates inbox/sent reads, limits request creation abuse, and prevents status changes after cancel/terminal states with conditional writes, but still needs transition-policy tests, abuse-limit tests, and production tuning.
- `server/src/modules/discussions/discussions.controller.ts` now requires verified auth for thread lists, thread messages, message creation, and read-state updates.
- `server/src/modules/discussions/discussions.service.ts` now enforces project visibility for reading, owner/member/thread-creator rules for posting, and bounded retry for message sequence conflicts with integration coverage, but still needs pagination plus broader read/write permission tests.
- `server/src/modules/issues/issues.controller.ts` exposes issues without auth even though docs define issue reads as authenticated by default.
- `server/src/modules/deployments/deployments.controller.ts` exposes all deployments without visibility checks.
- Permission logic is not centralized yet, which will become hard to maintain as routes grow.

### Scalability And Performance

- `server/src/modules/projects/projects.service.ts` returns all projects and all project comments without pagination.
- `server/src/modules/posts/posts.service.ts` returns all posts and all post comments without pagination.
- `server/src/modules/discussions/discussions.service.ts` returns all messages for a thread without pagination.
- `server/src/modules/issues/issues.service.ts` returns all matching issues without pagination.
- `server/src/modules/requests/requests.service.ts` returns all matching requests without pagination.
- `server/src/modules/deployments/deployments.service.ts` returns all deployments without pagination.
- `server/src/common/utils/ttl-cache.ts` is process-local and not production cache infrastructure for multi-instance deployments.
- `server/src/common/middleware/rate-limit.middleware.ts` has an in-memory fallback that is not suitable as the only production limiter.

### Reliability

- `server/src/modules/discussions/discussions.service.ts` now retries unique message sequence conflicts and has integration coverage for concurrent sends; heavier load testing is still needed before launch.
- Like queue processing in `server/src/modules/posts/posts.service.ts` and `server/src/modules/projects/projects.service.ts` is in-process and only processes a small batch per trigger.
- Cache invalidation is manual and easy to miss as write APIs expand.
- There is no background cleanup for expired sessions, orphaned uploaded files, or expired upload targets.

### Media Uploads

- `server/src/modules/storage/storage.service.ts` trusts client-provided `entityId` for project/post paths without ownership validation.
- File size is client-declared in `CreateUploadTargetDto`; production needs enforcement at storage policy level.
- The docs choose S3 + CloudFront, while code defaults to Supabase unless configured otherwise. Production direction should be explicit.

### Maintainability

- Several docs still describe earlier MongoDB/frontend-first assumptions while code now uses Prisma/PostgreSQL. Align docs to current architecture.
- API contract examples still use older response names like `token` while code returns `accessToken`.
- Some modules are read-only placeholders or incomplete relative to docs: issues, requests, deployments, and proof resume.
- Lint currently fails in both client and server, so code quality gates are not yet reliable.
- Root `README.md` is stale and can mislead contributors about backend persistence, auth status, and current architecture.
- The frontend route model currently conflicts with the docs' discovery-friendly product strategy.

### Observability

- `server/src/common/middleware/request-context.middleware.ts` logs JSON with `console.log`; production should use a structured logger with levels, redaction, request/user context, and log routing.
- There is no error monitoring integration.
- Health coverage exists but should be confirmed for readiness checks and DB dependency status.

## Suggested Production Work Order

1. Fix secrets and CI gates.
2. Align documentation and product access policy so public discovery and private collaboration are unambiguous.
3. Lock down authorization for requests, discussions, issues, deployments, saved projects, and uploads.
4. Add pagination and hot-path indexes.
5. Add permission matrix tests and auth/session integration tests.
6. Harden media upload ownership and provider config.
7. Add observability, backups, staging, and rollback runbooks.
8. Re-run launch-readiness review against this checklist.

## Definition Of Production Ready

MeeTogether can be called production-ready only when:

- no secrets are tracked in git
- all lint/build/test gates pass
- every private or mutating route has explicit authorization
- public discovery routes and authenticated collaboration routes match the product visibility policy
- all growing list endpoints are paginated
- hot database queries have indexes
- auth/session behavior is integration-tested
- media uploads cannot target another user's resources
- production email delivery is configured and does not leak tokens to logs
- production rate limiting is backed by shared infrastructure
- logs, errors, health, readiness, backups, and rollback are operational
- staging smoke tests pass before production deploy

## Critical Bugs And Edge Cases Found In Code Review

This section documents bugs, edge cases, and security issues found through code-level inspection that were not previously captured in this checklist.

### Critical Security Bugs

| Severity | Location | Issue |
| --- | --- | --- |
| `Critical` | `server/src/modules/auth/auth.service.ts` signup response | Signup returns `verification.token` in the response body in non-production environments. This raw token could be leaked through browser dev-tools, client logs, or intercepting proxies in staging. If `NODE_ENV` is misconfigured or missing in any deployed environment, verification tokens get exposed. |
| `Critical` | `server/src/modules/auth/auth.service.ts` forgotPassword response | Same issue: `reset.token` is included in the `forgotPassword` response in non-production mode. A single env misconfiguration leaks password reset tokens. |
| `Critical` | `server/src/modules/auth/auth.service.ts` resendVerification response | Same pattern: returns raw verification token in response. Combined with missing rate limit on this endpoint, an attacker could call resend repeatedly and get fresh tokens in response. |
| `Critical` | `server/src/modules/storage/storage.service.ts` ownership bypass | Upload target uses `createUploadTargetDto.entityId` directly to build S3 keys like `projects/{entityId}/cover/...` without verifying the authenticated user owns or can edit that project/post. Any authenticated user can mint upload URLs for other users' resources and overwrite their media. |
| `Critical` | `client/src/store/authSlice.js` | User object is stored in `localStorage` as `meetogether_current_user`. This persists email, username, and profile data in a location vulnerable to XSS. Combined with the access token in localStorage, a single XSS vulnerability gives full account takeover. |
| `High` | `server/src/modules/auth/auth.service.ts` refresh | `Session.refreshTokenHash` has no database index. Refresh/logout queries do `findFirst({ where: { refreshTokenHash } })` which results in a full table scan. With many sessions, this becomes both a performance bottleneck and a DoS vector. |
| `High` | `server/src/modules/auth/auth.service.ts` CSRF validation | CSRF validation compares the header token to the cookie token using `timingSafeEqual`, then hashes the header value and compares to the stored session hash. However, if the session has no `csrfTokenHash` (null), the entire validation is skipped. Old sessions created before CSRF was added bypass CSRF protection entirely. |
| `High` | `server/src/modules/email/email.service.ts` | When `EMAIL_PROVIDER=resend` but `RESEND_API_KEY` is missing, the service silently falls back to `console` provider. In production this means verification/reset emails are never sent, users cannot verify accounts, but the API returns success — creating a broken state invisible to the user and operator. |
| `High` | Rate limit in-memory map never evicts | `rate-limit.middleware.ts` stores buckets in a `Map` that never evicts expired entries. Under sustained traffic, memory grows unbounded. This is a slow memory leak that causes eventual OOM in long-running production processes. |

### Logical Bugs And Edge Cases

| Severity | Location | Issue |
| --- | --- | --- |
| `High` | `server/src/modules/posts/posts.service.ts` likesCount drift | `Math.max(0, updated.likesCount)` prevents negative display but the actual DB column can go negative if concurrent unlikes race. The schema uses `Int @default(0)` with no constraint >= 0. This can cause likesCount to drift to -1 or lower, requiring manual repair. Same bug exists in `projects.service.ts`. |
| `High` | `server/src/modules/discussions/discussions.service.ts` cache serves stale data to wrong user | Discussion thread cache key is `${projectId}:${userId}`, but `getMessagesForThread` uses only `threadId` as cache key without userId. This means User A's read creates a cached version, and User B gets the same cached messages even if their permission context differs or they should see different unread state. |
| `Medium` | `server/src/modules/auth/auth.service.ts` ensureTrustedOrigin | If `origin` header is absent (non-browser clients, Postman, curl, native apps), origin check is silently skipped. This means CSRF protection for refresh/logout depends entirely on the cookie+header mechanism and the origin check provides no real protection for API-only callers. |
| `Medium` | `server/src/modules/discussions/discussions.service.ts` unread increment race | `updateMany` with `increment: 1` on other participants' `unreadCountSnapshot` can race with `markThreadRead` setting it to 0. If markThreadRead runs between the message create and the increment, the user gets unreadCount=1 despite having just marked-read. |
| `Medium` | `server/src/modules/projects/projects.service.ts` create missing category | `CreateProjectDto` in docs mentions `category` field, but the `Project` model in Prisma has no `category` column. If the DTO accepts `category`, it's silently dropped. If it doesn't, the product spec for categorized discovery is broken. |
| `Medium` | `server/src/modules/profiles/profiles.service.ts` savedProjects privacy | `getProfileByUsername` only returns saved projects if `viewerUserId === user.id`, which is correct. However, the `profileCache` caches the response without viewer context for public views (when `viewerUserId` is undefined). If a profile is first loaded by its owner, the cached version (with savedProjects) could leak if the cache key logic had different ordering. Current implementation avoids this only because owner views skip cache — but any refactor that changes this order will create a privacy leak. |
| `Medium` | `server/src/modules/auth/guards/verified-account.guard.ts` DB query on every request | `VerifiedAccountGuard` queries the database on every request to check `emailVerified`. Since this guard is used on most write routes, this adds one extra DB query per authenticated request. At scale, this multiplies total queries significantly. The JWT payload or a cached user lookup should be used instead. |
| `Medium` | `server/src/modules/auth/strategies/jwt.strategy.ts` DB queries on every request | `JwtStrategy.validate` queries both `User` and `Session` tables on every request. Combined with `VerifiedAccountGuard`, each protected endpoint makes 3 DB queries before business logic even starts. This will severely impact p95 latency at scale. |
| `Low` | `server/src/common/utils/ttl-cache.ts` | Cache never proactively evicts expired entries. Entries only get cleaned on `get()`. Large datasets can sit in memory after TTL expires until their key is explicitly requested again. Under high cardinality (e.g., per-user thread cache), memory accumulates. |
| `Low` | `server/src/modules/deployments/deployments.service.ts` unsafe type assertion | The service casts `prisma` to an unsafe type to access `prisma.deployment`. If the `Deployment` model is renamed or restructured, this will fail silently at compile time and crash at runtime. |

### Missing Production Safeguards

| Severity | Location | Issue |
| --- | --- | --- |
| `High` | `server/src/modules/posts/posts.controller.ts` | `GET /posts` (feed) and `GET /posts/:postId/comments` have no auth guard. These are public, which may be intentional for discovery. But `POST /posts/:postId/like` and `POST /posts/:postId/comments` use `VerifiedAccountGuard` — if the feed is public, anonymous comment reading is fine, but the API contract and visibility model docs say feed is public while comments are ambiguous. |
| `High` | `server/src/modules/projects/projects.controller.ts` | Same pattern: `GET /projects` and `GET /projects/:projectId` have no auth guard, but `GET /projects/:projectId/comments` also has no guard. This means project comments are fully public-read without authentication, which may leak collaborator conversation context. |
| `High` | `server/src/modules/auth/auth.controller.ts` resend-verification | No rate limit middleware applied to `POST /auth/resend-verification`. An authenticated user can spam this endpoint indefinitely, triggering unlimited verification emails — potential email bombing if the email provider is active. |
| `Medium` | `server/src/config/configuration.ts` | `jwt.accessSecret` defaults to empty string `''` if `JWT_ACCESS_SECRET` env var is missing. While `env.validation.ts` should catch this, if validation is bypassed (test mode, manual override), the app would sign JWTs with an empty secret, making all tokens forgeable. |
| `Medium` | `server/src/config/env.validation.ts` production enforcement | Only `AUTH_COOKIE_DOMAIN` is enforced for production. There is no production-only enforcement for: `REDIS_URL` (rate limiting falls back silently), storage provider configuration, or email provider being non-console. |
| `Medium` | `server/src/main.ts` | No rate limit on `POST /auth/verify-email` and `POST /auth/reset-password`. An attacker can brute-force token values. Tokens are 32 bytes hex (64 chars) so brute force is impractical, but rate limiting adds defense-in-depth and prevents enumeration. |
| `Medium` | `server/src/modules/posts/posts.service.ts` and `server/src/modules/projects/projects.service.ts` | No message/comment length validation at service level. If DTOs don't enforce `@MaxLength`, users can submit extremely large comments or post bodies, growing DB storage uncontrolled. |
| `Low` | `server/src/common/middleware/rate-limit.middleware.ts` | Redis client on error/end sets `redisClient = null`, but there's no reconnection logic. Once Redis disconnects, rate limiting permanently falls back to in-memory for the lifetime of that process. |
| `Low` | `server/src/modules/auth/auth.service.ts` | `req.ip` can be undefined with misconfigured proxies. While `trust proxy` is set, if the client doesn't send `X-Forwarded-For`, session `ipAddress` is stored as `undefined`. This makes session audit unreliable. |

### Schema Missing Indexes (Production Blockers For Scale)

| Table | Missing Index | Why Needed |
| --- | --- | --- |
| `Session` | `refreshTokenHash` | Refresh and logout query by this field with no index — full table scan. |
| `Request` | `[fromUserId, toUserId, type, relatedProjectId, relatedThreadId, status]` (partial composite) | Duplicate active request check does a multi-field query with no composite index. |
| `Request` | `[toUserId, unread, createdAt]` | Inbox query with unread filter scans all user requests without composite support. |
| `Request` | `[fromUserId, createdAt]` | Rate limit check counts recent sender requests without composite support. |
| `Post` | `[createdAt desc]` | Feed endpoint returns posts ordered by `createdAt desc` but existing index is `[authorUserId, createdAt]` — feed scan uses no index. |
| `Project` | `[createdAt desc]` | Same pattern: project listing ordered by `createdAt desc` has no covering index. |

### Frontend Security Issues

| Severity | Location | Issue |
| --- | --- | --- |
| `High` | `client/src/lib/api.js` | Access token stored in `localStorage` is accessible to any XSS payload. Combined with user data also in localStorage, a single XSS gives full session hijack. |
| `Medium` | `client/src/lib/api.js` | Refresh token retry has no retry-count cap beyond the single `isRetry` flag. If the server returns 401 on the retry, it stops — but there's a potential infinite loop if multiple concurrent requests all trigger refresh simultaneously. The `isRefreshingToken` mutex helps but the deduplication window is not foolproof under rapid navigation. |
| `Medium` | `client/src/store/authSlice.js` | `restoreSession` thunk calls `/auth/refresh` with POST but does not attach the CSRF header through the normal `apiRequest` path because it passes explicit headers. The `withCsrfHeader` utility in `api.js` handles this, but only because `apiRequest` applies it implicitly. If `restoreSession` ever bypasses `apiRequest`, CSRF validation would fail. |
| `Low` | `client/src/lib/api.js` uploadFileToStorageTarget | Supabase signed upload uses `formData.append("", file)` with empty string key. This relies on Supabase's specific upload API behavior and will break if they change their form-data field expectations. |

## Updated Production Blocker Summary

Adding newly discovered items to the production blocker table:

| Status | Task |
| --- | --- |
| `Not started` | Add index on `Session.refreshTokenHash` to prevent full table scans on refresh/logout. |
| `Not started` | Remove raw token preview from auth response bodies. Even in development, tokens in HTTP responses risk accidental exposure through logging, proxies, or client-side tracking. Use a separate admin/debug endpoint if token inspection is needed. |
| `Not started` | Add rate limit on `POST /auth/resend-verification` to prevent email bombing. |
| `Not started` | Add rate limit on `POST /auth/verify-email` and `POST /auth/reset-password` for brute-force defense. |
| `Not started` | Fix in-memory rate limit bucket map to evict expired entries (prevent memory leak). |
| `Not started` | Enforce production-mode env validation for `REDIS_URL`, email provider != console, and storage provider configuration. |
| `Not started` | Add `@MaxLength` validation to comment/message DTOs to prevent unbounded DB growth. |
| `Not started` | Fix `VerifiedAccountGuard` to use cached/JWT-embedded emailVerified state instead of DB query per request. |
| `Not started` | Reduce per-request DB overhead: cache session validation or include session state in JWT claims with short TTL. |
| `Not started` | Add composite indexes for Request duplicate checks, inbox queries, and rate limit counts. |
| `Not started` | Add standalone `[createdAt desc]` indexes for Post and Project feed queries. |
| `Not started` | Fix discussion message cache to include userId in cache key to prevent cross-user stale data. |
| `Not started` | Add upload target ownership validation so users cannot mint media paths for projects/posts they do not own. |
| `Not started` | Add Redis reconnection logic to rate limit middleware so a transient disconnect does not permanently degrade to in-memory. |
| `Not started` | Add database constraint or application guard to prevent `likesCount` from going negative. |
