"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { AnimatedBackdrop, PIcon } from "@/modules/platform/kit";
import { CATEGORIES } from "../content";

const BACKDROP = "/resources/resources-aurora.jpg";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const, delay },
});

/**
 * Resources hero over the section's own artwork — a green ribbon rising and a
 * red one falling, set in motion by the aurora effect with the green market
 * key light. `sub` pages get a shorter band, a breadcrumb and the category tabs.
 */
export function ResourcesHero({
  eyebrow,
  title,
  lede,
  sub = false,
  crumb,
  children,
}: {
  eyebrow: string;
  title: readonly [string, string];
  lede: string;
  sub?: boolean;
  crumb?: { label: string; href: string }[];
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="resources-hero-title" className={`relative isolate px-4 sm:px-6 ${sub ? "pt-16 sm:pt-20" : "pt-24 sm:pt-32"}`}>
      <AnimatedBackdrop
        src={BACKDROP}
        effect="aurora"
        tint="market"
        natural
        priority
        opacity={sub ? 0.46 : 0.56}
        position="center 70%"
        className={`absolute inset-x-0 top-0 ${sub ? "h-[600px]" : "h-[800px]"}`}
        fade="linear-gradient(to bottom, black 46%, transparent)"
      />
      <div className="mx-auto max-w-6xl text-center">
        {crumb && (
          <motion.nav {...fade(0)} aria-label="Breadcrumb" className="mb-7 flex justify-center">
            <ol className="flex flex-wrap items-center justify-center gap-1.5 text-[13px] text-(--text-muted)">
              <li>
                <Link href="/resources" className="hover:text-(--text-primary)">
                  Resources
                </Link>
              </li>
              {crumb.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1.5">
                  <PIcon name="chevron" size={11} />
                  {i === crumb.length - 1 ? (
                    <span aria-current="page" className="text-(--text-secondary)">
                      {c.label}
                    </span>
                  ) : (
                    <Link href={c.href} className="hover:text-(--text-primary)">
                      {c.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </motion.nav>
        )}
        <motion.p {...fade(0.04)} className="text-[17px] font-semibold text-(--accent)">
          {eyebrow}
        </motion.p>
        <motion.h1 {...fade(0.1)} id="resources-hero-title" className={`${sub ? "pf-title" : "pf-hero-title"} mt-3`}>
          {title[0]}
          {title[1] && <span className="block text-(--text-tertiary)">{title[1]}</span>}
        </motion.h1>
        <motion.p {...fade(0.2)} className="pf-lede mx-auto mt-6 max-w-2xl">
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

/** The five W5 destinations as a macOS segmented control; the pill glides to the current page. */
export function ResourcesTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Resources" className="relative z-10 mt-12 flex justify-center px-4">
      <ul className="afvar-glass-track flex max-w-full gap-1 overflow-x-auto rounded-full p-1 [scrollbar-width:none]">
        {CATEGORIES.map((c) => {
          const active = pathname === c.href || pathname.startsWith(`${c.href}/`);
          return (
            <li key={c.id} className="relative shrink-0">
              <Link
                href={c.href}
                aria-current={active ? "page" : undefined}
                className="afvar-glass-tab relative flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors"
              >
                {active && (
                  <motion.span
                    aria-hidden="true"
                    layoutId="resources-tab"
                    className="afvar-glass-indicator absolute inset-0 rounded-full"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <PIcon name={c.icon} size={15} className="relative" />
                <span className="relative">{c.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
