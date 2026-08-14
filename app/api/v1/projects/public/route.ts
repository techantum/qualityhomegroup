/**
 * GET /api/v1/projects/public - List all projects (no auth).
 * Used by the public website so projects show even when client Firestore is not configured or rules block.
 */

import { NextResponse } from "next/server";
import { apiInternalError } from "@/lib/api/errors";
import { adminGetProjects, slugify, type ProjectItem } from "@/lib/firestore-admin";

export const dynamic = "force-dynamic";

function serializeProject(p: ProjectItem): Record<string, unknown> {
  const data = { ...p } as Record<string, unknown>;
  if (data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === "function") {
    data.createdAt = (data.createdAt as { toDate: () => Date }).toDate().toISOString();
  }
  if (data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function") {
    data.updatedAt = (data.updatedAt as { toDate: () => Date }).toDate().toISOString();
  }
  if (!data.slug && data.title && data.id) {
    data.slug = slugify(String(data.title)) + "-" + String(data.id).slice(0, 8);
  }
  return data;
}

export async function GET() {
  try {
    const projects = await adminGetProjects();
    const data = projects.map(serializeProject);
    return NextResponse.json({ data });
  } catch (err) {
    return apiInternalError(err);
  }
}
