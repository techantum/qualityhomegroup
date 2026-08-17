/**
 * PUT    /api/v1/gallery/[id] - Update gallery image (admin).
 * DELETE /api/v1/gallery/[id] - Delete gallery image (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { adminDeleteGalleryImage, adminUpdateGalleryImage } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    await adminUpdateGalleryImage(id, {
      title: body.title,
      category: body.category,
      image: body.image,
      order: body.order,
    });
    return NextResponse.json({ data: { id } });
  } catch (err) {
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
    await adminDeleteGalleryImage(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiInternalError(err);
  }
}
