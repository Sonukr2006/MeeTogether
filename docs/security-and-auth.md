# Security and Auth

This document defines the security baseline for MeeTogether.

Target:

- real launch
- early production
- around 10k users in the first month

This is not hyperscale guidance.  
It is a practical launch-grade baseline.

## Auth strategy

Recommended approach:

- access tokens via JWT
- hashed passwords via `bcrypt`
- refresh token support if session length matters

For first stable launch, the selected model is:

- short-lived access token
- refresh token in secure httpOnly cookie

Reason:

- better UX than access-only auth
- safer refresh handling than storing refresh tokens in client JS
- good balance for an early production launch

Selected refresh token model:

- opaque refresh token
- hashed in session store
- rotated on every successful refresh

Reason:

- simpler revocation semantics
- avoids overloading JWT for long-lived session state
- easier replay handling

## Password rules

Minimum:

- hash with `bcrypt`
- never store raw passwords
- enforce minimum length
- reject obvious weak passwords if possible

Recommended:

- min 10 to 12 chars
- allow passphrases

## Token rules

Access token:

- short lifetime, for example `15m`

Refresh token:

- longer lifetime, for example `7d` or `30d`
- rotate on refresh

Store refresh tokens safely:

- hash refresh token or session secret in database
- track via session table
- support explicit revocation

## Session model

Selected session model fields:

```js
Session {
  _id,
  userId,
  refreshTokenHash,
  userAgent,
  ipAddress,
  expiresAt,
  revokedAt,
  createdAt
}
```

This gives:

- logout support
- device/session tracking
- token revocation

## Concrete auth decisions

### Access token

- signed JWT
- short TTL, recommended `15m`

### Refresh token

- opaque token
- stored in secure httpOnly cookie
- rotate on use

Cookie settings for production:

- `HttpOnly: true`
- `Secure: true`
- `SameSite: Lax` by default
- narrow cookie path if refresh endpoint is isolated

Recommended cookie scope:

- use refresh cookie only for auth refresh flow
- do not use cookie as general API auth mechanism

### Logout

- revoke current session

### Logout all devices

- revoke all active sessions for that user

### Session concurrency policy

Launch recommendation:

- allow multiple sessions
- store each device/browser as separate session
- optionally cap active sessions per user later if abuse appears

### Email verification

Launch recommendation:

- strongly recommended before enabling full collaboration privileges

Minimum launch compromise if deferred:

- allow signup/login
- restrict sensitive growth vectors later if abuse appears

Why this matters:

- email format validation is not enough
- a syntactically valid email may still not belong to a real inbox
- domain existence alone does not prove user ownership

Practical recommendation:

- send verification link or OTP
- mark account as verified only after successful confirmation

Suggested user fields:

```js
emailVerified
emailVerificationToken
emailVerificationExpiresAt
```

Suggested rule:

- unverified users may sign up
- but high-trust actions should be limited until email is verified

Examples of high-trust actions:

- sending many requests
- joining sensitive collaboration spaces
- creating high-volume discussion activity

Suggested account states:

- `pending_verification`
- `active`
- `suspended` later if moderation requires it

Verification token rules:

- one-time use
- short expiry
- resend allowed with cooldown
- generic responses to avoid account enumeration

### Password reset

Must exist before real launch, even if basic:

- request reset token
- verify token
- set new password
- revoke prior sessions on reset

Password reset token rules:

- one-time use token
- hashed before persistence
- short expiry
- invalid after successful reset
- generic success response on request step, regardless of whether account exists

## API security baseline

Use:

- `helmet`
- request body size limits
- strict CORS config
- rate limiting
- input validation

## CSRF policy

Because refresh tokens are stored in cookies, CSRF must be considered explicitly.

Launch decision:

- access token is sent in `Authorization` header
- refresh token cookie is only used on refresh endpoint
- refresh endpoint should be protected with `SameSite=Lax` and origin checks
- if cross-site flows later require weaker SameSite, add explicit CSRF token protection

Recommendation:

- keep state-changing application APIs on bearer access tokens
- keep refresh isolated from normal app writes

## CORS

Never use loose wildcard CORS in production unless absolutely necessary.

