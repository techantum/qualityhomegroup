import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/upload-storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await saveUploadedFile(file, folder);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file";
    const isConfig =
      message.includes("not configured") || message.includes("BLOB_READ_WRITE_TOKEN");
    return NextResponse.json(
      {
        error: isConfig
          ? `${message}. On production, set Firebase Admin env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, storage bucket) or BLOB_READ_WRITE_TOKEN.`
          : message,
      },
      { status: 500 }
    );
  }
}
