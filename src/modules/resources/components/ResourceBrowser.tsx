"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { AppIcon, PIcon } from "@/modules/platform/kit";
import { CATALOG, CATEGORY_COUNTS, searchCatalog, type CatalogItem } from "../catalog";
import { CATEGORIES, category, type CategoryId } from "../content";
import { Window, type WindowState } from "./Window";

/** Fired by the hero's search button; the browser scrolls into view and focuses its field. */
export const SEARCH_EVENT = "afvar:resources-search";

const ease = [0.25, 0.1, 0.25, 1] as const;

function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Bolds each query word inside a title, like Finder's search highlighting. */
function Marked({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.map(escape).join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        words.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="rounded-[3px] bg-(--accent)/25 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * W5.1 showcase: a working macOS “Resources” app over the real resource
 * index. Source-list sidebar (categories + recents), a searchable list with
 * keyboard selection (↑ ↓, ↵ opens), and a live preview pane with Open and
 * Copy Link. Press “/” anywhere on the page to search.
 */
type Scope = CategoryId | "all";

function ResourceBrowser({
  scope,
  setScope,
  windowState,
  onWindowState,
}: {
  scope: Scope;
  setScope: (scope: Scope) => void;
  windowState: WindowState;
  onWindowState: (state: WindowState) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(CATALOG[0].id);
  const [recents, setRecents] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  const results = useMemo(() => searchCatalog(query, scope), [query, scope]);
  const selected: CatalogItem | undefined = results.find((r) => r.id === selectedId) ?? results[0];

  function select(item: CatalogItem) {
    setSelectedId(item.id);
    setRecents((prev) => [item.id, ...prev.filter((id) => id !== item.id)].slice(0, 4));
    // Scroll the list itself, never the page (scrollIntoView would nudge the whole page).
    const box = list.current;
    const row = box?.querySelector<HTMLElement>(`[data-id="${item.id}"]`);
    if (box && row) {
      if (row.offsetTop < box.scrollTop) box.scrollTop = row.offsetTop - 6;
      else if (row.offsetTop + row.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = row.offsetTop + row.offsetHeight - box.clientHeight + 6;
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!results.length) return;
    const index = Math.max(0, results.findIndex((r) => r.id === selected?.id));
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = results[(index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length];
      select(next);
    } else if (event.key === "Enter" && selected) {
      event.preventDefault();
      router.push(selected.href);
    } else if (event.key === "Escape" && query) {
      setQuery("");
    }
  }

  function copyLink() {
    if (!selected) return;
    navigator.clipboard
      ?.writeText(`${window.location.origin}${selected.href}`)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => undefined);
  }

  const scopeTitle = scope === "all" ? "All Resources" : category(scope).title;

  return (
      <Window
        title="Resources"
        icon="search"
        tone="green"
        managed
        fill
        state={windowState}
        onStateChange={onWindowState}
        toolbar={
          <label className="flex h-7 w-[150px] items-center gap-1.5 rounded-md bg-white/[.06] px-2 text-(--text-muted) shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.1)] focus-within:ring-2 focus-within:ring-(--accent)/60 sm:w-[230px]">
            <PIcon name="search" size={13} />
            <input
              data-resources-search
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search resources"
              aria-label="Search resources"
              aria-controls={listId}
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded-full p-0.5 hover:text-(--text-primary)">
                <PIcon name="close" size={11} />
              </button>
            ) : (
              <kbd className="rs-kbd !h-[18px] !min-w-[18px] !text-[10.5px] max-sm:hidden">/</kbd>
            )}
          </label>
        }
        bodyClassName="grid !overflow-y-auto md:!overflow-hidden md:grid-cols-[210px_minmax(0,1fr)] lg:grid-cols-[210px_minmax(0,1fr)_minmax(0,1.05fr)]"
      >
        {/* Source list */}
        <aside className="pf-sidebar hidden flex-col gap-5 overflow-y-auto p-3 md:flex" aria-label="Resource categories">
          <div>
            <p className="px-2 pb-1.5 text-[11px] font-semibold text-(--text-muted)">Resources</p>
            <ul className="space-y-0.5">
              {[{ id: "all" as const, title: "All Resources", icon: "grid" as const, count: CATALOG.length }, ...CATEGORIES.map((c) => ({ id: c.id, title: c.title, icon: c.icon, count: CATEGORY_COUNTS[c.id] }))].map((c) => {
                const active = scope === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setScope(c.id)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
                        active ? "bg-(--mac-select) text-(--text-primary)" : "text-(--text-secondary) hover:bg-white/[.04]"
                      }`}
                    >
                      <PIcon name={c.icon} size={15} className={active ? "text-(--accent)" : "text-(--text-muted)"} />
                      <span className="flex-1 truncate">{c.title}</span>
                      <span className="text-[11px] tabular-nums text-(--text-muted)">{c.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="px-2 pb-1.5 text-[11px] font-semibold text-(--text-muted)">Recents</p>
            {recents.length ? (
              <ul className="space-y-0.5">
                {recents.map((id) => {
                  const item = CATALOG.find((i) => i.id === id)!;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => {
                          setScope("all");
                          setQuery("");
                          setSelectedId(id);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-(--text-secondary) hover:bg-white/[.04]"
                      >
                        <PIcon name="clock" size={13} className="text-(--text-muted)" />
                        <span className="truncate">{item.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-2 text-[12px] leading-relaxed text-(--text-disabled)">Items you preview appear here.</p>
            )}
          </div>
        </aside>

        {/* Mobile scope chips */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-(--mac-hairline) p-2.5 md:hidden [scrollbar-width:none]">
          {[{ id: "all" as const, title: "All" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setScope(c.id)}
              aria-pressed={scope === c.id}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] ${scope === c.id ? "rs-on font-semibold" : "bg-white/[.05] text-(--text-secondary)"}`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex min-h-0 flex-col border-(--mac-hairline) md:border-r">
          <div className="flex items-center justify-between border-b border-(--mac-hairline) px-4 py-2 text-[11.5px] text-(--text-muted)">
            <span className="font-semibold text-(--text-secondary)">{scopeTitle}</span>
            <span>{query ? `${results.length} found` : `${results.length} items`}</span>
          </div>
          <ul
            ref={list}
            id={listId}
            role="listbox"
            aria-label={`${scopeTitle} results`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="max-h-[340px] min-h-0 flex-1 overflow-y-auto p-1.5 outline-none md:max-h-none"
          >
            {results.map((item) => {
              const active = item.id === selected?.id;
              const tone = category(item.category).tone;
              return (
                <li
                  key={item.id}
                  data-id={item.id}
                  role="option"
                  aria-selected={active}
                  onClick={() => select(item)}
                  onDoubleClick={() => router.push(item.href)}
                  className={`flex cursor-default items-center gap-3 rounded-md px-2.5 py-2 transition-colors ${active ? "bg-(--accent) text-(--text-inverse)" : "hover:bg-white/[.035]"}`}
                >
                  <AppIcon icon={item.icon} tone={tone} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">
                      <Marked text={item.title} query={query} />
                    </span>
                    <span className={`block truncate text-[11.5px] ${active ? "text-(--text-inverse)/70" : "text-(--text-muted)"}`}>{item.kind}</span>
                  </span>
                </li>
              );
            })}
            {!results.length && (
              <li className="px-4 py-14 text-center text-[13px] text-(--text-muted)">
                No results for “{query}”.
                <br />
                <Link href="/resources/help#support" className="mt-2 inline-block text-(--accent) hover:underline">
                  Ask support instead
                </Link>
              </li>
            )}
          </ul>
          <div className="hidden items-center justify-between border-t border-(--mac-hairline) px-4 py-1.5 text-[11px] text-(--text-muted) md:flex">
            <span>↑ ↓ to move · ↵ to open · / to search</span>
            <span>Double-click opens</span>
          </div>
        </div>

        {/* Preview */}
        <div className="min-h-0 overflow-y-auto border-t border-(--mac-hairline) bg-black/20 md:col-span-2 lg:col-span-1 lg:border-t-0">
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.article
                key={selected.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22, ease }}
                className="p-6 sm:p-7"
                aria-live="polite"
              >
                <div className="flex items-center gap-3">
                  <AppIcon icon={selected.icon} tone={category(selected.category).tone} size={48} />
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-(--accent)">
                      {category(selected.category).title} · {category(selected.category).ref}
                    </p>
                    <p className="truncate text-[12px] text-(--text-muted)">{selected.kind}</p>
                  </div>
                </div>
                <h3 className="mt-5 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{selected.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-(--text-secondary)">{selected.summary}</p>
                {selected.detail.length > 0 && (
                  <ul className="pf-group mt-5">
                    {selected.detail.slice(0, 6).map((d, i) => (
                      <li key={d} className="flex items-start gap-3 px-3.5 py-2.5 text-[13px] text-(--text-secondary)">
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-(--accent)/15 text-[9.5px] font-bold text-(--accent)">{i + 1}</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href={selected.href} className="rs-btn">
                    Open
                    <PIcon name="chevron" size={12} weight="bold" />
                  </Link>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="rs-ghost"
                  >
                    <PIcon name={copied ? "check" : "link"} size={13} className={copied ? "text-(--accent)" : ""} />
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
              </motion.article>
            ) : (
              <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid h-full min-h-[200px] place-items-center p-8 text-[13px] text-(--text-muted)">
                Nothing selected
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </Window>
  );
}

/** Hero search pill: the platform hero's “Search the platform” pattern, aimed at the Resources app. */
export function SearchLauncher() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(SEARCH_EVENT))}
      className="pf-vibrant inline-flex h-10 items-center gap-2.5 rounded-full px-4 text-[14px] text-(--text-secondary) transition-colors hover:text-(--text-primary)"
    >
      <PIcon name="search" size={15} />
      Search resources
      <kbd className="rs-kbd !h-5 !text-[11px]">/</kbd>
    </button>
  );
}

/* ------------------------------------------------------------- desktop */

function subscribeClock(onChange: () => void) {
  const id = window.setInterval(onChange, 15000);
  return () => window.clearInterval(id);
}
const clockNow = () => new Date().toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });

/** A menu-bar menu: click to open, click outside or Escape to close. */
function Menu({ label, bold = false, items }: { label: string; bold?: boolean; items: { label: string; hint?: string; disabled?: boolean; onSelect: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: globalThis.KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`rounded px-1.5 py-0.5 ${bold ? "font-bold" : ""} ${open ? "bg-white/15" : "hover:bg-white/10"}`}
      >
        {label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.14 }}
            className="pf-vibrant absolute left-0 top-[calc(100%+4px)] z-30 min-w-[210px] rounded-lg p-1 text-[13px] font-normal"
          >
            {items.map((item) => (
              <li key={item.label} role="none">
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className="flex w-full items-center justify-between gap-6 rounded-md px-2.5 py-1 text-left text-(--text-primary) hover:bg-(--accent) hover:text-(--text-inverse) disabled:pointer-events-none disabled:text-(--text-disabled)"
                >
                  {item.label}
                  {item.hint && <span className="text-[12px] opacity-60">{item.hint}</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function DockButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <li className="relative">
      <motion.button
        type="button"
        aria-label={label}
        onClick={onClick}
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileFocus="hover"
        whileTap={{ scale: 0.92 }}
        className="group relative block outline-none"
      >
        {/* grows upward from its bottom edge, so the hover target never slides out from under the cursor */}
        <motion.span variants={{ rest: { scale: 1 }, hover: { scale: 1.28 } }} transition={{ type: "spring", stiffness: 380, damping: 22 }} style={{ originY: 1 }} className="block">
          {children}
        </motion.span>
        <span className="pf-vibrant pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {label}
        </span>
      </motion.button>
      {active && <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/80" />}
    </li>
  );
}

/**
 * W5.1 showcase as a Mac desktop: menu bar (working Go and Window menus, a
 * real clock), the Resources window with working traffic lights, and a Dock.
 * Closed or minimised, the window waits in the Dock; category icons reopen
 * it already filtered. “/” anywhere on the page opens it and focuses search.
 */
export function ResourceDesktop() {
  const [state, setState] = useState<WindowState>("open");
  const [scope, setScope] = useState<Scope>("all");
  const desk = useRef<HTMLDivElement>(null);
  const clock = useSyncExternalStore(subscribeClock, clockNow, () => "");

  function open(next?: Scope) {
    if (next) setScope(next);
    setState((s) => (s === "full" ? s : "open"));
  }

  useEffect(() => {
    const focusSearch = () => {
      desk.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setState((s) => (s === "full" ? s : "open"));
      window.setTimeout(() => document.querySelector<HTMLInputElement>("[data-resources-search]")?.focus({ preventScroll: true }), 520);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if ((event.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      focusSearch();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(SEARCH_EVENT, focusSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SEARCH_EVENT, focusSearch);
    };
  }, []);

  const visible = state === "open" || state === "full";

  return (
    <div ref={desk} data-snake-target className="relative h-[760px] scroll-mt-24 overflow-hidden rounded-[22px] bg-[#050607] shadow-[0_0_0_0.5px_rgba(255,255,255,0.12),0_40px_120px_rgba(0,0,0,0.6)] md:h-[740px]">
      {/* wallpaper: the section's own artwork, dimmed */}
      <Image src="/resources/resources-aurora.jpg" alt="" fill sizes="(min-width: 1200px) 1152px, 100vw" className="object-cover opacity-60" style={{ objectPosition: "center 70%" }} />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(3,4,5,0.2),rgba(3,4,5,0.75))]" />

      {/* menu bar */}
      <div className="pf-menubar absolute inset-x-0 top-0 z-20 !gap-1 !px-2.5">
        <span className="px-1.5 text-[12px] font-bold tracking-[0.18em]">AFVAR</span>
        <Menu
          label="Resources"
          bold
          items={[
            { label: "About Resources", onSelect: () => open("all") },
            { label: "Close Window", disabled: !visible, onSelect: () => setState("closed") },
          ]}
        />
        <div className="max-sm:hidden">
          <Menu label="Go" items={[{ label: "All Resources", onSelect: () => open("all") }, ...CATEGORIES.map((c) => ({ label: c.title, onSelect: () => open(c.id) }))]} />
        </div>
        <div className="max-sm:hidden">
          <Menu
            label="Window"
            items={[
              { label: "Minimise", disabled: state !== "open", onSelect: () => setState("min") },
              { label: state === "full" ? "Exit Full Screen" : "Enter Full Screen", disabled: !visible, onSelect: () => setState(state === "full" ? "open" : "full") },
              { label: visible ? "Bring to Front" : "Reopen Resources", onSelect: () => open() },
            ]}
          />
        </div>
        <span className="px-1.5 text-(--text-secondary) max-md:hidden">Help</span>
        <span className="ml-auto flex items-center gap-3 pr-1 text-[12px]">
          <button
            type="button"
            aria-label="Search resources"
            onClick={() => window.dispatchEvent(new Event(SEARCH_EVENT))}
            className="rounded p-0.5 hover:bg-white/10"
          >
            <PIcon name="search" size={13} />
          </button>
          <PIcon name="wifi" size={14} className="max-sm:hidden" />
          <span className="tabular-nums" suppressHydrationWarning>
            {clock}
          </span>
        </span>
      </div>

      {/* window area */}
      <div className="absolute inset-x-3 bottom-[96px] top-[42px] sm:inset-x-6 lg:inset-x-8">
        <ResourceBrowser scope={scope} setScope={setScope} windowState={state} onWindowState={setState} />
        <AnimatePresence>
          {!visible && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.35 } }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center text-center"
            >
              <div>
                <p className="text-[15px] font-medium text-white/80">{state === "min" ? "Resources is minimised" : "Resources is closed"}</p>
                <p className="mt-1.5 text-[13px] text-white/55">Click the magnifier in the Dock, or press /</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* dock */}
      <nav aria-label="Dock" className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
        <ul className="pf-vibrant flex items-end gap-2.5 rounded-[20px] px-3 pb-2.5 pt-2.5">
          <DockButton label={visible ? "Resources" : "Open Resources"} active={state !== "closed"} onClick={() => open()}>
            <AppIcon icon="search" tone="green" size={46} />
          </DockButton>
          <li aria-hidden="true" className="mx-0.5 h-10 w-px self-center bg-white/15" />
          {CATEGORIES.map((c) => (
            <DockButton key={c.id} label={c.title} onClick={() => open(c.id)}>
              <AppIcon icon={c.icon} tone={c.tone} size={46} />
            </DockButton>
          ))}
        </ul>
      </nav>
    </div>
  );
}
