/**
 * PUT    /api/v1/testimonials/[id] - Update testimonial (admin).
 * DELETE /api/v1/testimonials/[id] - Delete testimonial (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { adminDeleteTestimonial, adminUpdateTestimonial } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Testimonial id required");
    const body = await request.json();
    await adminUpdateTestimonial(id, {
      name: body.name != null ? String(body.name) : undefined,
      role: body.role != null ? String(body.role) : undefined,
      content: body.content != null ? String(body.content) : undefined,
      image: body.image != null ? String(body.image) : undefined,
    });
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("[API] PUT /api/v1/testimonials/[id] error:", err);
    return apiInternalError(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Testimonial id required");
    await adminDeleteTestimonial(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[API] DELETE /api/v1/testimonials/[id] error:", err);
    return apiInternalError(err);
  }
}
