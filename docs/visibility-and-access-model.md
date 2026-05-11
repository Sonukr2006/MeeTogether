# Visibility and Access Model

This document defines what is public, what is authenticated-only, and what is membership-scoped in MeeTogether.

The goal is to remove ambiguity before backend implementation.

## Core principle

MeeTogether is discovery-friendly, but not everything should be public.

Use three visibility levels:

- `public`
- `authenticated`
- `project_member`

Optional later:

- `private`

## Resource visibility

## 1. Feed

Default launch policy:

- readable by `public`

Reason:

- discoverability is part of product growth
- feed is the acquisition surface

## 2. Public proof profile

Default launch policy:

- readable by `public`

Public fields:

- display name
- username
- avatar
- title
- bio
- proof score
- builder level
- public links
- shipped project summaries
- verified skill summaries
- public mentor review summaries

Private fields:

- saved projects
- inbound private requests
- internal moderation fields
- raw contact methods not intentionally exposed

## 3. Saved projects

Default launch policy:

- readable only by `authenticated owner`

Reason:

- saved projects are user preference state, not public identity by default

Optional later:

- explicit public collections

## 4. Projects / Build rooms

Default launch policy for launch:

- project metadata is `public`

Public project fields:

- title
- problem
- solution
- tech stack
- open roles
- progress summary
- deployment summary

Restricted project fields for later consideration:

- internal contributor notes
- moderation notes
- private decision logs

## 5. Discussions

Default launch policy for launch:

- thread list and messages are `authenticated`

Reason:

- project discovery can be public
- active discussion should feel like a logged-in collaboration space

Post message:

- only `project_member` or allowed participant

Read discussion:

- authenticated user can read if project is public and discussion is marked public-read
- otherwise `project_member`

Launch simplification recommendation:

- all project discussions require authentication to read
- posting requires membership or explicit allowed participant status

## 6. Issues

Default launch policy:

- read allowed for `authenticated`
- write allowed only by role-based policy

Reason:

- issue board is work coordination, not just marketing surface

## 7. Requests

Default launch policy:

- only sender/recipient can read relevant request state

No public visibility.

## 8. Deployments

Default launch policy:

- deployment summary readable where project is readable

Sensitive deployment internals should remain restricted later if introduced.

## Membership model

Project membership states:

- `owner`
- `contributor`
- `mentor`
- `viewer` (optional later)

For launch:

- `owner`
- `contributor`
- `mentor`

are enough.

## Launch-ready access decisions

### Public can:

- read feed
- read public projects
- read public proof profiles

### Authenticated users can:

- save/like projects
- read discussions for public projects if policy allows
- create requests
- participate in allowed spaces

### Project members can:

- post discussion messages
- interact with project issues according to role

### Project owners can:

- edit project
- assign issues
- manage membership
- manage deployment/project state

## Backend implementation note

Every resource fetch should decide access using explicit helpers:

- `canViewProfile(viewer, profileOwner)`
- `canViewProject(viewer, project)`
- `canViewDiscussion(viewer, project, thread)`
- `canPostDiscussionMessage(viewer, project, thread)`
- `canViewSavedProjects(viewer, owner)`

This avoids scattering visibility logic across controllers.

