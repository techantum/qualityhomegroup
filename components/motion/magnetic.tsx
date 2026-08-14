"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion/prefs";

type MagneticProps = {
  children: React.ReactNode;
  className?: string;
  strength?: number;
};

/** Trending hover magnetic effect for buttons / CTAs */
export function Magnetic({ children, className, strength = 0.25 }: MagneticProps) {
  const reduced = usePrefersReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className={className}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;
        x.set(offsetX * strength);
        y.set(offsetY * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
