"use client";

import Image from "next/image";
import { useScroll } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { SignatureMark } from "@/platform/ui/SignatureMark";
import "./footer-landing.css";

/* The page's last beat: a dark landing pad under the footer. As it scrolls in,
 * a copy of the navbar's AFVAR logo lifts off the bar (the original stays put), flies down a curved path (mark and
 * wordmark on their own arcs) and grows into a huge spaced-out wordmark that
 * lands centre stage. FLIP: one fixed clone, driven by scroll progress with
 * transforms only, measured between the nav logo's rect and the landing slot's
 * rect; at touchdown it hands off to the static copy, which then scrolls
 * naturally and plays the lock-in (letters flash in turn, glow sweep, mark
 * pulse, horizon line). Scroll back up and it all flies home. */

const WORDMARK = "/afvar-signature/golden-reveal/afvar-wordmark-dock.webp";

/** Letter cuts through the wordmark image, in % of its width: [top-left, bottom-left, top-right, bottom-right]. Diagonal where V/A/R lean into each other. */
const LETTERS = [
  [0, 0, 23.2, 23.2],
  [23.2, 23.2, 42.6, 42.6],
  [42.6, 42.6, 66.4, 59.5],
  [66.4, 59.5, 79.8, 84.7],
  [79.8, 84.7, 100, 100],
] as const;
/** Extra space between landed letters, in % of the wordmark image width (keep in sync with --fl-gap in the CSS). */
const GAP = 7;

const clip = ([tl, bl, tr, br]: readonly number[]) =>
  `polygon(${tl}% -20%, ${tr}% -20%, ${br}% 120%, ${bl}% 120%)`;

/** Scroll progress through the section where the flight starts and touches down. */
const LIFT = 0.04;
const LAND = 0.9;

