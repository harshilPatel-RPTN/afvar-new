"use client";

// "Try it yourself" — the AFVAR OS from the film, now in the visitor's hands
// (desktop and laptop). The same screen, dock, windows and AI command bar as
// the home and platform films; commands resolve on the device (the platform's
// local-first demo resolver, English and हिन्दी). Sample data only, except the
// Gold chart, which shows real prices as labelled.
//
// Phones get the home film's rule: no OS on a phone — the avatar talks instead.
import { useCallback, useReducer, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AiOrb, AppGlyph, CARD_AI, Dock, EYEBROW, GOLD_CTA, H2, MONO, MenuBar, MiniChart, OsScreen, SOFT, Toast, type AppGlyphName, type DockItem } from "@/modules/afvarOs";
import { fmtPrice, useLiveMarket } from "@/modules/home/kit";
import { openLiveAvatar, useNowMinute, type Quotes } from "@/modules/homeDemo/kit";
import { getCapability } from "../../content";
import { RuleDraw, useReveal } from "../../film/motion";
import type { CapabilitySlug } from "../../types";
import { resolve, type Intent } from "../os/commands";
import { APP_ORDER, INITIAL, reducer, type Frame } from "../os/desktop-state";
import { rowsFor, type Row } from "../os/SpotlightPanel";
import { LANGS, STRINGS, type Lang } from "../os/strings";

const GLYPH: Record<CapabilitySlug, AppGlyphName> = { charts: "chart", research: "research", alerts: "alerts", "trade-review": "risk", community: "community" };
const TITLE: Record<Lang, Record<CapabilitySlug, string>> = {
  en: { charts: "Charts", research: "Research", alerts: "Alerts", "trade-review": "Risk & journal", community: "Community" },
  hi: { charts: "चार्ट", research: "रिसर्च", alerts: "अलर्ट", "trade-review": "रिस्क व जर्नल", community: "कम्युनिटी" },
};
const MENUS: Record<Lang, string[]> = { en: ["Workspace", "Apps", "Layouts", "Window", "Help"], hi: ["वर्कस्पेस", "ऐप्स", "लेआउट", "विंडो", "मदद"] };

/** Window buttons: 10 px dots with a taller invisible hit area (the screen is scaled down). */
const HIT = "relative after:absolute after:-inset-x-[3px] after:-inset-y-[10px] after:content-['']";

/** Desktop area inside the 1200×660 screen: under the menu bar, above the dock. */
const AREA = { top: 36, height: 540 };
const px = (f: Frame) => ({ left: `${f.l}%`, top: AREA.top + (f.t / 100) * 660 * 0.92, width: `${f.w}%`, height: (f.h / 100) * 660 * 0.92 });

