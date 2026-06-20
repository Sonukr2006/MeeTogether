# Requirements Document

## Introduction

MeeTogether is a build-first tech network for students and early engineers. The platform currently has a working NestJS + Prisma + PostgreSQL backend with React + Vite + Tailwind frontend, but requires comprehensive production hardening before a 10,000-user public launch. This document captures the requirements for systematically resolving all identified security vulnerabilities, logical bugs, missing safeguards, scalability gaps, and operational deficiencies — organized by implementation priority.

## Glossary

- **Backend**: The NestJS server application located in `server/`, using Prisma ORM with PostgreSQL
- **Frontend**: The React + Vite + Tailwind client application located in `client/`
- **Auth_Service**: The authentication module at `server/src/modules/auth/auth.service.ts` handling signup, login, refresh, logout, verification, and password reset
- **Rate_Limiter**: The rate limiting middleware at `server/src/common/middleware/rate-limit.middleware.ts`
- **Upload_Service**: The storage module at `server/src/modules/storage/storage.service.ts` handling media upload target generation
- **Discussion_Service**: The discussions module at `server/src/modules/discussions/discussions.service.ts`
- **Email_Service**: The email module at `server/src/modules/email/email.service.ts` handling transactional email delivery
- **JWT_Strategy**: The Passport JWT strategy at `server/src/modules/auth/strategies/jwt.strategy.ts` that validates tokens on every request
- **Verified_Account_Guard**: The NestJS guard at `server/src/modules/auth/guards/verified-account.guard.ts` that checks email verification status
- **Token_Client**: The frontend API client at `client/src/lib/api.js` managing access token storage and refresh
- **Session**: A database record in the `Session` table tracking active refresh token hashes, IP addresses, and CSRF token hashes
- **Env_Validator**: The environment validation module at `server/src/config/env.validation.ts`
- **Permission_Helper**: A centralized authorization utility (to be created) for consistent permission checks across modules
- **TTL_Cache**: The in-process time-to-live cache utility at `server/src/common/utils/ttl-cache.ts`

## Requirements

### Requirement 1: Remove Token Leakage from Auth Responses

**User Story:** As a platform operator, I want authentication tokens to never appear in HTTP response bodies, so that tokens cannot be leaked through browser dev-tools, client logs, intercepting proxies, or misconfigured environments.

#### Acceptance Criteria

1. WHEN a user signs up, THE Auth_Service SHALL send the verification token only via email and SHALL NOT include the raw token in the HTTP response body regardless of environment
2. WHEN a user requests a password reset, THE Auth_Service SHALL send the reset token only via email and SHALL NOT include the raw token in the HTTP response body regardless of environment
3. WHEN a user requests verification email resend, THE Auth_Service SHALL send the verification token only via email and SHALL NOT include the raw token in the HTTP response body regardless of environment
4. IF a developer needs to inspect tokens during local development, THEN THE Backend SHALL provide a separate debug-only admin endpoint gated behind a `DEBUG_TOKEN_INSPECT=true` environment variable that is explicitly blocked in production

### Requirement 2: Validate Upload Target Ownership

**User Story:** As a platform operator, I want upload target generation to verify resource ownership, so that authenticated users cannot mint media upload paths for projects or posts they do not own.

#### Acceptance Criteria

1. WHEN an authenticated user requests an upload target for a project entity, THE Upload_Service SHALL verify the user is the project owner or an admin before generating the upload URL
2. WHEN an authenticated user requests an upload target for a post entity, THE Upload_Service SHALL verify the user is the post author before generating the upload URL
3. IF an authenticated user requests an upload target for a resource they do not own, THEN THE Upload_Service SHALL return a 403 Forbidden response
4. THE Upload_Service SHALL validate that the referenced entityId corresponds to an existing resource before generating any upload URL

### Requirement 3: Secure Frontend Token Storage

**User Story:** As a security engineer, I want access tokens stored only in memory, so that a single XSS vulnerability cannot steal persistent authentication credentials.

#### Acceptance Criteria

