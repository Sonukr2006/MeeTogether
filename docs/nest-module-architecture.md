# NestJS Module Architecture

This document defines the recommended NestJS module layout for MeeTogether.

Target:

- long-term maintainable backend
- clear ownership boundaries
- easy onboarding for additional engineers
- strong compatibility with Prisma + PostgreSQL

## Core principle

Each module should own:

- its controller layer
- its service layer
- its DTOs and validation
- its authorization checks
- its Prisma query orchestration

Avoid putting business logic into:

- controllers
- generic utils folders
- cross-module helper files that silently become a second service layer

## Recommended stack

- `NestJS`
- `Prisma`
- `PostgreSQL`
- `JWT access token`
- `refresh token in secure httpOnly cookie`
- `Zod` or `class-validator` for request validation
- `Pino` for logging

## Top-level module split

### 1. `AppModule`

Responsibility:

- bootstrap global providers
- wire configuration
- wire database
- wire logging
- wire global guards/pipes/interceptors where needed

Should not contain product logic.

### 2. `AuthModule`

Responsibility:

- signup
- login
- refresh
- logout
- logout-all
- current user
- email verification
- password reset
- session revocation

Owns:

- auth controller
- auth service
- JWT strategy/guard
- refresh/session handling

### 3. `UsersModule`

Responsibility:

- current user account data
- public user lookup
- settings/profile-edit inputs that belong to the user record

Examples:

- update avatar
- update name
- update title
- update location
- update open-to preferences

### 4. `ProfilesModule`

Responsibility:

- public proof profile read surface
- recruiter-facing profile response shape
- saved-project projection
- trust signals aggregation

Note:

This module may compose data from:

- users
- projects
- issues
- reviews later

But it should expose one profile-oriented read API.

### 5. `ProjectsModule`

Responsibility:

- project creation
- project detail reads
- project updates
- membership
- build room metadata
- stack/open roles/milestones/links
- save/like actions if we want them close to project flows

Suggested sub-concerns:

- project core
- project membership
- project reactions/bookmarks

### 6. `DiscussionsModule`

Responsibility:

- project thread lookup
- thread messages
- per-user read state
- mark read
- participant state
- later realtime gateway support

Important boundary:

- message storage and thread logic stay here
- websocket gateway later should still depend on this module rather than duplicating chat logic

### 7. `IssuesModule`

Responsibility:

- issue/task CRUD
- issue status transitions
- assignment
- project-scoped issue reads
- issue-to-thread linking when needed

This module should own issue workflow rules.

### 8. `RequestsModule`

Responsibility:

- opportunity inbox
- project invites
- mentor review requests
- internship offers
- collaboration messages at the request layer
- request status updates

This is not the same as chat.
It owns structured opportunity flows.

### 9. `DeploymentsModule`

Responsibility:

- deployment records
- environment status
- live/preview links
- deployment history
- later CI sync hooks if needed

### 10. `NotificationsModule` later

Responsibility:

- notification fanout
- unread notification counters
- email/push/in-app delivery orchestration

Do not block launch on this module.

### 11. `StorageModule` later

Responsibility:

- avatar uploads
- project cover uploads
- proof attachments
- generated resume assets

Designed for S3-compatible backends.

### 12. `JobsModule` later

Responsibility:

- BullMQ queue registration
- background workers
- email jobs
- profile recompute jobs
- deployment sync jobs

## Recommended folder structure

