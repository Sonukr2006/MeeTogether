# MeeTogether Creation Architecture

## Purpose

MeeTogether already has strong read surfaces:

- Feed
- Project Room
- Discussions
- Issues
- Deployments
- Proof Profile

The missing capability is creator workflow.

Users can see project cards and post cards, but they cannot yet create the underlying product objects that make those surfaces real.

This document defines the product architecture for:

1. Create Project
2. Create Post

The recommendation is to build these in that order.

---

## Product Principle

### Project is the anchor

A project is the durable object in MeeTogether.

It should be the thing that accumulates:

- context
- collaborators
- issues
- discussions
- deployments
- proof signals

A post is a lighter public update layer that can optionally point back to a project.

### Relationship

- one project can have many posts
- one post can optionally belong to one project

This keeps the model flexible without making the feed detached from real work.

---

## Core Product Objects

## Project

Represents a real build space.

It answers:

- what problem is being solved
- what is being built
- who is building it
- what roles are open
- what stage the project is in

### Project outcomes

Creating a project should enable:

- Feed presence through project cards
- Project Room creation
- Default discussion thread creation
- Issue tracking
- Deployment tracking
- Proof linkage later

## Post

Represents a visible update.

It answers:

- what changed
- what help is needed
- what milestone was reached
- what feedback is being requested

### Post outcomes

Creating a post should enable:

- feed visibility
- collaboration discovery
- project awareness
- proof timeline signals

---

## Recommended Creation Entry Points

### Primary entry point

Use a single global action in the navigation:

`Create`

This opens a simple choice surface:

- New Project
- New Post

### Secondary entry points

- Feed empty state: `Start a project`
- Project Room: `Post update`
- Profile: `Create project`

This keeps creation discoverable without adding clutter to every screen.

---

## Create Project Architecture

## User intent

The user wants to start a real build space and make it visible to collaborators.

This is not a casual action. The flow should support richer thinking and better quality inputs.

## UI recommendation

### Use a full page, not a modal

Reason:

- project creation is structured
- project creation has more fields
- users may need to think while writing problem and solution context
- quality improves when the form has room

### Recommended route

`/create/project`

### Success destination

After successful creation:

1. create project
2. create default discussion thread
3. redirect to `/projects/:projectId`

This ensures the project does not feel dead immediately after creation.

---

## Create Project Form Structure

## Section 1: Basics

- `title`
- `category` or `domain`
- `coverImage` optional

### Notes

Title should be short and clear.

Category/domain helps future filtering and discovery.

## Section 2: Problem Context

- `problemStatement`

This should be a textarea, not a one-line input.

Prompt should help the user explain:

- who faces this problem
- what the pain is
- why it matters

### Why this matters

MeeTogether is a proof-of-work product. Weak project context creates weak proof.

## Section 3: Solution Context

- `solutionApproach`

This should also be a textarea, not a one-line input.

Prompt should help the user explain:

- what they are building
- how the system solves the problem
- what makes the approach useful or differentiated

## Section 4: Build Metadata

- `techStack[]`
- `difficulty`
- `timeline`
- `currentStage`
- `mentorStatus`

These help the project become legible in feed cards, rooms, and requests.

## Section 5: Collaboration Setup

- `openRoles[]`
- `contributionExpectations`
- `teamSizeTarget` optional

This section is important because MeeTogether is not just for showing work. It is also for finding collaborators.

## Section 6: Links

- `githubUrl` optional
- `demoUrl` optional
- `docsUrl` optional later
- `designUrl` optional later

## Section 7: Visibility

- `public`
- `private` later
- `draft` optional later

### MVP recommendation

Start with:

- `public`

and add richer visibility later if needed.

---

## Create Project Validation

## Required fields

- `title`
- `problemStatement`
- `solutionApproach`

## Recommended but not required

- `techStack`
- `openRoles`
- `timeline`

## Optional

- `coverImage`
- `githubUrl`
- `demoUrl`

### UX principle

Do not over-constrain early creation.

The goal is to ensure seriousness and readability without making the form exhausting.

---

## Create Project Backend Shape

### Recommended API

