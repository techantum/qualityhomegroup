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

type DetailsSeed = {
  title: string;
  tagline: string;
  about: string;
  highlights: string[];
  stats: Record<string, string>;
  nearbyPlaces: { name: string; distance: string; type: string }[];
  specifications: { category: string; items: string[] }[];
  amenities: string[];
};

const DETAILS: DetailsSeed[] = [
  {
    title: "Quality Home's Palacio",
    tagline: "Premium apartment living in Manikonda",
    about:
      "Quality Home's Palacio is a completed residential apartment project at Manikonda, Hyderabad.\n\nThe development is designed for families who want quality construction, a well-connected address, and a better, safer, smarter way of living — close to Gachibowli and the Financial District.\n\nFull unit plans, pricing, and amenity photographs can be updated from the CMS. Enquire with our team for current availability.",
    highlights: [
      "Completed residential apartments",
      "Manikonda address with strong connectivity",
      "Quality construction by Quality Home Group",
      "Close to Gachibowli and Financial District",
      "Designed for comfortable family living",
      "Transparent documentation and handover",
    ],
    stats: {
      totalLandArea: "To be updated",
      noOfBlocks: "To be updated",
      totalUnits: "To be updated",
      configuration: "Residential apartments",
      floors: "To be updated",
      possessionStarts: "Completed",
    },
    nearbyPlaces: [
      { name: "Gachibowli", distance: "Nearby", type: "it" },
      { name: "Financial District", distance: "Nearby", type: "it" },
      { name: "Outer Ring Road", distance: "Connected", type: "connect" },
      { name: "ISB Hyderabad", distance: "Nearby", type: "education" },
      { name: "Hospitals & clinics", distance: "Catchment", type: "hospital" },
      { name: "Schools & daily retail", distance: "Nearby", type: "education" },
    ],
    specifications: [
      { category: "Structure", items: ["RCC framed structure", "Quality masonry and plastering", "Designed for durability"] },
      { category: "Living", items: ["Thoughtful apartment layouts", "Ventilation and natural light", "Family-friendly common areas"] },
    ],
    amenities: ["Clubhouse", "Landscaped gardens", "Children's play area", "24/7 security", "Power backup", "Covered parking"],
  },
  {
    title: "Quality Home's Alpino",
    tagline: "Luxury apartments at Thirumala Hills",
    about:
      "Quality Home's Alpino is a completed apartment development at Thirumala Hills, Manikonda.\n\nThe project offers premium residential living in one of Hyderabad's established neighbourhoods, with quality construction and a location that stays close to work, schools, and city conveniences.\n\nUnit mix, floor plans, and brochure details can be added from the CMS.",
    highlights: [
      "Luxury apartment living",
      "Thirumala Hills, Manikonda",
      "Completed Quality Home Group project",
      "Strong west Hyderabad connectivity",
      "Quality construction and finishes",
      "Transparent transactions",
    ],
    stats: {
      totalLandArea: "To be updated",
      noOfBlocks: "To be updated",
      totalUnits: "To be updated",
      configuration: "Luxury apartments",
      floors: "To be updated",
      possessionStarts: "Completed",
    },
    nearbyPlaces: [
      { name: "Manikonda", distance: "Local", type: "connect" },
      { name: "Gachibowli", distance: "Nearby", type: "it" },
      { name: "Financial District", distance: "Nearby", type: "it" },
      { name: "Outer Ring Road", distance: "Connected", type: "connect" },
      { name: "Schools & colleges", distance: "Catchment", type: "education" },
      { name: "Hospitals", distance: "Catchment", type: "hospital" },
    ],
    specifications: [
      { category: "Structure", items: ["RCC framed structure", "Quality external finishes", "Designed for lasting value"] },
      { category: "Interiors", items: ["Premium apartment layouts", "Quality flooring and fittings", "Well-ventilated rooms"] },
    ],
    amenities: ["Gymnasium", "Landscaped gardens", "Children's play area", "24/7 security", "Power backup", "Parking"],
  },
  {
    title: "Gagan Vihar",
    tagline: "Residential apartments at OU Colony",
    about:
      "Gagan Vihar is a completed residential development at Tanashanagar OU Colony, Road No. 1.\n\nThe project reflects Quality Home Group's focus on practical, well-built homes in established Hyderabad neighbourhoods.\n\nDetailed specifications and gallery images can be updated from the CMS.",
    highlights: [
      "Completed residential apartments",
      "Tanashanagar OU Colony, Road No. 1",
      "Quality Home Group construction",
      "Neighbourhood living with city access",
      "Designed for everyday comfort",
      "Transparent handover process",
    ],
    stats: {
      totalLandArea: "To be updated",
      noOfBlocks: "To be updated",
      totalUnits: "To be updated",
      configuration: "Residential apartments",
      floors: "To be updated",
      possessionStarts: "Completed",
    },
    nearbyPlaces: [
      { name: "OU Colony", distance: "Local", type: "connect" },
      { name: "Osmania University area", distance: "Nearby", type: "education" },
      { name: "City arterial roads", distance: "Connected", type: "connect" },
      { name: "Local markets", distance: "Nearby", type: "connect" },
      { name: "Schools", distance: "Catchment", type: "education" },
      { name: "Hospitals", distance: "Catchment", type: "hospital" },
    ],
    specifications: [
      { category: "Structure", items: ["RCC framed structure", "Quality masonry", "Durable common areas"] },
      { category: "Living", items: ["Practical apartment layouts", "Natural light and ventilation", "Family-oriented planning"] },
    ],
    amenities: ["Security", "Parking", "Lift", "Power backup", "Water supply", "Common areas"],
  },
  {
    title: "Jathin Palace",
    tagline: "Commercial building at Alkapoor",
    about:
      "Jathin Palace is a completed commercial building at Alkapoor, Road No. 9.\n\nThe project is planned for business visibility, access, and quality construction — suitable for retail or office use.\n\nFloor-wise details, unit sizes, and brochure content can be added from the CMS.",
    highlights: [
      "Completed commercial building",
      "Alkapoor, Road No. 9",
      "Designed for business visibility",
      "Quality construction",
      "Parking and utility planning",
      "Transparent transactions",
    ],
    stats: {
      totalLandArea: "To be updated",
      noOfBlocks: "Commercial block",
      totalUnits: "To be updated",
      configuration: "Retail / office",
      floors: "To be updated",
      possessionStarts: "Completed",
    },
    nearbyPlaces: [
      { name: "Alkapoor Township", distance: "Local", type: "connect" },
      { name: "Outer Ring Road", distance: "Connected", type: "connect" },
      { name: "Gachibowli", distance: "Nearby", type: "it" },
      { name: "Manikonda", distance: "Nearby", type: "connect" },
      { name: "Retail catchment", distance: "Local", type: "it" },
      { name: "Hospitals & schools", distance: "Catchment", type: "hospital" },
    ],
    specifications: [
      { category: "Building", items: ["RCC framed structure", "Quality external finishes", "Service and utility planning"] },
      { category: "Business use", items: ["High-visibility frontage", "Parking provision", "Suitable for retail or office"] },
    ],
    amenities: ["Lift", "Power backup", "Parking", "Security", "Fire safety", "Utility services"],
  },
  {
    title: "Quality Home's Avinya Avenue",
    tagline: "HMDA-approved open plots at Kandi",
    about:
      "Quality Home's Avinya Avenue is a completed plotted development spread across 3.55 acres of HMDA-approved open plots at Kandi.\n\nThe layout is planned for families and investors looking at west Hyderabad's growth corridor, with Quality Home Group's emphasis on clear process and quality development.\n\nPlot sizes, layout plan, and brochure can be updated from the CMS.",
    highlights: [
      "3.55 acres plotted development",
      "HMDA-approved open plots",
      "Kandi growth corridor",
      "Gated layout planning",
      "Clear documentation",
      "Completed Quality Home Group project",
    ],
    stats: {
      totalLandArea: "3.55 acres",
      noOfBlocks: "Plotted layout",
      totalUnits: "Open plots",
      configuration: "HMDA-approved plots",
      floors: "—",
      possessionStarts: "Completed",
    },
    nearbyPlaces: [
      { name: "Kandi", distance: "Local", type: "connect" },
      { name: "Mumbai Highway (NH-65)", distance: "Nearby", type: "connect" },
      { name: "IIT Hyderabad", distance: "Nearby", type: "education" },
      { name: "Outer Ring Road", distance: "Connected", type: "connect" },
      { name: "Patancheru", distance: "Nearby", type: "connect" },
      { name: "Isnapur Industrial Area", distance: "Nearby", type: "it" },
    ],
    specifications: [
      { category: "Layout", items: ["Planned internal roads", "Open spaces as per layout", "Gated plotted community"] },
      { category: "Approvals", items: ["HMDA-approved open plots", "Clear title documentation", "Transparent registration process"] },
    ],
    amenities: ["Gated community", "Wide roads", "Avenue plantation", "Drainage", "Street lighting", "Park / open space"],
  },
  {
    title: "Quality Home's The Valley",
    tagline: "HMDA-approved open plots at Kaulampet",
    about:
      "Quality Home's The Valley is a completed 3-acre HMDA-approved open plot development at Kaulampet.\n\nThe project offers a compact plotted community in a growing west Hyderabad catchment, with Quality Home Group's focus on better planning and transparent transactions.\n\nLayout drawings and plot availability can be updated from the CMS.",
    highlights: [
      "3 acres plotted development",
      "HMDA-approved open plots",
      "Kaulampet location",
      "Planned layout and roads",
      "Clear documentation",
      "Completed project",
    ],
    stats: {
      totalLandArea: "3 acres",
      noOfBlocks: "Plotted layout",
      totalUnits: "Open plots",
      configuration: "HMDA-approved plots",
      floors: "—",
      possessionStarts: "Completed",
    },
    nearbyPlaces: [
      { name: "Kaulampet", distance: "Local", type: "connect" },
      { name: "Mumbai Highway (NH-65)", distance: "Nearby", type: "connect" },
      { name: "Kandi / IIT catchment", distance: "Nearby", type: "education" },
      { name: "Outer Ring Road", distance: "Connected", type: "connect" },
      { name: "Patancheru", distance: "Nearby", type: "connect" },
      { name: "Local amenities", distance: "Catchment", type: "hospital" },
    ],
    specifications: [
      { category: "Layout", items: ["Planned internal roads", "Open spaces as per layout", "Residential plotted community"] },
      { category: "Approvals", items: ["HMDA-approved open plots", "Clear title documentation", "Transparent process"] },
    ],
    amenities: ["Gated community", "Wide roads", "Avenue plantation", "Drainage", "Street lighting", "Park / open space"],
  },
  {
    title: "Prime Avenue",
    tagline: "28 acres of HMDA-approved plots at Chitkul",
    about:
      "Prime Avenue is a completed 28-acre HMDA-approved open plot development at Chitkul, Patancheru.\n\nThe scale of the layout makes it suited to families and investors looking at west Hyderabad, with planned roads and Quality Home Group's development approach.\n\nPlot inventory, layout plan, and brochure details can be added from the CMS.",
    highlights: [
      "28 acres plotted development",
      "HMDA-approved open plots",
      "Chitkul, Patancheru",
      "Large planned layout",
      "West Hyderabad growth corridor",
      "Completed Quality Home Group project",
    ],
    stats: {
      totalLandArea: "28 acres",
      noOfBlocks: "Plotted layout",
      totalUnits: "Open plots",
      configuration: "HMDA-approved plots",
      floors: "—",
      possessionStarts: "Completed",
    },
    nearbyPlaces: [
      { name: "Chitkul", distance: "Local", type: "connect" },
      { name: "Patancheru", distance: "Nearby", type: "connect" },
      { name: "Mumbai Highway (NH-65)", distance: "Nearby", type: "connect" },
      { name: "Outer Ring Road", distance: "Connected", type: "connect" },
      { name: "IIT Hyderabad", distance: "Nearby", type: "education" },
      { name: "Industrial & IT catchment", distance: "Nearby", type: "it" },
    ],
    specifications: [
      { category: "Layout", items: ["Large planned plotted layout", "Internal roads and open spaces", "Gated community planning"] },
      { category: "Approvals", items: ["HMDA-approved open plots", "Clear documentation", "Transparent registration"] },
    ],
    amenities: ["Gated community", "Wide roads", "Avenue plantation", "Drainage", "Street lighting", "Parks / open spaces"],
  },
  {
    title: "Iconic City",
    tagline: "HMDA-proposed plots on the Kandi IIT Mumbai Highway",
    about:
      "Iconic City is an ongoing 13-acre HMDA-proposed open plot development at Rudraram, on the Kandi IIT Mumbai Highway.\n\nThe location sits on a key west Hyderabad corridor, close to IIT Hyderabad and the Mumbai Highway, making it a growth-oriented plotted community.\n\nLayout, plot sizes, and launch details can be updated from the CMS as the project progresses.",
    highlights: [
      "13 acres plotted development",
      "HMDA-proposed open plots",
      "Rudraram, Kandi IIT Mumbai Highway",
      "Ongoing Quality Home Group project",
      "Close to IIT Hyderabad catchment",
      "Designed for long-term value",
    ],
    stats: {
      totalLandArea: "13 acres",
      noOfBlocks: "Plotted layout",
      totalUnits: "Open plots",
      configuration: "HMDA-proposed plots",
      floors: "—",
      possessionStarts: "Ongoing",
    },
    nearbyPlaces: [
      { name: "Rudraram", distance: "Local", type: "connect" },
      { name: "Kandi IIT Mumbai Highway", distance: "On corridor", type: "connect" },
      { name: "IIT Hyderabad", distance: "Nearby", type: "education" },
      { name: "Kandi", distance: "Nearby", type: "connect" },
      { name: "Outer Ring Road", distance: "Connected", type: "connect" },
      { name: "Patancheru", distance: "Nearby", type: "connect" },
    ],
    specifications: [
      { category: "Layout", items: ["Planned plotted layout", "Highway-corridor location", "Open spaces as per plan"] },
      { category: "Approvals", items: ["HMDA-proposed open plots", "Documentation as applicable", "Transparent sales process"] },
    ],
    amenities: ["Gated community", "Wide roads", "Avenue plantation", "Drainage", "Street lighting", "Park / open space"],
  },
];

