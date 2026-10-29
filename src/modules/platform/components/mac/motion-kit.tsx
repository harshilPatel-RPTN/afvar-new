"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ScrubText } from "@/modules/home/kit";
import { useRef, type ReactNode } from "react";

/**
 * Scroll motion: product shots ease up and settle as they enter, and
 * statement copy lights word by word ("/" ScrubText). Both are off under
 * reduced motion.
 */
export function ScrollSettle({ children, className = "" }: { children: ReactNode; className?: string }) {
  const still = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 30%"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.4, 1]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={still ? undefined : { scale, y, opacity, transformOrigin: "50% 0%" }}>{children}</motion.div>
    </div>
  );
}

/** Statement paragraph in the "/" home motion: words light up one by one as
 *  it scrolls through the viewport (with green / red tick underlines), and
 *  dim again when scrolled back. */
export function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  return <ScrubText text={text} className={className} />;
}
