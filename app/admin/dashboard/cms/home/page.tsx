"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";
import { fetchHeroSlidesPublic } from "@/lib/hero-slides";
import {
  getProjects, getTestimonials, getArticles,
  type HeroSlide, type Project, type Testimonial, type Article
} from "@/lib/firestore";
import { AdminPreviewImage } from "@/components/admin/admin-preview-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Plus, Pencil, Trash2, ImageIcon, 
  MoveUp, MoveDown, Layers, MessageSquare,
  Newspaper, Building, ArrowRight, Video
} from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { HomeAboutEditor } from "@/components/admin/home-about-editor";
import { HomeVideoEditor } from "@/components/admin/home-video-editor";

const HEADLINE_MAX = 80;
const SUBHEADLINE_MAX = 120;

export default function CMSHomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("hero");
  
  // Hero Slides State
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loadingHero, setLoadingHero] = useState(true);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideForm, setSlideForm] = useState({
    headline: "",
    subheadline: "",
    backgroundImage: "",
    order: 0,
  });
  const [savingSlide, setSavingSlide] = useState(false);

  // Other sections state
  const [projects, setProjects] = useState<Project[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingOther, setLoadingOther] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [slidesData, projectsData, testimonialsData, articlesData] = await Promise.all([
          fetchHeroSlidesPublic(),
          getProjects(),
          getTestimonials(),
          getArticles(),
        ]);
        setHeroSlides(slidesData);
        setProjects(projectsData);
        setTestimonials(testimonialsData);
        setArticles(articlesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingHero(false);
        setLoadingOther(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [user]);

  const canSaveSlide =
    slideForm.headline.trim().length > 0 && slideForm.backgroundImage.trim().length > 0;

  const handleSaveSlide = async () => {
    if (!user) return;
    if (!canSaveSlide) {
      alert("Please add a headline and background image before saving.");
      return;
    }
    setSavingSlide(true);
    try {
      if (editingSlide?.id) {
        const res = await adminApiFetch(user, `/api/v1/content/hero/slides/${editingSlide.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...slideForm,
            order: slideForm.order || editingSlide.order,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
        setHeroSlides(heroSlides.map((s) => (s.id === editingSlide.id ? { ...s, ...slideForm } : s)));
      } else {
        const newOrder = heroSlides.length > 0 ? Math.max(...heroSlides.map((s) => s.order)) + 1 : 1;
        const res = await adminApiFetch(user, "/api/v1/content/hero/slides", {
          method: "POST",
          body: JSON.stringify({ ...slideForm, order: newOrder }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
        const id = String(json?.data?.id ?? "");
        setHeroSlides([...heroSlides, { id, ...slideForm, order: newOrder }]);
      }
      const slidesData = await fetchHeroSlidesPublic();
      setHeroSlides(slidesData);
      setShowSlideModal(false);
      resetSlideForm();
    } catch (error) {
      console.error("Error saving slide:", error);
      alert(error instanceof Error ? error.message : "Error saving slide.");
    } finally {
      setSavingSlide(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!user || !confirm("Are you sure you want to delete this slide?")) return;
    try {
      const res = await adminApiFetch(user, `/api/v1/content/hero/slides/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Delete failed (${res.status})`);
      setHeroSlides(heroSlides.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting slide:", error);
      alert(error instanceof Error ? error.message : "Error deleting slide.");
    }
  };

  const handleMoveSlide = async (id: string, direction: "up" | "down") => {
    const sortedSlides = [...heroSlides].sort((a, b) => a.order - b.order);
    const index = sortedSlides.findIndex(s => s.id === id);
    if ((direction === "up" && index === 0) || (direction === "down" && index === sortedSlides.length - 1)) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const temp = sortedSlides[index].order;
    sortedSlides[index].order = sortedSlides[newIndex].order;
    sortedSlides[newIndex].order = temp;
    
    setHeroSlides([...sortedSlides]);
    
    if (!user) return;

    const putSlide = (slide: HeroSlide) =>
      adminApiFetch(user, `/api/v1/content/hero/slides/${slide.id}`, {
        method: "PUT",
        body: JSON.stringify({
          headline: slide.headline,
          subheadline: slide.subheadline,
          backgroundImage: slide.backgroundImage,
          order: slide.order,
        }),
      });

    try {
      const [resA, resB] = await Promise.all([
        putSlide(sortedSlides[index]),
        putSlide(sortedSlides[newIndex]),
      ]);
      if (!resA.ok || !resB.ok) {
        const errA = await resA.json().catch(() => ({}));
        const errB = await resB.json().catch(() => ({}));
        throw new Error(errA?.error ?? errB?.error ?? "Reorder failed");
      }
    } catch (error) {
      console.error("Error reordering slides:", error);
      alert(error instanceof Error ? error.message : "Error reordering slides.");
      fetchHeroSlidesPublic().then(setHeroSlides).catch(() => {});
    }
  };

  const openEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setSlideForm({
      headline: slide.headline,
      subheadline: slide.subheadline,
      backgroundImage: slide.backgroundImage,
      order: slide.order,
    });
    setShowSlideModal(true);
  };

  const resetSlideForm = () => {
    setEditingSlide(null);
    setSlideForm({ headline: "", subheadline: "", backgroundImage: "", order: 0 });
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2A54]">Home Page CMS</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage all sections of your homepage
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex flex-wrap gap-2 h-auto bg-transparent p-0">
          <TabsTrigger value="hero" className="data-[state=active]:bg-[#1F2A54] data-[state=active]:text-white">
            <Layers size={16} className="mr-2" /> Hero Carousel
          </TabsTrigger>
          <TabsTrigger value="about" className="data-[state=active]:bg-[#1F2A54] data-[state=active]:text-white">
            <Building size={16} className="mr-2" /> About Section
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-[#1F2A54] data-[state=active]:text-white">
            <ImageIcon size={16} className="mr-2" /> Latest Projects
          </TabsTrigger>
          <TabsTrigger value="video" className="data-[state=active]:bg-[#1F2A54] data-[state=active]:text-white">
            <Video size={16} className="mr-2" /> Video Section
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="data-[state=active]:bg-[#1F2A54] data-[state=active]:text-white">
            <MessageSquare size={16} className="mr-2" /> Testimonials
          </TabsTrigger>
          <TabsTrigger value="news" className="data-[state=active]:bg-[#1F2A54] data-[state=active]:text-white">
            <Newspaper size={16} className="mr-2" /> News & Articles
          </TabsTrigger>
        </TabsList>

        {/* Hero Carousel Tab */}
        <TabsContent value="hero">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hero Carousel Slides</CardTitle>
                <CardDescription>Manage the hero banner slides on your homepage</CardDescription>
              </div>
              <Button 
                onClick={() => { resetSlideForm(); setShowSlideModal(true); }}
                className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
              >
                <Plus size={16} className="mr-2" /> Add Slide
              </Button>
            </CardHeader>
            <CardContent>
              {loadingHero ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
                </div>
              ) : heroSlides.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hero slides yet</p>
                  <Button 
                    onClick={() => { resetSlideForm(); setShowSlideModal(true); }}
                    variant="outline" 
                    className="mt-4"
                  >
                    <Plus size={16} className="mr-2" /> Add Your First Slide
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {heroSlides.sort((a, b) => a.order - b.order).map((slide, index) => (
                    <div key={slide.id} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={index === 0}
                          onClick={() => handleMoveSlide(slide.id!, "up")}
                        >
                          <MoveUp size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={index === heroSlides.length - 1}
                          onClick={() => handleMoveSlide(slide.id!, "down")}
                        >
                          <MoveDown size={16} />
                        </Button>
                      </div>
                      <div className="w-32 h-20 relative rounded overflow-hidden flex-shrink-0">
                        <AdminPreviewImage
                          src={slide.backgroundImage}
                          alt={slide.headline}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#1F2A54] truncate">{slide.headline}</h3>
                        <p className="text-sm text-muted-foreground truncate">{slide.subheadline}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditSlide(slide)}>
                          <Pencil size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 bg-transparent"
                          onClick={() => handleDeleteSlide(slide.id!)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Section Tab */}
        <TabsContent value="about">
          <HomeAboutEditor />
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Latest Projects</CardTitle>
                <CardDescription>Showing the most recent {Math.min(projects.length, 6)} projects on homepage</CardDescription>
              </div>
              <Button asChild className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">
                <Link href="/admin/dashboard/projects">
                  Manage All Projects <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingOther ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No projects yet</p>
                  <Button asChild variant="outline" className="mt-4 bg-transparent">
                    <Link href="/admin/dashboard/projects">
                      <Plus size={16} className="mr-2" /> Add Your First Project
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.slice(0, 6).map((project) => (
                    <div key={project.id} className="border rounded-lg overflow-hidden">
                      <div className="h-32 relative">
                        <AdminPreviewImage
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-[#1F2A54] truncate">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">{project.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Section Tab */}
        <TabsContent value="video">
          <HomeVideoEditor />
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Testimonials</CardTitle>
                <CardDescription>Showing {Math.min(testimonials.length, 4)} testimonials on homepage</CardDescription>
              </div>
              <Button asChild className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">
                <Link href="/admin/dashboard/testimonials">
                  Manage Testimonials <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingOther ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
                </div>
              ) : testimonials.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No testimonials yet</p>
                  <Button asChild variant="outline" className="mt-4 bg-transparent">
                    <Link href="/admin/dashboard/testimonials">
                      <Plus size={16} className="mr-2" /> Add Your First Testimonial
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testimonials.slice(0, 4).map((testimonial) => (
                    <div key={testimonial.id} className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{testimonial.content}</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary" />
                        <div>
                          <p className="font-semibold text-[#1F2A54] text-sm">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Articles & News</CardTitle>
                <CardDescription>Showing {Math.min(articles.length, 4)} articles on homepage</CardDescription>
              </div>
              <Button asChild className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">
                <Link href="/admin/dashboard/blog">
                  Manage Blog <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingOther ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No articles yet</p>
                  <Button asChild variant="outline" className="mt-4 bg-transparent">
                    <Link href="/admin/dashboard/blog">
                      <Plus size={16} className="mr-2" /> Add Your First Article
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.slice(0, 4).map((article) => (
                    <div key={article.id} className="border rounded-lg overflow-hidden">
                      <div className="h-32 relative">
                        <AdminPreviewImage
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-amber-600 mb-1">{article.category}</p>
                        <h4 className="font-semibold text-[#1F2A54] text-sm line-clamp-2">{article.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Slide Modal */}
      <Dialog
        open={showSlideModal}
        onOpenChange={(open) => {
          setShowSlideModal(open);
          if (!open) resetSlideForm();
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{editingSlide ? "Edit Slide" : "Add New Slide"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
            {/* Background Image Upload */}
            <div>
              <label className="text-sm font-medium">
                Background Image <span className="text-red-500">*</span>
              </label>
              <ImageUpload
                value={slideForm.backgroundImage}
                onChange={(url) => setSlideForm({ ...slideForm, backgroundImage: url })}
                folder="hero"
                aspectRatio="video"
                preset="heroBanner"
                placeholder="Drag & drop or click to upload hero image"
              />
            </div>

            {/* Headline */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">
                  Headline <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${slideForm.headline.length > HEADLINE_MAX ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                  {slideForm.headline.length}/{HEADLINE_MAX}
                </span>
              </div>
              <Textarea
                value={slideForm.headline}
                onChange={(e) => {
                  if (e.target.value.length <= HEADLINE_MAX) {
                    setSlideForm({ ...slideForm, headline: e.target.value });
                  }
                }}
                placeholder="A HIGHER QUALITY OF LIVING."
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">First line appears in gold, remaining lines in white</p>
            </div>

            {/* Subheadline */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Subheadline</label>
                <span className={`text-xs ${slideForm.subheadline.length > SUBHEADLINE_MAX ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                  {slideForm.subheadline.length}/{SUBHEADLINE_MAX}
                </span>
              </div>
              <Input
                value={slideForm.subheadline}
                onChange={(e) => {
                  if (e.target.value.length <= SUBHEADLINE_MAX) {
                    setSlideForm({ ...slideForm, subheadline: e.target.value });
                  }
                }}
                placeholder="THAT BRING YOUR ASPIRATIONS TO LIFE."
              />
            </div>

            {/* Live Preview */}
            {slideForm.backgroundImage && (
              <div className="relative h-40 rounded-lg overflow-hidden border">
                <AdminPreviewImage
                  src={slideForm.backgroundImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6">
                  <h3 className="font-royal text-lg text-[#DDA21A] leading-tight max-w-sm">
                    {slideForm.headline.split("\n")[0] || "Headline Preview"}
                  </h3>
                  {slideForm.headline.split("\n").slice(1).map((line, i) => (
                    <p key={i} className="font-royal text-lg text-white leading-tight max-w-sm">{line}</p>
                  ))}
                  <p className="text-white/80 text-sm mt-2 max-w-sm">
                    {slideForm.subheadline || "Subheadline preview"}
                  </p>
                </div>
              </div>
            )}

            {!canSaveSlide && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Add a headline and background image to enable save.
              </p>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={() => setShowSlideModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveSlide}
              disabled={savingSlide}
              className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
            >
              {savingSlide ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingSlide ? "Update Slide" : "Add Slide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
