"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Globe,
  AlertTriangle,
  Check,
  Settings,
  Save,
  X,
} from "lucide-react";

interface PageSEO {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImage: string;
  isIndexed: boolean;
}

const SITE_PAGES = [
  { slug: "home", label: "Home", path: "/" },
  { slug: "about", label: "About", path: "/about" },
  { slug: "apartments", label: "Apartments", path: "/apartments" },
  { slug: "villas", label: "Villas", path: "/villas" },
  { slug: "commercial", label: "Commercial", path: "/commercial" },
  { slug: "plots", label: "Plots", path: "/plots" },
  { slug: "gallery", label: "Gallery", path: "/gallery" },
  { slug: "blog", label: "Blog", path: "/blog" },
  { slug: "contact", label: "Contact", path: "/contact" },
  { slug: "testimonials", label: "Testimonials", path: "/testimonials" },
];

const emptySEO: PageSEO = {
  metaTitle: "",
  metaDescription: "",
  metaKeywords: [],
  ogImage: "",
  isIndexed: true,
};

export default function GlobalSEOPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [seoData, setSeoData] = useState<Record<string, PageSEO>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PageSEO>({ ...emptySEO });
  const [keywordInput, setKeywordInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchAllSEO() {
      const data: Record<string, PageSEO> = {};
      try {
        const results = await Promise.all(
          SITE_PAGES.map(async (p) => {
            try {
              const res = await fetch(`/api/v1/seo/${p.slug}`);
              const json = await res.json().catch(() => ({}));
              return { slug: p.slug, data: json?.data ?? null };
            } catch {
              return { slug: p.slug, data: null };
            }
          })
        );
        for (const r of results) {
          if (r.data) {
            data[r.slug] = {
              metaTitle: r.data.metaTitle ?? "",
              metaDescription: r.data.metaDescription ?? "",
              metaKeywords: Array.isArray(r.data.metaKeywords) ? r.data.metaKeywords : [],
              ogImage: r.data.ogImage ?? "",
              isIndexed: r.data.isIndexed !== false,
            };
          }
        }
        setSeoData(data);
      } catch (err) {
        console.error("Error fetching SEO data:", err);
      } finally {
        setLoadingData(false);
      }
    }
    if (user) {
      fetchAllSEO();
    }
  }, [user]);

  const getScore = (seo: PageSEO | undefined): { score: number; issues: string[] } => {
    if (!seo) return { score: 0, issues: ["No SEO data"] };
    let score = 0;
    const issues: string[] = [];

    if (seo.metaTitle) {
      if (seo.metaTitle.length >= 30 && seo.metaTitle.length <= 60) score += 25;
      else { score += 10; issues.push("Meta title length"); }
    } else issues.push("Missing meta title");

    if (seo.metaDescription) {
      if (seo.metaDescription.length >= 120 && seo.metaDescription.length <= 160) score += 25;
      else { score += 10; issues.push("Meta description length"); }
    } else issues.push("Missing meta description");

    if (seo.metaKeywords && seo.metaKeywords.length >= 3) score += 20;
    else if (seo.metaKeywords && seo.metaKeywords.length > 0) { score += 10; issues.push("Add more keywords"); }
    else issues.push("No keywords");

    if (seo.ogImage) score += 20;
    else issues.push("Missing OG image");

    if (seo.isIndexed) score += 10;

    return { score, issues };
  };

  const overallScore = (() => {
    const scores = SITE_PAGES.map((p) => getScore(seoData[p.slug]).score);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  })();

  const openEdit = (slug: string) => {
    const current = seoData[slug] ?? { ...emptySEO };
    setEditForm({ ...current });
    setKeywordInput("");
    setEditingPage(slug);
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !editForm.metaKeywords.includes(kw)) {
      setEditForm({ ...editForm, metaKeywords: [...editForm.metaKeywords, kw] });
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    setEditForm({ ...editForm, metaKeywords: editForm.metaKeywords.filter((k) => k !== kw) });
  };

  const handleSaveSEO = async () => {
    if (!editingPage || !user?.getIdToken) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/seo/${editingPage}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Save failed");
      setSeoData({ ...seoData, [editingPage]: { ...editForm } });
      setEditingPage(null);
    } catch {
      alert("Error saving SEO data.");
    } finally {
      setSaving(false);
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A54]">SEO Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage SEO settings for all website pages
          </p>
        </div>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Overall Score Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search size={18} /> Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div
                  className={`inline-flex items-center justify-center w-28 h-28 rounded-full text-4xl font-bold ${
                    overallScore >= 80
                      ? "bg-green-100 text-green-600"
                      : overallScore >= 50
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {overallScore}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {overallScore >= 80 ? "Excellent SEO" : overallScore >= 50 ? "Good SEO" : "Needs Work"}
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pages Configured</span>
                  <span className="font-medium">
                    {Object.keys(seoData).length}/{SITE_PAGES.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Indexed Pages</span>
                  <span className="font-medium">
                    {Object.values(seoData).filter((s) => s.isIndexed).length}/{SITE_PAGES.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">With OG Images</span>
                  <span className="font-medium">
                    {Object.values(seoData).filter((s) => s.ogImage).length}/{SITE_PAGES.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pages List */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Pages</CardTitle>
                <CardDescription>Click Edit SEO to configure page-level SEO settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {SITE_PAGES.map((page) => {
                    const seo = seoData[page.slug];
                    const { score, issues } = getScore(seo);
                    return (
                      <div
                        key={page.slug}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {seo?.isIndexed !== false ? (
                            <Globe size={16} className="text-blue-500" />
                          ) : (
                            <Globe size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#1F2A54] truncate">{page.label}</h3>
                          <p className="text-sm text-muted-foreground">{page.path}</p>
                        </div>
                        <div className="flex items-center gap-3 w-48 hidden md:flex">
                          <Progress
                            value={score}
                            className={`h-2 ${
                              score >= 80
                                ? "[&>div]:bg-green-500"
                                : score >= 50
                                ? "[&>div]:bg-yellow-500"
                                : "[&>div]:bg-red-500"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium w-8 ${
                              score >= 80
                                ? "text-green-600"
                                : score >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {score}
                          </span>
                        </div>
                        {issues.length > 0 ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-200 hidden sm:flex">
                            <AlertTriangle size={12} className="mr-1" />
                            {issues.length}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-200 hidden sm:flex">
                            <Check size={12} className="mr-1" />
                            Good
                          </Badge>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openEdit(page.slug)}>
                          <Settings size={14} className="mr-1" /> Edit SEO
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SEO Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Check className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="font-medium">Meta Title</p>
                      <p className="text-muted-foreground">Keep between 30-60 characters</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="font-medium">Meta Description</p>
                      <p className="text-muted-foreground">Write 120-160 characters</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="font-medium">Keywords</p>
                      <p className="text-muted-foreground">Add 3-10 relevant keywords per page</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="font-medium">Open Graph Image</p>
                      <p className="text-muted-foreground">Use 1200x630px for social sharing</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Edit SEO Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => { if (!open) setEditingPage(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit SEO — {SITE_PAGES.find((p) => p.slug === editingPage)?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={editForm.metaTitle}
                onChange={(e) => setEditForm({ ...editForm, metaTitle: e.target.value })}
                placeholder="Page title for search engines"
              />
              <p className="text-xs text-muted-foreground">
                {editForm.metaTitle.length}/60 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={editForm.metaDescription}
                onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                placeholder="Brief page description for search results"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {editForm.metaDescription.length}/160 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label>Meta Keywords</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add a keyword"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                />
                <Button type="button" variant="outline" onClick={addKeyword}>Add</Button>
              </div>
              {editForm.metaKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editForm.metaKeywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="ml-1 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>OG Image</Label>
              <ImageUpload
                value={editForm.ogImage}
                onChange={(url) => setEditForm({ ...editForm, ogImage: url })}
                folder="seo"
                aspectRatio="video"
                placeholder="Upload social sharing image (1200x630)"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Search Engine Indexing</Label>
                <p className="text-xs text-muted-foreground">Allow search engines to index this page</p>
              </div>
              <Switch
                checked={editForm.isIndexed}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isIndexed: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>Cancel</Button>
            <Button onClick={handleSaveSEO} disabled={saving} className="bg-[#1F2A54]">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save SEO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
