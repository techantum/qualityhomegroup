/**
 * POST /api/v1/seed/projects - Seed 5 sample projects (admin only).
 * Call with: Authorization: Bearer <firebase-id-token>
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiInternalError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/api/logger";
import { adminAddProject } from "@/lib/firestore-admin";

const SEED_PROJECTS = [
  {
    title: "Quality Home Group Skyline Towers",
    type: "apartment",
    location: "Narsingi, Hyderabad",
    image: "https://placehold.co/800x600/1F2A54/ffffff?text=Skyline+Towers",
    description: "Luxury high-rise apartments with premium amenities and panoramic city views.",
    category: "apartments",
    status: "ongoing" as const,
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
    status: "upcoming" as const,
    price: "3.5 Cr onwards",
    featured: true,
  },
  {
    title: "Quality Home Group Tech Park",
    type: "commercial",
    location: "Madhapur, Hyderabad",
    image: "https://placehold.co/800x600/4a5568/ffffff?text=Tech+Park",
    description: "Grade-A commercial spaces for offices and retail in the heart of the IT corridor.",
    category: "commercial",
    status: "completed" as const,
    price: "On request",
    featured: false,
  },
  {
    title: "Serenity Plots",
    type: "plot",
    location: "Shamirpet, Hyderabad",
    image: "https://placehold.co/800x600/744210/ffffff?text=Serenity+Plots",
    description: "Residential plots with clear titles, ready for your dream home construction.",
    category: "plots",
    status: "ongoing" as const,
    price: "45 L onwards",
    featured: false,
  },
  {
    title: "Quality Home Group Heights",
    type: "apartment",
    location: "Kokapet, Hyderabad",
    image: "https://placehold.co/800x600/1F2A54/ffffff?text=Quality+Heights",
    description: "Modern apartments with smart home features and community amenities.",
    category: "apartments",
    status: "upcoming" as const,
    price: "95 L onwards",
    featured: true,
  },
];

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    return NextResponse.json(
      { error: "Seed is disabled in production. Set ALLOW_SEED=true only for intentional maintenance." },
      { status: 403 }
    );
  }

  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const ids: string[] = [];
    for (const project of SEED_PROJECTS) {
      const id = await adminAddProject(project);
      ids.push(id);
    }
    logAdminAction("seed.projects", auth.user.id, { count: 5, ids });
    return NextResponse.json({ data: { created: 5, ids } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message.includes("not configured") || message.includes("Firestore admin")) {
      return NextResponse.json(
        { error: "Firebase Admin not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env" },
        { status: 500 }
      );
    }
    return apiInternalError(err);
  }
}
