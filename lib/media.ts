/**
 * Shared image URL helpers — no broken images, no third-party placeholder logos.
 */

/** Neutral site placeholder (gray, "No image") — not used for logos. */
export const IMAGE_PLACEHOLDER_SRC = "/placeholder.svg";

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (!t) return false;
  if (t === IMAGE_PLACEHOLDER_SRC) return false;
  return (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.startsWith("/") ||
    t.startsWith("data:image/")
  );
}

/** Returns a safe src for Next/Image when a real URL exists. */
export function getSafeImageSrc(url: string | null | undefined): string | null {
  return isValidImageUrl(url) ? url!.trim() : null;
}
