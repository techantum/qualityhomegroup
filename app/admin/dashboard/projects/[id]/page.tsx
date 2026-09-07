"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";
import {
  getProjectById,
  getPropertyAmenities,
  getPropertyDetails,
  type Project,
  type PropertyAmenity,
  type PropertyDetails,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  ImageIcon,
  Save,
} from "lucide-react";
import { ImageUpload, MultiImageUpload } from "@/components/admin/image-upload";
import { PdfUpload } from "@/components/admin/pdf-upload";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function ProjectDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [amenities, setAmenities] = useState<PropertyAmenity[]>([]);
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [projectBasics, setProjectBasics] = useState({
    title: "",
    type: "",
    categoryId: "",
    category: "",
    location: "",
    description: "",
    status: "ongoing",
    featured: false,
  });
  
  // Amenity Dialog
  const [amenityDialogOpen, setAmenityDialogOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<PropertyAmenity | null>(null);
  const [amenityForm, setAmenityForm] = useState({
    name: "",
    image: "",
    galleryImages: ["", "", ""],
  });

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAmenity, setDeletingAmenity] = useState<PropertyAmenity | null>(null);

  // Property Details Form
  const [detailsForm, setDetailsForm] = useState({
    tagline: "",
    price: "",
    priceLabel: "Price:",
    heroImage: "",
    aboutImage: "",
    about: "",
    reraNumber: "",
    videoUrl: "",
    walkthroughVideoUrl: "",
    brochureUrl: "",
    totalLandArea: "",
    noOfBlocks: "",
    totalUnits: "",
    configuration: "",
    floors: "",
    possessionStarts: "",
    locationAddress: "",
    mapUrl: "",
    locationImage: "",
    galleryImages: [] as string[],
    floorPlans: [] as { name: string; image: string }[],
    specifications: [] as { category: string; items: string[] }[],
    nearbyPlaces: [] as { name: string; distance: string; type: string }[],
    highlights: [] as string[],
  });
  const detailsFormRef = useRef(detailsForm);
  detailsFormRef.current = detailsForm;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && projectId) {
      loadData();
    }
  }, [user, projectId]);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    async function fetchCategories() {
      try {
        const res = await adminApiFetch(currentUser, "/api/v1/categories");
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          setCategories(json.data ?? []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, [user]);

  useEffect(() => {
    if (!categories.length || projectBasics.categoryId) return;
    const match = categories.find(
      (c) =>
        c.id === projectBasics.categoryId ||
        c.slug === projectBasics.category ||
        c.name === projectBasics.type ||
        c.slug === (projectBasics.type || "").toLowerCase()
    );
    if (match) {
      setProjectBasics((prev) => ({
        ...prev,
        categoryId: match.id,
        category: match.slug,
        type: match.name,
      }));
    }
  }, [categories, projectBasics.categoryId, projectBasics.category, projectBasics.type]);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/v1/projects/public/${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      const apiData = json?.data;
      const projectData = apiData?.project;
      const detailsData = apiData?.propertyDetails;
      const amenitiesData = Array.isArray(apiData?.propertyAmenities) ? apiData.propertyAmenities : [];

      if (projectData) {
        setProject(projectData as Project);
        setProjectBasics({
          title: projectData.title ?? "",
          type: projectData.type ?? "",
          categoryId: projectData.categoryId ?? "",
          category: projectData.category ?? "",
          location: projectData.location ?? "",
          description: projectData.description ?? "",
          status: projectData.status ?? "ongoing",
          featured: Boolean(projectData.featured),
        });
      } else {
        const p = await getProjectById(projectId);
        setProject(p);
      }
      setAmenities(amenitiesData as PropertyAmenity[]);
      setPropertyDetails(detailsData as PropertyDetails | null);

      if (detailsData) {
        const loc = detailsData.location as { address?: string; mapUrl?: string; image?: string; nearbyPlaces?: { name: string; distance: string; type: string }[] } | undefined;
        const specs = Array.isArray(detailsData.specifications) ? detailsData.specifications : [];
        const floorPlans = Array.isArray((detailsData as Record<string, unknown>).floorPlans)
          ? ((detailsData as Record<string, unknown>).floorPlans as { name?: string; image?: string }[]).map((p) => ({ name: p?.name ?? "", image: p?.image ?? "" }))
          : [];
        const galleryImages = Array.isArray((detailsData as Record<string, unknown>).galleryImages) ? ((detailsData as Record<string, unknown>).galleryImages as string[]) : [];
        const walkthroughVideoUrl = (detailsData as Record<string, unknown>).walkthroughVideoUrl as string | undefined;
        const highlights = Array.isArray((detailsData as Record<string, unknown>).highlights)
          ? ((detailsData as Record<string, unknown>).highlights as unknown[]).map((item) => String(item || "").trim()).filter(Boolean)
          : [];
        setDetailsForm({
          tagline: detailsData.tagline || "",
          price: detailsData.price || "",
          priceLabel: detailsData.priceLabel || "Price:",
          heroImage: detailsData.heroImage || "",
          aboutImage: String((detailsData as Record<string, unknown>).aboutImage ?? ""),
          about: detailsData.about || "",
          reraNumber: detailsData.reraNumber || "",
          videoUrl: detailsData.videoUrl || "",
          walkthroughVideoUrl: walkthroughVideoUrl || "",
          brochureUrl: detailsData.brochureUrl || "",
          totalLandArea: detailsData.stats?.totalLandArea || "",
          noOfBlocks: detailsData.stats?.noOfBlocks || "",
          totalUnits: detailsData.stats?.totalUnits || "",
          configuration: detailsData.stats?.configuration || "",
          floors: detailsData.stats?.floors || "",
          possessionStarts: detailsData.stats?.possessionStarts || "",
          locationAddress: loc?.address || "",
          mapUrl: loc?.mapUrl || "",
          locationImage: loc?.image || String((detailsData as Record<string, unknown>).locationImage ?? ""),
          galleryImages,
          floorPlans,
          specifications: specs.map((s: { category?: string; items?: string[] }) => ({ category: s?.category ?? "", items: Array.isArray(s?.items) ? s.items : [] })),
          nearbyPlaces: loc?.nearbyPlaces ?? [],
          highlights,
        });
      }
      if (!projectData) {
        const p = await getProjectById(projectId);
        if (p) {
          setProject(p);
          setProjectBasics({
            title: p.title ?? "",
            type: p.type ?? "",
            categoryId: p.categoryId ?? "",
            category: p.category ?? "",
            location: p.location ?? "",
            description: p.description ?? "",
            status: p.status ?? "ongoing",
            featured: Boolean(p.featured),
          });
        }
      }
      if (!detailsData && (projectData || project)) {
        const idForDetails = (projectData ?? project)?.id ?? projectId;
        const d = await getPropertyDetails(idForDetails);
        if (d) {
          setPropertyDetails(d);
          const loc = d.location as { address?: string; mapUrl?: string; image?: string; nearbyPlaces?: { name: string; distance: string; type: string }[] } | undefined;
          const specs = Array.isArray(d.specifications) ? d.specifications : [];
          const floorPlans = Array.isArray((d as Record<string, unknown>).floorPlans) ? ((d as Record<string, unknown>).floorPlans as { name?: string; image?: string }[]).map((p) => ({ name: p?.name ?? "", image: p?.image ?? "" })) : [];
          const galleryImages = Array.isArray((d as Record<string, unknown>).galleryImages) ? ((d as Record<string, unknown>).galleryImages as string[]) : [];
          const walkthroughVideoUrl = (d as Record<string, unknown>).walkthroughVideoUrl as string | undefined;
          const highlights = Array.isArray((d as Record<string, unknown>).highlights)
            ? ((d as Record<string, unknown>).highlights as unknown[]).map((item) => String(item || "").trim()).filter(Boolean)
            : [];
          setDetailsForm({
            tagline: d.tagline || "", price: d.price || "", priceLabel: d.priceLabel || "Price:", heroImage: d.heroImage || "", aboutImage: String((d as Record<string, unknown>).aboutImage ?? ""), about: d.about || "", reraNumber: d.reraNumber || "", videoUrl: d.videoUrl || "", walkthroughVideoUrl: walkthroughVideoUrl || "", brochureUrl: d.brochureUrl || "",
            totalLandArea: d.stats?.totalLandArea || "", noOfBlocks: d.stats?.noOfBlocks || "", totalUnits: d.stats?.totalUnits || "", configuration: d.stats?.configuration || "", floors: d.stats?.floors || "", possessionStarts: d.stats?.possessionStarts || "",
            locationAddress: loc?.address || "", mapUrl: loc?.mapUrl || "", locationImage: loc?.image || String((d as Record<string, unknown>).locationImage ?? ""), galleryImages, floorPlans,
            specifications: specs.map((s: { category?: string; items?: string[] }) => ({ category: s?.category ?? "", items: Array.isArray(s?.items) ? s.items : [] })), nearbyPlaces: loc?.nearbyPlaces ?? [],
            highlights,
          });
        }
      }
      if (amenitiesData.length === 0 && (projectData || project)) {
        const idForAmenities = (projectData ?? project)?.id ?? projectId;
        const a = await getPropertyAmenities(idForAmenities);
        if (a?.length) setAmenities(a);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAmenityDialog = (amenity?: PropertyAmenity) => {
    if (amenity) {
      setEditingAmenity(amenity);
      setAmenityForm({
        name: amenity.name,
        image: amenity.image,
        galleryImages: amenity.galleryImages.length >= 3 
          ? amenity.galleryImages.slice(0, 3)
          : [...amenity.galleryImages, ...Array(3 - amenity.galleryImages.length).fill("")],
      });
    } else {
      setEditingAmenity(null);
      setAmenityForm({
        name: "",
        image: "",
        galleryImages: ["", "", ""],
      });
    }
    setAmenityDialogOpen(true);
  };

  const persistGallery = async (urls: string[]) => {
    if (!user) return;
    const id = project?.id ?? projectId;
    if (!id) return;
    try {
      const res = await adminApiFetch(user, `/api/v1/projects/${encodeURIComponent(id)}/details`, {
        method: "PATCH",
        body: JSON.stringify({ galleryImages: urls.filter((url) => String(url || "").trim()) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Gallery save failed (${res.status})`);
    } catch (error) {
      console.error("Error saving gallery:", error);
      alert(error instanceof Error ? error.message : "Failed to save gallery images.");
    }
  };

  const handleSaveAmenity = async () => {
    if (!user) {
      alert("You must be logged in to save.");
      return;
    }
    const idForAmenities = project?.id ?? projectId;
    setSaving(true);
    try {
      const amenityData = {
        propertyId: idForAmenities,
        name: amenityForm.name,
        image: amenityForm.image,
        galleryImages: amenityForm.galleryImages.filter(img => img.trim() !== ""),
        order: editingAmenity?.order ?? amenities.length,
      };

      const url = editingAmenity?.id
        ? `/api/v1/projects/${encodeURIComponent(idForAmenities)}/amenities/${encodeURIComponent(editingAmenity.id)}`
        : `/api/v1/projects/${encodeURIComponent(idForAmenities)}/amenities`;
      const res = await adminApiFetch(user, url, {
        method: editingAmenity?.id ? "PUT" : "POST",
        body: JSON.stringify(amenityData),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      await loadData();
      setAmenityDialogOpen(false);
    } catch (error) {
      console.error("Error saving amenity:", error);
      alert(error instanceof Error ? error.message : "Failed to save amenity.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAmenity = async () => {
    if (!deletingAmenity?.id || !user) return;
    const idForAmenities = project?.id ?? projectId;
    setSaving(true);
    try {
      const res = await adminApiFetch(
        user,
        `/api/v1/projects/${encodeURIComponent(idForAmenities)}/amenities/${encodeURIComponent(deletingAmenity.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? `Delete failed (${res.status})`);
      }
      await loadData();
      setDeleteDialogOpen(false);
      setDeletingAmenity(null);
    } catch (error) {
      console.error("Error deleting amenity:", error);
      alert(error instanceof Error ? error.message : "Failed to delete amenity.");
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) {
      setProjectBasics((prev) => ({
        ...prev,
        categoryId: cat.id,
        category: cat.slug,
        type: cat.name,
      }));
    }
  };

  const handleSaveDetails = async () => {
    if (!user) {
      alert("You must be logged in to save.");
      return;
    }
    const detailsDocId = project?.id ?? projectId;
    if (!detailsDocId) {
      alert("Project not loaded yet. Please wait and try again.");
      return;
    }
    if (!projectBasics.title || !projectBasics.type || !projectBasics.location) {
      alert("Please fill in required fields: Project name, Type, and Location");
      return;
    }
    setSaving(true);
    try {
      const form = detailsFormRef.current;
      const projectRes = await adminApiFetch(user, `/api/v1/projects/${encodeURIComponent(detailsDocId)}?t=${Date.now()}`, {
        method: "PUT",
        body: JSON.stringify({
          title: projectBasics.title,
          type: projectBasics.type,
          location: projectBasics.location,
          description: projectBasics.description,
          categoryId: projectBasics.categoryId,
          category: projectBasics.category,
          status: projectBasics.status,
          featured: projectBasics.featured,
          price: form.price,
          image: form.heroImage,
        }),
        cache: "no-store",
      });
      const projectJson = await projectRes.json().catch(() => ({}));
      if (!projectRes.ok) throw new Error(projectJson?.error ?? `Project save failed (${projectRes.status})`);
      const updatedProject = projectJson?.data?.project;
      if (updatedProject) {
        setProject(updatedProject as Project);
      }

      const payload = {
        projectId: detailsDocId,
        tagline: form.tagline,
        price: form.price,
        priceLabel: form.priceLabel,
        heroImage: form.heroImage,
        aboutImage: form.aboutImage,
        about: form.about,
        reraNumber: form.reraNumber,
        videoUrl: form.videoUrl,
        brochureUrl: form.brochureUrl,
        walkthroughVideoUrl: form.walkthroughVideoUrl || "",
        galleryImages: form.galleryImages,
        floorPlans: form.floorPlans,
        specifications: form.specifications,
        highlights: form.highlights.map((item) => item.trim()).filter(Boolean),
        stats: {
          totalLandArea: form.totalLandArea,
          noOfBlocks: form.noOfBlocks,
          totalUnits: form.totalUnits,
          configuration: form.configuration,
          floors: form.floors,
          possessionStarts: form.possessionStarts,
        },
        location: {
          address: form.locationAddress,
          mapUrl: form.mapUrl,
          image: form.locationImage,
          nearbyPlaces: form.nearbyPlaces,
        },
        locationImage: form.locationImage,
      };
      const res = await adminApiFetch(user, `/api/v1/projects/${encodeURIComponent(detailsDocId)}/details`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      alert("Property details saved successfully.");
      const savedDetails = json?.data?.propertyDetails;
      if (savedDetails) {
        setPropertyDetails(savedDetails as PropertyDetails);
        const loc = (savedDetails as Record<string, unknown>).location as { address?: string; mapUrl?: string; image?: string; nearbyPlaces?: { name: string; distance: string; type: string }[] } | undefined;
        const specs = Array.isArray((savedDetails as Record<string, unknown>).specifications) ? (savedDetails as Record<string, unknown>).specifications as { category?: string; items?: string[] }[] : [];
        const floorPlans = Array.isArray((savedDetails as Record<string, unknown>).floorPlans) ? ((savedDetails as Record<string, unknown>).floorPlans as { name?: string; image?: string }[]).map((p) => ({ name: p?.name ?? "", image: p?.image ?? "" })) : [];
        const galleryImages = Array.isArray((savedDetails as Record<string, unknown>).galleryImages) ? ((savedDetails as Record<string, unknown>).galleryImages as string[]) : [];
        const walkthroughVideoUrl = ((savedDetails as Record<string, unknown>).walkthroughVideoUrl as string) ?? "";
        const stats = (savedDetails as Record<string, unknown>).stats as Record<string, string> | undefined;
        setDetailsForm({
          tagline: String((savedDetails as Record<string, unknown>).tagline ?? ""),
          price: String((savedDetails as Record<string, unknown>).price ?? ""),
          priceLabel: String((savedDetails as Record<string, unknown>).priceLabel ?? "Price:"),
          heroImage: String((savedDetails as Record<string, unknown>).heroImage ?? ""),
          aboutImage: String((savedDetails as Record<string, unknown>).aboutImage ?? ""),
          about: String((savedDetails as Record<string, unknown>).about ?? ""),
          reraNumber: String((savedDetails as Record<string, unknown>).reraNumber ?? ""),
          videoUrl: String((savedDetails as Record<string, unknown>).videoUrl ?? ""),
          walkthroughVideoUrl,
          brochureUrl: String((savedDetails as Record<string, unknown>).brochureUrl ?? ""),
          totalLandArea: stats?.totalLandArea ?? "",
          noOfBlocks: stats?.noOfBlocks ?? "",
          totalUnits: stats?.totalUnits ?? "",
          configuration: stats?.configuration ?? "",
          floors: stats?.floors ?? "",
          possessionStarts: stats?.possessionStarts ?? "",
          locationAddress: loc?.address ?? "",
          mapUrl: loc?.mapUrl ?? "",
          locationImage: loc?.image ?? String((savedDetails as Record<string, unknown>).locationImage ?? ""),
          galleryImages,
          floorPlans,
          specifications: specs.map((s: { category?: string; items?: string[] }) => ({ category: s?.category ?? "", items: Array.isArray(s?.items) ? s.items : [] })),
          nearbyPlaces: loc?.nearbyPlaces ?? [],
          highlights: Array.isArray((savedDetails as Record<string, unknown>).highlights)
            ? ((savedDetails as Record<string, unknown>).highlights as unknown[]).map((item) => String(item || "").trim()).filter(Boolean)
            : [],
        });
      } else {
        await loadData();
      }
    } catch (error) {
      console.error("Error saving details:", error);
      alert(error instanceof Error ? error.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  if (!user || !project) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard/projects"
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <ArrowLeft size={24} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-[#1F2A54] truncate">{projectBasics.title || project.title}</h1>
              <p className="text-sm text-muted-foreground truncate">{projectBasics.location || project.location}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-sm text-muted-foreground">Edit project name, type, location, and all page sections. Use &quot;Save all sections&quot; to publish.</p>
          <Button onClick={handleSaveDetails} disabled={saving} className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save all sections</>}
          </Button>
        </div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project details</CardTitle>
            <p className="text-sm text-muted-foreground">These appear on listings and can be changed after the project is created.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-title">Project name *</Label>
                <Input
                  id="project-title"
                  value={projectBasics.title}
                  onChange={(e) => setProjectBasics({ ...projectBasics, title: e.target.value })}
                  placeholder="e.g., Quality Home Group Skyline Towers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-type">Project type *</Label>
                {categories.length > 0 ? (
                  <Select value={projectBasics.categoryId || undefined} onValueChange={handleCategoryChange}>
                    <SelectTrigger id="project-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="project-type"
                    value={projectBasics.type}
                    onChange={(e) => setProjectBasics({ ...projectBasics, type: e.target.value })}
                    placeholder="e.g., Apartments, Villas"
                  />
                )}
                {!projectBasics.categoryId && projectBasics.type ? (
                  <p className="text-xs text-muted-foreground">Current type: {projectBasics.type}. Choose a category to change it.</p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-location">Location *</Label>
                <Input
                  id="project-location"
                  value={projectBasics.location}
                  onChange={(e) => setProjectBasics({ ...projectBasics, location: e.target.value })}
                  placeholder="e.g., Narsingi, Hyderabad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Status</Label>
                <Select value={projectBasics.status} onValueChange={(value) => setProjectBasics({ ...projectBasics, status: value })}>
                  <SelectTrigger id="project-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Under Construction</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Ready to Move</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Short description</Label>
              <Textarea
                id="project-description"
                value={projectBasics.description}
                onChange={(e) => setProjectBasics({ ...projectBasics, description: e.target.value })}
                placeholder="Brief description for listing cards..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="project-featured"
                checked={projectBasics.featured}
                onCheckedChange={(checked) => setProjectBasics({ ...projectBasics, featured: checked })}
              />
              <Label htmlFor="project-featured">Featured project</Label>
            </div>
          </CardContent>
        </Card>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="floor-plan">Floor Plan</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="location">Location Advantages</TabsTrigger>
            <TabsTrigger value="project-status">Project Status</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="project-video">Project video</TabsTrigger>
            <TabsTrigger value="brochure">Brochure</TabsTrigger>
          </TabsList>

          {/* 1. Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Hero, about, and gallery each use their own images. Do not reuse one upload across sections.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tagline</Label>
                    <Input value={detailsForm.tagline} onChange={(e) => setDetailsForm({ ...detailsForm, tagline: e.target.value })} placeholder="Hero tagline (from CMS)" />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input value={detailsForm.price} onChange={(e) => setDetailsForm({ ...detailsForm, price: e.target.value })} placeholder="7.45 CR" />
                  </div>
                  <div className="space-y-2">
                    <Label>Price label</Label>
                    <Input value={detailsForm.priceLabel} onChange={(e) => setDetailsForm({ ...detailsForm, priceLabel: e.target.value })} placeholder="Price" />
                  </div>
                  <div className="space-y-2">
                    <Label>RERA Number</Label>
                    <Input value={detailsForm.reraNumber} onChange={(e) => setDetailsForm({ ...detailsForm, reraNumber: e.target.value })} placeholder="P02400001822" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hero Image</Label>
                  <p className="text-xs text-muted-foreground">Banner at the top of the project page only.</p>
                  <ImageUpload value={detailsForm.heroImage} onChange={(url) => setDetailsForm((prev) => ({ ...prev, heroImage: url }))} folder="projects/hero" aspectRatio="banner" preset="heroBanner" placeholder="Upload hero image" />
                </div>
                <div className="space-y-2">
                  <Label>About Project</Label>
                  <Textarea value={detailsForm.about} onChange={(e) => setDetailsForm({ ...detailsForm, about: e.target.value })} placeholder="Detailed description..." rows={6} />
                </div>
                <div className="space-y-2">
                  <Label>About section image</Label>
                  <p className="text-xs text-muted-foreground">Right-side image in &quot;About this project&quot;. Use a different image from the hero.</p>
                  <ImageUpload value={detailsForm.aboutImage} onChange={(url) => setDetailsForm((prev) => ({ ...prev, aboutImage: url }))} folder="projects/about" aspectRatio="portrait" placeholder="Upload about section image" />
                </div>
                <div className="space-y-2">
                  <Label>Highlights (one per line)</Label>
                  <Textarea
                    value={detailsForm.highlights.join("\n")}
                    onChange={(e) => setDetailsForm({ ...detailsForm, highlights: e.target.value.split("\n") })}
                    placeholder="Quality construction&#10;Gated community living"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Amenities Tab */}
          <TabsContent value="amenities" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1F2A54]">Project Amenities</h2>
              <Button
                onClick={() => handleOpenAmenityDialog()}
                className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
              >
                <Plus size={18} className="mr-2" />
                Add Amenity
              </Button>
            </div>

            {amenities.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No amenities yet. Add your first amenity!</p>
                  <Button
                    onClick={() => handleOpenAmenityDialog()}
                    className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Amenity
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {amenities.map((amenity) => (
                  <Card key={amenity.id} className="overflow-hidden">
                    <div className="relative h-40">
                      <Image
                        src={amenity.image || "/placeholder.svg"}
                        alt={amenity.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-2 left-2">
                        <GripVertical className="text-white/70" size={20} />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => handleOpenAmenityDialog(amenity)}
                          className="p-2 bg-white rounded-full shadow hover:bg-secondary"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingAmenity(amenity);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-2 bg-white rounded-full shadow hover:bg-red-50 text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white font-semibold text-sm">{amenity.name}</p>
                        <p className="text-white/70 text-xs">{amenity.galleryImages.length} gallery images</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 3. Floor Plan */}
          <TabsContent value="floor-plan" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Floor Plan</CardTitle>
                <p className="text-sm text-muted-foreground">Images for the Floor Plan section on the website.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Floor plans</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDetailsForm({ ...detailsForm, floorPlans: [...detailsForm.floorPlans, { name: "", image: "" }] })}><Plus size={14} className="mr-1" /> Add</Button>
                </div>
                {detailsForm.floorPlans.map((plan, idx) => (
                  <div key={idx} className="flex gap-2 items-end border p-2 rounded-lg">
                    <Input placeholder="Plan name" value={plan.name} onChange={(e) => { const u = [...detailsForm.floorPlans]; u[idx] = { ...u[idx], name: e.target.value }; setDetailsForm({ ...detailsForm, floorPlans: u }); }} className="flex-1" />
                    <div className="flex-1">
                      <ImageUpload value={plan.image} onChange={(url) => { setDetailsForm((prev) => { const u = [...prev.floorPlans]; u[idx] = { ...u[idx], image: url }; return { ...prev, floorPlans: u }; }); }} folder="projects/floor-plans" placeholder="Image" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setDetailsForm({ ...detailsForm, floorPlans: detailsForm.floorPlans.filter((_, i) => i !== idx) })}><Trash2 size={16} /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Gallery */}
          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
                <p className="text-sm text-muted-foreground">Gallery section only. These images are not used as the hero or About image.</p>
              </CardHeader>
              <CardContent>
                <MultiImageUpload
                  value={detailsForm.galleryImages}
                  onChange={(urls) => {
                    setDetailsForm((prev) => {
                      const next = { ...prev, galleryImages: urls };
                      detailsFormRef.current = next;
                      return next;
                    });
                    void persistGallery(urls);
                  }}
                  folder="projects/gallery"
                  maxImages={20}
                />
                <p className="text-xs text-muted-foreground mt-2">Gallery images save as soon as you add or remove them, and also with &quot;Save all sections&quot;.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Location Advantages */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Advantages</CardTitle>
                <p className="text-sm text-muted-foreground">Address, right-side image, map embed, and nearby places.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Location Address</Label>
                  <Input value={detailsForm.locationAddress} onChange={(e) => setDetailsForm({ ...detailsForm, locationAddress: e.target.value })} placeholder="TukkuGuda, Hyderabad" />
                </div>
                <div className="space-y-2">
                  <Label>Google Maps Embed URL</Label>
                  <Input value={detailsForm.mapUrl} onChange={(e) => setDetailsForm({ ...detailsForm, mapUrl: e.target.value })} placeholder="https://www.google.com/maps/embed?..." />
                </div>
                <div className="space-y-2">
                  <Label>Right-side location image</Label>
                  <ImageUpload
                    value={detailsForm.locationImage}
                    onChange={(url) => setDetailsForm((prev) => ({ ...prev, locationImage: url }))}
                    folder="projects/location"
                    placeholder="Upload the Location Advantages image"
                  />
                  <p className="text-xs text-muted-foreground">Shown on the right of Location Advantages. If empty, the map or hero image is used.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Nearby Places (type: hospital / school / it / connectivity)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDetailsForm({ ...detailsForm, nearbyPlaces: [...detailsForm.nearbyPlaces, { name: "", distance: "", type: "" }] })}><Plus size={14} className="mr-1" /> Add</Button>
                  </div>
                  {detailsForm.nearbyPlaces.map((place, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center border p-2 rounded-lg">
                      <Input placeholder="Name" value={place.name} onChange={(e) => { const u = [...detailsForm.nearbyPlaces]; u[idx] = { ...u[idx], name: e.target.value }; setDetailsForm({ ...detailsForm, nearbyPlaces: u }); }} className="sm:w-32" />
                      <Input placeholder="Distance" value={place.distance} onChange={(e) => { const u = [...detailsForm.nearbyPlaces]; u[idx] = { ...u[idx], distance: e.target.value }; setDetailsForm({ ...detailsForm, nearbyPlaces: u }); }} className="sm:w-24" />
                      <Input placeholder="Type" value={place.type} onChange={(e) => { const u = [...detailsForm.nearbyPlaces]; u[idx] = { ...u[idx], type: e.target.value }; setDetailsForm({ ...detailsForm, nearbyPlaces: u }); }} className="sm:w-28" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setDetailsForm({ ...detailsForm, nearbyPlaces: detailsForm.nearbyPlaces.filter((_, i) => i !== idx) })}><Trash2 size={16} /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. Project Status */}
          <TabsContent value="project-status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <p className="text-sm text-muted-foreground">Status video and stats bar (land area, blocks, units, etc.).</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Video URL (Project Status section)</Label>
                  <Input value={detailsForm.videoUrl} onChange={(e) => setDetailsForm({ ...detailsForm, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Total Land Area</Label><Input value={detailsForm.totalLandArea} onChange={(e) => setDetailsForm({ ...detailsForm, totalLandArea: e.target.value })} placeholder="2.9 Acres" /></div>
                  <div className="space-y-2"><Label>No. of Blocks</Label><Input value={detailsForm.noOfBlocks} onChange={(e) => setDetailsForm({ ...detailsForm, noOfBlocks: e.target.value })} placeholder="4" /></div>
                  <div className="space-y-2"><Label>Total Units</Label><Input value={detailsForm.totalUnits} onChange={(e) => setDetailsForm({ ...detailsForm, totalUnits: e.target.value })} placeholder="110" /></div>
                  <div className="space-y-2"><Label>Configuration</Label><Input value={detailsForm.configuration} onChange={(e) => setDetailsForm({ ...detailsForm, configuration: e.target.value })} placeholder="2&3 BHK Apts" /></div>
                  <div className="space-y-2"><Label>Floors</Label><Input value={detailsForm.floors} onChange={(e) => setDetailsForm({ ...detailsForm, floors: e.target.value })} placeholder="3B+G+15 Floors" /></div>
                  <div className="space-y-2"><Label>Possession Starts</Label><Input value={detailsForm.possessionStarts} onChange={(e) => setDetailsForm({ ...detailsForm, possessionStarts: e.target.value })} placeholder="Dec 2026" /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 7. Specifications */}
          <TabsContent value="specifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
                <p className="text-sm text-muted-foreground">Category and items (one per line) for the Specifications section.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Specification groups</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDetailsForm({ ...detailsForm, specifications: [...detailsForm.specifications, { category: "", items: [] }] })}><Plus size={14} className="mr-1" /> Add</Button>
                </div>
                {detailsForm.specifications.map((spec, idx) => (
                  <div key={idx} className="border p-3 rounded-lg space-y-2">
                    <Input placeholder="Category name" value={spec.category} onChange={(e) => { const u = [...detailsForm.specifications]; u[idx] = { ...u[idx], category: e.target.value }; setDetailsForm({ ...detailsForm, specifications: u }); }} />
                    <Textarea placeholder="Items (one per line)" value={(spec.items || []).join("\n")} onChange={(e) => { const u = [...detailsForm.specifications]; u[idx] = { ...u[idx], items: e.target.value.split("\n").filter(Boolean) }; setDetailsForm({ ...detailsForm, specifications: u }); }} rows={3} className="text-sm" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDetailsForm({ ...detailsForm, specifications: detailsForm.specifications.filter((_, i) => i !== idx) })}><Trash2 size={14} /> Remove</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 8. Project video */}
          <TabsContent value="project-video" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project video</CardTitle>
                <p className="text-sm text-muted-foreground">Walkthrough / project video URL. Shown in the &quot;Project video&quot; tab on the website.</p>
              </CardHeader>
              <CardContent>
                <Label>Walkthrough / Project Video URL</Label>
                <Input value={detailsForm.walkthroughVideoUrl} onChange={(e) => setDetailsForm({ ...detailsForm, walkthroughVideoUrl: e.target.value })} placeholder="https://youtube.com/..." className="mt-2" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 9. Brochure */}
          <TabsContent value="brochure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brochure</CardTitle>
                <p className="text-sm text-muted-foreground">Upload a PDF for this project. It appears as the Brochure download on the website project page after you save.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Brochure PDF</Label>
                <PdfUpload
                  value={detailsForm.brochureUrl}
                  onChange={(url) => setDetailsForm((prev) => ({ ...prev, brochureUrl: url }))}
                  folder="projects/brochures"
                  placeholder="Drag & drop or click to upload brochure PDF"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add/Edit Amenity Dialog */}
      <Dialog open={amenityDialogOpen} onOpenChange={setAmenityDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAmenity ? "Edit Amenity" : "Add New Amenity"}</DialogTitle>
            <DialogDescription>
              {editingAmenity ? "Update amenity details" : "Add a new amenity to this property"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amenity Name</Label>
              <Input
                value={amenityForm.name}
                onChange={(e) => setAmenityForm({ ...amenityForm, name: e.target.value })}
                placeholder="e.g., TRANQUIL AMENITIES"
              />
            </div>
            <div className="space-y-2">
              <Label>Main Image</Label>
              <ImageUpload
                value={amenityForm.image}
                onChange={(url) => setAmenityForm({ ...amenityForm, image: url })}
                folder="projects/amenities"
                aspectRatio="video"
                preset="projectImage"
                placeholder="Upload amenity image"
              />
            </div>
            <div className="space-y-2">
              <Label>Gallery Images (for popup)</Label>
              <MultiImageUpload
                value={amenityForm.galleryImages}
                onChange={(urls) => setAmenityForm({ ...amenityForm, galleryImages: urls })}
                folder="projects/amenities/gallery"
                maxImages={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAmenityDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAmenity}
              disabled={saving || !amenityForm.name || !amenityForm.image}
              className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Amenity"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Amenity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingAmenity?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAmenity}
              disabled={saving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
