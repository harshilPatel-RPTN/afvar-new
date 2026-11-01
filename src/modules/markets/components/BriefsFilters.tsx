"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useT } from "@/platform/i18n";
import { ArrowIcon, primaryButton, secondaryButton } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;
const SEARCH_DEBOUNCE_MS = 300;

/** A published brief, already translated and formatted on the server. */
export interface BriefItem {
  edition: string;
  title: string;
  category: string;
  categoryLabel: string;
  publishedUtc: string;
  dateLabel: string;
}

type Order = "latest" | "oldest";

/**
 * Filter bar + results for the Market Briefs index. Filters are mirrored into
 * `?market=&q=` with `history.replaceState`, so a view is shareable and
 * Back from a brief returns to it. Filtering runs locally, so results update
 * without waiting for the server.
 */
export function BriefsFilters({
  items,
  initialMarket,
  initialQuery,
}: {
  items: BriefItem[];
  /** Kept for callers; the market picker was removed from the page. */
  markets?: { id: string; label: string }[];
  initialMarket: string;
  initialQuery: string;
}) {
  const { t } = useT();
  const pathname = usePathname();
  const ids = useId();

  const [market, setMarket] = useState(initialMarket);
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [order] = useState<Order>("latest");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Mirror filters into the URL, skipping the first render (the URL already matches).
  const synced = useRef(false);
  useEffect(() => {
    if (!synced.current) {
      synced.current = true;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const term = debouncedQuery.trim();
    if (market) params.set("market", market);
    else params.delete("market");
    if (term) params.set("q", term);
    else params.delete("q");
    const search = params.toString();
    // Native history update (Next syncs it): no server round-trip, so typing never races a refetch.
    window.history.replaceState(null, "", search ? `${pathname}?${search}` : pathname);
  }, [market, debouncedQuery, pathname]);

  const results = useMemo(() => {
    const term = debouncedQuery.trim().toLocaleLowerCase();
    const filtered = items.filter(
      (item) =>
        (!market || item.category === market) &&
        (!term || [item.title, item.categoryLabel, item.edition, item.dateLabel].some((value) => value.toLocaleLowerCase().includes(term))),
    );
    return filtered.sort((a, b) => (order === "latest" ? b.publishedUtc.localeCompare(a.publishedUtc) : a.publishedUtc.localeCompare(b.publishedUtc)));
  }, [items, market, debouncedQuery, order]);

  const filtersActive = Boolean(market || query.trim());
  const clear = () => {
    setMarket("");
    setQuery("");
    setDebouncedQuery("");
  };

  const [featured, ...rest] = results;

  // Every `initial` below is the same on server and client (hydration-safe); the global
  // MotionConfig reducedMotion="user" neutralises transforms, opacity still reaches 1.
  return (
    <>
      <div>
        <AnimatePresence mode="wait" initial>
          {items.length === 0 ? (
            <EmptyPanel key="none" message={t("mk.briefs.empty.none")}>
              <Link href="/market" className={primaryButton}>
                {t("mk.briefs.exploreMarkets")}
                <ArrowIcon />
              </Link>
            </EmptyPanel>
          ) : results.length === 0 ? (
            <EmptyPanel key="filtered" message={t("mk.briefs.empty.filtered")}>
              {filtersActive && (
                <button type="button" onClick={clear} className={primaryButton}>
                  {t("mk.briefs.clear")}
                </button>
              )}
              <Link href="/market" className={secondaryButton}>
                {t("mk.briefs.exploreMarkets")}
              </Link>
            </EmptyPanel>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <section aria-labelledby={`${ids}-latest`}>
                <h2 id={`${ids}-latest`} className="mk-eyebrow mb-4 text-(--mk-dim)">
                  {order === "latest" ? t("mk.briefs.latest") : t("mk.briefs.first")}
                </h2>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={featured.edition}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <BriefCard brief={featured} featured cta={t("mk.briefs.explore")} editionLabel={t("mk.briefs.edition", { edition: featured.edition })} />
                  </motion.div>
                </AnimatePresence>
              </section>

              {rest.length > 0 && (
                <section aria-labelledby={`${ids}-more`} className="mt-12">
                  <h2 id={`${ids}-more`} className="mk-eyebrow mb-4 text-(--mk-dim)">
                    {t("mk.briefs.more")}
                  </h2>
                  <motion.ul layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout" initial>
                      {rest.map((brief, index) => (
                        <motion.li
                          key={brief.edition}
                          layout
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: Math.min(index, 8) * 0.06, ease: EASE } }}
                          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                        >
                          <BriefCard brief={brief} cta={t("mk.briefs.explore")} editionLabel={t("mk.briefs.edition", { edition: brief.edition })} />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </motion.ul>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-10 max-w-[70ch] border-t border-(--mk-line) pt-6 text-[13px] leading-relaxed text-(--mk-dim)">{t("mk.briefs.note")}</p>
    </>
  );
}

function EmptyPanel({ message, children }: { message: string; children: ReactNode }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-(--afvar-panel) px-6 py-14 text-center shadow-(--mk-shadow) sm:px-12 sm:py-20"
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-48 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--mk-primary)_10%,transparent),transparent)]" />
      <span aria-hidden="true" className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-(--mk-primary)/40 bg-(--mk-primary)/10 text-(--mk-primary)">
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20V4a.5.5 0 0 1 .5-.5Z" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M14 3.5V8h4M9.5 12h5M9.5 15.5h5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
        </svg>
      </span>
      <p className="mx-auto mt-6 max-w-[52ch] text-[17px] leading-relaxed text-(--mk-text) sm:text-[19px]">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
    </motion.div>
  );
}

/** Hover: lift (transform) and a gold glow layer that fades in (opacity) — no animated shadows. */
const glowLayer =
  "pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-(--mk-glow-card) transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none";

function BriefCard({ brief, featured = false, cta, editionLabel }: { brief: BriefItem; featured?: boolean; cta: string; editionLabel: string }) {
  return (
    <Link
      href={`/market/briefs/${encodeURIComponent(brief.edition)}`}
      className={`group relative flex h-full flex-col rounded-2xl border border-white/[.08] bg-(--afvar-panel) shadow-(--mk-shadow) transition-[border-color,transform] duration-300 hover:border-(--mk-glass-border-hover) motion-safe:hover:-translate-y-1 motion-reduce:transition-none ${featured ? "p-7 sm:p-10" : "p-6"}`}
    >
      <span aria-hidden="true" className={glowLayer} />
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-(--mk-dim)">
        <span className="rounded-full border border-(--mk-primary)/40 px-2.5 py-0.5 font-medium text-(--mk-primary)">{brief.categoryLabel}</span>
        <time dateTime={brief.publishedUtc}>{brief.dateLabel}</time>
        <span aria-hidden="true">·</span>
        <span>{editionLabel}</span>
      </span>
      <span className={`mt-4 block font-semibold leading-snug text-(--mk-text) ${featured ? "text-[24px] sm:text-[32px]" : "text-[18px]"}`}>{brief.title}</span>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-semibold text-(--mk-primary)">
        {cta}
        <ArrowIcon className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
