"use client";

import { motion } from "framer-motion";
import { SafeImage } from "@/components/safe-image";
import { isValidImageUrl } from "@/lib/media";
import { heroText } from "@/lib/motion/variants";

const HERO_HEIGHT_CLASS = "h-[300px]";

type ListingHeroProps = {
  title?: string;
  image?: string | null;
  loading?: boolean;
  defaultAlt?: string;
};

export function ListingHero({ title, image, loading, defaultAlt = "Page hero" }: ListingHeroProps) {
  if (loading) {
    return (
      <section className={`relative w-full ${HERO_HEIGHT_CLASS} overflow-hidden bg-[#1F2A54]`}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </section>
    );
  }

  const hasTitle = Boolean(title?.trim());
  const hasImage = isValidImageUrl(image);

  if (!hasTitle && !hasImage) {
    return (
      <section
        className={`relative w-full ${HERO_HEIGHT_CLASS} overflow-hidden bg-[#1F2A54]`}
        aria-hidden
      />
    );
  }

  return (
    <section className={`relative w-full ${HERO_HEIGHT_CLASS} overflow-hidden`}>
      {hasImage ? (
        <SafeImage
          src={image}
          alt={title || defaultAlt}
          fill
          className="object-cover object-center"
          priority
        />
      ) : (
        <motion.div
          className="absolute inset-0 bg-[#1F2A54]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      {hasTitle && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
          <h1 className="inner-hero-title font-royal text-center text-white">
            {title!.split("\n").map((line, i, arr) => (
              <motion.span key={i} custom={i} variants={heroText} initial="hidden" animate="visible">
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
