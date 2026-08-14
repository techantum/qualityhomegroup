/** Map DB snake_case rows to app camelCase objects. */

export function iso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

export function mapCategory(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? undefined,
    image: (row.image as string) ?? undefined,
    heroImage: (row.hero_image as string) ?? undefined,
    heroTitle: (row.hero_title as string) ?? undefined,
    order: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapProject(row: Record<string, unknown>) {
  const extra = (row.extra as Record<string, unknown>) ?? {};
  return {
    id: String(row.id),
    title: row.title as string,
    type: row.type as string,
    location: (row.location as string) ?? "",
    image: (row.image as string) ?? "",
    description: (row.description as string) ?? undefined,
    categoryId: row.category_id ? String(row.category_id) : undefined,
    category: (row.category as string) ?? undefined,
    status: row.status as "ongoing" | "upcoming" | "completed" | undefined,
    price: (row.price as string) ?? undefined,
    featured: Boolean(row.featured),
    slug: (row.slug as string) ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    ...extra,
  };
}

export function mapTestimonial(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: row.name as string,
    role: (row.role as string) ?? "",
    content: row.content as string,
    image: (row.image as string) ?? "",
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapArticle(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: row.title as string,
    category: (row.category as string) ?? "",
    date: (row.date as string) ?? "",
    image: (row.image as string) ?? "",
    excerpt: (row.excerpt as string) ?? undefined,
    content: (row.content as string) ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapLead(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) ?? "",
    message: (row.message as string) ?? "",
    source: (row.source as string) ?? "website",
    status: row.status as string,
    notes: (row.notes as string) ?? undefined,
    propertyInterest: (row.property_interest as string) ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapHeroSlide(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    headline: (row.headline as string) ?? "",
    subheadline: (row.subheadline as string) ?? "",
    backgroundImage: (row.background_image as string) ?? "",
    order: Number(row.sort_order ?? 0),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapGallery(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: row.title as string,
    category: (row.category as string) ?? "",
    image: row.image as string,
    order: Number(row.sort_order ?? 0),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapCmsPage(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string) ?? undefined,
    isActive: Boolean(row.is_active),
    isIndexed: Boolean(row.is_indexed),
    order: Number(row.sort_order ?? 0),
    metaTitle: (row.meta_title as string) ?? undefined,
    metaDescription: (row.meta_description as string) ?? undefined,
    metaKeywords: (row.meta_keywords as string[]) ?? undefined,
    ogImage: (row.og_image as string) ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapCmsSection(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    pageId: String(row.page_id),
    type: row.type as string,
    title: (row.title as string) ?? undefined,
    subtitle: (row.subtitle as string) ?? undefined,
    description: (row.description as string) ?? undefined,
    buttonText: (row.button_text as string) ?? undefined,
    buttonUrl: (row.button_url as string) ?? undefined,
    image: (row.image as string) ?? undefined,
    backgroundImage: (row.background_image as string) ?? undefined,
    items: (row.items as unknown[]) ?? undefined,
    order: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    settings: (row.settings as Record<string, unknown>) ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function stripUndefined(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/** Split project payload into table columns vs JSONB extra fields. */
const PROJECT_EXTRA_KEYS = new Set([
  "tagline", "heroImage", "priceLabel", "reraNumber", "possessionDate", "about",
  "projectStatusVideo", "walkThroughVideo", "brochureUrl", "stats", "amenities",
  "floorPlans", "galleryImages", "nearbyPlaces", "metaTitle", "metaDescription", "metaKeywords",
]);

export function splitProjectPayload(payload: Record<string, unknown>) {
  const columns: Record<string, unknown> = {};
  const extra: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    switch (key) {
      case "title": columns.title = value; break;
      case "type": columns.type = value; break;
      case "location": columns.location = value; break;
      case "image": columns.image = value; break;
      case "description": columns.description = value; break;
      case "categoryId": columns.category_id = value; break;
      case "category": columns.category = value; break;
      case "status": columns.status = value; break;
      case "price": columns.price = value; break;
      case "featured": columns.featured = value; break;
      case "slug": columns.slug = value; break;
      default:
        if (PROJECT_EXTRA_KEYS.has(key)) extra[key] = value;
    }
  }

  return { columns, extra };
}