async function main() {
  const result = await query(`SELECT id, title, image, location FROM projects ORDER BY created_at ASC`);
  if (!result.rows.length) {
    throw new Error("No projects found. Create the profile projects first.");
  }

  for (const row of result.rows) {
    const seed = DETAILS.find((item) => item.title === row.title);
    if (!seed) {
      console.log("no seed match for", row.title);
      continue;
    }

    const existing = await query(`SELECT data FROM property_details WHERE project_id = $1`, [row.id]);
    const existingAbout = (existing.rows[0]?.data as { about?: string } | undefined)?.about;
    if (existingAbout && existingAbout.trim().length > 80 && !existingAbout.includes("will be updated")) {
      console.log("keeping existing details for", row.title);
      continue;
    }

    const payload = {
      projectId: row.id,
      tagline: seed.tagline,
      price: "",
      priceLabel: "Price on request",
      heroImage: row.image || "",
      about: seed.about,
      reraNumber: "",
      videoUrl: "",
      brochureUrl: "",
      walkthroughVideoUrl: "",
      galleryImages: row.image ? [row.image] : [],
      floorPlans: [],
      highlights: seed.highlights,
      stats: seed.stats,
      specifications: seed.specifications,
      location: {
        address: row.location,
        mapUrl: "",
        nearbyPlaces: seed.nearbyPlaces,
      },
    };

    await query(
      `INSERT INTO property_details (project_id, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (project_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [row.id, JSON.stringify(payload)],
    );

    const amenityCount = await query(`SELECT COUNT(*)::int AS count FROM property_amenities WHERE property_id = $1`, [row.id]);
    if (Number(amenityCount.rows[0]?.count || 0) === 0) {
      for (const [index, name] of seed.amenities.entries()) {
        await query(
          `INSERT INTO property_amenities (property_id, name, image, gallery_images, sort_order)
           VALUES ($1, $2, '', '[]'::jsonb, $3)`,
          [row.id, name, index],
        );
      }
    }

    console.log("seeded details for", row.title);
  }

  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
