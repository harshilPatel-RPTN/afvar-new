"use client";

import Link from "next/link";
import { useId, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useT } from "@/platform/i18n";
import type { CoverageStatus } from "../data";

export interface FilterableInstrument {
  slug: string;
  /** Translated display name, used for matching. */
  name: string;
  symbol: string;
  coverage: CoverageStatus;
  /** The server-rendered card for this instrument. */
  card: ReactNode;
}

type CoverageFilter = "all" | CoverageStatus;

const EASE = [0.22, 1, 0.36, 1] as const;

const field =
  "h-12 w-full rounded-full border border-(--mk-glass-border) bg-black/30 px-5 text-[14px] text-(--mk-text) placeholder:text-(--mk-dim) transition-[color,background-color,border-color,opacity,transform] hover:border-(--mk-glass-border-hover) focus:border-(--mk-primary) focus:outline-none focus-visible:outline-2 focus-visible:outline-(--mk-primary)";

/**
 * Client-side search + coverage filter over the instrument cards that the
 * server already rendered. Nothing is fetched; it only shows or hides cards.
 */
export function InstrumentFilter({ items }: { items: FilterableInstrument[] }) {
  const { t } = useT();
  const searchId = useId();
  const coverageId = useId();
  const [query, setQuery] = useState("");
  const [coverage, setCoverage] = useState<CoverageFilter>("all");
  // Cards stagger in on first paint only; later filter changes animate without delay.
  const [touched, setTouched] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (coverage !== "all" && item.coverage !== coverage) return false;
      if (!needle) return true;
      return item.name.toLowerCase().includes(needle) || item.symbol.toLowerCase().includes(needle) || item.slug.includes(needle);
    });
  }, [items, query, coverage]);

  return (
    <div>
      <form
        role="search"
        aria-label={t("mk.cat.filter.label")}
        onSubmit={(event) => event.preventDefault()}
        className="pf-tile grid gap-4 rounded-[20px]! p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end sm:p-5"
      >
        <div>
          <label htmlFor={searchId} className="mb-2 block text-[13px] font-medium text-(--mk-dim)">
            {t("mk.cat.filter.search")}
          </label>
          <div className="relative">
            <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-(--mk-dim)">
              <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth={1.7} />
              <path d="m13.2 13.2 3.3 3.3" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
            </svg>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => {
                setTouched(true);
                setQuery(event.target.value);
              }}
              placeholder={t("mk.cat.filter.placeholder")}
              autoComplete="off"
              className={`${field} pl-11`}
            />
          </div>
        </div>
        <div>
          <label htmlFor={coverageId} className="mb-2 block text-[13px] font-medium text-(--mk-dim)">
            {t("mk.cat.filter.coverage")}
          </label>
          <div className="relative">
            <select
              id={coverageId}
              value={coverage}
              onChange={(event) => {
                setTouched(true);
                setCoverage(event.target.value as CoverageFilter);
              }}
              className={`${field} cursor-pointer appearance-none pr-11`}
            >
              <option value="all">{t("mk.cat.filter.all")}</option>
              <option value="available">{t("mk.coverage.available")}</option>
              <option value="planned">{t("mk.coverage.planned")}</option>
            </select>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-(--mk-primary)">
              <path d="m5.5 8 4.5 4.5L14.5 8" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </form>

      <p aria-live="polite" className="mt-5 text-[13px] text-(--mk-dim)">
        {t("mk.cat.filter.count", { count: visible.length, total: items.length })}
      </p>

      {visible.length === 0 ? (
        <p className="pf-tile mt-4 px-6 py-10 text-center text-[14px] text-(--mk-dim)">{t("mk.cat.filter.empty")}</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Same `initial` on server and client (hydration-safe); the global MotionConfig reducedMotion="user" neutralises the transforms. */}
          <AnimatePresence mode="popLayout">
            {visible.map((item, index) => (
              <motion.li
                key={item.slug}
                layout
                initial={touched ? { opacity: 0, scale: 0.96 } : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                transition={{ duration: touched ? 0.35 : 0.7, delay: touched ? 0 : 0.15 + index * 0.08, ease: EASE }}
                className="h-full"
              >
                {item.card}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

export interface CategoryTab {
  id: string;
  label: string;
  href: string;
}

/** Market tabs with a gold indicator that slides to the active pill (shared layoutId). */
export function CategoryTabs({ tabs, activeId, label }: { tabs: CategoryTab[]; activeId: string; label: string }) {
  const reduce = useReducedMotion();
  return (
    <nav aria-label={label} className="mk-no-scrollbar -mx-4 overflow-x-auto px-4">
      {/* Sits over the header photo, so this one keeps the backdrop blur. */}
      <ul className="mk-glass mk-glass-blur inline-flex gap-1 rounded-full p-1.5">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <li key={tab.id} className="relative">
              {active && (
                <motion.span
                  layoutId="mk-category-tab"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-(--mk-primary) shadow-(--mk-glow-primary)"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative z-10 inline-flex h-11 min-w-[44px] items-center rounded-full px-5 text-[14px] font-semibold transition-colors duration-300 ${
                  active ? "text-(--mk-on-primary)" : "text-(--mk-dim) hover:text-(--mk-text)"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