1. THE Token_Client SHALL store access tokens only in JavaScript memory (module-scoped variable) and SHALL NOT persist them in localStorage, sessionStorage, or cookies accessible to JavaScript
2. THE Token_Client SHALL remove the `meetogether_current_user` entry from localStorage and SHALL NOT persist user profile data in browser-accessible storage
3. WHEN the browser tab is refreshed, THE Token_Client SHALL obtain a new access token by calling the refresh endpoint using the HTTP-only refresh cookie
4. WHEN multiple concurrent requests receive a 401 response, THE Token_Client SHALL deduplicate refresh attempts using a single in-flight promise and retry all queued requests with the new token
5. THE Token_Client SHALL cap token refresh retries at a maximum of 2 attempts before redirecting the user to the login page

### Requirement 4: Add Session Refresh Token Hash Index

**User Story:** As a platform operator, I want the Session table indexed on refreshTokenHash, so that refresh and logout operations do not cause full table scans as the user base grows.

#### Acceptance Criteria

1. THE Backend SHALL add a database index on `Session.refreshTokenHash` in the Prisma schema
2. WHEN a refresh token operation queries by refreshTokenHash, THE Backend SHALL use the index to resolve the query without a full table scan

### Requirement 5: Enforce CSRF Validation for All Sessions

**User Story:** As a security engineer, I want CSRF validation enforced for all sessions including legacy ones, so that sessions created before CSRF was implemented cannot bypass protection.

#### Acceptance Criteria

1. WHEN a session has a null `csrfTokenHash`, THE Auth_Service SHALL reject the refresh or logout request with a 401 Unauthorized response and require re-authentication
2. THE Auth_Service SHALL NOT skip CSRF validation when `csrfTokenHash` is null or undefined on the session record
3. WHEN a user with a legacy session attempts to refresh, THE Auth_Service SHALL return a response indicating the session is invalid and the user must log in again

### Requirement 6: Enforce Production Email Delivery

**User Story:** As a platform operator, I want email delivery to fail closed in production, so that verification and password reset emails are never silently dropped while the API reports success.

#### Acceptance Criteria

1. WHILE the application is running in production mode, THE Email_Service SHALL require a valid email provider configuration with verified credentials
2. IF the configured email provider credentials are missing or invalid in production, THEN THE Email_Service SHALL throw a startup error and prevent the application from starting
3. WHILE the application is running in production mode, THE Email_Service SHALL NOT fall back to console logging for email delivery
4. IF an email delivery attempt fails in production, THEN THE Email_Service SHALL return an error to the caller and log the failure with structured error details

### Requirement 7: Fix Rate Limiter Memory Leak

**User Story:** As a platform operator, I want the rate limiter to evict expired entries, so that long-running production processes do not experience unbounded memory growth.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL evict expired bucket entries within 60 seconds of their expiration time
2. THE Rate_Limiter SHALL implement a periodic cleanup interval that removes all expired entries from the in-memory map
3. WHEN the Rate_Limiter process shuts down, THE Rate_Limiter SHALL clear the cleanup interval to prevent resource leaks
4. THE Rate_Limiter SHALL cap the maximum number of tracked buckets at a configurable limit (default 100,000) and reject new entries with a 429 response when the cap is reached

### Requirement 8: Prevent Negative Like Count Drift

**User Story:** As a developer, I want like counts to never go below zero, so that the UI does not display nonsensical negative numbers.

#### Acceptance Criteria

1. WHEN a user unlikes a post, THE Backend SHALL decrement `likesCount` only if the current value is greater than zero
2. WHEN a user unlikes a project, THE Backend SHALL decrement `likesCount` only if the current value is greater than zero
3. THE Backend SHALL use a conditional database update (e.g., `where likesCount > 0` or `Math.max(0, count - 1)`) to prevent race conditions from driving the count negative

### Requirement 9: Fix Discussion Cache Cross-User Data Leak

**User Story:** As a user, I want discussion messages to reflect my own permission context and unread state, so that I never see cached data belonging to another user.

#### Acceptance Criteria

1. WHEN caching discussion thread messages, THE Discussion_Service SHALL include the requesting userId in the cache key
2. WHEN a different user requests the same thread, THE Discussion_Service SHALL return data specific to that user's permission context rather than a cached response from another user
3. WHEN a user marks a thread as read, THE Discussion_Service SHALL invalidate the cache entry for that specific user and thread combination

### Requirement 10: Fix Unread Count Race Condition

