# Schema Notes

These are suggested Mongo/Mongoose-friendly entities for MeeTogether.

This is a planning document, not final code.

## 1. User

Purpose:

- authentication
- ownership
- profile identity

Suggested fields:

```js
User {
  _id,
  name,
  username,
  email,
  passwordHash,
  avatar,
  bio,
  title,
  location,
  openTo: [String],
  savedProjectIds: [ObjectId],
  likedProjectIds: [ObjectId],
  createdAt,
  updatedAt
}
```

## 2. ProofProfile

Purpose:

- public builder-facing profile view

Suggested fields:

```js
ProofProfile {
  _id,
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

## 3. Project

Purpose:

- build room data

Suggested fields:

```js
Project {
  _id,
  ownerUserId,
  title,
  problem,
  solution,
  image,
  progress,
  techStack: [String],
  openRoles: [String],
  difficulty,
  timeline,
  mentorStatus,
  githubUrl,
  demoUrl,
  tags: [String],
  contributorUserIds: [ObjectId],
  createdAt,
  updatedAt
}
```

## 4. Issue

Purpose:

- task/issue board

Suggested fields:

```js
Issue {
  _id,
  projectId,
  title,
  description,
  status, // Open | In progress | Done
  priority, // High | Medium | Normal
  assigneeUserId,
  createdByUserId,
  relatedThreadId,
  stackTags: [String],
  roleNeed,
  createdAt,
  updatedAt
}
```

## 5. DiscussionThread

Purpose:

- project-linked thread container

Suggested fields:

```js
DiscussionThread {
  _id,
  projectId,
  title,
  createdByUserId,
  participantUserIds: [ObjectId],
  lastMessageAt,
  createdAt,
  updatedAt
}
```

## 6. DiscussionMessage

Purpose:

- individual messages

Suggested fields:

```js
DiscussionMessage {
  _id,
  threadId,
  projectId,
  authorUserId,
  message,
  sentAt,
  createdAt,
  updatedAt
}
```

## 7. Request

Purpose:

- opportunity inbox

Suggested fields:

```js
Request {
  _id,
  fromUserId,
  toUserId,
  type, // Project | Mentor | Internship | Message | Resume
  title,
  status,
  message,
  proof: [String],
  unread,
  createdAt,
  updatedAt
}
```

## 8. Deployment

Purpose:

- deployment tracking

Suggested fields:

```js
Deployment {
  _id,
  projectId,
  environment, // Production | Preview
  status, // Live | Preview | Queued
  liveUrl,
  repoUrl,
  progress,
  buildHealth,
  releaseFocus,
  updatedAt
}
```

## Relationships summary

- one `User` can own many `Project`
- one `Project` can have many `Issue`
- one `Project` can have many `DiscussionThread`
- one `DiscussionThread` can have many `DiscussionMessage`
- one `User` can send and receive many `Request`
- one `Project` can have zero or many `Deployment` records

## First version simplification

For first backend version:

- keep `DiscussionThread` + `DiscussionMessage` separate
- keep `ProofProfile` as a separate document or computed service layer
- allow some computed counts instead of storing everything eagerly

