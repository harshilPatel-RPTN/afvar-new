"use client";

// Market motion for the Resources pages, matching the home page's look
// (home/components: CandleSnake, CandleCard, ClickBurst) but owned by this
// module, so the home page is never touched. Transform / opacity /
// stroke-dashoffset only; per-frame work writes to DOM refs, not React state.
import { frame, motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const GREEN = "#00E676";
const RED = "#FF3B3B";
const EASE = [0.16, 1, 0.3, 1] as const;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/* ------------------------------------------------------------ scroll bus */

type ScrollSub = () => void;
const subs = new Set<ScrollSub>();
let scheduled = false;
function flush() {
  scheduled = false;
  subs.forEach((fn) => fn());
}
function onScroll() {
  if (scheduled) return;
  scheduled = true;
  frame.read(flush);
}
function subscribeScroll(fn: ScrollSub) {
  subs.add(fn);
  if (subs.size === 1) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }
  frame.read(fn);
  return () => {
    subs.delete(fn);
    if (subs.size === 0) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  };
}

/* ----------------------------------------------------------- candle snake */

const TAIL = 18;

interface Geo {
  w: number;
  h: number;
  approach: string;
  border: string;
  full: string;
  stars: [number, number][];
}

function buildGeo(section: HTMLElement, card: HTMLElement, from: "left" | "right", radius: number): Geo {
  const s = section.getBoundingClientRect();
  const c = card.getBoundingClientRect();
  const w = s.width;
  const h = s.height;
  const L = c.left - s.left;
  const R = c.right - s.left;
  const T = c.top - s.top;
  const r = Math.min(radius, (R - L) / 4);
  const band = Math.max(18, T - 30);
  const amp = 12;
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
  const border =
    from === "right"
      ? `M ${R} ${T + r} A ${r} ${r} 0 0 0 ${R - r} ${T} L ${L + r} ${T} A ${r} ${r} 0 0 0 ${L} ${T + r}`
      : `M ${L} ${T + r} A ${r} ${r} 0 0 1 ${L + r} ${T} L ${R - r} ${T} A ${r} ${r} 0 0 1 ${R} ${T + r}`;
  const joinX = from === "right" ? R : L;
  const full = `${approach} L ${joinX} ${T + r} ${border.replace(/^M [^A]+/, "")}`;
  const stars: [number, number][] = [0.12, 0.38, 0.63, 0.88].map((f) => [L + r + (R - L - 2 * r) * f, T]);
  return { w, h, approach, border, full, stars };
}

/**
 * Section transition from the home page: as the section scrolls in, a chain of
 * small candles slithers in from one edge along a wavy price path, reaches the
 * `[data-snake-target]` card and wraps its top border, which stays drawn in
 * green with a few twinkles. Scroll-scrubbed both ways. Place as a direct
 * child of a `relative` section.
 */
