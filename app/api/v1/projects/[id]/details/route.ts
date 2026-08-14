/**
 * PUT /api/v1/projects/[id]/details - Create or update property details (admin only).
 * Uses Admin SDK so data persists and is readable by the public API.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import { adminSetDocument, adminGetPropertyDetails, isAdminConfigured } from "@/lib/firestore-admin";

const ADMIN_NOT_CONFIGURED_MESSAGE =
  "Firebase Admin not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env and restart the server.";

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = v && typeof v === "object" && !Array.isArray(v) && v.constructor === Object
      ? stripUndefined(v as Record<string, unknown>)
      : v;
  }
  return out;
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
    const { id: projectId } = await params;
    if (!projectId) return apiError("BAD_REQUEST", undefined, "Project id required");

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const data = stripUndefined({ ...body, projectId });
    await adminSetDocument("propertyDetails", projectId, data);
    logAdminAction("project.details.update", auth.user.id, { projectId });
    const saved = await adminGetPropertyDetails(projectId);
    return NextResponse.json({
      data: { projectId, propertyDetails: saved },
      message: "Property details saved successfully.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API] PUT /api/v1/projects/[id]/details error:", message);
    return NextResponse.json(
      { error: message, code: "firestore_error" },
      { status: 500 }
    );
  }
}
