"use client";

// /about hero pattern (company/Hero.tsx) for the Markets pages: staggered
// fades and Apple-scale centred type, over live WebGL silk instead of a photo.
import { motion } from "framer-motion";
import { MotionTitle } from "@/modules/home/kit";
import type { ReactNode } from "react";
import { SilkBackdrop, type SilkTone } from "./SilkBackdrop";

const FADE = "linear-gradient(to bottom, black 48%, transparent)";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const, delay },
});

export function PageHero({
  tone = "gold",
  top,
  eyebrow,
  title,
  lede,
  children,
}: {
  /** Tint of the animated silk behind the hero. */
  tone?: SilkTone;
  /** Breadcrumb or similar, above the eyebrow. */
  top?: ReactNode;
  eyebrow: string;
  title: readonly [string, string?];
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="page-hero-title" className="relative isolate px-4 pt-24 sm:px-6 sm:pt-32">
      {/* Live silk in place of the /about hero artwork: same 760px band, same fade into the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] bg-[#05060a] opacity-95"
        style={{ maskImage: FADE, WebkitMaskImage: FADE }}
      >
        <SilkBackdrop tone={tone} />
      </div>
      <div className="mx-auto max-w-6xl text-center">
        {top && (
          <motion.div {...fade(0)} className="mb-6 flex justify-center">
            {top}
          </motion.div>
        )}
        <motion.p {...fade(0.04)} className="text-[17px] font-semibold text-(--accent)">
          {eyebrow}
        </motion.p>
        <h1 id="page-hero-title" className="pf-hero-title mt-3 text-(--text-primary)">
          <MotionTitle as="span" text={title[0]} className="block" />
          {title[1] && <MotionTitle as="span" text={title[1]} delay={0.3} className="block text-(--text-tertiary)" />}
        </h1>
        {lede && (
          <motion.p {...fade(0.2)} className="pf-lede mx-auto mt-6 max-w-xl">
            {lede}
          </motion.p>
        )}
        {children && (
          <motion.div {...fade(0.3)} className="mt-9">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
