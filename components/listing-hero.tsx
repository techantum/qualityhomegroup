"use client";

import { motion } from "framer-motion";
import { getSafeImageSrc, isValidImageUrl } from "@/lib/media";
import { heroText } from "@/lib/motion/variants";

const HERO_HEIGHT_CLASS =
  "h-[calc(var(--site-header-height)+200px)] sm:h-[calc(var(--site-header-height)+240px)] md:h-[300px]";

type ListingHeroProps = {
  title?: string;
  image?: string | null;
  loading?: boolean;
  defaultAlt?: string;
};

export function ListingHero({ title, image, loading, defaultAlt = "Page hero" }: ListingHeroProps) {
  const imageSrc = getSafeImageSrc(image);
  const hasTitle = Boolean(title?.trim());
  const hasImage = Boolean(imageSrc) && isValidImageUrl(imageSrc);

  if (loading) {
    return (
      <section className={`relative block w-full ${HERO_HEIGHT_CLASS} overflow-hidden bg-[#1F2A54]`}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </section>
    );
  }

  if (!hasTitle && !hasImage) {
    return (
      <section
        className={`relative block w-full ${HERO_HEIGHT_CLASS} overflow-hidden bg-[#1F2A54]`}
        aria-hidden
      />
    );
  }

  return (
    <section
      className={`relative block w-full ${HERO_HEIGHT_CLASS} overflow-hidden bg-[#1F2A54] bg-cover bg-center bg-no-repeat`}
      style={hasImage ? { backgroundImage: `url(${JSON.stringify(imageSrc)})` } : undefined}
    >
      {hasImage && <div className="absolute inset-0 z-[1] bg-[#1F2A54]/70" />}
      {hasTitle && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center px-4"
          style={{ paddingTop: "var(--site-header-height)" }}
        >
          <h1 className="inner-hero-title font-royal text-center text-white">
            {title!.split("\n").map((line, i, arr) => (
              <motion.span
                key={i}
                custom={i}
                variants={heroText}
                initial="hidden"
                animate="visible"
                className="inline-block"
              >
                {line}
                {i < arr.length - 1 && <br />}
              </motion.span>
            ))}
          </h1>
        </div>
      )}
    </section>
  );
}
