/**
 * PUT    /api/v1/scripts/[id] - Update script (admin only).
 * DELETE /api/v1/scripts/[id] - Delete script (admin only).
 */

import { NextResponse } from "next/server";
import {
  adminDeleteSiteScript,
  adminUpdateSiteScript,
  ScriptPageConflictError,
} from "@/lib/firestore-admin";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import { siteScriptUpdateSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Script id required");
    const body = await request.json();
    const parsed = siteScriptUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    await adminUpdateSiteScript(id, parsed.data);
    logAdminAction("scripts.update", auth.user.id, { scriptId: id });
    return NextResponse.json({ data: { id } });
  } catch (err) {
    if (err instanceof ScriptPageConflictError) {
      return apiError("CONFLICT", { conflicts: err.conflicts }, err.message);
    }
    const message = err instanceof Error ? err.message : "";
    if (message === "Script not found") return apiError("NOT_FOUND");
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
    if (!id) return apiError("BAD_REQUEST", undefined, "Script id required");
    await adminDeleteSiteScript(id);
    logAdminAction("scripts.delete", auth.user.id, { scriptId: id });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiInternalError(err);
  }
}
