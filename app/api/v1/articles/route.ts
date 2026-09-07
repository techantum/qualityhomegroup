/**
 * GET  /api/v1/articles - List articles (admin).
 * POST /api/v1/articles - Create article (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { adminAddArticle, adminGetArticles } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const data = await adminGetArticles();
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[API] GET /api/v1/articles error:", err);
    return apiInternalError(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    if (!title) return apiError("BAD_REQUEST", undefined, "Title is required");

    const id = await adminAddArticle({
      title,
      category: String(body.category ?? ""),
      date: String(body.date ?? ""),
      image: String(body.image ?? ""),
      excerpt: body.excerpt != null ? String(body.excerpt) : undefined,
      content: body.content != null ? String(body.content) : undefined,
    });
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (err) {
    console.error("[API] POST /api/v1/articles error:", err);
    return apiInternalError(err);
  }
}
