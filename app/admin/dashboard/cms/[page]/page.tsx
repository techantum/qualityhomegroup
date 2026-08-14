"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import type { PageContent } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Plus, Trash2, AlertCircle } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";

const pageConfig: Record<string, { title: string; description: string }> = {
  apartments: { title: "Apartments Page", description: "Manage apartments listing page content" },
  villas: { title: "Villas Page", description: "Manage villas listing page content" },
  commercial: { title: "Commercial Page", description: "Manage commercial properties page content" },
  plots: { title: "Plots Page", description: "Manage open plots page content" },
  "home-why-us": { title: "Home — Why Us", description: "Homepage why-us section (title, features, image)" },
  "home-video": { title: "Home — Video", description: "Homepage video section (title, video URL, poster)" },
};

interface Section {
  id: string;
  title: string;
  content: string;
  image?: string;
}

export default function CMSGenericPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pageName = params.page as string;
  const config = pageConfig[pageName] || { title: `${pageName} Page`, description: "Manage page content" };

  const [content, setContent] = useState<PageContent>({
    pageName: pageName,
    title: "",
    subtitle: "",
    content: "",
    heroImage: "",
    sections: [],
  });
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`/api/v1/content/pages/${pageName}`);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          const data = json.data;
          setContent({
            pageName: data.pageName ?? pageName,
            title: data.title ?? "",
            subtitle: data.subtitle ?? "",
            content: data.content ?? "",
            heroImage: data.heroImage ?? "",
            sections: data.sections ?? [],
          });
          setSections((data.sections as Section[]) || []);
        } else {
          setContent({ pageName: pageName, title: "", subtitle: "", content: "", heroImage: "", sections: [] });
          setSections([]);
        }
      } catch {
        setContent({ pageName: pageName, title: "", subtitle: "", content: "", heroImage: "", sections: [] });
        setSections([]);
      } finally {
        setLoadingData(false);
      }
    }
    if (user && pageName) {
      fetchContent();
    }
  }, [user, pageName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.getIdToken) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/content/pages/${pageName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...content, sections }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      alert("Page content saved!");
    } catch (error) {
      console.error("Error saving content:", error);
      alert(error instanceof Error ? error.message : "Error saving content. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setSections([...sections, { id: Date.now().toString(), title: "", content: "", image: "" }]);
  };

  const updateSection = (id: string, field: keyof Section, value: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
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
        <h1 className="text-2xl font-bold text-[#1F2A54] capitalize">{config.title}</h1>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Main banner content for this page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={content.title}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  placeholder="Enter page title"
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={content.subtitle || ""}
                  onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                  placeholder="Enter subtitle"
                />
              </div>
              <div>
                <Label>Hero Image</Label>
                <ImageUpload
                  value={content.heroImage || ""}
                  onChange={(url) => setContent({ ...content, heroImage: url })}
                  folder={`cms/${pageName}`}
                  aspectRatio="banner"
                />
              </div>
              <div>
                <Label htmlFor="content">Main Content</Label>
                <Textarea
                  id="content"
                  value={content.content || ""}
                  onChange={(e) => setContent({ ...content, content: e.target.value })}
                  placeholder="Enter main page content"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Content Sections</CardTitle>
                <CardDescription>Add additional content sections</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={addSection}>
                <Plus size={16} className="mr-2" /> Add Section
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No sections added yet</p>
              ) : (
                sections.map((section, index) => (
                  <div key={section.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1F2A54]">Section {index + 1}</span>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeSection(section.id)}
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div>
                      <Label>Section Title</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        placeholder="Section heading"
                      />
                    </div>
                    <div>
                      <Label>Section Content</Label>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                        placeholder="Section content"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Section Image (optional)</Label>
                      <ImageUpload
                        value={section.image || ""}
                        onChange={(url) => updateSection(section.id, 'image', url)}
                        folder={`cms/${pageName}/sections`}
                        aspectRatio="video"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="bg-[#1F2A54]" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
