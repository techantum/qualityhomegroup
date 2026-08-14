"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/prefs";

type FloatingOrbsProps = {
  className?: string;
};

/** Ambient floating gradient orbs (GSAP) for premium section backgrounds */
export function FloatingOrbs({ className = "" }: FloatingOrbsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !containerRef.current) return;

    let ctx: { revert: () => void } | undefined;
    const orbs = containerRef.current.querySelectorAll("[data-orb]");

    async function animate() {
      const { gsap } = await import("gsap");
      ctx = gsap.context(() => {
        orbs.forEach((orb, i) => {
          gsap.to(orb, {
            x: `random(-40, 40)`,
            y: `random(-30, 30)`,
            duration: `random(4, 7)`,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.4,
          });
        });
      }, containerRef);
    }

    animate();
    return () => ctx?.revert();
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        data-orb
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#DDA21A]/20 blur-3xl"
      />
      <div
        data-orb
        className="absolute top-1/3 -right-16 h-96 w-96 rounded-full bg-[#1F2A54]/15 blur-3xl"
      />
      <div
        data-orb
        className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#C9A227]/15 blur-3xl"
      />
    </div>
  );
}
