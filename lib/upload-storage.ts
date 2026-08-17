/**
 * Server-side uploads: Supabase Storage (production), Vercel Blob, or local public/.
 */

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export type UploadResult = {
  url: string;
  filename: string;
  size: number;
  type: string;
};

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "media";

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

function toAbsoluteUrl(relativePath: string): string {
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${relativePath.startsWith("/") ? relativePath : `/${relativePath}`}`;
}

async function ensureStorageBucket(): Promise<void> {
  const client = getSupabaseServiceClient();
  if (!client) throw new Error("Supabase is not configured");

  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) throw listError;

  if (!buckets?.some((b) => b.name === STORAGE_BUCKET)) {
    const { error } = await client.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 15 * 1024 * 1024,
    });
    if (error && !error.message.includes("already exists")) throw error;
  }
}

async function uploadToSupabaseStorage(
  buffer: Buffer,
  objectPath: string,
  contentType: string,
): Promise<string> {
  const client = getSupabaseServiceClient();
  if (!client) throw new Error("Supabase is not configured");

  await ensureStorageBucket();

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(objectPath, buffer, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });

  if (error) throw error;

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function uploadToLocal(
  buffer: Buffer,
  folder: string,
  baseName: string,
): Promise<string> {
  const dir = path.join(process.cwd(), "public", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, baseName), buffer);
  return toAbsoluteUrl(`/${folder}/${baseName}`);
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

function resolveProvider(): "supabase" | "blob" | "local" {
  const forced = process.env.UPLOAD_PROVIDER?.trim().toLowerCase();
  if (forced === "supabase" || forced === "blob" || forced === "local") {
    return forced;
  }
  if (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return "supabase";
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.NODE_ENV === "development") return "local";
  return "supabase";
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
    switch (provider) {
      case "supabase":
        url = await uploadToSupabaseStorage(buffer, objectPath, contentType);
        break;
      case "blob":
        url = await uploadToVercelBlob(buffer, objectPath, contentType);
        break;
      case "local":
        url = await uploadToLocal(buffer, folder, baseName);
        break;
      default:
        url = await uploadToSupabaseStorage(buffer, objectPath, contentType);
    }
  } catch (primaryError) {
    if (provider === "supabase" && process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("[upload] Supabase Storage failed, falling back to Vercel Blob:", primaryError);
      url = await uploadToVercelBlob(buffer, objectPath, contentType);
    } else if (provider === "blob") {
      console.warn("[upload] Vercel Blob failed, falling back to local:", primaryError);
      url = await uploadToLocal(buffer, folder, baseName);
    } else if (provider === "supabase" && process.env.NODE_ENV === "development") {
      console.warn("[upload] Supabase Storage failed, falling back to local:", primaryError);
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
