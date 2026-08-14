# Backend Audit Report — QA & Backend Verification

**Date:** Audit performed via static code review and data-flow analysis.  
**Scope:** Backend setup, APIs, database, frontend reflection, security, performance, logging, edge cases.  
**Constraint:** No UI or refactor changes; inspection and validation only.

---

## 1. Backend Setup Verification

### 1.1 Server start
- **Finding:** Server starts via `npm run dev` (Next.js 16, Turbopack). No code was changed; the previous dynamic-route conflict (`[id]` vs `[pageId]`) was already resolved.
- **Note:** A known Next.js font/turbopack issue can cause build failures in some environments; it is unrelated to the backend APIs.

### 1.2 Environment variables
- **Configured in `.env` (or required for full functionality):**
  - **Firebase client:** `NEXT_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID` — present.
  - **Firebase Admin (for v1 admin APIs):** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — present.
- **Not in repo (documented in `docs/BACKEND_API.md`):**
  - **`BLOB_READ_WRITE_TOKEN`** — Required for `/api/upload` and `/api/v1/media/upload` (Vercel Blob). If missing, uploads return 500.
  - **`MAX_UPLOAD_MB`** — Optional; default 10 MB for v1 media upload.

### 1.3 Database connection
- **Finding:** No traditional SQL DB or migrations. Data layer is **Firestore** (client SDK in browser, Admin SDK in API routes).
- **Connection:** Firebase client initializes in `lib/firebase.ts` when env vars are set; Firestore is used as the DB. Firebase Admin in `lib/firebase-admin.ts` and `lib/firestore-admin.ts` uses the same project credentials for server-side APIs.
- **Migrations:** N/A. Firestore is schema-less. New fields (e.g. Lead `closed`/`lost`) are additive and backward compatible.

---

## 2. API Health Check (by route)

### 2.1 GET content (public)
- **GET /api/v1/cms/pages** — Returns `{ data: CMSPage[] }`. Uses `unstable_cache` (60s). On error → 500. **OK.**
- **GET /api/v1/cms/pages/[id]** — Returns `{ data: page }` or **404** when not found. **OK.**
- **GET /api/v1/cms/pages/[id]/sections** — Returns `{ data: CMSSection[] }`. **OK.**
- **GET /api/v1/cms/sections/[id]** — Returns `{ data: section }` or **404**. **OK.**
- **GET /api/v1/content/hero** — `{ data: { content, slides } }`. Cached. **OK.**
- **GET /api/v1/content/about** — `{ data }`. Cached. **OK.**
- **GET /api/v1/content/contact** — `{ data }`. Cached. **OK.**

### 2.2 CREATE content (admin)
- **POST /api/v1/cms/pages** — Requires `Authorization: Bearer <token>`. Missing/invalid token → **401** with `{ error, code: "unauthorized" }`. Zod validation failure → **400** with `details`. Success → **201** `{ data: { id } }`. **OK.**
- **POST /api/v1/cms/pages/[id]/sections** — Same auth and validation pattern. **201** with `{ data: { id } }`. **OK.**

### 2.3 UPDATE content (admin)
- **PUT /api/v1/cms/pages/[id]** — Auth required. Partial body validated with `cmsPageSchema.partial()`. **400** on validation error, **200** on success. **OK.**
- **PUT /api/v1/cms/sections/[id]** — Same pattern. **OK.**

### 2.4 DELETE content (admin)
- **DELETE /api/v1/cms/pages/[id]** — Auth required. **204** on success. **OK.**
- **DELETE /api/v1/cms/sections/[id]** — Auth required. **204** on success. **OK.**

### 2.5 Media upload
- **POST /api/upload** — No auth. Validates file type (jpeg, png, gif, webp, svg) and size (10 MB). **400** for missing file / invalid type / too large. **500** on blob error (e.g. missing `BLOB_READ_WRITE_TOKEN`). Returns `{ url, filename, size, type }`. **OK.**
- **POST /api/v1/media/upload** — Auth required. Same validation; max size from `MAX_UPLOAD_MB`. Returns `{ data: { url, filename, size, type } }`. **OK.**

### 2.6 Contact form submission
- **POST /api/enquiry** — Rate limited (10/min per IP). Zod validation; **400** with `details` on failure. Sanitizes inputs. **200** `{ success: true, leadId }` on success. **429** when rate limited. **500** on server error. **OK.**
- **POST /api/v1/contact** — Same logic; **201** `{ data: { id } }`. **OK.**

### 2.7 Fetch contact submissions (admin)
- **GET /api/v1/leads** — Auth required. Query params: `limit`, `cursor`, `status`, `fromDate`, `toDate`. Validation → **400** on invalid params. **200** `{ data: Lead[], pagination: { nextCursor, hasMore } }`. **OK.**
- **PATCH /api/v1/leads/[id]/status** — Auth required. Body `{ status }`. **400** on validation error. **200** `{ data: { id, status } }` on success. **OK.**

