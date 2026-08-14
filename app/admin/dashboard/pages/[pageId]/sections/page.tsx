"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getCMSPages,
  getCMSSections,
  addCMSSection,
  updateCMSSection,
  deleteCMSSection,
  type CMSPage,
  type CMSSection,
  type CMSSectionType,
  type CMSSectionItem,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Type,
  LayoutGrid,
  Users,
  Star,
  Phone,
  FileText,
  Sparkles,
  ArrowUpDown,
  Copy,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";

const SECTION_TYPES: { type: CMSSectionType; label: string; icon: React.ElementType; description: string }[] = [
  { type: "hero", label: "Hero", icon: Sparkles, description: "Main banner with headline" },
  { type: "about", label: "About", icon: FileText, description: "About section content" },
  { type: "services", label: "Services", icon: LayoutGrid, description: "Services grid" },
  { type: "features", label: "Features", icon: Star, description: "Feature highlights" },
  { type: "testimonials", label: "Testimonials", icon: Users, description: "Customer reviews" },
  { type: "gallery", label: "Gallery", icon: ImageIcon, description: "Image gallery" },
  { type: "cta", label: "Call to Action", icon: Phone, description: "CTA block" },
  { type: "contact", label: "Contact", icon: Phone, description: "Contact form/info" },
  { type: "projects", label: "Projects", icon: LayoutGrid, description: "Projects showcase" },
  { type: "team", label: "Team", icon: Users, description: "Team members" },
  { type: "stats", label: "Stats", icon: Type, description: "Statistics numbers" },
  { type: "faq", label: "FAQ", icon: FileText, description: "FAQ section" },
  { type: "custom", label: "Custom", icon: Layers, description: "Custom content" },
];

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default function SectionsManagerPage({ params }: PageProps) {
  const { pageId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [sections, setSections] = useState<CMSSection[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CMSSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<CMSSection | null>(null);

  const [formData, setFormData] = useState<Omit<CMSSection, "id" | "createdAt" | "updatedAt">>({
    pageId: pageId,
    type: "hero",
    title: "",
    subtitle: "",
    description: "",
    buttonText: "",
    buttonUrl: "",
    image: "",
    backgroundImage: "",
    items: [],
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pagesData, sectionsData] = await Promise.all([
          getCMSPages(),
          getCMSSections(pageId),
        ]);
        const currentPage = pagesData.find((p) => p.id === pageId);
        setPage(currentPage || null);
        setSections(sectionsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [user, pageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingSection) {
        await updateCMSSection(editingSection.id!, formData);
        setSections(sections.map((s) => (s.id === editingSection.id ? { ...s, ...formData } : s)));
      } else {
        const id = await addCMSSection({ ...formData, order: sections.length });
        setSections([...sections, { id, ...formData, order: sections.length }]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving section:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (section: CMSSection) => {
    setEditingSection(section);
    setFormData({
      pageId: section.pageId,
      type: section.type,
      title: section.title || "",
      subtitle: section.subtitle || "",
      description: section.description || "",
      buttonText: section.buttonText || "",
      buttonUrl: section.buttonUrl || "",
      image: section.image || "",
      backgroundImage: section.backgroundImage || "",
      items: section.items || [],
      order: section.order,
      isActive: section.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!sectionToDelete) return;

    try {
      await deleteCMSSection(sectionToDelete.id!);
      setSections(sections.filter((s) => s.id !== sectionToDelete.id));
      setDeleteConfirmOpen(false);
      setSectionToDelete(null);
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  const confirmDelete = (section: CMSSection) => {
    setSectionToDelete(section);
    setDeleteConfirmOpen(true);
  };

  const toggleSectionStatus = async (section: CMSSection) => {
    try {
      await updateCMSSection(section.id!, { isActive: !section.isActive });
      setSections(sections.map((s) => (s.id === section.id ? { ...s, isActive: !s.isActive } : s)));
    } catch (error) {
      console.error("Error toggling section status:", error);
    }
  };

  const moveSection = async (section: CMSSection, direction: "up" | "down") => {
    const currentIndex = sections.findIndex((s) => s.id === section.id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(currentIndex, 1);
    newSections.splice(newIndex, 0, movedSection);

    // Update order for affected sections
    const updates = newSections.map((s, i) => ({ ...s, order: i }));
    setSections(updates);

    // Update in database
    try {
      await Promise.all(updates.map((s) => updateCMSSection(s.id!, { order: s.order })));
    } catch (error) {
      console.error("Error reordering sections:", error);
    }
  };

  const duplicateSection = async (section: CMSSection) => {
    try {
      const newSection = {
        ...section,
        title: `${section.title} (Copy)`,
        order: sections.length,
      };
      delete (newSection as { id?: string }).id;
      
      const id = await addCMSSection(newSection);
      setSections([...sections, { ...newSection, id }]);
    } catch (error) {
      console.error("Error duplicating section:", error);
    }
  };

  const resetForm = () => {
    setEditingSection(null);
    setFormData({
      pageId: pageId,
      type: "hero",
      title: "",
      subtitle: "",
      description: "",
      buttonText: "",
      buttonUrl: "",
      image: "",
      backgroundImage: "",
      items: [],
      order: 0,
      isActive: true,
    });
  };

  const getSectionIcon = (type: CMSSectionType) => {
    const sectionType = SECTION_TYPES.find((t) => t.type === type);
    return sectionType?.icon || Layers;
  };

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
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/pages">
            <Button variant="outline" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1F2A54]">
              {page ? `${page.title} Sections` : "Page Sections"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage sections for this page. Drag to reorder.
            </p>
          </div>
        </div>
        <Button
          className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus size={18} className="mr-2" /> Add Section
        </Button>
      </div>

      {/* Sections List */}
      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No sections added to this page yet</p>
            <Button
              className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" /> Add First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => {
              const Icon = getSectionIcon(section.type);
              return (
                <Card key={section.id} className={`${!section.isActive ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="cursor-grab text-muted-foreground">
                        <GripVertical size={20} />
                      </div>

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#1F2A54]/10 flex items-center justify-center flex-shrink-0">
                          <Icon size={20} className="text-[#1F2A54]" />
                        </div>

                        {section.image && (
                          <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0 hidden sm:block">
                            <ImageIcon
                              src={section.image || "/placeholder.svg"}
                              alt=""
                              width={64}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs bg-[#1F2A54]/10 text-[#1F2A54] rounded capitalize">
                              {section.type}
                            </span>
                            {!section.isActive && (
                              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                Hidden
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-[#1F2A54] truncate mt-1">
                            {section.title || "Untitled Section"}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveSection(section, "up")}
                          disabled={index === 0}
                        >
                          <ChevronUp size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveSection(section, "down")}
                          disabled={index === sections.length - 1}
                        >
                          <ChevronDown size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSectionStatus(section)}
                          title={section.isActive ? "Hide section" : "Show section"}
                        >
                          {section.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(section)}>
                              <Pencil size={14} className="mr-2" /> Edit Section
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateSection(section)}>
                              <Copy size={14} className="mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => confirmDelete(section)}
                            >
                              <Trash2 size={14} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Add/Edit Section Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add New Section"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Section Type */}
            <div>
              <Label>Section Type</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {SECTION_TYPES.map((st) => (
                  <button
                    key={st.type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: st.type })}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      formData.type === st.type
                        ? "border-[#1F2A54] bg-[#1F2A54]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <st.icon size={20} className="mx-auto mb-1" />
                    <p className="text-xs font-medium">{st.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Section Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Enter subtitle"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Enter section description (supports rich text)"
              />
            </div>

            {/* Button Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buttonText">Button Text</Label>
                <Input
                  id="buttonText"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  placeholder="e.g., Learn More"
                />
              </div>
              <div>
                <Label htmlFor="buttonUrl">Button URL</Label>
                <Input
                  id="buttonUrl"
                  value={formData.buttonUrl}
                  onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                  placeholder="e.g., /contact"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Section Image</Label>
                <ImageUpload
                  value={formData.image || ""}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  folder="cms/sections"
                  aspectRatio="video"
                  preset="gallery"
                />
              </div>
              <div>
                <Label>Background Image</Label>
                <ImageUpload
                  value={formData.backgroundImage || ""}
                  onChange={(url) => setFormData({ ...formData, backgroundImage: url })}
                  folder="cms/backgrounds"
                  aspectRatio="banner"
                  preset="heroBanner"
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between py-2 border-t">
              <div className="space-y-0.5">
                <Label>Section Visibility</Label>
                <p className="text-xs text-muted-foreground">Show this section on the page</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
                {editingSection ? "Update" : "Add"} Section
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this section? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
