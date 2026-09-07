"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, X, ExternalLink } from "lucide-react";
import { ImageUpload, MultiImageUpload } from "@/components/admin/image-upload";
import { PdfUpload } from "@/components/admin/pdf-upload";
import { Switch } from "@/components/ui/switch";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const defaultStats = {
  totalLandArea: "",
  noOfBlocks: "",
  totalUnits: "",
  configuration: "",
  floors: "",
  possessionStarts: "",
};

export default function EditProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    categoryId: "",
    category: "",
    location: "",
    image: "",
    description: "",
    tagline: "",
    heroImage: "",
    locationImage: "",
    price: "",
    priceLabel: "Price",
    reraNumber: "",
    stats: { ...defaultStats },
    about: "",
    aboutImage: "",
    projectStatusVideo: "",
    walkThroughVideo: "",
    brochureUrl: "",
    status: "ongoing",
    featured: false,
    possessionDate: "",
    // SEO
    metaTitle: "",
    metaDescription: "",
  });

  const [metaKeywords, setMetaKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [amenities, setAmenities] = useState<{ name: string; image: string; galleryImages: string[] }[]>([]);
  const [floorPlans, setFloorPlans] = useState<{ name: string; image: string }[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState({
    hospitals: [] as { name: string; distance: string }[],
    schools: [] as { name: string; distance: string }[],
    itParks: [] as { name: string; distance: string }[],
    connectivity: [] as { name: string; distance: string }[],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    async function fetchCategories() {
      try {
        const res = await adminApiFetch(currentUser, "/api/v1/categories");
        const json = await res.json().catch(() => ({}));
        if (res.ok) setCategories(json.data ?? []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, [user]);

  useEffect(() => {
    if (!categories.length || formData.categoryId) return;
    const match = categories.find(
      (c) =>
        c.slug === formData.category ||
        c.name === formData.type ||
        c.slug === (formData.type || "").toLowerCase()
    );
    if (match) {
      setFormData((prev) => ({
        ...prev,
        categoryId: match.id,
        category: match.slug,
        type: match.name,
      }));
    }
  }, [categories, formData.categoryId, formData.category, formData.type]);

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) {
      setFormData({
        ...formData,
        categoryId: cat.id,
        category: cat.slug,
        type: cat.name,
      });
    }
  };

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/v1/projects/public/${encodeURIComponent(projectId)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const projectData = json?.data?.project;
        if (projectData) {
          setProject({ id: projectData.id });
          setFormData((prev) => ({
            ...prev,
            title: projectData.title ?? "",
            type: projectData.type ?? "",
            categoryId: projectData.categoryId ?? "",
            category: projectData.category ?? "",
            location: projectData.location ?? "",
            image: projectData.image ?? "",
            description: projectData.description ?? "",
            tagline: projectData.tagline ?? "",
            heroImage: projectData.heroImage ?? "",
            price: projectData.price ?? "",
            priceLabel: projectData.priceLabel ?? "Price",
            reraNumber: projectData.reraNumber ?? "",
            possessionDate: projectData.possessionDate ?? "",
            about: projectData.about ?? "",
            aboutImage: projectData.aboutImage ?? "",
            projectStatusVideo: projectData.projectStatusVideo ?? "",
            walkThroughVideo: projectData.walkThroughVideo ?? "",
            brochureUrl: projectData.brochureUrl ?? "",
            status: projectData.status ?? "ongoing",
            featured: Boolean(projectData.featured),
            stats: {
              totalLandArea: projectData.stats?.totalLandArea ?? "",
              noOfBlocks: projectData.stats?.noOfBlocks ?? "",
              totalUnits: projectData.stats?.totalUnits ?? "",
              configuration: projectData.stats?.configuration ?? "",
              floors: projectData.stats?.floors ?? "",
              possessionStarts: projectData.stats?.possessionStarts ?? "",
            },
            metaTitle: projectData.metaTitle ?? "",
            metaDescription: projectData.metaDescription ?? "",
          }));
          if (Array.isArray(projectData.metaKeywords)) setMetaKeywords(projectData.metaKeywords);
          if (Array.isArray(projectData.amenities)) setAmenities(projectData.amenities);
          if (Array.isArray(projectData.floorPlans)) setFloorPlans(projectData.floorPlans);
          if (Array.isArray(projectData.galleryImages)) setGalleryImages(projectData.galleryImages);
          const details = json?.data?.propertyDetails as { aboutImage?: string; location?: { image?: string } } | undefined;
          if (details?.location?.image || projectData.locationImage) {
            setFormData((prev) => ({
              ...prev,
              locationImage: String(details?.location?.image || projectData.locationImage || ""),
            }));
          }
          if (details?.aboutImage || projectData.aboutImage) {
            setFormData((prev) => ({
              ...prev,
              aboutImage: String(details?.aboutImage || projectData.aboutImage || ""),
            }));
          }
          if (projectData.nearbyPlaces && typeof projectData.nearbyPlaces === "object") {
            setNearbyPlaces({
              hospitals: Array.isArray(projectData.nearbyPlaces.hospitals) ? projectData.nearbyPlaces.hospitals : [],
              schools: Array.isArray(projectData.nearbyPlaces.schools) ? projectData.nearbyPlaces.schools : [],
              itParks: Array.isArray(projectData.nearbyPlaces.itParks) ? projectData.nearbyPlaces.itParks : [],
              connectivity: Array.isArray(projectData.nearbyPlaces.connectivity) ? projectData.nearbyPlaces.connectivity : [],
            });
          }
        } else {
          setProject(null);
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleSave = async () => {
    if (!formData.title || !formData.type || !formData.location) {
      alert("Please fill in required fields: Title, Type, and Location");
      return;
    }
    if (!user) {
      alert("You must be logged in to save.");
      return;
    }
    const idToSave = project?.id ?? projectId;
    if (!idToSave) {
      alert("Project not loaded yet. Please wait and try again.");
      return;
    }

    setSaving(true);
    try {
      const res = await adminApiFetch(
        user,
        `/api/v1/projects/${idToSave}?t=${Date.now()}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: formData.title,
            type: formData.type,
            location: formData.location,
            categoryId: formData.categoryId,
            category: formData.category,
            featured: formData.featured,
            image: formData.image || formData.heroImage,
            description: formData.description,
            tagline: formData.tagline,
            heroImage: formData.heroImage,
            priceLabel: formData.priceLabel,
            reraNumber: formData.reraNumber,
            possessionDate: formData.possessionDate,
            about: formData.about,
            aboutImage: formData.aboutImage,
            projectStatusVideo: formData.projectStatusVideo,
            walkThroughVideo: formData.walkThroughVideo,
            brochureUrl: formData.brochureUrl,
            price: formData.price,
            status: formData.status,
            stats: formData.stats,
            amenities,
            floorPlans,
            galleryImages,
            nearbyPlaces,
            locationImage: formData.locationImage,
            metaTitle: formData.metaTitle,
            metaDescription: formData.metaDescription,
            metaKeywords,
          }),
          cache: "no-store",
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      const updatedProject = json?.data?.project;
      if (updatedProject) {
        setFormData((prev) => ({
          ...prev,
          title: updatedProject.title ?? prev.title,
          type: updatedProject.type ?? prev.type,
          location: updatedProject.location ?? prev.location,
          image: updatedProject.image ?? prev.image,
          description: updatedProject.description ?? prev.description,
        }));
      }
      alert("Project saved successfully.");
      router.push("/admin/dashboard/projects");
    } catch (error) {
      console.error("Error saving project:", error);
      alert(error instanceof Error ? error.message : "Failed to save project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addAmenity = () => {
    setAmenities([...amenities, { name: "", image: "", galleryImages: [] }]);
  };

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const addFloorPlan = () => {
    setFloorPlans([...floorPlans, { name: "", image: "" }]);
  };

  const removeFloorPlan = (index: number) => {
    setFloorPlans(floorPlans.filter((_, i) => i !== index));
  };

  const addNearbyPlace = (category: keyof typeof nearbyPlaces) => {
    setNearbyPlaces({
      ...nearbyPlaces,
      [category]: [...nearbyPlaces[category], { name: "", distance: "" }],
    });
  };

  const removeNearbyPlace = (category: keyof typeof nearbyPlaces, index: number) => {
    setNearbyPlaces({
      ...nearbyPlaces,
      [category]: nearbyPlaces[category].filter((_, i) => i !== index),
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/projects" className="p-2 hover:bg-secondary rounded-lg">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1F2A54]">Edit Project</h1>
            <p className="text-sm text-muted-foreground">{formData.title}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/property/${projectId}`} target="_blank">
            <Button variant="outline">
              <ExternalLink size={16} className="mr-2" /> Preview
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the main details of the project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Quality Home Group Skyline Towers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Project Type *</Label>
                <Select value={formData.categoryId || undefined} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.categoryId && formData.type ? (
                  <p className="text-xs text-muted-foreground">Current type: {formData.type}. Choose a category to change it.</p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Narsingi, Hyderabad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
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
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Hero tagline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description for listing cards..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label htmlFor="featured">Featured project</Label>
            </div>
          </CardContent>
        </Card>

        {/* Hero Image */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Image</CardTitle>
            <CardDescription>Top banner only. Not used in About or Gallery.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.heroImage}
              onChange={(url) => setFormData({ ...formData, heroImage: url })}
              folder="projects/hero"
              aspectRatio="banner"
              placeholder="Upload hero image (recommended: 1920x600)"
            />
          </CardContent>
        </Card>

        {/* Pricing & RERA */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & RERA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceLabel">Price Label</Label>
                <Input
                  id="priceLabel"
                  value={formData.priceLabel}
                  onChange={(e) => setFormData({ ...formData, priceLabel: e.target.value })}
                  placeholder="Price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 7.45 CR or STARTS AT 1.2CR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reraNumber">RERA Number</Label>
                <Input
                  id="reraNumber"
                  value={formData.reraNumber}
                  onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                  placeholder="P02400001822/89627/5784"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="possessionDate">Possession Date</Label>
              <Input
                id="possessionDate"
                value={formData.possessionDate}
                onChange={(e) => setFormData({ ...formData, possessionDate: e.target.value })}
                placeholder="e.g., 28th Jan 2028"
              />
            </div>
          </CardContent>
        </Card>

        {/* Project Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Project Stats</CardTitle>
            <CardDescription>Key statistics displayed on the property page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total Land Area</Label>
                <Input
                  value={formData.stats.totalLandArea}
                  onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, totalLandArea: e.target.value } })}
                  placeholder="2.9 Acres"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Units</Label>
                <Input
                  value={formData.stats.totalUnits}
                  onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, totalUnits: e.target.value } })}
                  placeholder="110"
                />
              </div>
              <div className="space-y-2">
                <Label>Configuration</Label>
                <Input
                  value={formData.stats.configuration}
                  onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, configuration: e.target.value } })}
                  placeholder="2&3 BHK Apts"
                />
              </div>
              <div className="space-y-2">
                <Label>Floors</Label>
                <Input
                  value={formData.stats.floors}
                  onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, floors: e.target.value } })}
                  placeholder="3B+G+15 Floors"
                />
              </div>
              <div className="space-y-2">
                <Label>No of Blocks</Label>
                <Input
                  value={formData.stats.noOfBlocks}
                  onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, noOfBlocks: e.target.value } })}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label>Possession Starts</Label>
                <Input
                  value={formData.stats.possessionStarts}
                  onChange={(e) => setFormData({ ...formData, stats: { ...formData.stats, possessionStarts: e.target.value } })}
                  placeholder="Dec,2026"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Project */}
        <Card>
          <CardHeader>
            <CardTitle>About Project</CardTitle>
            <CardDescription>Text and image for the Overview section. Use a different image from the hero.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              placeholder="Enter detailed project description..."
              rows={6}
            />
            <div className="space-y-2">
              <Label>About section image</Label>
              <ImageUpload
                value={formData.aboutImage}
                onChange={(url) => setFormData({ ...formData, aboutImage: url })}
                folder="projects/about"
                aspectRatio="portrait"
                placeholder="Upload about section image"
              />
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
            <CardDescription>Add project amenities with images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {amenities.map((amenity, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Amenity {index + 1}</Label>
                  <Button variant="ghost" size="sm" onClick={() => removeAmenity(index)} className="text-red-500">
                    <X size={16} />
                  </Button>
                </div>
                <Input
                  placeholder="Amenity name (e.g., Swimming Pool)"
                  value={amenity.name}
                  onChange={(e) => {
                    const updated = [...amenities];
                    updated[index].name = e.target.value;
                    setAmenities(updated);
                  }}
                />
                <ImageUpload
                  value={amenity.image}
                  onChange={(url) => {
                    const updated = [...amenities];
                    updated[index].image = url;
                    setAmenities(updated);
                  }}
                  folder="projects/amenities"
                  aspectRatio="square"
                  className="w-24"
                />
              </div>
            ))}
            <Button variant="outline" onClick={addAmenity} className="w-full bg-transparent">
              <Plus size={16} className="mr-2" /> Add Amenity
            </Button>
          </CardContent>
        </Card>

        {/* Floor Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Floor Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {floorPlans.map((plan, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Floor Plan {index + 1}</Label>
                  <Button variant="ghost" size="sm" onClick={() => removeFloorPlan(index)} className="text-red-500">
                    <X size={16} />
                  </Button>
                </div>
                <Input
                  placeholder="Plan name (e.g., Type A - 2 BHK)"
                  value={plan.name}
                  onChange={(e) => {
                    const updated = [...floorPlans];
                    updated[index].name = e.target.value;
                    setFloorPlans(updated);
                  }}
                />
                <ImageUpload
                  value={plan.image}
                  onChange={(url) => {
                    const updated = [...floorPlans];
                    updated[index].image = url;
                    setFloorPlans(updated);
                  }}
                  folder="projects/floorplans"
                  aspectRatio="video"
                />
              </div>
            ))}
            <Button variant="outline" onClick={addFloorPlan} className="w-full bg-transparent">
              <Plus size={16} className="mr-2" /> Add Floor Plan
            </Button>
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Gallery Images</CardTitle>
            <CardDescription>Gallery section only — not reused as hero or About image</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiImageUpload
              value={galleryImages}
              onChange={setGalleryImages}
              folder="projects/gallery"
              maxImages={30}
            />
          </CardContent>
        </Card>

        {/* Location Advantages */}
        <Card>
          <CardHeader>
            <CardTitle>Location Advantages</CardTitle>
            <CardDescription>Nearby places and connectivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Right-side location image</Label>
              <ImageUpload
                value={formData.locationImage}
                onChange={(url) => setFormData({ ...formData, locationImage: url })}
                folder="projects/location"
                placeholder="Upload the Location Advantages image"
              />
            </div>
            {(["hospitals", "schools", "itParks", "connectivity"] as const).map((category) => (
              <div key={category} className="space-y-3">
                <Label className="capitalize">{category === "itParks" ? "IT Parks" : category}</Label>
                {nearbyPlaces[category].map((place, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Name"
                      value={place.name}
                      onChange={(e) => {
                        const updated = { ...nearbyPlaces };
                        updated[category][index].name = e.target.value;
                        setNearbyPlaces(updated);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Distance"
                      value={place.distance}
                      onChange={(e) => {
                        const updated = { ...nearbyPlaces };
                        updated[category][index].distance = e.target.value;
                        setNearbyPlaces(updated);
                      }}
                      className="w-24"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeNearbyPlace(category, index)} className="text-red-500">
                      <X size={16} />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addNearbyPlace(category)}>
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Videos</CardTitle>
            <CardDescription>Add YouTube video URLs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Status Video (YouTube URL)</Label>
              <Input
                value={formData.projectStatusVideo}
                onChange={(e) => setFormData({ ...formData, projectStatusVideo: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-2">
              <Label>Walk Through Video (YouTube URL)</Label>
              <Input
                value={formData.walkThroughVideo}
                onChange={(e) => setFormData({ ...formData, walkThroughVideo: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Brochure */}
        <Card>
          <CardHeader>
            <CardTitle>Brochure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Brochure PDF</Label>
              <PdfUpload
                value={formData.brochureUrl}
                onChange={(url) => setFormData({ ...formData, brochureUrl: url })}
                folder="projects/brochures"
                placeholder="Upload brochure PDF for this project"
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Search engine optimization for this property page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="Page title for search engines"
              />
              <p className="text-xs text-muted-foreground">{formData.metaTitle.length}/60 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Brief description for search results"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{formData.metaDescription.length}/160 characters</p>
            </div>
            <div className="space-y-2">
              <Label>Meta Keywords</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add a keyword"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const kw = keywordInput.trim();
                      if (kw && !metaKeywords.includes(kw)) setMetaKeywords([...metaKeywords, kw]);
                      setKeywordInput("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const kw = keywordInput.trim();
                    if (kw && !metaKeywords.includes(kw)) setMetaKeywords([...metaKeywords, kw]);
                    setKeywordInput("");
                  }}
                >
                  Add
                </Button>
              </div>
              {metaKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {metaKeywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded text-sm">
                      {kw}
                      <button onClick={() => setMetaKeywords(metaKeywords.filter((k) => k !== kw))} className="hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/dashboard/projects">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
