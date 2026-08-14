"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ListingHero } from "@/components/listing-hero";
import { SafeImage } from "@/components/safe-image";
import { isValidImageUrl } from "@/lib/media";
import { Loader2 } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  order: number;
}

interface AboutPageContent {
  heroTitle?: string;
  heroImage?: string;
  tagline?: string;
  introText?: string;
  description?: string;
  missionTitle?: string;
  missionText?: string;
  missionIcon?: string;
  visionTitle?: string;
  visionText?: string;
  visionIcon?: string;
  leadersTitle?: string;
  leadersSubtitle?: string;
  teamMembers?: TeamMember[];
}

export default function AboutPage() {
  const [content, setContent] = useState<AboutPageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch("/api/v1/content/about", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) setContent(json.data);
      } catch (error) {
        console.error("Error fetching about page content:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContent();
  }, []);

  const team = Array.isArray(content?.teamMembers) ? [...content.teamMembers].sort((a, b) => a.order - b.order) : [];

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <ListingHero
        title={content?.heroTitle}
        image={content?.heroImage}
        loading={false}
        defaultAlt="About Quality Home Group"
      />

      {(content?.tagline || content?.introText || content?.description) && (
        <section className="py-16 md:py-24 bg-[#F5F5F5]">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-start">
              {content?.tagline && (
                <div className="md:w-[35%]">
                  <h2 className="font-serif text-[40px] leading-[1.2] text-[#1F2A54] whitespace-pre-line">
                    {content.tagline}
                  </h2>
                </div>
              )}
              <div className="md:flex-1 space-y-6">
                {content?.introText && (
                  <p className="text-[#1F2A54] text-base font-semibold leading-relaxed">{content.introText}</p>
                )}
                {content?.description && (
                  <p className="text-[#6B7280] text-sm leading-[1.8] whitespace-pre-line">{content.description}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {(content?.missionTitle || content?.visionTitle) && (
        <section className="bg-[#1F2A54] py-16 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4 grid md:grid-cols-2 gap-12 md:gap-24">
            {content?.missionTitle && (
              <div className="text-center md:text-left">
                {isValidImageUrl(content.missionIcon) && (
                  <SafeImage src={content.missionIcon} alt="" width={80} height={80} className="object-contain mb-6 mx-auto md:mx-0" />
                )}
                <h3 className="font-royal text-2xl md:text-3xl text-gold mb-4">{content.missionTitle}</h3>
                {content.missionText && <p className="text-white/80 leading-relaxed">{content.missionText}</p>}
              </div>
            )}
            {content?.visionTitle && (
              <div className="text-center md:text-left">
                {isValidImageUrl(content.visionIcon) && (
                  <SafeImage src={content.visionIcon} alt="" width={80} height={80} className="object-contain mb-6 mx-auto md:mx-0" />
                )}
                <h3 className="font-royal text-2xl md:text-3xl text-gold mb-4">{content.visionTitle}</h3>
                {content.visionText && <p className="text-white/80 leading-relaxed">{content.visionText}</p>}
              </div>
            )}
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-4">
            {(content?.leadersTitle || content?.leadersSubtitle) && (
              <div className="text-center mb-12">
                {content?.leadersTitle && (
                  <h2 className="text-[#1F2A54] text-sm font-semibold tracking-[0.2em] uppercase mb-2">
                    {content.leadersTitle}
                  </h2>
                )}
                {content?.leadersSubtitle && (
                  <p className="font-royal text-2xl md:text-3xl text-gold">{content.leadersSubtitle}</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {team.map((member, index) => (
                <div key={member.id || index} className="text-center">
                  <div className="relative w-full aspect-[3/4] mb-4 rounded-2xl overflow-hidden">
                    <SafeImage src={member.image} alt={member.name} fill className="object-cover" hideIfEmpty />
                  </div>
                  <h4 className="font-royal text-lg md:text-xl text-gold mb-1">{member.name}</h4>
                  <p className="text-[#6B7280] text-sm">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!content && (
        <section className="py-24 text-center text-muted-foreground">
          <p>About page content can be configured in the admin panel.</p>
        </section>
      )}

      <Footer />
    </main>
  );
}
