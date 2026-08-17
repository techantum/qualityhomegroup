import type { AuthUser } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";

/** Load current CMS page JSON (public GET). */
export async function fetchPageContent(slug: string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/v1/content/pages/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.data || typeof json.data !== "object") return {};
  const { id, pageName, ...rest } = json.data as Record<string, unknown>;
  return rest;
}

/** Merge patch into existing page document and save (full replace in DB). */
export async function savePageContent(
  user: AuthUser,
  slug: string,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const existing = await fetchPageContent(slug);
  const payload = { ...existing, ...patch };

  const res = await adminApiFetch(user, `/api/v1/content/pages/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : `Save failed (${res.status})`,
    );
  }

  return (json?.data ?? payload) as Record<string, unknown>;
}
