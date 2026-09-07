"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";
import {
  DEFAULT_HOME_WHY_US,
  DEFAULT_HOME_WHY_US_FEATURES,
  normalizeHomeWhyUsContent,
  type HomeWhyUsContent,
  type HomeWhyUsFeature,
} from "@/lib/home-why-us";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

export function HomeWhyUsEditor() {
  const { user } = useAuth();
  const [content, setContent] = useState<HomeWhyUsContent>({
    ...DEFAULT_HOME_WHY_US,
    features: DEFAULT_HOME_WHY_US_FEATURES.map((f) => ({ ...f })),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/content/pages/home-why-us");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setContent(normalizeHomeWhyUsContent(json.data));
        }
      } catch (e) {
        console.error("Error loading why-us:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateFeature = (index: number, patch: Partial<HomeWhyUsFeature>) => {
    setContent((prev) => {
      const features = [...prev.features];
      while (features.length < DEFAULT_HOME_WHY_US_FEATURES.length) {
        features.push({ ...DEFAULT_HOME_WHY_US_FEATURES[features.length] });
      }
      features[index] = { ...features[index], ...patch };
      return { ...prev, features };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await adminApiFetch(user, "/api/v1/content/pages/home-why-us", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      if (json?.data) setContent(normalizeHomeWhyUsContent(json.data));
      alert("Why Us section saved successfully!");
    } catch (e) {
      console.error("Error saving why-us:", e);
      alert(e instanceof Error ? e.message : "Error saving Why Us section.");
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

  const features = content.features.length
    ? content.features
    : DEFAULT_HOME_WHY_US_FEATURES;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Why Us Section</CardTitle>
          <CardDescription>
            Feature icons and image for the homepage Why Quality Home Group block
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1F2A54] hover:bg-[#1F2A54]/90 shrink-0"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
          Save Why Us Section
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="why-eyebrow">Eyebrow</Label>
            <Input
              id="why-eyebrow"
              value={content.eyebrow}
              onChange={(e) => setContent({ ...content, eyebrow: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="why-title">Title</Label>
            <Input
              id="why-title"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="why-description">Description</Label>
          <Textarea
            id="why-description"
            value={content.description}
            onChange={(e) => setContent({ ...content, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <Label>Feature icons</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((item, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-3 bg-secondary/20">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => updateFeature(index, { title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateFeature(index, { description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Icon image</Label>
                  <ImageUpload
                    value={item.icon}
                    onChange={(url) => updateFeature(index, { icon: url })}
                    folder="cms/home-why-us/icons"
                    placeholder="Upload icon"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Section image (right column)</Label>
          <ImageUpload
            value={content.image}
            onChange={(url) => setContent({ ...content, image: url })}
            folder="cms/home-why-us"
            placeholder="Upload why-us section image"
          />
        </div>
      </CardContent>
    </Card>
  );
}
