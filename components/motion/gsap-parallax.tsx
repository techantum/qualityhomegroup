"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/prefs";

type GsapParallaxProps = {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  scale?: number;
};

/** Subtle GSAP scroll parallax on a wrapper element */
export function GsapParallax({ children, className, speed = 0.35, scale = 1.08 }: GsapParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;

    let ctx: { revert: () => void } | undefined;

    async function init() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      const el = ref.current;
      if (!el) return;

      ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { yPercent: -speed * 100, scale },
          {
            yPercent: speed * 100,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );
      }, el);
    }

    init();
    return () => ctx?.revert();
  }, [reduced, speed, scale]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
