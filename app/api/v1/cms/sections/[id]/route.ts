/**
 * GET    /api/v1/cms/sections/[id] - Get one section (by id; public, cached via page).
 * PUT    /api/v1/cms/sections/[id] - Update section (admin only).
 * DELETE /api/v1/cms/sections/[id] - Delete section (admin only).
 */

import { NextResponse } from "next/server";
import { adminGetCMSPages, adminGetCMSSections, adminUpdateCMSSection, adminDeleteCMSSection } from "@/lib/firestore-admin";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import { cmsSectionSchema } from "@/lib/api/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pages = await adminGetCMSPages();
    for (const page of pages) {
      const sections = await adminGetCMSSections(String(page.id));
      const section = sections.find((s) => s.id === id);
      if (section) return NextResponse.json({ data: section });
    }
    return apiError("NOT_FOUND");
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = cmsSectionSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await adminUpdateCMSSection(id, parsed.data);
    logAdminAction("cms.section.update", auth.user.id, { sectionId: id });
    return NextResponse.json({ data: { id } });
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    await adminDeleteCMSSection(id);
    logAdminAction("cms.section.delete", auth.user.id, { sectionId: id });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiInternalError(err);
  }
}
