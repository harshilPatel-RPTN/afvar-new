"use client";

import Link from "next/link";
import { BreadthStrip } from "@/modules/home/kit";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { useT, type MessageKey } from "@/platform/i18n";
import { REGISTER_URL } from "../data";
import { SiteSearch } from "./SiteSearch";
import { HomeNavMenu } from "./HomeNavMenu";
import { ArrowIcon } from "./ui";
import { SignatureHomeLink } from "@/platform/ui/SignatureHomeLink";

type NavLink = { href: string; key: MessageKey };
type NavItem = NavLink & { children?: NavLink[] };

const NAV: NavItem[] = [
  { href: "/", key: "mk.nav.home" },
  {
    href: "/platform",
    key: "mk.nav.platform",
    children: [
      { href: "/platform", key: "mk.nav.platform.overview" },
      { href: "/platform/market-data", key: "mk.nav.platform.data" },
      { href: "/platform/research", key: "mk.nav.platform.research" },
      { href: "/platform/alerts", key: "mk.nav.platform.alerts" },
      { href: "/platform/risk-review", key: "mk.nav.platform.risk" },
      { href: "/platform/community", key: "mk.nav.platform.community" },
    ],
  },
  {
    href: "/market",
    key: "mk.nav.markets",
    children: [
      { href: "/market", key: "mk.nav.markets.overview" },
      { href: "/market/commodities", key: "mk.nav.markets.commodities" },
      { href: "/market/forex", key: "mk.nav.markets.forex" },
      { href: "/market/crypto", key: "mk.nav.markets.crypto" },
      { href: "/market/briefs", key: "mk.nav.markets.briefs" },
    ],
  },
  { href: "/pricing", key: "mk.nav.pricing" },
  {
    href: "/resources",
    key: "mk.nav.resources",
    children: [
      { href: "/resources/getting-started", key: "mk.nav.resources.start" },
      { href: "/resources/guides", key: "mk.nav.resources.guides" },
      { href: "/resources/sources-evidence", key: "mk.nav.resources.sources" },
      { href: "/resources/faqs", key: "mk.nav.resources.faqs" },
      { href: "/resources/help", key: "mk.nav.resources.help" },
    ],
  },
  { href: "/about", key: "mk.nav.about" },
  { href: "/contact", key: "mk.nav.contact" },
];

function inSection(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-(--mk-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--mk-page)";

/** Gold pill. Hover: colour + lift transition; the stronger glow is an opacity-only overlay (`JoinGlow`), never an animated box-shadow. */
const joinButton = `afvar-glass-button afvar-glass-primary group relative h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-(--mk-primary) px-5 text-[13px] font-semibold text-(--mk-on-primary) shadow-(--mk-glow-primary) transition-[color,background-color,border-color,opacity,transform] duration-300 hover:bg-(--mk-primary-bright) motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none ${focusRing}`;

function JoinGlow() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-full opacity-0 shadow-(--mk-glow-primary-strong) transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
    />
  );
}

function Chevron({ open, className = "h-3.5 w-3.5" }: { open: boolean; className?: string }) {
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

const EASE = [0.22, 1, 0.36, 1] as const;

/** Gold hairline that glides between the active and hovered top-level links (MotionConfig makes the glide instant under reduced motion). */
function Underline({ inset = "inset-x-2" }: { inset?: string }) {
  return (
    <motion.span
      aria-hidden="true"
      layoutId="mk-nav-underline"
      transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.8 }}
      className={`pointer-events-none absolute -bottom-0.5 ${inset} h-px rounded-full bg-(--mk-primary) shadow-[0_0_8px_rgba(0,230,118,0.6)]`}
    />
  );
}

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: EASE, staggerChildren: 0.035, delayChildren: 0.04 } },
  exit: { opacity: 0, scale: 0.97, y: -2, transition: { duration: 0.14, ease: EASE } },
};
const panelItemVariants: Variants = {
  hidden: { opacity: 0, y: -4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE } },
};
const fadeVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } };

const mobileListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.12 } },
};
const mobileItemVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE } },
};

/* ------------------------------------------------------------------ */
/* Desktop dropdown group                                              */
/* ------------------------------------------------------------------ */

