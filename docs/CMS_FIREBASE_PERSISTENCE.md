# CMS & Firebase persistence

## How saves work

- **Admin dashboard** (Add/Edit project, Project details) never writes to Firestore from the browser.
- All writes go through **Next.js API routes** using the **Firebase Admin SDK** (`lib/firestore-admin.ts`).
- Collections used:
  - `projects` – basic project (title, type, location, image, etc.). Doc ID = Firestore auto-ID.
  - `propertyDetails` – doc ID = **project’s Firestore document ID** (same as `projects/{id}`).
  - `propertyAmenities` – query by `propertyId` = project’s Firestore ID.

## Why data might not persist

1. **Firebase Admin not configured**  
   If `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, or `FIREBASE_PRIVATE_KEY` are missing or invalid in `.env`, the Admin SDK does not initialize. The API then returns **503** and the error message says so. You will not get a success message unless the write actually runs.

2. **Wrong project ID**  
   Client uses `NEXT_PUBLIC_FIREBASE_PROJECT_ID`; server uses `FIREBASE_PROJECT_ID`. They must be the same Firebase project (e.g. `urvi-16b5b`).

3. **Doc ID mismatch**  
   Property details are stored in `propertyDetails/{projectId}` where `projectId` is the **Firestore document ID** of the project (e.g. `PoyTUJI3Ie8cOW9fYqez`), not the slug. The API resolves slug → id when needed.

## Verify configuration

1. **Health check**  
   Open:
   ```
   GET http://localhost:3000/api/v1/health/firebase
   ```
   Response should have `ok: true`, `admin.configured: true`, and `projectIdsMatch: true`.

2. **Server logs**  
   On first Admin SDK use you should see:
   ```
   [firestore-admin] Initialized successfully for project: urvi-16b5b
   ```
   On each write:
   ```
   [firestore-admin] Wrote document projects <id>
   [firestore-admin] Updated document projects <id>
   [firestore-admin] Set document propertyDetails <id>
   ```

3. **Env**  
   In `.env` (or `.env.local`):
   - `FIREBASE_PROJECT_ID` = same as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL` = service account email
   - `FIREBASE_PRIVATE_KEY` = full key with `\n` for newlines (quotes allowed; code strips them)

Restart the dev server after changing env.

## Firestore rules

Rules apply to **client-side** Firestore access. Admin dashboard writes go through the API (Admin SDK), which **bypasses** these rules. For client-side fallbacks (e.g. when API returns 503), ensure the user is authenticated so `request.auth != null` allows write. For local debugging you can set `DEBUG_ALLOW_ALL = true` in `firestore.rules` (never in production).

## Image uploads

Images are stored via `/api/upload` or `/api/v1/media/upload` (local filesystem under `public/`). The **URL** returned is what gets saved in Firestore. There is no Firebase Storage in this flow; image URL in the document is just a string.
