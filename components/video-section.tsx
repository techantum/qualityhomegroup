"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { isValidImageUrl } from "@/lib/media";
import {
  hasHomeVideoContent,
  normalizeHomeVideoContent,
  type HomeVideoContent,
} from "@/lib/home-video";
import { Reveal } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";

function isValidVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (!t) return false;
  return (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.startsWith("/") ||
    t.startsWith("blob:") ||
    t.startsWith("data:video/")
  );
}

export function VideoSection() {
  const [content, setContent] = useState<HomeVideoContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/content/pages/home-video", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setContent(normalizeHomeVideoContent(json.data));
        } else {
          setContent(normalizeHomeVideoContent(null));
        }
      } catch (e) {
        console.error("Video section load error:", e);
        setContent(normalizeHomeVideoContent(null));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && videoRef.current && isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [isPlaying]);

  const normalized = content ?? normalizeHomeVideoContent(null);
  const videoUrl = normalized.videoUrl.trim();
  const hasVideo = isValidVideoUrl(videoUrl);
  const hasPoster = isValidImageUrl(normalized.posterImage);
  const showSection = hasHomeVideoContent(normalized);

  if (loading) {
    return (
      <section className="relative h-[400px] md:h-[500px] bg-[#1e3a5f]">
        <motion.div
          className="absolute inset-0 bg-white/5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </section>
    );
  }

  if (!showSection) {
    return null;
  }

  const handlePlayPause = () => {
    if (!videoRef.current || !hasVideo) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      void videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const posterStyle = hasPoster
    ? {
        backgroundImage: `url('${normalized.posterImage}')`,
        backgroundColor: "#1e3a5f",
      }
    : { backgroundColor: "#1e3a5f" };

  return (
    <section ref={sectionRef} className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Poster / background */}
      <motion.div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
          isPlaying && hasVideo ? "opacity-0" : "opacity-100"
        }`}
        style={posterStyle}
        initial={{ scale: 1.05 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />

      {/* Inline video (same section, no modal) */}
      {hasVideo && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          src={videoUrl}
          playsInline
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      {/* Dark overlay for text legibility when paused */}
      <motion.div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
          isPlaying ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {/* Play / pause + headline */}
      <motion.div
        className={`relative z-10 flex h-full flex-col items-center justify-center px-4 text-center ${
          isPlaying ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        {hasVideo && (
          <Magnetic className="mb-8">
            <motion.button
              type="button"
              onClick={handlePlayPause}
              className="group flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm md:h-24 md:w-24"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(221,162,26,0.45)",
                  "0 0 0 24px rgba(221,162,26,0)",
                  "0 0 0 0 rgba(221,162,26,0)",
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity }}
              aria-label="Play video"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white md:h-20 md:w-20">
                <Play className="ml-1 h-8 w-8 fill-[#1F2A54] text-[#1F2A54] md:h-10 md:w-10" />
              </div>
            </motion.button>
          </Magnetic>
        )}

        {normalized.title && (
          <Reveal direction="up" delay={0.1}>
            <h2 className="font-royal text-balance text-2xl font-medium text-white md:text-4xl lg:text-5xl">
              {normalized.title}
            </h2>
          </Reveal>
        )}
      </motion.div>

      {/* Pause control while playing — click anywhere on video area */}
      {isPlaying && hasVideo && (
        <motion.button
          type="button"
          onClick={handlePlayPause}
          className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-black/10 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-label="Pause video"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm md:h-20 md:w-20">
            <Pause className="h-8 w-8 text-white md:h-10 md:w-10" />
          </div>
        </motion.button>
      )}
    </section>
  );
}
