"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import {
  addCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  FolderOpen,
  ImageIcon,
} from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

const defaultFormData = {
  name: "",
  slug: "",
  description: "",
  image: "",
  heroImage: "",
  heroTitle: "",
  order: 0,
  isActive: true,
};

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user || typeof user.getIdToken !== "function") {
      setLoading(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/v1/categories?all=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setCategories((json.data ?? []) as Category[]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setAutoSlug(false);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        image: category.image || "",
        heroImage: category.heroImage || "",
        heroTitle: category.heroTitle || "",
        order: category.order,
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setAutoSlug(true);
      const nextOrder = categories.length > 0
        ? Math.max(...categories.map((c) => c.order)) + 1
        : 1;
      setFormData({ ...defaultFormData, order: nextOrder });
    }
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    const updated = { ...formData, name };
    if (autoSlug) {
      updated.slug = generateSlug(name);
    }
    setFormData(updated);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        image: formData.image,
        heroImage: formData.heroImage,
        heroTitle: formData.heroTitle,
        order: formData.order,
        isActive: formData.isActive,
      };
      if (editingCategory?.id) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await addCategory(payload);
      }
      await loadCategories();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory?.id) return;
    setSaving(true);
    try {
      await deleteCategory(deletingCategory.id);
      await loadCategories();
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    if (!category.id) return;
    try {
      await updateCategory(category.id, { isActive: !category.isActive });
      await loadCategories();
    } catch (error) {
      console.error("Error toggling category:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A54]">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage project categories (Apartments, Villas, Commercial, etc.)
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white w-full sm:w-auto"
        >
          <Plus size={18} className="mr-2" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              No categories yet. Add your first category to organize projects.
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white"
            >
              <Plus size={18} className="mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  {/* Drag handle placeholder */}
                  <div className="text-muted-foreground/40">
                    <GripVertical size={20} />
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <ImageIcon size={20} className="text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1F2A54] truncate">
                        {category.name}
                      </h3>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full shrink-0">
                        /{category.slug}
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {category.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Order: {category.order}
                    </p>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={() => handleToggleActive(category)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenDialog(category)}
                      className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingCategory(category);
                        setDeleteDialogOpen(true);
                      }}
                      className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category details"
                : "Create a new project category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Apartments"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="cat-slug">URL Slug *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cat-slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setFormData({ ...formData, slug: generateSlug(e.target.value) });
                  }}
                  placeholder="e.g., apartments"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be used in the URL: /{formData.slug || "..."}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this category..."
                rows={3}
              />
            </div>

            {/* Category Thumbnail */}
            <div className="space-y-2">
              <Label>Category Thumbnail</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder="categories"
                aspectRatio="video"
                placeholder="Upload category thumbnail"
              />
            </div>

            {/* Hero Image */}
            <div className="space-y-2">
              <Label>Hero Banner Image</Label>
              <ImageUpload
                value={formData.heroImage}
                onChange={(url) => setFormData({ ...formData, heroImage: url })}
                folder="categories"
                aspectRatio="banner"
                placeholder="Upload hero banner for category page"
              />
            </div>

            {/* Hero Title */}
            <div className="space-y-2">
              <Label htmlFor="cat-hero-title">Hero Banner Title</Label>
              <Input
                id="cat-hero-title"
                value={formData.heroTitle}
                onChange={(e) =>
                  setFormData({ ...formData, heroTitle: e.target.value })
                }
                placeholder="e.g., LUXURY APARTMENTS"
              />
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="cat-order">Display Order</Label>
              <Input
                id="cat-order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>

            {/* Active */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Show this category on the website
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.slug}
              className="bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingCategory ? (
                "Update Category"
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingCategory?.name}&quot;?
              This will not delete projects in this category, but they will become
              uncategorized. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
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
