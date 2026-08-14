/**
 * GET /api/v1/content/contact - Contact/settings content (public). Uses Admin SDK.
 * PUT /api/v1/content/contact - Save contact content (admin only).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { adminGetDocument, adminSetDocument } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await adminGetDocument("settings", "contact");
    return NextResponse.json({ data: data ?? null });
  } catch (err) {
    console.error("[API] GET /api/v1/content/contact error:", err);
    return apiInternalError(err);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    await adminSetDocument("settings", "contact", body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] PUT /api/v1/content/contact error:", err);
    return apiInternalError(err);
  }
}
