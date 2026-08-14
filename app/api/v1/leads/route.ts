/**
 * GET /api/v1/leads - List leads with pagination and filters (admin only).
 * Query: limit, cursor, status, fromDate, toDate.
 */

import { NextResponse } from "next/server";
import { getLeadsPaginated } from "@/lib/firestore-admin";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { leadsQuerySchema } from "@/lib/api/schemas";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = leadsQuerySchema.safeParse({
      limit: searchParams.get("limit"),
      cursor: searchParams.get("cursor"),
      status: searchParams.get("status"),
      fromDate: searchParams.get("fromDate"),
      toDate: searchParams.get("toDate"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { limit, cursor, status, fromDate, toDate } = parsed.data;
    const result = await getLeadsPaginated({
      limit,
      cursor: cursor ?? undefined,
      status,
      fromDate,
      toDate,
    });
    return NextResponse.json({
      data: result.items,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  } catch (err) {
    return apiInternalError(err);
  }
}
