"use client";

// Phase 5 delight — the market-open bell on the hero. Once per page view, after
// the auto intro settles (~5s) or on the visitor's first scroll, IF a major FX
// session is open right now on the visitor's real clock, a small solid pill
// names that session ("New York open · market bell") and a one-shot "green
// wave" of thin light bars sweeps left → right across the lower third of the
// stage. No session open (weekend / gap) → nothing renders. Decorative only:
// pointer-events none, transform/opacity only, aria-hidden wave. Reduced
// motion: the pill appears without motion and there is no wave.
import { useEffect, useRef, useState } from "react";
import { haptic, playSfx } from "./sfx";

/** Standard approximate FX session hours (UTC) — same windows as SessionClock. */
const SESSIONS = [
  { city: "Tokyo", open: 0, close: 9 },
  { city: "London", open: 7, close: 16 },
  { city: "New York", open: 12, close: 21 },
] as const;

/** FX is shut from Friday's New York close to Sunday's Asia-Pacific open (~21:00 UTC). */
function isWeekend(date: Date) {
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  return day === 6 || (day === 5 && hour >= 21) || (day === 0 && hour < 21);
}

/** The most recently opened session that is open right now, or null. */
export function openSessionAt(date: Date): string | null {
  if (isWeekend(date)) return null;
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const open = SESSIONS.filter((s) => hours >= s.open && hours < s.close);
  if (!open.length) return null;
  return open.reduce((a, b) => (b.open > a.open ? b : a)).city;
}

const SETTLE_MS = 5000;
const PILL_MS = 7000;
const WAVE_MS = 1800;
const BARS = 36;

/** Deterministic bar heights (no Math.random in render). */
const WAVE = Array.from({ length: BARS }, (_, i) => {
  const h = 0.32 + 0.5 * Math.abs(Math.sin(i * 1.7 + 0.6)) * (0.55 + 0.45 * Math.abs(Math.cos(i * 0.43)));
  return { left: ((i + 0.5) / BARS) * 100, h: Math.round(h * 100), d: (i / BARS) * 0.7 };
});

const CSS = [
  "@keyframes hb-bar{0%{opacity:0;transform:scaleY(.12);animation-timing-function:cubic-bezier(.16,1,.3,1)}28%{opacity:1;transform:scaleY(1);animation-timing-function:linear}55%{opacity:.85;transform:scaleY(.94)}100%{opacity:0;transform:scaleY(.7)}}",
  // each bar: a 1.5px bright core inside a soft 12px halo (one element, gradient), fading upward (mask)
  ".hb-bar{position:absolute;bottom:0;width:12px;margin-left:-6px;transform-origin:50% 100%;opacity:0;background:linear-gradient(90deg,rgba(0,230,118,0),rgba(0,230,118,.16) 28%,#00E676 44% 56%,rgba(0,230,118,.16) 72%,rgba(0,230,118,0));-webkit-mask-image:linear-gradient(to top,#000 0%,rgba(0,0,0,.55) 55%,transparent);mask-image:linear-gradient(to top,#000 0%,rgba(0,0,0,.55) 55%,transparent);animation:hb-bar .75s linear var(--d) both}",
  "@keyframes hb-pill{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}",
  ".hb-pill{animation:hb-pill .35s cubic-bezier(.16,1,.3,1) both;transition:opacity .4s ease}",
  "@keyframes hb-ring{0%{transform:rotate(0)}15%{transform:rotate(-14deg)}30%{transform:rotate(12deg)}45%{transform:rotate(-8deg)}60%{transform:rotate(5deg)}75%{transform:rotate(-2deg)}100%{transform:rotate(0)}}",
  ".hb-ring{transform-origin:50% 10%;animation:hb-ring .8s cubic-bezier(.36,.07,.19,.97) .1s both}",
  "@media (prefers-reduced-motion:reduce){.hb-pill,.hb-ring{animation:none!important;transition:none}.hb-wave{display:none}}",
].join("");

/** Module-level: the bell rings at most once per page view (across remounts). */
let rung = false;

type Bell = { city: string; wave: boolean; leaving: boolean };

export function HeroOpenBell() {
  const [bell, setBell] = useState<Bell | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rung) return;
    const timers: number[] = [];
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      window.removeEventListener("scroll", onScroll);
      const city = openSessionAt(new Date());
      if (!city) return;
      // Only when the stage is actually on screen (a deep scroll may already have left it).
      const box = rootRef.current?.getBoundingClientRect();
      if (!box || box.bottom < 80 || box.top > window.innerHeight) return;
      rung = true;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setBell({ city, wave: !still, leaving: false });
      playSfx("bell");
      haptic(14);
      timers.push(window.setTimeout(() => setBell((b) => (b ? { ...b, wave: false } : b)), WAVE_MS));
      timers.push(window.setTimeout(() => setBell((b) => (b ? { ...b, leaving: true } : b)), PILL_MS));
      timers.push(window.setTimeout(() => setBell(null), PILL_MS + 500));
    };
    function onScroll() {
      if (window.scrollY > 4) fire();
    }
    timers.push(window.setTimeout(fire, SETTLE_MS));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-[15]" data-hero-bell="">
      <style href="afvar-hero-bell" precedence="default">
        {CSS}
      </style>
      {bell && (
        <>
          <p
            role="status"
            data-hero-bell-pill=""
            className="hb-pill absolute right-4 top-1 flex items-center gap-2 rounded-full border border-[#00E676]/35 bg-[#111416] py-1 pl-1.5 pr-3 sm:right-10 lg:py-1.5 lg:pl-2 text-[11.5px] font-medium text-[#F5F7F7] lg:right-[4%] lg:top-[84px]"
            style={bell.leaving ? { opacity: 0 } : undefined}
          >
            <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-[#00E676]/[.14] text-[#00E676]">
              <svg viewBox="0 0 16 16" className="hb-ring h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 11V7.5a4 4 0 0 1 8 0V11l1.2 1.4H2.8z" />
                <path d="M6.6 14.2a1.5 1.5 0 0 0 2.8 0" />
              </svg>
            </span>
            <span>
              {bell.city} open <span className="text-[#6D7578]">·</span> <span className="text-[#A3AAAC]">market bell</span>
            </span>
          </p>
          {bell.wave && (
            // Lower third of the stage's first VISIBLE screen (it starts below the 114px nav + ticker).
            <div aria-hidden="true" data-hero-wave="" className="hb-wave absolute inset-x-0 top-0 h-[min(100%,calc(100svh-114px))] overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-1/3">
                {WAVE.map((bar, i) => (
                  <span key={i} className="hb-bar" style={{ left: `${bar.left}%`, height: `${bar.h}%`, ["--d" as string]: `${bar.d}s` }} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
