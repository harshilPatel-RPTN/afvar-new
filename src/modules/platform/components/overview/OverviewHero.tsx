"use client";

import { motion } from "framer-motion";
import { MotionTitle } from "@/modules/home/kit";
import { OVERVIEW } from "../../content";
import { AnimatedBackdrop } from "../mac/AnimatedBackdrop";
import { ChevronLink, RegisterLink } from "../shared";
import { PaletteHint } from "../CommandPalette";
import { TryDesktop } from "../os/TryDesktop";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const, delay },
});

export function OverviewHero() {
  return (
    <section aria-labelledby="platform-title" className="relative isolate px-4 pt-24 sm:px-6 sm:pt-32">
      <AnimatedBackdrop
        src="/platform/bg/platform-rg-hd.jpg"
        effect="silk"
        tint="market"
        natural
        priority
        opacity={0.85}
        position="center 70%"
        className="absolute inset-x-0 top-0 h-[900px]"
        fade="linear-gradient(to bottom, black 45%, transparent)"
      />
      <div className="mx-auto max-w-6xl text-center">
        <motion.p {...fade(0)} className="text-[17px] font-semibold text-(--accent)">
          AFVAR Platform
        </motion.p>
        <motion.h1 {...fade(0.08)} id="platform-title" className="pf-hero-title mt-3">
          <MotionTitle as="span" text={OVERVIEW.title[0]} />
          <MotionTitle as="span" text={OVERVIEW.title[1]} delay={0.3} className="block text-(--text-tertiary)" />
        </motion.h1>
        <motion.p {...fade(0.2)} className="pf-lede mx-auto mt-6 max-w-xl">
          {OVERVIEW.summary}
        </motion.p>
        <motion.div {...fade(0.3)} className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          <RegisterLink />
          <ChevronLink href="#explore">Explore the platform</ChevronLink>
        </motion.div>
        <motion.p {...fade(0.4)} className="mt-6 text-[13px] text-(--text-muted)">
          Pre-launch · AFVAR is in development. Registration does not unlock the full OS.
        </motion.p>
        <motion.div {...fade(0.42)} className="mt-5 flex justify-center">
          <PaletteHint />
        </motion.div>
      </div>

      <motion.div {...fade(0.45)} className="mt-14 sm:mt-16">
        <TryDesktop />
      </motion.div>
    </section>
  );
}
