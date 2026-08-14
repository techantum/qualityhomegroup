/**
 * Server-side uploads (Vercel Blob or local public/ in development).
 */

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export type UploadResult = {
  url: string;
  filename: string;
  size: number;
  type: string;
};

function sanitizeFolder(folder: string): string {
  const cleaned = folder.replace(/\\/g, "/").replace(/\.\./g, "").replace(/^\/+/, "");
  const segments = cleaned.split("/").filter((s) => s && /^[a-zA-Z0-9_-]+$/.test(s));
  return segments.length > 0 ? segments.join("/") : "uploads";
}

function fileExtension(fileName: string): string {
  return (fileName.split(".").pop() || "bin").replace(/[^a-z0-9]/gi, "") || "bin";
}

function uniqueFileName(ext: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
}

async function uploadToLocal(
  buffer: Buffer,
  folder: string,
  baseName: string,
): Promise<string> {
  const dir = path.join(process.cwd(), "public", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, baseName), buffer);
  return `/${folder}/${baseName}`;
}

async function uploadToVercelBlob(
  buffer: Buffer,
  pathname: string,
  contentType: string,
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }

  const { put } = await import("@vercel/blob");
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType,
    token,
  });
  return blob.url;
}

function resolveProvider(): "blob" | "local" {
  const forced = process.env.UPLOAD_PROVIDER?.trim().toLowerCase();
  if (forced === "blob" || forced === "local") return forced;
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return "local";
}

export async function saveUploadedFile(file: File, folderInput: string): Promise<UploadResult> {
  const folder = sanitizeFolder(folderInput);
  const ext = fileExtension(file.name);
  const baseName = uniqueFileName(ext);
  const objectPath = `${folder}/${baseName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  let url: string;
  const provider = resolveProvider();

  try {
    url =
      provider === "blob"
        ? await uploadToVercelBlob(buffer, objectPath, contentType)
        : await uploadToLocal(buffer, folder, baseName);
  } catch (primaryError) {
    if (provider === "blob") {
      console.warn("[upload] Vercel Blob failed, falling back to local:", primaryError);
      url = await uploadToLocal(buffer, folder, baseName);
    } else {
      throw primaryError;
    }
  }

  return {
    url,
    filename: objectPath,
    size: file.size,
    type: contentType,
  };
}
