/**
 * GET /api/v1/dashboard/stats - Dashboard counts (admin).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { adminGetDashboardStats } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const data = await adminGetDashboardStats();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[API] GET /api/v1/dashboard/stats error:", err);
    return apiInternalError(err);
  }
}
