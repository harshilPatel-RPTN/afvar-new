"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MotionTitle } from "@/modules/home/kit";
import { pathOf } from "../../routes";
import type { Capability } from "../../types";
import { AppIcon } from "../mac/AppIcon";
import { PIcon } from "../mac/icons";
import { AvailabilityBadge, ChevronLink, RegisterLink } from "../shared";
import { CapabilityPreview } from "./CapabilityPreview";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const, delay },
});

export function CapabilityHero({ capability: c }: { capability: Capability }) {
  return (
    <section aria-labelledby="capability-title" className="px-4 pt-20 sm:px-6 sm:pt-16">
      <motion.nav {...fade(0)} aria-label="Breadcrumb" className="mx-auto flex max-w-6xl">
        <ol className="flex items-center gap-1.5 text-[13px]">
          <li>
            <Link href={pathOf("platform")} className="text-(--text-secondary) transition-colors hover:text-(--text-primary)">
              Platform
            </Link>
          </li>
          <li aria-hidden="true" className="text-(--text-muted)">
            <PIcon name="chevron" size={11} weight="bold" />
          </li>
          <li aria-current="page" className="text-(--text-primary)">
            {c.title}
          </li>
        </ol>
      </motion.nav>

      <div className="mx-auto mt-16 max-w-4xl text-center sm:mt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
          className="inline-block"
        >
          <AppIcon icon={c.icon} tone={c.tone} size={96} />
        </motion.div>
        <motion.h1 {...fade(0.1)} id="capability-title" className="pf-hero-title mt-8">
          <MotionTitle as="span" text={c.title} />
        </motion.h1>
        <motion.p {...fade(0.2)} className="pf-lede mx-auto mt-6 max-w-2xl">
          {c.summary}
        </motion.p>
        <motion.div {...fade(0.3)} className="mt-9 flex flex-nowrap items-center justify-center gap-x-2.5 sm:gap-x-7">
          <RegisterLink />
          <ChevronLink compact href={pathOf("platform")}>Explore the platform</ChevronLink>
        </motion.div>
        <motion.div {...fade(0.4)} className="mt-6 flex justify-center">
          <AvailabilityBadge value="in-development" />
        </motion.div>
      </div>

      <CapabilityPreview capability={c} />
    </section>
  );
}
