import { readFileSync } from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

import { query } from "../lib/db/postgres";
import { DEFAULT_COMPANY_HISTORY } from "../lib/company-history";
import { DEFAULT_HOME_ABOUT } from "../lib/home-about";

const ABOUT = {
  heroTitle: "About Us",
  tagline: "Building Homes That Are\nBETTER\nSAFER\nSMARTER.",
  introText:
    "Quality Home Group is a construction company that builds homes with a foundation of experience, strength of quality construction, colors of innovative solutions, lights of new technology, surety of transparent transactions and finally the touch of emotion that converts into a dream home.",
  description:
    "Quality Home Group stands tall when it comes to delivering beyond expectations. We work for customer satisfaction, and that approach has helped us create our niche in the market as one of the preferred construction companies.",
  missionTitle: "Our Mission",
  missionText:
    "To build homes that are better, safer, and smarter — with quality construction, innovative solutions, new technology, and transparent transactions, finished with the emotion that turns a house into a dream home.",
  visionTitle: "Our Vision",
  visionText:
    "To be among the preferred construction companies by working for customer satisfaction and consistently delivering beyond expectations.",
  leadersTitle: "Leadership",
  leadersSubtitle: "The people behind Quality Home Group",
  leaderName: "Ramesh Karutoori",
  leaderRole: "Managing Director",
  leaderBio:
    "Ramesh Karutoori is a business leader, entrepreneur, and technology professional with extensive experience across real estate development, information technology, digital transformation, media services, and business management.\n\nCombining a strong corporate background with entrepreneurial leadership, he has successfully built and managed businesses across multiple sectors. His professional journey includes experience with leading global technology organizations, where he developed expertise in enterprise solutions, business operations, technology consulting, and large-scale project execution.\n\nOver the years, he has expanded his focus into real estate development, actively participating in project planning, business strategy, investment evaluation, and development initiatives. His ability to integrate technology, business strategy, and operational excellence has enabled the successful growth of multiple ventures across diverse industries.\n\nRecognized for his strategic thinking, execution capabilities, and commitment to innovation, he continues to drive growth through a balanced approach to technology, media, and real estate development while focusing on long-term value creation.",
  history: DEFAULT_COMPANY_HISTORY,
};

const PROJECTS = [
  {
    title: "Quality Home's Palacio",
    type: "apartment",
    category: "apartments",
    location: "Manikonda, Hyderabad",
    image: "/projects/profile/palacio.jpg",
    description: "Premium residential apartments by Quality Home Group at Manikonda.",
    status: "completed",
    featured: true,
  },
  {
    title: "Quality Home's Alpino",
    type: "apartment",
    category: "apartments",
    location: "Thirumala Hills, Manikonda",
    image: "/projects/profile/alpino.jpg",
    description: "Luxury apartment living at Thirumala Hills, Manikonda.",
    status: "completed",
    featured: true,
  },
  {
    title: "Gagan Vihar",
    type: "apartment",
    category: "apartments",
    location: "Tanashanagar OU Colony, Road No. 1",
    image: "/projects/profile/gagan-vihar.jpg",
    description: "Residential development at Tanashanagar OU Colony, Road No. 1.",
    status: "completed",
    featured: false,
  },
  {
    title: "Jathin Palace",
    type: "commercial",
    category: "commercial",
    location: "Alkapoor, Road No. 9",
    image: "/projects/profile/jathin-palace.jpg",
    description: "Commercial building project at Alkapoor, Road No. 9.",
    status: "completed",
    featured: false,
  },
  {
    title: "Quality Home's Avinya Avenue",
    type: "plot",
    category: "plots",
    location: "Kandi, Hyderabad",
    image: "/projects/profile/avinya-avenue.jpg",
    description: "3.55 acres HMDA-approved open plots at Kandi.",
    status: "completed",
    featured: true,
  },
  {
    title: "Quality Home's The Valley",
    type: "plot",
    category: "plots",
    location: "Kaulampet",
    image: "/projects/profile/the-valley.jpg",
    description: "3 acres HMDA-approved open plots at Kaulampet.",
    status: "completed",
    featured: false,
  },
  {
    title: "Prime Avenue",
    type: "plot",
    category: "plots",
    location: "Chitkul, Patancheru",
    image: "/projects/profile/prime-avenue.jpg",
    description: "28 acres HMDA-approved open plots at Chitkul, Patancheru.",
    status: "completed",
    featured: true,
  },
  {
    title: "Iconic City",
    type: "plot",
    category: "plots",
    location: "Rudraram (Kandi IIT, Mumbai Highway)",
    image: "/projects/profile/iconic-city.jpg",
    description: "13 acres of HMDA-proposed open plots at Rudraram, on the Kandi IIT Mumbai Highway.",
    status: "ongoing",
    featured: true,
  },
];

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getPage(slug: string) {
  const result = await query(`SELECT data FROM pages WHERE slug = $1`, [slug]);
  return ((result.rows[0]?.data as Record<string, unknown>) ?? {}) as Record<string, any>;
}

