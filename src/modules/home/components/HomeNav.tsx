"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { NAV } from "../content";
import { MarketPulseDot } from "./MarketPulse";

type NavChild = { label: string; href: string };
type NavItem = { label: string; href: string; children?: readonly NavChild[] };

const ITEMS: readonly NavItem[] = NAV;

/** External workspace sign-in (existing product URL; not a site route). */
const SIGN_IN_URL = "https://app.afvar.com/";

/** Spec §19 — visible keyboard focus: neutral 2px ring with offset on the near-black bar. */
const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[rgba(245,247,247,.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080A0B]";

/** Register Now — the neutral primary pill (light fill, dark text; green/red are market-only). */
const REGISTER_PILL = `inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#F5F7F7] px-4 text-[13px] font-semibold text-[#030405] transition-colors duration-200 hover:bg-white motion-reduce:transition-none ${FOCUS_RING}`;

function inSection(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Chevron({ open, className = "h-3 w-3" }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`${className} transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
    >
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop dropdown group                                              */
/* ------------------------------------------------------------------ */

function DesktopGroup({
  item,
  pathname,
  open,
  onOpenChange,
}: {
  item: NavItem & { children: readonly NavChild[] };
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const panelId = useId();
  const wrapRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);
  const active = inSection(pathname, item.href);

  const clearTimer = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  useEffect(() => clearTimer, []);

  // Click / tap outside closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onOpenChange]);

  const links = () => Array.from(wrapRef.current?.querySelectorAll<HTMLAnchorElement>("[data-nav-item]") ?? []);

  const focusItem = (index: number) => {
    const list = links();
    if (list.length === 0) return;
    list[(index + list.length) % list.length]?.focus();
  };

  // Enter/Space toggle via the native button click; arrows open and move focus in.
  const onButtonKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const first = e.key === "ArrowDown";
      onOpenChange(true);
      requestAnimationFrame(() => focusItem(first ? 0 : -1));
    }
  };

  const onWrapKey = (e: ReactKeyboardEvent<HTMLLIElement>) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
      buttonRef.current?.focus();
      return;
    }
    const list = links();
    const index = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (index === -1) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(-1);
    }
  };

  return (
    <li
      ref={wrapRef}
      className="relative"
      onKeyDown={onWrapKey}
      // Hover may also open (mouse only); click remains the primary gesture.
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimer();
        onOpenChange(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimer();
        closeTimer.current = window.setTimeout(() => onOpenChange(false), 140);
      }}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) onOpenChange(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={() => {
          clearTimer();
          onOpenChange(!open);
        }}
        onKeyDown={onButtonKey}
        className={`inline-flex h-10 items-center gap-1 rounded-md px-2.5 text-[13px] transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
          active || open ? "font-medium text-(--afvar-text)" : "text-[#A3AAAC] hover:text-(--afvar-text)"
        }`}
      >
        {item.label}
        {item.href === "/market" && pathname === "/" && <MarketPulseDot />}
        <Chevron open={open} />
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-2">
          {/* Spec §3.1/§5.2 — solid dark panel, hairline border, shadow. No blur/glass. */}
          <ul
            role="menu"
            id={panelId}
            aria-label={item.label}
            className="min-w-[240px] rounded-xl border border-white/[.11] bg-(--afvar-panel) p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,.85)]"
          >
            {item.children.map((child) => {
              const current = pathname === child.href;
              return (
                <li key={child.href} role="none">
                  <Link
                    data-nav-item
                    role="menuitem"
                    href={child.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => onOpenChange(false)}
                    className={`flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 text-[13.5px] transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
                      current
                        ? "bg-white/[.06] font-medium text-(--afvar-text)"
                        : "text-[#A3AAAC] hover:bg-white/[.05] hover:text-(--afvar-text) focus-visible:text-(--afvar-text)"
                    }`}
                  >
                    {child.label}
                    {current && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#A3AAAC]" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile sheet (simple disclosure under the bar — not a floating panel) */
/* ------------------------------------------------------------------ */

function MobileSheet({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const baseId = useId();
  const [expanded, setExpanded] = useState<string | null>(() => {
    const current = ITEMS.find((item) => item.children && item.href !== "/" && inSection(pathname, item.href));
    return current?.href ?? null;
  });

  // Body scroll lock while the sheet is open.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // Escape closes, wherever focus is.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rowClass = (active: boolean) =>
    `flex min-h-12 flex-1 items-center rounded-lg px-3 text-[16px] transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
      active ? "font-medium text-white" : "text-(--afvar-text) hover:bg-white/[.05]"
    }`;

  return (
    <div
      id="home-mobile-sheet"
      className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col overflow-y-auto border-t border-white/[.11] bg-(--afvar-charcoal) lg:hidden"
    >
      <nav aria-label="Primary" className="flex-1 px-3 py-4 sm:px-5">
        <ul className="space-y-1">
          {ITEMS.map((item) => {
            const active = inSection(pathname, item.href);
            if (!item.children) {
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onClose} aria-current={active ? "page" : undefined} className={rowClass(active)}>
                    {item.label}
                  </Link>
                </li>
              );
            }
            const isOpen = expanded === item.href;
            const groupId = `${baseId}-${item.href.slice(1)}`;
            return (
              <li key={item.href}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={groupId}
                  onClick={() => setExpanded(isOpen ? null : item.href)}
                  className={`flex min-h-12 w-full items-center justify-between rounded-lg px-3 text-[16px] transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
                    active ? "font-medium text-(--afvar-text)" : "text-(--afvar-text) hover:bg-white/[.05]"
                  }`}
                >
                  {item.label}
                  <Chevron open={isOpen} className="h-4 w-4 text-[#A3AAAC]" />
                </button>
                {isOpen && (
                  <ul id={groupId} className="ml-3 border-l border-white/[.11] pl-2">
                    {item.children.map((child) => {
                      const current = pathname === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            aria-current={current ? "page" : undefined}
                            className={`flex min-h-11 items-center rounded-lg px-3 text-[14px] transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
                              current ? "font-medium text-white" : "text-[#A3AAAC] hover:bg-white/[.04] hover:text-(--afvar-text)"
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 space-y-2.5 border-t border-white/[.11] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
        <a
          href={SIGN_IN_URL}
          className={`flex h-12 w-full items-center justify-center rounded-full border border-white/[.11] text-[15px] font-medium text-[#A3AAAC] transition-colors duration-200 hover:text-(--afvar-text) motion-reduce:transition-none ${FOCUS_RING}`}
        >
          Sign in
        </a>
        <Link href="/register" onClick={onClose} className={`${REGISTER_PILL} h-12 w-full text-[15px]`}>
          Register Now
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HomeNav                                                             */
/* ------------------------------------------------------------------ */

