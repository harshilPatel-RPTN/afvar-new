"use client";

import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BearArt, BeastStyles, BullArt } from "./beastArt";
import { haptic, playSfx } from "./sfx";

/*
 * Homepage easter egg (kept secret on the page — documented here only):
 *   ↑ ↑ ↓ ↓ ← → ← → B A  → "BULL RUN"    (8s): low-poly bull gallops across the
 *                                             bottom left→right kicking dust, green tint,
 *                                             every price / change pill flashes green.
 *   ↓ ↓ ↑ ↑ → ← → ← B A  → "BEAR MARKET" (8s): bear lumbers across right→left, red tint,
 *                                             prices flash red.
 * Esc ends early. Purely visual (<html data-mode="bull|bear">) — no value changes; a
 * corner label says so. Ignored while typing in a field or with a modifier held.
 * Reduced motion: tint + label only (no running characters, no flashing).
 */
const CODES = {
  bull: ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"],
  bear: ["ArrowDown", "ArrowDown", "ArrowUp", "ArrowUp", "ArrowRight", "ArrowLeft", "ArrowRight", "ArrowLeft", "b", "a"],
} as const;
type Mode = keyof typeof CODES;
const LEN = 10;
const MODE_MS = 8000;

function typing(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable || !!el.closest?.("[contenteditable],[role=textbox],[role=combobox]");
}

const sameTail = (keys: string[], code: readonly string[]) => keys.length === LEN && code.every((k, i) => k === keys[i]);

const CSS = [
  ".ee-layer{position:fixed;inset:0;overflow:clip;pointer-events:none;z-index:70}",
  ".ee-layer{--ee:#00E676;--ee-rgb:0,230,118}.ee-layer[data-ee=bear]{--ee:#FF3B3B;--ee-rgb:255,59,59}",
  "@keyframes ee-in{from{opacity:0}to{opacity:1}}",
  "@keyframes ee-out{to{opacity:0}}",
  ".ee-tint,.ee-wash{position:absolute;inset:0}",
  ".ee-tint{animation:ee-in .5s ease-out both,ee-out .6s ease-in 7.4s forwards}",
  ".ee-tint{background:radial-gradient(ellipse 75% 70% at 50% 50%,rgba(var(--ee-rgb),0) 45%,rgba(var(--ee-rgb),.16) 100%)}",
  ".ee-wash{background:var(--ee);mix-blend-mode:color;opacity:.12}",
  "@keyframes ee-wash{from{opacity:0}to{opacity:.12}}",
  ".ee-wash{animation:ee-wash .5s ease-out both,ee-out .6s ease-in 7.4s forwards}",
  "@keyframes ee-drop{from{transform:translateY(-100%)}to{transform:none}}",
  ".ee-banner{position:absolute;left:0;right:0;top:64px;height:34px;display:flex;align-items:center;justify-content:flex-start;gap:12px;padding:0 16px;background:#111416;border-bottom:1px solid rgba(var(--ee-rgb),.45);color:var(--ee);font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.32em;animation:ee-drop .35s cubic-bezier(.2,.8,.2,1) both,ee-out .5s ease-in 7.5s forwards}",
  ".ee-banner small{color:#A3AAAC;font-weight:500;letter-spacing:.12em;font-size:10px}",
  ".ee-banner small{display:none}",
  "@media (min-width:640px){.ee-banner{justify-content:center}.ee-banner small{display:inline}}",
  // corner label rides in the banner's right edge (never covers the nav)
  ".ee-label{position:absolute;right:12px;top:50%;margin-top:-10px;padding:3px 7px;border-radius:6px;border:1px solid rgba(255,255,255,.11);background:#080A0B;color:#A3AAAC;font:600 9.5px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em}",
  // runner: crosses the bottom of the viewport; the wrapper is clipped by .ee-layer
  "@keyframes ee-run-r{from{transform:translateX(-260px)}to{transform:translateX(calc(100vw + 40px))}}",
  "@keyframes ee-run-l{from{transform:translateX(calc(100vw + 40px))}to{transform:translateX(-260px)}}",
  ".ee-run{position:absolute;left:0;bottom:18px;width:200px}",
  ".ee-run[data-dir=r]{animation:ee-run-r 4.6s cubic-bezier(.35,.05,.6,1) .25s both}",
  ".ee-run[data-dir=l]{animation:ee-run-l 7.2s linear .2s both}",
  "@keyframes ee-gallop{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-9px) rotate(-2deg)}}",
  "@keyframes ee-lumber{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(1.2deg)}}",
  ".ee-bob{animation:ee-gallop .34s ease-in-out infinite;transform-origin:50% 100%}",
  ".ee-run[data-dir=l] .ee-bob{animation:ee-lumber .9s ease-in-out infinite}",
  "@keyframes ee-dust{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:.6}100%{opacity:0;transform:translate(var(--dx),-14px) scale(2.2)}}",
  ".ee-dust{position:absolute;bottom:2px;width:16px;height:8px;border-radius:50%;background:rgba(163,170,172,.4);opacity:0;animation:ee-dust .7s ease-out var(--d) infinite}",
  // price / change-pill flash — visual only
  "@keyframes ee-blink{0%,100%{opacity:1}50%{opacity:.4}}",
  "html[data-mode] main .tabular-nums{animation:ee-blink .7s ease-in-out 5;transition:color .3s}",
  "html[data-mode=bull] main .tabular-nums{color:#00E676!important}",
  "html[data-mode=bear] main .tabular-nums{color:#FF6464!important}",
  "html[data-mode=bull] main .tabular-nums.rounded-\\[8px\\]{border-color:rgba(0,168,90,.4)!important;background-color:rgba(0,230,118,.1)!important}",
  "html[data-mode=bear] main .tabular-nums.rounded-\\[8px\\]{border-color:rgba(255,59,59,.4)!important;background-color:rgba(255,59,59,.1)!important}",
  "@media (prefers-reduced-motion:reduce){.ee-run{display:none}html[data-mode] main .tabular-nums{animation:none}.ee-banner,.ee-tint,.ee-wash,.ee-label{animation:none}}",
].join("");

