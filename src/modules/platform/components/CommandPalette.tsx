"use client";

/**
 * Spotlight-style command palette for the Platform pages.
 *
 * Interaction model (search field, grouped results, highlighted row, Enter to
 * open) follows the Spotlight in Renovamen/playground-macos
 * (https://github.com/Renovamen/playground-macos, MIT licence,
 * src/components/Spotlight.tsx). Rewritten here for React 19 + framer-motion;
 * no code is copied verbatim.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { isMacPlatform, isTypingTarget } from "@/platform/keyboard";
import { CAPABILITIES, OVERVIEW } from "../content";
import { REGISTER_URL, capabilityPath, pathOf } from "../routes";
import { AppIcon } from "./mac/AppIcon";
import { PIcon } from "./mac/icons";

const PALETTE_EVENT = "afvar:palette";

/** Opens the palette from anywhere (e.g. a menu-bar button). */
export function openCommandPalette(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT));
}

/* ---------------------------------------------------------- platform */

const noopSubscribe = () => () => {};

/** ⌘ on the server and on macOS; "Ctrl" elsewhere once hydrated. */
function useIsMac(): boolean {
  return useSyncExternalStore(noopSubscribe, () => isMacPlatform(), () => true);
}

function isPaletteShortcut(event: KeyboardEvent): boolean {
  if (event.key.toLowerCase() !== "k" || event.altKey || event.shiftKey) return false;
  return isMacPlatform() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------- items */

type Group = "Pages" | "On this page" | "Actions";
const GROUPS: Group[] = ["Pages", "On this page", "Actions"];

interface PaletteItem {
  id: string;
  group: Group;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  run: () => void;
}

interface PageSection {
  id: string;
  title: string;
  element: Element;
}

/** Reads the sections of the current page; called when the palette opens. */
function readSections(): PageSection[] {
  const result: PageSection[] = [];
  document.querySelectorAll("main section[aria-labelledby]").forEach((section) => {
    const headingId = section.getAttribute("aria-labelledby")?.split(/\s+/)[0];
    const title = headingId ? document.getElementById(headingId)?.textContent?.replace(/\s+/g, " ").trim() : "";
    if (headingId && title) result.push({ id: headingId, title, element: section });
  });
  return result;
}

function matches(item: PaletteItem, query: string): boolean {
  if (!query) return true;
  return item.title.toLowerCase().includes(query) || (item.subtitle?.toLowerCase().includes(query) ?? false);
}

function SmallTile({ name }: { name: "file" | "user" }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-(--surface-3) text-(--text-secondary)" aria-hidden="true">
      <PIcon name={name} size={15} weight="fill" />
    </span>
  );
}

/* ------------------------------------------------------------ palette */

