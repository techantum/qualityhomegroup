"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial, type Testimonial } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Quote,
} from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Save } from "lucide-react";

export default function TestimonialsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [deletingTestimonial, setDeletingTestimonial] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [savingHero, setSavingHero] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    content: "",
    image: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadTestimonials();
      fetchHero();
    }
  }, [user]);

  const fetchHero = async () => {
    try {
      const res = await fetch("/api/v1/content/pages/testimonials");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.data) {
        setHeroTitle(json.data.heroTitle ?? "");
        setHeroImage(json.data.heroImage ?? "");
      }
    } catch {}
  };

  const handleSaveHero = async () => {
    if (!user?.getIdToken) return;
    setSavingHero(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/v1/content/pages/testimonials", {
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

  const loadTestimonials = async () => {
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error("Error loading testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        name: testimonial.name,
        role: testimonial.role,
        content: testimonial.content,
        image: testimonial.image,
      });
    } else {
      setEditingTestimonial(null);
      setFormData({
        name: "",
        role: "",
        content: "",
        image: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingTestimonial?.id) {
        await updateTestimonial(editingTestimonial.id, formData);
      } else {
        await addTestimonial(formData);
      }
      await loadTestimonials();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving testimonial:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTestimonial?.id) return;
    setSaving(true);
    try {
      await deleteTestimonial(deletingTestimonial.id);
      await loadTestimonials();
      setDeleteDialogOpen(false);
      setDeletingTestimonial(null);
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    } finally {
      setSaving(false);
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
    <div className="p-4 md:p-6">
      {/* Hero Section Settings */}
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-[#1F2A54] mb-1">Hero Section</h3>
            <p className="text-muted-foreground text-sm">Hero banner displayed on the Testimonials page</p>
          </div>
          <div>
            <Label htmlFor="testimonialHeroTitle">Hero Title</Label>
            <Input
              id="testimonialHeroTitle"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="e.g., TESTIMONIALS"
            />
          </div>
          <div>
            <Label>Hero Background Image</Label>
            <ImageUpload
              value={heroImage}
              onChange={setHeroImage}
              folder="cms/testimonials"
              aspectRatio="banner"
              placeholder="Upload testimonials hero image"
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A54]">Testimonials</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage customer testimonials
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white w-full sm:w-auto"
        >
          <Plus size={18} className="mr-2" />
          Add Testimonial
        </Button>
      </div>

      <div>
        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No testimonials yet. Add your first testimonial!</p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-navy hover:bg-navy-dark text-white"
              >
                <Plus size={18} className="mr-2" />
                Add Testimonial
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <Image
                          src={testimonial.image || "/images/testimonial-1.jpg"}
                          alt={testimonial.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy">{testimonial.name}</h3>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenDialog(testimonial)}
                        className="p-2 hover:bg-secondary rounded-full"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingTestimonial(testimonial);
                          setDeleteDialogOpen(true);
                        }}
                        className="p-2 hover:bg-red-50 rounded-full text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="relative pl-6">
                    <Quote size={20} className="absolute left-0 top-0 text-gold" />
                    <p className="text-muted-foreground text-sm italic">
                      {testimonial.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
            <DialogDescription>
              {editingTestimonial ? "Update testimonial details" : "Add a new customer testimonial"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role / Location</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Manager, Hyderabad"
              />
            </div>
            <div className="space-y-2">
              <Label>Photo</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder="testimonials"
                aspectRatio="square"
                preset="avatar"
                placeholder="Upload customer photo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Testimonial</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="What did the customer say about your services..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.content}
              className="bg-navy hover:bg-navy-dark text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Testimonial"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Testimonial</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the testimonial from &quot;{deletingTestimonial?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
