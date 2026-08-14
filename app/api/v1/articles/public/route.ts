/**
 * GET /api/v1/articles/public - List articles (no auth). For home recent news.
 * Query: ?limit=8 (default all). Uses Admin SDK.
 */

import { NextResponse } from "next/server";
import { apiInternalError } from "@/lib/api/errors";
import { adminGetArticles } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(0, parseInt(limitParam, 10)), 50) : undefined;
    const data = await adminGetArticles(limit);
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[API] GET /api/v1/articles/public error:", err);
    return apiInternalError(err);
  }
}
