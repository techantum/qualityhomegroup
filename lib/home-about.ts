export type HomeAboutPropertyType = {
  label: string;
  image: string;
};

export type HomeAboutContent = {
  eyebrow: string;
  heading: string;
  paragraph1: string;
  paragraph2: string;
  propertyTypes: HomeAboutPropertyType[];
  buttonText: string;
  buttonLink: string;
  image: string;
};

export const DEFAULT_HOME_ABOUT_PROPERTY_TYPES: HomeAboutPropertyType[] = [
  { label: "Apartments", image: "" },
  { label: "Villas", image: "" },
  { label: "Townships", image: "" },
  { label: "Commercial", image: "" },
];

export const DEFAULT_HOME_ABOUT: HomeAboutContent = {
  eyebrow: "About Quality Home Group",
  heading: "We Are The Leader In The Architectural",
  paragraph1:
    "At Quality Home Group, we're driven by a clear purpose — to redefine how communities are built and experienced. Rooted in integrity, quality, and innovation, our journey is guided by a commitment to create spaces that inspire better living. Each project reflects our passion for thoughtful design, sustainable development, and enduring value.",
  paragraph2:
    "We don't just construct buildings; we shape environments where people connect, grow, and thrive. For us, it's more than construction — it's the art of building a better tomorrow.",
  propertyTypes: DEFAULT_HOME_ABOUT_PROPERTY_TYPES,
  buttonText: "Read More",
  buttonLink: "/about",
  image: "",
};

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function normalizePropertyTypes(raw: unknown): HomeAboutPropertyType[] {
  if (!Array.isArray(raw)) return [...DEFAULT_HOME_ABOUT_PROPERTY_TYPES];
  const items = raw
    .map((item, index) => {
      const o = item as Record<string, unknown>;
      const label =
        pickString(o.label) || DEFAULT_HOME_ABOUT_PROPERTY_TYPES[index]?.label || "";
      const image = pickString(o.image, o.iconUrl);
      return { label, image };
    })
    .filter((p) => p.label);

  return items.length > 0 ? items : [...DEFAULT_HOME_ABOUT_PROPERTY_TYPES];
}

/** Map Firestore `pages/home-about` (or legacy shapes) to homepage About section. */
export function normalizeHomeAboutContent(
  raw: Record<string, unknown> | null | undefined
): HomeAboutContent {
  if (!raw) return { ...DEFAULT_HOME_ABOUT, propertyTypes: [...DEFAULT_HOME_ABOUT_PROPERTY_TYPES] };

  const paragraph1 = pickString(raw.paragraph1, raw.introText);
  const paragraph2 = pickString(raw.paragraph2);
  const legacyDesc = pickString(raw.description);
  let p1 = paragraph1;
  let p2 = paragraph2;
  if (!p1 && !p2 && legacyDesc) {
    const parts = legacyDesc.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
    p1 = parts[0] ?? "";
    p2 = parts.slice(1).join("\n\n");
  }

  const eyebrow = pickString(raw.eyebrow, raw.title, raw.heroTitle, raw.sectionTitle);
  const heading = pickString(raw.heading, raw.subtitle, raw.tagline);
  const image = pickString(raw.image, raw.heroImage);

  const hasAny = eyebrow || heading || p1 || p2 || image;

  const base: HomeAboutContent = {
    eyebrow: eyebrow || DEFAULT_HOME_ABOUT.eyebrow,
    heading: heading || DEFAULT_HOME_ABOUT.heading,
    paragraph1: p1 || DEFAULT_HOME_ABOUT.paragraph1,
    paragraph2: p2 || DEFAULT_HOME_ABOUT.paragraph2,
    propertyTypes: normalizePropertyTypes(raw.propertyTypes),
    buttonText: pickString(raw.buttonText) || DEFAULT_HOME_ABOUT.buttonText,
    buttonLink: pickString(raw.buttonLink) || DEFAULT_HOME_ABOUT.buttonLink,
    image,
  };

  if (!hasAny) {
    return { ...DEFAULT_HOME_ABOUT, propertyTypes: [...DEFAULT_HOME_ABOUT_PROPERTY_TYPES] };
  }

  return base;
}

export function hasHomeAboutSourceData(raw: Record<string, unknown> | null | undefined): boolean {
  if (!raw) return false;
  return Boolean(
    pickString(
      raw.eyebrow,
      raw.title,
      raw.heroTitle,
      raw.heading,
      raw.subtitle,
      raw.tagline,
      raw.paragraph1,
      raw.paragraph2,
      raw.introText,
      raw.description,
      raw.image,
      raw.heroImage
    ) || (Array.isArray(raw.propertyTypes) && raw.propertyTypes.length > 0)
  );
}
