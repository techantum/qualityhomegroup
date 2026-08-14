/**
 * Zod schemas for API request validation.
 */

import { z } from "zod";

/** Contact / enquiry submission (unified for enquiry modal and contact page) */
export const contactSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").max(320),
  phone: z.string().max(50).optional().default(""),
  message: z.string().max(5000).optional().default(""),
  source: z.string().max(100).optional().default("Website Enquiry"),
  projectType: z.string().max(100).optional(),
  newsletter: z.boolean().optional(),
});

/** Lead status for filtering and updates */
export const leadStatusSchema = z.enum(["new", "contacted", "qualified", "converted", "rejected", "saved", "closed", "lost"]);

/** Pagination query */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/** Leads list query (cursor-based pagination + filters) */
export const leadsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().min(1).optional(),
  status: leadStatusSchema.optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

/** Mark lead as contacted/closed body */
export const updateLeadStatusSchema = z.object({
  status: leadStatusSchema,
});

/** CMS page create/update */
export const cmsPageSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
  isIndexed: z.boolean().default(true),
  order: z.number().int().min(0),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.array(z.string().max(50)).max(20).optional(),
  ogImage: z.string().url().max(2000).optional(),
});

/** CMS section create/update */
export const cmsSectionSchema = z.object({
  pageId: z.string().min(1),
  type: z.enum([
    "hero", "about", "services", "features", "testimonials", "gallery",
    "cta", "contact", "projects", "team", "stats", "faq", "pricing", "newsletter", "custom"
  ]),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(500).optional(),
  description: z.string().max(50_000).optional(),
  buttonText: z.string().max(100).optional(),
  buttonUrl: z.string().max(2000).optional(),
  image: z.string().max(2000).optional(),
  backgroundImage: z.string().max(2000).optional(),
  items: z.array(z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    icon: z.string().optional(),
    link: z.string().optional(),
    order: z.number().int().min(0),
  })).optional(),
  order: z.number().int().min(0),
  isActive: z.boolean().default(true),
  settings: z.record(z.unknown()).optional(),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
export type LeadsQueryInput = z.infer<typeof leadsQuerySchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type CMSPageInput = z.infer<typeof cmsPageSchema>;
export type CMSSectionInput = z.infer<typeof cmsSectionSchema>;