export function CandleSnake({ from = "right", target = "[data-snake-target]", radius = 16 }: { from?: "left" | "right"; target?: string; radius?: number }) {
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
        const up = i < 3 ? true : (i * 7) % 5 !== 0;
        const body = 9 + ((i * 13) % 9);
        const wick = body + 7 + ((i * 5) % 7);
        return { up, body, wick };
      }),
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    const section = root?.parentElement;
    const card = section?.querySelector<HTMLElement>(target);
    if (!root || !section || !card) return;
    const measure = () => setGeo(buildGeo(section, card, from, radius));
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(card);
    // Entrance animations (fade-up reveals) move the card without resizing it, so
    // re-measure once it has come into view and settled — otherwise the drawn
    // border lands where the card was mid-animation.
    const timers: number[] = [];
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      timers.push(window.setTimeout(measure, 700), window.setTimeout(measure, 1400));
    });
    io.observe(card);
    return () => {
      ro.disconnect();
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [from, target, radius]);

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

    const paint = (p: number) => {
      const head = p * total;
      if (headRef.current) {
        const pt = full.getPointAtLength(Math.max(0, head));
        headRef.current.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
        headRef.current.style.opacity = p > 0.001 && p < 0.985 ? "1" : "0";
      }
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
      if (trailRef.current) {
        trailRef.current.style.strokeDasharray = `${total}`;
        trailRef.current.style.strokeDashoffset = String(total - head);
        trailRef.current.style.opacity = String(0.7 * fade);
      }
      const bp = clamp01((head - aLen) / bLen);
      for (const el of [border, glowRef.current]) {
        if (!el) continue;
        el.style.strokeDasharray = `${bLen}`;
        el.style.strokeDashoffset = String(bLen * (1 - bp));
      }
      if (starsRef.current) starsRef.current.style.opacity = bp >= 0.999 ? "1" : "0";
    };

    if (reduce) {
      paint(1);
      return;
    }
    const card = section.querySelector<HTMLElement>(target);
    return subscribeScroll(() => {
      const r = (card ?? section).getBoundingClientRect();
      const vh = window.innerHeight;
      paint(clamp01((vh * 1.02 - r.top) / (vh * 0.57)));
      const stars = starsRef.current;
      if (stars) {
        if (r.top < vh && r.top > -40) stars.removeAttribute("data-offscreen");
        else stars.setAttribute("data-offscreen", "");
      }
    });
  }, [geo, reduce, target]);

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[30] overflow-hidden">
      {geo && (
        <svg width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} className="absolute left-0 top-0 overflow-visible">
          <defs>
            <filter id="rsnk-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
          </defs>
          <path ref={fullRef} d={geo.full} fill="none" stroke="none" />
          <path ref={approachRef} d={geo.approach} fill="none" stroke="none" />
          <path ref={trailRef} d={geo.full} fill="none" stroke={GREEN} strokeWidth={1.4} strokeLinecap="round" style={{ opacity: 0 }} />
          <path ref={glowRef} d={geo.border} fill="none" stroke={GREEN} strokeWidth={4} strokeLinecap="round" opacity={0.45} filter="url(#rsnk-soft)" />
          <path ref={borderRef} d={geo.border} fill="none" stroke={GREEN} strokeWidth={1.5} strokeLinecap="round" />
          {tail.map((c, i) => (
            <g key={i} ref={(el) => void (candleRefs.current[i] = el)} style={{ opacity: 0 }}>
              <line x1={0} x2={0} y1={-c.wick / 2} y2={c.wick / 2} stroke={c.up ? GREEN : RED} strokeWidth={1.4} opacity={0.85} />
              <rect x={-3.5} y={-c.body / 2} width={7} height={c.body} rx={1.2} fill={c.up ? GREEN : RED} />
            </g>
          ))}
          <g ref={headRef} style={{ opacity: 0 }}>
            <circle r={11} fill={GREEN} opacity={0.3} filter="url(#rsnk-soft)" />
            <circle r={4.5} fill="#E9FFF3" />
          </g>
          <g ref={starsRef} data-offscreen="" style={{ opacity: 0, transition: "opacity .3s" }}>
            {geo.stars.map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <path className="rsnk-star" style={{ animationDelay: `${i * 0.45}s` }} d="M0 -7 L1.4 -1.4 L7 0 L1.4 1.4 L0 7 L-1.4 1.4 L-7 0 L-1.4 -1.4 Z" fill="#E9FFF3" />
              </g>
            ))}
          </g>
        </svg>
      )}
      <style href="rs-candle-snake" precedence="default">{`
        @keyframes rsnk-twinkle { 0%, 100% { opacity: 0; transform: scale(.2) rotate(0deg) } 12% { opacity: 1; transform: scale(1) rotate(25deg) } 30% { opacity: 0; transform: scale(.3) rotate(45deg) } }
        .rsnk-star { transform-box: fill-box; transform-origin: center; opacity: 0; animation: rsnk-twinkle 2.6s ease-in-out infinite; }
        [data-offscreen] .rsnk-star { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .rsnk-star { animation: none; opacity: .7; transform: scale(.7); } }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------ candle card */

/** Six mini candles that grow in the card's corner on hover (decorative, no numbers). */
function HoverCandles({ up }: { up: boolean }) {
  const bars = up ? [4, 6, 5, 8, 10, 12] : [12, 10, 11, 7, 6, 4];
  const color = up ? GREEN : RED;
  return (
    <svg aria-hidden="true" viewBox="0 0 34 16" className="rsc-spark pointer-events-none absolute right-3.5 top-3 z-10 h-4 w-[34px]">
      {bars.map((h, i) => {
        const counter = i === 2;
        const x = 1 + i * 5.6;
        const top = 15 - h;
        return (
          <g key={i} style={{ transitionDelay: `${i * 0.035}s` }}>
            <line x1={x + 1.5} x2={x + 1.5} y1={Math.max(0.5, top - 2)} y2={15.5} stroke={counter ? "#6D7578" : color} strokeWidth={0.8} />
            <rect x={x} y={top} width={3} height={h} rx={0.5} fill={counter ? "#6D7578" : color} />
          </g>
        );
      })}
    </svg>
  );
}

const CARD_CSS = [
  ".rsc-spark{opacity:0;transition:opacity .2s cubic-bezier(.16,1,.3,1)}",
  ".rsc-spark g{transform:scaleY(0);transform-box:fill-box;transform-origin:50% 100%;transition:transform .24s cubic-bezier(.16,1,.3,1)}",
  "@media (hover:hover){.rsc-card:hover .rsc-spark{opacity:1}.rsc-card:hover .rsc-spark g{transform:scaleY(1)}}",
  "@media (prefers-reduced-motion:reduce){.rsc-spark g{transition:none}}",
].join("");

/**
 * The home page's card entrance, like a candle printing: the body grows up
 * from the bottom (clip-path), content fades in, then a 1px green wick draws
 * up from the top edge and fades. Hover grows six mini candles in the corner.
 */
export function CandleCard({
  children,
  index = 0,
  delay = 0,
  className = "",
  as = "div",
  snakeTarget = false,
}: {
  children: ReactNode;
  index?: number;
  delay?: number;
  className?: string;
  as?: "div" | "li";
  snakeTarget?: boolean;
}) {
  const reduce = useReducedMotion();
  const instant = { duration: 0 };
  const body: Variants = {
    hidden: { clipPath: "inset(100% 0% 0% 0%)", opacity: 0 },
    visible: {
      clipPath: "inset(0% 0% 0% 0%)",
      opacity: 1,
      transition: reduce ? instant : { clipPath: { duration: 0.6, delay, ease: EASE }, opacity: { duration: 0.3, delay, ease: EASE } },
      transitionEnd: { clipPath: "none" },
    },
  };
  const wick: Variants = {
    hidden: { scaleY: 0, opacity: 0 },
    visible: { scaleY: [0, 1, 1], opacity: [0, 1, 0], transition: reduce ? instant : { duration: 0.9, delay: delay + 0.42, times: [0, 0.4, 1], ease: "easeOut" } },
  };
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag
      className={`rsc-card relative ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      {...(snakeTarget ? { "data-snake-target": "" } : {})}
    >
      <style href="rs-candle-card" precedence="default">
        {CARD_CSS}
      </style>
      <motion.span aria-hidden="true" variants={wick} className="pointer-events-none absolute bottom-full left-1/2 z-10 h-6 w-px origin-bottom bg-[linear-gradient(0deg,#00E676,rgba(0,230,118,0))]" />
      <motion.div variants={body} className="relative h-full">
        {children}
        <HoverCandles up={index % 2 === 0} />
      </motion.div>
    </Tag>
  );
}

