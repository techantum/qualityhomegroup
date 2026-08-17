/**
 * GET  /api/v1/gallery - List gallery images (admin).
 * POST /api/v1/gallery - Add gallery image (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { adminAddGalleryImage, adminGetGallery } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const data = await adminGetGallery();
    return NextResponse.json({ data });
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const id = await adminAddGalleryImage({
      title: body.title ?? "",
      category: body.category ?? "",
      image: body.image ?? "",
      order: body.order ?? 0,
    });
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (err) {
    return apiInternalError(err);
  }
}
