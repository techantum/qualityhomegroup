/**
 * GET  /api/v1/scripts - List scripts (public: active only unless authenticated).
 * POST /api/v1/scripts - Create script (admin only).
 */

import { NextResponse } from "next/server";
import {
  adminAddSiteScript,
  adminGetActiveSiteScripts,
  adminGetSiteScripts,
  ScriptPageConflictError,
} from "@/lib/firestore-admin";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import { siteScriptSchema } from "@/lib/api/schemas";
import { verifySupabaseAccessToken } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    const isAdmin = token ? Boolean(await verifySupabaseAccessToken(token)) : false;
    const scripts = isAdmin ? await adminGetSiteScripts() : await adminGetActiveSiteScripts();
    return NextResponse.json({ data: scripts });
  } catch (err) {
    return apiInternalError(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const parsed = siteScriptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const id = await adminAddSiteScript(parsed.data);
    logAdminAction("scripts.create", auth.user.id, { scriptId: id });
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (err) {
    if (err instanceof ScriptPageConflictError) {
      return apiError("CONFLICT", { conflicts: err.conflicts }, err.message);
    }
    return apiInternalError(err);
  }
}
