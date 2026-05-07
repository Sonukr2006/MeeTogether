# Launch Readiness for 10k Users

This document translates the current MeeTogether backend plan into a practical launch target:

`10,000 users in the first month`

This is not huge-scale internet architecture.

But it is enough traffic and product interaction that we should not ship:

- toy auth
- vague permissions
- no rate limits
- no indexes
- no observability

## What 10k users really means

10k registered users does **not** mean 10k concurrent users.

It likely means:

- a much smaller active daily subset
- bursts around launches, sharing, or demos
- read-heavy traffic with occasional write spikes

Typical heavy surfaces:

- feed reads
- project detail reads
- discussion message writes
- issue reads/updates
- profile views

## What must be real by launch

### Must have

- signup/login
- current user route
- project listing and detail
- discussion read/write
- issue listing and status update
- request inbox read/write
- saved project persistence
- permission checks
- validation
- rate limiting
- structured logging
- database indexes

### Nice to have

- refresh token rotation
- basic notifications
- deployment write APIs
- mentor review workflow

### Can wait

- advanced recommendation systems
- websocket realtime
- event-driven architecture
- analytics warehouse

## Performance assumptions

For launch:

- a monolith backend is fine
- MongoDB is fine
- synchronous APIs are fine for most flows

But only if:

- indexes are correct
- payloads are small
- pagination is enforced

## Pagination policy

By launch, do not leave list endpoints unbounded.

Need pagination for:

- feed
- project discussions
- messages
- issues
- requests

## Hot query paths

Most important query paths:

1. get current user
2. get project list
3. get project detail
4. get project threads
5. get thread messages
6. get recipient requests
7. get issues by project/status

These should be optimized first.

## Operational minimum bar

Before launch, backend should have:

- health endpoint
- structured logs
- error monitoring
- backup policy
- staging environment
- rollback capability

## Failure modes to think about

### 1. Auth abuse

- signup spam
- login brute force

Need:

- rate limits
- optional captcha later

### 2. Message spam

Need:

- message length limits
- rate limits
- moderation path later

### 3. Query degradation

Need:

- indexes
- pagination

### 4. Permission mistakes

Need:

- permission matrix tests

## Testing target for launch

At minimum:

- auth integration tests
- permission tests
- discussion message tests
- issue update tests
- request inbox tests

## Recommended rollout order

1. auth
2. projects
3. discussions
4. issues
5. requests
6. saved projects
7. deployments

## Launch confidence questions

Before launch, ask:

1. can any user mutate another user’s data?
2. can project non-owners do owner actions?
3. are heavy list endpoints paginated?
4. do discussion queries have indexes?
5. can we revoke sessions?
6. do we know when the API is failing?
7. can we restore from backup?

If the answer to several of these is `no`, the backend is not launch-ready yet.

## Practical recommendation

For MeeTogether at this stage:

- ship a well-structured monolith
- keep services simple
- avoid premature distributed complexity
- be strict about auth, permissions, validation, and indexing

That is the right kind of discipline for a 10k-user launch.

