# Backend API (v1) – Setup & Reference

This document describes the versioned backend APIs for CMS content, media upload, contact/CRM, and content fetch. Existing routes (`/api/upload`, `/api/enquiry`) are unchanged; new functionality lives under `/api/v1/`.

---

## 1. Folder structure

```
app/api/
  enquiry/route.ts          # Existing – contact/enquiry (extended for contact form)
  upload/route.ts           # Existing – unchanged
  v1/
    cms/
      pages/
        route.ts            # GET list, POST create
        [id]/route.ts       # GET one, PUT, DELETE
        [id]/sections/
          route.ts          # GET list, POST create (id = page id)
      sections/
        [id]/route.ts       # GET one, PUT, DELETE
    content/
      hero/route.ts         # GET hero content + slides
      about/route.ts        # GET about content
      contact/route.ts      # GET contact info
    media/
      upload/route.ts       # POST image/icon (admin)
    contact/route.ts        # POST contact submission (rate limited)
    leads/
      route.ts              # GET leads (admin, paginated)
      [id]/status/route.ts  # PATCH lead status (admin)

lib/
  api/
    auth.ts                 # requireAuth (Firebase ID token)
    errors.ts               # apiError, apiInternalError
    rate-limit.ts           # rateLimit (in-memory)
    sanitize.ts             # sanitizeString, stripScripts
    schemas.ts              # Zod schemas
    logger.ts               # logAdminAction
  firebase-admin.ts         # Firebase Admin app, verifyAuthToken
  firestore-admin.ts        # Admin Firestore (leads pagination, CMS writes)
  firestore.ts              # Existing – unchanged (Lead status + 'closed' added)
```

---

## 2. Authentication (admin routes)

All **write** operations and **leads** read require a valid **Firebase ID token** in the request:

- Header: `Authorization: Bearer <firebase-id-token>`
- The token is obtained client-side after `signInWithEmailAndPassword()` via `user.getIdToken()`.

Example (client):

```ts
const user = await signInWithEmailAndPassword(auth, email, password);
const token = await user.getIdToken();
fetch("/api/v1/cms/pages", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  body: JSON.stringify({ slug: "about", title: "About", ... }),
});
```

Unauthorized requests receive `401` with `{ "error": "Missing or invalid authorization token" }`.

---

