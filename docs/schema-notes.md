# Schema Notes

These are suggested PostgreSQL + Prisma-friendly entities for MeeTogether.

This is a planning document, not final code.

## 1. User

Purpose:

- authentication
- ownership
- profile identity

Suggested fields:

```js
User {
  id,
  name,
  username,
  email,
  passwordHash,
  avatar,
  bio,
  title,
  location,
  openTo: [String],
  createdAt,
  updatedAt
}
```

Related relational tables instead of array ownership on the user row:

- `ProjectSave`
- `ProjectLike`
- `Session`

## 2. Session

Purpose:

- refresh token session tracking
- device/session management

Suggested fields:

```js
Session {
  id,
  userId,
  refreshTokenHash,
  tokenFamilyId,
  userAgent,
  ipAddress,
  expiresAt,
  revokedAt,
  lastUsedAt,
  createdAt,
  updatedAt
}
```

## 3. ProofProfile

Purpose:

- public builder-facing profile view

Suggested fields:

```js
ProofProfile {
  id,
  userId,
  proofScore,
  builderLevel,
  rankLabel,
  shippedProjectsCount,
  completedTasksCount,
  verifiedSkillsCount,
  mentorReviewsCount,
  links: [{ label, value, iconKey }],
  trustSignals: [{ label, detail, iconKey }],
  createdAt,
  updatedAt
}
```

Note:

Some of this can be derived instead of fully stored.

## 4. Project

Purpose:

- build room data

Suggested fields:

```js
Project {
  id,
  ownerUserId,
  title,
  problem,
  solution,
  image,
  progress,
  visibility,
  difficulty,
  timeline,
  mentorStatus,
  githubUrl,
  demoUrl,
  createdAt,
  updatedAt
}
```

Recommended relational helpers:

- `ProjectMember`
- `ProjectTechTag`
- `ProjectOpenRole`
- `ProjectTag`
- `ProjectLink`
- `ProjectSave`
- `ProjectLike`

## 5. Issue

Purpose:

- task/issue board

Suggested fields:

```js
Issue {
  id,
  projectId,
  title,
  description,
  status, // Open | In progress | Done
  priority, // High | Medium | Normal
  assigneeUserId,
  createdByUserId,
  relatedThreadId,
  roleNeed,
  createdAt,
  updatedAt
}
```

Related helpers if needed:

- `IssueTag`
- `IssueActivity`

## 6. DiscussionThread

Purpose:

- project-linked thread container

Suggested fields:

```js
DiscussionThread {
  id,
  projectId,
  title,
  createdByUserId,
  kind,
  lastMessageAt,
  createdAt,
  updatedAt
}
```

## 7. DiscussionMessage

Purpose:

- individual messages

Suggested fields:

```js
DiscussionMessage {
  id,
  threadId,
  authorUserId,
  message,
  editedAt,
  deletedAt,
  sequenceNumber,
  createdAt,
  updatedAt
}
```

## 8. ThreadParticipantState

Purpose:

- per-user read and participation state

Suggested fields:

```js
ThreadParticipantState {
  id,
  threadId,
  userId,
  lastReadMessageId,
  lastReadAt,
  unreadCountSnapshot,
  joinedAt,
  mutedAt,
  createdAt,
  updatedAt
}
```

## 9. Request

Purpose:

- opportunity inbox

Suggested fields:

```js
Request {
  id,
  fromUserId,
  toUserId,
  type, // Project | Mentor | Internship | Message | Resume
  title,
  status,
  message,
  relatedProjectId,
  relatedThreadId,
  unread,
  createdAt,
  updatedAt
}
```

## 10. Deployment

Purpose:

- deployment tracking

Suggested fields:

```js
Deployment {
  id,
  projectId,
  environment, // Production | Preview
  status, // Live | Preview | Queued | Failed
  liveUrl,
  previewUrl,
  repoUrl,
  commitSha,
  releaseVersion,
  buildHealth,
  releaseFocus,
  startedAt,
  finishedAt,
  updatedAt
}
```

## Relationships summary

- one `User` can own many `Project`
- one `Project` can have many `ProjectMember`
- one `Project` can have many `Issue`
- one `Project` can have many `DiscussionThread`
- one `DiscussionThread` can have many `DiscussionMessage`
- one `DiscussionThread` can have many `ThreadParticipantState`
- one `User` can send and receive many `Request`
- one `Project` can have zero or many `Deployment` records
- one `User` can have many `Session`
- one `User` can save or like many projects through join tables

## First version simplification

For first backend version:

- keep `DiscussionThread` + `DiscussionMessage` separate
- keep `ThreadParticipantState` for unread/read support
- keep `ProofProfile` as a separate table or computed service layer
- allow some computed counts instead of storing everything eagerly
- start with one default thread per project
