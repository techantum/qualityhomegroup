"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/reveal";

interface ProjectDisplay {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
}

export function ProjectsSection() {
  const [projects, setProjects] = useState<ProjectDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.min(index, maxIndex));
  };

  const visibleProjects = projects.slice(currentIndex, currentIndex + slidesToShow);

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

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        <Reveal className="text-center mb-12">
          <h2 className="font-extrabold text-3xl md:text-4xl text-[#1F2A54] mb-3">
            Latest Projects
          </h2>
          <p className="text-gray-500 font-normal">
            Discover our latest residential and commercial developments.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="relative">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden aspect-[3/4] bg-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No projects available yet.</p>
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
                className="absolute -left-2 md:-left-16 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center disabled:opacity-30 text-[#1F2A54]"
                whileHover={{ scale: 1.15, x: -4 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Previous projects"
              >
                <ChevronLeft className="w-10 h-10 md:w-12 md:h-12" />
              </motion.button>

              {/* Projects Cards */}
              <div className="w-full overflow-hidden px-6 md:px-0">
                <motion.div
                  className="flex gap-6"
                  animate={{ x: `-${currentIndex * (100 / slidesToShow + 2)}%` }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                >
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/property/${project.slug || project.id}`}
                      className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] block"
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
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="font-extrabold text-xl md:text-2xl mb-1">
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

              {/* Right Arrow */}
              <motion.button
                type="button"
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className="absolute -right-2 md:-right-16 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center disabled:opacity-30 text-[#1F2A54]"
                whileHover={{ scale: 1.15, x: 4 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Next projects"
              >
                <ChevronRight className="w-10 h-10 md:w-12 md:h-12" />
              </motion.button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: Math.ceil(projects.length / slidesToShow) }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === Math.floor(currentIndex / slidesToShow) ? "bg-[#1F2A54]" : "bg-[#1F2A54]/30"
                  }`}
                  onClick={() => goToSlide(index * slidesToShow)}
                  aria-label={`Go to slide group ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
        </Reveal>
      </div>
    </section>
  );
}
