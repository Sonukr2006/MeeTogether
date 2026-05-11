# MeeTogether

MeeTogether is a build-first tech network for students and early engineers.

The core idea is simple:

- do real work
- show proof of that work
- collaborate in public or semi-public project spaces
- turn activity into trust, hiring signal, and opportunity

This project is currently a frontend-first product prototype built with React, Vite, Tailwind, Redux Toolkit, and React Router.

## What problem this solves

A lot of student platforms stop at:

- a bio
- a resume
- a GitHub link
- a generic feed

MeeTogether tries to answer a more useful question:

`What has this person actually built, shipped, discussed, fixed, reviewed, or collaborated on?`

Instead of only saying:

`I know React`

the platform tries to show:

`This student shipped a React feature, discussed architecture decisions, completed assigned tasks, got mentor reviews, and contributed inside a project room.`

## Real-life examples

### 1. Student builder example

Ravi is a 2nd-year student.

He is building a project called `Campus Skill Graph`.

On MeeTogether he can:

- post build logs in the feed
- create a build room for the project
- discuss blockers with others
- show verified skills on his proof profile
- save projects and track issues
- share a proof resume with recruiters

So instead of saying:

`I am learning full stack development`

he can show:

- project room activity
- issue history
- discussion participation
- mentor reviews
- shipped project evidence

### 2. Mentor example

Neha is an engineer who mentors students.

She can:

- review project direction
- join discussion channels
- suggest issue flow improvements
- leave mentor-backed proof signals

This makes mentorship visible as part of the builder’s record, not just a private chat.

### 3. Recruiter or startup founder example

A founder wants to find builders for an internship.

Instead of reading only polished bios, they can inspect:

- saved and shipped projects
- open issues
- proof score
- task completion
- discussion behavior
- deployment readiness

That gives a much better signal than a plain resume line.

## Product loop

MeeTogether is designed around this loop:

1. **Feed**  
   Discover work, build logs, launches, mentor review requests, and help-needed posts.

2. **Project Room / Build Room**  
   Collaborate around one project with roles, stack, tasks, signals, and project context.

3. **Discussions**  
   Talk through blockers, ideas, and progress in a project-linked chat surface.

4. **Issues**  
   Track open work, active tasks, and completed tasks across projects.

5. **Deployments**  
   See which builds are live, in preview, or blocked.

6. **Proof Profile**  
   Convert work into a verified builder identity.

7. **Requests**  
   Handle project invites, mentor requests, internship interest, and messages.

8. **Proof Resume**  
   Share a recruiter-friendly proof summary page.

## Current screens

### Home / Feed

The feed mixes:

- proof-style post cards
- build room cards

It is meant to feel less like a generic social feed and more like a place to inspect actual work.

### Build Room / Project Room

Each project card can lead to a dedicated project room.

The room shows:

- project identity
- problem and solution
- stack
- roles
- milestones
- task context

### Discussions

Discussions are project-linked.

Important behavior:

- clicking `Discuss` from project-related surfaces can open `/discussions?projectId=...`
- existing project chat is reused
- if no chat exists, a new one is created

The mobile discussion layout is chat-first, while larger screens show more structure.

### Issues

The Issues tab turns project tasks into a board with:

- `Open`
- `In progress`
- `Done`

Each issue card can:

- jump into discussion
- open the project room
- toggle a lightweight assign placeholder

### Deployments

Deployments gives each project a shipping-oriented card:

- live / preview / queued state
- deployment progress
- current release focus
- live/demo link
- repository link

### Proof Profile

The profile is not a normal social profile.  
It is a `proof profile`.

It includes:

- proof score
- builder level
- shipped projects
- completed tasks
- verified skills
- mentor reviews
- trust signals
- saved projects
- proof resume entry point

### Requests

Requests are the opportunity inbox.

This is where the user sees things like:

- project invites
- mentor review requests
- internship signals
- conversation requests
- proof resume activity

### Resume

The proof resume is a one-page export-style view that summarizes builder credibility from actual work evidence.

## Tech stack

Frontend:

- React
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router
- Lucide icons

State is currently frontend-managed with Redux slices for:

- post interactions
- project interactions
- discussions
- opportunity requests

## Data model right now

Current app data is mocked in local files:

- [client/src/data/posts.js](client/src/data/posts.js)
- [client/src/data/projects.js](client/src/data/projects.js)
- [client/src/data/proofProfile.js](client/src/data/proofProfile.js)

This means the project is already good for:

- UX iteration
- component architecture
- flow testing
- product direction

But not yet for:

- multi-user real-time collaboration
- backend persistence
- production auth

## Important frontend state files

- [client/src/store/store.js](client/src/store/store.js)
- [client/src/store/postInteractionsSlice.js](client/src/store/postInteractionsSlice.js)
- [client/src/store/projectInteractionsSlice.js](client/src/store/projectInteractionsSlice.js)
- [client/src/store/projectDiscussionsSlice.js](client/src/store/projectDiscussionsSlice.js)
- [client/src/store/opportunityRequestsSlice.js](client/src/store/opportunityRequestsSlice.js)

## Main routes

Defined in [client/src/main.jsx](client/src/main.jsx):

- `/` -> Home
- `/discussions`
- `/issues`
- `/deployments`
- `/projects/:projectId`
- `/profile/:userId`
- `/requests`
- `/resume/:userId`
- `/sign-in`
- `/sign-up`

## Project structure

Top-level:

- `client/` -> React frontend
- `server/` -> backend folder placeholder

Important component areas inside `client/src/components`:

- `Home`
- `Post`
- `Project`
- `Discussions`
- `Issues`
- `Deployments`
- `Profile`
- `Requests`
- `Resume`
- `Navbar`
- `ui`

## Running the frontend

From the `client` folder:

```bash
npm install
npm run dev
```

Other useful commands:

```bash
npm run build
npm run lint
npm run preview
```

## Current limitations

This version is still prototype-heavy.

Known limitations:

- project, profile, and discussion data are mocked
- no backend persistence yet
- auth user is still effectively hardcoded in several flows
- requests and interactions are session-level frontend state
- discussion system is UI-valid but not yet real-time

## What should come next

The strongest next phase is backend integration.

Best next milestones:

1. real user auth mapping
2. discussion backend schema and APIs
3. issue persistence
4. request persistence
5. deployment data integration
6. saved projects and proof profile persistence

## Why this project matters

MeeTogether is trying to shift the social identity of students and early engineers from:

`who says they can build`

to:

`who can prove they built, collaborated, discussed, shipped, and improved`

That makes it useful not only as a portfolio, but as a trust system.

