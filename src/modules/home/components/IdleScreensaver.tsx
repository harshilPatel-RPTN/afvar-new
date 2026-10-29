"use client";

import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useState, type SyntheticEvent } from "react";
import { BearArt, BeastStyles, BullArt } from "./beastArt";
import { haptic, playSfx } from "./sfx";

const IDLE_MS = 10_000;
/** Hero intro auto-plays for roughly this long after load — never doze during it. */
const INTRO_GRACE_MS = 6_000;
const SNORE_MS = 3_500;
const WAKE_MS = 380;
const ACTIVITY = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

type Phase = "off" | "asleep" | "waking";

function blocked() {
  const d = document;
  return (
    d.hidden ||
    d.documentElement.hasAttribute("data-mode") || // easter egg running
    !!d.querySelector('[aria-modal="true"],dialog[open]') ||
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

const CSS = [
  ".ss-layer{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:16px;cursor:default}",
  // fades live on the children: an opacity animation on the layer itself would make it
  // the backdrop root and the scrim would blur nothing
  ".ss-scrim,.ss-stage{animation:ss-in .6s ease-out both}",
  ".ss-layer[data-phase=waking] .ss-scrim,.ss-layer[data-phase=waking] .ss-stage{animation:ss-out .35s ease-in both}",
  "@keyframes ss-in{from{opacity:0}to{opacity:1}}",
  "@keyframes ss-out{from{opacity:1}to{opacity:0}}",
  // Screensaver scrim — the one place blur is wanted (explicit request); solid fallback.
  ".ss-scrim{position:absolute;inset:0;background:rgba(3,4,5,.88)}",
  "@supports ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.ss-scrim{background:rgba(3,4,5,.55);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}}",
  ".ss-stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:18px}",
  ".ss-pair{position:relative;display:flex;align-items:flex-end;width:min(500px,88vw)}",
  ".ss-bull{position:relative;width:54%;transform-origin:85% 100%;transform:rotate(2deg)}",
  ".ss-bear{position:relative;width:43%;margin-left:1%}",
  ".ss-layer .bx-breathe{animation-duration:4.4s}",
  // soften the cut-off backs/bellies of the busts (static masks, not animated)
  ".ss-bull{-webkit-mask-image:linear-gradient(to top,transparent,#000 22%);mask-image:linear-gradient(to top,transparent,#000 22%)}",
  ".ss-bear{-webkit-mask-image:linear-gradient(to left,transparent,#000 40%);mask-image:linear-gradient(to left,transparent,#000 40%),linear-gradient(to top,transparent,#000 22%);mask-composite:intersect}",
  "@keyframes ss-jolt{0%{transform:translateY(0)}35%{transform:translateY(-16px)}70%{transform:translateY(3px)}100%{transform:translateY(0)}}",
  ".ss-layer[data-phase=waking] .ss-jump{animation:ss-jolt .34s cubic-bezier(.2,.8,.2,1) both}",
  ".ss-layer[data-phase=waking] .bx-z{display:none}",
  // z's leave from each sleeper's mouth: a zero-size anchor placed in % of the pair's
  // WIDTH (margin-top % resolves against width, so it scales with the art).
  ".ss-zs{position:absolute;top:0;width:0;height:0;z-index:2}",
  ".ss-zs .bx-z{color:#F5F7F7;display:flex;flex-direction:column;align-items:center;animation-name:ss-z;animation-duration:3.6s;text-shadow:0 1px 6px rgba(0,0,0,.7)}",
  // a tiny candle riding on top of every z: green for the bull, red for the bear
  ".ss-candle{position:relative;display:block;width:.34em;height:.62em;margin-bottom:.34em;border-radius:1px;background:var(--zc);box-shadow:0 0 6px var(--zc)}",
  ".ss-candle::before{content:'';position:absolute;left:50%;top:-.22em;bottom:-.22em;width:1px;margin-left:-.5px;background:var(--zc)}",
  "@keyframes ss-z{0%{opacity:0;transform:translate(0,0) scale(.55)}18%{opacity:.95}100%{opacity:0;transform:translate(calc(var(--dx) * 1px),-96px) scale(1.25)}}",
  // flatline loader
  ".ss-flat{display:block;width:min(240px,64vw);height:28px;overflow:visible}",
  "@keyframes ss-pulse{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.25)}}",
  ".ss-dot{transform-box:fill-box;transform-origin:center;animation:ss-pulse 2.4s ease-in-out infinite}",
  ".ss-label{max-width:min(420px,88vw);text-align:center;font:500 11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;color:#A3AAAC}",
  ".ss-label b{color:#F5F7F7;font-weight:600}",
  "@media (prefers-reduced-motion:reduce){.ss-layer{display:none}}",
].join("");

function Zs({ who, delay }: { who: "bull" | "bear"; delay: number }) {
  // Mouth anchors measured on the sleeping pose (as % of the pair's width).
  const anchor = who === "bull" ? { left: "47%", marginTop: "34%" } : { left: "61.5%", marginTop: "19.5%" };
  const vars = { ["--zc" as string]: who === "bull" ? "#00E676" : "#FF3B3B" };
  return (
    <div className="ss-zs" style={{ ...anchor, ...vars }}>
      {(["z", "z", "Z"] as const).map((ch, i) => (
        <span
          key={i}
          className="bx-z"
          style={{ ["--d" as string]: `${delay + i * 0.9}s`, ["--dx" as string]: who === "bull" ? -10 - i * 6 : 12 + i * 6, left: who === "bull" ? -i * 4 : i * 4, fontSize: 17 + i * 7 }}
        >
          <i className="ss-candle" aria-hidden="true" />
          {ch}
        </span>
      ))}
    </div>
  );
}

/**
 * Page-wide idle screensaver: after IDLE_MS with no pointer / scroll / key / wheel /
 * touch activity (tab visible, no modal open, past the hero intro, no easter egg,
 * motion allowed) a fixed overlay fades in over a blurred + dimmed page: the bull
 * and bear asleep dead-centre (eyes shut, heads drooped, slow breathing, staggered
 * "z z Z"), a flatlining loader and a muted caption. Sound (only if opted in): a
 * yawn as they doze, then a soft yawn "snore" every SNORE_MS. Any activity wakes
 * them (jolt + green/red eye flare, snort + growl, haptic) and the overlay fades out
 * in ~350ms; the pointer events that woke it are swallowed so nothing clicks through.
 */
export function IdleScreensaver() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("off");
  const [wake, setWake] = useState(0);
  const bullHead = useMotionValue(0);
  const bearHead = useMotionValue(0);
  const bearPaw = useMotionValue(58); // paw tucked down while dozing

  useEffect(() => {
    if (reduce) return;
    const mountedAt = Date.now();
    let lastAct = Date.now();
    let state: Phase = "off";
    let idleTimer = 0;
    let snoreTimer = 0;
    let offTimer = 0;

    const stopSnore = () => window.clearInterval(snoreTimer);
    const startSnore = () => {
      stopSnore();
      snoreTimer = window.setInterval(() => playSfx("yawn"), SNORE_MS);
    };
    const arm = () => {
      window.clearTimeout(idleTimer);
      if (state !== "off" || document.hidden) return;
      const due = Math.max(IDLE_MS - (Date.now() - lastAct), INTRO_GRACE_MS - (Date.now() - mountedAt), 250);
      idleTimer = window.setTimeout(check, due);
    };
    const check = () => {
      if (Date.now() - lastAct < IDLE_MS || Date.now() - mountedAt < INTRO_GRACE_MS) return arm();
      if (blocked()) {
        lastAct = Date.now();
        return arm();
      }
      state = "asleep";
      setPhase("asleep");
      bullHead.set(0);
      bearHead.set(0);
      bearPaw.set(58);
      animate(bullHead, 15, { duration: 1.6, ease: "easeInOut" });
      animate(bearHead, 12, { duration: 1.9, ease: "easeInOut", delay: 0.3 });
      playSfx("yawn");
      startSnore();
    };
    const onActivity = () => {
      lastAct = Date.now();
      if (state !== "asleep") return;
      state = "waking";
      stopSnore();
      setPhase("waking");
      setWake((w) => w + 1);
      animate(bullHead, [bullHead.get(), -10, 0], { duration: 0.32, ease: "easeOut" });
      animate(bearHead, [bearHead.get(), -9, 0], { duration: 0.32, ease: "easeOut" });
      animate(bearPaw, [58, -6, 10], { duration: 0.34, ease: "easeOut" });
      playSfx("snort");
      playSfx("growl");
      haptic([20, 40, 20]);
      offTimer = window.setTimeout(() => {
        state = "off";
        setPhase("off");
        arm();
      }, WAKE_MS);
    };
    const onVis = () => {
      if (document.hidden) {
        window.clearTimeout(idleTimer);
        stopSnore();
        return;
      }
      lastAct = Date.now();
      if (state === "asleep") startSnore();
      else arm();
    };

    const opts = { passive: true, capture: true } as const;
    ACTIVITY.forEach((t) => window.addEventListener(t, onActivity, opts));
    document.addEventListener("visibilitychange", onVis);
    arm();
    return () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(offTimer);
      stopSnore();
      ACTIVITY.forEach((t) => window.removeEventListener(t, onActivity, opts));
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce, bullHead, bearHead, bearPaw]);

  // The waking pointer/click must not reach the page underneath.
  const swallow = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const on = phase !== "off" && !reduce;
  const asleep = phase === "asleep";
  return (
    <>
      <span className="sr-only" aria-live="polite">
        {asleep ? "Screensaver — move to continue" : ""}
      </span>
      {on && (
        <div className="ss-layer" data-phase={phase} data-ss="" aria-hidden="true" onClick={swallow} onPointerDown={swallow} onMouseDown={swallow}>
          <style href="afvar-screensaver" precedence="default">
            {CSS}
          </style>
          <BeastStyles />
          <div className="ss-scrim" />
          <div className="ss-stage">
            <div className="ss-pair">
              <div className="ss-bull">
                <div className="ss-jump">
                  <BullArt head={bullHead} sleep={asleep} wake={wake} />
                </div>
              </div>
              <div className="ss-bear">
                <div className="ss-jump" style={{ animationDelay: ".04s" }}>
                  <div style={{ transform: "scaleX(-1)" }}>
                    <BearArt head={bearHead} paw={bearPaw} sleep={asleep} wake={wake} />
                  </div>
                </div>
              </div>
              <Zs who="bull" delay={0} />
              <Zs who="bear" delay={1.2} />
            </div>
            <svg className="ss-flat" viewBox="0 0 240 28" aria-hidden="true">
              <line x1="0" y1="14" x2="240" y2="14" stroke="rgba(163,170,172,.18)" strokeWidth="1" />
              <polyline points="0,14 92,14 100,14 104,9 108,19 112,14 240,14" fill="none" stroke="#00E676" strokeOpacity=".55" strokeWidth="1.4" strokeLinejoin="round" />
              {[24, 48, 72, 150, 174, 198, 222].map((x, i) => (
                <g key={x} opacity=".55">
                  <line x1={x} y1="10" x2={x} y2="18" stroke={i % 2 ? "#FF3B3B" : "#00E676"} strokeWidth="1" />
                  <rect x={x - 2} y="12.5" width="4" height="3" fill={i % 2 ? "#FF3B3B" : "#00E676"} />
                </g>
              ))}
              <circle className="ss-dot" cx="120" cy="14" r="3" fill="#00E676" />
            </svg>
            <p className="ss-label">
              Markets never sleep. Our bull and bear do. · <b>move to wake</b>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
