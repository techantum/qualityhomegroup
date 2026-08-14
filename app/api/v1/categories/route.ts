/**
 * GET /api/v1/categories - List categories (admin only).
 * Query: ?all=true to return all categories; default returns active only.
 * Used by the admin dashboard sidebar and categories page to avoid client-side Firestore permission errors.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import {
  adminGetActiveCategories,
  adminGetAllCategories,
  isAdminConfigured,
} from "@/lib/firestore-admin";

const ADMIN_NOT_CONFIGURED_MESSAGE =
  "Firebase Admin not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env and restart the server.";

/** Serialize category for JSON (strip Firestore Timestamps etc.). */
function serializeCategory(cat: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cat)) {
    if (v === undefined) continue;
    if (v && typeof v === "object" && typeof (v as { toDate?: () => Date }).toDate === "function") {
      out[k] = (v as { toDate: () => Date }).toDate().toISOString();
    } else if (v && typeof v === "object" && !Array.isArray(v) && v.constructor === Object) {
      out[k] = serializeCategory(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: ADMIN_NOT_CONFIGURED_MESSAGE, code: "service_unavailable" },
        { status: 503 }
      );
    }
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const categories = all ? await adminGetAllCategories() : await adminGetActiveCategories();
    const serialized = (categories as Record<string, unknown>[]).map((c) => {
      try {
        return serializeCategory(c);
      } catch (e) {
        console.warn("[API] categories serializeCategory skip doc:", e);
        return { id: (c as { id?: string }).id, name: String((c as { name?: string }).name ?? ""), slug: String((c as { slug?: string }).slug ?? "") };
      }
    });
    return NextResponse.json({ data: serialized });
  } catch (err) {
    console.error("[API] GET /api/v1/categories error:", err);
    return apiInternalError(err);
  }
}
