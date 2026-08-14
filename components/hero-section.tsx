"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { isValidImageUrl } from "@/lib/media";
import { heroSlide, heroText } from "@/lib/motion/variants";
import { usePrefersReducedMotion } from "@/lib/motion/prefs";
import { Magnetic } from "@/components/motion/magnetic";

type HeroSlide = {
  id: string;
  headline: string;
  subheadline: string;
  backgroundImage?: string;
  order?: number;
};

export function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    async function fetchSlides() {
      try {
        const res = await fetch("/api/v1/content/hero", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json?.data?.slides) ? json.data.slides : [];
        const sorted = [...list].sort(
          (a: HeroSlide, b: HeroSlide) => (a.order ?? 0) - (b.order ?? 0)
        );
        setSlides(sorted);
      } catch (error) {
        console.error("Error fetching hero slides:", error);
        setSlides([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  // GSAP Ken Burns on active slide background
  useEffect(() => {
    if (reduced || slides.length === 0) return;
    const el = bgRefs.current[currentSlide];
    if (!el) return;

    let tween: { kill: () => void } | undefined;

    async function kenBurns() {
      const { gsap } = await import("gsap");
      gsap.set(el, { scale: 1.12 });
      tween = gsap.to(el, {
        scale: 1,
        duration: 5,
        ease: "power2.out",
      });
    }
    kenBurns();
    return () => tween?.kill();
  }, [currentSlide, slides.length, reduced]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    setTouchStart(null);
    setIsPaused(false);
  };

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  if (isLoading) {
    return (
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#1F2A54]">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#1F2A54] via-[#2a3a6e] to-[#1F2A54]"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="container mx-auto px-4 relative z-10 pt-20 w-full">
          <motion.div className="h-12 w-3/4 max-w-lg bg-white/10 rounded-lg mx-auto mb-4" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <motion.div className="h-8 w-1/2 max-w-md bg-white/10 rounded-lg mx-auto" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative min-h-[50vh] flex items-center overflow-hidden bg-[#1F2A54]" aria-hidden />
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 bg-[#1F2A54]" />
      <AnimatePresence mode="wait">
        {slides.map(
          (slide, index) =>
            index === currentSlide && (
              <motion.div
                key={slide.id}
                className="absolute inset-0"
                variants={heroSlide}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div
                  ref={(el) => {
                    bgRefs.current[index] = el;
                  }}
                  className="absolute inset-0 overflow-hidden"
                >
                  {isValidImageUrl(slide.backgroundImage) ? (
                    <SafeImage
                      src={slide.backgroundImage}
                      alt={slide.headline}
                      fill
                      className="object-cover object-center"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1F2A54] to-[#3d4f8f]" />
                  )}
                </div>
              </motion.div>
            )
        )}
      </AnimatePresence>

      <motion.div
        className="container mx-auto px-4 relative z-10 pt-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="w-full flex flex-col items-center text-center"
            initial="hidden"
            animate="visible"
          >
            <h1 className="font-royal text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4">
              {currentSlideData.headline.split("\n").map((line, i, lines) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={heroText}
                  className="inline-block"
                >
                  <span className={i === 0 ? "text-gold" : "text-white"}>{line}</span>
                  {i < lines.length - 1 && <br />}
                </motion.span>
              ))}
            </h1>
            {currentSlideData.subheadline && (
              <motion.p
                custom={2}
                variants={heroText}
                className="font-royal text-white/80 text-lg md:text-xl tracking-wide mt-6"
              >
                {currentSlideData.subheadline}
              </motion.p>
            )}
            <motion.div
              className="mt-16 hidden md:block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Magnetic strength={0.15}>
                <Link
                  href="#about"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-gold transition-colors text-sm group"
                >
                  <motion.span
                    className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center group-hover:border-gold"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.span>
                </Link>
              </Magnetic>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {slides.length > 1 && (
        <>
          <motion.button
            type="button"
            onClick={goToPrevious}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center text-white/90 hover:text-gold"
            whileHover={{ scale: 1.15, x: -4 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-10 h-10" />
          </motion.button>
          <motion.button
            type="button"
            onClick={goToNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center text-white/90 hover:text-gold"
            whileHover={{ scale: 1.15, x: 4 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Next slide"
          >
            <ChevronRight className="w-10 h-10" />
          </motion.button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <motion.button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`h-3 rounded-full ${
                  index === currentSlide ? "bg-gold" : "bg-white/50"
                }`}
                animate={{
                  width: index === currentSlide ? 32 : 12,
                  opacity: index === currentSlide ? 1 : 0.5,
                }}
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
