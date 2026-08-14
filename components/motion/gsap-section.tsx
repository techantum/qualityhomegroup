"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/prefs";

type GsapSectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

/** Pins section briefly and fades children in with GSAP ScrollTrigger */
export function GsapSection({ children, className, id }: GsapSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !sectionRef.current || !contentRef.current) return;

    let ctx: { revert: () => void } | undefined;

    async function init() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      const section = sectionRef.current;
      const content = contentRef.current;
      if (!section || !content) return;

      ctx = gsap.context(() => {
        gsap.from(content, {
          opacity: 0,
          y: 80,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            end: "top 25%",
            toggleActions: "play none none reverse",
          },
        });
      }, section);
    }

    init();
    return () => ctx?.revert();
  }, [reduced]);

  return (
    <section ref={sectionRef} id={id} className={className}>
      <div ref={contentRef}>{children}</div>
    </section>
  );
}
