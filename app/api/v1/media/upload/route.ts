/**
 * POST /api/v1/media/upload - Upload image or icon (admin only).
 * FormData: file (required), folder (optional), type (optional: "image" | "icon").
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { saveUploadedFile } from "@/lib/upload-storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";
    const typeHint = (formData.get("type") as string) || "image";

    if (!file) {
      return apiError("BAD_REQUEST", undefined, "No file provided");
    }

    const prefix = typeHint === "icon" ? "icons" : folder;
    const result = await saveUploadedFile(file, prefix);

    return NextResponse.json({
      data: {
        url: result.url,
        filename: result.filename,
        size: result.size,
        type: result.type,
      },
    });
  } catch (err) {
    console.error("[API] POST /api/v1/media/upload error:", err);
    return apiInternalError(err);
  }
}
