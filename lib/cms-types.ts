export interface HeroContent {
  title: string;
  subtitle: string;
  backgroundImage: string;
}

export interface AboutContent {
  sectionTitle: string;
  heading: string;
  description: string;
  image: string;
  propertyTypes: {
    icon: string;
    label: string;
  }[];
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
  featured: boolean;
}

export interface VideoContent {
  title: string;
  backgroundImage: string;
  videoUrl: string;
}

export interface WhyUsFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface WhyUsContent {
  sectionTitle: string;
  heading: string;
  description: string;
  features: WhyUsFeature[];
  images: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  image: string;
}

export interface NewsArticle {
  id: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  image: string;
  slug: string;
}

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
}

export interface CMSData {
  hero: HeroContent;
  about: AboutContent;
  projects: Project[];
  video: VideoContent;
  whyUs: WhyUsContent;
  testimonials: Testimonial[];
  news: NewsArticle[];
  contact: ContactInfo;
}
