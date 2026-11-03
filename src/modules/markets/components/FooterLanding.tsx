"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { FooterLandingCandles } from "./FooterLandingCandles";
import { FooterLandingEarth } from "./FooterLandingEarth";
import { SignatureMark } from "@/platform/ui/SignatureMark";
import "./footer-landing.css";

/* The page's last beat: a dark landing pad under the footer. As it scrolls in,
 * the navbar's AFVAR logo seems to lift off the bar and fly down (mark and
 * wordmark on their own arcs) to land centre stage, then the headline, subline
 * and CTAs reveal in turn. Candles (left/right) and the earth horizon are their
 * own components. Scroll back up and it all flies home.
 *
 * Built for smoothness, not tricks: there is no clone and no hand-off. The two
 * landed images (mark + wordmark) ARE the flying logo: each frame gives them a
 * transform that, at progress 0, puts them exactly over the navbar logo and, at
 * progress 1, is the identity. Layout is read only on mount/resize (cached in
 * page coordinates); each frame reads scrollY, eases a damped progress toward
 * it in one rAF loop and writes transform/opacity on two small images that
 * keep their own compositor layers permanently. Data attributes flip only when
 * a threshold is crossed; React never re-renders while scrolling. */

/** Headline words; `g` marks the brand-gradient ones. */
const HEADLINE = [
  { w: "Your" },
  { w: "AI", g: true },
  { w: "Trading", g: true },
  { w: "Operating" },
  { w: "System" },
] as const;

/** The launch-queue section on the home page (second CTA's target). */
const QUEUE_ID = "launch-queue";

const WORDMARK = "/afvar-signature/golden-reveal/afvar-wordmark-dock.webp";

/** Scroll progress through the section where the flight starts and touches down. */
const LIFT = 0.04;
const LAND = 0.9;
/** Share of the remaining distance the damped progress covers per 60 Hz frame. */
const FOLLOW = 0.18;

type Box = { x: number; y: number; w: number; h: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const bez = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

function rectOf(el: Element | null): Box | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
}

/** Where the nav logo sits (fixed bar, so viewport coordinates). Falls back to the bar's top-left corner when it's hidden. */
function navBoxes(): { mark: Box; word: Box } {
  const brand = document.querySelector("header .afvar-header-brand");
  const mark = rectOf(brand?.querySelector(".afvar-header-symbol") ?? null);
  const word = rectOf(brand?.querySelector(".afvar-header-name") ?? null);
  const phone = window.innerWidth <= 600;
  const m = phone ? 32 : 46;
  const left = phone ? 16 : 40;
  return {
    mark: mark ?? { x: left, y: 36 - m / 2, w: m, h: m },
    word: word ?? { x: left + m + 12, y: 36 - (m * 0.72) / 2, w: m * 4.9, h: m * 0.72 },
  };
}

