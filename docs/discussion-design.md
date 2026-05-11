# Discussion Design

This document defines the backend discussion model more precisely.

The goal is to make discussions stable enough for implementation without overbuilding realtime infrastructure too early.

## Launch model

MeeTogether discussions are:

- project-linked
- thread-based
- authenticated
- membership-aware

## Thread model

For launch, each project should have:

- one default discussion thread

Optional later:

- multiple named channels per project
- issue-linked subthreads

Launch recommendation:

- keep one default thread per project
- allow schema to support more than one thread later

That means:

- frontend can still display threads
- backend stays simple

## Message model

A message should contain:

- `threadId`
- `projectId`
- `authorUserId`
- `message`
- `sentAt`
- `editedAt` optional
- `deletedAt` optional soft delete field later

## Ordering

Messages should be ordered by:

1. `sentAt`
2. `_id` as stable tiebreaker if needed

Do not rely on client timestamps alone.

Server should write canonical message timestamp.

## Read state model

Unread counts should not be derived from message text lists on every request.

Use a per-user read cursor model.

Suggested entity:

```js
ThreadParticipantState {
  _id,
  threadId,
  userId,
  lastReadMessageId,
  lastReadAt,
  unreadCount,
  updatedAt
}
```

Launch simplification:

- `lastReadAt` is enough
- `unreadCount` can be computed or materialized later

Recommended launch version:

- store `lastReadAt`
- compute unread count from `sentAt > lastReadAt`

If performance becomes hot, materialize unread counters later.

## Read flow

### Open thread

1. fetch thread metadata
2. fetch paginated messages
3. mark thread as read for current user

### Send message

1. validate membership
2. persist message
3. update thread `lastMessageAt`
4. update sender read state
5. other participants will observe unread by timestamp delta

## Pagination

Required from launch.

Messages should use cursor-based or timestamp-based pagination.

Recommended first version:

- `GET /threads/:threadId/messages?before=<messageId>&limit=50`

or

- `GET /threads/:threadId/messages?beforeSentAt=<iso>&limit=50`

Default page size:

- 30 to 50

Do not return full thread history unbounded.

## Edit/delete policy

Launch policy:

- message author may edit within short time window
- no hard delete for ordinary users
- admin can moderate

Recommended fields:

- `editedAt`
- `isDeleted`
- `deletedByUserId` optional later

For launch:

- editing can even be deferred
- but schema should allow it

## Membership enforcement

To post a message:

- user must be authenticated
- user must be project owner, contributor, or mentor attached to the project

To read messages:

- user must satisfy the visibility/access policy

## One-thread vs multi-thread evolution

Phase 1:

- one default thread per project

Phase 2:

- multiple threads or channels
- issue-linked thread references

Design implication:

- keep `DiscussionThread` as a first-class collection
- do not collapse everything into `project.messages`

## Suggested indexes

At minimum:

- `threads.projectId`
- `threads.lastMessageAt`
- `messages.threadId + sentAt`
- `participantState.threadId + userId` unique

## Realtime boundary

Launch recommendation:

- start with polling or explicit refetch

Do not block backend launch on websocket infrastructure.

Stable API contract should allow later migration to:
  
- WebSocket
- SSE
- pub/sub

without changing message storage model.

## Suggested routes

### Get threads for project

`GET /api/v1/projects/:projectId/threads`

### Get messages for thread

`GET /api/v1/threads/:threadId/messages`

### Create message

`POST /api/v1/threads/:threadId/messages`

### Mark thread read

`POST /api/v1/threads/:threadId/read`

Request:

```json
{
  "lastReadAt": "2026-05-08T12:00:00.000Z"
}
```

## Launch-ready decision summary

- keep thread and message collections separate
- one default thread per project for launch
- use server timestamps
- enforce pagination
- use per-user read cursor state
- defer realtime transport choice