`POST /api/v1/projects`

### Request body

```json
{
  "title": "Campus Skill Graph",
  "category": "EdTech",
  "problemStatement": "Students have work scattered across GitHub, resumes, and hackathon notes, which makes real capability hard to evaluate.",
  "solutionApproach": "Create a proof-of-work profile system that turns real build history and contribution evidence into a stronger trust signal.",
  "techStack": ["React", "Node.js", "PostgreSQL"],
  "difficulty": "Intermediate",
  "timeline": "4 weeks",
  "currentStage": "Planning",
  "mentorStatus": "Looking for mentor",
  "openRoles": ["Backend", "UI Engineer"],
  "contributionExpectations": "Need contributors comfortable with scoped weekly ownership.",
  "githubUrl": "https://github.com/example/repo",
  "demoUrl": null,
  "visibility": "public"
}
```

### Response

```json
{
  "id": "project_123",
  "title": "Campus Skill Graph",
  "defaultThreadId": "thread_123"
}
```

### Server-side creation behavior

On successful project creation:

1. persist project
2. persist creator membership
3. create default discussion thread
4. return project id + thread id

---

## Schema Impact for Create Project

Current project model already covers much of the structure.

Potential additions worth considering:

- `category`
- `currentStage`
- `contributionExpectations`

These are not required to start, but they may improve project quality.

---

## Create Post Architecture

## User intent

The user wants to publish a visible update without entering a full workspace setup flow.

## UI recommendation

### Use a modal or drawer

Reason:

- this is lighter weight than project creation
- it should feel quick and interrupt less
- it may happen frequently

### Recommended route strategy

Either:

- route-backed modal at `/create/post`

or

- navbar modal launcher with internal state

Route-backed modal is cleaner if deep-linking matters later.

---

## Post Types

Post creation should start with type selection.

### Recommended types

- `Build Log`
- `Help Needed`
- `Mentor Review`
- `Launch`

These are already aligned with MeeTogether’s product language.

---

## Create Post Form Structure

## Section 1: Post Type

- `type`

## Section 2: Content

- `title`
- `body`
- `image` optional

## Section 3: Context

- `linkedProjectId` optional
- `tags[]`
- `callToAction` optional

### Example CTA values

- need reviewer
- need frontend help
- launch feedback welcome

---

## Type-Specific Post Intent

## Build Log

Use for:

- progress updates
- milestones reached
- what changed

## Help Needed

Use for:

- blockers
- contributor asks
- skill-specific requests

## Mentor Review

Use for:

- design review
- system review
- product feedback asks

## Launch

Use for:

- feature ship
- preview release
- public milestone

---

## Create Post Backend Shape

### Recommended API

`POST /api/v1/posts`

### Request body

```json
{
  "type": "Build Log",
  "title": "GitHub import service is ready for review",
  "body": "Finished OAuth flow, repo sync, and contribution mapping. Looking for one reviewer before linking it to profile history.",
  "linkedProjectId": "project_123",
  "tags": ["Backend", "GitHubAPI"],
  "image": null
}
```

### Response

```json
{
  "id": "post_123",
  "type": "Build Log",
  "linkedProjectId": "project_123"
}
```

---

## Feed Architecture Recommendation

The feed should become a mixed stream of:

- posts
- project cards

but the creation model should remain split.

Do not merge project creation and post creation into one giant form.

### Reason

Projects are durable structured objects.

Posts are lightweight event/update objects.

Forcing them into one form will reduce clarity and create worse inputs.

---

## MVP Sequence

## Phase 1

Create Project MVP

- project create page
- backend create project API
- default discussion thread creation
- redirect to project room

## Phase 2

Create Post MVP

- type selection
- post composer
- linked project support
- feed rendering

## Phase 3

Edit and draft support

- edit project
- edit post
- draft project
- draft post

---

## Recommended Next Implementation

Start with:

1. `Create Project` route and UX
2. backend `POST /projects`
3. auto-create default discussion thread
4. redirect to the new project room

Only after that should `Create Post` be built.

This preserves the product’s proof-of-work structure and ensures that posts have a meaningful place to point back to.
