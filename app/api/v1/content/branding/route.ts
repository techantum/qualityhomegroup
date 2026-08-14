/**
 * GET /api/v1/content/branding - Site branding (public).
 * PUT /api/v1/content/branding - Update branding (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { adminGetDocument, adminSetDocument, isAdminConfigured } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

const BRANDING_DOC = "branding";

export type BrandingSettings = {
  logoHeader?: string;
  logoFooter?: string;
  favicon?: string;
  siteName?: string;
};

export async function GET() {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ data: null });
    }
    const data = await adminGetDocument("settings", BRANDING_DOC);
    return NextResponse.json({ data: data ?? null });
  } catch (err) {
    console.error("[API] GET /api/v1/content/branding error:", err);
    return apiInternalError(err);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 503 }
      );
    }
    const body = (await request.json()) as BrandingSettings;
    await adminSetDocument("settings", BRANDING_DOC, {
      logoHeader: body.logoHeader ?? "",
      logoFooter: body.logoFooter ?? "",
      favicon: body.favicon ?? "",
      siteName: body.siteName ?? "Quality Home Group",
    });
    const data = await adminGetDocument("settings", BRANDING_DOC);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[API] PUT /api/v1/content/branding error:", err);
    return apiInternalError(err);
  }
}
