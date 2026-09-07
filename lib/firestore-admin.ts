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
import {
  nearbyPlacesToArray,
  normalizeMediaUrls,
  normalizeProjectStatus,
  normalizeProjectType,
} from "./project-page";

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
  aboutImage?: string;
  projectStatusVideo?: string;
  walkThroughVideo?: string;
  brochureUrl?: string;
  stats?: Record<string, string | undefined>;
  amenities?: { name: string; image: string; galleryImages?: string[] }[];
  floorPlans?: { name: string; image: string }[];
  galleryImages?: string[];
  nearbyPlaces?: Record<string, { name: string; distance: string }[]>;
  locationImage?: string;
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

export async function adminAddCategory(category: {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  heroImage?: string;
  heroTitle?: string;
  order?: number;
  isActive?: boolean;
}): Promise<string> {
  const result = await query(
    `INSERT INTO categories (name, slug, description, image, hero_image, hero_title, sort_order, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      category.name,
      category.slug,
      category.description ?? "",
      category.image || null,
      category.heroImage || null,
      category.heroTitle || null,
      category.order ?? 0,
      category.isActive ?? true,
    ],
  );
  return String(result.rows[0].id);
}

export async function adminUpdateCategory(
  id: string,
  category: Partial<{
    name: string;
    slug: string;
    description: string;
    image: string;
    heroImage: string;
    heroTitle: string;
    order: number;
    isActive: boolean;
  }>,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (category.name !== undefined) { sets.push(`name = $${i++}`); values.push(category.name); }
  if (category.slug !== undefined) { sets.push(`slug = $${i++}`); values.push(category.slug); }
  if (category.description !== undefined) { sets.push(`description = $${i++}`); values.push(category.description); }
  if (category.image !== undefined) { sets.push(`image = $${i++}`); values.push(category.image || null); }
  if (category.heroImage !== undefined) { sets.push(`hero_image = $${i++}`); values.push(category.heroImage || null); }
  if (category.heroTitle !== undefined) { sets.push(`hero_title = $${i++}`); values.push(category.heroTitle || null); }
  if (category.order !== undefined) { sets.push(`sort_order = $${i++}`); values.push(category.order); }
  if (category.isActive !== undefined) { sets.push(`is_active = $${i++}`); values.push(category.isActive); }
  if (!sets.length) return;
  sets.push("updated_at = NOW()");
  values.push(id);
  await query(`UPDATE categories SET ${sets.join(", ")} WHERE id = $${i}`, values);
}

export async function adminDeleteCategory(id: string): Promise<void> {
  await query(`DELETE FROM categories WHERE id = $1`, [id]);
}

export async function updateLeadStatus(id: string, update: { status: Lead["status"] }): Promise<void> {
  await query(
    `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2`,
    [update.status, id],
  );
}

export async function adminUpdateLead(
  id: string,
  patch: { status?: Lead["status"]; notes?: string | null },
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (patch.status !== undefined) { sets.push(`status = $${i++}`); values.push(patch.status); }
  if (patch.notes !== undefined) { sets.push(`notes = $${i++}`); values.push(patch.notes); }
  if (!sets.length) return;
  sets.push("updated_at = NOW()");
  values.push(id);
  await query(`UPDATE leads SET ${sets.join(", ")} WHERE id = $${i}`, values);
}

export async function adminDeleteLead(id: string): Promise<void> {
  await query(`DELETE FROM leads WHERE id = $1`, [id]);
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
  const type = normalizeProjectType(String(columns.type ?? project.type ?? "")) || String(columns.type ?? project.type ?? "");
  const status = normalizeProjectStatus(columns.status != null ? String(columns.status) : project.status);

  const result = await query(
    `INSERT INTO projects (title, type, location, image, description, category_id, category, status, price, featured, slug, extra)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [
      columns.title ?? project.title,
      type,
      columns.location ?? project.location ?? "",
      columns.image ?? project.image ?? "",
      columns.description ?? null,
      columns.category_id ?? null,
      columns.category ?? null,
      status ?? null,
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
      let value = columns[col];
      if (col === "status") value = normalizeProjectStatus(String(value)) ?? null;
      if (col === "type") value = normalizeProjectType(String(value)) || value;
      if (col === "location" && value && typeof value === "object") continue;
      sets.push(`${field} = $${i++}`);
      values.push(value);
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

export async function adminGetProjectById(id: string): Promise<ProjectItem | null> {
  if (!isDatabaseConfigured() || !isUuid(id)) return null;
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

export async function resolveProjectRecord(idOrSlug: string): Promise<ProjectItem | null> {
  if (!idOrSlug) return null;
  const byId = await adminGetProjectById(idOrSlug);
  if (byId) return byId;
  return adminGetProjectBySlug(idOrSlug);
}

export async function adminGetPropertyDetails(projectId: string): Promise<Record<string, unknown> | null> {
  if (!isDatabaseConfigured()) return null;
  const project = await resolveProjectRecord(projectId);
  if (!project) return null;
  const result = await query(`SELECT * FROM property_details WHERE project_id = $1`, [project.id]);
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  const data = { ...(row.data as Record<string, unknown>) };
  delete data.id;
  return { id: project.id, projectId: project.id, ...data };
}

export async function adminGetPropertyAmenities(propertyId: string): Promise<Record<string, unknown>[]> {
  if (!isDatabaseConfigured()) return [];
  const project = await resolveProjectRecord(propertyId);
  if (!project) return [];
  const result = await query(
    `SELECT * FROM property_amenities WHERE property_id = $1 ORDER BY sort_order ASC`,
    [project.id],
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

function detailsPayloadFromBody(projectId: string, payload: Record<string, unknown>): Record<string, unknown> {
  const location =
    payload.location && typeof payload.location === "object" && !Array.isArray(payload.location)
      ? (payload.location as Record<string, unknown>)
      : {};
  const nearby = nearbyPlacesToArray(location.nearbyPlaces).length
    ? nearbyPlacesToArray(location.nearbyPlaces)
    : nearbyPlacesToArray(payload.nearbyPlaces);

  return stripUndefined({
    projectId,
    tagline: payload.tagline ?? "",
    price: payload.price ?? "",
    priceLabel: payload.priceLabel ?? "Price",
    heroImage: payload.heroImage ?? "",
    about: payload.about ?? "",
    aboutImage: payload.aboutImage ?? "",
    reraNumber: payload.reraNumber ?? "",
    videoUrl: payload.videoUrl ?? payload.projectStatusVideo ?? "",
    walkthroughVideoUrl: payload.walkthroughVideoUrl ?? payload.walkThroughVideo ?? "",
    brochureUrl: payload.brochureUrl ?? "",
    galleryImages: normalizeMediaUrls(payload.galleryImages),
    floorPlans: Array.isArray(payload.floorPlans)
      ? payload.floorPlans.map((plan) => {
          const item = (plan ?? {}) as { name?: string; image?: string; url?: string };
          return { name: String(item.name ?? "").trim(), image: String(item.image ?? item.url ?? "").trim() };
        })
      : [],
    specifications: Array.isArray(payload.specifications) ? payload.specifications : [],
    highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
    stats: payload.stats && typeof payload.stats === "object" ? payload.stats : {},
    location: {
      address: location.address ?? (typeof payload.location === "string" ? payload.location : ""),
      mapUrl: location.mapUrl ?? "",
      image: String(location.image ?? payload.locationImage ?? ""),
      nearbyPlaces: nearby,
    },
  });
}

export async function adminSetPropertyDetails(
  projectIdOrSlug: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const project = await resolveProjectRecord(projectIdOrSlug);
  if (!project) {
    throw new Error("Project not found");
  }
  const id = project.id;
  const data = detailsPayloadFromBody(id, payload);

  await query(
    `INSERT INTO property_details (project_id, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (project_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [id, JSON.stringify(data)],
  );

  const heroImage = typeof data.heroImage === "string" ? data.heroImage : undefined;
  const price = typeof data.price === "string" ? data.price : undefined;
  try {
    await adminUpdateProject(id, {
      image: heroImage || undefined,
      price: price || undefined,
      tagline: data.tagline != null ? String(data.tagline) : undefined,
      heroImage: heroImage || undefined,
      priceLabel: data.priceLabel != null ? String(data.priceLabel) : undefined,
      reraNumber: data.reraNumber != null ? String(data.reraNumber) : undefined,
      about: data.about != null ? String(data.about) : undefined,
      aboutImage: data.aboutImage != null ? String(data.aboutImage) : undefined,
      projectStatusVideo: data.videoUrl != null ? String(data.videoUrl) : undefined,
      walkThroughVideo: data.walkthroughVideoUrl != null ? String(data.walkthroughVideoUrl) : undefined,
      brochureUrl: data.brochureUrl != null ? String(data.brochureUrl) : undefined,
      stats: data.stats && typeof data.stats === "object" ? (data.stats as Record<string, string | undefined>) : undefined,
      floorPlans: Array.isArray(data.floorPlans) ? (data.floorPlans as { name: string; image: string }[]) : undefined,
      galleryImages: Array.isArray(data.galleryImages) ? (data.galleryImages as string[]) : undefined,
    });
  } catch (err) {
    console.warn("[db-admin] Property details saved; listing sync failed:", err);
  }

  const saved = await adminGetPropertyDetails(id);
  if (!saved) throw new Error("Property details could not be read back after save");
  return saved;
}

export async function adminPatchPropertyDetails(
  projectIdOrSlug: string,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const existing = await adminGetPropertyDetails(projectIdOrSlug);
  return adminSetPropertyDetails(projectIdOrSlug, { ...(existing ?? {}), ...patch });
}

export async function adminUpsertPropertyDetailsFromProject(
  projectId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const existing = await adminGetPropertyDetails(projectId);
  const existingLocation = (existing?.location as { address?: string; mapUrl?: string; image?: string; nearbyPlaces?: unknown } | undefined) ?? {};
  await adminSetPropertyDetails(projectId, {
    ...(existing ?? {}),
    ...payload,
    videoUrl: payload.videoUrl ?? payload.projectStatusVideo ?? existing?.videoUrl,
    walkthroughVideoUrl:
      payload.walkthroughVideoUrl ?? payload.walkThroughVideo ?? existing?.walkthroughVideoUrl,
    location:
      payload.location && typeof payload.location === "object"
        ? payload.location
        : {
            address: typeof payload.location === "string" ? payload.location : existingLocation.address ?? "",
            mapUrl: existingLocation.mapUrl ?? "",
            image: String(payload.locationImage ?? existingLocation.image ?? ""),
            nearbyPlaces: nearbyPlacesToArray(payload.nearbyPlaces).length
              ? nearbyPlacesToArray(payload.nearbyPlaces)
              : nearbyPlacesToArray(existingLocation.nearbyPlaces),
          },
  });
}

export async function adminAddPropertyAmenity(data: {
  propertyId: string;
  name: string;
  image?: string;
  galleryImages?: string[];
  order?: number;
}): Promise<string> {
  const project = await resolveProjectRecord(data.propertyId);
  if (!project) throw new Error("Project not found");
  const result = await query(
    `INSERT INTO property_amenities (property_id, name, image, gallery_images, sort_order)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [
      project.id,
      data.name,
      data.image ?? "",
      JSON.stringify(data.galleryImages ?? []),
      data.order ?? 0,
    ],
  );
  return String(result.rows[0].id);
}

export async function adminUpdatePropertyAmenity(
  id: string,
  data: Partial<{ name: string; image: string; galleryImages: string[]; order: number }>,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (data.name !== undefined) { sets.push(`name = $${i++}`); values.push(data.name); }
  if (data.image !== undefined) { sets.push(`image = $${i++}`); values.push(data.image); }
  if (data.galleryImages !== undefined) { sets.push(`gallery_images = $${i++}`); values.push(JSON.stringify(data.galleryImages)); }
  if (data.order !== undefined) { sets.push(`sort_order = $${i++}`); values.push(data.order); }
  if (!sets.length) return;
  sets.push("updated_at = NOW()");
  values.push(id);
  const result = await query(`UPDATE property_amenities SET ${sets.join(", ")} WHERE id = $${i}`, values);
  if (result.rowCount === 0) throw new Error("Amenity not found");
}

export async function adminDeletePropertyAmenity(id: string): Promise<void> {
  await query(`DELETE FROM property_amenities WHERE id = $1`, [id]);
}

export async function adminReplacePropertyAmenities(
  propertyId: string,
  amenities: { name: string; image?: string; galleryImages?: string[] }[],
): Promise<void> {
  const project = await resolveProjectRecord(propertyId);
  if (!project) throw new Error("Project not found");
  await query(`DELETE FROM property_amenities WHERE property_id = $1`, [project.id]);
  for (const [index, amenity] of amenities.entries()) {
    const name = String(amenity?.name || "").trim();
    if (!name) continue;
    await query(
      `INSERT INTO property_amenities (property_id, name, image, gallery_images, sort_order)
       VALUES ($1,$2,$3,$4,$5)`,
      [project.id, name, amenity.image ?? "", JSON.stringify(amenity.galleryImages ?? []), index],
    );
  }
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
  const clean = stripUndefined(data);
  const result = await query(
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
      id,
    ],
  );
  if (result.rowCount === 0) {
    throw new Error(`Hero slide not found: ${id}`);
  }
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

  if (collectionName === "heroSlides" || collectionName === "hero_slides") {
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
    await adminSetPropertyDetails(docId, clean);
    return;
  }

  if (collectionName === "heroSlides" || collectionName === "hero_slides") {
    await adminUpdateHeroSlide(docId, clean);
    return;
  }

  throw new Error(`adminSetDocument not supported for collection: ${collectionName}`);
}

export async function adminGetTestimonials(): Promise<Record<string, unknown>[]> {
  if (!isDatabaseConfigured()) return [];
  const result = await query(`SELECT * FROM testimonials ORDER BY created_at DESC`);
  return result.rows.map((r) => mapTestimonial(r));
}

export async function adminAddTestimonial(data: {
  name: string;
  role?: string;
  content: string;
  image?: string;
}): Promise<string> {
  const result = await query(
    `INSERT INTO testimonials (name, role, content, image) VALUES ($1,$2,$3,$4) RETURNING id`,
    [data.name, data.role ?? "", data.content, data.image ?? ""],
  );
  return String(result.rows[0].id);
}

export async function adminUpdateTestimonial(
  id: string,
  data: Partial<{ name: string; role: string; content: string; image: string }>,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (data.name !== undefined) { sets.push(`name = $${i++}`); values.push(data.name); }
  if (data.role !== undefined) { sets.push(`role = $${i++}`); values.push(data.role); }
  if (data.content !== undefined) { sets.push(`content = $${i++}`); values.push(data.content); }
  if (data.image !== undefined) { sets.push(`image = $${i++}`); values.push(data.image); }
  if (!sets.length) return;
  sets.push("updated_at = NOW()");
  values.push(id);
  await query(`UPDATE testimonials SET ${sets.join(", ")} WHERE id = $${i}`, values);
}

export async function adminDeleteTestimonial(id: string): Promise<void> {
  await query(`DELETE FROM testimonials WHERE id = $1`, [id]);
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

export async function adminAddArticle(data: {
  title: string;
  category?: string;
  date?: string;
  image?: string;
  excerpt?: string;
  content?: string;
}): Promise<string> {
  const result = await query(
    `INSERT INTO articles (title, category, date, image, excerpt, content)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [
      data.title,
      data.category ?? "",
      data.date ?? new Date().toISOString().split("T")[0],
      data.image ?? "",
      data.excerpt ?? null,
      data.content ?? null,
    ],
  );
  return String(result.rows[0].id);
}

export async function adminUpdateArticle(
  id: string,
  data: Partial<{
    title: string;
    category: string;
    date: string;
    image: string;
    excerpt: string;
    content: string;
  }>,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (data.title !== undefined) { sets.push(`title = $${i++}`); values.push(data.title); }
  if (data.category !== undefined) { sets.push(`category = $${i++}`); values.push(data.category); }
  if (data.date !== undefined) { sets.push(`date = $${i++}`); values.push(data.date); }
  if (data.image !== undefined) { sets.push(`image = $${i++}`); values.push(data.image); }
  if (data.excerpt !== undefined) { sets.push(`excerpt = $${i++}`); values.push(data.excerpt); }
  if (data.content !== undefined) { sets.push(`content = $${i++}`); values.push(data.content); }
  if (!sets.length) return;
  sets.push("updated_at = NOW()");
  values.push(id);
  await query(`UPDATE articles SET ${sets.join(", ")} WHERE id = $${i}`, values);
}

export async function adminDeleteArticle(id: string): Promise<void> {
  await query(`DELETE FROM articles WHERE id = $1`, [id]);
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
  gallery: number;
}> {
  if (!isDatabaseConfigured()) {
    return { projects: 0, leads: 0, articles: 0, testimonials: 0, gallery: 0 };
  }
  const [p, l, a, t, g] = await Promise.all([
    query(`SELECT COUNT(*)::int AS c FROM projects`),
    query(`SELECT COUNT(*)::int AS c FROM leads`),
    query(`SELECT COUNT(*)::int AS c FROM articles`),
    query(`SELECT COUNT(*)::int AS c FROM testimonials`),
    query(`SELECT COUNT(*)::int AS c FROM gallery`),
  ]);
  return {
    projects: p.rows[0]?.c ?? 0,
    leads: l.rows[0]?.c ?? 0,
    articles: a.rows[0]?.c ?? 0,
    testimonials: t.rows[0]?.c ?? 0,
    gallery: g.rows[0]?.c ?? 0,
  };
}
