# Create Project Implementation Plan

## Goal

Implement the first real creator workflow in MeeTogether:

- authenticated user creates a project
- backend persists it
- default discussion thread is created automatically
- user is redirected into the new project room

This document translates the product architecture into an engineering plan.

---

## Scope

This implementation covers:

1. frontend create-project route
2. form state and validation
3. backend create-project DTO/controller/service
4. project membership bootstrap
5. default discussion thread bootstrap
6. redirect to created project room

This implementation does **not** yet cover:

- post creation
- drafts
- private visibility
- image upload pipeline
- project editing

---

## User Story

### Primary user story

As a builder,
I want to create a new project with meaningful context,
so that I can start a real collaboration space and make the project visible to others.

### Success outcome

After pressing `Create Project`:

- project exists in database
- creator is attached as owner/member
- default thread exists
- project appears in feed
- user lands in `/projects/:projectId`

---

## Frontend Architecture

## Route

Add:

`/create/project`

This route should be protected by auth.

### Route placement

It belongs inside the authenticated route group, alongside:

- `/`
- `/projects/:projectId`
- `/discussions`
- `/requests`

---

## UI Structure

## Component recommendation

Create:

- `client/src/components/CreateProject/CreateProjectPage.jsx`

Optional supporting components later:

- `ProjectBasicsSection.jsx`
- `ProjectContextSection.jsx`
- `ProjectCollaborationSection.jsx`
- `ProjectLinksSection.jsx`

### MVP recommendation

Keep first version in one page component unless it gets noisy.

Do not over-componentize too early.

---

## Form Model

### Local form state

Recommended fields:

```js
{
  title: "",
  category: "",
  problemStatement: "",
  solutionApproach: "",
  techStackInput: "",
  techStack: [],
  difficulty: "",
  timeline: "",
  currentStage: "",
  mentorStatus: "",
  openRolesInput: "",
  openRoles: [],
  contributionExpectations: "",
  githubUrl: "",
  demoUrl: "",
  visibility: "public"
}
```

### Derived behavior

- `techStackInput` and `openRolesInput` help chip-entry UX
- final payload should send normalized arrays

---

## Frontend Validation

## Required

- `title`
- `problemStatement`
- `solutionApproach`

## Recommended validations

- title min length: 3
- problem statement min length: 80
- solution approach min length: 80
- URL validation for GitHub/demo if present

### UX rule

Show inline field errors.

Do not use only alert-based validation.

---

## Frontend Submission Flow

### On submit

1. validate fields
2. normalize arrays
3. call `POST /api/v1/projects`
4. show loading state on button
5. on success:
   - invalidate/refetch cached project list
   - redirect to `/projects/:projectId`

### On error

- show inline/global error message
- keep form state intact

---

## Frontend State Integration

Current app already has:

- auth state
- cached projects list

### Required follow-up on success

After create succeeds:

- trigger project cache refresh
- optionally optimistic insert later

### Recommendation

For MVP:

- simplest is `dispatch(fetchProjects())` after success

---

## Backend Architecture

## Module ownership

Project creation belongs to:

- `ProjectsModule`

Discussion-thread bootstrap can still be handled inside `ProjectsService` at first, because project creation is the orchestrating action.

Later, thread creation logic can be extracted if needed.

---

## DTO

Add:

- `server/src/modules/projects/dto/create-project.dto.ts`

### Recommended DTO fields

```ts
title: string;
category?: string;
problemStatement: string;
solutionApproach: string;
techStack?: string[];
difficulty?: string;
timeline?: string;
currentStage?: string;
mentorStatus?: string;
openRoles?: string[];
contributionExpectations?: string;
githubUrl?: string;
demoUrl?: string;
visibility?: string;
```

### DTO validation

- `title` required
- `problemStatement` required
- `solutionApproach` required
- arrays validated as strings
- URLs optional but validated if present

---

## Controller

Add to `ProjectsController`:

`POST /api/v1/projects`

This route should:

- require auth
- accept `CreateProjectDto`
- use current authenticated user as owner

### Response shape

```json
{
  "id": "project_123",
  "title": "Campus Skill Graph",
  "defaultThreadId": "thread_123"
}
```

---

## Service Flow

`ProjectsService.createProject(userId, dto)`

### Recommended sequence

1. create `Project`
2. create `ProjectMember` for creator with role `Owner`
3. create `ProjectTechTag[]`
4. create `ProjectOpenRole[]`
5. create default `DiscussionThread`
6. clear relevant caches
7. return project metadata

### Important

This should run inside a Prisma transaction.

Reason:

We do not want project created without membership or thread bootstrap.

---

## Suggested Service Pseudocode

```ts
return prisma.$transaction(async (tx) => {
  const project = await tx.project.create(...);

  await tx.projectMember.create(...);

  if (dto.techStack?.length) {
    await tx.projectTechTag.createMany(...);
  }

  if (dto.openRoles?.length) {
    await tx.projectOpenRole.createMany(...);
  }

  const defaultThread = await tx.discussionThread.create(...);

  return {
    id: project.id,
    title: project.title,
    defaultThreadId: defaultThread.id,
  };
});
```

---

## Schema Considerations

Current schema already supports most project creation fields through:

- `Project`
- `ProjectMember`
- `ProjectTechTag`
- `ProjectOpenRole`
- `DiscussionThread`

### Potential schema gap

Current `Project` model has:

- `problem`
- `solution`

If we want better naming alignment with product language, we can keep backend fields as-is for now and map:

- `problemStatement -> problem`
- `solutionApproach -> solution`

### Optional future schema additions

- `category`
- `currentStage`
- `contributionExpectations`

These can be deferred for MVP if we want low-risk shipping.

---

## Cache Implications

Current backend has in-memory cache for:

- projects list
- project detail

### Required after create

Project creation must invalidate:

- projects list cache
- project detail cache for created id if prefilled later

### Recommendation

Add explicit cache clear inside `ProjectsService.createProject`.

---

## Auth Requirement

Project creation must require authenticated user.

Frontend:

- route under `RequireAuth`

Backend:

- protect `POST /projects` with `JwtAuthGuard`

Owner identity should come from token, not from request body.

---

## UX States

### Empty form state

Clean, structured page with section labels and helper text.

### Loading state

- submit button disabled
- button label changes to `Creating...`

### Success state

No success-only dead screen.

Immediately redirect to project room.

### Error state

Show:

- top-level error summary
- field-level issues where possible

---

## Navbar / Entry Integration

### Add CTA

Add a `Create` action to navbar.

For MVP, this can directly link to:

`/create/project`

Later this can become a menu:

- New Project
- New Post

### Recommendation

Do not wait for create-post to add the entry point.

Start with `New Project`.

---

## Rollout Order

## Step 1

Backend DTO + controller + service transaction

## Step 2

Frontend create project page and protected route

## Step 3

Wire navbar CTA

## Step 4

Invalidate/refetch project cache on success

## Step 5

Redirect to new project room

---

## Out of Scope for First Pass

Do not add these yet unless implementation naturally requires them:

- file upload service
- markdown editor
- autosave drafts
- multi-step wizard
- category taxonomy system
- collaborator invites during creation

Keep the first version direct and shippable.

---

## Recommended Next Coding Task

Start implementing:

1. `CreateProjectDto`
2. `POST /api/v1/projects`
3. transaction-based project creation
4. default discussion thread creation
5. `/create/project` frontend page
6. navbar CTA to open it

This is the smallest implementation slice that turns MeeTogether from a viewer into a creator product.
