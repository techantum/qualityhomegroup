"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/prefs";

/** Registers GSAP ScrollTrigger once; respects reduced motion */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let mounted = true;

    async function register() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!mounted) return;
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });
    }

    register();
    return () => {
      mounted = false;
    };
  }, [reduced]);

  return <>{children}</>;
}
