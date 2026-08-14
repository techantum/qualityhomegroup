"use client";

import React, { useCallback, useRef } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { getGalleryImages, addGalleryImage, updateGalleryImage, deleteGalleryImage, type GalleryImage } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  Grid3X3, 
  List, 
  Search,
  Check,
  X,
  ImageIcon,
  FolderOpen,
  Save,
} from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";

const categories = ["Apartments", "Villas", "Commercial", "Plots", "Interior", "Exterior", "Amenities", "Floor Plans", "Projects"];

export default function GalleryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [savingHero, setSavingHero] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    image: "",
    order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkUploadUrls, setBulkUploadUrls] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchImages() {
      try {
        const data = await getGalleryImages();
        setImages(data);
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setLoadingData(false);
      }
    }
    async function fetchHero() {
      try {
        const res = await fetch("/api/v1/content/pages/gallery");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setHeroTitle(json.data.heroTitle ?? "");
          setHeroImage(json.data.heroImage ?? "");
        }
      } catch {}
    }
    if (user) {
      fetchImages();
      fetchHero();
    }
  }, [user]);

  const handleSaveHero = async () => {
    if (!user?.getIdToken) return;
    setSavingHero(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/v1/content/pages/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ heroTitle, heroImage }),
      });
      alert("Hero section saved!");
    } catch {
      alert("Error saving hero section.");
    } finally {
      setSavingHero(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingImage) {
        await updateGalleryImage(editingImage.id!, formData);
        setImages(images.map(img => img.id === editingImage.id ? { ...img, ...formData } : img));
      } else {
        const id = await addGalleryImage(formData);
        setImages([...images, { id, ...formData }]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving image:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async (files: FileList) => {
    if (!bulkCategory || files.length === 0) return;
    
    setUploadingFiles(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", `gallery/${bulkCategory.toLowerCase()}`);
        
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          const title = file.name.replace(/\.[^/.]+$/, "") || `${bulkCategory} Image ${images.length + i + 1}`;
          const id = await addGalleryImage({
            title,
            category: bulkCategory,
            image: data.url,
            order: images.length + i,
          });
          setImages(prev => [...prev, { id, title, category: bulkCategory, image: data.url, order: images.length + i }]);
        }
      }
      setIsUploadDialogOpen(false);
      setBulkCategory("");
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      category: image.category,
      image: image.image,
      order: image.order,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      await deleteGalleryImage(id);
      setImages(images.filter(img => img.id !== id));
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedImages.length} images?`)) return;
    
    try {
      for (const id of selectedImages) {
        await deleteGalleryImage(id);
      }
      setImages(images.filter(img => !selectedImages.includes(img.id!)));
      setSelectedImages([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error("Error deleting images:", error);
    }
  };

  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedImages.length === filteredImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(filteredImages.map(img => img.id!));
    }
  };

  const resetForm = () => {
    setEditingImage(null);
    setFormData({ title: "", category: "", image: "", order: images.length });
  };

  const filteredImages = images.filter(img => {
    const matchesCategory = filterCategory === "all" || img.category === filterCategory;
    const matchesSearch = img.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group images by category for list view
  const groupedImages = filteredImages.reduce((acc, img) => {
    if (!acc[img.category]) acc[img.category] = [];
    acc[img.category].push(img);
    return acc;
  }, {} as Record<string, GalleryImage[]>);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Hero Section Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Hero banner displayed on the Gallery page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="heroTitle">Hero Title</Label>
            <Input
              id="heroTitle"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="e.g., OUR GALLERY"
            />
          </div>
          <div>
            <Label>Hero Background Image</Label>
            <ImageUpload
              value={heroImage}
              onChange={setHeroImage}
              folder="cms/gallery"
              aspectRatio="banner"
              placeholder="Upload gallery hero image"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveHero} disabled={savingHero} className="bg-[#1F2A54]">
              {savingHero && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save Hero
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A54]">Gallery</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {images.length} images • {categories.length} categories
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isSelectionMode ? (
            <>
              <Button variant="outline" onClick={() => { setIsSelectionMode(false); setSelectedImages([]); }}>
                Cancel
              </Button>
              <Button variant="outline" onClick={selectAll}>
                {selectedImages.length === filteredImages.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedImages.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 size={16} className="mr-2" />
                  Delete ({selectedImages.length})
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsSelectionMode(true)}>
                <Check size={16} className="mr-2" /> Select
              </Button>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload size={16} className="mr-2" /> Bulk Upload
              </Button>
              <Button 
                className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
                onClick={() => { resetForm(); setIsDialogOpen(true); }}
              >
                <Plus size={18} className="mr-2" /> Add Image
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-48">
            <FolderOpen size={16} className="mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            className={viewMode === "grid" ? "bg-[#1F2A54]" : ""}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 size={16} />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className={viewMode === "list" ? "bg-[#1F2A54]" : ""}
            onClick={() => setViewMode("list")}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : filteredImages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {images.length === 0 ? "No images in media library" : "No images match your filters"}
            </p>
            <Button 
              className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
              onClick={() => { resetForm(); setIsDialogOpen(true); }}
            >
              <Plus size={16} className="mr-2" /> Add First Image
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredImages.map((image) => (
            <div 
              key={image.id} 
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                isSelectionMode && selectedImages.includes(image.id!) 
                  ? "border-[#DDA21A] ring-2 ring-[#DDA21A]/30" 
                  : "border-transparent hover:border-gray-300"
              }`}
              onClick={isSelectionMode ? () => toggleImageSelection(image.id!) : undefined}
            >
              <Image 
                src={image.image || "/placeholder.svg"} 
                alt={image.title} 
                fill 
                className="object-cover"
              />
              
              {/* Selection Checkbox */}
              {isSelectionMode && (
                <div className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  selectedImages.includes(image.id!) 
                    ? "bg-[#DDA21A] border-[#DDA21A]" 
                    : "bg-white/80 border-gray-400"
                }`}>
                  {selectedImages.includes(image.id!) && <Check className="w-4 h-4 text-white" />}
                </div>
              )}
              
              {/* Hover Actions */}
              {!isSelectionMode && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => handleEdit(image)}>
                    <Pencil size={16} />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleDelete(image.id!)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
              
              {/* Info */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-xs text-white truncate font-medium">{image.title}</p>
                <p className="text-xs text-white/70">{image.category}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedImages).map(([category, imgs]) => (
            <Card key={category}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-[#1F2A54] mb-3 flex items-center gap-2">
                  <FolderOpen size={18} />
                  {category} ({imgs.length})
                </h3>
                <div className="space-y-2">
                  {imgs.map((image) => (
                    <div 
                      key={image.id} 
                      className={`flex items-center gap-4 p-2 rounded-lg hover:bg-secondary/50 transition-colors ${
                        isSelectionMode && selectedImages.includes(image.id!) ? "bg-[#DDA21A]/10" : ""
                      }`}
                      onClick={isSelectionMode ? () => toggleImageSelection(image.id!) : undefined}
                    >
                      {isSelectionMode && (
                        <Checkbox 
                          checked={selectedImages.includes(image.id!)}
                          onCheckedChange={() => toggleImageSelection(image.id!)}
                        />
                      )}
                      <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0">
                        <Image src={image.image || "/placeholder.svg"} alt={image.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1F2A54] truncate">{image.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{image.image}</p>
                      </div>
                      {!isSelectionMode && (
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(image)}>
                            <Pencil size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(image.id!)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Single Image Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingImage ? "Edit Image" : "Add New Image"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder={`gallery/${formData.category?.toLowerCase() || "general"}`}
                aspectRatio="video"
              />
            </div>
            <div>
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#1F2A54]" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingImage ? "Update" : "Add"} Image
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Multiple Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category for all images</Label>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {bulkCategory && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1F2A54] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingFiles ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 animate-spin text-[#1F2A54]" />
                    <p className="text-sm text-muted-foreground">Uploading images...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium text-[#1F2A54]">Click to select images</p>
                    <p className="text-sm text-muted-foreground mt-1">or drag and drop files here</p>
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG, GIF, WebP up to 10MB each</p>
                  </>
                )}
              </div>
            )}
            {!bulkCategory && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Please select a category first
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden file input for bulk upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleBulkUpload(e.target.files);
          }
        }}
      />
    </div>
  );
}
