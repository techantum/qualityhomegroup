/**
 * PATCH  /api/v1/leads/[id] - Update lead notes/status (admin).
 * DELETE /api/v1/leads/[id] - Delete lead (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { leadStatusSchema } from "@/lib/api/schemas";
import { adminDeleteLead, adminUpdateLead } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Lead id required");
    const body = await request.json();
    const patch: { status?: ReturnType<typeof leadStatusSchema.parse>; notes?: string | null } = {};
    if (body.status != null) {
      const parsed = leadStatusSchema.safeParse(body.status);
      if (!parsed.success) return apiError("BAD_REQUEST", parsed.error.flatten(), "Invalid status");
      patch.status = parsed.data;
    }
    if (body.notes !== undefined) patch.notes = body.notes == null ? null : String(body.notes);
    await adminUpdateLead(id, patch);
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("[API] PATCH /api/v1/leads/[id] error:", err);
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
    if (!id) return apiError("BAD_REQUEST", undefined, "Lead id required");
    await adminDeleteLead(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[API] DELETE /api/v1/leads/[id] error:", err);
    return apiInternalError(err);
  }
}
