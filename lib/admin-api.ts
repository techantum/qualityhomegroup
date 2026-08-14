import type { AuthUser } from "@/lib/auth-context";

/** Authenticated fetch for admin API routes (Bearer Supabase access token). */
export async function adminApiFetch(
  user: AuthUser,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const supabase = (await import("@/lib/supabase/client")).getSupabaseBrowserClient();
  const token =
    (await supabase?.auth.getSession())?.data.session?.access_token ??
    null;

  if (!token) {
    throw new Error("No active session");
  }

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}
