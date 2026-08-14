/**
 * GET /api/v1/content/hero - Hero slides (public). Uses Admin SDK for reliable reads.
 */

import { NextResponse } from "next/server";
import { apiInternalError } from "@/lib/api/errors";
import { adminGetHeroSlides, adminGetSettingsDoc, isAdminConfigured } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ data: { content: null, slides: [] } });
    }
    const [content, slides] = await Promise.all([
      adminGetSettingsDoc("hero"),
      adminGetHeroSlides(),
    ]);
    return NextResponse.json({ data: { content, slides } });
  } catch (err) {
    console.error("[API] GET /api/v1/content/hero error:", err);
    return apiInternalError(err);
  }
}
