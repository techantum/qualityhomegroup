export type ProjectPageItem = {
  id: string;
  title: string;
  type: string;
  location: string;
  image?: string;
  description?: string;
  category?: string;
  status?: string;
  price?: string;
  slug?: string;
};

export type NearbyPlace = { name: string; distance: string; type: string };
export type SpecGroup = { category: string; items: string[] };
export type ProjectStats = {
  totalLandArea: string;
  noOfBlocks: string;
  totalUnits: string;
  configuration: string;
  floors: string;
  possessionStarts: string;
};

const TYPE_LABELS: Record<string, string> = {
  apartment: "Apartments",
  apartments: "Apartments",
  villa: "Villas",
  villas: "Villas",
  commercial: "Commercial",
  plot: "Open Plots",
  plots: "Open Plots",
};

export function projectTypeLabel(type?: string, category?: string) {
  const key = (type || category || "").toLowerCase();
  return TYPE_LABELS[key] || "Project";
}

export function projectListingHref(type?: string, category?: string) {
  const key = (type || category || "").toLowerCase();
  if (key.startsWith("apartment")) return "/apartments";
  if (key.startsWith("villa")) return "/villas";
  if (key.startsWith("plot")) return "/plots";
  if (key.startsWith("commercial")) return "/commercial";
  return "/";
}

export function enquiryProjectType(type?: string, category?: string) {
  const label = projectTypeLabel(type, category);
  if (label === "Open Plots") return "Plots";
  return label;
}

export function projectStatusLabel(status?: string) {
  if (!status) return "";
  return status.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function emptyStats(): ProjectStats {
  return {
    totalLandArea: "",
    noOfBlocks: "",
    totalUnits: "",
    configuration: "",
    floors: "",
    possessionStarts: "",
  };
}

export function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function asStringArray(value: unknown): string[] {
  return normalizeMediaUrls(value);
}

/** Accept string[], JSON strings, or objects with url/image/src. */
export function normalizeMediaUrls(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        return normalizeMediaUrls(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }
    return [trimmed];
  }
  if (!Array.isArray(value)) {
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      return normalizeMediaUrls(obj.url ?? obj.image ?? obj.src ?? obj.publicUrl);
    }
    return [];
  }
  const urls: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) urls.push(trimmed);
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const candidate = obj.url ?? obj.image ?? obj.src ?? obj.publicUrl;
      if (typeof candidate === "string" && candidate.trim()) urls.push(candidate.trim());
    }
  }
  return Array.from(new Set(urls));
}

export function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (hasText(value)) return String(value).trim();
  }
  return "";
}

export function normalizeProjectStatus(
  status?: string | null,
): "ongoing" | "upcoming" | "completed" | undefined {
  if (!status) return undefined;
  const s = status.toLowerCase().replace(/[_-]+/g, " ").trim();
  if (
    s === "ongoing" ||
    s.includes("under construction") ||
    s.includes("construction") ||
    s === "launch" ||
    s === "new launch"
  ) {
    return "ongoing";
  }
  if (s === "upcoming" || s.includes("upcoming")) return "upcoming";
  if (
    s === "completed" ||
    s.includes("ready to move") ||
    s === "ready" ||
    s === "sold out" ||
    s.includes("completed")
  ) {
    return "completed";
  }
  return undefined;
}

export function normalizeProjectType(type?: string | null): string {
  if (!type) return "";
  const s = type.toLowerCase().trim();
  if (s.startsWith("apartment")) return "apartment";
  if (s.startsWith("villa")) return "villa";
  if (s.includes("plot") || s.includes("farm")) return "plot";
  if (s.startsWith("commercial")) return "commercial";
  return type;
}

export function matchesListingType(
  project: { type?: string; category?: string },
  page: "apartments" | "villas" | "plots" | "commercial",
) {
  const values = [project.type, project.category].map((v) => (v || "").toLowerCase());
  const aliases: Record<string, string[]> = {
    apartments: ["apartment", "apartments"],
    villas: ["villa", "villas"],
    plots: ["plot", "plots", "open plots", "farm land", "farm lands"],
    commercial: ["commercial"],
  };
  return (aliases[page] || [page]).some((alias) =>
    values.some((value) => value === alias || value.includes(alias)),
  );
}

export function matchesListingStatus(status: string | undefined, filter: string) {
  if (filter === "all") return true;
  return normalizeProjectStatus(status) === filter;
}

