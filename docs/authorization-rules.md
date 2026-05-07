# Authorization Rules

This document defines who can do what inside MeeTogether.

The goal is to avoid vague permission logic during implementation.

For a collaboration product, unclear authorization becomes a source of:

- data leaks
- accidental privilege escalation
- inconsistent UX
- hard-to-debug backend behavior

## Core roles

MeeTogether does not need a huge role hierarchy in phase 1.

Use these base roles:

- `guest`
- `user`
- `projectOwner`
- `projectContributor`
- `mentor`
- `admin`

Important note:

`mentor` is not a global super-role.  
It should be treated as a user capability or project-scoped relationship unless explicitly elevated.

## Authorization principles

1. Authentication answers:
   - who is this person?

2. Authorization answers:
   - what is this person allowed to do here?

3. Every mutating route should check:
   - authenticated user
   - resource ownership or membership
   - resource state if relevant

4. Never trust client-declared role strings.

Backend must derive permissions from:

- authenticated user id
- project membership
- stored relationships

## Resource ownership model

### User-owned resources

- profile settings
- saved projects
- liked projects
- own requests they create

### Project-owned resources

- project metadata
- project contributors
- project roles
- project issues
- project deployments
- project discussion threads

### Thread-owned resources

- messages

## Rules by surface

## 1. Auth

### Signup / login

- public

### Get current user

- authenticated user only

## 2. Profile

### View public proof profile

- public

### Edit own profile

- only the profile owner

### Save / unsave project

- only authenticated user for their own saved list

### View saved projects

- only the profile owner by default

Optional later:

- allow explicit public saved collections

## 3. Projects

### View project list

- public or authenticated, depending on launch policy

Recommendation for launch:

- allow read access publicly for discoverability

### View single project

- public read

### Create project

- authenticated user only

### Edit project metadata

Allowed:

- project owner
- admin

Not allowed:

- ordinary contributors unless specific scoped permission is introduced later

### Add or remove contributors

Allowed:

- project owner
- admin

Optional later:

- owner can delegate contributor management to a project manager

## 4. Discussions

### View project threads

Recommended launch policy:

- if project is public, thread list can be readable
- if project becomes private later, membership required

### Create thread

Allowed:

- authenticated project participant
- project owner
- mentor attached to that project

### Post message

Allowed:

- authenticated participant in that thread or project

### Edit / delete message

Allowed:

- message author within short edit window
- admin

Not allowed:

- random contributor editing someone else’s message

### Moderate thread

Allowed:

- project owner
- admin

### Mark unread / read

- per-user state only

## 5. Issues

### View issues

- follows project visibility

### Create issue

Allowed:

- project owner
- project contributor
- mentor on project
- admin

### Update issue status

Allowed:

- assignee
- project owner
- admin

Optional:

- contributor with issue-write permission

### Assign issue

Allowed:

- project owner
- admin

Optional later:

- contributor can self-assign if project policy allows it

### Delete issue

Allowed:

- project owner
- admin

Not allowed:

- assignee by default

## 6. Requests

### Create request

- authenticated user only

### View inbox

- only recipient

### Update request status

- only recipient

### Cancel sent request

- sender can cancel if request is still pending

## 7. Deployments

### View deployments

- follows project visibility

### Create or update deployment record

Allowed:

- project owner
- admin

Optional later:

- deployment bot / CI identity

### Mark deployment live / failed

Allowed:

- trusted service identity
- project owner
- admin

## 8. Reviews / proof signals

### Add mentor review

Allowed:

- mentor linked to the project or explicitly authorized reviewer
- admin

### Edit mentor review

Allowed:

- review author
- admin

### Delete mentor review

Allowed:

- admin
- possibly review author within limited conditions

## Admin powers

Admin should be explicit and rare.

Admin powers:

- resolve disputes
- remove harmful content
- inspect abuse cases
- unblock stuck resources

Admin should not be used as normal application logic.

## Launch-ready permission matrix

## Public

- view feed
- view public projects
- view public proof profiles

## Authenticated user

- like/save project
- create requests
- join allowed discussions
- create their own profile content

## Project owner

- manage project
- manage contributors
- assign issues
- manage project discussion and deployment metadata

## Contributor

- participate in work
- discuss
- update assigned issue status

## Mentor

- discuss
- review
- possibly create guidance issues

## Admin

- moderation and exception handling

## Backend implementation recommendation

Do not hardcode permission logic inside controllers.

Instead use helpers such as:

- `canViewProject(user, project)`
- `canEditProject(user, project)`
- `canPostMessage(user, thread, project)`
- `canAssignIssue(user, issue, project)`

That keeps policy logic centralized and testable.

## Minimum tests needed

At minimum, test:

1. unauthenticated user cannot mutate resources
2. contributor cannot edit project metadata
3. assignee can update their issue status
4. non-participant cannot post to private thread
5. recipient can update request status, sender cannot
6. user cannot edit another user’s saved project list

