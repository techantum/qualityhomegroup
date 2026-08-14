/**
 * PUT /api/v1/content/hero/slides/[id] - Update hero slide (admin).
 * DELETE /api/v1/content/hero/slides/[id] - Delete hero slide (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import {
  adminDeleteHeroSlide,
  adminGetHeroSlides,
  adminUpdateHeroSlide,
  isAdminConfigured,
} from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  if (!isAdminConfigured()) {
    return apiError("SERVICE_UNAVAILABLE", undefined, "Firebase Admin is not configured");
  }

  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Slide id required");

    const body = await request.json();
    const headline = String(body.headline ?? "").trim();
    const backgroundImage = String(body.backgroundImage ?? "").trim();

    if (!headline) return apiError("BAD_REQUEST", undefined, "Headline is required");
    if (!backgroundImage) return apiError("BAD_REQUEST", undefined, "Background image is required");

    await adminUpdateHeroSlide(id, {
      headline,
      subheadline: String(body.subheadline ?? ""),
      backgroundImage,
      order: Number(body.order) || 1,
    });

    const slides = await adminGetHeroSlides();
    const slide = slides.find((s) => s.id === id);
    return NextResponse.json({ success: true, data: { slide } });
  } catch (err) {
    console.error("[API] PUT /api/v1/content/hero/slides/[id] error:", err);
    return apiInternalError(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  if (!isAdminConfigured()) {
    return apiError("SERVICE_UNAVAILABLE", undefined, "Firebase Admin is not configured");
  }

  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Slide id required");
    await adminDeleteHeroSlide(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] DELETE /api/v1/content/hero/slides/[id] error:", err);
    return apiInternalError(err);
  }
}
