"use client";

// Shared hero for the W6/W7 company pages: staggered fades and Apple-scale
// type over the page's own backdrop artwork, set in motion by AnimatedBackdrop
// (per-page effect: aurora shimmer, constellation depth).
import { motion } from "framer-motion";
import { MotionTitle } from "@/modules/home/kit";
import type { ReactNode } from "react";
import { AnimatedBackdrop, type BackdropEffect, type BackdropTint } from "@/modules/platform/kit";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const, delay },
});

export function CompanyHero({
  image,
  effect,
  tint,
  natural = false,
  position = "center 60%",
  eyebrow,
  title,
  lede,
  children,
}: {
  image: string;
  effect: BackdropEffect;
  tint?: BackdropTint;
  /** Keep the artwork's own red/green colours (skips the shell's green recolour). */
  natural?: boolean;
  position?: string;
  eyebrow: string;
  title: readonly [string, string];
  lede: string;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="company-hero-title" className="relative isolate px-4 pt-24 sm:px-6 sm:pt-32">
      <AnimatedBackdrop
        src={image}
        effect={effect}
        tint={tint}
        natural={natural}
        priority
        opacity={0.9}
        position={position}
        className="absolute inset-x-0 top-0 h-[760px]"
        fade="linear-gradient(to bottom, black 48%, transparent)"
      />
      <div className="mx-auto max-w-6xl text-center">
        <motion.p {...fade(0)} className="text-[17px] font-semibold text-(--accent)">
          {eyebrow}
        </motion.p>
        <motion.h1 {...fade(0.08)} id="company-hero-title" className="pf-hero-title mt-3">
          <MotionTitle as="span" text={title[0]} />
          <MotionTitle as="span" text={title[1]} delay={0.3} className="block text-(--text-tertiary)" />
        </motion.h1>
        <motion.p {...fade(0.2)} className="pf-lede mx-auto mt-6 max-w-xl">
          {lede}
        </motion.p>
        {children && (
          <motion.div {...fade(0.3)} className="mt-9">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
