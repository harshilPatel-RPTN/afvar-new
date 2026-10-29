"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useReducer, useRef, useState, type KeyboardEvent } from "react";
import { BrandMark } from "@/platform/ui";
import { CAPABILITIES, getCapability } from "../../content";
import type { CapabilitySlug } from "../../types";
import { AppIcon } from "../mac/AppIcon";
import { PIcon } from "../mac/icons";
import { resolve, type Intent } from "./commands";
import { APP_ORDER, INITIAL, reducer } from "./desktop-state";
import { DesktopDock } from "./DesktopDock";
import { DesktopWindow } from "./DesktopWindow";
import { rowsFor, SpotlightPanel, type Row } from "./SpotlightPanel";
import { LANGS, STRINGS, type Lang } from "./strings";
import { phaseAt, useMinute, type Phase } from "./time";

const PHASES: Phase[] = ["dawn", "day", "dusk", "night"];
const LOCALES: Record<Lang, string> = { en: "en-US", hi: "hi-IN" };

/**
 * "Try AFVAR" — an interactive macOS-style desktop (sample data only).
 * Window behaviour after PuruVJ/macos-web, Spotlight and Dock after
 * Renovamen/playground-macos (both MIT). Commands resolve on the device
 * (commands.ts). A demo plays while untouched and visible; the first click or
 * key hands control to the visitor. Wallpaper follows the local time of day.
 */
