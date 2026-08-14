"use client";

import React from "react"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { ContactInfo } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";

export default function CMSContactPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState<ContactInfo & { heroTitle?: string; heroImage?: string }>({
    address: "",
    phone: "",
    email: "",
    mapUrl: "",
    heroTitle: "",
    heroImage: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      linkedin: "",
      youtube: "",
    },
  });
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
        const res = await fetch("/api/v1/content/contact");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setContent((prev) => ({ ...prev, ...json.data }));
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      } finally {
        setLoadingData(false);
      }
    }
    if (user) {
      fetchContent();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.getIdToken) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/v1/content/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(content),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      alert("Contact information saved!");
    } catch (error) {
      console.error("Error saving content:", error);
      alert(error instanceof Error ? error.message : "Error saving content. Please try again.");
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2A54]">Contact Page CMS</h1>
        <p className="text-muted-foreground">Manage contact information and social links</p>
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
              <CardDescription>Hero banner displayed on the Contact page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="heroTitle">Hero Title</Label>
                <Input
                  id="heroTitle"
                  value={content.heroTitle || ""}
                  onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                  placeholder="e.g., CONTACT US"
                />
              </div>
              <div>
                <Label>Hero Background Image</Label>
                <ImageUpload
                  value={content.heroImage || ""}
                  onChange={(url) => setContent({ ...content, heroImage: url })}
                  folder="cms/contact"
                  aspectRatio="banner"
                  placeholder="Upload contact hero image"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Business address and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={content.address}
                  onChange={(e) => setContent({ ...content, address: e.target.value })}
                  placeholder="Enter full business address"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={content.phone}
                    onChange={(e) => setContent({ ...content, phone: e.target.value })}
                    placeholder="+91 123-456-7890"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={content.email}
                    onChange={(e) => setContent({ ...content, email: e.target.value })}
                    placeholder="info@qualityhomegroup.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mapUrl">Google Maps Embed URL</Label>
                <Input
                  id="mapUrl"
                  value={content.mapUrl || ""}
                  onChange={(e) => setContent({ ...content, mapUrl: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Paste the embed URL from Google Maps (Go to Share {'>'} Embed a map {'>'} Copy the src URL)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={content.socialLinks?.facebook || ""}
                    onChange={(e) => setContent({ 
                      ...content, 
                      socialLinks: { ...content.socialLinks, facebook: e.target.value } 
                    })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter / X</Label>
                  <Input
                    id="twitter"
                    value={content.socialLinks?.twitter || ""}
                    onChange={(e) => setContent({ 
                      ...content, 
                      socialLinks: { ...content.socialLinks, twitter: e.target.value } 
                    })}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={content.socialLinks?.linkedin || ""}
                    onChange={(e) => setContent({ 
                      ...content, 
                      socialLinks: { ...content.socialLinks, linkedin: e.target.value } 
                    })}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={content.socialLinks?.youtube || ""}
                    onChange={(e) => setContent({ 
                      ...content, 
                      socialLinks: { ...content.socialLinks, youtube: e.target.value } 
                    })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
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
