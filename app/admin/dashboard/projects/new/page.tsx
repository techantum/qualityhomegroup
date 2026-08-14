"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { ImageUpload, MultiImageUpload } from "@/components/admin/image-upload";

const defaultStats = {
  totalLandArea: "",
  noOfBlocks: "",
  totalUnits: "",
  configuration: "",
  floors: "",
  possessionStarts: "",
};

export default function NewProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    if (!user || typeof user.getIdToken !== "function") return;
    const currentUser = user;
    async function fetchCategories() {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch("/api/v1/categories", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          setCategories(json.data ?? []);
        } else {
          const json = await res.json().catch(() => ({}));
          console.error("Categories API error:", res.status, json?.error ?? json);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, [user]);
  
  const [formData, setFormData] = useState({
    // Basic Info
    title: "",
    type: "",
    categoryId: "",
    category: "",
    location: "",
    image: "",
    description: "",
    featured: false,
    // Hero Section
    tagline: "",
    heroImage: "",
    // Pricing
    price: "",
    priceLabel: "Price",
    reraNumber: "",
    // Stats
    stats: { ...defaultStats },
    // About
    about: "",
    // Videos
    projectStatusVideo: "",
    walkThroughVideo: "",
    // Brochure
    brochureUrl: "",
    // Status
    status: "Under Construction",
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
  const [specifications, setSpecifications] = useState<{ category: string; items: { title: string; details: string[] }[] }[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState({
    hospitals: [] as { name: string; distance: string }[],
    schools: [] as { name: string; distance: string }[],
    itParks: [] as { name: string; distance: string }[],
    connectivity: [] as { name: string; distance: string }[],
  });

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) {
      setFormData({
        ...formData,
        categoryId: cat.id || "",
        category: cat.slug,
        type: cat.name,
      });
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.type || !formData.location) {
      alert("Please fill in required fields: Title, Category, and Location");
      return;
    }
    if (!user?.getIdToken) {
      alert("You must be logged in to save.");
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          location: formData.location,
          image: formData.image || formData.heroImage,
          description: formData.description,
          categoryId: formData.categoryId,
          category: formData.category,
          status: formData.status,
          price: formData.price,
          featured: formData.featured,
          tagline: formData.tagline,
          heroImage: formData.heroImage,
          priceLabel: formData.priceLabel,
          reraNumber: formData.reraNumber,
          possessionDate: formData.possessionDate,
          about: formData.about,
          projectStatusVideo: formData.projectStatusVideo,
          walkThroughVideo: formData.walkThroughVideo,
          brochureUrl: formData.brochureUrl,
          stats: formData.stats,
          amenities,
          floorPlans,
          galleryImages,
          nearbyPlaces,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          metaKeywords,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      alert("Project created successfully.");
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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/projects" className="p-2 hover:bg-secondary rounded-lg">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-[#1F2A54]">Add New Project</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Project"}
        </Button>
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
                <Label htmlFor="type">Category *</Label>
                <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="Under Construction">Under Construction</SelectItem>
                    <SelectItem value="Ready to Move">Ready to Move</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
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
          </CardContent>
        </Card>

        {/* Hero Image */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Image</CardTitle>
            <CardDescription>Main banner image for the project page</CardDescription>
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
            <CardDescription>Detailed description shown in the Overview section</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              placeholder="Enter detailed project description..."
              rows={6}
            />
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Status Video (YouTube Embed URL)</Label>
              <Input
                value={formData.projectStatusVideo}
                onChange={(e) => setFormData({ ...formData, projectStatusVideo: e.target.value })}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Walk Through Video (YouTube Embed URL)</Label>
              <Input
                value={formData.walkThroughVideo}
                onChange={(e) => setFormData({ ...formData, walkThroughVideo: e.target.value })}
                placeholder="https://www.youtube.com/embed/..."
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
              <Label>Brochure PDF URL</Label>
              <Input
                value={formData.brochureUrl}
                onChange={(e) => setFormData({ ...formData, brochureUrl: e.target.value })}
                placeholder="https://..."
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
        <div className="flex justify-end gap-3 pt-4">
          <Link href="/admin/dashboard/projects">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Project"}
          </Button>
        </div>
      </div>

    </div>
  );
}
