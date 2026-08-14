/**
 * PUT /api/v1/projects/[id] - Update a project (admin only).
 * DELETE /api/v1/projects/[id] - Delete a project (admin only).
 * Uses Firebase Admin SDK so writes work regardless of client Firestore rules.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import {
  adminUpdateProject,
  adminDeleteProject,
  adminGetProjectById,
  adminGetProjectBySlug,
  isAdminConfigured,
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

const ADMIN_NOT_CONFIGURED_MESSAGE =
  "Firebase Admin not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env and restart the server.";

/** Resolve route id to Firestore document id (id or slug). */
async function resolveProjectId(idOrSlug: string): Promise<string | null> {
  const byId = await adminGetProjectById(idOrSlug);
  if (byId) return byId.id;
  const bySlug = await adminGetProjectBySlug(idOrSlug);
  return bySlug ? bySlug.id : null;
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
    const { id: idOrSlug } = await params;
    if (!idOrSlug) return apiError("BAD_REQUEST", undefined, "Project id required");
    const projectId = await resolveProjectId(idOrSlug);
    if (!projectId) return apiError("NOT_FOUND", undefined, "Project not found");
    const body = await request.json().catch(() => ({}));
    const {
      title, type, location, image, description, categoryId, category, status, price, featured,
      tagline, heroImage, priceLabel, reraNumber, possessionDate, about,
      projectStatusVideo, walkThroughVideo, brochureUrl, stats,
      amenities, floorPlans, galleryImages, nearbyPlaces,
      metaTitle, metaDescription, metaKeywords,
    } = body;
    if (!title || !type || !location) {
      return apiError("BAD_REQUEST", undefined, "title, type, and location are required");
    }
    console.info("[API] PUT /api/v1/projects updating document:", projectId);
    await adminUpdateProject(projectId, {
      title: String(title),
      type: String(type),
      location: String(location),
      image: image != null ? String(image) : undefined,
      description: description != null ? String(description) : undefined,
      categoryId: categoryId != null ? String(categoryId) : undefined,
      category: category != null ? String(category) : undefined,
      status: status != null ? String(status) : undefined,
      price: price != null ? String(price) : undefined,
      featured: featured !== undefined ? Boolean(featured) : undefined,
      tagline: tagline != null ? String(tagline) : undefined,
      heroImage: heroImage != null ? String(heroImage) : undefined,
      priceLabel: priceLabel != null ? String(priceLabel) : undefined,
      reraNumber: reraNumber != null ? String(reraNumber) : undefined,
      possessionDate: possessionDate != null ? String(possessionDate) : undefined,
      about: about != null ? String(about) : undefined,
      projectStatusVideo: projectStatusVideo != null ? String(projectStatusVideo) : undefined,
      walkThroughVideo: walkThroughVideo != null ? String(walkThroughVideo) : undefined,
      brochureUrl: brochureUrl != null ? String(brochureUrl) : undefined,
      stats: stats && typeof stats === "object" ? stats : undefined,
      amenities: Array.isArray(amenities) ? amenities : undefined,
      floorPlans: Array.isArray(floorPlans) ? floorPlans : undefined,
      galleryImages: Array.isArray(galleryImages) ? galleryImages : undefined,
      nearbyPlaces: nearbyPlaces && typeof nearbyPlaces === "object" ? nearbyPlaces : undefined,
      metaTitle: metaTitle != null ? String(metaTitle) : undefined,
      metaDescription: metaDescription != null ? String(metaDescription) : undefined,
      metaKeywords: Array.isArray(metaKeywords) ? metaKeywords : undefined,
    });
    logAdminAction("project.update", auth.user.id, { projectId });
    const updated = await adminGetProjectById(projectId);
    if (!updated) {
      console.error("[API] PUT /api/v1/projects/[id] project missing after update:", projectId);
      return NextResponse.json({ data: { id: projectId }, message: "Project saved successfully." });
    }
    return NextResponse.json({
      data: { id: projectId, project: serializeProject(updated) },
      message: "Project saved successfully.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API] PUT /api/v1/projects/[id] error:", message);
    return NextResponse.json(
      { error: message, code: "firestore_error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { id: idOrSlug } = await params;
    if (!idOrSlug) return apiError("BAD_REQUEST", undefined, "Project id required");
    const projectId = await resolveProjectId(idOrSlug);
    if (!projectId) return apiError("NOT_FOUND", undefined, "Project not found");
    await adminDeleteProject(projectId);
    logAdminAction("project.delete", auth.user.id, { projectId });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiInternalError(err);
  }
}
