"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { SafeImage } from "@/components/safe-image";
import { isValidImageUrl } from "@/lib/media";
import {
  normalizeHomeAboutContent,
  type HomeAboutContent,
  type HomeAboutPropertyType,
} from "@/lib/home-about";
import { Reveal } from "@/components/motion/reveal";

function PropertyTypeItem({ label, image }: HomeAboutPropertyType) {
  return (
    <div className="flex min-w-[72px] flex-col items-center text-center">
      <div className="relative mb-2 h-10 w-10">
        {isValidImageUrl(image) ? (
          <SafeImage src={image} alt={label} fill className="object-contain" />
        ) : (
          <ImagePlaceholder className="h-full w-full rounded" fill />
        )}
      </div>
      <span className="text-sm font-normal text-[#6B7280]">{label}</span>
    </div>
  );
}

export function AboutSection() {
  const [content, setContent] = useState<HomeAboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAbout() {
      try {
        const res = await fetch("/api/v1/content/pages/home-about", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setContent(normalizeHomeAboutContent(json.data));
        } else {
          setContent(normalizeHomeAboutContent(null));
        }
      } catch (error) {
        console.error("Error fetching home about content:", error);
        setContent(normalizeHomeAboutContent(null));
      } finally {
        setIsLoading(false);
      }
    }
    fetchAbout();
  }, []);

  if (isLoading || !content) {
    return (
      <section id="about" className="py-16 md:py-24 bg-white">
        <motion.div
          className="max-w-[1200px] mx-auto px-4 h-64 bg-gray-100 rounded-lg"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </section>
    );
  }

  const {
    eyebrow,
    heading,
    paragraph1,
    paragraph2,
    propertyTypes,
    buttonText,
    buttonLink,
    image,
  } = content;

  return (
    <section id="about" className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* Decorative grid between columns */}
      <div
        className="pointer-events-none absolute left-1/2 top-[28%] hidden h-56 w-28 -translate-x-1/2 lg:block"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
          opacity: 0.45,
        }}
      />

      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <Reveal direction="right" className="lg:pr-4">
            <p className="text-[#1F2A54] font-medium mb-3 text-base md:text-lg">{eyebrow}</p>
            <h2 className="text-[#111827] text-3xl md:text-[2.5rem] font-extrabold leading-tight mb-6 max-w-lg">
              {heading}
            </h2>

            {paragraph1 && (
              <p className="text-[#6B7280] text-base leading-relaxed mb-4">{paragraph1}</p>
            )}
            {paragraph2 && (
              <p className="text-[#6B7280] text-base leading-relaxed mb-8">{paragraph2}</p>
            )}

            {propertyTypes.length > 0 && (
              <div className="flex flex-wrap justify-between gap-6 mb-10 max-w-md">
                {propertyTypes.map((item, i) => (
                  <PropertyTypeItem key={`${item.label}-${i}`} {...item} />
                ))}
              </div>
            )}

            <Link
              href={buttonLink || "/about"}
              className="inline-flex items-center gap-2 bg-[#DDA21A] hover:bg-[#c99218] text-[#1F2A54] font-semibold px-8 py-3 rounded-md transition-colors"
            >
              {buttonText || "Read More"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>

          {isValidImageUrl(image) && (
            <Reveal direction="left" delay={0.1} className="relative lg:pl-2">
              <div className="relative w-full aspect-[4/5] max-h-[560px] overflow-hidden bg-[#f3f4f6]">
                <SafeImage src={image} alt={heading} fill className="object-cover" />
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
