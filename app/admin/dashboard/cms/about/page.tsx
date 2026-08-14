"use client";

import React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  order: number;
}

interface AboutPageContent {
  heroTitle: string;
  heroImage: string;
  tagline: string;
  introText: string;
  description: string;
  missionTitle: string;
  missionText: string;
  missionIcon: string;
  visionTitle: string;
  visionText: string;
  visionIcon: string;
  leadersTitle: string;
  leadersSubtitle: string;
  teamMembers: TeamMember[];
}

const emptyContent: AboutPageContent = {
  heroTitle: "",
  heroImage: "",
  tagline: "",
  introText: "",
  description: "",
  missionTitle: "",
  missionText: "",
  missionIcon: "",
  visionTitle: "",
  visionText: "",
  visionIcon: "",
  leadersTitle: "",
  leadersSubtitle: "",
  teamMembers: [],
};

export default function CMSAboutPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState<AboutPageContent>(emptyContent);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch("/api/v1/content/about");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setContent({ ...emptyContent, ...json.data, teamMembers: json.data.teamMembers ?? [] });
        }
      } catch (err) {
        console.error("Error fetching about content:", err);
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
      const res = await fetch("/api/v1/content/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(content),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error ?? `Save failed (${res.status})`);
      }
      alert("About page content saved!");
    } catch (error) {
      console.error("Error saving content:", error);
      alert(error instanceof Error ? error.message : "Error saving content. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: "",
      role: "",
      image: "",
      order: content.teamMembers.length + 1,
    };
    setContent({
      ...content,
      teamMembers: [...content.teamMembers, newMember],
    });
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string | number) => {
    setContent({
      ...content,
      teamMembers: content.teamMembers.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      ),
    });
  };

  const deleteTeamMember = (id: string) => {
    setContent({
      ...content,
      teamMembers: content.teamMembers.filter((member) => member.id !== id),
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2A54]">About Page CMS</h1>
        <p className="text-muted-foreground">Manage all sections of the About page</p>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="hero">Hero Section</TabsTrigger>
              <TabsTrigger value="quality">Quality Section</TabsTrigger>
              <TabsTrigger value="mission">Mission & Vision</TabsTrigger>
              <TabsTrigger value="leaders">Our Leaders</TabsTrigger>
            </TabsList>

            {/* Hero Section */}
            <TabsContent value="hero">
              <Card>
                <CardHeader>
                  <CardTitle>Hero Section</CardTitle>
                  <CardDescription>Edit the hero banner at the top of the page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="heroTitle">Hero Title</Label>
                    <Input
                      id="heroTitle"
                      value={content.heroTitle}
                      onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                      placeholder="CREATING VALUE THROUGH INNOVATION"
                    />
                  </div>
                  <div>
                    <Label>Hero Background Image</Label>
                    <ImageUpload
                      value={content.heroImage}
                      onChange={(url) => setContent({ ...content, heroImage: url })}
                      folder="about"
                      aspectRatio="video"
                      preset="heroBanner"
                      placeholder="Upload about page hero image"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quality Section */}
            <TabsContent value="quality">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Section</CardTitle>
                  <CardDescription>Edit the tagline and description section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tagline">Tagline (use \n for line breaks)</Label>
                    <Textarea
                      id="tagline"
                      value={content.tagline}
                      onChange={(e) => setContent({ ...content, tagline: e.target.value })}
                      placeholder="Quality.\nPrecision.\nPerformance."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="introText">Intro Text</Label>
                    <Textarea
                      id="introText"
                      value={content.introText}
                      onChange={(e) => setContent({ ...content, introText: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={content.description}
                      onChange={(e) => setContent({ ...content, description: e.target.value })}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mission & Vision Section */}
            <TabsContent value="mission">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Our Mission</CardTitle>
                    <CardDescription>Edit the mission statement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="missionTitle">Title</Label>
                      <Input
                        id="missionTitle"
                        value={content.missionTitle}
                        onChange={(e) => setContent({ ...content, missionTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="missionIcon">Icon URL</Label>
                      <Input
                        id="missionIcon"
                        value={content.missionIcon}
                        onChange={(e) => setContent({ ...content, missionIcon: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="missionText">Mission Text</Label>
                      <Textarea
                        id="missionText"
                        value={content.missionText}
                        onChange={(e) => setContent({ ...content, missionText: e.target.value })}
                        rows={5}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Our Vision</CardTitle>
                    <CardDescription>Edit the vision statement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="visionTitle">Title</Label>
                      <Input
                        id="visionTitle"
                        value={content.visionTitle}
                        onChange={(e) => setContent({ ...content, visionTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="visionIcon">Icon URL</Label>
                      <Input
                        id="visionIcon"
                        value={content.visionIcon}
                        onChange={(e) => setContent({ ...content, visionIcon: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="visionText">Vision Text</Label>
                      <Textarea
                        id="visionText"
                        value={content.visionText}
                        onChange={(e) => setContent({ ...content, visionText: e.target.value })}
                        rows={5}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Our Leaders Section */}
            <TabsContent value="leaders">
              <Card>
                <CardHeader>
                  <CardTitle>Our Leaders Section</CardTitle>
                  <CardDescription>Manage team members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leadersTitle">Section Title</Label>
                      <Input
                        id="leadersTitle"
                        value={content.leadersTitle}
                        onChange={(e) => setContent({ ...content, leadersTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="leadersSubtitle">Section Subtitle</Label>
                      <Input
                        id="leadersSubtitle"
                        value={content.leadersSubtitle}
                        onChange={(e) => setContent({ ...content, leadersSubtitle: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Team Members</h4>
                      <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {content.teamMembers.map((member, index) => (
                        <div key={member.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label>Name</Label>
                              <Input
                                value={member.name}
                                onChange={(e) => updateTeamMember(member.id, "name", e.target.value)}
                                placeholder="Full Name"
                              />
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Input
                                value={member.role}
                                onChange={(e) => updateTeamMember(member.id, "role", e.target.value)}
                                placeholder="Managing Director"
                              />
                            </div>
                            <div>
                              <Label>Photo</Label>
                              <ImageUpload
                                value={member.image}
                                onChange={(url) => updateTeamMember(member.id, "image", url)}
                                folder="team"
                                aspectRatio="square"
                                preset="avatar"
                                placeholder="Upload team photo"
                                className="max-w-[200px]"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => deleteTeamMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button type="submit" className="bg-[#1F2A54]" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