## 3. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Existing Firebase client config (API key, project ID, etc.) |
| `FIREBASE_PROJECT_ID` | Yes (for v1 admin) | Same as `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `FIREBASE_CLIENT_EMAIL` | Yes (for v1 admin) | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Yes (for v1 admin) | Service account private key (with `\n` for newlines) |
| `BLOB_READ_WRITE_TOKEN` | Yes (upload) | Vercel Blob token (existing `/api/upload`) |
| `MAX_UPLOAD_MB` | No | Max upload size in MB (default 10) |

---

## 4. CMS content APIs

### GET /api/v1/cms/pages

- **Auth:** None (public, cached ~60s).
- **Response:** `{ "data": CMSPage[] }`.

### POST /api/v1/cms/pages

- **Auth:** Admin (Bearer).
- **Body:** `{ slug, title, description?, isActive, isIndexed, order, metaTitle?, metaDescription?, metaKeywords?, ogImage? }`.
- **Response:** `201 { "data": { "id": string } }`.

### GET /api/v1/cms/pages/[id]

- **Auth:** None.
- **Response:** `{ "data": CMSPage }`. `404` if not found.

### PUT /api/v1/cms/pages/[id]

- **Auth:** Admin.
- **Body:** Same as POST (partial allowed).
- **Response:** `{ "data": { "id": string } }`.

### DELETE /api/v1/cms/pages/[id]

- **Auth:** Admin.
- **Response:** `204`.

### GET /api/v1/cms/pages/[id]/sections

- **Auth:** None.
- **Response:** `{ "data": CMSSection[] }`. `[id]` is the CMS page id.

### POST /api/v1/cms/pages/[id]/sections

- **Auth:** Admin.
- **Body:** `{ type, title?, subtitle?, description?, buttonText?, buttonUrl?, image?, backgroundImage?, items?, order, isActive, settings? }` (page id from URL as `[id]`).
- **Response:** `201 { "data": { "id": string } }`.

### GET /api/v1/cms/sections/[id]

- **Auth:** None.
- **Response:** `{ "data": CMSSection }`. `404` if not found.

### PUT /api/v1/cms/sections/[id], DELETE /api/v1/cms/sections/[id]

- **Auth:** Admin.
- **Body (PUT):** Partial section fields.
- **Response:** `{ "data": { "id": string } }` or `204`.

---

## 5. Content fetch (public, cached)

- **GET /api/v1/content/hero** → `{ "data": { content, slides } }`
- **GET /api/v1/content/about** → `{ "data": AboutContent }`
- **GET /api/v1/content/contact** → `{ "data": ContactInfo }`

All cached (~60s) via Next.js `unstable_cache`.

---

## 6. Media upload

### POST /api/v1/media/upload

- **Auth:** Admin.
- **Content-Type:** `multipart/form-data`.
- **Fields:** `file` (required), `folder` (optional, default `"uploads"`), `type` (optional: `"image"` | `"icon"`).
- **Allowed types:** PNG, JPG, GIF, WebP, SVG.
- **Max size:** `MAX_UPLOAD_MB` env (default 10 MB).
- **Response:** `{ "data": { url, filename, size, type } }`.

Existing **POST /api/upload** remains unchanged (no auth, same validation).

---

## 7. Contact form & CRM

### POST /api/enquiry (existing, extended for contact form)

- **Auth:** None.
- **Rate limit:** 10 requests per IP per minute.
- **Body:** `{ name, email, phone?, message?, source?, projectType?, newsletter? }`.
- **Response:** `200 { "success": true, "leadId": string }`.

Contact page can send `name`, `email`, `message`, `source: "contact_form"`; phone and projectType are optional.

### POST /api/v1/contact

- Same schema and behavior as above; rate limited; returns `201 { "data": { "id": leadId } }`.

### GET /api/v1/leads

- **Auth:** Admin.
- **Query:** `limit` (default 20), `cursor` (for next page), `status`, `fromDate`, `toDate` (ISO strings).
- **Response:** `{ "data": Lead[], "pagination": { "nextCursor", "hasMore" } }`.

**Note:** Filtering by `status` with `orderBy(createdAt)` may require a Firestore composite index on `(status, createdAt)`.

### PATCH /api/v1/leads/[id]/status

- **Auth:** Admin.
- **Body:** `{ "status": "new" | "contacted" | "closed" | "qualified" | "converted" | "rejected" | "saved" }`.
- **Response:** `{ "data": { "id", "status" } }`.

---

## 8. Error responses

- **400:** `{ "error": "Validation failed", "details": Zod.flatten() }` or custom message.
- **401:** `{ "error": "Missing or invalid authorization token" }`.
- **404:** `{ "error": "Resource not found" }`.
- **429:** `{ "error": "Too many requests", "code": "too_many_requests", "retryAfter": number }`.
- **500:** `{ "error": string }`.

---

## 9. Database (Firestore)

- **Existing collections** unchanged: `leads`, `cmsPages`, `cmsSections`, `settings`, `heroSlides`, `gallery`, etc.
- **Lead status** now includes `"closed"` in addition to existing values.
- **No destructive migrations.** Admin writes use Firebase Admin SDK; reads use existing `lib/firestore` or Admin where needed (e.g. paginated leads).

---

## 10. Security & stability

- **Rate limiting:** Contact/enquiry and `/api/v1/contact` limited per IP.
- **Sanitization:** Contact/enquiry and v1 contact sanitize string inputs before storing.
- **Admin routes:** Protected by Firebase ID token verification.
- **File upload:** Type and size validation; unique filenames.
- **Logging:** Admin write actions logged via `logAdminAction` (extend in `lib/api/logger.ts` for persistence).

---

## 11. Setup

1. Ensure `.env` has Firebase client vars and (for v1 admin) `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
2. For Vercel Blob uploads, set `BLOB_READ_WRITE_TOKEN`.
3. Optional: `MAX_UPLOAD_MB` for upload size.
4. Deploy Firestore rules (see project root `firestore.rules` if present) so client read/write rules match your security requirements.
5. If using leads filtering by `status`, create a composite index in Firestore on `leads` with fields `status` (Ascending) and `createdAt` (Descending).

Existing UI and existing APIs (`/api/upload`, `/api/enquiry`) are unchanged; the dashboard continues to use Firestore and existing flows. The v1 APIs provide a RESTful, versioned, and admin-secured layer on top of the same data.
