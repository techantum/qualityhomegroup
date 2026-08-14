/**
 * Firebase Admin SDK - server-side only.
 * Used to verify Firebase ID tokens in API routes (JWT-based auth).
 * Do not import this in client components.
 */

import type { DecodedIdToken } from "firebase-admin/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminApp: any = null;

export function getAdminApp() {
  if (adminApp) return adminApp;
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawKey
    ? rawKey.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "").trim()
    : undefined;
  if (!projectId || !clientEmail || !privateKey) return null;
  try {
    const admin = require("firebase-admin");
    if (admin.apps.length > 0) adminApp = admin.app();
    else adminApp = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    return adminApp;
  } catch (err) {
    console.error("[firebase-admin] Failed to initialize Firebase Admin (auth):", err);
    return null;
  }
}

/**
 * Verify Firebase ID token from Authorization: Bearer <token>.
 * Returns decoded token or null if invalid/missing.
 */
export async function verifyAuthToken(token: string | null): Promise<DecodedIdToken | null> {
  if (!token?.startsWith("Bearer ")) return null;
  const idToken = token.slice(7).trim();
  if (!idToken) return null;
  const app = getAdminApp();
  if (!app) return null;
  try {
    const decoded = await app.auth().verifyIdToken(idToken);
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get Bearer token from request headers.
 */
export function getBearerToken(request: Request): string | null {
  return request.headers.get("authorization");
}