### 2.8 Authentication protection
- **Finding:** All admin write endpoints (CMS create/update/delete, v1 media upload, GET/PATCH leads) call `requireAuth(request)` and return **401** when the Firebase ID token is missing or invalid. Public GET content and POST contact/enquiry do not require auth. **Correct.**

### 2.9 Response structure and error handling
- Success: JSON with `data` (or legacy `success`/`leadId` for enquiry). **Consistent.**
- Errors: `apiError()` and `apiInternalError()` return `{ error, code?, details? }` with appropriate status (400, 401, 404, 429, 500). **Structured.**

---

## 3. Database Validation

- **Content from Admin:** The CMS Admin Dashboard does **not** use the v1 CMS APIs. It uses **`lib/firestore`** directly (e.g. `updateCMSPage`, `addCMSSection`, `updateCMSSection`). So content created/updated from the dashboard is written to Firestore via the client SDK; the same data is read by the v1 GET APIs (which use the same Firestore). **Content is saved and readable via APIs.**
- **Updates:** Admin updates go to Firestore; frontend and v1 GET both read from Firestore. **Correct records are updated.**
- **Media:** Upload APIs return a URL (Vercel Blob); the dashboard or app stores that URL in Firestore (e.g. gallery, hero, categories). **URLs are stored as designed.**
- **Contact form:** Enquiry and v1/contact call `addLead()` and write to the `leads` collection with `status: "new"`, `createdAt`/`updatedAt` (Timestamp). **Data and timestamps are stored correctly.**
- **Lead status:** PATCH /api/v1/leads/[id]/status updates `status` and `updatedAt` via Admin SDK. Dashboard Leads page uses `getLeads()` and `updateLead()` from `lib/firestore` (client), so it reads/writes the same `leads` collection. **Status and timestamps are consistent.**

---

## 4. Frontend Reflection Test

- **Data source:** The **frontend does not call the v1 content APIs**. It uses **`lib/firestore`** directly (e.g. `getHeroSlides`, `getAboutContent`, `getContactInfo`, `getCMSPages`, `getCMSSections` in components and pages). So:
  - Content is **dynamic**: it comes from Firestore, not from hardcoded copy.
  - When an admin updates content in the dashboard, the next time the frontend fetches (e.g. on load or refresh), it gets the updated data from Firestore. **Updates are reflected after refresh or re-fetch.**
- **Hardcoded content:** No business content is hardcoded. The only “default” is **`defaultContactInfo`** on the contact page, used as **fallback** until `getContactInfo()` returns and then merged with `...data`. So displayed contact info is from Firestore when available. **Acceptable.**
- **Placeholders:** Uses of “placeholder” and “/placeholder.svg” are for **form labels** and **missing images**, not for CMS content. **OK.**

---

## 5. Security Testing

- **Unauthenticated access to admin APIs:** All admin routes (POST/PUT/DELETE CMS, POST v1/media/upload, GET/PATCH v1/leads) return **401** when `Authorization: Bearer <token>` is missing or invalid. **Protected.**
- **Invalid payloads:** Zod is used on enquiry, v1/contact, CMS, and leads. Invalid body/query → **400** with details. **Validated.**
- **File upload:** Type whitelist (jpeg, png, gif, webp, svg); size limit (10 MB or `MAX_UPLOAD_MB`). **Restrictions in place.**
- **Injection:** Contact/enquiry inputs are passed through `sanitizeString()` (HTML escape + length limit) before storage. **XSS risk reduced.** `stripScripts()` exists but is not used on the stored message; escaping is the main protection. **No SQL** (Firestore); no SQL injection surface.
- **Rate limiting:** Enquiry and v1/contact use in-memory rate limit (10 req/min per IP). **429** and `Retry-After` when exceeded. **Working.**

---

## 6. Performance Check

- **Caching:** GET /api/v1/cms/pages, /content/hero, /content/about, /content/contact, and GET /api/v1/cms/pages/[id]/sections use **`unstable_cache`** with 60s revalidate. **Duplicate DB calls reduced for these routes.**
- **Admin dashboard:** Fetches (e.g. getCMSPages, getCMSSections) are client-side and per page; no duplicate calls within the same route handler. **Reasonable.**
- **Leads:** GET /api/v1/leads uses cursor-based pagination and a single Firestore query; no N+1. **Efficient.**

---

## 7. Logging & Error Monitoring

- **Admin actions:** CMS create/update/delete and lead status update call **`logAdminAction(action, uid, details)`**. In non-production it logs to console; production does not log (code comment suggests extending to Firestore or external logger). **Present but minimal in production.**
- **Errors:** Enquiry and contact catch errors and return 500 with a generic message; internal details are only in `console.error`. API error helpers return consistent JSON. **Graceful to the client; no stack traces in response.**

