/**
 * PATCH /api/v1/leads/[id]/status - Update lead status (admin only).
 * Body: { status: "new" | "contacted" | "closed" | ... }
 */

import { NextResponse } from "next/server";
import { updateLeadStatus } from "@/lib/firestore-admin";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import { updateLeadStatusSchema } from "@/lib/api/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateLeadStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await updateLeadStatus(id, { status: parsed.data.status });
    logAdminAction("lead.status.update", auth.user.id, { leadId: id, status: parsed.data.status });
    return NextResponse.json({ data: { id, status: parsed.data.status } });
  } catch (err) {
    if (err instanceof Error && err.message.includes("not configured")) {
      return apiError("INTERNAL");
    }
    return apiInternalError(err);
  }
}
