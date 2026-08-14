"use client";

import { motion } from "framer-motion";
import { pageEnter } from "@/lib/motion/variants";
import { usePrefersReducedMotion } from "@/lib/motion/prefs";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageEnter}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}
