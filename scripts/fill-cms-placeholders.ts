import { readFileSync } from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

import { query } from "../lib/db/postgres";
import { DEFAULT_HOME_ABOUT, DEFAULT_HOME_ABOUT_PROPERTY_TYPES } from "../lib/home-about";
import { DEFAULT_HOME_WHY_US, DEFAULT_HOME_WHY_US_FEATURES } from "../lib/home-why-us";

function isMissing(url: unknown): boolean {
  if (typeof url !== "string") return true;
  const t = url.trim();
  if (!t) return true;
  if (t.includes("placehold.co")) return true;
  if (t === "/placeholder.svg") return true;
  return false;
}

async function getPage(slug: string): Promise<Record<string, any>> {
  const result = await query(`SELECT data FROM pages WHERE slug = $1`, [slug]);
  return ((result.rows[0]?.data as Record<string, any>) ?? {}) || {};
}

async function savePage(slug: string, data: Record<string, unknown>) {
  await query(
    `INSERT INTO pages (slug, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [slug, JSON.stringify(data)],
  );
}

async function getSettings(key: string): Promise<Record<string, any>> {
  const result = await query(`SELECT data FROM settings WHERE key = $1`, [key]);
  return ((result.rows[0]?.data as Record<string, any>) ?? {}) || {};
}

async function saveSettings(key: string, data: Record<string, unknown>) {
  await query(
    `INSERT INTO settings (key, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [key, JSON.stringify(data)],
  );
}

async function main() {
  const aboutIcons = [
    "/cms/home-about/icons/1778930570045-sloym.png",
    "/cms/home-about/icons/1778930579098-er8rv.png",
    "/cms/home-about/icons/1778930592215-x3cabn.png",
    "/cms/home-about/icons/1778930599579-u65hzl.png",
  ];
  const whyUsIcons = [
    "/images/icons/corporate-responsibility.png",
    "/images/icons/experts-team-spirit.png",
    "/images/icons/diversity-inclusion.png",
    "/images/icons/location-icon.png",
  ];

  // Homepage about
  const homeAbout = { ...DEFAULT_HOME_ABOUT, ...(await getPage("home-about")) };
  if (isMissing(homeAbout.image)) homeAbout.image = "/cms/home-about/1778930249865-s6ub5.png";
  const propertyTypes = Array.isArray(homeAbout.propertyTypes) && homeAbout.propertyTypes.length
    ? homeAbout.propertyTypes
    : DEFAULT_HOME_ABOUT_PROPERTY_TYPES;
  homeAbout.propertyTypes = propertyTypes.map((item: any, i: number) => ({
    label: item.label || DEFAULT_HOME_ABOUT_PROPERTY_TYPES[i]?.label || `Type ${i + 1}`,
    image: isMissing(item.image)
      ? aboutIcons[i] || "/images/icons/apartments.png"
      : item.image,
  }));
  await savePage("home-about", homeAbout);
  console.log("updated home-about");

  // Homepage why-us
  const homeWhyUs = { ...DEFAULT_HOME_WHY_US, ...(await getPage("home-why-us")) };
  if (isMissing(homeWhyUs.image)) homeWhyUs.image = "/images/why-us-1.jpg";
  if (!homeWhyUs.eyebrow) homeWhyUs.eyebrow = DEFAULT_HOME_WHY_US.eyebrow;
  if (!homeWhyUs.description) homeWhyUs.description = DEFAULT_HOME_WHY_US.description;
  const features = Array.isArray(homeWhyUs.features) && homeWhyUs.features.length
    ? homeWhyUs.features
    : DEFAULT_HOME_WHY_US_FEATURES;
  homeWhyUs.features = features.map((item: any, i: number) => {
    const fallback = DEFAULT_HOME_WHY_US_FEATURES[i] ?? DEFAULT_HOME_WHY_US_FEATURES[0];
    return {
      title: item.title || fallback.title,
      description: item.description || fallback.description,
      icon: isMissing(item.icon) ? whyUsIcons[i] || whyUsIcons[0] : item.icon,
    };
  });
  await savePage("home-why-us", homeWhyUs);
  console.log("updated home-why-us");

  // Homepage video poster
  const homeVideo = await getPage("home-video");
  if (isMissing(homeVideo.posterImage)) {
    homeVideo.posterImage = "/videos/1778931970863-s3w9a6.png";
    if (!homeVideo.title) homeVideo.title = "Experience Our Vision";
    await savePage("home-video", homeVideo);
    console.log("updated home-video");
  }

  // About page
  const about = await getPage("about");
  if (isMissing(about.heroImage)) about.heroImage = "/images/about/hero-boardroom.png";
  if (isMissing(about.missionIcon)) about.missionIcon = "/images/icons/mission-icon.png";
  if (isMissing(about.visionIcon)) about.visionIcon = "/images/icons/vision-icon.png";
  if (!about.heroTitle) about.heroTitle = "About Us";
  await savePage("about", about);
  console.log("updated about");

  // Listing / inner page heroes
  const listingHeroes: Record<string, { title: string; heroImage: string }> = {
    apartments: { title: "Apartments", heroImage: "/cms/apartments/1772274654129-jb2jyd.png" },
    villas: { title: "Villas", heroImage: "/cms/villas/1772275445975-0hsbm.png" },
    commercial: { title: "Commercial", heroImage: "/cms/apartment/1772274058078-6xq8zn.png" },
    plots: { title: "Plots", heroImage: "/categories/1772100297568-u9gvo.png" },
    gallery: { title: "Gallery", heroImage: "/cms/gallery/1772273810658-tblkcw.png" },
    blog: { title: "Blog", heroImage: "/cms/blog/1772273970629-35jyai.png" },
    testimonials: { title: "Testimonials", heroImage: "/images/testimonials-bg.png" },
  };
  for (const [slug, defaults] of Object.entries(listingHeroes)) {
    const page = await getPage(slug);
    if (!page.title && !page.heroTitle) page.title = defaults.title;
    if (!page.heroTitle) page.heroTitle = defaults.title;
    if (isMissing(page.heroImage)) page.heroImage = defaults.heroImage;
    await savePage(slug, page);
    console.log("updated page", slug);
  }

  // Contact hero lives in settings.contact
  const contact = await getSettings("contact");
  if (!contact.heroTitle) contact.heroTitle = "Contact Us";
  if (isMissing(contact.heroImage)) contact.heroImage = "/cms/contact/1772274008456-decwch.png";
  await saveSettings("contact", contact);
  console.log("updated contact");

  // Testimonials avatars
  const testimonialImages = [
    "/images/testimonial-user-1.png",
    "/images/testimonial-user-2.png",
    "/images/testimonial-1.jpg",
  ];
  const testimonials = await query(`SELECT id, image FROM testimonials ORDER BY created_at ASC`);
  for (let i = 0; i < testimonials.rows.length; i++) {
    const row = testimonials.rows[i];
    if (isMissing(row.image)) {
      await query(`UPDATE testimonials SET image = $1, updated_at = NOW() WHERE id = $2`, [
        testimonialImages[i % testimonialImages.length],
        row.id,
      ]);
    }
  }
  console.log("updated testimonials");

  // Articles
  const articleImages = ["/images/blog/blog-1.png", "/images/blog/blog-2.png", "/images/blog/blog-3.png"];
  const articles = await query(`SELECT id, image FROM articles ORDER BY created_at ASC`);
  for (let i = 0; i < articles.rows.length; i++) {
    const row = articles.rows[i];
    if (isMissing(row.image)) {
      await query(`UPDATE articles SET image = $1, updated_at = NOW() WHERE id = $2`, [
        articleImages[i % articleImages.length],
        row.id,
      ]);
    }
  }
  console.log("updated articles");

  // Gallery items
  const galleryImages = [
    "/images/gallery-1.png",
    "/images/gallery-2.png",
    "/images/gallery-3.png",
    "/gallery/apartments/1772174454308-mso4fl.jpg",
  ];
  const gallery = await query(`SELECT id, image FROM gallery ORDER BY sort_order ASC`);
  for (let i = 0; i < gallery.rows.length; i++) {
    const row = gallery.rows[i];
    if (isMissing(row.image)) {
      await query(`UPDATE gallery SET image = $1, updated_at = NOW() WHERE id = $2`, [
        galleryImages[i % galleryImages.length],
        row.id,
      ]);
    }
  }
  console.log("updated gallery");

  // Category table images (admin + listing fallback)
  const categoryImages: Record<string, { image: string; hero: string }> = {
    apartments: {
      image: "/categories/1772172471483-6eirkj.png",
      hero: "/cms/apartments/1772274654129-jb2jyd.png",
    },
    villas: {
      image: "/categories/1772172478729-q312rdh.png",
      hero: "/cms/villas/1772275445975-0hsbm.png",
    },
    commercial: {
      image: "/cms/apartment/1772274058078-6xq8zn.png",
      hero: "/cms/apartment/1772274058078-6xq8zn.png",
    },
    plots: {
      image: "/categories/1772100297568-u9gvo.png",
      hero: "/categories/1772100297568-u9gvo.png",
    },
  };
  const categories = await query(`SELECT slug, image, hero_image FROM categories`);
  for (const row of categories.rows) {
    const defaults = categoryImages[row.slug as string];
    if (!defaults) continue;
    const image = isMissing(row.image) ? defaults.image : row.image;
    const hero = isMissing(row.hero_image) ? defaults.hero : row.hero_image;
    await query(
      `UPDATE categories SET image = $1, hero_image = $2, updated_at = NOW() WHERE slug = $3`,
      [image, hero, row.slug],
    );
  }
  console.log("updated categories");

  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
