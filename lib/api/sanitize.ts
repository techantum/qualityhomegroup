/**
 * Input sanitization to reduce XSS and injection risk.
 * Use for string fields before storing or echoing.
 */

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (c) => HTML_ENTITIES[c] ?? c);
}

/**
 * Sanitize a string for safe display (escape HTML).
 */
export function sanitizeString(input: unknown, maxLength = 10_000): string {
  if (input == null) return "";
  const s = String(input).trim();
  const truncated = s.length > maxLength ? s.slice(0, maxLength) : s;
  return escapeHtml(truncated);
}

/**
 * Sanitize object string values (shallow). Preserves numbers and booleans.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxLength = 10_000
): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === "string") out[k] = sanitizeString(v, maxLength);
    else if (v != null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = sanitizeObject(v as Record<string, unknown>, maxLength);
    }
  }
  return out as T;
}

/**
 * Strip any script-like and event handler content from string.
 */
export function stripScripts(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}