function reducedMotion() {
  return (
    document.documentElement.dataset.reduceMotion === "true" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Word-by-word masked reveal; "AI Trading" carries the brand gradient plus a light band that sweeps across it now and then. */
function Headline() {
  const word = (w: string, i: number, grad = false) => (
    <span key={w} className="fl-w" style={{ "--w": i } as CSSProperties}>
      <span className={grad ? "fl-w-in fl-grad" : "fl-w-in"}>{w}</span>
    </span>
  );
  const [lead, ai, trading, ...rest] = HEADLINE;
  return (
    <>
      {word(lead.w, 0)}{" "}
      <span className="fl-grad-group">
        {word(ai.w, 1, true)} {word(trading.w, 2, true)}
      </span>{" "}
      {rest.map((h, i) => (
        <span key={h.w}>
          {word(h.w, i + 3)}
          {i < rest.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

/** On the home page it glides to the launch queue; elsewhere it navigates to /#launch-queue. */
function QueueLink() {
  const pathname = usePathname();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const target = document.getElementById(QUEUE_ID);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    history.replaceState(history.state, "", `#${QUEUE_ID}`);
  };
  return (
    <Link href={`/#${QUEUE_ID}`} onClick={onClick} className="fl-cta fl-cta-ghost">
      <span className="fl-cta-glow" aria-hidden="true" />
      <span className="fl-cta-label">
        <QueueIcon />
        See the launch queue
      </span>
    </Link>
  );
}

function TrendIcon() {
  return (
    <svg className="fl-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg className="fl-ico fl-ico-arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
/** A queue: three rows, the first one ticked. */
function QueueIcon() {
  return (
    <svg className="fl-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 6.5l1.6 1.6L8 5.2" />
      <path d="M11 6.5h9.5M5 12h.01M11 12h9.5M5 17.5h.01M11 17.5h9.5" />
    </svg>
  );
}

/** Translate/rotate/scale that moves an element whose natural box is `to` (viewport) so it appears along the arc from `from`. */
function arc(from: Box, to: Box, e: number, bank: number, sag: number, spin: number) {
  const x0 = from.x + from.w / 2, y0 = from.y + from.h / 2;
  const x1 = to.x + to.w / 2, y1 = to.y + to.h / 2;
  const x = bez(x0, x1 + bank, x1, e);
  const y = bez(y0, y0 + (y1 - y0) * sag, y1, e);
  const s = (from.w / to.w) ** (1 - e);
  const r = Math.sin(Math.PI * e) * spin;
  return `translate3d(${(x - x1).toFixed(2)}px, ${(y - y1).toFixed(2)}px, 0) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
}

export function FooterLanding() {
  const root = useRef<HTMLElement>(null);
  const markImg = useRef<HTMLSpanElement>(null);
  const wordImg = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const node = root.current;
    const mark = markImg.current;
    const word = wordImg.current;
    if (!node || !mark || !word) return;
    const html = document.documentElement;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Backdrop loops run only while the pad is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) node.dataset.inview = "";
      else delete node.dataset.inview;
    }, { rootMargin: "120px 0px" });
    io.observe(node);

    // Cached geometry (layout is read here only).
    let sec = { top: 0, h: 1 };
    let slotMark: Box = { x: 0, y: 0, w: 1, h: 1 };
    let slotWord: Box = { x: 0, y: 0, w: 1, h: 1 };
    let from = navBoxes();
    let vh = window.innerHeight;
    let vw = window.innerWidth;
    const pageBox = (el: Element): Box => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top + window.scrollY, w: Math.max(1, r.width), h: Math.max(1, r.height) };
    };
    const measure = () => {
      // Full-bleed width without the scrollbar (100vw would include it and scroll sideways).
      node.style.setProperty("--fl-vw", `${html.clientWidth}px`);
      const transforms = [mark.style.transform, word.style.transform];
      mark.style.transform = word.style.transform = "none";
      const r = node.getBoundingClientRect();
      sec = { top: r.top + window.scrollY, h: Math.max(1, r.height) };
      slotMark = pageBox(mark);
      slotWord = pageBox(word);
      [mark.style.transform, word.style.transform] = transforms;
      if (!html.hasAttribute("data-fl-nav-away")) from = navBoxes();
      vh = window.innerHeight;
      vw = window.innerWidth;
    };

    // Threshold flags (written only when they change).
    const flags = { lifted: false, flying: false, landed: false };
    const flag = (key: keyof typeof flags, on: boolean, apply: (on: boolean) => void) => {
      if (flags[key] === on) return;
      flags[key] = on;
      apply(on);
    };
    const setLifted = (on: boolean) =>
      flag("lifted", on, (v) => {
        if (v) {
          from = navBoxes(); // the bar is still fully visible here
          html.dataset.flNavAway = "";
        } else delete html.dataset.flNavAway;
        mark.style.opacity = word.style.opacity = v ? "1" : "0";
      });
    const setFlying = (on: boolean) => flag("flying", on, (v) => (v ? (node.dataset.flFlying = "") : delete node.dataset.flFlying));
    const setLandedFlag = (on: boolean) => flag("landed", on, (v) => (v ? (node.dataset.landed = "") : delete node.dataset.landed));

    const render = (p: number) => {
      const t = clamp01((p - LIFT) / (LAND - LIFT));
      setLifted(t > 0);
      setFlying(t > 0 && t < 1);
      setLandedFlag(t >= 1);
      if (t <= 0 || t >= 1) {
        mark.style.transform = word.style.transform = "";
        return;
      }
      const sy = window.scrollY;
      const toWord = { ...slotWord, y: slotWord.y - sy };
      const toMark = { ...slotMark, y: slotMark.y - sy };
      // Wordmark banks out to the right; the mark leaves a beat later and arcs out to the left.
      word.style.transform = arc(from.word, toWord, easeInOut(t), vw * 0.16, 0.2, 3);
      mark.style.transform = arc(from.mark, toMark, easeInOut(clamp01(t * 1.12 - 0.12)), -vw * 0.2, 0.55, -24);
    };

    let reduce = false;
    let cur = -1;
    let raf = 0;
    let lastT = 0;
    const goal = () => (window.scrollY + vh - sec.top) / sec.h;
    const tick = (now: number) => {
      raf = 0;
      const g = goal();
      const dt = lastT ? Math.min(64, now - lastT) : 16.7;
      lastT = now;
      cur = cur < 0 ? g : cur + (g - cur) * (1 - (1 - FOLLOW) ** (dt / 16.7));
      const settled = Math.abs(g - cur) < 0.0005;
      if (settled) cur = g;
      render(cur);
      if (settled) lastT = 0;
      else raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!reduce && !raf) raf = requestAnimationFrame(tick);
    };
    const snap = () => {
      if (reduce) return;
      cur = goal();
      render(cur);
    };

    const setMode = () => {
      reduce = html.dataset.reduceMotion === "true" || mq.matches;
      node.dataset.mode = reduce ? "still" : "fly";
      if (!reduce) mark.style.opacity = word.style.opacity = flags.lifted ? "1" : "0";
      if (reduce) {
        // Still: the landed logo, nothing travels.
        render(1);
        setLifted(false);
        mark.style.opacity = word.style.opacity = "";
      }
    };

    let remeasure = 0;
    const onResize = () => {
      if (remeasure) return;
      remeasure = requestAnimationFrame(() => {
        remeasure = 0;
        measure();
        snap();
      });
    };
    const onMotion = () => {
      setMode();
      snap();
    };

    measure();
    setMode();
    snap();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // Content above can change height (lazy sections, fonts): re-measure then, never per frame.
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    ro.observe(node);
    mq.addEventListener("change", onMotion);
    const mo = new MutationObserver(onMotion);
    mo.observe(html, { attributes: true, attributeFilter: ["data-reduce-motion"] });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (remeasure) cancelAnimationFrame(remeasure);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener("change", onMotion);
      mo.disconnect();
      delete html.dataset.flNavAway;
      delete node.dataset.mode;
      delete node.dataset.flFlying;
      delete node.dataset.landed;
    };
  }, []);

  return (
    <section ref={root} className="fl-root" aria-labelledby="fl-title">
      <div className="fl-bg" aria-hidden="true">
        <div className="fl-vignette" />
        <div className="fl-grid" />
        <div className="fl-stars" />
        <div className="fl-stars fl-stars-far" />
      </div>
      <div className="fl-backdrop" aria-hidden="true">
        <FooterLandingCandles side="left" />
        <FooterLandingCandles side="right" />
        <FooterLandingEarth />
      </div>
      <div className="fl-stage">
        <div className="fl-lockup" aria-hidden="true">
          <div className="fl-mark">
            <span className="fl-mark-halo" />
            <span className="fl-mark-ring" />
            <span className="fl-mark-float">
              {/* The navbar's own bull (same SignatureMark component, with its live face). */}
              <span ref={markImg} className="fl-fly fl-fly-mark">
                <SignatureMark />
              </span>
            </span>
          </div>
          <div className="fl-word">
            <Image ref={wordImg} className="fl-fly fl-fly-word" src={WORDMARK} alt="" width={1009} height={150} unoptimized priority={false} loading="eager" draggable={false} />
          </div>
        </div>
        <h2 id="fl-title" className="fl-title">
          <span className="fl-sr">AFVAR — </span>
          <Headline />
        </h2>
        <p className="fl-sub">
          Market analysis, intelligent insights and education — all in one powerful platform.
        </p>
        <div className="fl-ctas">
          <span className="fl-cta-slot" style={{ "--d": 0 } as CSSProperties}>
            <Link href="/platform" className="fl-cta fl-cta-primary">
              <span className="fl-cta-beam" aria-hidden="true"><span /></span>
              <span className="fl-cta-fill" aria-hidden="true">
                <span className="fl-cta-shine" />
              </span>
              <span className="fl-cta-label">
                <TrendIcon />
                Explore Platform
                <ArrowIcon />
              </span>
            </Link>
          </span>
          <span className="fl-cta-slot" style={{ "--d": 1 } as CSSProperties}>
            <QueueLink />
          </span>
        </div>
      </div>
    </section>
  );
}
