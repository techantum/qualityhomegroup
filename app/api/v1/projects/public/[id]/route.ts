/**
 * GET /api/v1/projects/public/[id] - Get one project with property details and amenities (no auth).
 * Used by the public property page for dynamic data.
 */

import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "@/lib/api/errors";
import {
  adminGetProjectById,
  adminGetProjectBySlug,
  adminGetPropertyDetails,
  adminGetPropertyAmenities,
  type ProjectItem,
} from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

function serializeProject(p: ProjectItem): Record<string, unknown> {
  const data = { ...p } as Record<string, unknown>;
  if (data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === "function") {
    data.createdAt = (data.createdAt as { toDate: () => Date }).toDate().toISOString();
  }
  if (data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function") {
    data.updatedAt = (data.updatedAt as { toDate: () => Date }).toDate().toISOString();
  }
  return data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idOrSlug } = await params;
    if (!idOrSlug) return apiError("BAD_REQUEST", undefined, "Project id or slug required");

    let project: ProjectItem | null = await adminGetProjectById(idOrSlug);
    if (!project) project = await adminGetProjectBySlug(idOrSlug);

    if (!project) {
      console.warn("[API] Project not found (id or slug):", idOrSlug);
      return apiError("NOT_FOUND", undefined, "Project not found");
    }

    const projectId = project.id;
    let propertyDetails: Record<string, unknown> | null = null;
    let propertyAmenities: Record<string, unknown>[] = [];
    try {
      const [details, amenities] = await Promise.all([
        adminGetPropertyDetails(projectId),
        adminGetPropertyAmenities(projectId),
      ]);
      propertyDetails = details;
      propertyAmenities = amenities ?? [];
    } catch (subErr) {
      console.warn("[API] Property details/amenities fetch failed for", projectId, subErr);
    }

    const payload = serializeProject(project);
    return NextResponse.json({
      data: {
        project: payload,
        propertyDetails,
        propertyAmenities,
      },
    });
  } catch (err) {
    console.error("[API] GET /api/v1/projects/public/[id] error:", err);
    return apiInternalError(err);
  }
}