function DesktopGroup({
  item,
  pathname,
  open,
  onOpenChange,
  underline,
  onHover,
}: {
  item: NavItem & { children: NavLink[] };
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  underline: boolean;
  onHover: () => void;
}) {
  const { t } = useT();
  const reduce = useReducedMotion() ?? false;
  const panelId = useId();
  const wrapRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);
  const label = t(item.key);
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
      onFocus={onHover}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        onHover();
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
      <div className="flex items-center">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`relative inline-flex h-11 items-center rounded-sm pl-2 text-[13px] transition-colors ${focusRing} ${
            active ? "font-medium text-(--mk-text)" : "text-(--mk-dim) hover:text-(--mk-text)"
          }`}
        >
          {label}
          {underline && <Underline inset="left-2 right-0" />}
        </Link>
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t("mk.nav.submenu", { label })}
          onClick={() => onOpenChange(!open)}
          onKeyDown={onButtonKey}
          className={`grid h-11 w-6 place-items-center rounded-sm transition-colors ${focusRing} ${
            active || open ? "text-(--mk-text)" : "text-(--mk-dim) hover:text-(--mk-text)"
          }`}
        >
          <Chevron open={open} className="h-3 w-3" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div id={panelId} className="absolute left-1/2 top-full z-10 -translate-x-1/2 pt-2">
            <motion.ul
              variants={reduce ? fadeVariants : panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={reduce ? { duration: 0.01 } : undefined}
              className="afvar-glass-panel mk-glass mk-glass-blur min-w-[240px] origin-top rounded-2xl p-2 shadow-(--mk-shadow) will-change-transform"
            >
              {item.children.map((child) => {
                const current = pathname === child.href;
                return (
                  <motion.li key={child.href} variants={reduce ? undefined : panelItemVariants}>
                    <Link
                      data-nav-item
                      href={child.href}
                      aria-current={current ? "page" : undefined}
                      onClick={() => onOpenChange(false)}
                      className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3.5 text-[14px] transition-colors ${focusRing} ${
                        current
                          ? "bg-white/[0.06] text-(--mk-primary)"
                          : "text-(--mk-dim) hover:bg-white/[0.05] hover:text-(--mk-text) focus-visible:text-(--mk-text)"
                      }`}
                    >
                      {t(child.key)}
                      {current && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-(--mk-primary)" />}
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        )}
      </AnimatePresence>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile panel                                                        */
/* ------------------------------------------------------------------ */

function MobilePanel({ pathname, onClose, returnFocus }: {
  pathname: string;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { t } = useT();
  const reduce = useReducedMotion() ?? false;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const [expanded, setExpanded] = useState<string | null>(() => {
    const current = NAV.find((item) => item.children && item.href !== "/" && inSection(pathname, item.href));
    return current?.href ?? null;
  });

  // Body scroll lock + initial focus + focus return.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      returnFocus();
    };
  }, [returnFocus]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => el.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const rowClass = (active: boolean) =>
    `flex min-h-12 flex-1 items-center rounded-xl px-3 text-[16px] transition-colors ${focusRing} ${
      active ? "font-medium text-(--mk-primary)" : "text-(--mk-text) hover:bg-white/[0.05]"
    }`;

  return (
    <div className="fixed inset-0 z-[140] xl:hidden" onKeyDown={onKeyDown}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0.01 : 0.25 }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("mk.nav.mobileLabel")}
        initial={reduce ? { opacity: 0 } : { x: "100%" }}
        animate={reduce ? { opacity: 1 } : { x: 0 }}
        exit={reduce ? { opacity: 0 } : { x: "100%" }}
        transition={{ duration: reduce ? 0.01 : 0.32, ease: EASE }}
        className="afvar-glass-panel mk-glass-blur absolute inset-y-0 right-0 flex h-dvh w-full max-w-[400px] flex-col border-l border-(--mk-glass-border) bg-(--mk-glass-strong) shadow-(--mk-shadow)"
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-(--mk-line) px-4 sm:px-6">
          <SignatureHomeLink label={t("mk.nav.logoLabel")} onClick={onClose} className={focusRing} />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("mk.nav.close")}
            className={`grid h-11 w-11 place-items-center rounded-full mk-glass text-(--mk-text) transition-[color,background-color,border-color,opacity,transform] hover:border-(--mk-glass-border-hover) hover:text-(--mk-primary) ${focusRing}`}
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav aria-label={t("mk.nav.label")} className="mk-no-scrollbar flex-1 overflow-y-auto px-3 py-4 sm:px-5">
          <motion.ul className="space-y-1" variants={reduce ? undefined : mobileListVariants} initial="hidden" animate="show">
            {NAV.map((item) => {
              const active = inSection(pathname, item.href);
              if (!item.children) {
                return (
                  <motion.li key={item.href} variants={reduce ? undefined : mobileItemVariants}>
                    <Link href={item.href} onClick={onClose} aria-current={active ? "page" : undefined} className={rowClass(active)}>
                      {t(item.key)}
                    </Link>
                  </motion.li>
                );
              }
              const label = t(item.key);
              const isOpen = expanded === item.href;
              const groupId = `${baseId}-${item.href.slice(1)}`;
              return (
                <motion.li key={item.href} variants={reduce ? undefined : mobileItemVariants}>
                  <div className="flex items-center gap-1">
                    <Link href={item.href} onClick={onClose} aria-current={active ? "page" : undefined} className={rowClass(active)}>
                      {label}
                    </Link>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={groupId}
                      aria-label={t("mk.nav.submenu", { label })}
                      onClick={() => setExpanded(isOpen ? null : item.href)}
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-(--mk-dim) transition-colors hover:bg-white/[0.05] hover:text-(--mk-text) ${focusRing}`}
                    >
                      <Chevron open={isOpen} className="h-4 w-4" />
                    </button>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ul
                        id={groupId}
                        initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: reduce ? 0.01 : 0.22, ease: EASE }}
                        className="ml-3 overflow-hidden border-l border-(--mk-line) pl-2"
                      >
                        {item.children.map((child) => {
                          const current = pathname === child.href;
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={onClose}
                                aria-current={current ? "page" : undefined}
                                className={`flex min-h-11 items-center rounded-lg px-3 text-[14px] transition-colors ${focusRing} ${
                                  current ? "text-(--mk-primary)" : "text-(--mk-dim) hover:bg-white/[0.04] hover:text-(--mk-text)"
                                }`}
                              >
                                {t(child.key)}
                              </Link>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </motion.ul>
        </nav>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE, delay: reduce ? 0 : 0.3 }}
          className="shrink-0 border-t border-(--mk-line) p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
        >
          <a href={REGISTER_URL} className={`${joinButton} inline-flex h-12 w-full text-[15px]`}>
            <JoinGlow />
            {t("mk.waitlist.cta")}
            <ArrowIcon className="h-4 w-4" />
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SiteNav                                                             */
/* ------------------------------------------------------------------ */

export function SiteNav({ menuOnly = false, children }: { menuOnly?: boolean; children?: ReactNode }) {
  const { t } = useT();
  const pathname = usePathname() ?? "/";
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [panel, setPanel] = useState<"menu" | "search" | null>(null);
  const menuOpen = panel === "menu";
  const homeMenuId = useId();
  const [lastPath, setLastPath] = useState(pathname);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // The bar picks up its glass backing once the page has scrolled under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything on navigation (adjust state during render, no effect).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenGroup(null);
    setPanel(null);
    setHovered(null);
  }

  const activeTop = NAV.find((item) => inSection(pathname, item.href))?.href ?? null;
  const underlined = hovered ?? activeTop;

  // Other pages switch back to their full navigation at the desktop breakpoint.
  useEffect(() => {
    if (menuOnly) return;
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setPanel(current => current === "menu" ? null : current);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [menuOnly]);

  const closeMenu = useCallback(() => setPanel(null), []);
  const openSearch = useCallback(() => setPanel("search"), []);
  const setSearchOpen = useCallback((open: boolean) => setPanel(open ? "search" : null), []);
  const returnFocus = useCallback(() => menuButtonRef.current?.focus(), []);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 h-[72px]"
        data-home-menu-open={menuOnly && menuOpen ? "" : undefined}
        data-scrolled={scrolled ? "" : undefined}
      >
        <div aria-hidden="true" className="afvar-nav-glass" />
        {/* /home-demo's bull vs bear tug line along the nav's bottom edge (real breadth). */}
        {!menuOnly && <BreadthStrip />}
        <div className="relative flex h-full items-center gap-2 px-3 min-[360px]:px-4 sm:gap-4 sm:px-6 lg:px-10">
          <SignatureHomeLink label={t("mk.nav.logoLabel")} landing className={focusRing} />

          {!menuOnly && <nav aria-label={t("mk.nav.label")} className="hidden flex-1 justify-center xl:flex">
            <ul
              className="flex items-center gap-3 xl:gap-5"
              onPointerLeave={() => setHovered(null)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(null);
              }}
            >
              {NAV.map((item) => {
                if (item.children) {
                  return (
                    <DesktopGroup
                      key={item.href}
                      underline={underlined === item.href}
                      onHover={() => setHovered(item.href)}
                      item={item as NavItem & { children: NavLink[] }}
                      pathname={pathname}
                      open={openGroup === item.href}
                      onOpenChange={(next) => setOpenGroup((cur) => (next ? item.href : cur === item.href ? null : cur))}
                    />
                  );
                }
                const active = inSection(pathname, item.href);
                return (
                  <li key={item.href} onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(item.href)} onFocus={() => setHovered(item.href)}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative inline-flex h-11 items-center rounded-sm px-2 text-[13px] transition-colors ${focusRing} ${
                        active ? "font-medium text-(--mk-text)" : "text-(--mk-dim) hover:text-(--mk-text)"
                      }`}
                    >
                      {t(item.key)}
                      {underlined === item.href && <Underline />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>}

          <div className={`ml-auto flex items-center gap-2 sm:gap-3 ${menuOnly ? "relative" : "xl:ml-0"}`}>
            <SiteSearch open={panel === "search"} onOpenChange={setSearchOpen} menuFocus={menuOnly ? returnFocus : undefined} />
            {!menuOnly && <a href={REGISTER_URL} className={`${joinButton} hidden lg:inline-flex`}>
              <JoinGlow />
              {t("mk.waitlist.cta")}
              <ArrowIcon className="h-3.5 w-3.5" />
            </a>}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setPanel(menuOpen ? null : "menu")}
              onKeyDown={event => {
                if (!menuOnly) return;
                if (event.key === "Escape") setPanel(null);
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setPanel("menu");
                  requestAnimationFrame(() => document.getElementById(homeMenuId)?.querySelector<HTMLElement>("a[href]")?.focus());
                }
              }}
              aria-expanded={menuOpen}
              aria-haspopup={menuOnly ? undefined : "dialog"}
              aria-controls={menuOnly && menuOpen ? homeMenuId : undefined}
              aria-label={t("mk.nav.menu")}
              className={`afvar-glass-button afvar-menu-trigger inline-flex h-11 items-center justify-center gap-2 rounded-full text-(--mk-text) transition-[color,background-color,border-color,opacity,transform] ${menuOnly ? "px-4 max-[399px]:w-11 max-[399px]:px-0" : "w-11 xl:hidden"} ${focusRing}`}
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  <path className="afvar-menu-line-first" d="M3.5 6h13" />
                  <path className="afvar-menu-line-middle" d="M3.5 10h13" />
                  <path className="afvar-menu-line-last" d="M3.5 14h13" />
                </g>
              </svg>
              {/* Icon-only on the narrowest phones, leaving the header room for the assistant launcher. */}
              {menuOnly && <span className="text-[13px] font-medium max-[399px]:hidden">{t("mk.nav.menu")}</span>}
            </button>
            {menuOnly && <AnimatePresence>
              {menuOpen && <HomeNavMenu id={homeMenuId} items={NAV} pathname={pathname} trigger={menuButtonRef} onClose={closeMenu} onSearch={openSearch}>
                {children}
              </HomeNavMenu>}
            </AnimatePresence>}
          </div>
        </div>
      </header>

      {!menuOnly && panel !== "search" && <AnimatePresence>
        {menuOpen && <MobilePanel key="mobile-nav" pathname={pathname} onClose={closeMenu} returnFocus={returnFocus} />}
      </AnimatePresence>}
    </>
  );
}
