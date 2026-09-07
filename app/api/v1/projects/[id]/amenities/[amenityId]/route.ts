/**
 * PUT /api/v1/projects/[id]/amenities/[amenityId]
 * DELETE /api/v1/projects/[id]/amenities/[amenityId]
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import {
  adminDeletePropertyAmenity,
  adminGetPropertyAmenities,
  adminUpdatePropertyAmenity,
  isAdminConfigured,
  resolveProjectRecord,
} from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; amenityId: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Database is not configured.", code: "service_unavailable" },
        { status: 503 }
      );
    }
    const { id, amenityId } = await params;
    const project = await resolveProjectRecord(id);
    if (!project) return apiError("NOT_FOUND", undefined, "Project not found");
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await adminUpdatePropertyAmenity(amenityId, {
      name: body.name != null ? String(body.name) : undefined,
      image: body.image != null ? String(body.image) : undefined,
      galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages.map(String) : undefined,
      order: typeof body.order === "number" ? body.order : undefined,
    });
    logAdminAction("project.amenity.update", auth.user.id, { projectId: project.id, amenityId });
    const amenities = await adminGetPropertyAmenities(project.id);
    return NextResponse.json({ data: { id: amenityId, amenities } });
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; amenityId: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id, amenityId } = await params;
    const project = await resolveProjectRecord(id);
    if (!project) return apiError("NOT_FOUND", undefined, "Project not found");
    await adminDeletePropertyAmenity(amenityId);
    logAdminAction("project.amenity.delete", auth.user.id, { projectId: project.id, amenityId });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiInternalError(err);
  }
}
