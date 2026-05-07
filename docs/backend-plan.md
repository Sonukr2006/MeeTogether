# Backend Plan

This document defines the first practical backend direction for MeeTogether.

The goal is not to overdesign a huge platform.  
The goal is to support the product surfaces that already exist in the frontend:

- Feed
- Project Room
- Discussions
- Issues
- Deployments
- Proof Profile
- Requests
- Resume

## Core principle

Everything should revolve around a real authenticated user.

That means we should stop thinking in terms of:

- `"Sonu Kumar"` hardcoded in components
- frontend-only fake ownership
- local UI state pretending to be collaboration

And start thinking in terms of:

- `userId`
- `projectId`
- `threadId`
- `messageId`
- `requestId`

## Phase 1 goal

Phase 1 backend should make these flows real:

1. user signs up / signs in
2. user opens their profile
3. user sees projects and issues
4. user opens discussion for a project
5. user sends a message
6. user saves or likes a project
7. user receives or creates requests

We do **not** need full production complexity in phase 1.

## Recommended backend stack

Suggested baseline:

- `Node.js`
- `Express`
- `MongoDB`
- `Mongoose`
- `JWT auth`
- `bcrypt` for password hashing

Why this stack:

- simple enough for the current project size
- flexible for document-style project/discussion data
- familiar for MERN-style development

## Main backend modules

### 1. Auth

Responsibility:

- sign up
- sign in
- get current user
- protect private routes

### 2. Users / Proof Profiles

Responsibility:

- public profile data
- builder score inputs
- saved projects
- opportunity preferences
- mentor review references

### 3. Projects

Responsibility:

- build room metadata
- contributors
- stack
- open roles
- milestones
- project links

### 4. Discussions

Responsibility:

- project threads
- participants
- messages
- unread counts

### 5. Issues

Responsibility:

- project-linked issue/task records
- assignee
- status
- discussion linkage

### 6. Requests

Responsibility:

- collaboration invites
- mentor review requests
- internship offers
- direct opportunity messages

### 7. Deployments

Responsibility:

- environment status
- live url
- preview url
- release note / latest milestone

## Authentication plan

Authentication should be introduced before deeper collaboration features.

## Auth flow

### Signup

User provides:

- name
- username
- email
- password

Backend does:

- validate fields
- ensure unique email and username
- hash password
- create user
- return auth token + user object

### Login

User provides:

- email or username
- password

Backend does:

- find user
- compare password hash
- issue JWT

### Current user

Frontend sends JWT in:

`Authorization: Bearer <token>`

Backend returns:

- id
- name
- username
- avatar
- role or builder type if needed

## Auth-related implementation notes

Need middleware:

- `requireAuth`
- optional `requireProjectAccess` later

Need frontend changes later:

- replace hardcoded author names with authenticated user data
- attach `userId` to project actions and chat messages

## Recommended implementation order

### Step 1

Create backend app scaffold:

- express app
- env config
- db connection
- route folders
- controller folders
- model folders

### Step 2

Implement auth:

- user model
- signup
- login
- current user route

### Step 3

Implement projects:

- list projects
- get project by id

### Step 4

Implement discussions:

- get project threads
- get thread messages
- create message

### Step 5

Implement issues:

- list issues
- filter by project
- update issue status
- assign issue

### Step 6

Implement requests + saved projects:

- create request
- read requests
- update request status
- save project
- unsave project

## Real-life example flow

### Example: student joins discussion

1. Ravi signs in
2. frontend stores JWT
3. Ravi opens `/discussions?projectId=2`
4. frontend requests project threads from backend
5. Ravi sends a message
6. backend saves:
   - `projectId`
   - `threadId`
   - `authorUserId`
   - `message`
   - `sentAt`
7. other participants later see unread state

### Example: recruiter opens profile

1. recruiter opens `/profile/sonu`
2. backend returns public proof profile
3. saved projects remain private unless explicitly exposed
4. recruiter can create a request or message for the user

## Things to avoid

- mixing auth logic into unrelated controllers
- storing display-only duplicated user strings everywhere
- making discussions depend on frontend-generated fake IDs
- building unread logic before user identity is stable

## Immediate next coding step

Best next code task after this doc:

1. scaffold `server/package.json`
2. create express app
3. create auth routes
4. create user model
5. create JWT middleware