type Box = { x: number; y: number; w: number; h: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smooth = (t: number) => t * t * (3 - 2 * t);
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

const noop = () => () => {};

/** The navbar's own bull mark, same component (with its live blinking face), at the footer's size. */
function MarkImg() {
  return <SignatureMark />;
}

function Letters({ flash }: { flash: boolean }) {
  return LETTERS.map((cut, i) => (
    <span
      key={i}
      className="fl-letter"
      style={{ "--i": i, clipPath: clip(cut) } as CSSProperties}
    >
      <Image src={WORDMARK} alt="" width={1009} height={150} unoptimized draggable={false} />
      {flash && (
        <>
          <span className="fl-flash" />
          <span className="fl-sweep-wrap">
            <span className="fl-sweep" />
          </span>
        </>
      )}
    </span>
  ));
}

export function FooterLanding() {
  const root = useRef<HTMLElement>(null);
  const slotMark = useRef<HTMLDivElement>(null);
  const slotWord = useRef<HTMLDivElement>(null);
  const clone = useRef<HTMLDivElement>(null);
  const cMark = useRef<HTMLDivElement>(null);
  const cWord = useRef<HTMLDivElement>(null);
  const cTrail = useRef<HTMLSpanElement>(null);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const { scrollYProgress } = useScroll({ target: root, offset: ["start end", "end end"] });

  // Stars drift only while the pad is on screen.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) node.dataset.inview = "";
      else delete node.dataset.inview;
    }, { rootMargin: "120px 0px" });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // The flight.
  useEffect(() => {
    const node = root.current;
    const fly = clone.current;
    const flyMark = cMark.current;
    const flyWord = cWord.current;
    const trail = cTrail.current;
    if (!node || !fly || !flyMark || !flyWord || !trail || !hydrated) return;
    const letters = Array.from(flyWord.querySelectorAll<HTMLElement>(".fl-letter"));
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let active = false;
    let landed = false;
    let reduce = reducedMotion();
    let from = navBoxes();

    const place = (el: HTMLElement, b: Box) => {
      el.style.left = `${b.x}px`;
      el.style.top = `${b.y}px`;
      el.style.width = `${b.w}px`;
      el.style.height = `${b.h}px`;
    };

    const start = () => {
      active = true;
      from = navBoxes();
      place(flyMark, from.mark);
      place(flyWord, from.word);
      fly.style.visibility = "visible";
    };

    const setLanded = (on: boolean) => {
      if (on === landed) return;
      landed = on;
      if (on) node.dataset.landed = "";
      else delete node.dataset.landed;
    };

    const stop = () => {
      active = false;
      fly.style.visibility = "hidden";
      setLanded(false);
    };

    const setMode = () => {
      reduce = reducedMotion();
      if (reduce) {
        node.dataset.mode = "still";
        stop();
      } else {
        node.dataset.mode = "fly";
      }
    };

    const update = (p: number) => {
      if (reduce) return;
      const t = clamp01((p - LIFT) / (LAND - LIFT));
      if (t <= 0) {
        if (active) stop();
        return;
      }
      if (!active) start();
      if (t >= 1) {
        // Touchdown: the static copy takes over and scrolls with the page.
        fly.style.visibility = "hidden";
        setLanded(true);
        return;
      }
      fly.style.visibility = "visible";
      setLanded(false);

      const toWord = rectOf(slotWord.current);
      const toMark = rectOf(slotMark.current);
      if (!toWord || !toMark) return;
      const vw = window.innerWidth;

      // Wordmark: banks out to the right, then glides in to centre stage.
      const e = easeInOut(t);
      const w0x = from.word.x + from.word.w / 2, w0y = from.word.y + from.word.h / 2;
      const w1x = toWord.x + toWord.w / 2, w1y = toWord.y + toWord.h / 2;
      const wx = bez(w0x, w1x + vw * 0.16, w1x, e);
      const wy = bez(w0y, w0y + (w1y - w0y) * 0.2, w1y, e);
      const ws = (toWord.w / from.word.w) ** e;
      const wr = Math.sin(Math.PI * e) * 3;
      flyWord.style.transform = `translate3d(${wx - w0x}px, ${wy - w0y}px, 0) rotate(${wr}deg) scale(${ws})`;

      // Letters spread apart one by one on the final approach.
      letters.forEach((el, i) => {
        const s = smooth(clamp01((t - 0.42 - i * 0.07) / 0.28));
        el.style.transform = `translate3d(${(i - 2) * GAP * s}%, 0, 0)`;
      });
      trail.style.opacity = String(Math.sin(Math.PI * t) * 0.9);

      // Mark: detaches a beat later and arcs out to the left before settling on top.
      const m = easeInOut(clamp01(t * 1.12 - 0.12));
      const m0x = from.mark.x + from.mark.w / 2, m0y = from.mark.y + from.mark.h / 2;
      const m1x = toMark.x + toMark.w / 2, m1y = toMark.y + toMark.h / 2;
      const mx = bez(m0x, m1x - vw * 0.2, m1x, m);
      const my = bez(m0y, m0y + (m1y - m0y) * 0.55, m1y, m);
      const ms = (toMark.w / from.mark.w) ** m;
      const mr = Math.sin(Math.PI * m) * -24;
      flyMark.style.transform = `translate3d(${mx - m0x}px, ${my - m0y}px, 0) rotate(${mr}deg) scale(${ms})`;
    };

    const onResize = () => {
      if (!active) return;
      from = navBoxes();
      place(flyMark, from.mark);
      place(flyWord, from.word);
      update(scrollYProgress.get());
    };
    const onMotion = () => {
      setMode();
      update(scrollYProgress.get());
    };

    setMode();
    update(scrollYProgress.get());
    const off = scrollYProgress.on("change", update);
    window.addEventListener("resize", onResize, { passive: true });
    mq.addEventListener("change", onMotion);
    const mo = new MutationObserver(onMotion);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduce-motion"] });
    return () => {
      off();
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", onMotion);
      mo.disconnect();
      stop();
      delete node.dataset.mode;
    };
  }, [hydrated, scrollYProgress]);

  return (
    <section ref={root} className="fl-root" aria-hidden="true">
      <div className="fl-stars" />
      <div className="fl-stars fl-stars-far" />
      <div className="fl-floor" />
      <div className="fl-glow" />
      <div className="fl-stage">
        <div ref={slotMark} className="fl-mark">
          <span className="fl-mark-ring" />
          <span className="fl-mark-body">
            <MarkImg />
          </span>
        </div>
        <div ref={slotWord} className="fl-word">
          <Letters flash />
        </div>
        <span className="fl-horizon" />
      </div>
      {hydrated &&
        createPortal(
          <div ref={clone} className="fl-clone" aria-hidden="true">
            <div ref={cMark} className="fl-clone-mark">
              <MarkImg />
            </div>
            <div ref={cWord} className="fl-clone-word">
              <span ref={cTrail} className="fl-trail" />
              <Letters flash={false} />
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
