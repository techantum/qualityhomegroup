"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getCMSPages,
  addCMSPage,
  updateCMSPage,
  deleteCMSPage,
  type CMSPage,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  FileText,
  Eye,
  EyeOff,
  GripVertical,
  ExternalLink,
  Search,
  Layers,
  Settings,
} from "lucide-react";

export default function PagesManagerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<CMSPage | null>(null);

  const [formData, setFormData] = useState<Omit<CMSPage, "id" | "createdAt" | "updatedAt">>({
    slug: "",
    title: "",
    description: "",
    isActive: true,
    isIndexed: true,
    order: 0,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    ogImage: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchPages() {
      try {
        const data = await getCMSPages();
        setPages(data || []);
      } catch (error) {
        console.error("CMS Pages fetch error:", error);
        setPages([]);
      } finally {
        setLoadingData(false);
      }
    }
    if (user) {
      fetchPages();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingPage) {
        await updateCMSPage(editingPage.id!, formData);
        setPages(pages.map((p) => (p.id === editingPage.id ? { ...p, ...formData } : p)));
      } else {
        const id = await addCMSPage({ ...formData, order: pages.length });
        setPages([...pages, { id, ...formData, order: pages.length }]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving page:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (page: CMSPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      description: page.description || "",
      isActive: page.isActive,
      isIndexed: page.isIndexed,
      order: page.order,
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      metaKeywords: page.metaKeywords || [],
      ogImage: page.ogImage || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!pageToDelete) return;

    try {
      await deleteCMSPage(pageToDelete.id!);
      setPages(pages.filter((p) => p.id !== pageToDelete.id));
      setDeleteConfirmOpen(false);
      setPageToDelete(null);
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  const confirmDelete = (page: CMSPage) => {
    setPageToDelete(page);
    setDeleteConfirmOpen(true);
  };

  const togglePageStatus = async (page: CMSPage) => {
    try {
      await updateCMSPage(page.id!, { isActive: !page.isActive });
      setPages(pages.map((p) => (p.id === page.id ? { ...p, isActive: !p.isActive } : p)));
    } catch (error) {
      console.error("Error toggling page status:", error);
    }
  };

  const resetForm = () => {
    setEditingPage(null);
    setFormData({
      slug: "",
      title: "",
      description: "",
      isActive: true,
      isIndexed: true,
      order: 0,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: [],
      ogImage: "",
    });
  };

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, []);

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A54]">Pages Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage website pages and their sections
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button
            className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <Plus size={18} className="mr-2" /> Add Page
          </Button>
        </div>
      </div>

      {/* Pages Grid */}
      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {pages.length === 0 ? "No pages created yet" : "No pages match your search"}
            </p>
            <Button
              className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" /> Create First Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPages.map((page) => (
            <Card key={page.id} className={`${!page.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="cursor-grab text-muted-foreground">
                    <GripVertical size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1F2A54] truncate">{page.title}</h3>
                      {!page.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                          Draft
                        </span>
                      )}
                      {!page.isIndexed && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                          No Index
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/dashboard/pages/${page.id}/sections`}>
                      <Button variant="outline" size="sm">
                        <Layers size={14} className="mr-1" /> Sections
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePageStatus(page)}
                      title={page.isActive ? "Disable page" : "Enable page"}
                    >
                      {page.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(page)}>
                          <Pencil size={14} className="mr-2" /> Edit Page
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${page.slug}`} target="_blank">
                            <ExternalLink size={14} className="mr-2" /> View Page
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/dashboard/pages/${page.id}/seo`}>
                            <Settings size={14} className="mr-2" /> SEO Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => confirmDelete(page)}
                        >
                          <Trash2 size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Page Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Edit Page" : "Create New Page"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: editingPage ? formData.slug : generateSlug(e.target.value),
                  });
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Page Status</Label>
                <p className="text-xs text-muted-foreground">Enable to make page visible</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Search Engine Indexing</Label>
                <p className="text-xs text-muted-foreground">Allow search engines to index</p>
              </div>
              <Switch
                checked={formData.isIndexed}
                onCheckedChange={(checked) => setFormData({ ...formData, isIndexed: checked })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#1F2A54]" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPage ? "Update" : "Create"} Page
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{pageToDelete?.title}"? This will also delete all
              sections within this page. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
