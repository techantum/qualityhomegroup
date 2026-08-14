/**
 * GET /api/v1/testimonials/public - List testimonials (no auth). For home page.
 * Uses Admin SDK so data shows without client Firestore.
 */

import { NextResponse } from "next/server";
import { apiInternalError } from "@/lib/api/errors";
import { adminGetTestimonials } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await adminGetTestimonials();
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[API] GET /api/v1/testimonials/public error:", err);
    return apiInternalError(err);
  }
}
