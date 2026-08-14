import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { adminGetProjects, isAdminConfigured } from "@/lib/firestore-admin";

const staticRoutes = [
  "",
  "/about",
  "/contact",
  "/apartments",
  "/villas",
  "/commercial",
  "/plots",
  "/gallery",
  "/blog",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  if (isAdminConfigured()) {
    try {
      const projects = await adminGetProjects();
      for (const p of projects) {
        if (p.id) {
          entries.push({
            url: `${base}/property/${p.id}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    } catch (err) {
      console.error("[sitemap] projects:", err);
    }
  }

  return entries;
}
