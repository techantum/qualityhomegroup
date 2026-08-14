/**
 * GET  /api/v1/cms/pages/[id]/sections - List sections for a page (public, cached).
 * POST /api/v1/cms/pages/[id]/sections - Create section (admin only).
 * [id] is the CMS page id.
 */

import { NextResponse } from "next/server";
import { adminAddCMSSection, adminGetCMSSections } from "@/lib/firestore-admin";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { cmsSectionSchema } from "@/lib/api/schemas";
import { unstable_cache } from "next/cache";

const CACHE_TTL = 60;

async function getSectionsUncached(pageId: string) {
  return adminGetCMSSections(pageId);
}

function getSectionsCached(pageId: string) {
  return unstable_cache(
    () => getSectionsUncached(pageId),
    [`cms-sections-${pageId}`],
    { revalidate: CACHE_TTL }
  )();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pageId } = await params;
    const sections = await getSectionsCached(pageId);
    return NextResponse.json({ data: sections });
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const { id: pageId } = await params;
    const body = await request.json();
    const parsed = cmsSectionSchema.safeParse({ ...body, pageId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const id = await adminAddCMSSection(parsed.data);
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (err) {
    return apiInternalError(err);
  }
}
