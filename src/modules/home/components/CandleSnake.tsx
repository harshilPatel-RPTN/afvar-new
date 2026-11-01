"use client";

// Phase 1 — CANDLE SNAKE section transition.
// As a section scrolls in, a chain of small candles slithers in from one edge
// along a wavy price path, reaches the target card, and wraps along its top
// border; the border is left drawn in green with a few twinkles. Fully
// scroll-scrubbed (reverse scroll reverses it). Decorative only — no numbers.
//
//   <section className="relative"> … <CandleSnake from="right" /> … <div data-snake-target> … </section>
//
// Transform / opacity / stroke-dashoffset only; positions are written to DOM
// refs from the shared scroll bus (no React state per frame).
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { subscribeScroll } from "./marketMotion";
import { playSfx } from "./sfx";

const GREEN = "#00E676";
const RED = "#FF3B3B";
const TAIL = 18;

interface Geo {
  w: number;
  h: number;
  approach: string;
  border: string;
  full: string;
  /** Twinkle points along the drawn border (section coords). */
  stars: [number, number][];
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function buildGeo(section: HTMLElement, card: HTMLElement, from: "left" | "right", radius: number): Geo {
  const s = section.getBoundingClientRect();
  const c = card.getBoundingClientRect();
  const w = s.width;
  const h = s.height;
  const L = c.left - s.left;
  const R = c.right - s.left;
  const T = c.top - s.top;
  const r = Math.min(radius, (R - L) / 4);
  const band = Math.max(18, T - 30); // travel lane just above the card row
  const amp = 12;

  // Wavy approach from the section edge to the near top corner of the card.
  const startX = from === "right" ? w + 30 : -30;
  const endX = from === "right" ? R : L;
  const n = 6;
  let approach = `M ${startX} ${band}`;
  for (let i = 1; i <= n; i++) {
    const x = startX + ((endX - startX) * i) / n;
    const px = startX + ((endX - startX) * (i - 0.5)) / n;
    const py = band + (i % 2 ? -amp : amp) * (i === n ? 0.4 : 1);
    approach += ` Q ${px} ${py} ${x} ${i === n ? T + r * 0.2 - 6 : band}`;
  }
  // Drop onto the corner, then run along the top edge (with rounded corners).
  const border =
    from === "right"
      ? `M ${R} ${T + r} A ${r} ${r} 0 0 0 ${R - r} ${T} L ${L + r} ${T} A ${r} ${r} 0 0 0 ${L} ${T + r}`
      : `M ${L} ${T + r} A ${r} ${r} 0 0 1 ${L + r} ${T} L ${R - r} ${T} A ${r} ${r} 0 0 1 ${R} ${T + r}`;
  const joinX = from === "right" ? R : L;
  const full = `${approach} L ${joinX} ${T + r} ${border.replace(/^M [^A]+/, "")}`;

  const stars: [number, number][] = [0.12, 0.38, 0.63, 0.88].map((f) => [L + r + (R - L - 2 * r) * f, T]);
  return { w, h, approach, border, full, stars };
}

export function CandleSnake({
  from = "right",
  target = "[data-snake-target]",
  radius = 16,
}: {
  from?: "left" | "right";
  target?: string;
  radius?: number;
}) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<SVGPathElement>(null);
  const approachRef = useRef<SVGPathElement>(null);
  const borderRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const candleRefs = useRef<(SVGGElement | null)[]>([]);
  const starsRef = useRef<SVGGElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  const tail = useMemo(
    () =>
      Array.from({ length: TAIL }, (_, i) => {
        // Deterministic little OHLC shapes along the snake: mostly green near the head.
        const up = i < 3 ? true : (i * 7) % 5 !== 0;
        const body = 9 + ((i * 13) % 9);
        const wick = body + 7 + ((i * 5) % 7);
        return { up, body, wick };
      }),
    [],
  );

  // Measure section + target card (in a ResizeObserver callback — no setState in effect body).
  useEffect(() => {
    const root = rootRef.current;
    const section = root?.parentElement;
    const card = section?.querySelector<HTMLElement>(target);
    if (!root || !section || !card) return;
    const measure = () => setGeo(buildGeo(section, card, from, radius));
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(card);
    return () => ro.disconnect();
  }, [from, target, radius]);

