/**
 * GET /api/v1/projects/[id]/amenities
 * POST /api/v1/projects/[id]/amenities
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import {
  adminAddPropertyAmenity,
  adminGetPropertyAmenities,
  isAdminConfigured,
  resolveProjectRecord,
} from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await resolveProjectRecord(id);
    if (!project) return apiError("NOT_FOUND", undefined, "Project not found");
    const amenities = await adminGetPropertyAmenities(project.id);
    return NextResponse.json({ data: amenities });
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    const project = await resolveProjectRecord(id);
    if (!project) return apiError("NOT_FOUND", undefined, "Project not found");
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    if (!name) return apiError("BAD_REQUEST", undefined, "Amenity name is required");
    const amenityId = await adminAddPropertyAmenity({
      propertyId: project.id,
      name,
      image: body.image != null ? String(body.image) : "",
      galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages.map(String) : [],
      order: typeof body.order === "number" ? body.order : undefined,
    });
    logAdminAction("project.amenity.create", auth.user.id, { projectId: project.id, amenityId });
    const amenities = await adminGetPropertyAmenities(project.id);
    return NextResponse.json({ data: { id: amenityId, amenities } }, { status: 201 });
  } catch (err) {
    return apiInternalError(err);
  }
}
