/**
 * Server-side data access via Supabase Postgres.
 * Replaces Firebase Firestore Admin SDK (same export surface for API routes).
 */

import type { Lead } from "./firestore";
import { checkDatabaseConnection, isDatabaseConfigured, query } from "./db/postgres";
import {
  mapArticle,
  mapCategory,
  mapCmsPage,
  mapCmsSection,
  mapGallery,
  mapHeroSlide,
  mapLead,
  mapProject,
  mapTestimonial,
  splitProjectPayload,
  stripUndefined,
} from "./db/mappers";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  heroImage?: string;
  heroTitle?: string;
  order: number;
  isActive: boolean;
}

export interface GetLeadsPaginatedParams {
  limit: number;
  cursor?: string;
  status?: Lead["status"];
  fromDate?: string;
  toDate?: string;
}

export interface GetLeadsPaginatedResult {
  items: (Lead & { id: string })[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CMSPagePayload {
  slug: string;
  title: string;
  description?: string;
  isActive: boolean;
  isIndexed: boolean;
  order: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
}

export interface CMSSectionPayload {
  pageId: string;
  type: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  image?: string;
  backgroundImage?: string;
  items?: unknown[];
  order: number;
  isActive: boolean;
  settings?: Record<string, unknown>;
}

export interface ProjectPayload {
  title: string;
  type: string;
  location: string;
  image: string;
  description?: string;
  categoryId?: string;
  category?: string;
  status?: string;
  price?: string;
  featured?: boolean;
  slug?: string;
  tagline?: string;
  heroImage?: string;
  priceLabel?: string;
  reraNumber?: string;
  possessionDate?: string;
  about?: string;
  projectStatusVideo?: string;
  walkThroughVideo?: string;
  brochureUrl?: string;
  stats?: Record<string, string | undefined>;
  amenities?: { name: string; image: string; galleryImages?: string[] }[];
  floorPlans?: { name: string; image: string }[];
  galleryImages?: string[];
  nearbyPlaces?: Record<string, { name: string; distance: string }[]>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export interface ProjectItem extends ProjectPayload {
  id: string;
}

export function slugify(title: string, suffix?: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "project";
  return suffix ? `${base}-${suffix}` : base;
}

export function isAdminConfigured(): boolean {
  return isDatabaseConfigured();
}

export async function isAdminConnected(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  return checkDatabaseConnection();
}

export async function getLeadsPaginated(params: GetLeadsPaginatedParams): Promise<GetLeadsPaginatedResult> {
  if (!isDatabaseConfigured()) return { items: [], nextCursor: null, hasMore: false };

  const { limit, cursor, status, fromDate, toDate } = params;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (status) {
    conditions.push(`status = $${i++}`);
    values.push(status);
  }
  if (fromDate) {
    conditions.push(`created_at >= $${i++}`);
    values.push(fromDate);
  }
  if (toDate) {
    conditions.push(`created_at <= $${i++}`);
    values.push(toDate);
  }
  if (cursor) {
    conditions.push(`created_at < (SELECT created_at FROM leads WHERE id = $${i++})`);
    values.push(cursor);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  values.push(limit + 1);

  const result = await query(
    `SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT $${i}`,
    values,
  );

  const rows = result.rows;
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = slice.map((r) => mapLead(r) as Lead & { id: string });

  return {
    items,
    nextCursor: hasMore ? String(slice[slice.length - 1].id) : null,
    hasMore,
  };
}

export async function adminGetActiveCategories(): Promise<CategoryItem[]> {
  if (!isDatabaseConfigured()) return [];
  const result = await query(
    `SELECT * FROM categories WHERE is_active = true ORDER BY sort_order ASC`,
  );
  return result.rows.map((r) => mapCategory(r) as CategoryItem);
}

export async function adminGetAllCategories(): Promise<CategoryItem[]> {
  if (!isDatabaseConfigured()) return [];
  const result = await query(`SELECT * FROM categories ORDER BY sort_order ASC`);
  return result.rows.map((r) => mapCategory(r) as CategoryItem);
}

export async function updateLeadStatus(id: string, update: { status: Lead["status"] }): Promise<void> {
  await query(
    `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2`,
    [update.status, id],
  );
}

export async function adminAddCMSPage(page: CMSPagePayload): Promise<string> {
  const result = await query(
    `INSERT INTO cms_pages (slug, title, description, is_active, is_indexed, sort_order, meta_title, meta_description, meta_keywords, og_image)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [
      page.slug, page.title, page.description ?? null, page.isActive, page.isIndexed,
      page.order, page.metaTitle ?? null, page.metaDescription ?? null,
      page.metaKeywords ?? [], page.ogImage ?? null,
    ],
  );
  return String(result.rows[0].id);
}

export async function adminUpdateCMSPage(id: string, page: Partial<CMSPagePayload>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  const map: Record<string, string> = {
    slug: "slug", title: "title", description: "description", isActive: "is_active",
    isIndexed: "is_indexed", order: "sort_order", metaTitle: "meta_title",
    metaDescription: "meta_description", metaKeywords: "meta_keywords", ogImage: "og_image",
  };

  for (const [key, col] of Object.entries(map)) {
    if (page[key as keyof CMSPagePayload] !== undefined) {
      fields.push(`${col} = $${i++}`);
      values.push(page[key as keyof CMSPagePayload]);
    }
  }

  if (!fields.length) return;
  fields.push("updated_at = NOW()");
  values.push(id);
  await query(`UPDATE cms_pages SET ${fields.join(", ")} WHERE id = $${i}`, values);
}

export async function adminDeleteCMSPage(id: string): Promise<void> {
  await query(`DELETE FROM cms_pages WHERE id = $1`, [id]);
}

export async function adminAddCMSSection(section: CMSSectionPayload): Promise<string> {
  const result = await query(
    `INSERT INTO cms_sections (page_id, type, title, subtitle, description, button_text, button_url, image, background_image, items, sort_order, is_active, settings)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [
      section.pageId, section.type, section.title ?? null, section.subtitle ?? null,
      section.description ?? null, section.buttonText ?? null, section.buttonUrl ?? null,
      section.image ?? null, section.backgroundImage ?? null,
      JSON.stringify(section.items ?? []), section.order, section.isActive,
      JSON.stringify(section.settings ?? {}),
    ],
  );
  return String(result.rows[0].id);
}

export async function adminUpdateCMSSection(id: string, section: Partial<CMSSectionPayload>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  const map: Record<string, string> = {
    pageId: "page_id", type: "type", title: "title", subtitle: "subtitle",
    description: "description", buttonText: "button_text", buttonUrl: "button_url",
    image: "image", backgroundImage: "background_image", items: "items",
    order: "sort_order", isActive: "is_active", settings: "settings",
  };

  for (const [key, col] of Object.entries(map)) {
    const val = section[key as keyof CMSSectionPayload];
    if (val !== undefined) {
      fields.push(`${col} = $${i++}`);
      values.push(col === "items" || col === "settings" ? JSON.stringify(val) : val);
    }
  }

  if (!fields.length) return;
  fields.push("updated_at = NOW()");
  values.push(id);
  await query(`UPDATE cms_sections SET ${fields.join(", ")} WHERE id = $${i}`, values);
}

export async function adminDeleteCMSSection(id: string): Promise<void> {
  await query(`DELETE FROM cms_sections WHERE id = $1`, [id]);
}

export async function adminAddProject(project: ProjectPayload): Promise<string> {
  const { columns, extra } = splitProjectPayload(project as Record<string, unknown>);
  const slug = project.slug || slugify(project.title);

  const result = await query(
    `INSERT INTO projects (title, type, location, image, description, category_id, category, status, price, featured, slug, extra)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [
      columns.title ?? project.title,
      columns.type ?? project.type,
      columns.location ?? project.location ?? "",
      columns.image ?? project.image ?? "",
      columns.description ?? null,
      columns.category_id ?? null,
      columns.category ?? null,
      columns.status ?? null,
      columns.price ?? null,
      columns.featured ?? false,
      slug,
      JSON.stringify(extra),
    ],
  );

  const id = String(result.rows[0].id);
  const finalSlug = `${slugify(project.title)}-${id.slice(0, 8)}`;
  await query(`UPDATE projects SET slug = $1, updated_at = NOW() WHERE id = $2`, [finalSlug, id]);
  console.info("[db-admin] Created project", id);
  return id;
}

export async function adminGetProjects(): Promise<ProjectItem[]> {
  if (!isDatabaseConfigured()) return [];
  const result = await query(`SELECT * FROM projects ORDER BY created_at DESC`);
  return result.rows.map((r) => mapProject(r) as ProjectItem);
}

export async function adminUpdateProject(id: string, payload: Partial<ProjectPayload>): Promise<void> {
  const { columns, extra } = splitProjectPayload(payload as Record<string, unknown>);
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  const colMap: Record<string, string> = {
    title: "title", type: "type", location: "location", image: "image",
    description: "description", category_id: "category_id", category: "category",
    status: "status", price: "price", featured: "featured", slug: "slug",
  };

  for (const [col, field] of Object.entries(colMap)) {
    if (columns[col] !== undefined) {
      sets.push(`${field} = $${i++}`);
      values.push(columns[col]);
    }
  }

  if (Object.keys(extra).length) {
    sets.push(`extra = extra || $${i++}::jsonb`);
    values.push(JSON.stringify(extra));
  }

  if (payload.title != null) {
    sets.push(`slug = $${i++}`);
    values.push(`${slugify(payload.title)}-${id.slice(0, 8)}`);
  }

  if (!sets.length) return;
  sets.push("updated_at = NOW()");
  values.push(id);
  await query(`UPDATE projects SET ${sets.join(", ")} WHERE id = $${i}`, values);
}

export async function adminDeleteProject(id: string): Promise<void> {
  await query(`DELETE FROM projects WHERE id = $1`, [id]);
}

export async function adminGetProjectById(id: string): Promise<ProjectItem | null> {
  if (!isDatabaseConfigured()) return null;
  const result = await query(`SELECT * FROM projects WHERE id = $1`, [id]);
  if (!result.rows[0]) return null;
  return mapProject(result.rows[0]) as ProjectItem;
}

export async function adminGetProjectBySlug(slug: string): Promise<ProjectItem | null> {
  if (!isDatabaseConfigured()) return null;
  const result = await query(`SELECT * FROM projects WHERE slug = $1 LIMIT 1`, [slug]);
  if (!result.rows[0]) return null;
  return mapProject(result.rows[0]) as ProjectItem;
}

export async function adminGetPropertyDetails(projectId: string): Promise<Record<string, unknown> | null> {
  if (!isDatabaseConfigured()) return null;
  const result = await query(`SELECT * FROM property_details WHERE project_id = $1`, [projectId]);
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return { id: projectId, projectId, ...(row.data as Record<string, unknown>) };
}

export async function adminGetPropertyAmenities(propertyId: string): Promise<Record<string, unknown>[]> {
  if (!isDatabaseConfigured()) return [];
  const result = await query(
    `SELECT * FROM property_amenities WHERE property_id = $1 ORDER BY sort_order ASC`,
    [propertyId],
  );
  return result.rows.map((r) => ({
    id: String(r.id),
    propertyId: String(r.property_id),
    name: r.name,
    image: r.image,
    galleryImages: r.gallery_images,
    order: r.sort_order,
  }));
}

export async function adminCreateHeroSlide(data: Record<string, unknown>): Promise<string> {
  const result = await query(
    `INSERT INTO hero_slides (headline, subheadline, background_image, sort_order)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [
      data.headline ?? "",
      data.subheadline ?? "",
      data.backgroundImage ?? data.background_image ?? "",
      data.order ?? data.sort_order ?? 0,
    ],
  );
  return String(result.rows[0].id);
}

export async function adminUpdateHeroSlide(id: string, data: Record<string, unknown>): Promise<void> {
  await adminSetDocument("hero_slides", id, data);
}

export async function adminDeleteHeroSlide(id: string): Promise<void> {
  await query(`DELETE FROM hero_slides WHERE id = $1`, [id]);
}

export async function adminGetHeroSlides(): Promise<Record<string, unknown>[]> {
  if (!isDatabaseConfigured()) return [];
  const result = await query(`SELECT * FROM hero_slides ORDER BY sort_order ASC`);
  return result.rows.map((r) => mapHeroSlide(r));
}

export async function adminGetSettingsDoc(docId: string): Promise<Record<string, unknown> | null> {
  return adminGetDocument("settings", docId);
}

export async function adminGetDocument(
  collectionName: string,
  docId: string,
): Promise<Record<string, unknown> | null> {
  if (!isDatabaseConfigured()) return null;

  if (collectionName === "settings") {
    const result = await query(`SELECT data FROM settings WHERE key = $1`, [docId]);
    if (!result.rows[0]) return null;
    return { id: docId, ...(result.rows[0].data as Record<string, unknown>) };
  }

  if (collectionName === "pages") {
    const result = await query(`SELECT data FROM pages WHERE slug = $1`, [docId]);
    if (!result.rows[0]) return null;
    return { id: docId, pageName: docId, ...(result.rows[0].data as Record<string, unknown>) };
  }

  if (collectionName === "seo") {
    const result = await query(`SELECT data FROM seo WHERE page_slug = $1`, [docId]);
    if (!result.rows[0]) return null;
    return { id: docId, ...(result.rows[0].data as Record<string, unknown>) };
  }

  if (collectionName === "heroSlides") {
    const result = await query(`SELECT * FROM hero_slides WHERE id = $1`, [docId]);
    if (!result.rows[0]) return null;
    return mapHeroSlide(result.rows[0]);
  }

  const table = collectionName;
  const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [docId]);
  if (!result.rows[0]) return null;
  return { id: docId, ...result.rows[0] };
}

export async function adminSetDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const clean = stripUndefined(data);

  if (collectionName === "settings") {
    await query(
      `INSERT INTO settings (key, data, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [docId, JSON.stringify(clean)],
    );
    return;
  }

  if (collectionName === "pages") {
    await query(
      `INSERT INTO pages (slug, data, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [docId, JSON.stringify(clean)],
    );
    return;
  }

  if (collectionName === "seo") {
    await query(
      `INSERT INTO seo (page_slug, data, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (page_slug) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [docId, JSON.stringify(clean)],
    );
    return;
  }

  if (collectionName === "propertyDetails") {
    await query(
      `INSERT INTO property_details (project_id, data, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (project_id) DO UPDATE SET data = property_details.data || EXCLUDED.data, updated_at = NOW()`,
      [docId, JSON.stringify(clean)],
    );
    return;
  }

  if (collectionName === "heroSlides") {
    await query(
      `UPDATE hero_slides SET
        headline = COALESCE($1, headline),
        subheadline = COALESCE($2, subheadline),
        background_image = COALESCE($3, background_image),
        sort_order = COALESCE($4, sort_order),
        updated_at = NOW()
       WHERE id = $5`,
      [
        clean.headline ?? null,
        clean.subheadline ?? null,
        clean.backgroundImage ?? clean.background_image ?? null,
        clean.order ?? clean.sort_order ?? null,
        docId,
      ],
    );
    return;
  }

  throw new Error(`adminSetDocument not supported for collection: ${collectionName}`);
}

export async function adminGetTestimonials(): Promise<Record<string, unknown>[]> {
  if (!isDatabaseConfigured()) return [];
  const result = await query(`SELECT * FROM testimonials ORDER BY created_at DESC`);
  return result.rows.map((r) => mapTestimonial(r));
}

export async function adminGetArticles(limit?: number): Promise<Record<string, unknown>[]> {
  if (!isDatabaseConfigured()) return [];
  const result = limit
    ? await query(`SELECT * FROM articles ORDER BY created_at DESC LIMIT $1`, [limit])
    : await query(`SELECT * FROM articles ORDER BY created_at DESC`);
  return result.rows.map((r) => mapArticle(r));
}

export async function adminGetArticleById(id: string): Promise<Record<string, unknown> | null> {
  if (!isDatabaseConfigured()) return null;
  const result = await query(`SELECT * FROM articles WHERE id = $1 LIMIT 1`, [id]);
  if (result.rows.length === 0) return null;
  return mapArticle(result.rows[0]);
}

/** Insert a lead from contact/enquiry forms. */
export async function adminAddLead(lead: Omit<Lead, "id">): Promise<string> {
  const result = await query(
    `INSERT INTO leads (name, email, phone, message, source, status, notes, property_interest)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      lead.name, lead.email, lead.phone ?? "", lead.message ?? "",
      lead.source ?? "website", lead.status ?? "new",
      lead.notes ?? null, lead.propertyInterest ?? null,
    ],
  );
  return String(result.rows[0].id);
}

export async function adminGetCMSPages(): Promise<Record<string, unknown>[]> {
  if (!isDatabaseConfigured()) return [];
  const result = await query(`SELECT * FROM cms_pages ORDER BY sort_order ASC`);
  return result.rows.map((r) => mapCmsPage(r));
}

export async function adminGetCMSSections(pageId?: string): Promise<Record<string, unknown>[]> {
  if (!isDatabaseConfigured()) return [];
  const result = pageId
    ? await query(`SELECT * FROM cms_sections WHERE page_id = $1 ORDER BY sort_order ASC`, [pageId])
    : await query(`SELECT * FROM cms_sections ORDER BY sort_order ASC`);
  return result.rows.map((r) => mapCmsSection(r));
}

export async function adminGetGallery(): Promise<Record<string, unknown>[]> {
  if (!isDatabaseConfigured()) return [];
  const result = await query(`SELECT * FROM gallery ORDER BY sort_order ASC`);
  return result.rows.map((r) => mapGallery(r));
}

export async function adminAddGalleryImage(image: {
  title: string;
  category: string;
  image: string;
  order?: number;
}): Promise<string> {
  const result = await query(
    `INSERT INTO gallery (title, category, image, sort_order) VALUES ($1,$2,$3,$4) RETURNING id`,
    [image.title, image.category, image.image, image.order ?? 0],
  );
  return String(result.rows[0].id);
}

export async function adminUpdateGalleryImage(
  id: string,
  image: Partial<{ title: string; category: string; image: string; order: number }>,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (image.title !== undefined) { sets.push(`title = $${i++}`); values.push(image.title); }
  if (image.category !== undefined) { sets.push(`category = $${i++}`); values.push(image.category); }
  if (image.image !== undefined) { sets.push(`image = $${i++}`); values.push(image.image); }
  if (image.order !== undefined) { sets.push(`sort_order = $${i++}`); values.push(image.order); }
  if (!sets.length) return;
  sets.push("updated_at = NOW()");
  values.push(id);
  await query(`UPDATE gallery SET ${sets.join(", ")} WHERE id = $${i}`, values);
}

export async function adminDeleteGalleryImage(id: string): Promise<void> {
  await query(`DELETE FROM gallery WHERE id = $1`, [id]);
}

export async function adminGetDashboardStats(): Promise<{
  projects: number;
  leads: number;
  articles: number;
  testimonials: number;
}> {
  if (!isDatabaseConfigured()) {
    return { projects: 0, leads: 0, articles: 0, testimonials: 0 };
  }
  const [p, l, a, t] = await Promise.all([
    query(`SELECT COUNT(*)::int AS c FROM projects`),
    query(`SELECT COUNT(*)::int AS c FROM leads`),
    query(`SELECT COUNT(*)::int AS c FROM articles`),
    query(`SELECT COUNT(*)::int AS c FROM testimonials`),
  ]);
  return {
    projects: p.rows[0]?.c ?? 0,
    leads: l.rows[0]?.c ?? 0,
    articles: a.rows[0]?.c ?? 0,
    testimonials: t.rows[0]?.c ?? 0,
  };
}