/**
 * REVISED contract §5.2 — slim solid near-black navbar with a thin bottom
 * hairline: AFVAR wordmark left, configured routes centre, low-emphasis
 * Sign in and a solid blue Register Now pill right. Dropdowns are solid
 * dark panels (no glass) that open on click (hover assists on mouse) and
 * close on Escape, outside click and route change.
 */
export function HomeNav() {
  const pathname = usePathname() ?? "/";
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close everything on navigation (adjust state during render, no effect).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenGroup(null);
    setMobileOpen(false);
  }

  // The mobile sheet has no place on desktop widths.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/[.11] bg-(--afvar-charcoal)">
        <div className="mx-auto flex h-full max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="AFVAR home"
            className={`inline-flex h-10 shrink-0 items-center rounded-sm text-[17px] font-semibold tracking-[0.35em] text-(--afvar-text) transition-colors duration-200 hover:text-white motion-reduce:transition-none ${FOCUS_RING}`}
          >
            {/* trailing tracking would offset the word; pull it back */}
            {/* one-time staggered letter rise on load (CSS, .mkc-wm in marketMotion) */}
            <span className="mkc-wm -mr-[0.35em]">
              {"AFVAR".split("").map((letter, index) => (
                <span key={index}>{letter}</span>
              ))}
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-0.5 xl:gap-2">
              {ITEMS.map((item) => {
                if (item.children) {
                  return (
                    <DesktopGroup
                      key={item.href}
                      item={item as NavItem & { children: readonly NavChild[] }}
                      pathname={pathname}
                      open={openGroup === item.href}
                      onOpenChange={(next) => setOpenGroup((cur) => (next ? item.href : cur === item.href ? null : cur))}
                    />
                  );
                }
                const active = inSection(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex h-10 items-center rounded-md px-2.5 text-[13px] transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
                        active ? "font-medium text-(--afvar-text)" : "text-[#A3AAAC] hover:text-(--afvar-text)"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0">
            <a
              href={SIGN_IN_URL}
              className={`hidden h-9 items-center rounded-md px-2 text-[13px] text-[#A3AAAC] transition-colors duration-200 hover:text-(--afvar-text) motion-reduce:transition-none sm:inline-flex ${FOCUS_RING}`}
            >
              Sign in
            </a>
            <Link href="/register" className={REGISTER_PILL}>
              Register Now
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-controls="home-mobile-sheet"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className={`grid h-10 w-10 place-items-center rounded-md text-(--afvar-text) transition-colors duration-200 hover:bg-white/[.06] motion-reduce:transition-none lg:hidden ${FOCUS_RING}`}
            >
              {mobileOpen ? (
                <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                  <path d="M3.5 6h13M3.5 10h13M3.5 14h13" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <MobileSheet pathname={pathname} onClose={() => setMobileOpen(false)} />}
    </>
  );
}
