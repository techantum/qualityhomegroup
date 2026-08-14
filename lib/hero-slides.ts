import type { HeroSlide } from "@/lib/firestore";

export function parseHeroSlidesFromApi(json: {
  data?: { slides?: unknown[] };
}): HeroSlide[] {
  const raw = json?.data?.slides ?? [];
  return raw.map((item) => {
    const s = item as Record<string, unknown>;
    return {
      id: String(s.id ?? ""),
      headline: String(s.headline ?? ""),
      subheadline: String(s.subheadline ?? ""),
      backgroundImage: String(s.backgroundImage ?? ""),
      order: Number(s.order) || 0,
    };
  });
}

export async function fetchHeroSlidesPublic(): Promise<HeroSlide[]> {
  const res = await fetch("/api/v1/content/hero");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Failed to load hero slides");
  return parseHeroSlidesFromApi(json);
}
