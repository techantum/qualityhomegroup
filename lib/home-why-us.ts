export type HomeWhyUsFeature = {
  icon: string;
  title: string;
  description: string;
};

export type HomeWhyUsContent = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  features: HomeWhyUsFeature[];
};

export const DEFAULT_HOME_WHY_US_FEATURES: HomeWhyUsFeature[] = [
  {
    icon: "",
    title: "Quality Construction",
    description: "Premium materials and skilled workmanship on every project.",
  },
  {
    icon: "",
    title: "On-Time Delivery",
    description: "Clear timelines and a track record of handing over as promised.",
  },
  {
    icon: "",
    title: "Transparent Process",
    description: "RERA-registered projects with honest pricing and documentation.",
  },
  {
    icon: "",
    title: "Prime Locations",
    description: "Homes and commercial spaces in Hyderabad's growth corridors.",
  },
];

export const DEFAULT_HOME_WHY_US: HomeWhyUsContent = {
  eyebrow: "Why Choose Us",
  title: "Why Quality Home Group",
  description:
    "We combine thoughtful design, quality construction, and transparent processes to deliver homes you can trust.",
  image: "",
  features: DEFAULT_HOME_WHY_US_FEATURES.map((f) => ({ ...f })),
};

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function normalizeHomeWhyUsContent(
  raw: Record<string, unknown> | null | undefined
): HomeWhyUsContent {
  if (!raw) return { ...DEFAULT_HOME_WHY_US, features: DEFAULT_HOME_WHY_US_FEATURES.map((f) => ({ ...f })) };

  const rawFeatures = Array.isArray(raw.features) ? raw.features : [];
  const features = (rawFeatures.length ? rawFeatures : DEFAULT_HOME_WHY_US_FEATURES).map((item, index) => {
    const o = (item || {}) as Record<string, unknown>;
    const fallback = DEFAULT_HOME_WHY_US_FEATURES[index] ?? DEFAULT_HOME_WHY_US_FEATURES[0];
    return {
      icon: pickString(o.icon, o.image),
      title: pickString(o.title) || fallback.title,
      description: pickString(o.description) || fallback.description,
    };
  });

  return {
    eyebrow: pickString(raw.eyebrow) || DEFAULT_HOME_WHY_US.eyebrow,
    title: pickString(raw.title, raw.heading) || DEFAULT_HOME_WHY_US.title,
    description: pickString(raw.description, raw.subtitle) || DEFAULT_HOME_WHY_US.description,
    image: pickString(raw.image, raw.heroImage),
    features,
  };
}