**User Story:** As a user, I want my unread message count to be accurate, so that marking a thread as read does not get overwritten by a concurrent message increment.

#### Acceptance Criteria

1. WHEN a new message is created and the participant has just marked the thread as read, THE Discussion_Service SHALL use an atomic conditional increment that respects the most recent read timestamp
2. THE Discussion_Service SHALL increment unreadCountSnapshot only for participants whose last-read timestamp is earlier than the new message creation time
3. IF a markThreadRead operation runs concurrently with a message creation, THEN THE Discussion_Service SHALL resolve the conflict in favor of the operation with the later timestamp

### Requirement 11: Reduce Per-Request Database Overhead

**User Story:** As a platform operator, I want protected endpoints to not make 3 database queries before business logic starts, so that p95 latency remains acceptable at 10,000 users.

#### Acceptance Criteria

1. THE JWT_Strategy SHALL include `emailVerified` status in the JWT payload and validate it from the token without querying the database on every request
2. THE Verified_Account_Guard SHALL check the `emailVerified` claim from the JWT payload instead of querying the User table
3. THE JWT_Strategy SHALL validate session existence using a short-TTL in-memory cache (maximum 30 seconds) rather than querying the Session table on every request
4. WHEN a user verifies their email or a session is revoked, THE Auth_Service SHALL issue a new access token with updated claims or invalidate the cached session entry

### Requirement 12: Add Rate Limits to Verification and Reset Endpoints

**User Story:** As a security engineer, I want rate limits on resend-verification, verify-email, and reset-password endpoints, so that email bombing and token brute-force attacks are mitigated.

#### Acceptance Criteria

1. THE Backend SHALL apply a rate limit of 3 requests per 15 minutes per authenticated user on `POST /auth/resend-verification`
2. THE Backend SHALL apply a rate limit of 5 requests per 15 minutes per IP address on `POST /auth/verify-email`
3. THE Backend SHALL apply a rate limit of 5 requests per 15 minutes per IP address on `POST /auth/reset-password`
4. WHEN a rate limit is exceeded, THE Backend SHALL return a 429 Too Many Requests response with a `Retry-After` header

### Requirement 13: Enforce Production Environment Validation

**User Story:** As a platform operator, I want the application to fail at startup when critical production configuration is missing, so that silent degradation does not create invisible broken states.

#### Acceptance Criteria