export function TryDesktop() {
  const still = useReducedMotion() ?? false;
  const desktopRef = useRef<HTMLDivElement>(null);
  const visible = useInView(desktopRef, { amount: 0.4 });
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [lang, setLang] = useState<Lang>("en");
  const [spot, setSpot] = useState<{ open: boolean; user: boolean }>({ open: false, user: false });
  const [text, setText] = useState("");
  const [selected, setSelected] = useState(0);
  const [banner, setBanner] = useState<{ id: number; app?: CapabilitySlug; text: string; ok: boolean } | null>(null);
  const [bounce, setBounce] = useState<{ app: CapabilitySlug; n: number } | null>(null);
  const [touched, setTouched] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const now = useMinute();
  const phase = phaseAt(now);
  const s = STRINGS[lang];

  const notify = useCallback((text: string, ok: boolean, app?: CapabilitySlug) => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner({ id: Date.now(), text, ok, app });
    bannerTimer.current = setTimeout(() => setBanner(null), 2600);
  }, []);

  const launch = useCallback(
    (app: CapabilitySlug) => {
      const w = state.wins[app];
      dispatch({ type: "open", app });
      if (!w.open || w.mode === "min") setBounce((b) => ({ app, n: (b?.n ?? 0) + 1 }));
    },
    [state.wins],
  );

  const execute = useCallback(
    (intent: Intent, langNow: Lang) => {
      const str = STRINGS[langNow];
      if (intent.action === "arrange") {
        dispatch({ type: "arrange" });
        notify(str.arranged, true);
        return;
      }
      const app = intent.app!;
      const name = app === "charts" ? `${intent.instrument} · ${intent.timeframe ?? state.wins.charts.timeframe}` : getCapability(app)!.title;
      switch (intent.action) {
        case "close":
          dispatch({ type: "close", app });
          notify(str.closed(name), true, app);
          return;
        case "minimize":
          dispatch({ type: "minimize", app });
          notify(str.minimized(name), true, app);
          return;
        case "maximize":
          dispatch({ type: "open", app });
          dispatch({ type: "toggleMax", app });
          notify(str.opened(name), true, app);
          return;
        default: {
          const w = state.wins[app];
          dispatch({ type: "open", app, instrument: intent.instrument, timeframe: intent.timeframe });
          if (!w.open || w.mode === "min") setBounce((b) => ({ app, n: (b?.n ?? 0) + 1 }));
          notify(str.opened(name), true, app);
        }
      }
    },
    [notify, state.wins],
  );

  const run = useCallback(
    (row: Row, langNow: Lang = lang) => {
      const str = STRINGS[langNow];
      if (row.command === null) {
        notify(row.label, false);
        return;
      }
      const intent = resolve(row.command);
      if (intent.status === "resolved") {
        execute(intent, langNow);
        setSpot({ open: false, user: false });
        setText("");
        return;
      }
      if (intent.status === "clarify") {
        // Show the one clarifying question (D.1.4.2.2) instead of guessing.
        setText(row.command);
        setSelected(0);
        return;
      }
      notify(intent.status === "refused" ? str.refused : intent.status === "negated" ? str.negated : str.unsupported, false);
    },
    [execute, lang, notify],
  );

  // Demo: type an example into Spotlight, run it, repeat — until the visitor takes over.
  useEffect(() => {
    if (still || touched || !visible) return;
    const example = STRINGS[lang].examples[demoIndex % STRINGS[lang].examples.length];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    at(900, () => {
      setSpot({ open: true, user: false });
      setText("");
      setSelected(0);
    });
    for (let i = 1; i <= example.length; i++) at(1200 + i * 42, () => setText(example.slice(0, i)));
    const typed = 1200 + example.length * 42;
    at(typed + 650, () => {
      const first = rowsFor(example, lang).rows[0];
      if (first) run(first, lang);
    });
    // A clarification (the dollar example) gets answered with its first choice.
    at(typed + 1700, () => {
      const intent = resolve(example);
      if (intent.status === "clarify") {
        const pick = rowsFor(example, lang).rows[0];
        if (pick) run(pick, lang);
      }
    });
    at(typed + 4200, () => setDemoIndex((i) => i + 1));
    return () => timers.forEach(clearTimeout);
    // `run` changes with window state; restarting the beat on every change would stall the demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, touched, visible, demoIndex, lang]);

  const takeOver = () => {
    if (!touched) {
      setTouched(true);
      setSpot({ open: false, user: false });
      setText("");
    }
  };

  const openSpotlight = () => {
    takeOver();
    setSpot({ open: true, user: true });
    setText("");
    setSelected(0);
  };

  const onDesktopKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "/" && !spot.open) {
      e.preventDefault();
      // Keep it from reaching the markets SiteSearch's window listener (also "/").
      e.stopPropagation();
      openSpotlight();
    }
  };

  const open = new Set(APP_ORDER.filter((a) => state.wins[a].open));
  const activeTitle = state.active ? getCapability(state.active)!.title : "AFVAR";
  const clock = now ? new Intl.DateTimeFormat(LOCALES[lang], { weekday: "short", hour: "numeric", minute: "2-digit" }).format(now) : "";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-(--text-muted)">
          <span className={`h-2 w-2 rounded-full ${touched ? "bg-(--positive)" : "bg-(--accent)"}`} aria-hidden="true" />
          {touched || still ? s.control : s.demo}
          {touched && (
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "reset" });
                setTouched(false);
              }}
              className="ml-2 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[12px] text-(--text-secondary) hover:bg-white/10"
            >
              Reset
            </button>
          )}
        </div>
        <div role="group" aria-label="Demo language" className="flex rounded-full bg-white/[0.05] p-0.5 text-[12px]">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={lang === l.id}
              onClick={() => setLang(l.id)}
              className={`rounded-full px-3 py-1 transition-colors ${lang === l.id ? "bg-(--surface-active) text-(--text-primary)" : "text-(--text-muted) hover:text-(--text-primary)"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={desktopRef}
        role="region"
        aria-label="Try AFVAR — interactive desktop with sample data. Press / to ask."
        tabIndex={0}
        onKeyDown={onDesktopKey}
        onPointerDownCapture={(e) => e.isTrusted && takeOver()}
        onKeyDownCapture={(e) => e.isTrusted && takeOver()}
        className="pf-window relative aspect-[16/10] min-h-[440px] w-full overflow-hidden rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
      >
        <Image src="/platform/bg/wallpaper.jpg" alt="" fill priority sizes="(min-width: 1152px) 1152px, 100vw" className="object-cover" aria-hidden="true" />
        {/* Time-of-day tint over the wallpaper. */}
        {PHASES.map((p) => (
          <div key={p} className={`pf-wall-layer pf-wall-${p}`} style={{ opacity: p === phase ? 0.55 : 0 }} aria-hidden="true" />
        ))}

        <div className="pf-menubar absolute inset-x-0 top-0 z-[65]">
          <BrandMark className="h-3.5 w-3.5" />
          <span className="font-bold">{activeTitle}</span>
          {s.menus.map((m) => (
            <span key={m} className="hidden text-(--text-primary)/85 sm:inline">
              {m}
            </span>
          ))}
          <span className="ms-auto flex items-center gap-3.5 text-(--text-primary)/85">
            <PIcon name="wifi" size={14} weight="bold" />
            <button type="button" onClick={openSpotlight} aria-label={s.ask} className={`grid h-[18px] w-[22px] place-items-center rounded ${spot.open ? "bg-white/20" : "hover:bg-white/10"}`}>
              <PIcon name="search" size={13} weight="bold" />
            </button>
            <span className="tabular-nums" suppressHydrationWarning>
              {clock}
            </span>
          </span>
        </div>

        <AnimatePresence>
          {APP_ORDER.filter((a) => state.wins[a].open).map((app) => (
            <DesktopWindow
              key={app}
              capability={CAPABILITIES.find((c) => c.slug === app)!}
              win={state.wins[app]}
              active={state.active === app}
              desktopRef={desktopRef}
              onFocus={() => dispatch({ type: "focus", app })}
              onClose={() => dispatch({ type: "close", app })}
              onMinimize={() => dispatch({ type: "minimize", app })}
              onZoom={() => dispatch({ type: "toggleMax", app })}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {spot.open && (
            <SpotlightPanel
              key="spotlight"
              userOpened={spot.user}
              lang={lang}
              text={text}
              selected={selected}
              onText={setText}
              onSelect={setSelected}
              onRun={(row) => run(row)}
              onClose={() => setSpot({ open: false, user: false })}
            />
          )}
        </AnimatePresence>

        {/* Notification banner (top-right, like macOS). */}
        <div className="pointer-events-none absolute end-3 top-9 z-[75] w-[min(60%,300px)]" aria-live="polite">
          <AnimatePresence>
            {banner && (
              <motion.div
                key={banner.id}
                className="pf-vibrant flex items-center gap-2.5 rounded-[12px] px-3 py-2.5"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              >
                {banner.app ? (
                  <AppIcon icon={getCapability(banner.app)!.icon} tone={getCapability(banner.app)!.tone} size={26} />
                ) : (
                  <PIcon name={banner.ok ? "check" : "info"} size={22} weight="fill" className={banner.ok ? "text-(--positive)" : "text-(--accent)"} />
                )}
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">{banner.text}</p>
                  {banner.ok && (
                    <p className="flex items-center gap-1 text-[11px] text-(--positive)">
                      <PIcon name="check" size={11} weight="fill" /> {s.verified}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DesktopDock open={open} bounce={bounce} onLaunch={launch} />
      </div>
      <p className="mt-4 text-center text-[13px] text-(--text-muted)">
        Sample data · not live · press <kbd className="rounded bg-white/10 px-1">/</kbd> or the search icon to ask. Other languages are draft translations.
      </p>
    </div>
  );
}