export function CommandPalette() {
  const router = useRouter();
  const baseId = useId();
  const listId = `${baseId}-list`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [sections, setSections] = useState<PageSection[]>([]);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    const focused = document.activeElement;
    restoreFocus.current = focused instanceof HTMLElement && focused !== document.body ? focused : null;
    setSections(readSections());
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    const target = restoreFocus.current;
    restoreFocus.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }, []);

  // Global shortcut + programmatic open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isPaletteShortcut(event)) return;
      const inPalette = event.target instanceof Element && !!event.target.closest("[data-command-palette]");
      if (!inPalette && isTypingTarget(event.target)) return;
      event.preventDefault();
      // The markets SiteSearch (shared shell) also binds ⌘K on window; this
      // listener runs in the capture phase, so stopping propagation here keeps
      // the shortcut exclusive to the palette on /platform pages.
      event.stopPropagation();
      if (open) close();
      else show();
    };
    const onOpen = () => {
      if (!open) show();
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, [open, show, close]);

  const items = useMemo<PaletteItem[]>(() => {
    const pages: PaletteItem[] = [
      {
        id: "page-platform",
        group: "Pages",
        title: "Platform Overview",
        subtitle: OVERVIEW.summary,
        icon: <AppIcon icon="desktop" tone="slate" size={28} />,
        run: () => router.push(pathOf("platform")),
      },
      ...CAPABILITIES.map<PaletteItem>((capability) => ({
        id: `page-${capability.slug}`,
        group: "Pages",
        title: capability.title,
        subtitle: capability.tagline,
        icon: <AppIcon icon={capability.icon} tone={capability.tone} size={28} />,
        run: () => router.push(capabilityPath(capability.slug)),
      })),
    ];
    const onThisPage = sections.map<PaletteItem>((section) => ({
      id: `section-${section.id}`,
      group: "On this page",
      title: section.title,
      icon: <SmallTile name="file" />,
      run: () => section.element.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }),
    }));
    const actions: PaletteItem[] = [
      {
        id: "action-register",
        group: "Actions",
        title: "Register Now",
        subtitle: "Create your AFVAR account",
        icon: <SmallTile name="user" />,
        run: () => window.location.assign(REGISTER_URL),
      },
    ];
    return [...pages, ...onThisPage, ...actions];
  }, [router, sections]);

  const needle = query.trim().toLowerCase();
  const results = useMemo(() => {
    const filtered = items.filter((item) => matches(item, needle));
    // Keep group order so the flat index matches what is on screen.
    return GROUPS.flatMap((group) => filtered.filter((item) => item.group === group));
  }, [items, needle]);

  const activeIndex = results.length ? Math.min(active, results.length - 1) : -1;
  const activeItem = activeIndex >= 0 ? results[activeIndex] : undefined;
  const optionId = (item: PaletteItem) => `${baseId}-${item.id}`;
  const activeId = activeItem ? optionId(activeItem) : undefined;

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    if (!activeId) return;
    document.getElementById(activeId)?.scrollIntoView?.({ block: "nearest" });
  }, [activeId]);

  const activate = (item: PaletteItem) => {
    close();
    item.run();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!results.length) return;
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActive((activeIndex + step + results.length) % results.length);
        return;
      }
      case "Enter":
        event.preventDefault();
        if (activeItem) activate(activeItem);
        return;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      case "Tab":
        // Focus stays in the search field; the list is driven by the arrows.
        event.preventDefault();
        return;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-palette"
          data-command-palette=""
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          onKeyDown={onKeyDown}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the platform"
            className="pf-vibrant w-full max-w-[640px] overflow-hidden rounded-2xl text-(--text-primary)"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <PIcon name="search" size={22} className="text-(--text-secondary)" />
              <input
                autoFocus
                type="text"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls={listId}
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                aria-label="Search the platform"
                placeholder="Search the platform"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                className="min-w-0 flex-1 bg-transparent text-xl font-light text-(--text-primary) !outline-none placeholder:text-(--text-muted)"
              />
              <kbd className="hidden rounded-md bg-(--surface-3) px-1.5 py-0.5 text-[11px] text-(--text-tertiary) sm:inline">esc</kbd>
            </div>

            <div className="border-t-[0.5px] border-(--border-default)">
              {results.length === 0 ? (
                <div id={listId} role="listbox" aria-label="Results" className="px-4 py-10 text-center">
                  <p className="text-sm text-(--text-primary)">No matches found.</p>
                  <p className="mt-1 text-xs text-(--text-tertiary)">Try another page or section.</p>
                </div>
              ) : (
                <div id={listId} role="listbox" aria-label="Results" className="max-h-[min(60vh,440px)] overflow-y-auto p-2">
                  {GROUPS.map((group) => {
                    const groupItems = results.filter((item) => item.group === group);
                    if (!groupItems.length) return null;
                    const groupKey = group.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <div key={group} role="group" aria-labelledby={`${baseId}-${groupKey}`} className="mb-1 last:mb-0">
                        <div id={`${baseId}-${groupKey}`} className="px-2 pb-1 pt-2 text-[11px] font-semibold text-(--text-tertiary)">
                          {group}
                        </div>
                        {groupItems.map((item) => {
                          const selected = item === activeItem;
                          return (
                            <div
                              key={item.id}
                              id={optionId(item)}
                              role="option"
                              aria-selected={selected}
                              onMouseMove={() => {
                                const index = results.indexOf(item);
                                if (index !== activeIndex) setActive(index);
                              }}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => activate(item)}
                              className={`flex cursor-default items-center gap-3 rounded-lg px-2 py-1.5 ${
                                selected ? "bg-(--mac-select) text-(--text-inverse)" : "text-(--text-primary)"
                              }`}
                            >
                              {item.icon}
                              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                                <span className="truncate text-sm font-medium">{item.title}</span>
                                {item.subtitle && (
                                  <span className={`truncate text-xs ${selected ? "text-(--text-inverse) opacity-75" : "text-(--text-tertiary)"}`}>
                                    {item.subtitle}
                                  </span>
                                )}
                              </span>
                              {selected && <PIcon name="chevron" size={14} />}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------------- hint */

/** Small pill that opens the palette: "Search the platform ⌘K". */
export function PaletteHint({ className = "" }: { className?: string }) {
  const isMac = useIsMac();
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className={`inline-flex items-center gap-2 rounded-full bg-(--surface-2) px-3 py-1.5 text-xs text-(--text-secondary) shadow-[inset_0_0_0_0.5px_var(--border-default)] transition-colors hover:bg-(--surface-hover) hover:text-(--text-primary) ${className}`}
    >
      <PIcon name="search" size={14} />
      <span>Search the platform</span>
      <kbd className="rounded bg-(--surface-3) px-1.5 py-0.5 font-sans text-[11px] text-(--text-tertiary)">{isMac ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
}
