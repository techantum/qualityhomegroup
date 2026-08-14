/**
 * POST /api/v1/content/hero/slides - Create hero slide (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import {
  adminCreateHeroSlide,
  adminGetHeroSlides,
  isAdminConfigured,
} from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  if (!isAdminConfigured()) {
    return apiError("SERVICE_UNAVAILABLE", undefined, "Firebase Admin is not configured");
  }

  try {
    const body = await request.json();
    const headline = String(body.headline ?? "").trim();
    const backgroundImage = String(body.backgroundImage ?? "").trim();

    if (!headline) return apiError("BAD_REQUEST", undefined, "Headline is required");
    if (!backgroundImage) return apiError("BAD_REQUEST", undefined, "Background image is required");

    const order = Number(body.order) || 1;
    const id = await adminCreateHeroSlide({
      headline,
      subheadline: String(body.subheadline ?? ""),
      backgroundImage,
      order,
    });

    const slides = await adminGetHeroSlides();
    const slide = slides.find((s) => s.id === id);
    return NextResponse.json({ success: true, data: { id, slide } });
  } catch (err) {
    console.error("[API] POST /api/v1/content/hero/slides error:", err);
    return apiInternalError(err);
  }
}