Use explicit allowlists:

- frontend production domain
- staging domain if needed
- local dev domain

Also validate:

- request `Origin`
- trusted frontend hosts for refresh/auth-sensitive endpoints

## Rate limiting

Apply stronger rate limits on:

- signup
- login
- password reset
- message creation if abuse risk increases
- request creation

Example ideas:

- login: aggressive per IP + per identity
- signup: moderate per IP
- messaging: moderate burst protection

Recommended auth abuse handling:

- return generic auth failure responses
- avoid revealing whether email/username exists
- add temporary backoff or lockout after repeated failed login attempts
- log suspicious auth attempts for review

## Validation

Every input should be validated at the API boundary.

Use a request validation layer.

Good choices:

- `zod`
- `joi`
- `yup`

Validate:

- ids
- emails
- usernames
- issue status transitions
- message lengths
- array lengths

Auth-specific validation rules should also define:

- username normalization
- email normalization
- password minimum and maximum length
- acceptable username charset

Recommendation:

- store email in normalized lowercase form
- define username policy once and reuse it everywhere

## Output sanitization

Do not return internal fields such as:

- passwordHash
- refreshTokenHash
- internal moderation notes

Always map DB documents to response DTOs.

## Authorization enforcement

Security is not just auth.

Every protected write route needs:

1. authentication
2. permission check
3. validated resource ownership or membership

## Abuse protection

For launch readiness, at minimum consider:

- login abuse
- signup spam
- message spam
- request spam
- oversized payload abuse

Nice next step:

- content moderation queue later

## Data protection

Sensitive data:

- email
- auth/session data
- private request inbox
- private saved project lists

Recommendations:

- encrypt secrets in env vars
- avoid storing unnecessary private data
- keep logs free of tokens/passwords

## Error handling

Use a consistent API error shape.

Example:

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

Do not leak:

- stack traces
- DB internals
- auth implementation details

Suggested auth error behavior:

- signup should not leak whether email is already in use beyond necessary UX decisions
- login should use generic invalid-credentials response
- reset request should always return generic success response

## Logging

Log:

- request id
- user id when available
- route
- status code
- latency
- error class

Do not log:

- raw passwords
- raw JWTs
- refresh tokens

For privileged accounts:

- log admin sign-ins
- log session revocations
- log permission-denied events on privileged routes

## Secrets management

At minimum:

- `.env` for local
- secure env management for production

Separate secrets for:

- JWT access secret
- JWT refresh secret
- DB URI
- mail provider if added later

Operational recommendation:

- rotate JWT and session-related secrets when compromise is suspected
- document emergency token invalidation procedure

## Replay detection for rotated refresh tokens

When refresh rotation is enabled, old refresh token reuse should be treated as a security signal.

Launch recommendation:

- if a rotated refresh token is reused, revoke that session family
- require reauthentication for affected session(s)
- log the event with request metadata

This protects against stolen refresh token replay.

## Session table recommendations

Useful additional fields:

```js
Session {
  _id,
  userId,
  refreshTokenHash,
  userAgent,
  ipAddress,
  expiresAt,
  revokedAt,
  createdAt,
  lastUsedAt,
  tokenFamilyId
}
```

Why:

- `lastUsedAt` helps session audit and cleanup
- `tokenFamilyId` helps replay detection and session-family revocation

## Admin and privileged account hardening

If admin or moderator roles exist, use stronger controls:

- require MFA later as platform maturity grows
- monitor privileged sign-ins
- audit privileged actions
- avoid long-lived privileged sessions

## Security checklist before launch

1. password hashing enabled
2. JWT expiry configured
3. refresh token revocation strategy decided
4. CORS locked down
5. rate limits active
6. request validation active
7. auth middleware tested
8. permission tests written
9. production logs scrubbed for secrets
10. health endpoint added

## Recommended implementation decision summary

- access JWT: yes
- refresh cookie: yes
- session table: yes
- refresh rotation: yes
- opaque refresh token: yes
- replay detection on refresh reuse: yes
- logout all devices: yes
- email verification: recommended, not optional for long-term
- password reset: required before real public launch
- CSRF-conscious cookie policy: yes
