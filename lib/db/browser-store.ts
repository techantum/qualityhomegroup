/**
 * Browser-side data access via Supabase (replaces Firebase Firestore client SDK).
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AboutContent,
  Article,
  Category,
  CMSPage,
  CMSSection,
  ContactInfo,
  FormConfig,
  FormSubmission,
  GalleryImage,
  HeroContent,
  HeroSlide,
  Lead,
  PageContent,
  Project,
  PropertyAmenity,
  PropertyDetails,
  PropertySectionContent,
  Testimonial,
} from "@/lib/firestore-types";
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
} from "@/lib/db/mappers";

function db() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

function dbOrNull() {
  return getSupabaseBrowserClient();
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured");
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getProjects(): Promise<Project[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("projects").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapProject(r) as Project);
}

export async function addProject(project: Omit<Project, "id">): Promise<string> {
  const sb = db();
  const { data, error } = await sb.from("projects").insert({
    title: project.title,
    type: project.type,
    location: project.location,
    image: project.image,
    description: project.description ?? null,
    category_id: project.categoryId ?? null,
    category: project.category ?? null,
    status: project.status ?? null,
    price: project.price ?? null,
    featured: project.featured ?? false,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateProject(id: string, project: Partial<Project>): Promise<void> {
  const sb = db();
  const { error } = await sb.from("projects").update({
    title: project.title,
    type: project.type,
    location: project.location,
    image: project.image,
    description: project.description,
    category_id: project.categoryId,
    category: project.category,
    status: project.status,
    price: project.price,
    featured: project.featured,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await db().from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const sb = dbOrNull();
  if (!sb) return null;
  const { data, error } = await sb.from("projects").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapProject(data) as Project;
}

export async function getProjectsByCategory(categorySlug: string): Promise<Project[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("projects").select("*").eq("category", categorySlug);
  if (error) throw error;
  return (data ?? []).map((r) => mapProject(r) as Project);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("testimonials").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapTestimonial(r) as Testimonial);
}

export async function addTestimonial(testimonial: Omit<Testimonial, "id">): Promise<string> {
  const { data, error } = await db().from("testimonials").insert({
    name: testimonial.name,
    role: testimonial.role,
    content: testimonial.content,
    image: testimonial.image,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateTestimonial(id: string, testimonial: Partial<Testimonial>): Promise<void> {
  const { error } = await db().from("testimonials").update({
    name: testimonial.name,
    role: testimonial.role,
    content: testimonial.content,
    image: testimonial.image,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await db().from("testimonials").delete().eq("id", id);
  if (error) throw error;
}

export async function getArticles(): Promise<Article[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("articles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapArticle(r) as Article);
}

export async function addArticle(article: Omit<Article, "id">): Promise<string> {
  const { data, error } = await db().from("articles").insert({
    title: article.title,
    category: article.category,
    date: article.date,
    image: article.image,
    excerpt: article.excerpt ?? null,
    content: article.content ?? null,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateArticle(id: string, article: Partial<Article>): Promise<void> {
  const { error } = await db().from("articles").update({
    title: article.title,
    category: article.category,
    date: article.date,
    image: article.image,
    excerpt: article.excerpt,
    content: article.content,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await db().from("articles").delete().eq("id", id);
  if (error) throw error;
}

async function getSettingsDoc(key: string): Promise<Record<string, unknown> | null> {
  const sb = dbOrNull();
  if (!sb) return null;
  const { data, error } = await sb.from("settings").select("data").eq("key", key).maybeSingle();
  if (error || !data) return null;
  return data.data as Record<string, unknown>;
}

async function upsertSettingsDoc(key: string, patch: Record<string, unknown>): Promise<void> {
  const existing = await getSettingsDoc(key);
  const merged = { ...(existing ?? {}), ...patch, updatedAt: new Date().toISOString() };
  const { error } = await db().from("settings").upsert({ key, data: merged, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getHeroContent(): Promise<HeroContent | null> {
  const data = await getSettingsDoc("hero");
  return data ? ({ id: "hero", ...data } as HeroContent) : null;
}

export async function updateHeroContent(content: Partial<HeroContent>): Promise<void> {
  await upsertSettingsDoc("hero", content as Record<string, unknown>);
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("hero_slides").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapHeroSlide(r) as HeroSlide);
}

export async function addHeroSlide(slide: Omit<HeroSlide, "id">): Promise<string> {
  const { data, error } = await db().from("hero_slides").insert({
    headline: slide.headline,
    subheadline: slide.subheadline,
    background_image: slide.backgroundImage,
    sort_order: slide.order,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateHeroSlide(id: string, slide: Partial<HeroSlide>): Promise<void> {
  const { error } = await db().from("hero_slides").update({
    headline: slide.headline,
    subheadline: slide.subheadline,
    background_image: slide.backgroundImage,
    sort_order: slide.order,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteHeroSlide(id: string): Promise<void> {
  const { error } = await db().from("hero_slides").delete().eq("id", id);
  if (error) throw error;
}

export async function getAboutContent(): Promise<AboutContent | null> {
  const data = await getSettingsDoc("about");
  return data ? ({ id: "about", ...data } as AboutContent) : null;
}

export async function updateAboutContent(content: Partial<AboutContent>): Promise<void> {
  await upsertSettingsDoc("about", content as Record<string, unknown>);
}

export async function getContactInfo(): Promise<ContactInfo | null> {
  const data = await getSettingsDoc("contact");
  return data ? ({ id: "contact", ...data } as ContactInfo) : null;
}

export async function updateContactInfo(info: Partial<ContactInfo>): Promise<void> {
  await upsertSettingsDoc("contact", info as Record<string, unknown>);
}

export async function getLeads(): Promise<Lead[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapLead(r) as Lead);
}

export async function addLead(lead: Omit<Lead, "id">): Promise<string> {
  const { data, error } = await db().from("leads").insert({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
    source: lead.source,
    status: lead.status ?? "new",
    notes: lead.notes ?? null,
    property_interest: lead.propertyInterest ?? null,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateLead(id: string, lead: Partial<Lead>): Promise<void> {
  const { error } = await db().from("leads").update({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
    source: lead.source,
    status: lead.status,
    notes: lead.notes,
    property_interest: lead.propertyInterest,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await db().from("leads").delete().eq("id", id);
  if (error) throw error;
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  try {
    const res = await fetch("/api/v1/gallery/public", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return (json.data ?? []) as GalleryImage[];
  } catch {
    return [];
  }
}

export async function addGalleryImage(image: Omit<GalleryImage, "id">): Promise<string> {
  const res = await fetch("/api/v1/gallery", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(image),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Failed to add gallery image");
  return String(json.data?.id);
}

export async function updateGalleryImage(id: string, image: Partial<GalleryImage>): Promise<void> {
  const res = await fetch(`/api/v1/gallery/${id}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(image),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Failed to update gallery image");
  }
}

export async function deleteGalleryImage(id: string): Promise<void> {
  const res = await fetch(`/api/v1/gallery/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Failed to delete gallery image");
  }
}

export async function getPageContent(pageName: string): Promise<PageContent | null> {
  const sb = dbOrNull();
  if (!sb) return null;
  const { data, error } = await sb.from("pages").select("data").eq("slug", pageName).maybeSingle();
  if (error || !data) return null;
  return { id: pageName, pageName, ...(data.data as Record<string, unknown>) } as PageContent;
}

export async function updatePageContent(pageName: string, content: Partial<PageContent>): Promise<void> {
  const existing = await getPageContent(pageName);
  const merged = { ...(existing ?? {}), ...content, updatedAt: new Date().toISOString() };
  const { error } = await db().from("pages").upsert({
    slug: pageName,
    data: merged,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getAllPages(): Promise<PageContent[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("pages").select("*");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.slug,
    pageName: r.slug,
    ...(r.data as Record<string, unknown>),
  })) as PageContent[];
}

export async function getDashboardStats() {
  const sb = dbOrNull();
  if (!sb) return { projects: 0, testimonials: 0, articles: 0, leads: 0, gallery: 0 };

  const [p, t, a, l, g] = await Promise.all([
    sb.from("projects").select("*", { count: "exact", head: true }),
    sb.from("testimonials").select("*", { count: "exact", head: true }),
    sb.from("articles").select("*", { count: "exact", head: true }),
    sb.from("leads").select("*", { count: "exact", head: true }),
    sb.from("gallery").select("*", { count: "exact", head: true }),
  ]);

  return {
    projects: p.count ?? 0,
    testimonials: t.count ?? 0,
    articles: a.count ?? 0,
    leads: l.count ?? 0,
    gallery: g.count ?? 0,
  };
}

export async function getPropertyAmenities(propertyId: string): Promise<PropertyAmenity[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("property_amenities").select("*").eq("property_id", propertyId).order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: String(r.id),
    propertyId: String(r.property_id),
    name: r.name,
    image: r.image,
    galleryImages: r.gallery_images ?? [],
    order: r.sort_order,
  })) as PropertyAmenity[];
}

export async function addPropertyAmenity(amenity: Omit<PropertyAmenity, "id">): Promise<string> {
  const { data, error } = await db().from("property_amenities").insert({
    property_id: amenity.propertyId,
    name: amenity.name,
    image: amenity.image,
    gallery_images: amenity.galleryImages,
    sort_order: amenity.order,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updatePropertyAmenity(id: string, amenity: Partial<PropertyAmenity>): Promise<void> {
  const { error } = await db().from("property_amenities").update({
    name: amenity.name,
    image: amenity.image,
    gallery_images: amenity.galleryImages,
    sort_order: amenity.order,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deletePropertyAmenity(id: string): Promise<void> {
  const { error } = await db().from("property_amenities").delete().eq("id", id);
  if (error) throw error;
}

export async function getPropertyDetails(projectId: string): Promise<PropertyDetails | null> {
  const sb = dbOrNull();
  if (!sb) return null;
  const { data, error } = await sb.from("property_details").select("data").eq("project_id", projectId).maybeSingle();
  if (error || !data) return null;
  return { id: projectId, projectId, ...(data.data as Record<string, unknown>) } as PropertyDetails;
}

export async function updatePropertyDetails(projectId: string, details: Partial<PropertyDetails>): Promise<void> {
  const existing = await getPropertyDetails(projectId);
  const merged = { ...(existing ?? {}), ...details, projectId };
  const { error } = await db().from("property_details").upsert({
    project_id: projectId,
    data: merged,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getPropertySections(propertyId: string): Promise<PropertySectionContent[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("property_sections").select("*").eq("property_id", propertyId).order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: String(r.id),
    propertyId: String(r.property_id),
    sectionType: r.section_type,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    content: r.content,
    order: r.sort_order,
    isActive: r.is_active,
  })) as PropertySectionContent[];
}

export async function addPropertySection(section: Omit<PropertySectionContent, "id">): Promise<string> {
  const { data, error } = await db().from("property_sections").insert({
    property_id: section.propertyId,
    section_type: section.sectionType,
    title: section.title ?? null,
    subtitle: section.subtitle ?? null,
    description: section.description ?? null,
    content: section.content ?? {},
    sort_order: section.order,
    is_active: section.isActive,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updatePropertySection(id: string, section: Partial<PropertySectionContent>): Promise<void> {
  const { error } = await db().from("property_sections").update({
    section_type: section.sectionType,
    title: section.title,
    subtitle: section.subtitle,
    description: section.description,
    content: section.content,
    sort_order: section.order,
    is_active: section.isActive,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deletePropertySection(id: string): Promise<void> {
  const { error } = await db().from("property_sections").delete().eq("id", id);
  if (error) throw error;
}

export async function getCMSPages(): Promise<CMSPage[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("cms_pages").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => mapCmsPage(r) as CMSPage);
}

export async function getCMSPageBySlug(slug: string): Promise<CMSPage | null> {
  const sb = dbOrNull();
  if (!sb) return null;
  const { data, error } = await sb.from("cms_pages").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return mapCmsPage(data) as CMSPage;
}

export async function addCMSPage(page: Omit<CMSPage, "id">): Promise<string> {
  const { data, error } = await db().from("cms_pages").insert({
    slug: page.slug,
    title: page.title,
    description: page.description ?? null,
    is_active: page.isActive,
    is_indexed: page.isIndexed,
    sort_order: page.order,
    meta_title: page.metaTitle ?? null,
    meta_description: page.metaDescription ?? null,
    meta_keywords: page.metaKeywords ?? [],
    og_image: page.ogImage ?? null,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateCMSPage(id: string, page: Partial<CMSPage>): Promise<void> {
  const { error } = await db().from("cms_pages").update({
    slug: page.slug,
    title: page.title,
    description: page.description,
    is_active: page.isActive,
    is_indexed: page.isIndexed,
    sort_order: page.order,
    meta_title: page.metaTitle,
    meta_description: page.metaDescription,
    meta_keywords: page.metaKeywords,
    og_image: page.ogImage,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteCMSPage(id: string): Promise<void> {
  const { error } = await db().from("cms_pages").delete().eq("id", id);
  if (error) throw error;
}

export async function getCMSSections(pageId: string): Promise<CMSSection[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("cms_sections").select("*").eq("page_id", pageId).order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => mapCmsSection(r) as CMSSection);
}

export async function addCMSSection(section: Omit<CMSSection, "id">): Promise<string> {
  const { data, error } = await db().from("cms_sections").insert({
    page_id: section.pageId,
    type: section.type,
    title: section.title ?? null,
    subtitle: section.subtitle ?? null,
    description: section.description ?? null,
    button_text: section.buttonText ?? null,
    button_url: section.buttonUrl ?? null,
    image: section.image ?? null,
    background_image: section.backgroundImage ?? null,
    items: section.items ?? [],
    sort_order: section.order,
    is_active: section.isActive,
    settings: section.settings ?? {},
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateCMSSection(id: string, section: Partial<CMSSection>): Promise<void> {
  const { error } = await db().from("cms_sections").update({
    page_id: section.pageId,
    type: section.type,
    title: section.title,
    subtitle: section.subtitle,
    description: section.description,
    button_text: section.buttonText,
    button_url: section.buttonUrl,
    image: section.image,
    background_image: section.backgroundImage,
    items: section.items,
    sort_order: section.order,
    is_active: section.isActive,
    settings: section.settings,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteCMSSection(id: string): Promise<void> {
  const { error } = await db().from("cms_sections").delete().eq("id", id);
  if (error) throw error;
}

export async function getFormSubmissions(formId?: string): Promise<FormSubmission[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  let q = sb.from("form_submissions").select("*").order("created_at", { ascending: false });
  if (formId) q = q.eq("form_id", formId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: String(r.id),
    formId: String(r.form_id),
    formName: r.form_name,
    fields: r.fields,
    source: r.source,
    userAgent: r.user_agent,
    ipAddress: r.ip_address,
    isRead: r.is_read,
    createdAt: r.created_at,
  })) as FormSubmission[];
}

export async function addFormSubmission(submission: Omit<FormSubmission, "id">): Promise<string> {
  const { data, error } = await db().from("form_submissions").insert({
    form_id: submission.formId,
    form_name: submission.formName,
    fields: submission.fields,
    source: submission.source,
    user_agent: submission.userAgent ?? null,
    ip_address: submission.ipAddress ?? null,
    is_read: submission.isRead ?? false,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function markSubmissionAsRead(id: string): Promise<void> {
  const { error } = await db().from("form_submissions").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function deleteFormSubmission(id: string): Promise<void> {
  const { error } = await db().from("form_submissions").delete().eq("id", id);
  if (error) throw error;
}

export async function getFormConfigs(): Promise<FormConfig[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("form_configs").select("*");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    slug: r.slug,
    fields: r.fields,
    successMessage: r.success_message,
    emailNotification: r.email_notification,
    isActive: r.is_active,
  })) as FormConfig[];
}

export async function getFormConfigBySlug(slug: string): Promise<FormConfig | null> {
  const sb = dbOrNull();
  if (!sb) return null;
  const { data, error } = await sb.from("form_configs").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return {
    id: String(data.id),
    name: data.name,
    slug: data.slug,
    fields: data.fields,
    successMessage: data.success_message,
    emailNotification: data.email_notification,
    isActive: data.is_active,
  } as FormConfig;
}

export async function addFormConfig(config: Omit<FormConfig, "id">): Promise<string> {
  const { data, error } = await db().from("form_configs").insert({
    name: config.name,
    slug: config.slug,
    fields: config.fields,
    success_message: config.successMessage,
    email_notification: config.emailNotification ?? null,
    is_active: config.isActive,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateFormConfig(id: string, config: Partial<FormConfig>): Promise<void> {
  const { error } = await db().from("form_configs").update({
    name: config.name,
    slug: config.slug,
    fields: config.fields,
    success_message: config.successMessage,
    email_notification: config.emailNotification,
    is_active: config.isActive,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteFormConfig(id: string): Promise<void> {
  const { error } = await db().from("form_configs").delete().eq("id", id);
  if (error) throw error;
}

export async function getCategories(): Promise<Category[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => mapCategory(r) as Category);
}

export async function getActiveCategories(): Promise<Category[]> {
  const sb = dbOrNull();
  if (!sb) return [];
  const { data, error } = await sb.from("categories").select("*").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => mapCategory(r) as Category);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const sb = dbOrNull();
  if (!sb) return null;
  const { data, error } = await sb.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return mapCategory(data) as Category;
}

export async function addCategory(category: Omit<Category, "id">): Promise<string> {
  const { data, error } = await db().from("categories").insert({
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    image: category.image ?? null,
    hero_image: category.heroImage ?? null,
    hero_title: category.heroTitle ?? null,
    sort_order: category.order,
    is_active: category.isActive,
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<void> {
  const { error } = await db().from("categories").update({
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    hero_image: category.heroImage,
    hero_title: category.heroTitle,
    sort_order: category.order,
    is_active: category.isActive,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await db().from("categories").delete().eq("id", id);
  if (error) throw error;
}

export { isSupabaseConfigured as isFirebaseConfigured } from "@/lib/supabase/client";
