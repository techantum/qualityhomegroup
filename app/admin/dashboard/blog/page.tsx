"use client";

import React from "react"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { getArticles, addArticle, updateArticle, deleteArticle, type Article } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Eye, Save } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";

const categories = ["Apartment", "Villa", "Commercial", "Office", "Shop", "News", "Tips"];

export default function BlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [savingHero, setSavingHero] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    image: "",
    excerpt: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const data = await getArticles();
        setArticles(data);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoadingData(false);
      }
    }
    async function fetchHero() {
      try {
        const res = await fetch("/api/v1/content/pages/blog");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setHeroTitle(json.data.heroTitle ?? "");
          setHeroImage(json.data.heroImage ?? "");
        }
      } catch {}
    }
    if (user) {
      fetchArticles();
      fetchHero();
    }
  }, [user]);

  const handleSaveHero = async () => {
    if (!user?.getIdToken) return;
    setSavingHero(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/v1/content/pages/blog", {
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
      if (editingArticle) {
        await updateArticle(editingArticle.id!, formData);
        setArticles(articles.map(a => a.id === editingArticle.id ? { ...a, ...formData } : a));
      } else {
        const id = await addArticle(formData);
        setArticles([{ id, ...formData }, ...articles]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving article:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      category: article.category,
      date: article.date,
      image: article.image,
      excerpt: article.excerpt || "",
      content: article.content || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await deleteArticle(id);
      setArticles(articles.filter(a => a.id !== id));
    } catch (error) {
      console.error("Error deleting article:", error);
    }
  };

  const resetForm = () => {
    setEditingArticle(null);
    setFormData({
      title: "",
      category: "",
      date: new Date().toISOString().split('T')[0],
      image: "",
      excerpt: "",
      content: "",
    });
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
      {/* Hero Section Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Hero banner displayed on the Blog page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="blogHeroTitle">Hero Title</Label>
            <Input
              id="blogHeroTitle"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="e.g., OUR BLOG"
            />
          </div>
          <div>
            <Label>Hero Background Image</Label>
            <ImageUpload
              value={heroImage}
              onChange={setHeroImage}
              folder="cms/blog"
              aspectRatio="banner"
              placeholder="Upload blog hero image"
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

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-[#1F2A54]">Blog Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">
              <Plus size={18} className="mr-2" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "Create New Article"}</DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Featured Image</Label>
                <ImageUpload
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  folder="blog"
                  aspectRatio="video"
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Short description..."
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  placeholder="Full article content..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#1F2A54]" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingArticle ? "Update" : "Publish"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No blog posts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {article.image && (
                    <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={article.image || "/placeholder.svg"} alt={article.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-medium text-red-500">{article.category}</span>
                        <span className="text-sm text-muted-foreground ml-2">{article.date}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => handleEdit(article)}>
                          <Pencil size={16} />
                        </Button>
                        <Button size="icon" variant="outline" className="text-red-500 bg-transparent" onClick={() => handleDelete(article.id!)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-[#1F2A54] text-lg mt-1">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.excerpt}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
