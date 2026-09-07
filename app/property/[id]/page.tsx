import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyDetailView } from "@/components/property-detail-view";
import {
  adminGetProjectById,
  adminGetProjectBySlug,
  adminGetProjects,
  adminGetPropertyAmenities,
  adminGetPropertyDetails,
  type ProjectItem,
} from "@/lib/firestore-admin";
import { mergePropertyDetails, type ProjectPageItem } from "@/lib/project-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadProject(idOrSlug: string): Promise<ProjectItem | null> {
  const byId = await adminGetProjectById(idOrSlug);
  if (byId) return byId;
  return adminGetProjectBySlug(idOrSlug);
}

function toCard(project: ProjectItem): ProjectPageItem {
  return {
    id: project.id,
    title: project.title,
    type: project.type,
    location: project.location,
    image: project.image,
    description: project.description,
    category: project.category,
    status: project.status,
    price: project.price,
    slug: project.slug,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await loadProject(id);
  if (!project) {
    return { title: "Project | Quality Home Group" };
  }
  return {
    title: `${project.title} | Quality Home Group`,
    description: project.description || `Explore ${project.title} at ${project.location}.`,
    openGraph: {
      title: `${project.title} | Quality Home Group`,
      description: project.description || `Explore ${project.title} at ${project.location}.`,
      images: project.image ? [{ url: project.image }] : [],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await loadProject(id);
  if (!project) notFound();

  const [rawDetails, amenities, allProjects] = await Promise.all([
    adminGetPropertyDetails(project.id),
    adminGetPropertyAmenities(project.id),
    adminGetProjects(),
  ]);
  const details = mergePropertyDetails(project as unknown as Record<string, unknown>, rawDetails);

  const related = allProjects
    .filter((item) => item.id !== project.id)
    .filter((item) => {
      const sameCategory = item.category && project.category && item.category === project.category;
      const sameType = item.type && project.type && item.type === project.type;
      return sameCategory || sameType;
    })
    .slice(0, 3)
    .map(toCard);

  return (
    <PropertyDetailView
      project={toCard(project)}
      propertyDetails={details}
      amenities={amenities as { id?: string; name: string; image?: string | null; galleryImages?: string[] }[]}
      related={related}
    />
  );
}