export function TrySection() {
  return (
    <section id="try-afvar" aria-labelledby="try-title" className="relative scroll-mt-28 bg-transparent px-5 py-24 sm:px-8 lg:px-16">
      <RuleDraw />
      <div className="mx-auto max-w-[1240px]">
        <p className={EYEBROW}>Hands on</p>
        <h2 id="try-title" className={`mt-4 ${H2}`}>
          Try it yourself. <span className={SOFT}>Type a command, or drag a window.</span>
        </h2>
        {/* D6: the OS screen rises and scales in once. */}
        <ScreenRise>
          <OsPlayground />
        </ScreenRise>
        <div className="mt-8 lg:hidden">
          <PhoneTalk />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- phones */

function PhoneTalk() {
  // D6 (phones): the card rises in, then the orb pulses once.
  const ref = useRef<HTMLDivElement>(null);
  const st = useReveal(ref)(0);
  const hidden = st.s === "wait";
  return (
    <motion.div
      ref={ref}
      data-reveal={0}
      className={`${CARD_AI} p-5`}
      initial={false}
      animate={hidden ? { opacity: 0, y: 26 } : { opacity: 1, y: 0 }}
      transition={hidden || st.s === "static" ? NOW : { duration: 0.9, ease: EASE }}
    >
      <p className="flex items-center gap-2 text-[15px] font-semibold">
        <motion.span
          className="inline-flex shrink-0"
          initial={false}
          animate={{ scale: st.s === "in" ? [1, 1.25, 1] : 1 }}
          transition={st.s === "in" ? { duration: 1.1, delay: 0.7, ease: "easeInOut" } : NOW}
        >
          <AiOrb size={12} />
        </motion.span>{" "}
        The OS is a desktop and laptop experience.
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-[#B7C5BC]">On a phone, talk to AFVAR instead: ask in English or हिन्दी and hear the answer.</p>
      <button type="button" onClick={openLiveAvatar} className={`${GOLD_CTA} mt-5 inline-flex items-center gap-2`}>
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#06110C]" />
        Talk to AFVAR
      </button>
      <p className="mt-3 text-[12px] text-[#92A399]">Live voice beta · uses your microphone</p>
    </motion.div>
  );
}

/* ------------------------------------------------------- D6 (desktop) */

const EASE = [0.22, 1, 0.36, 1] as const;
const NOW = { duration: 0 };

/** The playground's OS screen: rises 30 px and scales .96 → 1 once, as it enters (after the splash). */
function ScreenRise({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const st = useReveal(ref)(0);
  const hidden = st.s === "wait";
  return (
    <div ref={ref} data-reveal={0} className="mt-10 max-lg:hidden">
      <motion.div
        initial={false}
        animate={hidden ? { opacity: 0, y: 30, scale: 0.96 } : { opacity: 1, y: 0, scale: 1 }}
        transition={hidden || st.s === "static" ? NOW : { duration: 1.1, ease: EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------- the desktop */

export function OsPlayground() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [lang, setLang] = useState<Lang>("en");
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [toast, setToast] = useState<{ id: number; title: string; body: string; tone: "ai" | "ok" | "risk" } | null>(null);
  const [drag, setDrag] = useState<{ app: CapabilitySlug; dx: number; dy: number } | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { quotes } = useLiveMarket();
  const s = STRINGS[lang];

  const notify = useCallback((title: string, body: string, tone: "ai" | "ok" | "risk") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), title, body, tone });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const execute = useCallback(
    (intent: Intent) => {
      if (intent.action === "arrange") {
        dispatch({ type: "arrange" });
        notify(s.arranged, `✓ ${s.verified}`, "ok");
        return;
      }
      const app = intent.app!;
      const name = app === "charts" ? `${intent.instrument} · ${intent.timeframe ?? state.wins.charts.timeframe}` : TITLE[lang][app];
      if (intent.action === "close") {
        dispatch({ type: "close", app });
        notify(s.closed(name), `✓ ${s.verified}`, "ok");
      } else if (intent.action === "minimize") {
        dispatch({ type: "minimize", app });
        notify(s.minimized(name), `✓ ${s.verified}`, "ok");
      } else {
        dispatch({ type: "open", app, instrument: intent.instrument, timeframe: intent.timeframe });
        if (intent.action === "maximize") dispatch({ type: "toggleMax", app });
        notify(s.opened(name), `✓ ${s.verified} · ${s.local}`, "ok");
      }
    },
    [lang, notify, s, state.wins.charts.timeframe],
  );

  const run = useCallback(
    (row: Row) => {
      if (row.command === null) {
        notify("Policy gate", row.label, "risk");
        return;
      }
      const intent = resolve(row.command);
      if (intent.status === "resolved") {
        execute(intent);
        setText("");
        return;
      }
      if (intent.status === "clarify") {
        setText(row.command);
        return;
      }
      notify(intent.status === "refused" ? "Policy gate" : "AFVAR", intent.status === "refused" ? s.refused : intent.status === "negated" ? s.negated : s.unsupported, intent.status === "refused" ? "risk" : "ai");
    },
    [execute, notify, s],
  );

  const { rows, heading, note } = rowsFor(text, lang);
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (rows[0]) run(rows[0]);
    } else if (e.key === "Escape") setText("");
  };

  // Drag a window by its title bar (frames are percentages of the screen).
  const onTitleDown = (app: CapabilitySlug) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = screenRef.current?.querySelector("section")?.getBoundingClientRect();
    if (!rect) return;
    dispatch({ type: "focus", app });
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDrag({ app, dx: e.clientX, dy: e.clientY });
  };
  const onTitleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const rect = screenRef.current?.querySelector("section")?.getBoundingClientRect();
    if (!rect) return;
    const w = state.wins[drag.app];
    const dl = ((e.clientX - drag.dx) / rect.width) * 100;
    const dt = ((e.clientY - drag.dy) / rect.height) * 100;
    if (Math.abs(dl) < 0.05 && Math.abs(dt) < 0.05) return;
    const frame = { ...w.frame, l: Math.min(96 - w.frame.w * 0.3, Math.max(-w.frame.w * 0.7, w.frame.l + dl)), t: Math.min(80, Math.max(0, w.frame.t + dt / 0.92)) };
    dispatch({ type: "move", app: drag.app, frame });
    setDrag({ ...drag, dx: e.clientX, dy: e.clientY });
  };
  const onTitleUp = () => setDrag(null);

  const dockItems: DockItem[] = APP_ORDER.map((app) => ({ id: app, label: TITLE[lang][app], glyph: GLYPH[app], running: state.wins[app].open, attention: state.wins[app].mode === "min" }));
  const ordered = APP_ORDER.filter((a) => state.wins[a].open && state.wins[a].mode !== "min").sort((a, b) => state.wins[a].z - state.wins[b].z);

  return (
    <div>
      <div ref={screenRef} className="relative">
        <OsScreen label="AFVAR OS — interactive sample" className="aspect-[1200/660] w-full">
          {ordered.map((app) => {
            const w = state.wins[app];
            const max = w.mode === "max";
            const active = state.active === app;
            return (
              <div
                key={app}
                role="group"
                aria-label={`${TITLE[lang][app]} window`}
                onPointerDown={() => dispatch({ type: "focus", app })}
                className={`absolute flex flex-col overflow-hidden rounded-xl border bg-[#101315] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] ${active ? "border-[rgba(255,255,255,0.22)]" : "border-[rgba(255,255,255,0.1)]"}`}
                style={{ zIndex: 10 + w.z, ...(max ? { left: 8, top: AREA.top, width: 1184, height: AREA.height } : px(w.frame)) }}
              >
                <div
                  className={`flex h-[30px] shrink-0 cursor-grab items-center gap-2 border-b border-[rgba(255,255,255,0.08)] bg-[#14181A] px-3 active:cursor-grabbing ${drag?.app === app ? "cursor-grabbing" : ""}`}
                  onPointerDown={onTitleDown(app)}
                  onPointerMove={onTitleMove}
                  onPointerUp={onTitleUp}
                  onPointerCancel={onTitleUp}
                >
                  <span className="flex gap-1.5">
                    <button type="button" aria-label={`Close ${TITLE[lang][app]}`} onClick={() => dispatch({ type: "close", app })} className={`${HIT} h-2.5 w-2.5 rounded-full ${active ? "bg-[#A8DEC2]" : "bg-[#3A3F42]"} hover:bg-[#FF6B6B]`} />
                    <button type="button" aria-label={`Minimize ${TITLE[lang][app]}`} onClick={() => dispatch({ type: "minimize", app })} className={`${HIT} h-2.5 w-2.5 rounded-full bg-[#3A3F42] hover:bg-[#B7C5BC]`} />
                    <button type="button" aria-label={`Zoom ${TITLE[lang][app]}`} onClick={() => dispatch({ type: "toggleMax", app })} className={`${HIT} h-2.5 w-2.5 rounded-full bg-[#3A3F42] hover:bg-[#B7C5BC]`} />
                  </span>
                  <span className="ml-1 text-[#8A9295]">
                    <AppGlyph name={GLYPH[app]} size={13} />
                  </span>
                  <span className="truncate text-[12px] font-medium text-[#C9CFD1]">{TITLE[lang][app]}</span>
                  {app === "charts" ? <span className="ml-auto font-mono text-[10px] text-[#8A9295]">{`${w.instrument} · ${w.timeframe}`}</span> : null}
                </div>
                <div className="relative min-h-0 flex-1">
                  <AppBody app={app} instrument={w.instrument} quotes={quotes} lang={lang} />
                </div>
              </div>
            );
          })}

          <div className="absolute inset-x-0 top-0 z-[60] h-[30px]">
            <MenuBar menus={MENUS[lang]} space="Space 1 / 1 · Sample" clock={<UtcHm />} />
          </div>
          <div className="absolute left-[640px] top-[5px] z-[61] flex rounded-md border border-[rgba(255,255,255,0.14)] font-mono text-[10px]" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                lang={l.id}
                aria-pressed={lang === l.id}
                onClick={() => setLang(l.id)}
                className={`relative px-2 py-0.5 after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] first:rounded-l-md last:rounded-r-md ${lang === l.id ? "bg-[rgba(168,222,194,0.22)] text-[#F2F5F2]" : "text-[#8A9295] hover:text-[#F2F5F2]"}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* the AI command bar */}
          <div className="absolute left-1/2 top-[44px] z-[70] w-[540px] -translate-x-1/2">
            <div className={`rounded-2xl border bg-[rgba(16,19,21,0.98)] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] ${focused ? "border-[rgba(168,222,194,0.6)]" : "border-[rgba(255,255,255,0.14)]"}`}>
              <label className="flex items-center gap-3 px-4 py-3">
                <AiOrb size={15} pulse={focused} />
                <span className="sr-only">{s.ask}</span>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKey}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  placeholder={s.ask}
                  lang={lang}
                  className="min-w-0 flex-1 bg-transparent text-[16px] text-[#F2F5F2] outline-none! placeholder:text-[#92A399]"
                />
                <span className="font-mono text-[11px] text-[#92A399]">↵</span>
              </label>
              {focused || text ? (
                <div className="border-t border-[rgba(255,255,255,0.08)] px-4 py-3">
                  <p className={`${MONO} mb-1.5 text-[9.5px] text-[#A8DEC2]`}>{heading}</p>
                  <ul className="space-y-1">
                    {rows.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => run(r)}
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] ${r.command === null ? "text-[#FF8A8A]" : "text-[#C9CFD1] hover:bg-[rgba(168,222,194,0.12)] hover:text-[#F2F5F2]"}`}
                        >
                          <span className="text-[#A8DEC2]">›</span>
                          {r.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {note ? <p className="mt-2 text-[11.5px] text-[#8A9295]">{note}</p> : null}
                </div>
              ) : null}
            </div>
          </div>

          {toast ? (
            <div className="absolute right-3 top-[40px] z-[80]" key={toast.id}>
              <Toast tone={toast.tone} title={toast.title} meta="now">
                {toast.body}
              </Toast>
            </div>
          ) : null}

          <DockButtons items={dockItems} onLaunch={(app) => dispatch({ type: "open", app: app as CapabilitySlug })} />
        </OsScreen>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#92A399]">
        <p>Sample desktop · commands resolve on this device · Gold prices real, as labelled.</p>
        <p className={MONO}>Try: “{s.examples[0]}” · “{s.examples[4]}” · “buy gold”</p>
      </div>
    </div>
  );
}

/** The film's dock, its app tiles as real buttons (above the windows). */
function DockButtons({ items, onLaunch }: { items: DockItem[]; onLaunch: (id: string) => void }) {
  return <Dock items={items} onLaunch={onLaunch} style={{ zIndex: 65 }} />;
}

function UtcHm() {
  const now = useNowMinute();
  return <>{now ? `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} UTC` : "--:--"}</>;
}

/* ------------------------------------------------------------ app bodies */

function AppBody({ app, instrument, quotes, lang }: { app: CapabilitySlug; instrument: string; quotes: Quotes; lang: Lang }) {
  if (app === "charts") {
    const q = instrument === "Gold" ? quotes.XAUUSD : instrument === "Silver" ? quotes.XAGUSD : instrument === "Oil" ? quotes.WTI : instrument === "EUR/USD" ? quotes.EURUSD : undefined;
    return q ? (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-3 pt-2 font-mono text-[11px]">
          <span className="text-[#F2F5F2]">{instrument}</span>
          <span className="tabular-nums text-[#F2F5F2]">{fmtPrice(q.last, q.decimals)}</span>
          <span className={q.changePct >= 0 ? "text-[#00E676]" : "text-[#FF6B6B]"}>
            {q.changePct >= 0 ? "▲" : "▼"}
            {Math.abs(q.changePct).toFixed(2)}%
          </span>
          <span className="ml-auto text-[9.5px] uppercase tracking-wider text-[#92A399]">{q.status}</span>
        </div>
        <MiniChart closes={q.closes} className="mx-2 mb-2 mt-1 min-h-0 flex-1" />
      </div>
    ) : (
      <div className="flex h-full flex-col">
        <p className="px-3 pt-2 font-mono text-[11px] text-[#C9CFD1]">
          {instrument} <span className="text-[#92A399]">· sample</span>
        </p>
        <MiniChart closes={sampleCloses(instrument.length)} className="mx-2 mb-2 mt-1 min-h-0 flex-1" />
      </div>
    );
  }
  const rows: Record<Exclude<CapabilitySlug, "charts">, [string, string][]> = {
    research: [
      ["12:30", "US payrolls · sample"],
      ["Thu", "Central bank decision · sample"],
      ["Brief", "Gold · morning context · sample"],
    ],
    alerts: [
      ["Armed", "Gold above the weekly high"],
      ["Armed", "EUR/USD session range break"],
      ["Rule", "You confirm before anything runs"],
    ],
    "trade-review": [
      ["40%", "Daily loss limit used · sample"],
      ["2", "Open positions · read-only"],
      ["MON", "Journal · waited for the close"],
    ],
    community: [
      ["#gold", "Watching the same level as yesterday"],
      ["#forex", "Shared a chart with two levels"],
      ["AI", "Summary of 40 replies · sample"],
    ],
  };
  return (
    <ul className="divide-y divide-[rgba(255,255,255,0.06)] px-3 text-[12px]" lang={lang === "hi" ? "en" : undefined}>
      {rows[app].map(([a, b]) => (
        <li key={b} className="flex items-center gap-3 py-2">
          <span className="w-12 shrink-0 font-mono text-[10px] text-[#A8DEC2]">{a}</span>
          <span className="text-[#C9CFD1]">{b}</span>
        </li>
      ))}
      <li className="py-2">
        <span className={`${MONO} text-[9px] text-[#7E8F85]`}>{getCapability(app)?.title} · sample</span>
      </li>
    </ul>
  );
}

function sampleCloses(seed: number) {
  let x = seed * 7919 + 13;
  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < 48; i++) {
    x = (x * 16807) % 2147483647;
    v += ((x / 2147483647) - 0.5) * 1.6;
    out.push(v);
  }
  return out;
}
