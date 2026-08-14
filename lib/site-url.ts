/** Canonical site URL for SEO (sitemap, robots, metadata). */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (url) {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    return withProtocol.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