/* ------------------------------------------------------------ spark burst */

const TEXT_ENTRY = 'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea,select,option,[contenteditable],[data-no-burst]';
/** Controls the home page's ClickBurst deliberately skips — this burst covers exactly those, so no click bursts twice. */
const CONTROLS = 'a,button,label,summary,[role=button],[role=option],[role=tab],[role=link],[role=switch],[role=checkbox],[role=radio],[role=menuitem],[tabindex]:not([tabindex="-1"])';
const POOL = 30;
const PER = 10;
const GAP_MS = 220;
const DUR = 650;

/**
 * The home page's candle firework on buttons, links and other controls — the
 * home ClickBurst (mounted by PlatformShell) handles plain surface, so
 * together every click sparkles once. Text entry is left alone.
 * Ten mini green/red candles fly out of the point with a touch of gravity and
 * fade. Pooled nodes, WAAPI transform/opacity only. Keyboard clicks burst from
 * the control's centre. Listens on its parent in the capture phase.
 */
export function SparkBurst() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const host = layer?.parentElement;
    if (!layer || !host) return;
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const nodes: HTMLSpanElement[] = [];
    for (let i = 0; i < POOL; i++) {
      const c = document.createElement("span");
      c.className = "rsb-c";
      if (i % 2 === 0) c.setAttribute("data-up", "");
      c.innerHTML = '<i class="rsb-w"></i><i class="rsb-b"></i>';
      layer.appendChild(c);
      nodes.push(c);
    }
    let cursor = 0;
    let lastAt = -1e9;

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || mq?.matches) return;
      const t = e.target as Element | null;
      if (!t || t.closest(TEXT_ENTRY) || !t.closest(CONTROLS)) return;
      if (window.getSelection?.()?.toString()) return;
      const now = performance.now();
      if (now - lastAt < GAP_MS) return;
      lastAt = now;
      let x = e.clientX;
      let y = e.clientY;
      if (e.detail === 0) {
        const r = t.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      const spin = Math.random() * Math.PI * 2;
      for (let i = 0; i < PER; i++) {
        const n = nodes[cursor];
        cursor = (cursor + 1) % POOL;
        const a = spin + (i / PER) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const r = 46 + Math.random() * 34;
        const dx = Math.cos(a) * r;
        const dy = Math.sin(a) * r;
        const g = 26 + Math.random() * 10;
        const rot = (a * 180) / Math.PI + 90;
        const s = 0.75 + Math.random() * 0.45;
        n.getAnimations().forEach((an) => an.cancel());
        const at = (k: number, op: number) => ({
          transform: `translate(${(x + dx * k).toFixed(1)}px,${(y + dy * k + g * k * k).toFixed(1)}px) rotate(${(rot + 40 * k).toFixed(0)}deg) scale(${(s * (1 - 0.35 * k)).toFixed(2)})`,
          opacity: op,
        });
        n.animate([{ ...at(0, 0), offset: 0 }, { ...at(0.12, 1), offset: 0.08 }, { ...at(0.62, 1), offset: 0.45 }, { ...at(1, 0), offset: 1 }], {
          duration: DUR + Math.random() * 80,
          easing: "cubic-bezier(.2,.7,.35,1)",
          fill: "both",
        });
      }
    };

    host.addEventListener("click", onClick, true);
    return () => {
      host.removeEventListener("click", onClick, true);
      nodes.forEach((n) => n.remove());
    };
  }, []);

  return (
    <>
      <style href="rs-spark-burst" precedence="default">
        {[
          ".rsb-layer{position:fixed;inset:0;overflow:clip;pointer-events:none;z-index:130;contain:strict}",
          ".rsb-c{position:absolute;left:0;top:0;width:6px;height:16px;margin:-8px 0 0 -3px;opacity:0;will-change:transform,opacity;--k:#FF3B3B}",
          ".rsb-c[data-up]{--k:#00E676}",
          ".rsb-w{position:absolute;left:2.5px;top:0;width:1px;height:16px;background:var(--k);opacity:.7}",
          ".rsb-b{position:absolute;left:0;top:4px;width:6px;height:8px;border-radius:1px;background:var(--k);box-shadow:0 0 6px var(--k)}",
          "@media (prefers-reduced-motion:reduce){.rsb-layer{display:none}}",
        ].join("")}
      </style>
      <div ref={layerRef} className="rsb-layer" aria-hidden="true" />
    </>
  );
}
