"use client";

// Phone hero (< 640 px, root homepage). Rendered first inside MobileStory.
//
//   intro   after the splash has gone: a green line sweeps across, the grid
//           boots row by row, the headline rises out of per-character masks,
//           the sub copy and CTAs follow, the live chart draws itself and the
//           last price rolls in on an odometer.
//   live    the chart is real (useLiveMarket candles for Gold, else the first
//           lane with data); a finger dragged over it shows a crosshair with the
//           price (and time when the feed has one); a spotlight follows touch.
//   exit    scrubbed by scroll: the headline grows and fades, the chart lags
//           behind, the grid tilts back, the "Today" tape speeds up with
//           scroll velocity.
//
// Motion is transform / opacity / clip-path / stroke only. One rAF loop (the
// tape), running only while the hero is on screen. Reduced motion shows the
// final frame with nothing moving.
import { motion, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { MONO, afterSplash, useAfvarReducedMotion } from "@/modules/afvarOs";
import { fmtPrice, type HomeQuote } from "@/modules/home/kit";
import { REGISTER_HREF } from "../ui";
import { LANE_KEYS, LiveClock, quoteLine, type Quotes } from "./cards";
import "./mobile-hero.css";

type Intro = "wait" | "play" | "done";

const TITLE: { text: string; soft: boolean }[] = [
  { text: "The trading OS", soft: false },
  { text: "that never stops thinking.", soft: true },
];
const TITLE_TEXT = TITLE.map((t) => t.text).join(" ");
/** Words of the title with each character's running index (for the stagger). */
const TITLE_WORDS = (() => {
  let i = 0;
  return TITLE.map((part) => ({
    soft: part.soft,
    words: part.text.split(" ").map((w) => [...w].map((ch) => ({ ch, i: i++ }))),
  }));
})();
const SUB = "One AI that reads commodities, forex and crypto every millisecond, around the clock. It explains. It never trades.";
const GRID_ROWS = 16;
/** Longest intro animation end (ms) — then the intro attributes are dropped. */
const INTRO_MS = 2900;

/** OS or site reduced-motion; false until hydrated, so server and client markup match. */
function useCalm(): boolean {
  return useAfvarReducedMotion();
}

/* ----------------------------------------------------------------- data */

interface Pt {
  c: number;
  o: number | null;
  h: number | null;
  l: number | null;
  t: number | null;
}

function pickQuote(quotes: Quotes): { q: HomeQuote; sym: string } | null {
  // Gold first (LANE_KEYS[0]), else the first lane with data.
  for (const [k, sym] of LANE_KEYS) {
    const q = quotes[k];
    if (q && (q.candles.length >= 10 || q.closes.length >= 4)) return { q, sym };
  }
  return null;
}

function seriesOf(q: HomeQuote): Pt[] {
  if (q.candles.length >= 10) return q.candles.map((k) => ({ c: k.c, o: k.o, h: k.h, l: k.l, t: k.t }));
  return q.closes.map((c) => ({ c, o: null, h: null, l: null, t: null }));
}

const VW = 600;
const VH = 200;
const PAD_T = 14;
const PAD_B = 18;

function geometry(pts: Pt[]) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of pts) {
    lo = Math.min(lo, p.l ?? p.c, p.c);
    hi = Math.max(hi, p.h ?? p.c, p.c);
  }
  if (!Number.isFinite(lo) || hi - lo === 0) {
    lo -= 1;
    hi += 1;
  }
  const n = pts.length;
  const x = (i: number) => (n <= 1 ? VW : (i / (n - 1)) * VW);
  const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * (VH - PAD_T - PAD_B);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.c).toFixed(1)}`).join(" ");
  const area = `${line} L${VW} ${VH} L0 ${VH} Z`;
  return { x, y, line, area, n, lo, hi };
}

const pad2 = (n: number) => String(n).padStart(2, "0");
function hhmm(t: number): string {
  const d = new Date(t);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/* ------------------------------------------------------------- odometer */

/** Rolling-digit price: each digit is a 0–9 strip moved by transform. */
function Odometer({ text }: { text: string }) {
  const chars = [...text];
  return (
    <span className="mh-odo" aria-label={text} role="text">
      {chars.map((ch, i) => {
        const fromRight = chars.length - i;
        if (ch < "0" || ch > "9") {
          return (
            <span key={`s${fromRight}`} className="mh-odo-sep" aria-hidden="true">
              {ch}
            </span>
          );
        }
        return (
          <span key={`d${fromRight}`} className="mh-odo-d" aria-hidden="true" style={{ ["--d" as string]: Number(ch), ["--k" as string]: i } as CSSProperties}>
            <span className="mh-odo-strip">
              {"0123456789".split("").map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* ---------------------------------------------------------------- chart */

function HeroChart({ q, sym, intro }: { q: HomeQuote; sym: string; intro: Intro }) {
  const pts = seriesOf(q);
  const g = geometry(pts);
  const last = pts[pts.length - 1];
  const up = q.changePct >= 0;
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const pick = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setHover(Math.round(f * (g.n - 1)));
  };
  const leave = () => setHover(null);

  const hp = hover === null ? null : pts[hover];
  const hx = hover === null ? 0 : (g.x(hover) / VW) * 100;
  const hy = hp ? (g.y(hp.c) / VH) * 100 : 0;
  const lx = (g.x(g.n - 1) / VW) * 100;
  const ly = (g.y(last.c) / VH) * 100;
  const step = g.n > 1 ? VW / (g.n - 1) : VW;
  const bw = Math.max(1.5, step * 0.46);
  const pctText = quoteLine(q, sym).split(" ").pop() ?? "";

  return (
    <>
      <div className="mh-quote">
        <span className={`mh-sym ${MONO}`}>{sym}</span>
        <span className="mh-price" data-dir={q.dir}>
          <Odometer text={fmtPrice(q.last, q.decimals)} />
          {/* remounts on every new price → one green / red flash */}
          <span key={`${q.last}-${q.asOf ?? 0}`} className="mh-flash" data-dir={q.dir} aria-hidden="true" />
        </span>
        <span className={`mh-pct ${up ? "mh-up" : "mh-down"}`}>{pctText}</span>
      </div>
      <div
        ref={box}
        className="mh-chart"
        data-touch={hover !== null}
        onPointerDown={pick}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || hover !== null || e.buttons) pick(e);
        }}
        onPointerUp={leave}
        onPointerCancel={leave}
        onPointerLeave={leave}
        aria-hidden="true"
      >
        <svg className="mh-svg" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="mh-area-g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#00E676" stopOpacity="0.24" />
              <stop offset="1" stopColor="#00E676" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="mh-candles">
            {pts.map((p, i) =>
              p.o === null || p.h === null || p.l === null ? null : (
                <g key={i} className={p.c >= p.o ? "mh-c-up" : "mh-c-down"}>
                  <line x1={g.x(i)} x2={g.x(i)} y1={g.y(p.h)} y2={g.y(p.l)} vectorEffect="non-scaling-stroke" />
                  <rect x={g.x(i) - bw / 2} width={bw} y={Math.min(g.y(p.o), g.y(p.c))} height={Math.max(1, Math.abs(g.y(p.o) - g.y(p.c)))} />
                </g>
              ),
            )}
          </g>
          <path className="mh-area" d={g.area} fill="url(#mh-area-g)" />
          <path className="mh-line" d={g.line} vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="mh-lvl mh-lvl-hi">{fmtPrice(g.hi, q.decimals)}</span>
        <span className="mh-lvl mh-lvl-lo">{fmtPrice(g.lo, q.decimals)}</span>
        <span className="mh-dot" style={{ left: `${lx}%`, top: `${ly}%` }} />
        {hp ? (
          <>
            <span className="mh-x-v" style={{ left: `${hx}%` }} />
            <span className="mh-x-h" style={{ top: `${hy}%` }} />
            <span className="mh-x-pt" style={{ left: `${hx}%`, top: `${hy}%` }} />
            <span className={`mh-tip ${MONO}`} data-side={hx > 58 ? "l" : "r"} style={{ left: `${hx}%`, top: `${hy}%` }}>
              {fmtPrice(hp.c, q.decimals)}
              {hp.t !== null ? <em>{hhmm(hp.t)}</em> : null}
            </span>
          </>
        ) : null}
        {intro === "wait" ? null : <span className="mh-sweep" />}
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- tape */

function Tape({ quotes, moveRef }: { quotes: Quotes; moveRef: RefObject<HTMLDivElement | null> }) {
  const items = LANE_KEYS.map(([k, sym]) => {
    const q = quotes[k];
    return { k, text: quoteLine(q, sym), tone: !q ? "" : q.changePct >= 0 ? "mh-up" : "mh-down" };
  });
  const row = (hidden: boolean) => (
    <ul className="mh-tape-row" aria-hidden={hidden || undefined}>
      {items.map((it) => (
        <li key={it.k} className={it.tone}>
          {it.text}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="mh-tape" aria-label="Today">
      <span className={`mh-tape-label ${MONO}`}>Today</span>
      <div className="mh-tape-track">
        <div ref={moveRef} className="mh-tape-move">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- hero */

export function MobileHero({ quotes, revealRef }: { quotes: Quotes; revealRef: RefObject<HTMLDivElement | null> }) {
  const calm = useCalm();
  const root = useRef<HTMLElement>(null);
  const tapeMove = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Intro>("wait");
  const [onScreen, setOnScreen] = useState(true);
  const intro: Intro = calm ? "done" : phase;

  // Intro starts once the splash is gone; its attributes drop when it ends.
  useEffect(() => {
    if (calm) return;
    let raf = 0;
    let t = 0;
    const cancel = afterSplash(() => {
      raf = requestAnimationFrame(() => {
        setPhase("play");
        t = window.setTimeout(() => setPhase("done"), INTRO_MS);
      });
    });
    return () => {
      cancel();
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [calm]);

  // Off screen → everything pauses (CSS via data-live, the tape loop stops).
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* scroll-scrubbed exit */
  const { scrollYProgress, scrollY } = useScroll({ target: root, offset: ["start start", "end start"] });
  const headScale = useTransform(scrollYProgress, [0, 0.7], calm ? [1, 1] : [1, 1.08]);
  const headFade = useTransform(scrollYProgress, [0.05, 0.7], calm ? [1, 1] : [1, 0]);
  const chartY = useTransform(scrollYProgress, [0, 1], calm ? [0, 0] : [0, 140]);
  const chartFade = useTransform(scrollYProgress, [0.2, 0.85], calm ? [1, 1] : [1, 0.2]);
  const gridTilt = useTransform(scrollYProgress, [0, 0.8], calm ? [0, 0] : [0, 12]);
  const velocity = useVelocity(scrollY);
  const boost = useSpring(velocity, { stiffness: 120, damping: 30, mass: 0.6 });

  /* touch spotlight + Android tilt */
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const sx = useSpring(spotX, { stiffness: 260, damping: 32 });
  const sy = useSpring(spotY, { stiffness: 260, damping: 32 });
  const [lit, setLit] = useState(false);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const tx = useSpring(tiltX, { stiffness: 60, damping: 18 });
  const ty = useSpring(tiltY, { stiffness: 60, damping: 18 });
  const gridX = useTransform(tx, (v) => v * -0.5);
  const gridY = useTransform(ty, (v) => v * -0.5);

  const spot = (e: ReactPointerEvent<HTMLElement>) => {
    if (calm) return;
    const r = e.currentTarget.getBoundingClientRect();
    spotX.set(e.clientX - r.left);
    spotY.set(e.clientY - r.top);
    if (!lit) {
      sx.jump(e.clientX - r.left);
      sy.jump(e.clientY - r.top);
      setLit(true);
    }
  };

  // Device tilt: Android only, where no permission prompt exists. Never asks.
  useEffect(() => {
    if (calm || !onScreen) return;
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent;
    if (!DOE || typeof DOE.requestPermission === "function" || !/Android/i.test(navigator.userAgent)) return;
    let base: { b: number; g: number } | null = null;
    const on = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      if (!base) base = { b: e.beta, g: e.gamma };
      const clamp = (v: number) => Math.max(-14, Math.min(14, v));
      tiltX.set(clamp(e.gamma - base.g) * 0.7);
      tiltY.set(clamp(e.beta - base.b) * 0.5);
    };
    window.addEventListener("deviceorientation", on);
    return () => window.removeEventListener("deviceorientation", on);
  }, [calm, onScreen, tiltX, tiltY]);

  // The one rAF: the "Today" tape, faster while the page is being scrolled.
  useEffect(() => {
    const el = tapeMove.current;
    if (calm || !onScreen || !el) return;
    let half = el.scrollWidth / 2;
    const ro = new ResizeObserver(() => (half = el.scrollWidth / 2));
    ro.observe(el);
    let x = Number(el.dataset.x ?? 0);
    let prev = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const speed = 38 + Math.min(1400, Math.abs(boost.get()) * 0.9);
      x -= speed * dt;
      if (half > 0 && -x >= half) x += half;
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      el.dataset.x = String(x);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [calm, onScreen, boost]);

  const pick = pickQuote(quotes);

  return (
    <header
      ref={root}
      className="mh-root"
      data-intro={intro}
      data-live={onScreen}
      onPointerDown={spot}
      onPointerMove={(e) => {
        if (lit || e.pointerType !== "mouse") spot(e);
      }}
      onPointerUp={() => setLit(false)}
      onPointerCancel={() => setLit(false)}
      onPointerLeave={() => setLit(false)}
    >
      <noscript>
        <style>{".mh-root[data-intro] *{animation:none!important;opacity:1!important;transform:none!important;clip-path:none!important}.mh-root[data-intro] .mh-odo-strip{transform:translateY(calc(var(--d) * -10%))!important}"}</style>
      </noscript>

      {/* background: grid (boots in, tilts on exit), scanline, spotlight */}
      <div className="mh-bg" aria-hidden="true">
        <motion.div className="mh-grid" style={{ rotateX: gridTilt, x: gridX, y: gridY, transformPerspective: 700 }}>
          <div className="mh-grid-drift">
            {Array.from({ length: GRID_ROWS }, (_, r) => (
              <span key={r} className="mh-grid-row" style={{ ["--r" as string]: r } as CSSProperties} />
            ))}
          </div>
        </motion.div>
        <span className="mh-scan" />
        <motion.span className="mh-spot" data-on={lit} style={{ x: sx, y: sy }} />
      </div>

      <motion.div className="mh-stage" style={{ y: chartY, opacity: chartFade, x: tx }}>
        {pick ? <HeroChart q={pick.q} sym={pick.sym} intro={intro} /> : null}
      </motion.div>

      <div ref={revealRef} className="mh-copy home-chapter-prose">
        <p className={`mh-eyebrow ${MONO} text-[#A8DEC2]`}>Pre-launch · AFVAR AI</p>
        <motion.div className="mh-head" style={{ scale: headScale, opacity: headFade }}>
          <h1 className="mh-title" aria-label={TITLE_TEXT}>
            {TITLE_WORDS.map((part, pi) => (
              <span key={pi} className={part.soft ? "mh-soft" : undefined} aria-hidden="true">
                {part.words.map((word, wi) => (
                  <span key={wi}>
                    <span className="mh-w">
                      {word.map(({ ch, i }) => (
                        <span key={i} className="mh-c" style={{ ["--i" as string]: i } as CSSProperties}>
                          {ch}
                        </span>
                      ))}
                    </span>
                    {wi < part.words.length - 1 || pi < TITLE_WORDS.length - 1 ? " " : null}
                  </span>
                ))}
              </span>
            ))}
          </h1>
        </motion.div>
        <p className="mh-sub">{SUB}</p>
        <div className="mh-actions home-story-actions">
          <Link href={REGISTER_HREF} prefetch={false} className="mh-cta mh-cta-main">
            <span className="mh-beam" aria-hidden="true" />
            <span className="mh-cta-label">Register Now</span>
          </Link>
          <Link href="/platform" className="mh-cta mh-cta-ghost">
            <span className="mh-cta-label">Explore the platform</span>
          </Link>
        </div>
        <div className="mh-stats home-hero-stats">
          <LiveClock />
          <span className={`${MONO} text-[#92A399]`}>24 / 7 / 365</span>
          <span className={`${MONO} text-[#92A399]`}>0 order buttons</span>
        </div>
      </div>

      <Tape quotes={quotes} moveRef={tapeMove} />
    </header>
  );
}
