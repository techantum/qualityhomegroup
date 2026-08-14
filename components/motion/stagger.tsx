"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion/prefs";
import { staggerContainer, staggerItem, easeOutExpo } from "@/lib/motion/variants";

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
};

export function Stagger({ children, className, stagger = 0.12, delayChildren = 0.06 }: StaggerProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      variants={{
        hidden: staggerContainer.hidden,
        visible: {
          ...staggerContainer.visible,
          transition: { staggerChildren: stagger, delayChildren },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div variants={staggerItem} transition={{ ease: easeOutExpo }} className={className}>
      {children}
    </motion.div>
  );
}
