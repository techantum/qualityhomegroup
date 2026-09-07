/**
 * GET /api/v1/projects/[id]/details - Load property details (admin).
 * PUT /api/v1/projects/[id]/details - Create or update property details (admin).
 * Persists to property_details and syncs listing fields on projects.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import {
  adminGetPropertyAmenities,
  adminGetPropertyDetails,
  adminPatchPropertyDetails,
  adminSetPropertyDetails,
  isAdminConfigured,
  resolveProjectRecord,
} from "@/lib/firestore-admin";
import { mergePropertyDetails } from "@/lib/project-page";

const ADMIN_NOT_CONFIGURED_MESSAGE =
  "Database is not configured. Set DATABASE_URL or DIRECT_URL and restart the server.";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(_request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    const project = await resolveProjectRecord(id);
    if (!project) return apiError("NOT_FOUND", undefined, "Project not found");
    const [details, amenities] = await Promise.all([
      adminGetPropertyDetails(project.id),
      adminGetPropertyAmenities(project.id),
    ]);
    return NextResponse.json({
      data: {
        projectId: project.id,
        project,
        propertyDetails: mergePropertyDetails(project as unknown as Record<string, unknown>, details),
        propertyAmenities: amenities,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: ADMIN_NOT_CONFIGURED_MESSAGE, code: "service_unavailable" },
        { status: 503 }
      );
    }
    const { id: projectIdOrSlug } = await params;
    if (!projectIdOrSlug) return apiError("BAD_REQUEST", undefined, "Project id required");

    const project = await resolveProjectRecord(projectIdOrSlug);
    if (!project) return apiError("NOT_FOUND", undefined, "Project not found");

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const saved = await adminSetPropertyDetails(project.id, body);
    logAdminAction("project.details.update", auth.user.id, { projectId: project.id });
    return NextResponse.json({
      data: { projectId: project.id, propertyDetails: saved },
      message: "Property details saved successfully.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API] PUT /api/v1/projects/[id]/details error:", message);
    return NextResponse.json(
      { error: message, code: "save_error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: ADMIN_NOT_CONFIGURED_MESSAGE, code: "service_unavailable" },
        { status: 503 }
      );
    }
    const { id: projectIdOrSlug } = await params;
    if (!projectIdOrSlug) return apiError("BAD_REQUEST", undefined, "Project id required");
    const project = await resolveProjectRecord(projectIdOrSlug);
    if (!project) return apiError("NOT_FOUND", undefined, "Project not found");

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const saved = await adminPatchPropertyDetails(project.id, body);
    logAdminAction("project.details.patch", auth.user.id, { projectId: project.id });
    return NextResponse.json({
      data: { projectId: project.id, propertyDetails: saved },
      message: "Property details saved successfully.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API] PATCH /api/v1/projects/[id]/details error:", message);
    return NextResponse.json(
      { error: message, code: "save_error" },
      { status: 500 }
    );
  }
}
