"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSafeImageSrc, isValidImageUrl } from "@/lib/media";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { GsapParallax } from "@/components/motion/gsap-parallax";
import { FloatingOrbs } from "@/components/motion/floating-orbs";

type WhyUsFeature = { icon?: string; title?: string; description?: string };
type WhyUsContent = {
  eyebrow?: string;
  title?: string;
  description?: string;
  image?: string;
  features?: WhyUsFeature[];
};

export function WhyUsSection() {
  const [content, setContent] = useState<WhyUsContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/content/pages/home-why-us", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) setContent(json.data as WhyUsContent);
      } catch (e) {
        console.error("Why us section load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const features = Array.isArray(content?.features) ? content.features : [];
  const hasContent =
    content &&
    (content.title ||
      content.description ||
      features.length > 0 ||
      isValidImageUrl(content.image));

  if (loading) {
    return (
      <section className="py-20 bg-white relative overflow-hidden">
        <motion.div
          className="max-w-[1200px] mx-auto px-4 h-64 bg-gray-100 rounded-2xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </section>
    );
  }

  if (!hasContent) return null;

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <FloatingOrbs />
      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <Reveal direction="right">
            {content?.eyebrow && (
              <p className="text-[#1F2A54] font-medium mb-2">{content.eyebrow}</p>
            )}
            {content?.title && (
              <h2 className="font-extrabold text-3xl md:text-4xl text-[#1F2A54] mb-6 text-balance">
                {content.title}
              </h2>
            )}
            {content?.description && (
              <p className="text-gray-500 leading-relaxed mb-10 max-w-lg whitespace-pre-line">
                {content.description}
              </p>
            )}

            {features.length > 0 && (
              <Stagger className="space-y-4" stagger={0.1}>
                {features.map((feature, index) => (
                  <StaggerItem key={feature.title ?? String(index)}>
                    <motion.div
                      className="flex items-center gap-6 p-5 bg-[#F8F8F8] rounded-lg"
                      whileHover={{ x: 6, backgroundColor: "#f0f0f0" }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    >
                      <div className="flex-shrink-0 w-[84px] h-[84px] bg-[#1F2A54] rounded-full flex items-center justify-center p-5">
                        {isValidImageUrl(feature.icon) && (
                          <Image
                            src={getSafeImageSrc(feature.icon)!}
                            alt={feature.title || ""}
                            width={44}
                            height={44}
                            className="object-contain"
                          />
                        )}
                      </div>
                      <div>
                        {feature.title && (
                          <h3 className="font-bold text-[#1F2A54] text-base mb-1">{feature.title}</h3>
                        )}
                        {feature.description && (
                          <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                        )}
                      </div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </Reveal>

          {isValidImageUrl(content?.image) && (
            <Reveal direction="left" delay={0.15}>
              <GsapParallax speed={0.25} className="relative w-full h-[500px] lg:h-[600px]">
                <motion.div
                  className="relative w-full h-full"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                >
                  <Image
                    src={getSafeImageSrc(content.image)!}
                    alt={content.title || "Why Quality Home Group"}
                    fill
                    className="object-contain object-right"
                  />
                </motion.div>
              </GsapParallax>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
