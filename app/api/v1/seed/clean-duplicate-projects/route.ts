/**
 * POST /api/v1/seed/clean-duplicate-projects - Delete duplicate projects (admin only).
 * Duplicates = same project title (case-insensitive). Keeps the oldest by createdAt, deletes the rest.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import { adminGetProjects, adminDeleteProject } from "@/lib/firestore-admin";

function normalizeTitle(title: string): string {
  return (title ?? "").trim().toLowerCase();
}

function getCreatedAt(p: { createdAt?: unknown }): Date {
  const c = p.createdAt;
  if (c instanceof Date) return c;
  if (c && typeof (c as { toDate?: () => Date }).toDate === "function") {
    return (c as { toDate: () => Date }).toDate();
  }
  if (typeof c === "string") return new Date(c);
  return new Date(0);
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const projects = await adminGetProjects();
    if (projects.length === 0) {
      return NextResponse.json({
        data: { deleted: 0, kept: 0, message: "No projects in database." },
      });
    }

    // Group by normalized title
    const byTitle = new Map<string, typeof projects>();
    for (const p of projects) {
      const key = normalizeTitle(p.title);
      if (!byTitle.has(key)) byTitle.set(key, []);
      byTitle.get(key)!.push(p);
    }

    const toDelete: { id: string; title: string }[] = [];
    for (const [, group] of byTitle) {
      if (group.length <= 1) continue;
      // Sort by createdAt asc (oldest first); keep first, delete rest
      const sorted = [...group].sort(
        (a, b) => getCreatedAt(a).getTime() - getCreatedAt(b).getTime()
      );
      for (let i = 1; i < sorted.length; i++) {
        toDelete.push({ id: sorted[i].id, title: sorted[i].title });
      }
    }

    for (const { id } of toDelete) {
      await adminDeleteProject(id);
    }

    logAdminAction("seed.cleanDuplicateProjects", auth.user.id, {
      deleted: toDelete.length,
      deletedIds: toDelete.map((d) => d.id),
    });

    return NextResponse.json({
      data: {
        deleted: toDelete.length,
        kept: projects.length - toDelete.length,
        deletedTitles: toDelete.map((d) => d.title),
      },
    });
  } catch (err) {
    return apiInternalError(err);
  }
}
