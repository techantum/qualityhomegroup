"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { adminApiFetch } from "@/lib/admin-api";
import { DEFAULT_BRANDING, mergeBranding, type Branding } from "@/lib/branding";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contactData, setContactData] = useState({
    address: "123 Frontage Rd., Any City, 12345 Any State",
    phone: "123-456-7890",
    email: "support@qualityhomegroup.com",
    facebook: "",
    twitter: "",
    linkedin: "",
    youtube: "",
  });
  const [brandingData, setBrandingData] = useState<Branding>({ ...DEFAULT_BRANDING });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const [contactRes, brandingRes] = await Promise.all([
        fetch("/api/v1/content/contact"),
        fetch("/api/v1/content/branding"),
      ]);
      const contactJson = await contactRes.json().catch(() => ({}));
      const brandingJson = await brandingRes.json().catch(() => ({}));

      if (contactRes.ok && contactJson?.data) {
        const data = contactJson.data;
        setContactData({
          address: data.address || "123 Frontage Rd., Any City, 12345 Any State",
          phone: data.phone || "123-456-7890",
          email: data.email || "support@qualityhomegroup.com",
          facebook: data.socialLinks?.facebook || "",
          twitter: data.socialLinks?.twitter || "",
          linkedin: data.socialLinks?.linkedin || "",
          youtube: data.socialLinks?.youtube || "",
        });
      }

      if (brandingRes.ok && brandingJson?.data) {
        setBrandingData(mergeBranding(brandingJson.data));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const [contactRes, brandingRes] = await Promise.all([
        adminApiFetch(user, "/api/v1/content/contact", {
          method: "PUT",
          body: JSON.stringify({
            address: contactData.address,
            phone: contactData.phone,
            email: contactData.email,
            socialLinks: {
              facebook: contactData.facebook,
              twitter: contactData.twitter,
              linkedin: contactData.linkedin,
              youtube: contactData.youtube,
            },
          }),
        }),
        adminApiFetch(user, "/api/v1/content/branding", {
          method: "PUT",
          body: JSON.stringify(brandingData),
        }),
      ]);

      const contactJson = await contactRes.json().catch(() => ({}));
      const brandingJson = await brandingRes.json().catch(() => ({}));

      if (!contactRes.ok) throw new Error(contactJson?.error ?? `Contact save failed (${contactRes.status})`);
      if (!brandingRes.ok) throw new Error(brandingJson?.error ?? `Branding save failed (${brandingRes.status})`);

      if (brandingJson?.data) setBrandingData(mergeBranding(brandingJson.data));
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(error instanceof Error ? error.message : "Error saving settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A54]">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage site-wide settings
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="max-w-2xl grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Logo and favicon shown on the public website header, footer, and browser tab
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site name</Label>
              <Input
                id="siteName"
                value={brandingData.siteName}
                onChange={(e) => setBrandingData({ ...brandingData, siteName: e.target.value })}
                placeholder="Quality Home Group"
              />
            </div>

            <div className="space-y-2">
              <Label>Header logo</Label>
              <p className="text-xs text-muted-foreground">
                Shown in the site navigation. PNG, SVG, or WebP recommended.
              </p>
              <ImageUpload
                value={brandingData.logoHeader}
                onChange={(url) => setBrandingData({ ...brandingData, logoHeader: url })}
                folder="branding"
                aspectRatio="banner"
                preset="logo"
                objectFit="contain"
                placeholder="Upload header logo"
              />
            </div>

            <div className="space-y-2">
              <Label>Footer logo</Label>
              <p className="text-xs text-muted-foreground">
                Shown in the site footer.
              </p>
              <ImageUpload
                value={brandingData.logoFooter}
                onChange={(url) => setBrandingData({ ...brandingData, logoFooter: url })}
                folder="branding"
                aspectRatio="square"
                preset="logo"
                objectFit="contain"
                placeholder="Upload footer logo"
              />
            </div>

            <div className="space-y-2">
              <Label>Favicon</Label>
              <p className="text-xs text-muted-foreground">
                Browser tab icon. Square PNG or SVG, up to 512×512px.
              </p>
              <ImageUpload
                value={brandingData.favicon}
                onChange={(url) => setBrandingData({ ...brandingData, favicon: url })}
                folder="branding"
                aspectRatio="square"
                preset="favicon"
                objectFit="contain"
                placeholder="Upload favicon"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Update your business contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={contactData.address}
                onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={contactData.phone}
                onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                placeholder="123-456-7890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={contactData.email}
                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                placeholder="contact@company.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>Connect your social media profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook URL</Label>
              <Input
                id="facebook"
                value={contactData.facebook}
                onChange={(e) => setContactData({ ...contactData, facebook: e.target.value })}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter URL</Label>
              <Input
                id="twitter"
                value={contactData.twitter}
                onChange={(e) => setContactData({ ...contactData, twitter: e.target.value })}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={contactData.linkedin}
                onChange={(e) => setContactData({ ...contactData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube URL</Label>
              <Input
                id="youtube"
                value={contactData.youtube}
                onChange={(e) => setContactData({ ...contactData, youtube: e.target.value })}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