```txt
server/
  src/
    main.ts
    app.module.ts
    common/
      decorators/
      filters/
      guards/
      interceptors/
      pipes/
      constants/
      types/
    config/
      app.config.ts
      auth.config.ts
      database.config.ts
    prisma/
      prisma.module.ts
      prisma.service.ts
    modules/
      auth/
        auth.module.ts
        auth.controller.ts
        auth.service.ts
        auth.types.ts
        dto/
        guards/
        strategies/
      users/
        users.module.ts
        users.controller.ts
        users.service.ts
        dto/
      profiles/
        profiles.module.ts
        profiles.controller.ts
        profiles.service.ts
        dto/
      projects/
        projects.module.ts
        projects.controller.ts
        projects.service.ts
        dto/
      discussions/
        discussions.module.ts
        discussions.controller.ts
        discussions.service.ts
        dto/
      issues/
        issues.module.ts
        issues.controller.ts
        issues.service.ts
        dto/
      requests/
        requests.module.ts
        requests.controller.ts
        requests.service.ts
        dto/
      deployments/
        deployments.module.ts
        deployments.controller.ts
        deployments.service.ts
        dto/
```

## Shared infrastructure modules

### `PrismaModule`

Responsibility:

- provide Prisma client
- expose clean DB access to feature modules

Rule:

- one shared Prisma service
- feature modules do not create their own DB clients

### `ConfigModule`

Responsibility:

- environment configuration
- validated config at startup

### `Common`

Keep this small.

Good candidates:

- `CurrentUser` decorator
- auth guards
- exception filters
- pagination helpers
- shared enums only when truly cross-domain

Bad candidates:

- dumping unrelated business logic
- giant helper files

## Cross-module dependency rules

Preferred pattern:

- `AuthModule` depends on `UsersModule` and `PrismaModule`
- `ProfilesModule` may read from `UsersModule`, `ProjectsModule`, `RequestsModule`
- `IssuesModule` may reference `ProjectsModule`
- `DiscussionsModule` may reference `ProjectsModule`
- `RequestsModule` may reference `UsersModule` and `ProjectsModule`

Avoid:

- circular dependencies
- one module reaching deep into another module's internal service methods

If two modules need the same logic:

- either promote it to a clear shared provider
- or decide which module truly owns that behavior

## Recommended boundary decisions

### Save/like project actions

Two valid placements:

1. keep them in `ProjectsModule`
2. keep them in `ProfilesModule`

Recommended for launch:

- keep write operations in `ProjectsModule`
- expose saved-project reads through `ProfilesModule`

That keeps action ownership and profile projection separate.

### Proof score computation

Do not bury proof-score rules inside controllers.

Recommended:

- `ProfilesModule` owns proof-profile projection
- later `JobsModule` can trigger recompute flows

### Request-driven project invites

Recommended ownership:

- `RequestsModule` owns invite record lifecycle
- `ProjectsModule` owns membership changes after acceptance

## Guards and authorization

Recommended layers:

- JWT auth guard globally available
- feature-level permission checks inside services
- role/ownership guards only where reusable

Rule:

- controllers should not contain real authorization logic
- services should enforce final permission checks

## Pagination and query style

Use consistent query DTOs for:

- cursor pagination where streams can grow large
- filter inputs
- sorting options

Especially for:

- discussions
- issues
- requests
- project feeds later

## Launch-first implementation order

### Step 1

- `AppModule`
- `ConfigModule`
- `PrismaModule`
- `AuthModule`
- `UsersModule`

### Step 2

- `ProfilesModule`
- `ProjectsModule`

### Step 3

- `DiscussionsModule`
- `IssuesModule`

### Step 4

- `RequestsModule`
- `DeploymentsModule`

### Step 5 later

- `NotificationsModule`
- `StorageModule`
- `JobsModule`
- realtime gateway support

## Real-life example

### Example: accept project invite

1. user opens inbox
2. `RequestsModule` returns pending invite
3. user accepts invite
4. `RequestsModule` validates request state
5. `ProjectsModule` adds membership
6. request status is updated to accepted
7. profile/project projections reflect the new membership later

This keeps workflow ownership clear instead of spreading logic across unrelated modules.

## Immediate coding implication

If we adopt this plan, the first backend scaffold should be:

- NestJS app
- Prisma setup
- `AuthModule`
- `UsersModule`
- validated config
- global exception handling

Then build product modules one by one without changing architecture halfway through.
