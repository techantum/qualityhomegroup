"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getHeroSlides,
  addHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  type HeroSlide,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";

export default function HeroPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    headline: "",
    subheadline: "",
    backgroundImage: "",
    order: 1,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadSlides();
    }
  }, [user]);

  const loadSlides = async () => {
    try {
      const data = await getHeroSlides();
      setSlides(data);
    } catch (error) {
      console.error("Error loading slides:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({
        headline: slide.headline,
        subheadline: slide.subheadline,
        backgroundImage: slide.backgroundImage,
        order: slide.order,
      });
    } else {
      setEditingSlide(null);
      setFormData({
        headline: "",
        subheadline: "",
        backgroundImage: "",
        order: slides.length + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSlide(null);
    setFormData({
      headline: "",
      subheadline: "",
      backgroundImage: "",
      order: 1,
    });
  };

  const handleSave = async () => {
    if (!formData.headline || !formData.backgroundImage) {
      alert("Please fill in headline and background image");
      return;
    }

    setSaving(true);
    try {
      if (editingSlide?.id) {
        await updateHeroSlide(editingSlide.id, formData);
      } else {
        await addHeroSlide(formData);
      }
      await loadSlides();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving slide:", error);
      alert("Error saving slide. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    try {
      await deleteHeroSlide(id);
      await loadSlides();
    } catch (error) {
      console.error("Error deleting slide:", error);
      alert("Error deleting slide. Please try again.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-semibold text-navy">
              Hero Carousel Slides
            </h1>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-navy hover:bg-navy-dark text-white"
          >
            <Plus size={18} className="mr-2" />
            Add Slide
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-6xl mx-auto">
        {slides.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Plus size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No slides yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first hero carousel slide to get started
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-navy hover:bg-navy-dark text-white"
              >
                <Plus size={18} className="mr-2" />
                Add First Slide
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {slides.map((slide, index) => (
              <Card key={slide.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Image Preview */}
                  <div className="relative w-full md:w-80 h-48 md:h-auto flex-shrink-0">
                    <Image
                      src={slide.backgroundImage || "/images/hero-bg.jpg"}
                      alt={slide.headline}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-navy text-white text-xs px-2 py-1 rounded">
                      Slide {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-royal text-xl text-navy mb-2">
                          {slide.headline}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {slide.subheadline}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenDialog(slide)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          onClick={() => slide.id && handleDelete(slide.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Order: {slide.order} | Image:{" "}
                        {slide.backgroundImage.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSlide ? "Edit Slide" : "Add New Slide"}
            </DialogTitle>
            <DialogDescription>
              {editingSlide
                ? "Update the hero carousel slide details"
                : "Create a new hero carousel slide"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview */}
            {formData.backgroundImage && (
              <div className="relative h-40 rounded-lg overflow-hidden mb-4">
                <Image
                  src={formData.backgroundImage || "/placeholder.svg"}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-center p-6">
                  <h2 className="font-royal text-xl text-white leading-tight max-w-xs">
                    {formData.headline || "Headline Preview"}
                  </h2>
                  <p className="text-white/80 text-sm mt-2 max-w-xs">
                    {formData.subheadline || "Subheadline preview"}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="headline">
                Headline <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="headline"
                value={formData.headline}
                onChange={(e) =>
                  setFormData({ ...formData, headline: e.target.value })
                }
                placeholder="A HIGHER QUALITY&#10;OF LIVING."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Use line breaks for multi-line headlines. First line will be
                gold, rest will be white.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheadline">Subheadline</Label>
              <Input
                id="subheadline"
                value={formData.subheadline}
                onChange={(e) =>
                  setFormData({ ...formData, subheadline: e.target.value })
                }
                placeholder="THAT BRING YOUR ASPIRATIONS TO LIFE."
              />
            </div>

            <div className="space-y-2">
              <Label>
                Background Image <span className="text-red-500">*</span>
              </Label>
              <ImageUpload
                value={formData.backgroundImage}
                onChange={(url) =>
                  setFormData({ ...formData, backgroundImage: url })
                }
                folder="hero"
                aspectRatio="video"
                preset="heroBanner"
                placeholder="Drag & drop or click to upload hero image"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 1 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in the carousel
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-navy hover:bg-navy-dark text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingSlide ? (
                "Update Slide"
              ) : (
                "Add Slide"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