export function nearbyPlacesToArray(value: unknown): NearbyPlace[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const place = item as NearbyPlace;
        return {
          name: String(place?.name || "").trim(),
          distance: String(place?.distance || "").trim(),
          type: String(place?.type || "").trim(),
        };
      })
      .filter((place) => place.name);
  }
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  const typeMap: Record<string, string> = {
    hospitals: "hospital",
    hospital: "hospital",
    schools: "school",
    school: "school",
    itParks: "it",
    it: "it",
    connectivity: "connectivity",
    connect: "connectivity",
  };
  const out: NearbyPlace[] = [];
  for (const [key, items] of Object.entries(obj)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const place = item as { name?: string; distance?: string; type?: string };
      const name = String(place?.name || "").trim();
      if (!name) continue;
      out.push({
        name,
        distance: String(place?.distance || "").trim(),
        type: String(place?.type || typeMap[key] || key).trim(),
      });
    }
  }
  return out;
}

export function asStats(value: unknown): ProjectStats {
  if (!value || typeof value !== "object") return emptyStats();
  const stats = value as Record<string, unknown>;
  return {
    totalLandArea: firstText(stats.totalLandArea),
    noOfBlocks: firstText(stats.noOfBlocks),
    totalUnits: firstText(stats.totalUnits),
    configuration: firstText(stats.configuration),
    floors: firstText(stats.floors),
    possessionStarts: firstText(stats.possessionStarts),
  };
}

export function asSpecs(value: unknown): SpecGroup[] {
  if (!Array.isArray(value) || value.length === 0) return [];
  return value
    .map((item) => {
      const group = item as SpecGroup;
      return {
        category: String(group?.category || "").trim(),
        items: Array.isArray(group?.items)
          ? group.items.map((entry) => String(entry || "").trim()).filter(Boolean)
          : [],
      };
    })
    .filter((group) => group.category && group.items.length > 0);
}

/** Merge project extra fields + property_details so admin and website show the same content. */
export function mergePropertyDetails(
  project: Record<string, unknown> | null | undefined,
  details: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const p = project ?? {};
  const d = details ?? {};
  const locationFromDetails =
    d.location && typeof d.location === "object" ? (d.location as Record<string, unknown>) : {};
  const nearby = nearbyPlacesToArray(locationFromDetails.nearbyPlaces).length
    ? nearbyPlacesToArray(locationFromDetails.nearbyPlaces)
    : nearbyPlacesToArray(d.nearbyPlaces).length
      ? nearbyPlacesToArray(d.nearbyPlaces)
      : nearbyPlacesToArray(p.nearbyPlaces);

  return {
    ...p,
    ...d,
    id: d.projectId || d.id || p.id,
    projectId: d.projectId || p.id,
    tagline: firstText(d.tagline, p.tagline),
    price: firstText(d.price, p.price),
    priceLabel: firstText(d.priceLabel, p.priceLabel) || "Price",
    heroImage: firstText(d.heroImage, p.heroImage, p.image),
    aboutImage: firstText(d.aboutImage, p.aboutImage),
    about: firstText(d.about, p.about, p.description),
    reraNumber: firstText(d.reraNumber, p.reraNumber),
    brochureUrl: firstText(d.brochureUrl, p.brochureUrl),
    videoUrl: firstText(d.videoUrl, p.videoUrl, p.projectStatusVideo),
    walkthroughVideoUrl: firstText(d.walkthroughVideoUrl, p.walkthroughVideoUrl, p.walkThroughVideo),
    galleryImages: asStringArray(d.galleryImages).length ? asStringArray(d.galleryImages) : asStringArray(p.galleryImages),
    floorPlans: Array.isArray(d.floorPlans) && d.floorPlans.length ? d.floorPlans : (Array.isArray(p.floorPlans) ? p.floorPlans : []),
    specifications: asSpecs(d.specifications).length ? d.specifications : p.specifications,
    highlights: asStringArray(d.highlights).length ? asStringArray(d.highlights) : asStringArray(p.highlights),
    stats: Object.values(asStats(d.stats)).some(Boolean) ? d.stats : p.stats,
    location: {
      address: firstText(locationFromDetails.address, p.location),
      mapUrl: firstText(locationFromDetails.mapUrl, d.mapUrl),
      image: firstText(locationFromDetails.image, d.locationImage, p.locationImage),
      nearbyPlaces: nearby,
    },
  };
}
