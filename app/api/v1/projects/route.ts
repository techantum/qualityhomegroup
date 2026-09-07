/**
 * GET /api/v1/projects - List all projects (admin only).
 * POST /api/v1/projects - Create a project (admin only). Returns { data: { id } }.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { adminAddProject, adminGetProjects, adminGetProjectById, adminReplacePropertyAmenities, adminUpsertPropertyDetailsFromProject, isAdminConfigured } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

const ADMIN_NOT_CONFIGURED_MESSAGE =
  "Database is not configured. Set DATABASE_URL or DIRECT_URL and restart the server.";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    if (!isAdminConfigured()) {
      console.warn("[API] GET /api/v1/projects: Firebase Admin not configured");
      return NextResponse.json(
        { error: ADMIN_NOT_CONFIGURED_MESSAGE, code: "service_unavailable" },
        { status: 503 }
      );
    }
    const projects = await adminGetProjects();
    return NextResponse.json({ data: projects });
  } catch (err) {
    console.error("[API] GET /api/v1/projects error:", err);
    return apiInternalError(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    if (!isAdminConfigured()) {
      console.warn("[API] POST /api/v1/projects: Firebase Admin not configured");
      return NextResponse.json(
        { error: ADMIN_NOT_CONFIGURED_MESSAGE, code: "service_unavailable" },
        { status: 503 }
      );
    }
    const body = await request.json();
    const {
      title, type, location, image, description, categoryId, category, status, price, featured,
      tagline, heroImage, priceLabel, reraNumber, possessionDate, about, aboutImage,
      projectStatusVideo, walkThroughVideo, brochureUrl, stats,
      amenities, floorPlans, galleryImages, nearbyPlaces, locationImage,
      metaTitle, metaDescription, metaKeywords,
    } = body;
    if (!title || !type || !location) {
      return apiError("BAD_REQUEST", undefined, "title, type, and location are required");
    }
    const id = await adminAddProject({
      title: String(title),
      type: String(type),
      location: String(location),
      image: image ? String(image) : "",
      description: description != null ? String(description) : undefined,
      categoryId: categoryId ? String(categoryId) : undefined,
      category: category ? String(category) : undefined,
      status: status ? String(status) : undefined,
      price: price ? String(price) : undefined,
      featured: Boolean(featured),
      tagline: tagline ? String(tagline) : undefined,
      heroImage: heroImage ? String(heroImage) : undefined,
      priceLabel: priceLabel ? String(priceLabel) : undefined,
      reraNumber: reraNumber ? String(reraNumber) : undefined,
      possessionDate: possessionDate ? String(possessionDate) : undefined,
      about: about ? String(about) : undefined,
      aboutImage: aboutImage ? String(aboutImage) : undefined,
      projectStatusVideo: projectStatusVideo ? String(projectStatusVideo) : undefined,
      walkThroughVideo: walkThroughVideo ? String(walkThroughVideo) : undefined,
      brochureUrl: brochureUrl ? String(brochureUrl) : undefined,
      stats: stats && typeof stats === "object" ? stats : undefined,
      amenities: Array.isArray(amenities) ? amenities : undefined,
      floorPlans: Array.isArray(floorPlans) ? floorPlans : undefined,
      galleryImages: Array.isArray(galleryImages) ? galleryImages : undefined,
      nearbyPlaces: nearbyPlaces && typeof nearbyPlaces === "object" ? nearbyPlaces : undefined,
      locationImage: body.locationImage ? String(body.locationImage) : undefined,
      metaTitle: metaTitle ? String(metaTitle) : undefined,
      metaDescription: metaDescription ? String(metaDescription) : undefined,
      metaKeywords: Array.isArray(metaKeywords) ? metaKeywords : undefined,
    });
    await adminUpsertPropertyDetailsFromProject(id, {
      title, type, location, image, description, tagline, heroImage, priceLabel, reraNumber, about, aboutImage,
      projectStatusVideo, walkThroughVideo, brochureUrl, price, stats, floorPlans, galleryImages, nearbyPlaces,
      locationImage, videoUrl: projectStatusVideo, walkthroughVideoUrl: walkThroughVideo,
    });
    if (Array.isArray(amenities)) {
      await adminReplacePropertyAmenities(id, amenities);
    }
    const verify = await adminGetProjectById(id);
    if (!verify) {
      console.error("[API] POST /api/v1/projects: document not found after write:", id);
      return NextResponse.json(
        { error: "Project was created but could not be read back. Check Firestore.", code: "verify_failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API] POST /api/v1/projects error:", message);
    return NextResponse.json(
      { error: message, code: "firestore_error" },
      { status: 500 }
    );
  }
}
