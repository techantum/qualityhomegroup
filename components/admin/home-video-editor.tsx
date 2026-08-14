"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";
import {
  DEFAULT_HOME_VIDEO,
  normalizeHomeVideoContent,
  type HomeVideoContent,
} from "@/lib/home-video";
import { ImageUpload } from "@/components/admin/image-upload";
import { VideoUpload } from "@/components/admin/video-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

export function HomeVideoEditor() {
  const { user } = useAuth();
  const [content, setContent] = useState<HomeVideoContent>({ ...DEFAULT_HOME_VIDEO });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/content/pages/home-video");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setContent(normalizeHomeVideoContent(json.data));
        }
      } catch (e) {
        console.error("Error loading home video:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await adminApiFetch(user, "/api/v1/content/pages/home-video", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      alert("Video section saved successfully!");
    } catch (e) {
      console.error("Error saving home video:", e);
      alert(e instanceof Error ? e.message : "Error saving video section.");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Section</CardTitle>
        <CardDescription>
          Upload a video and poster image. Visitors play the video inline on the homepage (no popup).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="video-title">Headline</Label>
          <Input
            id="video-title"
            value={content.title}
            onChange={(e) => setContent({ ...content, title: e.target.value })}
            placeholder="Discover a place you'll love to live"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Poster image (shown before play)</Label>
          <ImageUpload
            value={content.posterImage}
            onChange={(url) => setContent({ ...content, posterImage: url })}
            folder="videos"
            placeholder="Upload poster / background image"
            className="mt-2"
          />
        </div>

        <div>
          <Label>Video file</Label>
          <VideoUpload
            value={content.videoUrl}
            onChange={(url) => setContent({ ...content, videoUrl: url })}
            folder="videos"
            placeholder="Drag & drop or upload MP4 / WebM"
            className="mt-2"
          />
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button
            type="button"
            className="bg-[#1F2A54] hover:bg-[#1F2A54]/90"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Video Section
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
