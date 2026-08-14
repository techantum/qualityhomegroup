/**
 * API auth helper: require Supabase access token for admin routes.
 */

import { verifySupabaseAccessToken } from "@/lib/supabase/server";
import { apiError } from "./errors";

export type AuthUser = { id: string; email?: string };
export type AuthResult = { user: AuthUser } | { response: Response };

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function requireAuth(request: Request): Promise<AuthResult> {
  const token = getBearerToken(request);
  if (!token) {
    return { response: apiError("UNAUTHORIZED", undefined, "Missing or invalid authorization token") };
  }

  const user = await verifySupabaseAccessToken(token);
  if (!user) {
    return { response: apiError("UNAUTHORIZED", undefined, "Missing or invalid authorization token") };
  }

  return { user };
}
