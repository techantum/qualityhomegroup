/**
 * GET    /api/v1/cms/pages/[id] - Get one CMS page (public, cached).
 * PUT    /api/v1/cms/pages/[id] - Update CMS page (admin only).
 * DELETE /api/v1/cms/pages/[id] - Delete CMS page (admin only).
 */

import { NextResponse } from "next/server";
import { adminGetCMSPages, adminUpdateCMSPage, adminDeleteCMSPage } from "@/lib/firestore-admin";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import { cmsPageSchema } from "@/lib/api/schemas";
import { unstable_cache } from "next/cache";

const CACHE_TTL = 60;

async function getPagesUncached() {
  return adminGetCMSPages();
}

const getPagesCached = unstable_cache(getPagesUncached, ["cms-pages"], { revalidate: CACHE_TTL });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pages = await getPagesCached();
    const page = pages.find((p) => p.id === id);
    if (!page) return apiError("NOT_FOUND");
    return NextResponse.json({ data: page });
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
    const parsed = cmsPageSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await adminUpdateCMSPage(id, parsed.data);
    logAdminAction("cms.page.update", auth.user.id, { pageId: id });
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
    await adminDeleteCMSPage(id);
    logAdminAction("cms.page.delete", auth.user.id, { pageId: id });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiInternalError(err);
  }
}