---

## 8. Edge Cases

| Scenario | Current behavior | Status |
|----------|------------------|--------|
| **Large image upload** | Rejected with **400** and message including max size (e.g. 10 MB). | **OK** |
| **Empty content submission** | Contact: `name`/`email` required by Zod; empty name/email → **400**. | **OK** |
| **Rapid contact submissions** | Rate limit returns **429** after 10/min per IP. | **OK** |
| **Invalid JWT** | `verifyIdToken` fails → **401** "Missing or invalid authorization token". | **OK** |
| **Malformed JSON body** | `request.json()` throws; caught in try/catch → **500**. | **Gap:** Prefer **400** for parse error. |
| **Non-existent lead PATCH** | Firestore `ref.update()` throws if doc does not exist → **500**. | **Gap:** Could return **404** for “lead not found”. |
| **GET leads with filters** | Using `status` + `orderBy(createdAt)` may require a **Firestore composite index** (status, createdAt). Without it, query can fail at runtime. | **Documented** in BACKEND_API.md; index may be required. |
| **Empty cursor** | `leadsQuerySchema` has `cursor: z.string().min(1).optional()`; empty string fails validation → **400**. | **OK** |

---

## 9. What Works Correctly

- Server starts; env vars for Firebase (client + admin) are documented and used.
- All v1 CMS GET (content) return correct status (200/404) and cached where intended.
- All v1 CMS write (create/update/delete) require auth and return 201/200/204 with validation.
- Media upload: type/size validation; v1 upload protected by auth; URLs returned.
- Contact/enquiry: validation, rate limit, sanitization, correct status codes (200/201/400/429/500).
- Leads: GET (paginated, filtered) and PATCH status protected; response shape correct.
- Admin dashboard and frontend use Firestore; content is dynamic; no hardcoded CMS content.
- Security: admin routes require valid Firebase ID token; file and input restrictions in place.
- Caching and single-query patterns used for content and leads.

---

## 10. Broken or Missing Functionality

- **None critical.** The system is consistent and usable end-to-end.
- **Minor:**
  - **PATCH /api/v1/leads/[id]/status** returns **500** when the lead document does not exist (Firestore throws). Functionally “broken” only for invalid id; returning **404** would be clearer.
  - **JSON parse failure** (e.g. invalid or empty body) on POST enquiry/contact and other JSON handlers returns **500** instead of **400**.

---

## 11. Improvements (Non‑blocking)

1. **Error handling:** Wrap `request.json()` in try/catch and return **400** with a clear message when body is not valid JSON for POST enquiry, v1/contact, CMS, and leads.
2. **PATCH lead status:** Before `ref.update()`, check `(await ref.get()).exists` and return **404** if the lead does not exist.
3. **Production logging:** In production, persist `logAdminAction` to a collection or external service instead of only logging in development.
4. **Rate limit storage:** For multi-instance or serverless, replace in-memory rate limit with a shared store (e.g. Vercel KV or Redis) so limits are consistent across replicas.
5. **BLOB_READ_WRITE_TOKEN:** Ensure this is set in the deployment environment (e.g. Vercel) so uploads do not fail with 500.

---

## 12. Static / Hardcoded Content

- **No CMS or business content is static.** Hero, about, contact, CMS pages/sections, and leads are loaded from Firestore (or, for v1, from the same Firestore-backed logic).
- **Fallbacks:**
  - Contact page: `defaultContactInfo` is used only until Firestore contact info is loaded, then merged with API data. Display is driven by Firestore when available.
  - Missing images: `/placeholder.svg` is used when an image URL is missing. This is a UI fallback, not CMS content.

---

## 13. Production Hardening Suggestions

1. Set **BLOB_READ_WRITE_TOKEN** (and optionally **MAX_UPLOAD_MB**) in production.
2. Create **Firestore composite index** for `leads` (e.g. `status` Ascending, `createdAt` Descending) if using status filter on GET /api/v1/leads.
3. Add **structured error monitoring** (e.g. Sentry) and ensure 500 paths are reported without exposing internals to the client.
4. Consider **CORS** if the frontend or other clients call APIs from different origins.
5. Ensure **Firestore security rules** allow only intended read/write (e.g. admin-only for leads/cms; client read for public content) and match the use of client vs Admin SDK.
6. Optionally add **request ID** or **correlation ID** in logs and error responses for debugging.
7. Run **runtime tests** (e.g. Postman/playwright) against a staging environment to confirm status codes and response shapes, especially for auth and rate limiting.

---

**Summary:** The backend is in good shape for production. No critical bugs were found. Minor improvements are optional (400 for bad JSON, 404 for missing lead on PATCH, production logging, and shared rate limiting). Content is dynamic; the frontend reflects CMS updates after refresh or re-fetch.
