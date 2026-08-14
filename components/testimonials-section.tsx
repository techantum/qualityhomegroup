"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { FloatingOrbs } from "@/components/motion/floating-orbs";
import { Magnetic } from "@/components/motion/magnetic";
import { SafeImage } from "@/components/safe-image";
interface TestimonialDisplay {
  id: string;
  name: string;
  role: string;
  image: string;
  text: string;
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<TestimonialDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const res = await fetch("/api/v1/testimonials/public");
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json?.data) ? json.data : [];
        const mapped: TestimonialDisplay[] = list
          .map((t: Record<string, unknown>) => ({
            id: String(t?.id ?? ""),
            name: String(t?.name ?? "").trim(),
            role: String(t?.role ?? "").trim(),
            image: String(t?.image ?? "").trim(),
            text: String(t?.content ?? "").trim(),
          }))
          .filter((t) => t.id && t.name && t.text);
        setTestimonials(mapped);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

  const nextSlide = () => {
    if (testimonials.length === 0) return;
    setStartIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    if (testimonials.length === 0) return;
    setStartIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Get visible testimonials (2 at a time)
  const getVisibleTestimonials = () => {
    if (testimonials.length === 0) return [];
    const visible = [];
    for (let i = 0; i < Math.min(2, testimonials.length); i++) {
      const index = (startIndex + i) % testimonials.length;
      visible.push(testimonials[index]);
    }
    return visible;
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

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-[#1F2A54] via-[#2a3a6e] to-[#1F2A54]">
      <FloatingOrbs />
      <div className="container mx-auto px-4 relative z-10">
        <Reveal className="text-center mb-16">
          <p className="text-white font-medium mb-2">Feedback</p>
          <h2 className="font-extrabold text-3xl md:text-4xl text-white">
            Our Testimonials
          </h2>
        </Reveal>

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-12">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/20 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && testimonials.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/60 text-lg">No testimonials available yet.</p>
          </div>
        )}

        {/* Testimonials Carousel */}
        {!isLoading && testimonials.length > 0 && (
          <div className="max-w-[1200px] mx-auto relative">
            {/* Navigation Arrows */}
            <motion.button
              type="button"
              onClick={prevSlide}
              className="absolute left-0 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 hidden md:flex items-center justify-center text-white"
              whileHover={{ scale: 1.15, x: -4 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-10 h-10" />
            </motion.button>
            <motion.button
              type="button"
              onClick={nextSlide}
              className="absolute right-0 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 hidden md:flex items-center justify-center text-white"
              whileHover={{ scale: 1.15, x: 4 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-10 h-10" />
            </motion.button>

            <AnimatePresence mode="wait">
            <motion.div
              key={startIndex}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-12"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {getVisibleTestimonials().map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  className="bg-white rounded-2xl p-8 pt-14 relative shadow-lg"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -6, boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }}
                >
                  {/* User Photo - Positioned at top, overlapping card */}
                  <div className="absolute -top-10 left-8 w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <SafeImage
                      src={testimonial.image}
                      hideIfEmpty
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Quote Icon */}
                  <div className="absolute top-6 right-8 text-[#DDA21A]/40">
                    <Quote className="w-8 h-8" aria-hidden />
                  </div>
                  
                  {/* Author Info */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-[#1F2A54] text-lg">
                      {testimonial.name} <span className="font-normal text-sm text-gray-500">/ {testimonial.role}</span>
                    </h4>
                  </div>
                  
                  {/* Testimonial Text */}
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {testimonial.text}
                  </p>
                </motion.div>
              ))}
            </motion.div>
            </AnimatePresence>

            <Reveal className="text-center mt-12">
              <Magnetic>
                <Button className="bg-[#DDA21A] hover:bg-[#c99318] text-white px-8 py-6 rounded-full text-base font-medium">
                  See All Testimonials <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Magnetic>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}