1. WHILE the application is starting in production mode, THE Env_Validator SHALL require `REDIS_URL` to be set and valid
2. WHILE the application is starting in production mode, THE Env_Validator SHALL require a non-console email provider with valid credentials
3. WHILE the application is starting in production mode, THE Env_Validator SHALL require `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to be non-empty strings of at least 32 characters
4. WHILE the application is starting in production mode, THE Env_Validator SHALL require a configured storage provider (S3 or equivalent) with valid credentials
5. IF any required production configuration is missing, THEN THE Backend SHALL log the specific missing variables and exit with a non-zero status code

### Requirement 14: Add MaxLength Validation to Content DTOs

**User Story:** As a platform operator, I want user-submitted content to have enforced length limits, so that unbounded input does not grow database storage uncontrollably.

#### Acceptance Criteria

1. THE Backend SHALL enforce a maximum length of 10,000 characters on post body content in the CreatePost DTO
2. THE Backend SHALL enforce a maximum length of 2,000 characters on comment content in all comment-related DTOs
3. THE Backend SHALL enforce a maximum length of 5,000 characters on discussion message content in the CreateMessage DTO
4. THE Backend SHALL enforce a maximum length of 500 characters on issue title and 5,000 characters on issue description in relevant DTOs
5. WHEN content exceeds the maximum length, THE Backend SHALL return a 400 Bad Request response with a descriptive validation error

### Requirement 15: Add Redis Reconnection Logic

**User Story:** As a platform operator, I want the rate limiter to automatically reconnect to Redis after a transient disconnect, so that a brief network issue does not permanently degrade rate limiting to in-memory mode.

#### Acceptance Criteria

1. WHEN Redis disconnects, THE Rate_Limiter SHALL attempt reconnection with exponential backoff starting at 1 second and capping at 30 seconds
2. WHILE Redis is disconnected, THE Rate_Limiter SHALL use the in-memory fallback and log a warning on each request indicating degraded mode
3. WHEN Redis reconnects successfully, THE Rate_Limiter SHALL resume using Redis as the primary store and log an info-level reconnection event
4. THE Rate_Limiter SHALL cap reconnection attempts at 10 before entering a permanent fallback state that logs an error-level alert

### Requirement 16: Align Public vs Authenticated Comment Visibility

**User Story:** As a product owner, I want a consistent visibility model for comments, so that the API does not accidentally expose collaborator conversation context to unauthenticated users.

#### Acceptance Criteria

1. WHEN an unauthenticated user requests project comments, THE Backend SHALL return only comments on projects explicitly marked as public-read
2. WHEN an unauthenticated user requests post comments, THE Backend SHALL return comments only if the post feed is designated as a public discovery surface
3. THE Backend SHALL document the comment visibility policy in the API contract and enforce it consistently across project and post comment endpoints

### Requirement 17: Add Database Indexes for Hot Query Paths

**User Story:** As a platform operator, I want composite indexes on frequently queried paths, so that the database can serve 10,000 users without full table scans on critical operations.

#### Acceptance Criteria

1. THE Backend SHALL add a composite index on `Request` for `[toUserId, status, createdAt]` to support inbox queries with status filtering
2. THE Backend SHALL add a composite index on `Request` for `[fromUserId, createdAt]` to support sent-request queries and rate limit counting
3. THE Backend SHALL add a composite index on `Request` for `[fromUserId, toUserId, type, status]` to support duplicate active request checks
4. THE Backend SHALL add a standalone descending index on `Post.createdAt` to support feed ordering
5. THE Backend SHALL add a standalone descending index on `Project.createdAt` to support project listing ordering

### Requirement 18: Add Cursor Pagination to All List Endpoints

**User Story:** As a platform operator, I want all list endpoints to return paginated results, so that response sizes remain bounded regardless of data growth.

#### Acceptance Criteria

1. THE Backend SHALL add cursor-based pagination to `GET /posts` (feed) with a default page size of 20 and a maximum of 50
2. THE Backend SHALL add cursor-based pagination to `GET /projects` with a default page size of 20 and a maximum of 50
3. THE Backend SHALL add cursor-based pagination to `GET /posts/:postId/comments` with a default page size of 30 and a maximum of 50
4. THE Backend SHALL add cursor-based pagination to `GET /projects/:projectId/comments` with a default page size of 30 and a maximum of 50
5. THE Backend SHALL add cursor-based pagination to discussion thread messages with a default page size of 40 and a maximum of 50
6. THE Backend SHALL add cursor-based pagination to `GET /issues` with a default page size of 20 and a maximum of 50
7. THE Backend SHALL add cursor-based pagination to `GET /deployments` with a default page size of 20 and a maximum of 50
8. WHEN a list endpoint is called without pagination parameters, THE Backend SHALL return the first page at the default size
9. THE Backend SHALL return pagination metadata including `nextCursor`, `hasMore`, and `total` (where efficiently computable) in all paginated responses

### Requirement 19: Harden Authorization for Issues and Deployments

**User Story:** As a platform operator, I want issues and deployments to follow project visibility and role-based write permissions, so that unauthenticated or unauthorized users cannot access or modify project-internal data.

#### Acceptance Criteria

1. WHEN an unauthenticated user requests issues, THE Backend SHALL return a 401 Unauthorized response
2. WHEN an authenticated user requests issues for a project, THE Backend SHALL verify the user has view access to that project before returning results
3. WHEN a user attempts to create or update an issue, THE Backend SHALL verify the user is a project member, assignee, or project owner
4. WHEN an unauthenticated user requests deployments, THE Backend SHALL return a 401 Unauthorized response
5. WHEN a user attempts to create or modify a deployment, THE Backend SHALL verify the user is the project owner, an admin, or has an explicit service identity role
6. THE Backend SHALL apply authentication guards to all issue and deployment endpoints

### Requirement 20: Centralize Permission Helpers

**User Story:** As a developer, I want a single permission module that encapsulates authorization logic, so that access rules are consistent, testable, and maintainable as routes grow.

#### Acceptance Criteria

1. THE Backend SHALL provide a `PermissionService` with methods including `canViewProject`, `canEditProject`, `canPostDiscussionMessage`, `canViewRequest`, `canManageIssue`, and `canManageDeployment`
2. THE Permission_Helper SHALL accept the authenticated user context and the target resource, and return a boolean access decision
3. WHEN a controller needs to check authorization, THE controller SHALL delegate to the Permission_Helper rather than implementing inline permission logic
4. THE Permission_Helper SHALL be covered by unit tests that verify each permission rule against the defined role matrix

### Requirement 21: Add Structured Logging

**User Story:** As a platform operator, I want structured JSON logs with consistent context fields, so that production issues can be diagnosed through log aggregation and search.

#### Acceptance Criteria

1. THE Backend SHALL use a structured logging library (such as Pino) instead of raw `console.log` for all application logging
2. THE Backend SHALL include request ID, HTTP method, route, response status, latency in milliseconds, and authenticated user ID (when available) in every request log entry
3. THE Backend SHALL support configurable log levels (debug, info, warn, error) controlled by an environment variable
4. THE Backend SHALL redact sensitive fields (passwords, tokens, secrets) from log output automatically

### Requirement 22: Add Error Monitoring

**User Story:** As a platform operator, I want unhandled errors reported to a centralized monitoring service, so that production failures are detected and alerted on without relying on manual log review.

#### Acceptance Criteria

1. THE Backend SHALL integrate an error monitoring service (such as Sentry) that captures unhandled exceptions and unhandled promise rejections
2. THE Backend SHALL attach request context (request ID, route, user ID, HTTP method) to each reported error
3. THE Backend SHALL support environment-based configuration for the error monitoring DSN
4. WHEN an unhandled error occurs, THE Backend SHALL report it to the monitoring service and return a generic 500 response to the client without leaking stack traces

### Requirement 23: Add Production Metrics

**User Story:** As a platform operator, I want application metrics exposed for monitoring dashboards, so that p95 latency, error rates, and business events are observable in real time.

#### Acceptance Criteria

1. THE Backend SHALL expose HTTP request metrics including count, latency histogram (p50, p95, p99), and error rate grouped by route and status code
2. THE Backend SHALL track business metrics including signup count, login count, message creation rate, and request creation rate
3. THE Backend SHALL expose metrics in a format compatible with Prometheus scraping or equivalent time-series collection
4. THE Backend SHALL expose a `/metrics` endpoint for metric collection, protected from public access

### Requirement 24: Establish Operations Infrastructure

**User Story:** As a platform operator, I want staging, backups, and documented runbooks, so that deployments can be validated before production and incidents can be resolved with tested procedures.

#### Acceptance Criteria

1. THE platform team SHALL configure automated daily database backups with a retention period of at least 30 days
2. THE platform team SHALL test the backup restore process at least once and document the restore procedure
3. THE platform team SHALL provision a staging environment that mirrors production configuration for pre-deploy validation
4. THE platform team SHALL document rollback procedures for failed deployments including database migration rollback steps
5. THE platform team SHALL create runbooks for: login failure spike, database connection failure, high error rate, and broken discussion posting scenarios

### Requirement 25: Add Permission Matrix and Auth Integration Tests

**User Story:** As a developer, I want automated tests that prove authorization rules and auth flows work correctly, so that permission regressions are caught before deployment.

#### Acceptance Criteria

1. THE Backend SHALL include integration tests that verify each role (anonymous, authenticated, verified, project member, project owner, admin) against each protected endpoint
2. THE Backend SHALL include integration tests for the complete auth flow: signup, email verification, login, refresh token rotation, reuse detection, logout, and logout-all
3. THE Backend SHALL include integration tests that verify session revocation propagates correctly to subsequent requests
4. WHEN a permission matrix test fails, THE CI pipeline SHALL block the deployment

### Requirement 26: Fix Client Lint Errors

**User Story:** As a developer, I want the client codebase to pass lint without errors, so that code quality gates in CI are reliable and consistent across the full stack.

#### Acceptance Criteria

1. THE Frontend SHALL pass `npm run lint` without errors
2. THE CI pipeline SHALL include client lint as a required gate that blocks merging when lint fails
3. THE Frontend SHALL resolve all existing React hook dependency warnings and unused variable errors

