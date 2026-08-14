/**
 * GET  /api/v1/cms/pages - List CMS pages (public, cached).
 * POST /api/v1/cms/pages - Create CMS page (admin only).
 */

import { NextResponse } from "next/server";
import { adminAddCMSPage, adminGetCMSPages } from "@/lib/firestore-admin";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import { cmsPageSchema } from "@/lib/api/schemas";
import { unstable_cache } from "next/cache";

const CACHE_TTL = 60; // seconds

async function getPagesUncached() {
  return adminGetCMSPages();
}

const getPagesCached = unstable_cache(getPagesUncached, ["cms-pages"], { revalidate: CACHE_TTL });

export async function GET() {
  try {
    const pages = await getPagesCached();
    return NextResponse.json({ data: pages });
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const parsed = cmsPageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const id = await adminAddCMSPage(parsed.data);
    logAdminAction("cms.page.create", auth.user.id, { pageId: id });
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (err) {
    return apiInternalError(err);
  }
}
