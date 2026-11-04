"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { AppIcon, PIcon } from "@/modules/platform/kit";
import { EVIDENCE, type Guide } from "../content";
import { Lights, Window } from "./Window";

const SAMPLE = <span className="rs-chip" data-tone="down">SAMPLE</span>;

/** Interactive illustrations for the W5.7 template — every one labelled SAMPLE, none is live data. */
export function GuideSample({ kind }: { kind: NonNullable<Guide["sample"]> }) {
  if (kind === "badge") return <BadgeSample />;
  if (kind === "verdict") return <VerdictSample />;
  if (kind === "alert") return <AlertSample />;
  if (kind === "commands") return <CommandSample />;
  return <WindowsSample />;
}

export function BadgeSample() {
  const [hot, setHot] = useState<string>(EVIDENCE.badge[0].key);
  const active = EVIDENCE.badge.find((b) => b.key === hot)!;
  return (
    <Window title="Gold · XAUUSD — Sample" toolbar={SAMPLE} bodyClassName="p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-[30px] font-semibold tabular-nums tracking-tight">—</span>
        <span className="text-[13px] text-(--text-muted)">price shown only with a real source</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 font-mono text-[12px]">
        {EVIDENCE.badge.map((b) => (
          <button
            key={b.key}
            type="button"
            onMouseEnter={() => setHot(b.key)}
            onFocus={() => setHot(b.key)}
            onClick={() => setHot(b.key)}
            aria-pressed={hot === b.key}
            className="afvar-glass-tab inline-flex min-h-10 items-center rounded-md px-2.5 py-1.5 transition-colors"
          >
            {b.sample}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={active.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mt-4 text-[13.5px] leading-relaxed text-(--text-secondary)">
          <span className="font-semibold text-(--text-primary)">{active.label}.</span> {active.body}
        </motion.p>
      </AnimatePresence>
    </Window>
  );
}

export function VerdictSample() {
  const parts = EVIDENCE.analysis.parts;
  const [hot, setHot] = useState<string>(parts[0].key);
  const active = parts.find((p) => p.key === hot)!;
  return (
    <Window title="Analysis — Sample" toolbar={SAMPLE} bodyClassName="p-5 sm:p-6">
      <p className="font-mono text-[12px] text-(--text-muted)">{EVIDENCE.analysis.view.split(" · ")[0]}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {parts.map((p) => (
          <button
            key={p.key}
            type="button"
            onMouseEnter={() => setHot(p.key)}
            onFocus={() => setHot(p.key)}
            onClick={() => setHot(p.key)}
            aria-pressed={hot === p.key}
            className="afvar-glass-tab inline-flex min-h-10 items-center rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors"
          >
            {p.text}
          </button>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-black/30 p-4 text-[13px] leading-relaxed text-(--text-secondary)">{EVIDENCE.analysis.rationale}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={active.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mt-4 text-[13.5px] leading-relaxed text-(--text-secondary)">
          <span className="font-semibold text-(--text-primary)">{active.label}.</span> {active.body}
        </motion.p>
      </AnimatePresence>
    </Window>
  );
}

function AlertSample() {
  const [state, setState] = useState<"review" | "confirmed" | "editing">("review");
  return (
    <Window title="Alerts — Sample" toolbar={SAMPLE} bodyClassName="space-y-3 p-5 sm:p-6">
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-(--accent)/15 px-4 py-3 text-[13.5px] text-(--text-primary)">
        Alert me if gold closes above the weekly high and RSI is above 70.
      </div>
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white/[.05] px-4 py-3 text-[13.5px] text-(--text-secondary)">
        <p className="text-[11.5px] font-semibold text-(--text-muted)">AFVAR · read-back</p>
        <p className="mt-1">
          I&rsquo;ll alert you when <span className="text-(--text-primary)">Gold (XAUUSD)</span> closes above its <span className="text-(--text-primary)">weekly high</span> and{" "}
          <span className="text-(--text-primary)">RSI is above 70</span> — checked on closed candles.
        </p>
        <AnimatePresence mode="wait" initial={false}>
          {state === "review" ? (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 flex gap-2">
              <button type="button" onClick={() => setState("confirmed")} className="afvar-glass-button afvar-glass-primary rs-btn !h-10 !px-4 !text-[12.5px]">
                Confirm
              </button>
              <button type="button" onClick={() => setState("editing")} className="afvar-glass-button rs-ghost !h-10 !px-4 !text-[12.5px]">
                Edit
              </button>
            </motion.div>
          ) : (
            <motion.p key={state} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 text-[12.5px]">
              <PIcon name={state === "confirmed" ? "check" : "sliders"} size={14} className="text-(--accent)" />
              {state === "confirmed" ? "Confirmed — in the sample. Nothing is saved before you confirm." : "You'd change the wording, then check the new read-back."}
              <button type="button" onClick={() => setState("review")} className="ml-auto inline-flex min-h-10 items-center px-1 text-(--text-muted) underline-offset-2 hover:underline">
                Reset
              </button>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </Window>
  );
}

const COMMANDS = ["gold 4h", "open my risk panel", "same for silver", "Close everything, open gold and the calendar side by side", "Silver ka 1 hour chart dikhao", "buy 2 lots of gold"];

function CommandSample() {
  const [picked, setPicked] = useState(COMMANDS[0]);
  const declined = picked.startsWith("buy");
  return (
    <Window title="Ask AFVAR — Sample" toolbar={SAMPLE} bodyClassName="p-5 sm:p-6">
      <div className="flex items-center gap-2.5 rounded-xl bg-black/30 px-4 py-3">
        <PIcon name="search" size={16} className="text-(--text-muted)" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={picked} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[15px]">
            {picked}
          </motion.span>
        </AnimatePresence>
        <PIcon name="mic" size={16} className="ml-auto text-(--accent)" />
      </div>
      <p className={`mt-3 flex items-center gap-2 text-[13px] ${declined ? "text-(--afvar-loss)" : "text-(--text-secondary)"}`}>
        <PIcon name={declined ? "close" : "check"} size={14} />
        {declined ? "Politely declined — AFVAR never trades. Use your own broker terminal." : "Understood — the workspace acts and reports the verified outcome."}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {COMMANDS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setPicked(c)}
            aria-pressed={picked === c}
            className="afvar-glass-tab inline-flex min-h-10 items-center rounded-full px-3 py-1.5 text-[12.5px] transition-colors"
          >
            {c}
          </button>
        ))}
      </div>
    </Window>
  );
}

type MiniState = "open" | "min" | "closed" | "zoom";
const MINI = [
  { title: "Chart · Gold", x: "6%", y: "12%", w: "46%", icon: "trend" as const, tone: "green" as const },
  { title: "News", x: "46%", y: "18%", w: "40%", icon: "news" as const, tone: "slate" as const },
  { title: "Risk & Positions", x: "22%", y: "46%", w: "44%", icon: "shield" as const, tone: "red" as const },
];

/** A tiny desktop: windows drag by their title bars, and their traffic lights and the dock all work. */
function WindowsSample() {
  const area = useRef<HTMLDivElement>(null);
  const [front, setFront] = useState(0);
  const [states, setStates] = useState<MiniState[]>(MINI.map(() => "open"));
  const [gen, setGen] = useState([0, 0, 0]);
  const set = (i: number, next: MiniState) => {
    setStates((all) => all.map((st, j) => (j === i ? next : st)));
    if (next === "open" || next === "zoom") setFront(i);
    // a fresh key snaps a dragged window back to its home spot when it is zoomed or reopened
    if (next !== "min") setGen((g) => g.map((n, j) => (j === i ? n + 1 : n)));
  };
  return (
    <Window title="Desktop — Sample" icon="desktop" tone="slate" toolbar={SAMPLE}>
      <div ref={area} className="pf-wallpaper relative h-[320px] overflow-hidden">
        <AnimatePresence>
          {MINI.map((w, i) => {
            const st = states[i];
            if (st === "min" || st === "closed") return null;
            const zoom = st === "zoom";
            return (
              <motion.div
                key={`${w.title}-${gen[i]}`}
                drag={!zoom}
                dragConstraints={area}
                dragMomentum={false}
                onPointerDown={() => setFront(i)}
                whileDrag={{ scale: 1.03 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={zoom ? { opacity: 1, scale: 1, left: "3%", top: "11%", width: "94%", height: "66%" } : { opacity: 1, scale: 1, left: w.x, top: w.y, width: w.w, height: "auto" }}
                exit={{ opacity: 0, scaleX: 0.2, scaleY: 0.1, y: 120, transition: { duration: 0.32 } }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="pf-window pf-window-sm !absolute cursor-grab active:cursor-grabbing"
                style={{ left: w.x, top: w.y, width: w.w, minWidth: 156, zIndex: front === i ? 3 : 1, originY: 1 }}
              >
                <div className="pf-window-toolbar">
                  <Lights full={zoom} onClose={() => set(i, "closed")} onMin={() => set(i, "min")} onZoom={() => set(i, zoom ? "open" : "zoom")} />
                  <span className="truncate text-[11px] font-semibold text-(--text-secondary)">{w.title}</span>
                </div>
                <div className="space-y-1.5 p-3">
                  <div className="h-1.5 w-4/5 rounded-full bg-white/10" />
                  <div className="h-1.5 w-3/5 rounded-full bg-white/10" />
                  <div className={`h-1.5 w-2/5 rounded-full ${i === 2 ? "bg-(--negative)/60" : "bg-(--positive)/60"}`} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <ul className="pf-vibrant absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-0.5 rounded-2xl px-1 py-0.5" aria-label="Sample dock">
          {MINI.map((w, i) => (
            <li key={w.title} className="relative">
              <button type="button" aria-label={states[i] === "open" || states[i] === "zoom" ? `Bring ${w.title} to front` : `Open ${w.title}`} onClick={() => set(i, states[i] === "zoom" ? "zoom" : "open")} className="block p-[5px] transition-transform active:scale-90">
                <AppIcon icon={w.icon} tone={w.tone} size={30} />
              </button>
              {states[i] !== "closed" && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/75" />}
            </li>
          ))}
        </ul>
        <p className="absolute left-0 right-0 top-2 text-center text-[11px] text-(--text-muted)">Drag by the title bar · the lights and the dock work</p>
      </div>
    </Window>
  );
}
