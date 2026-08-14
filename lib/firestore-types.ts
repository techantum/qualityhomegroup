/** ISO timestamp strings (replaces Firebase Timestamp). */
export type Timestamp = string;

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  heroImage?: string;
  heroTitle?: string;
  order: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Project {
  id?: string;
  title: string;
  type: string;
  location: string;
  image: string;
  description?: string;
  categoryId?: string;
  category?: string;
  status?: "ongoing" | "upcoming" | "completed";
  price?: string;
  featured?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Testimonial {
  id?: string;
  name: string;
  role: string;
  content: string;
  image: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Article {
  id?: string;
  title: string;
  category: string;
  date: string;
  image: string;
  excerpt?: string;
  content?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface HeroContent {
  id?: string;
  headline: string;
  subheadline: string;
  backgroundImage: string;
  updatedAt?: Timestamp;
}

export interface HeroSlide {
  id?: string;
  headline: string;
  subheadline: string;
  backgroundImage: string;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AboutContent {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  updatedAt?: Timestamp;
}

export interface ContactInfo {
  id?: string;
  address: string;
  phone: string;
  email: string;
  mapUrl?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  updatedAt?: Timestamp;
}

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  status:
    | "new"
    | "contacted"
    | "qualified"
    | "converted"
    | "rejected"
    | "saved"
    | "closed"
    | "lost";
  notes?: string;
  propertyInterest?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface GalleryImage {
  id?: string;
  title: string;
  category: string;
  image: string;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PageContent {
  id?: string;
  pageName: string;
  title: string;
  subtitle?: string;
  content?: string;
  heroImage?: string;
  sections?: Record<string, unknown>[];
  updatedAt?: Timestamp;
}

export interface CMSPage {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  isActive: boolean;
  isIndexed: boolean;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
}

export type CMSSectionType =
  | "hero"
  | "about"
  | "services"
  | "features"
  | "testimonials"
  | "gallery"
  | "cta"
  | "contact"
  | "projects"
  | "team"
  | "stats"
  | "faq"
  | "pricing"
  | "newsletter"
  | "custom";

export interface CMSSection {
  id?: string;
  pageId: string;
  type: CMSSectionType;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  image?: string;
  backgroundImage?: string;
  items?: CMSSectionItem[];
  order: number;
  isActive: boolean;
  settings?: Record<string, unknown>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CMSSectionItem {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  icon?: string;
  link?: string;
  order: number;
}

export interface FormSubmission {
  id?: string;
  formId: string;
  formName: string;
  fields: Record<string, string>;
  source: string;
  userAgent?: string;
  ipAddress?: string;
  isRead: boolean;
  createdAt?: Timestamp;
}

export interface FormConfig {
  id?: string;
  name: string;
  slug: string;
  fields: FormField[];
  successMessage: string;
  emailNotification?: string;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "radio";
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: string;
}

export interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  leads: number;
  conversionRate: number;
}

export interface PropertyAmenity {
  id?: string;
  propertyId: string;
  name: string;
  image: string;
  galleryImages: string[];
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PropertySectionContent {
  id?: string;
  propertyId: string;
  sectionType:
    | "hero"
    | "stats"
    | "about"
    | "amenities"
    | "floorPlan"
    | "gallery"
    | "location"
    | "specifications"
    | "video"
    | "brochure";
  title?: string;
  subtitle?: string;
  description?: string;
  content?: Record<string, unknown>;
  order: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PropertyDetails {
  id?: string;
  projectId: string;
  tagline: string;
  price: string;
  priceLabel: string;
  heroImage: string;
  about: string;
  reraNumber: string;
  videoUrl?: string;
  brochureUrl?: string;
  stats: {
    totalLandArea: string;
    noOfBlocks: string;
    totalUnits: string;
    configuration: string;
    floors: string;
    possessionStarts: string;
  };
  location: {
    address: string;
    mapUrl: string;
    nearbyPlaces: { name: string; distance: string; type: string }[];
  };
  specifications: {
    category: string;
    items: string[];
  }[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
