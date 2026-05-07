# API Contract

This is the first-pass API shape for MeeTogether.

Base version example:

`/api/v1`

## Auth

### POST `/api/v1/auth/signup`

Request:

```json
{
  "name": "Sonu Kumar",
  "username": "sonu",
  "email": "sonu@example.com",
  "password": "strong-password"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "u_1",
    "name": "Sonu Kumar",
    "username": "sonu",
    "email": "sonu@example.com"
  }
}
```

### POST `/api/v1/auth/login`

Request:

```json
{
  "email": "sonu@example.com",
  "password": "strong-password"
}
```

### GET `/api/v1/auth/me`

Response:

```json
{
  "id": "u_1",
  "name": "Sonu Kumar",
  "username": "sonu",
  "avatar": "/avatar.png"
}
```

## Projects

### GET `/api/v1/projects`

Response:

```json
[
  {
    "id": "p_1",
    "title": "Campus Skill Graph",
    "problem": "Students have projects scattered across platforms.",
    "solution": "Create a proof-of-work profile...",
    "progress": 64,
    "techStack": ["React", "Node.js"],
    "openRoles": ["Backend", "UI Engineer"]
  }
]
```

### GET `/api/v1/projects/:projectId`

Response:

```json
{
  "id": "p_1",
  "title": "Campus Skill Graph",
  "problem": "Students have projects scattered across platforms.",
  "solution": "Create a proof-of-work profile...",
  "contributors": [],
  "milestones": [],
  "openRoles": [],
  "techStack": []
}
```

## Discussions

### GET `/api/v1/projects/:projectId/threads`

Response:

```json
[
  {
    "id": "t_1",
    "title": "Campus Skill Graph discussion",
    "createdBy": {
      "id": "u_2",
      "name": "Priya Sharma"
    },
    "lastMessageAt": "2026-05-07T10:15:00.000Z",
    "messageCount": 12
  }
]
```

### GET `/api/v1/threads/:threadId/messages`

Response:

```json
[
  {
    "id": "m_1",
    "author": {
      "id": "u_2",
      "name": "Priya Sharma"
    },
    "roleLabel": "Product Mentor",
    "message": "Start with GitHub import first.",
    "sentAt": "2026-05-07T10:15:00.000Z"
  }
]
```

### POST `/api/v1/threads/:threadId/messages`

Request:

```json
{
  "message": "I can take the timeline UI."
}
```

Response:

```json
{
  "id": "m_22",
  "threadId": "t_1",
  "author": {
    "id": "u_1",
    "name": "Sonu Kumar"
  },
  "message": "I can take the timeline UI.",
  "sentAt": "2026-05-07T10:18:00.000Z"
}
```

## Issues

### GET `/api/v1/issues`

Query params supported:

- `projectId`
- `status`
- `assignee`

Response:

```json
[
  {
    "id": "i_1",
    "projectId": "p_1",
    "title": "Connect GitHub OAuth and repo sync",
    "status": "Done",
    "priority": "High",
    "owner": {
      "id": "u_3",
      "name": "Aarav Singh"
    }
  }
]
```

### PATCH `/api/v1/issues/:issueId`

Request:

```json
{
  "status": "In progress",
  "assigneeUserId": "u_1"
}
```

## Requests

### GET `/api/v1/requests`

Response:

```json
[
  {
    "id": "r_1",
    "type": "Project",
    "title": "Invite to build StudySprint dashboard",
    "status": "New",
    "unread": true
  }
]
```

### POST `/api/v1/requests`

Request:

```json
{
  "toUserId": "u_2",
  "type": "Project",
  "title": "Join my project",
  "message": "Need help with React UI"
}
```

## Profile

### GET `/api/v1/profiles/:username`

Response:

```json
{
  "user": {
    "id": "u_1",
    "name": "Sonu Kumar",
    "username": "sonu"
  },
  "proofScore": 842,
  "builderLevel": "Level 7 Builder",
  "savedProjects": [],
  "skills": [],
  "reviews": []
}
```

## Deployments

### GET `/api/v1/deployments`

Response:

```json
[
  {
    "id": "d_1",
    "projectId": "p_1",
    "status": "Live",
    "environment": "Production",
    "liveUrl": "https://example.com",
    "repoUrl": "https://github.com/example/repo"
  }
]
```

## Frontend mapping notes

Current frontend fake data should eventually map like this:

- `projects.js` -> `/projects`, `/issues`, `/deployments`
- `proofProfile.js` -> `/profiles/:username`, `/requests`
- `projectDiscussionsSlice` -> `/threads`, `/messages`

## First integration recommendation

Integrate in this order:

1. auth
2. projects
3. discussions
4. issues
5. requests
6. deployments
7. profile proof aggregation

