/**
 * GET /api/v1/content/about - About page content (public). Uses Admin SDK so it works without client Firebase.
 * PUT /api/v1/content/about - Save about content (admin only).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { hasAboutSourceData } from "@/lib/about-content";
import { adminGetDocument, adminGetSettingsDoc, adminSetDocument } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pageDoc = await adminGetDocument("pages", "about");
    const legacyDoc = await adminGetSettingsDoc("about");

    let data: Record<string, unknown> | null = pageDoc;
    if (!hasAboutSourceData(pageDoc) && legacyDoc) {
      data = legacyDoc;
    } else if (pageDoc && legacyDoc) {
      data = { ...legacyDoc, ...pageDoc };
    }

    return NextResponse.json({ data: data ?? null });
  } catch (err) {
    console.error("[API] GET /api/v1/content/about error:", err);
    return apiInternalError(err);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    await adminSetDocument("pages", "about", body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] PUT /api/v1/content/about error:", err);
    return apiInternalError(err);
  }
}
