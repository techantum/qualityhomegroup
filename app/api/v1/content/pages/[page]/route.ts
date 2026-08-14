/**
 * GET /api/v1/content/pages/[page] - Get page content (public). Uses Admin SDK.
 * PUT /api/v1/content/pages/[page] - Save page content (admin only).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { adminGetDocument, adminSetDocument } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  try {
    const { page } = await params;
    if (!page) return apiError("BAD_REQUEST", undefined, "Page name required");
    const data = await adminGetDocument("pages", page);
    return NextResponse.json({ data: data ?? null });
  } catch (err) {
    console.error("[API] GET /api/v1/content/pages/[page] error:", err);
    return apiInternalError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { page } = await params;
    if (!page) return apiError("BAD_REQUEST", undefined, "Page name required");
    const body = await request.json();
    await adminSetDocument("pages", page, body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] PUT /api/v1/content/pages/[page] error:", err);
    return apiInternalError(err);
  }
}
