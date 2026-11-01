"use client";

import Link from "next/link";
import { motion, useIsPresent, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { BookOpen } from "@phosphor-icons/react/dist/csr/BookOpen";
import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { ChartLineUp } from "@phosphor-icons/react/dist/csr/ChartLineUp";
import { Envelope } from "@phosphor-icons/react/dist/csr/Envelope";
import { House } from "@phosphor-icons/react/dist/csr/House";
import { Info } from "@phosphor-icons/react/dist/csr/Info";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { Tag } from "@phosphor-icons/react/dist/csr/Tag";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { useT, type MessageKey } from "@/platform/i18n";
import { REGISTER_URL } from "../data";
import "./home-nav-menu.css";

type NavLink = { href: string; key: MessageKey };
const NAV_ICONS = {
  "/": House,
  "/platform": SquaresFour,
  "/market": ChartLineUp,
  "/pricing": Tag,
  "/resources": BookOpen,
  "/about": Info,
  "/contact": Envelope,
};

function NavIcon({ href }: { href: string }) {
  const Icon = NAV_ICONS[href as keyof typeof NAV_ICONS] ?? ArrowUpRight;
  return <Icon size={18} weight="regular" aria-hidden="true" />;
}

export function HomeNavMenu({ id, items, trigger, pathname, onClose, onSearch, children: extra }: {
  id: string;
  items: readonly (NavLink & { children?: readonly NavLink[] })[];
  trigger: RefObject<HTMLButtonElement | null>;
  pathname: string;
  onClose: () => void;
  onSearch: () => void;
  children?: ReactNode;
}) {
  const { t } = useT();
  const reducedMotion = useReducedMotion();
  const present = useIsPresent();
  const menu = useRef<HTMLDivElement>(null);
  const children = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [active, setActive] = useState<string | null>(null);
  const group = items.find(item => item.href === active && item.children);

  useEffect(() => {
    if (!present) return;
    function dismissOutside(event: PointerEvent | FocusEvent) {
      const target = event.target;
      if (target instanceof Node && !menu.current?.contains(target) && !trigger.current?.contains(target)) onClose();
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
    };
  }, [onClose, trigger, present]);

  function previewGroup(href: string | null, pointerType: string) {
    if (pointerType !== "mouse" || window.matchMedia("(max-width: 420px)").matches) return;
    clearTimeout(timer.current);
    // Give the pointer time to cross a neighboring row on its way into the flyout.
    if (active === null) setActive(href);
    else timer.current = window.setTimeout(() => setActive(href), 170);
  }

  function enterGroup(href: string) {
    clearTimeout(timer.current);
    setActive(href);
    requestAnimationFrame(() => children.current?.querySelector<HTMLElement>("a[href]")?.focus());
  }
  function returnToGroup() {
    clearTimeout(timer.current);
    setActive(null);
    const opener = menu.current?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]');
    requestAnimationFrame(() => opener?.focus());
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (group) returnToGroup();
      else { onClose(); trigger.current?.focus(); }
    } else if (event.key === "ArrowRight" && children.current?.contains(event.target as Node)) {
      event.preventDefault();
      returnToGroup();
    }
  }

  return (
    <motion.div ref={menu} id={id} className="afvar-home-menu" data-depth={group ? 2 : 1} onKeyDown={onKeyDown}
      inert={!present}
      style={{ pointerEvents: present ? undefined : "none" }}
      initial={reducedMotion ? false : { opacity: 0, y: -7, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -4, scale: reducedMotion ? 1 : .98 }}
      transition={{ duration: reducedMotion ? 0 : .24, ease: [.22, 1, .36, 1] }}>
      <nav className="afvar-glass-panel afvar-menu-primary afvar-menu-column" aria-label={t("mk.nav.label")}>
        <div className="afvar-menu-heading" aria-hidden="true">{t("mk.nav.menu")}</div>
        {items.map(item => item.children ? (
          <button key={item.href} type="button" aria-expanded={active === item.href}
            aria-controls={active === item.href ? `${id}-children` : undefined}
            onPointerEnter={event => previewGroup(item.href, event.pointerType)}
            onKeyDown={event => { if (event.key === "ArrowLeft") { event.preventDefault(); enterGroup(item.href); } }}
            onClick={() => enterGroup(item.href)}>
            <NavIcon href={item.href} /><span className="afvar-menu-label">{t(item.key)}</span><CaretLeft size={14} aria-hidden="true" />
          </button>
        ) : (
          <Link key={item.href} href={item.href} onClick={onClose} aria-current={pathname === item.href ? "page" : undefined}
            onPointerEnter={event => previewGroup(null, event.pointerType)}><NavIcon href={item.href} /><span className="afvar-menu-label">{t(item.key)}</span></Link>
        ))}
        <div className="afvar-menu-extra" onPointerEnter={event => previewGroup(null, event.pointerType)}>
          <button type="button" onClick={onSearch} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K /">
            <MagnifyingGlass size={18} aria-hidden="true" /><span className="afvar-menu-label">{t("mk.search.button")}</span>
          </button>
          {extra}
          <a href={REGISTER_URL} className="afvar-glass-button afvar-glass-primary afvar-menu-join">{t("mk.waitlist.cta")}<ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
      </nav>
      {group?.children && (
        <nav ref={children} id={`${id}-children`} className="afvar-glass-panel afvar-menu-children afvar-menu-column"
          aria-label={t("mk.nav.submenu", { label: t(group.key) })}
          onPointerEnter={() => clearTimeout(timer.current)}>
          <div className="afvar-menu-heading" aria-hidden="true">{t(group.key)}</div>
          <button type="button" className="afvar-menu-back" onClick={returnToGroup}>
            <CaretRight size={16} aria-hidden="true" />{t("common.back")}
          </button>
          {!group.children.some(child => child.href === group.href) && (
            <Link href={group.href} onClick={onClose}>{t(group.key)}</Link>
          )}
          {group.children.map(child => (
            <Link key={child.href} href={child.href} onClick={onClose} aria-current={pathname === child.href ? "page" : undefined}>{t(child.key)}</Link>
          ))}
        </nav>
      )}
    </motion.div>
  );
}
