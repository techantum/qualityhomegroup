/**
 * PUT    /api/v1/categories/[id] - Update category (admin).
 * DELETE /api/v1/categories/[id] - Delete category (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { adminDeleteCategory, adminUpdateCategory } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Category id required");
    const body = await request.json();
    await adminUpdateCategory(id, {
      name: body.name != null ? String(body.name) : undefined,
      slug: body.slug != null ? String(body.slug) : undefined,
      description: body.description != null ? String(body.description) : undefined,
      image: body.image != null ? String(body.image) : undefined,
      heroImage: body.heroImage != null ? String(body.heroImage) : undefined,
      heroTitle: body.heroTitle != null ? String(body.heroTitle) : undefined,
      order: body.order != null ? Number(body.order) : undefined,
      isActive: body.isActive != null ? Boolean(body.isActive) : undefined,
    });
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("[API] PUT /api/v1/categories/[id] error:", err);
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
    if (!id) return apiError("BAD_REQUEST", undefined, "Category id required");
    await adminDeleteCategory(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[API] DELETE /api/v1/categories/[id] error:", err);
    return apiInternalError(err);
  }
}
