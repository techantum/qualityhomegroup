import { readFileSync } from "fs";
import path from "path";

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnv();

import { query } from "../lib/db/postgres";
import { DEFAULT_BRANDING } from "../lib/branding";
import { DEFAULT_HOME_ABOUT } from "../lib/home-about";
import { DEFAULT_HOME_ABOUT as DEFAULT_ABOUT_BLOCK } from "../lib/about-content";

async function seedSettings() {
  const rows = [
    {
      key: "branding",
      data: {
        logoHeader: DEFAULT_BRANDING.logoHeader,
        logoFooter: DEFAULT_BRANDING.logoFooter,
        favicon: DEFAULT_BRANDING.favicon,
        siteName: DEFAULT_BRANDING.siteName,
      },
    },
    {
      key: "contact",
      data: {
        address: "123 Frontage Rd., Hyderabad, Telangana 500032",
        phone: "+91 98765 43210",
        email: "info@qualityhomegroup.com",
        mapUrl: "",
        socialLinks: {
          facebook: "",
          twitter: "",
          linkedin: "",
          youtube: "",
        },
      },
    },
    {
      key: "about",
      data: {
        title: "About Quality Home Group",
        subtitle: "Building Communities, Creating Value",
        description: DEFAULT_ABOUT_BLOCK.description,
        image: "https://placehold.co/800x600/1F2A54/ffffff?text=About+Us",
      },
    },
    {
      key: "hero",
      data: {
        headline: "A Higher Quality of Living",
        subheadline: "Premium apartments, villas, and commercial spaces across Hyderabad",
        backgroundImage: "https://placehold.co/1920x800/1F2A54/ffffff?text=Quality+Home+Group",
      },
    },
  ];

  for (const row of rows) {
    await query(
      `INSERT INTO settings (key, data) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [row.key, JSON.stringify(row.data)],
    );
  }
}

async function seedPages() {
  const pages = [
    { slug: "home-about", data: DEFAULT_HOME_ABOUT },
    {
      slug: "home-why-us",
      data: {
        title: "Why Quality Home Group",
        subtitle: "Trusted builder with a commitment to excellence",
        description: "We combine thoughtful design, quality construction, and transparent processes.",
        image: "https://placehold.co/800x600/DDA21A/1F2A54?text=Why+Us",
      },
    },
    {
      slug: "home-video",
      data: {
        title: "Experience Our Vision",
        videoUrl: "",
        posterImage: "https://placehold.co/1280x720/1F2A54/ffffff?text=Video",
      },
    },
    {
      slug: "home-projects",
      data: {
        title: "Latest Projects",
        subtitle: "Discover our latest residential and commercial developments.",
      },
    },
    {
      slug: "home-testimonials",
      data: {
        subtitle: "Feedback",
        title: "Our Testimonials",
      },
    },
    {
      slug: "home-news",
      data: {
        title: "Recent Articles & News",
        subtitle: "Stay updated with the latest news and insights from the real estate world.",
      },
    },
  ];

  for (const page of pages) {
    await query(
      `INSERT INTO pages (slug, data) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [page.slug, JSON.stringify(page.data)],
    );
  }
}

async function seedCategories() {
  const categories = [
    { name: "Apartments", slug: "apartments", description: "Modern high-rise and mid-rise apartments", sort_order: 1 },
    { name: "Villas", slug: "villas", description: "Luxury independent villas", sort_order: 2 },
    { name: "Commercial", slug: "commercial", description: "Office and retail spaces", sort_order: 3 },
    { name: "Plots", slug: "plots", description: "Residential plots with clear titles", sort_order: 4 },
  ];

  for (const c of categories) {
    await query(
      `INSERT INTO categories (name, slug, description, sort_order, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (slug) DO NOTHING`,
      [c.name, c.slug, c.description, c.sort_order],
    );
  }
}

async function seedProjects() {
  const projects = [
    {
      title: "Quality Home Group Skyline Towers",
      type: "apartment",
      location: "Narsingi, Hyderabad",
      image: "https://placehold.co/800x600/1F2A54/ffffff?text=Skyline+Towers",
      description: "Luxury high-rise apartments with premium amenities and panoramic city views.",
      category: "apartments",
      status: "ongoing",
      price: "1.2 Cr onwards",
      featured: true,
    },
    {
      title: "Green Valley Villas",
      type: "villa",
      location: "Gachibowli, Hyderabad",
      image: "https://placehold.co/800x600/2d5016/ffffff?text=Green+Valley",
      description: "Spacious villas set in lush greenery with private gardens and modern design.",
      category: "villas",
      status: "upcoming",
      price: "3.5 Cr onwards",
      featured: true,
    },
    {
      title: "Quality Home Group Tech Park",
      type: "commercial",
      location: "Madhapur, Hyderabad",
      image: "https://placehold.co/800x600/4a5568/ffffff?text=Tech+Park",
      description: "Grade-A commercial spaces in the heart of the IT corridor.",
      category: "commercial",
      status: "completed",
      price: "On request",
      featured: false,
    },
    {
      title: "Serenity Plots",
      type: "plot",
      location: "Shamirpet, Hyderabad",
      image: "https://placehold.co/800x600/744210/ffffff?text=Serenity+Plots",
      description: "Residential plots with clear titles, ready for your dream home.",
      category: "plots",
      status: "ongoing",
      price: "45 L onwards",
      featured: false,
    },
    {
      title: "Quality Home Group Heights",
      type: "apartment",
      location: "Kokapet, Hyderabad",
      image: "https://placehold.co/800x600/1F2A54/ffffff?text=Heights",
      description: "Modern apartments with smart home features and community amenities.",
      category: "apartments",
      status: "upcoming",
      price: "95 L onwards",
      featured: true,
    },
  ];

  for (const p of projects) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await query(
      `INSERT INTO projects (title, type, location, image, description, category, status, price, featured, slug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (slug) DO NOTHING`,
      [p.title, p.type, p.location, p.image, p.description, p.category, p.status, p.price, p.featured, slug],
    );
  }
}