const DUST = [0, 0.12, 0.24, 0.36, 0.48] as const;

export function EasterEgg() {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode | null>(null);
  const [run, setRun] = useState(0);
  const keys = useRef<string[]>([]);
  const limb = useMotionValue(0);
  const dust = useMotionValue(1);

  // Key listener — tracks the last 10 keys; Esc ends a running mode.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMode(null);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const buf = keys.current;
      buf.push(k);
      if (buf.length > LEN) buf.shift();
      const hit = (Object.keys(CODES) as Mode[]).find((m) => sameTail(buf, CODES[m]));
      if (!hit) return;
      buf.length = 0;
      setMode(hit);
      setRun((r) => r + 1);
      playSfx(hit === "bull" ? "snort" : "growl");
      haptic([20, 40, 20]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Mode lifecycle: <html data-mode>, auto-end after 8s.
  useEffect(() => {
    if (!mode) return;
    const root = document.documentElement;
    root.setAttribute("data-mode", mode);
    const id = window.setTimeout(() => setMode(null), MODE_MS);
    return () => {
      window.clearTimeout(id);
      root.removeAttribute("data-mode");
    };
  }, [mode, run]);

  // Limb cycle for the runner (leg gallop / paw swing).
  useEffect(() => {
    if (!mode || reduce) return;
    const c = mode === "bull" ? animate(limb, [-16, 20, -16], { duration: 0.34, repeat: Infinity, ease: "easeInOut" }) : animate(limb, [-12, 10, -12], { duration: 0.9, repeat: Infinity, ease: "easeInOut" });
    return () => c.stop();
  }, [mode, run, reduce, limb]);

  if (!mode) return null;
  const bull = mode === "bull";
  return (
    <div key={run} className="ee-layer" data-ee={mode} aria-hidden="true">
      <style href="afvar-easter-egg" precedence="default">
        {CSS}
      </style>
      <BeastStyles />
      <div className="ee-tint" />
      <div className="ee-wash" />
      <div className="ee-banner">
        {bull ? "BULL RUN" : "BEAR MARKET"}
        <small>Esc</small>
        <span className="ee-label">Easter egg · visual only</span>
      </div>
      {!reduce && (
        <div className="ee-run" data-dir={bull ? "r" : "l"}>
          {DUST.map((d, i) => (
            <span key={d} className="ee-dust" style={{ left: bull ? 30 + i * 12 : 120 + i * 12, ["--d" as string]: `${d}s`, ["--dx" as string]: bull ? "-34px" : "30px" }} />
          ))}
          <div className="ee-bob">
            {bull ? (
              <BullArt leg={limb} dust={dust} idle={false} />
            ) : (
              <div style={{ transform: "scaleX(-1)", width: 170, marginLeft: 30 }}>
                <BearArt paw={limb} idle={false} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
