"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { translate, useT, type MessageKey } from "@/platform/i18n";
import { INSTRUMENTS, type CoverageStatus } from "../data";
import { iconButton } from "./ui";

/**
 * Site-wide search (header). Searches only static navigation targets and the
 * instrument catalogue — never prices. Opens with the button, Ctrl/⌘+K or "/".
 */

type Result = {
  id: string;
  group: "markets" | "instruments";
  labelKey: MessageKey;
  href: string;
  symbol?: string;
  coverage?: CoverageStatus;
  /** Extra lowercase strings to match against besides the translated + English label. */
  terms: string[];
};

const MARKET_LINKS: { key: MessageKey; href: string; terms: string[] }[] = [
  { key: "mk.nav.markets.overview", href: "/market", terms: ["market", "markets"] },
  { key: "mk.nav.markets.commodities", href: "/market/commodities", terms: ["commodities"] },
  { key: "mk.nav.markets.forex", href: "/market/forex", terms: ["forex", "fx", "currency"] },
  { key: "mk.nav.markets.crypto", href: "/market/crypto", terms: ["crypto"] },
  { key: "mk.nav.markets.briefs", href: "/market/briefs", terms: ["briefs"] },
];

const ALL_RESULTS: Result[] = [
  ...MARKET_LINKS.map<Result>((link) => ({
    id: `m-${link.href.replace(/\W+/g, "-")}`,
    group: "markets",
    labelKey: link.key,
    href: link.href,
    terms: link.terms,
  })),
  ...INSTRUMENTS.map<Result>((instrument) => ({
    id: `i-${instrument.category}-${instrument.slug}`,
    group: "instruments",
    labelKey: instrument.nameKey,
    href: `/market/${instrument.category}/${instrument.slug}`,
    symbol: instrument.displaySymbol,
    coverage: instrument.coverage,
    terms: [
      instrument.displaySymbol.toLowerCase(),
      instrument.displaySymbol.replace(/\//g, "").toLowerCase(),
      instrument.slug.toLowerCase(),
    ],
  })),
];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const subscribeNoop = () => () => {};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function SearchIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="8.75" cy="8.75" r="5.75" fill="none" stroke="currentColor" strokeWidth={1.8} />
      <path d="m13 13 4 4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function SiteSearch({ open, onOpenChange, menuFocus }: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  /** When search is launched from the navigation drawer, restore its visible Menu trigger. */
  menuFocus?: () => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const uid = useId();
  const titleId = `${uid}-title`;
  const listId = `${uid}-list`;
  const optionId = (id: string) => `${uid}-${id}`;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_RESULTS;
    const qCompact = q.replace(/\//g, "");
    return ALL_RESULTS.filter((result) => {
      const haystack = [t(result.labelKey).toLowerCase(), translate("en", result.labelKey).toLowerCase(), ...result.terms];
      return haystack.some((value) => value.includes(q) || (qCompact.length > 0 && value.includes(qCompact)));
    });
  }, [query, t]);

  const activeIndex = results.length === 0 ? -1 : Math.min(active, results.length - 1);
  const activeResult = activeIndex >= 0 ? results[activeIndex] : undefined;

  const openSearch = useCallback(() => {
    setQuery("");
    setActive(0);
    onOpenChange(true);
  }, [onOpenChange]);

  const closeSearch = useCallback((restoreFocus = true) => {
    setQuery("");
    setActive(0);
    onOpenChange(false);
    if (restoreFocus) {
      if (menuFocus) menuFocus();
      else buttonRef.current?.focus();
    }
  }, [menuFocus, onOpenChange]);

  const go = useCallback(
    (result: Result) => {
      closeSearch(false);
      router.push(result.href);
    },
    [router, closeSearch],
  );

  // Global shortcuts: Ctrl/⌘+K toggles, "/" opens when not typing in a field.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) closeSearch();
        else openSearch();
        return;
      }
      if (!open && event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        openSearch();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openSearch, closeSearch]);

  // While open: focus the input and lock page scroll.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Keep the active option visible.
  useEffect(() => {
    if (!open || !activeResult) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-result-id="${activeResult.id}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeResult]);

  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key === "Tab" && panelRef.current) {
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + results.length) % results.length);
    } else if (event.key === "Home" && event.ctrlKey) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End" && event.ctrlKey) {
      event.preventDefault();
      setActive(results.length - 1);
    } else if (event.key === "Enter" && activeResult) {
      event.preventDefault();
      go(activeResult);
    }
  }

  const groups: { id: Result["group"]; labelKey: MessageKey }[] = [
    { id: "markets", labelKey: "mk.search.group.markets" },
    { id: "instruments", labelKey: "mk.search.group.instruments" },
  ];

  const fade = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

  const dialog = (
    <AnimatePresence>
      {open && (
        <div key="mk-site-search" className={`fixed inset-0 ${menuFocus ? "z-[130]" : "z-[100]"} flex items-start justify-center px-4 pt-[12vh] sm:pt-[14vh]`}>
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
            onMouseDown={() => closeSearch()}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
            transition={fade}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={onPanelKeyDown}
            className="afvar-glass-panel mk-glass mk-glass-blur relative flex max-h-[min(560px,76vh)] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl bg-(--mk-glass-strong) text-(--mk-text) shadow-(--mk-shadow)"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.97, y: -6 }}
            transition={fade}
          >
            <h2 id={titleId} className="sr-only">
              {t("mk.search.title")}
            </h2>
            <div className="flex items-center gap-3 border-b border-(--mk-line) px-4">
              <SearchIcon className="h-5 w-5 shrink-0 text-(--mk-primary)" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeResult ? optionId(activeResult.id) : undefined}
                aria-label={t("mk.search.title")}
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder={t("mk.search.placeholder")}
                className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-(--mk-text) outline-none placeholder:text-(--mk-dim)"
              />
              <button
                type="button"
                onClick={() => closeSearch()}
                aria-label={t("mk.search.close")}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-(--mk-dim) transition-[color,background-color,border-color,opacity,transform] hover:text-(--mk-primary) focus-visible:outline-2 focus-visible:outline-(--mk-primary)"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mk-no-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
              <ul ref={listRef} id={listId} role="listbox" aria-label={t("mk.search.results")} className={results.length === 0 ? "hidden" : undefined}>
                {groups.map((group) => {
                  const items = results.filter((result) => result.group === group.id);
                  if (items.length === 0) return null;
                  const groupLabelId = `${uid}-group-${group.id}`;
                  return (
                    <li key={group.id} role="presentation" className="mb-1 last:mb-0">
                      <p id={groupLabelId} className="mk-eyebrow px-3 pb-1.5 pt-3">
                        {t(group.labelKey)}
                      </p>
                      <ul role="group" aria-labelledby={groupLabelId}>
                        {items.map((result) => {
                          const index = results.indexOf(result);
                          const selected = index === activeIndex;
                          return (
                            <motion.li
                              key={result.id}
                              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={reduceMotion ? { duration: 0 } : { duration: 0.22, delay: Math.min(index, 10) * 0.025, ease: [0.22, 1, 0.36, 1] }}
                              id={optionId(result.id)}
                              data-result-id={result.id}
                              role="option"
                              aria-selected={selected}
                              onMouseMove={() => {
                                if (!selected) setActive(index);
                              }}
                              onClick={() => go(result)}
                              className={`relative flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-[15px] ${
                                selected ? "text-(--mk-text)" : "text-(--mk-text)/90"
                              }`}
                            >
                              {selected && (
                                <motion.span
                                  aria-hidden="true"
                                  layoutId={`${uid}-active`}
                                  className="absolute inset-0 rounded-xl border border-(--mk-primary)/45 bg-(--mk-primary)/10"
                                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 40, mass: 0.7 }}
                                />
                              )}
                              <span className="relative min-w-0 flex-1 truncate font-medium">{t(result.labelKey)}</span>
                              {result.symbol && (
                                <span className="relative shrink-0 font-mono text-[12.5px] text-(--mk-dim)" dir="ltr">
                                  {result.symbol}
                                </span>
                              )}
                              {result.coverage === "planned" && (
                                <span className="relative shrink-0 rounded-full border border-(--mk-glass-border) px-2 py-0.5 text-[11.5px] font-medium text-(--mk-dim)">
                                  {t("mk.coverage.planned")}
                                </span>
                              )}
                              <svg
                                viewBox="0 0 20 20"
                                className={`relative h-4 w-4 shrink-0 transition-opacity motion-reduce:transition-none ${selected ? "text-(--mk-primary) opacity-100" : "opacity-0"}`}
                                aria-hidden="true"
                              >
                                <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </motion.li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}
              </ul>
              {results.length === 0 && (
                <p role="status" className="px-4 py-10 text-center text-[14px] leading-relaxed text-(--mk-dim)">
                  {t("mk.search.empty")}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-(--mk-line) px-4 py-2.5 text-[12px] text-(--mk-dim)">
              <span>{t("mk.search.hint")}</span>
              <span aria-hidden="true" className="hidden items-center gap-1 sm:inline-flex">
                <kbd className="rounded border border-(--mk-glass-border) px-1.5 py-0.5 font-mono text-[11px]">↑</kbd>
                <kbd className="rounded border border-(--mk-glass-border) px-1.5 py-0.5 font-mono text-[11px]">↓</kbd>
                <kbd className="rounded border border-(--mk-glass-border) px-1.5 py-0.5 font-mono text-[11px]">↵</kbd>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {!menuFocus && <button
        ref={buttonRef}
        type="button"
        onClick={openSearch}
        aria-label={t("mk.search.button")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Control+K Meta+K /"
        className={`${iconButton} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mk-primary)`}
      >
        <SearchIcon />
      </button>}
      {mounted && createPortal(dialog, document.body)}
    </>
  );
}
