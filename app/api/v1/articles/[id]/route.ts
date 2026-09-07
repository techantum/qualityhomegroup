/**
 * PUT    /api/v1/articles/[id] - Update article (admin).
 * DELETE /api/v1/articles/[id] - Delete article (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { adminDeleteArticle, adminGetArticleById, adminUpdateArticle } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Article id required");
    const data = await adminGetArticleById(id);
    if (!data) return apiError("NOT_FOUND", undefined, "Article not found");
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[API] GET /api/v1/articles/[id] error:", err);
    return apiInternalError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    if (!id) return apiError("BAD_REQUEST", undefined, "Article id required");
    const body = await request.json();
    await adminUpdateArticle(id, {
      title: body.title != null ? String(body.title) : undefined,
      category: body.category != null ? String(body.category) : undefined,
      date: body.date != null ? String(body.date) : undefined,
      image: body.image != null ? String(body.image) : undefined,
      excerpt: body.excerpt != null ? String(body.excerpt) : undefined,
      content: body.content != null ? String(body.content) : undefined,
    });
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("[API] PUT /api/v1/articles/[id] error:", err);
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
    if (!id) return apiError("BAD_REQUEST", undefined, "Article id required");
    await adminDeleteArticle(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[API] DELETE /api/v1/articles/[id] error:", err);
    return apiInternalError(err);
  }
}