async function savePage(slug: string, data: Record<string, unknown>) {
  await query(
    `INSERT INTO pages (slug, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [slug, JSON.stringify(data)],
  );
}

async function main() {
  const about = await getPage("about");
  await savePage("about", {
    ...about,
    ...ABOUT,
    heroImage: about.heroImage || "",
    missionIcon: about.missionIcon || "",
    visionIcon: about.visionIcon || "",
    teamMembers: Array.isArray(about.teamMembers) ? about.teamMembers : [],
  });
  console.log("updated about page");

  const homeAbout = await getPage("home-about");
  await savePage("home-about", {
    ...DEFAULT_HOME_ABOUT,
    ...homeAbout,
    eyebrow: DEFAULT_HOME_ABOUT.eyebrow,
    heading: DEFAULT_HOME_ABOUT.heading,
    paragraph1: DEFAULT_HOME_ABOUT.paragraph1,
    paragraph2: DEFAULT_HOME_ABOUT.paragraph2,
    image: homeAbout.image || DEFAULT_HOME_ABOUT.image,
    propertyTypes: homeAbout.propertyTypes || DEFAULT_HOME_ABOUT.propertyTypes,
  });
  console.log("updated home-about");

  const whyUs = await getPage("home-why-us");
  await savePage("home-why-us", {
    ...whyUs,
    eyebrow: whyUs.eyebrow || "Why Choose Us",
    title: "Why Quality Home Group",
    description:
      "Homes built better, safer, and smarter — with quality construction, innovative solutions, new technology, and transparent transactions.",
  });
  console.log("updated home-why-us");

  await savePage("home-projects", {
    ...(await getPage("home-projects")),
    title: "Our Projects",
    subtitle: "Apartments, commercial spaces, and HMDA-approved plots across Hyderabad.",
  });

  const slides = await query(`SELECT id, headline FROM hero_slides ORDER BY sort_order ASC`);
  if (slides.rows[0]) {
    await query(
      `UPDATE hero_slides SET headline = $1, subheadline = $2, updated_at = NOW() WHERE id = $3`,
      [
        "Building Homes That Are Better, Safer, Smarter",
        "Quality construction, innovative solutions, and transparent transactions.",
        slides.rows[0].id,
      ],
    );
  }
  if (slides.rows[1]) {
    await query(
      `UPDATE hero_slides SET headline = $1, subheadline = $2, updated_at = NOW() WHERE id = $3`,
      [
        "A Higher Quality of Living",
        "Premium apartments, villas, commercial spaces, and plotted developments.",
        slides.rows[1].id,
      ],
    );
  }
  console.log("updated hero slides");

  await query(`DELETE FROM projects`);
  for (const p of PROJECTS) {
    const result = await query(
      `INSERT INTO projects (title, type, location, image, description, category, status, price, featured, slug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [p.title, p.type, p.location, p.image, p.description, p.category, p.status, "", p.featured, slugify(p.title)],
    );
    const id = String(result.rows[0].id);
    await query(`UPDATE projects SET slug = $1 WHERE id = $2`, [`${slugify(p.title)}-${id.slice(0, 8)}`, id]);
    console.log("created", p.title);
  }

  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