async function seedHeroSlides() {
  const count = await query(`SELECT COUNT(*)::int AS c FROM hero_slides`);
  if ((count.rows[0]?.c ?? 0) > 0) return;

  const slides = [
    {
      headline: "A Higher Quality of Living",
      subheadline: "Discover premium homes crafted for modern families",
      background_image: "https://placehold.co/1920x800/1F2A54/ffffff?text=Slide+1",
      sort_order: 0,
    },
    {
      headline: "Spaces That Inspire",
      subheadline: "Apartments, villas, and commercial projects across Hyderabad",
      background_image: "https://placehold.co/1920x800/DDA21A/1F2A54?text=Slide+2",
      sort_order: 1,
    },
  ];

  for (const s of slides) {
    await query(
      `INSERT INTO hero_slides (headline, subheadline, background_image, sort_order) VALUES ($1,$2,$3,$4)`,
      [s.headline, s.subheadline, s.background_image, s.sort_order],
    );
  }
}

async function seedTestimonials() {
  const count = await query(`SELECT COUNT(*)::int AS c FROM testimonials`);
  if ((count.rows[0]?.c ?? 0) > 0) return;

  const items = [
    {
      name: "Rajesh Kumar",
      role: "Homeowner",
      content: "Quality Home Group delivered exactly what they promised — on time and with exceptional finish.",
      image: "https://placehold.co/120x120/1F2A54/ffffff?text=RK",
    },
    {
      name: "Priya Sharma",
      role: "Investor",
      content: "Transparent process and great location choices. Very happy with my investment.",
      image: "https://placehold.co/120x120/DDA21A/1F2A54?text=PS",
    },
    {
      name: "Anil Reddy",
      role: "Business Owner",
      content: "Their commercial project gave us the perfect office space in Madhapur.",
      image: "https://placehold.co/120x120/1F2A54/ffffff?text=AR",
    },
  ];

  for (const t of items) {
    await query(
      `INSERT INTO testimonials (name, role, content, image) VALUES ($1,$2,$3,$4)`,
      [t.name, t.role, t.content, t.image],
    );
  }
}

async function seedArticles() {
  const count = await query(`SELECT COUNT(*)::int AS c FROM articles`);
  if ((count.rows[0]?.c ?? 0) > 0) return;

  const articles = [
    {
      title: "Top 5 Localities to Buy in Hyderabad in 2026",
      category: "Market Insights",
      date: "2026-01-15",
      image: "https://placehold.co/800x450/1F2A54/ffffff?text=Blog+1",
      excerpt: "Explore emerging neighbourhoods with strong growth potential.",
      content: "Hyderabad continues to be one of India's fastest-growing real estate markets...",
    },
    {
      title: "Why RERA Registration Matters for Home Buyers",
      category: "Guides",
      date: "2026-02-02",
      image: "https://placehold.co/800x450/DDA21A/1F2A54?text=Blog+2",
      excerpt: "Understand how RERA protects your investment.",
      content: "RERA brings transparency and accountability to real estate transactions...",
    },
  ];

  for (const a of articles) {
    await query(
      `INSERT INTO articles (title, category, date, image, excerpt, content) VALUES ($1,$2,$3,$4,$5,$6)`,
      [a.title, a.category, a.date, a.image, a.excerpt, a.content],
    );
  }
}

async function seedGallery() {
  const count = await query(`SELECT COUNT(*)::int AS c FROM gallery`);
  if ((count.rows[0]?.c ?? 0) > 0) return;

  const images = [
    { title: "Lobby View", category: "Interiors", image: "https://placehold.co/600x400/1F2A54/ffffff?text=Lobby", sort_order: 0 },
    { title: "Clubhouse", category: "Amenities", image: "https://placehold.co/600x400/DDA21A/1F2A54?text=Clubhouse", sort_order: 1 },
    { title: "Landscape", category: "Exteriors", image: "https://placehold.co/600x400/2d5016/ffffff?text=Garden", sort_order: 2 },
  ];

  for (const g of images) {
    await query(
      `INSERT INTO gallery (title, category, image, sort_order) VALUES ($1,$2,$3,$4)`,
      [g.title, g.category, g.image, g.sort_order],
    );
  }
}

async function main() {
  console.log("[seed] Seeding database...");
  await seedSettings();
  await seedPages();
  await seedCategories();
  await seedProjects();
  await seedHeroSlides();
  await seedTestimonials();
  await seedArticles();
  await seedGallery();
  console.log("[seed] Done.");
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
