export const ALL_PAGES_SLUG = "all";

export interface SitePageOption {
  slug: string;
  label: string;
  path: string;
}

/** Built-in public pages that can receive header/footer scripts. */
export const SITE_SCRIPT_PAGES: SitePageOption[] = [
  { slug: "home", label: "Home", path: "/" },
  { slug: "about", label: "About", path: "/about" },
  { slug: "apartments", label: "Apartments", path: "/apartments" },
  { slug: "villas", label: "Villas", path: "/villas" },
  { slug: "commercial", label: "Commercial", path: "/commercial" },
  { slug: "plots", label: "Plots", path: "/plots" },
  { slug: "gallery", label: "Gallery", path: "/gallery" },
  { slug: "blog", label: "Blog", path: "/blog" },
  { slug: "contact", label: "Contact", path: "/contact" },
  { slug: "property", label: "Property pages", path: "/property" },
];

export function mergeSitePageOptions(extra: SitePageOption[] = []): SitePageOption[] {
  const seen = new Set(SITE_SCRIPT_PAGES.map((page) => page.slug));
  const merged = [...SITE_SCRIPT_PAGES];
  for (const page of extra) {
    const slug = page.slug.trim().toLowerCase();
    if (!slug || slug === ALL_PAGES_SLUG || seen.has(slug)) continue;
    seen.add(slug);
    merged.push({
      slug,
      label: page.label || slug,
      path: page.path || `/${slug}`,
    });
  }
  return merged;
}

function defaultMatch(pathname: string, slug: string, path: string): boolean {
  if (slug === "home" || path === "/") return pathname === "/";
  if (slug === "blog") return pathname === "/blog" || pathname.startsWith("/blog/");
  if (slug === "property") return pathname.startsWith("/property/");
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function pathnameMatchesPage(pathname: string, slug: string): boolean {
  const page = SITE_SCRIPT_PAGES.find((item) => item.slug === slug);
  if (page) return defaultMatch(pathname, page.slug, page.path);
  const prefix = `/${slug}`;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function scriptAppliesToPath(
  script: { appliesToAll: boolean; pageSlugs: string[] },
  pathname: string,
): boolean {
  if (script.appliesToAll || script.pageSlugs.includes(ALL_PAGES_SLUG)) return true;
  return script.pageSlugs.some((slug) => pathnameMatchesPage(pathname, slug));
}

export function pageLabel(slug: string, pages: SitePageOption[] = SITE_SCRIPT_PAGES): string {
  if (slug === ALL_PAGES_SLUG) return "All pages";
  return pages.find((page) => page.slug === slug)?.label ?? slug;
}

export function takenPageSlugs(
  scripts: Array<{ id?: string; placement: string; appliesToAll: boolean; pageSlugs: string[] }>,
  placement: "header" | "footer",
  excludeId?: string,
): { allTaken: boolean; slugs: Set<string> } {
  const others = scripts.filter((script) => script.placement === placement && script.id !== excludeId);
  if (others.some((script) => script.appliesToAll || script.pageSlugs.includes(ALL_PAGES_SLUG))) {
    return { allTaken: true, slugs: new Set(SITE_SCRIPT_PAGES.map((page) => page.slug)) };
  }
  return { allTaken: false, slugs: new Set(others.flatMap((script) => script.pageSlugs)) };
}

export function findScriptPageConflicts(
  existing: Array<{ id?: string; placement: string; appliesToAll: boolean; pageSlugs: string[] }>,
  incoming: { placement: "header" | "footer"; appliesToAll: boolean; pageSlugs: string[] },
  excludeId?: string,
): string[] {
  const { allTaken, slugs } = takenPageSlugs(existing, incoming.placement, excludeId);
  if (incoming.appliesToAll || incoming.pageSlugs.includes(ALL_PAGES_SLUG)) {
    return allTaken || slugs.size > 0 ? [ALL_PAGES_SLUG] : [];
  }
  if (allTaken) return [...incoming.pageSlugs];
  return incoming.pageSlugs.filter((slug) => slugs.has(slug));
}
