"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";
import {
  DEFAULT_HOME_ABOUT,
  DEFAULT_HOME_ABOUT_PROPERTY_TYPES,
  normalizeHomeAboutContent,
  type HomeAboutContent,
  type HomeAboutPropertyType,
} from "@/lib/home-about";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

export function HomeAboutEditor() {
  const { user } = useAuth();
  const [content, setContent] = useState<HomeAboutContent>({
    ...DEFAULT_HOME_ABOUT,
    propertyTypes: [...DEFAULT_HOME_ABOUT_PROPERTY_TYPES],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/content/pages/home-about");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          const normalized = normalizeHomeAboutContent(json.data);
          if (normalized) setContent(normalized);
        }
      } catch (e) {
        console.error("Error loading home about:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updatePropertyType = (index: number, patch: Partial<HomeAboutPropertyType>) => {
    setContent((prev) => {
      const types = [...prev.propertyTypes];
      while (types.length < 4) {
        types.push({ ...DEFAULT_HOME_ABOUT_PROPERTY_TYPES[types.length] });
      }
      types[index] = { ...types[index], ...patch };
      return { ...prev, propertyTypes: types };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await adminApiFetch(user, "/api/v1/content/pages/home-about", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      if (json?.data) {
        const normalized = normalizeHomeAboutContent(json.data);
        if (normalized) setContent(normalized);
      }
      alert("About section saved successfully!");
    } catch (e) {
      console.error("Error saving home about:", e);
      alert(e instanceof Error ? e.message : "Error saving about section.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </div>
    );
  }

  const propertyTypes = content.propertyTypes.length
    ? content.propertyTypes
    : DEFAULT_HOME_ABOUT_PROPERTY_TYPES;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>About Section</CardTitle>
          <CardDescription>
            Content and layout for the About block on the homepage (matches site design)
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1F2A54] hover:bg-[#1F2A54]/90 shrink-0"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
          Save About Section
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="about-eyebrow">Eyebrow / subheading</Label>
            <Input
              id="about-eyebrow"
              value={content.eyebrow}
              onChange={(e) => setContent({ ...content, eyebrow: e.target.value })}
              placeholder="About Quality Home Group"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="about-heading">Main heading</Label>
            <Input
              id="about-heading"
              value={content.heading}
              onChange={(e) => setContent({ ...content, heading: e.target.value })}
              placeholder="We Are The Leader In The Architectural"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="about-p1">Paragraph 1</Label>
            <Textarea
              id="about-p1"
              value={content.paragraph1}
              onChange={(e) => setContent({ ...content, paragraph1: e.target.value })}
              rows={4}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="about-p2">Paragraph 2</Label>
            <Textarea
              id="about-p2"
              value={content.paragraph2}
              onChange={(e) => setContent({ ...content, paragraph2: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Property type icons (4 items)</Label>
          <p className="text-xs text-muted-foreground">
            Upload a line icon or image for each category (PNG/SVG recommended).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {propertyTypes.slice(0, 4).map((item, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-3 bg-secondary/20">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    value={item.label}
                    onChange={(e) => updatePropertyType(index, { label: e.target.value })}
                    placeholder="Apartments"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Icon image</Label>
                  <ImageUpload
                    value={item.image}
                    onChange={(url) => updatePropertyType(index, { image: url })}
                    folder="cms/home-about/icons"
                    placeholder="Upload icon"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="about-btn-text">Button text</Label>
            <Input
              id="about-btn-text"
              value={content.buttonText}
              onChange={(e) => setContent({ ...content, buttonText: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about-btn-link">Button link</Label>
            <Input
              id="about-btn-link"
              value={content.buttonLink}
              onChange={(e) => setContent({ ...content, buttonLink: e.target.value })}
              placeholder="/about"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Section image (right column)</Label>
          <ImageUpload
            value={content.image}
            onChange={(url) => setContent({ ...content, image: url })}
            folder="cms/home-about"
            placeholder="Upload about section image"
          />
        </div>
      </CardContent>
    </Card>
  );
}
