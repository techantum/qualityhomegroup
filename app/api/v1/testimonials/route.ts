/**
 * GET  /api/v1/testimonials - List testimonials (admin).
 * POST /api/v1/testimonials - Add testimonial (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { adminAddTestimonial, adminGetTestimonials } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const data = await adminGetTestimonials();
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[API] GET /api/v1/testimonials error:", err);
    return apiInternalError(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!name) return apiError("BAD_REQUEST", undefined, "Name is required");
    if (!content) return apiError("BAD_REQUEST", undefined, "Content is required");

    const id = await adminAddTestimonial({
      name,
      role: String(body.role ?? ""),
      content,
      image: String(body.image ?? ""),
    });
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (err) {
    console.error("[API] POST /api/v1/testimonials error:", err);
    return apiInternalError(err);
  }
}
