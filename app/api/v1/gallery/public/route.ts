/**
 * GET /api/v1/gallery/public - List gallery images (no auth).
 */

import { NextResponse } from "next/server";
import { adminGetGallery } from "@/lib/firestore-admin";
import { apiInternalError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await adminGetGallery();
    return NextResponse.json({ data });
  } catch (err) {
    return apiInternalError(err);
  }
}
