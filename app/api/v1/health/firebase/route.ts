/**
 * GET /api/v1/health/firebase - Diagnostic: verify Firebase config (no secrets).
 * Use this to confirm env vars are loaded and Admin SDK can connect.
 */

import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null;
  const adminProjectId = process.env.FIREBASE_PROJECT_ID?.trim() ?? null;
  const hasClientEmail = Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim());
  const hasPrivateKey = Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim());
  const adminConfigured = isAdminConfigured();
  const projectIdsMatch = clientProjectId === adminProjectId;

  const ok = adminConfigured && projectIdsMatch && clientProjectId != null;
  return NextResponse.json(
    {
      ok,
      client: {
        projectId: clientProjectId,
        configured: Boolean(clientProjectId && process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      },
      admin: {
        projectId: adminProjectId,
        hasClientEmail,
        hasPrivateKey,
        configured: adminConfigured,
      },
      projectIdsMatch,
      message: ok
        ? "Firebase client and admin are configured and point to the same project."
        : !adminConfigured
          ? "Firebase Admin not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env and restart."
          : !projectIdsMatch
            ? "Client and Admin project IDs do not match. Check NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID."
            : "Firebase configuration issue.",
    },
    { status: ok ? 200 : 503 }
  );
}
