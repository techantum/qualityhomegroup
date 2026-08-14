"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getCMSPages,
  updateCMSPage,
  type CMSPage,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Save,
  Search,
  Globe,
  Eye,
  EyeOff,
  X,
  Plus,
  AlertTriangle,
  Check,
} from "lucide-react";
import { ImageUpload, IMAGE_PRESETS } from "@/components/admin/image-upload";

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default function SEOManagerPage({ params }: PageProps) {
  const { pageId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const [formData, setFormData] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [] as string[],
    ogImage: "",
    isIndexed: true,
    slug: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const pagesData = await getCMSPages();
        const currentPage = pagesData.find((p) => p.id === pageId);
        if (currentPage) {
          setPage(currentPage);
          setFormData({
            metaTitle: currentPage.metaTitle || currentPage.title || "",
            metaDescription: currentPage.metaDescription || "",
            metaKeywords: currentPage.metaKeywords || [],
            ogImage: currentPage.ogImage || "",
            isIndexed: currentPage.isIndexed ?? true,
            slug: currentPage.slug || "",
          });
        }
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setLoadingData(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [user, pageId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      await updateCMSPage(pageId, {
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        metaKeywords: formData.metaKeywords,
        ogImage: formData.ogImage,
        isIndexed: formData.isIndexed,
        slug: formData.slug,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving SEO settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.metaKeywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        metaKeywords: [...formData.metaKeywords, keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      metaKeywords: formData.metaKeywords.filter((k) => k !== keyword),
    });
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // SEO Score calculation
  const getSEOScore = () => {
    let score = 0;
    const issues: string[] = [];
    const passed: string[] = [];

    // Meta title
    if (formData.metaTitle) {
      if (formData.metaTitle.length >= 30 && formData.metaTitle.length <= 60) {
        score += 25;
        passed.push("Meta title length is optimal");
      } else if (formData.metaTitle.length < 30) {
        score += 10;
        issues.push("Meta title is too short (30-60 chars recommended)");
      } else {
        score += 15;
        issues.push("Meta title is too long (30-60 chars recommended)");
      }
    } else {
      issues.push("Meta title is missing");
    }

    // Meta description
    if (formData.metaDescription) {
      if (formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160) {
        score += 25;
        passed.push("Meta description length is optimal");
      } else if (formData.metaDescription.length < 120) {
        score += 10;
        issues.push("Meta description is too short (120-160 chars recommended)");
      } else {
        score += 15;
        issues.push("Meta description is too long (120-160 chars recommended)");
      }
    } else {
      issues.push("Meta description is missing");
    }

    // Keywords
    if (formData.metaKeywords.length >= 3 && formData.metaKeywords.length <= 10) {
      score += 20;
      passed.push("Keywords count is optimal");
    } else if (formData.metaKeywords.length > 0) {
      score += 10;
      issues.push("Add 3-10 keywords for better SEO");
    } else {
      issues.push("No keywords added");
    }

    // OG Image
    if (formData.ogImage) {
      score += 20;
      passed.push("Open Graph image is set");
    } else {
      issues.push("Open Graph image is missing");
    }

    // Indexing
    if (formData.isIndexed) {
      score += 10;
      passed.push("Page is indexed by search engines");
    } else {
      issues.push("Page is not being indexed (noindex)");
    }

    return { score, issues, passed };
  };

  const seoAnalysis = getSEOScore();

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
              SEO Settings: {page?.title || "Page"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Optimize this page for search engines
            </p>
          </div>
        </div>
        <Button
          className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* URL Slug */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe size={18} /> URL Slug
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/</span>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    placeholder="page-url-slug"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Full URL: {typeof window !== "undefined" ? window.location.origin : ""}
                  /{formData.slug}
                </p>
              </CardContent>
            </Card>

            {/* Meta Title */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meta Title</CardTitle>
                <CardDescription>
                  The title that appears in search results and browser tabs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="Enter meta title"
                  maxLength={70}
                />
                <div className="flex justify-between mt-2 text-xs">
                  <span className={formData.metaTitle.length > 60 ? "text-red-500" : "text-muted-foreground"}>
                    {formData.metaTitle.length}/60 characters
                  </span>
                  <span className="text-muted-foreground">Recommended: 30-60 characters</span>
                </div>
              </CardContent>
            </Card>

            {/* Meta Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meta Description</CardTitle>
                <CardDescription>
                  A brief summary that appears in search results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Enter meta description"
                  rows={3}
                  maxLength={200}
                />
                <div className="flex justify-between mt-2 text-xs">
                  <span className={formData.metaDescription.length > 160 ? "text-red-500" : "text-muted-foreground"}>
                    {formData.metaDescription.length}/160 characters
                  </span>
                  <span className="text-muted-foreground">Recommended: 120-160 characters</span>
                </div>
              </CardContent>
            </Card>

            {/* Meta Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meta Keywords</CardTitle>
                <CardDescription>
                  Keywords that help search engines understand your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Add a keyword"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" variant="outline" onClick={addKeyword}>
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.metaKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)} className="ml-1 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                  {formData.metaKeywords.length === 0 && (
                    <p className="text-sm text-muted-foreground">No keywords added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Open Graph Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Open Graph Image</CardTitle>
                <CardDescription>
                  Image displayed when sharing on social media (1200x630px recommended)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={formData.ogImage}
                  onChange={(url) => setFormData({ ...formData, ogImage: url })}
                  folder="seo/og-images"
                  aspectRatio="video"
                  preset="ogImage"
                />
              </CardContent>
            </Card>

            {/* Indexing */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {formData.isIndexed ? (
                      <Eye size={20} className="text-green-600" />
                    ) : (
                      <EyeOff size={20} className="text-red-500" />
                    )}
                    <div>
                      <Label className="text-base">Search Engine Indexing</Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.isIndexed
                          ? "Search engines can index this page"
                          : "This page is hidden from search engines (noindex)"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isIndexed}
                    onCheckedChange={(checked) => setFormData({ ...formData, isIndexed: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SEO Score Sidebar */}
          <div className="space-y-6">
            {/* Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search size={18} /> SEO Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div
                    className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${
                      seoAnalysis.score >= 80
                        ? "bg-green-100 text-green-600"
                        : seoAnalysis.score >= 50
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {seoAnalysis.score}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {seoAnalysis.score >= 80
                      ? "Excellent"
                      : seoAnalysis.score >= 50
                      ? "Good"
                      : "Needs Improvement"}
                  </p>
                </div>

                {/* Issues */}
                {seoAnalysis.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-600">
                      <AlertTriangle size={14} /> Issues ({seoAnalysis.issues.length})
                    </h4>
                    <ul className="space-y-1">
                      {seoAnalysis.issues.map((issue, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <X size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Passed */}
                {seoAnalysis.passed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-green-600">
                      <Check size={14} /> Passed ({seoAnalysis.passed.length})
                    </h4>
                    <ul className="space-y-1">
                      {seoAnalysis.passed.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <Check size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-green-700 truncate">
                    {typeof window !== "undefined" ? window.location.origin : "example.com"}/{formData.slug}
                  </p>
                  <h3 className="text-blue-700 text-lg font-medium hover:underline truncate mt-1">
                    {formData.metaTitle || "Page Title"}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {formData.metaDescription || "Add a meta description to see how it appears in search results."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
