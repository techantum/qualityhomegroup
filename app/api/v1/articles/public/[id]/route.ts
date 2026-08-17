/**
 * GET /api/v1/articles/public/[id] - Single published article (no auth).
 */

import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { adminGetArticleById } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Article id required");

    const data = await adminGetArticleById(id);
    if (!data) return apiError("NOT_FOUND", undefined, "Article not found");

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[API] GET /api/v1/articles/public/[id] error:", err);
    return apiInternalError(err);
  }
}
