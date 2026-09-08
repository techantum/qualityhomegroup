"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/reveal";
import { usePageContent } from "@/hooks/use-page-content";

interface ProjectDisplay {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
}

export function ProjectsSection() {
  const { data: sectionContent, loading: sectionLoading } = usePageContent("home-projects");
  const [projects, setProjects] = useState<ProjectDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardGap = 24;

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/v1/projects/public");
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json?.data) ? json.data : [];
        const mapped: ProjectDisplay[] = list.map((p: Record<string, unknown>) => ({
          id: String(p?.id ?? Math.random()),
          slug: String(p?.slug ?? p?.id ?? ""),
          title: String(p?.title ?? ""),
          subtitle: String(p?.type ?? ""),
          location: String(p?.location ?? ""),
          image: String(p?.image ?? ""),
        }));
        setProjects(mapped);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSlidesToShow(1);
      } else if (window.innerWidth < 1024) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, projects.length - slidesToShow);
  const cardWidth =
    viewportWidth > 0
      ? (viewportWidth - cardGap * Math.max(0, slidesToShow - 1)) / slidesToShow
      : 0;

  useLayoutEffect(() => {
    if (isLoading || projects.length === 0) return;
    const node = viewportRef.current;
    if (!node) return;

    const update = (width: number) => {
      if (width > 0) setViewportWidth(width);
    };
    update(node.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? node.clientWidth;
      update(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isLoading, projects.length]);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.min(index, maxIndex));
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    setTouchStart(null);
  };

  const sectionTitle = String(sectionContent?.title ?? "").trim();
  const sectionSubtitle = String(sectionContent?.subtitle ?? "").trim();
  const showSectionHeader = Boolean(sectionTitle || sectionSubtitle);

  if (!isLoading && projects.length === 0) return null;

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        {!sectionLoading && showSectionHeader && (
          <Reveal className="text-center mb-12">
            {sectionTitle && (
              <h2 className="font-extrabold text-3xl md:text-4xl text-[#1F2A54] mb-3">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-gray-500 font-normal">{sectionSubtitle}</p>
            )}
          </Reveal>
        )}

        <Reveal delay={0.1} className="relative">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden aspect-[3/4] bg-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {/* Projects Slider */}
        {!isLoading && projects.length > 0 && (
          <>
            <div
              className="relative"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Left Arrow */}
              <motion.button
                type="button"
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="absolute left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white disabled:opacity-30 sm:left-2 md:left-1 md:h-12 md:w-12 md:bg-transparent md:text-[#1F2A54] min-[1440px]:-left-16"
                whileHover={{ scale: 1.15, x: -4 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Previous projects"
              >
                <ChevronLeft className="w-10 h-10 md:w-12 md:h-12" />
              </motion.button>

              {/* Projects Cards */}
              <div className="px-10 md:px-14 min-[1440px]:px-0">
                <div ref={viewportRef} className="w-full min-w-0 overflow-hidden">
                  <motion.div
                    className="flex flex-nowrap gap-6"
                    animate={{ x: cardWidth > 0 ? -(currentIndex * (cardWidth + cardGap)) : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 36 }}
                  >
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/property/${project.slug || project.id}`}
                      className="block shrink-0"
                      style={{ width: cardWidth > 0 ? cardWidth : "100%" }}
                    >
                      <motion.div
                        className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer"
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        {/* Image */}
                        {project.image ? (
                          <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[#1F2A54]" aria-hidden />
                        )}

                        {/* Gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                          <h3 className="font-extrabold text-lg sm:text-xl md:text-2xl mb-1">
                            {project.title}
                          </h3>
                          <p className="text-white/80 text-sm mb-3 font-normal">
                            {project.subtitle}
                          </p>
                          <div className="flex items-center gap-2 text-white text-sm">
                            <MapPin className="w-4 h-4" />
                            <span className="font-normal">{project.location}</span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </motion.div>
                </div>
              </div>

              {/* Right Arrow */}
              <motion.button
                type="button"
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white disabled:opacity-30 sm:right-2 md:right-1 md:h-12 md:w-12 md:bg-transparent md:text-[#1F2A54] min-[1440px]:-right-16"
                whileHover={{ scale: 1.15, x: 4 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Next projects"
              >
                <ChevronRight className="w-10 h-10 md:w-12 md:h-12" />
              </motion.button>
            </div>

            {/* Dots Indicator */}
            <div className="mt-8 flex items-center justify-center gap-1">
              {Array.from({ length: Math.ceil(projects.length / slidesToShow) }).map((_, index) => {
                const isActive = index === Math.floor(currentIndex / slidesToShow);
                return (
                  <button
                    key={index}
                    type="button"
                    className="unstyled flex min-h-0 min-w-0 appearance-none items-center justify-center border-0 bg-transparent p-2"
                    onClick={() => goToSlide(index * slidesToShow)}
                    aria-label={`Go to slide group ${index + 1}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span
                      className={`block rounded-full transition-all ${
                        isActive
                          ? "h-1.5 w-4 bg-[#1F2A54] sm:h-2.5 sm:w-6"
                          : "h-1.5 w-1.5 bg-[#1F2A54]/30 sm:h-2.5 sm:w-2.5"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </>
        )}
        </Reveal>
      </div>
    </section>
  );
}
