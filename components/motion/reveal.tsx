"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion/prefs";
import { directionMap, easeOutExpo, type RevealDirection } from "@/lib/motion/variants";

type RevealProps = {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  amount?: number;
  once?: boolean;
  className?: string;
};

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.75,
  amount = 0.2,
  once = true,
  className,
}: RevealProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: "0px 0px -60px 0px" }}
      variants={directionMap[direction]}
      transition={{ duration, delay, ease: easeOutExpo }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
