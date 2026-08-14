/** Normalized About block for the homepage section. */
export type HomeAboutContent = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
};

export const DEFAULT_HOME_ABOUT: HomeAboutContent = {
  title: "About Us",
  subtitle: "A Higher Quality\nOf Living",
  description:
    "Quality Home Group is a leading architectural and construction company offering premium apartments, villas, townhouses, and commercial properties. We bring your aspirations to life with quality, precision, and performance.",
  image: "",
};

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function buildDescription(data: Record<string, unknown>): string {
  const intro = pickString(data.introText);
  const desc = pickString(data.description);
  if (intro && desc) return `${intro}\n\n${desc}`;
  return intro || desc;
}

/** Map CMS / legacy Firestore shapes to homepage About fields. */
export function normalizeHomeAboutContent(
  raw: Record<string, unknown> | null | undefined
): HomeAboutContent {
  if (!raw) return { ...DEFAULT_HOME_ABOUT };

  const normalized: HomeAboutContent = {
    title: pickString(raw.title, raw.heroTitle, raw.sectionTitle),
    subtitle: pickString(raw.subtitle, raw.tagline, raw.heading),
    description: buildDescription(raw),
    image: pickString(raw.image, raw.heroImage),
  };

  const hasAny =
    normalized.title ||
    normalized.subtitle ||
    normalized.description ||
    normalized.image;

  if (!hasAny) return { ...DEFAULT_HOME_ABOUT };

  return {
    title: normalized.title || DEFAULT_HOME_ABOUT.title,
    subtitle: normalized.subtitle || DEFAULT_HOME_ABOUT.subtitle,
    description: normalized.description || DEFAULT_HOME_ABOUT.description,
    image: normalized.image,
  };
}

export function hasAboutSourceData(raw: Record<string, unknown> | null | undefined): boolean {
  if (!raw) return false;
  return Boolean(
    pickString(
      raw.title,
      raw.heroTitle,
      raw.sectionTitle,
      raw.subtitle,
      raw.tagline,
      raw.heading,
      raw.introText,
      raw.description,
      raw.image,
      raw.heroImage
    )
  );
}