  // Drive the snake from the shared scroll bus.
  useEffect(() => {
    const root = rootRef.current;
    const section = root?.parentElement;
    const full = fullRef.current;
    const approach = approachRef.current;
    const border = borderRef.current;
    if (!geo || !section || !full || !approach || !border) return;
    const total = full.getTotalLength();
    const aLen = approach.getTotalLength();
    const bLen = border.getTotalLength();
    const spacing = Math.min(30, total / (TAIL + 6));
    let done = false;

    const paint = (p: number) => {
      const head = p * total;
      // Head
      if (headRef.current) {
        const pt = full.getPointAtLength(Math.max(0, head));
        headRef.current.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
        headRef.current.style.opacity = p > 0.001 && p < 0.985 ? "1" : "0";
      }
      // Tail candles: always upright, trailing behind the head; they sink into the
      // border once the head has wrapped it.
      const fade = 1 - clamp01((p - 0.9) / 0.08);
      candleRefs.current.forEach((g, i) => {
        if (!g) return;
        const at = head - (i + 1) * spacing;
        if (at <= 0 || p <= 0.001) {
          g.style.opacity = "0";
          return;
        }
        const pt = full.getPointAtLength(at);
        const grow = clamp01((head - at) / (spacing * 1.5));
        g.setAttribute("transform", `translate(${pt.x} ${pt.y}) scale(1 ${0.35 + 0.65 * grow})`);
        g.style.opacity = String(fade * (1 - i / (TAIL + 4)));
      });
      // Trail line behind the head (the "price path" the candles ride on).
      if (trailRef.current) {
        trailRef.current.style.strokeDasharray = `${total}`;
        trailRef.current.style.strokeDashoffset = String(total - head);
        trailRef.current.style.opacity = String(0.7 * fade);
      }
      // Border: drawn as the head runs along the card's top edge; stays after.
      const bp = clamp01((head - aLen) / bLen);
      for (const el of [border, glowRef.current]) {
        if (!el) continue;
        el.style.strokeDasharray = `${bLen}`;
        el.style.strokeDashoffset = String(bLen * (1 - bp));
      }
      if (starsRef.current) starsRef.current.style.opacity = bp >= 0.999 ? "1" : "0";
      if (bp >= 0.999 && !done) {
        done = true;
        playSfx("tick");
      } else if (bp < 0.5) done = false;
    };

    if (reduce) {
      paint(1);
      return;
    }
    const card = section.querySelector<HTMLElement>(target);
    return subscribeScroll(() => {
      const r = (card ?? section).getBoundingClientRect();
      const vh = window.innerHeight;
      // Start as the card's top edge enters the viewport; finish (border fully wrapped)
      // when it reaches ~45% of the viewport height — so the wrap happens on screen.
      const p = clamp01((vh * 1.02 - r.top) / (vh * 0.57));
      paint(p);
      // Twinkles only animate while the card's top edge is on screen.
      const stars = starsRef.current;
      if (stars) {
        const on = r.top < vh && r.top > -40;
        if (on) stars.removeAttribute("data-offscreen");
        else stars.setAttribute("data-offscreen", "");
      }
    });
  }, [geo, reduce, target]);

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {geo && (
        <svg width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} className="absolute left-0 top-0 overflow-visible">
          <defs>
            <filter id="snk-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
          </defs>
          {/* measurement paths (invisible) */}
          <path ref={fullRef} d={geo.full} fill="none" stroke="none" />
          <path ref={approachRef} d={geo.approach} fill="none" stroke="none" />
          {/* trail line */}
          <path ref={trailRef} d={geo.full} fill="none" stroke="var(--afvar-mint)" strokeWidth={1.4} strokeLinecap="round" style={{ opacity: 0 }} />
          {/* card top border: soft glow underlay + crisp line */}
          <path ref={glowRef} d={geo.border} fill="none" stroke="var(--afvar-mint)" strokeWidth={4} strokeLinecap="round" opacity={0.45} filter="url(#snk-soft)" />
          <path ref={borderRef} d={geo.border} fill="none" stroke="var(--afvar-mint)" strokeWidth={1.5} strokeLinecap="round" />
          {/* tail candles */}
          {tail.map((c, i) => (
            <g key={i} ref={(el) => void (candleRefs.current[i] = el)} style={{ opacity: 0 }}>
              <line x1={0} x2={0} y1={-c.wick / 2} y2={c.wick / 2} stroke={c.up ? GREEN : RED} strokeWidth={1.4} opacity={0.85} />
              <rect x={-3.5} y={-c.body / 2} width={7} height={c.body} rx={1.2} fill={c.up ? GREEN : RED} />
            </g>
          ))}
          {/* head */}
          <g ref={headRef} style={{ opacity: 0 }}>
            <circle r={11} fill="var(--afvar-mint)" opacity={0.3} filter="url(#snk-soft)" />
            <circle r={4.5} fill="#E9FFF3" />
          </g>
          {/* twinkles once the border is complete */}
          <g ref={starsRef} data-offscreen="" style={{ opacity: 0, transition: "opacity .3s" }}>
            {geo.stars.map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <path className="snk-star" style={{ animationDelay: `${i * 0.45}s` }} d="M0 -7 L1.4 -1.4 L7 0 L1.4 1.4 L0 7 L-1.4 1.4 L-7 0 L-1.4 -1.4 Z" fill="#E9FFF3" />
              </g>
            ))}
          </g>
        </svg>
      )}
      <style href="afvar-candle-snake" precedence="default">{`
        @keyframes snk-twinkle { 0%, 100% { opacity: 0; transform: scale(.2) rotate(0deg) } 12% { opacity: 1; transform: scale(1) rotate(25deg) } 30% { opacity: 0; transform: scale(.3) rotate(45deg) } }
        .snk-star { transform-box: fill-box; transform-origin: center; opacity: 0; animation: snk-twinkle 2.6s ease-in-out infinite; }
        [data-offscreen] .snk-star, [data-offscreen].snk-star { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .snk-star { animation: none; opacity: .7; transform: scale(.7); } }
      `}</style>
    </div>
  );
}
