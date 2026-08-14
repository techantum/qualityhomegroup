# Fix: "Missing or insufficient permissions" (FirebaseError)

## What’s wrong

This error means **Firestore Security Rules** are blocking the request:

- **Public site** (home, blog, gallery, contact, etc.) reads projects, hero, articles, testimonials, contact info, etc. **without** a logged-in user.
- **Admin dashboard** reads/writes with a logged-in user.
- If your rules only allow `request.auth != null`, then **all unauthenticated reads** (and any server-side read that doesn’t send a user token) are **denied** → you see "Missing or insufficient permissions".

So the **missing** piece is: **rules that allow public read on content**, and **auth-only for writes and sensitive data**.

## What to do (one-time)

1. Open **[Firebase Console](https://console.firebase.google.com)** → your project (**urvi-16b5b**).
2. Go to **Firestore Database** → **Rules**.
3. Replace the entire rules editor content with the contents of the project file **`firestore.rules`** (in the repo root).
4. Click **Publish**.

After that, the app will:

- **Allow read** for everyone on: projects, categories, testimonials, articles, hero slides, settings, gallery, pages, CMS pages/sections, form configs, property data.
- **Allow write** only when the user is signed in (admin).
- **Allow read/write on leads and form submissions** only when signed in.

## Deploy from CLI (optional)

If you use Firebase CLI:

```bash
firebase deploy --only firestore
```

Make sure `firebase.json` points to your `firestore.rules` file (e.g. `"firestore": { "rules": "firestore.rules" }`).

---

**Summary:** The error is from Firestore rules, not from missing env vars or code. Deploy the rules from `firestore.rules` once and the permission error should stop.
