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

For first stable launch, two acceptable options:

### Option A

- short-lived access token
- refresh token in secure httpOnly cookie

### Option B

- short-lived access token only
- user reauths more often

Recommendation:

- use **refresh token cookie** for cleaner UX

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
- rotate when appropriate

Store refresh tokens safely:

- hashed in database if you want stronger revocation control
- or tracked via token family/session table

## Session model

Recommended fields:

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

## API security baseline

Use:

- `helmet`
- request body size limits
- strict CORS config
- rate limiting
- input validation

## CORS

Never use loose wildcard CORS in production unless absolutely necessary.

Use explicit allowlists:

- frontend production domain
- staging domain if needed
- local dev domain

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

## Secrets management

At minimum:

- `.env` for local
- secure env management for production

Separate secrets for:

- JWT access secret
- JWT refresh secret
- DB URI
- mail provider if added later

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

