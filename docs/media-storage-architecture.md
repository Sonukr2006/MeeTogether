# MeeTogether Media Storage Architecture

## Decision

MeeTogether will use:

- **Amazon S3** for object storage
- **Amazon CloudFront** for fast global delivery

This architecture will be used for:

- profile pictures
- project cover images
- post images

The database will store **references** to media, not binary files.

---

## Why this direction

This is the right fit because:

- images should not live in PostgreSQL
- backend API should not become the long-term file host
- media delivery should be fast and cacheable
- we want one consistent system for profile, project, and post media

S3 gives us durable object storage.

CloudFront gives us:

- CDN delivery
- lower image load latency
- cache control
- cleaner public media URLs

---

## Product goals

The media system should support:

1. **User avatar upload**
2. **Project cover image upload**
3. **Post image upload**

It should also support:

- preview before save
- replace/remove behavior
- safe file type validation
- future extension to more asset types

---

## Storage Principle

### Database stores metadata, not files

DB records should store either:

- `storageKey`
- `cdnUrl`

Recommended long-term approach:

- store `storageKey` as source of truth
- generate or persist `cdnUrl` for rendering

### Example

Instead of storing image bytes in DB:

```txt
users/user_123/avatar/avatar-v1.webp
projects/project_456/cover/cover-v1.webp
posts/post_789/media/post-image-v1.webp
```

---

## Media Types

## 1. User Avatar

### Purpose

Used in:

- navbar/profile entry
- profile page
- project contributor surfaces
- discussions/messages later

### Storage path

`users/{userId}/avatar/{filename}`

### Database field

Current schema already has:

- `User.avatar`

### Recommendation

For MVP:

- store CloudFront URL in `User.avatar`

Later:

- optionally store `avatarStorageKey` separately

---

## 2. Project Cover Image

### Purpose

Used in:

- project cards
- project room header
- feed discovery quality

### Storage path

`projects/{projectId}/cover/{filename}`

### Database field

Current schema already has:

- `Project.image`

### Recommendation

For MVP:

- store CloudFront URL in `Project.image`

---

## 3. Post Image

### Purpose

Used in:

- build logs
- launch posts
- mentor review requests
- help-needed posts when screenshot/context is useful

### Storage path

`posts/{postId}/media/{filename}`

### Database field

Future post model should include:

- `imageUrl` nullable

If post attachments grow later, this can evolve into:

- `PostAsset[]`

---

## Upload Architecture

## Recommended flow

Use **signed upload** flow.

### Reason

This avoids routing large file uploads through the app server.

It is cleaner and more production-friendly than proxying full file bodies through NestJS.

---

## Upload Sequence

### Step 1

Frontend asks backend for an upload target.

Example:

`POST /api/v1/media/upload-target`

### Step 2

Backend:

- validates user auth
- validates media intent
- builds S3 object key
- creates a signed upload URL
- returns:
  - upload URL
  - storage key
  - final CloudFront URL

### Step 3

Frontend uploads file directly to S3 using signed URL.

### Step 4

Frontend submits the final entity mutation with the returned media URL/key.

Examples:

- create project with cover image URL
- update profile avatar URL
- create post with image URL

---

## Why direct-to-S3 is preferred

### Pros

- less backend bandwidth usage
- cleaner scaling
- better for larger files
- app server remains metadata/auth focused

### Tradeoff

Slightly more implementation complexity than backend-proxy upload.

This tradeoff is worth it.

---

## Backend Module Recommendation

Create:

- `StorageModule`

Responsibilities:

- signed upload creation
- object key generation
- upload policy validation
- future delete/replace flows

Do not spread upload logic across:

- users
- projects
- posts

Keep the media abstraction centralized.

---

## Suggested Backend Endpoints

## 1. Create upload target

`POST /api/v1/media/upload-target`

### Request

```json
{
  "entityType": "project_cover",
  "fileName": "cover.png",
  "contentType": "image/png"
}
```

### Response

```json
{
  "uploadUrl": "https://s3-presigned-url...",
  "storageKey": "projects/project_123/cover/cover-1715.png",
  "cdnUrl": "https://cdn.meetogether.dev/projects/project_123/cover/cover-1715.png"
}
```

### Supported `entityType` values

- `avatar`
- `project_cover`
- `post_image`

---

## 2. Optional delete endpoint later

`DELETE /api/v1/media`

This can be deferred.

For MVP, replace flows can simply overwrite by assigning a new object key and updating the DB reference.

---

## S3 Object Key Strategy

Keys should be deterministic enough to organize assets and flexible enough to allow replacement.

### Recommended shapes

#### Avatar

`users/{userId}/avatar/{timestamp}-{safeFileName}`

#### Project cover

`projects/{projectId}/cover/{timestamp}-{safeFileName}`

#### Post image

`posts/{postId}/media/{timestamp}-{safeFileName}`

### Why include timestamp

- avoids accidental overwrite
- allows easier cache-busting
- simpler replacement behavior

---

## CloudFront URL Strategy

Use a dedicated CDN base such as:

`https://cdn.meetogether.dev/...`

Frontend should render CDN URLs, not raw S3 bucket URLs.

### Why

- better latency
- cleaner public URL shape
- easier future cache policy control

---

## Validation Rules

## Allowed MIME types

For MVP:

- `image/jpeg`
- `image/png`
- `image/webp`

### Optional later

- `image/avif`

## File size recommendations

### Avatar

- max 2 MB

### Project cover

- max 5 MB

### Post image

- max 5 MB

### Validation layers

Validate in both:

- frontend UX layer
- backend upload-target layer

Never trust frontend-only validation.

---

## Security Considerations

## Signed upload restrictions

Signed uploads should constrain:

- content type
- object key
- expiry window

### Upload target lifetime

Recommended:

- 5 minutes or less

## Auth

Upload-target endpoint should require auth.

Users should not be able to mint upload targets anonymously.

## Access pattern

For MVP:

- uploaded images can be public through CloudFront

If private assets are introduced later, access strategy can be split by asset class.

---

## Image Processing Recommendation

For MVP:

- accept original upload
- store and render as-is

Later:

- resize oversized uploads
- generate thumbnails
- normalize format
- strip metadata

This can be done via async processing later if needed.

Do not block MVP on image processing infrastructure.

---

## Product-Specific UX Recommendations

## Avatar

User should be able to:

- preview new avatar before save
- replace avatar

## Project cover

Create Project flow should support:

- optional image upload
- preview before submit
- replace before final create

## Post image

Create Post flow should support:

- attach image
- remove image before publish
- preview in composer

---

## Engineering Rollout Order

## Phase 1

Storage module and upload-target endpoint

## Phase 2

Avatar upload flow

Why first:

- easiest visible identity win
- lower surface complexity

## Phase 3

Project cover image in create/edit project

Why second:

- directly improves feed/project quality
- now relevant because project creation exists

## Phase 4

Post image upload

Why third:

- should land together with Create Post

---

## Schema Impact

## Current schema already usable for:

- `User.avatar`
- `Project.image`

## Future schema addition needed for posts

When `Post` model is introduced, add:

- `imageUrl String?`

No immediate schema migration is required for avatar and project-cover support beyond using existing fields.

---

## Recommended Next Implementation Task

Start with:

1. `StorageModule`
2. `POST /api/v1/media/upload-target`
3. profile avatar upload flow
4. project cover upload support in create project

This keeps the media system aligned with S3 + CloudFront from day one and avoids retrofitting uploads later.
