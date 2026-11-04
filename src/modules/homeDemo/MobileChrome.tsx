"use client";

// Phone-only (< 640 px) page chrome for the home: backdrop (dotted field,
// scanline, grain, scroll-shifted green aurora), a scroll-progress bar with a
// glowing head that brightens with scroll velocity, hairline section counters
// with odometer digits, block clip-reveal / depth exit, and press feedback
// (scale + ripple) for links and buttons. Purely decorative — no copy: every
// glyph is drawn by CSS. At 640 px and up all of it is display:none /
// display:contents and the listeners stay idle, so the page is unchanged.
import { motion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import "./mobile-page.css";

const PHONE = "(max-width: 639px)";
/** Scroll left (px) over which the progress bar fades out at the page end. */
const FADE_PX = 240;
const REDUCED = "(prefers-reduced-motion: reduce)";
const reducedMotion = () =>
  window.matchMedia(REDUCED).matches || document.documentElement.dataset.reduceMotion === "true";

export function MobilePageChrome() {
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.4 });
  // Full-width bar slid in from the left, so the head on its right end is never stretched.
  const x = useTransform(progress, (v) => `${(v - 1) * 100}%`);
  const speed = useSpring(useTransform(useVelocity(scrollY), (v) => Math.min(1, Math.abs(v) / 2600)), { stiffness: 260, damping: 30 });
  const glow = useTransform(speed, [0, 1], [0.25, 1]);
  const glowScale = useTransform(speed, [0, 1], [0.7, 1.7]);
  // Fade the bar out over the last stretch of the page, so it never runs
  // through the footer's landed logo. Scroll left = total - y, where
  // total = y / progress (no layout reads).
  const barOpacity = useTransform([scrollY, scrollYProgress], ([y, p]: number[]) =>
    p <= 0 ? 1 : Math.min(1, Math.max(0, (y / p - y) / FADE_PX)),
  );
  const root = useRef<HTMLDivElement>(null);
  const ripples = useRef<HTMLDivElement>(null);

  // Arm the entry reveal only on phones with motion allowed; without this
  // attribute every block is simply visible (no-JS / desktop / reduced motion).
  useEffect(() => {
    const scope = root.current?.closest<HTMLElement>(".afvar-responsive-home");
    if (!scope) return;
    const phone = window.matchMedia(PHONE);
    const reduced = window.matchMedia(REDUCED);
    let io: IntersectionObserver | null = null;

    const arm = () => {
      io?.disconnect();
      io = null;
      if (!phone.matches || reducedMotion()) { delete scope.dataset.hmArmed; return; }
      scope.dataset.hmArmed = "";
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.hmIn = "";
          io?.unobserve(e.target);
        }
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.01 });
      scope.querySelectorAll("[data-hm-block]:not([data-hm-in]), [data-hm-mark]:not([data-hm-in])").forEach((el) => io?.observe(el));
    };

    arm();
    phone.addEventListener("change", arm);
    reduced.addEventListener("change", arm);
    return () => {
      io?.disconnect();
      phone.removeEventListener("change", arm);
      reduced.removeEventListener("change", arm);
    };
  }, []);

  // Press feedback: every link/button in the home (not the navbar, not the
  // avatar) scales to .97 and gets a quick ripple from the touch point. The
  // ripple lives in our own fixed layer, clipped to the pressed element's box,
  // so no React-owned node is ever mutated.
  useEffect(() => {
    const scope = root.current?.closest<HTMLElement>(".afvar-responsive-home");
    const layer = ripples.current;
    if (!scope || !layer) return;
    const phone = window.matchMedia(PHONE);
    const android = /Android/i.test(navigator.userAgent);
    let pressed: HTMLElement | null = null;

    let press: Animation | null = null;
    const EASE = "cubic-bezier(.2,.8,.2,1)";
    // Web Animations on the independent `scale` property: composes with any
    // transform the element already has and never overrides its transitions.
    const release = () => {
      if (pressed) {
        const back = pressed.animate([{ scale: "0.97" }, { scale: "1" }], { duration: 320, easing: EASE });
        back.onfinish = () => back.cancel();
        press?.cancel();
      }
      press = null;
      pressed = null;
    };
    const onDown = (e: PointerEvent) => {
      if (!phone.matches || e.button > 0) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>("a, button");
      if (!el || !scope.contains(el) || el.closest(".afvar-responsive-home > header, [data-avatar-dock], [data-avatar-layer], .hm-chrome")) return;
      release();
      if (reducedMotion()) return;
      pressed = el;
      press = el.animate([{ scale: "1" }, { scale: "0.97" }], { duration: 120, easing: EASE, fill: "forwards" });
      if (android) navigator.vibrate?.(6);

      const r = el.getBoundingClientRect();
      const clip = document.createElement("span");
      clip.className = "hm-ripple-clip";
      clip.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${getComputedStyle(el).borderRadius}`;
      const dot = document.createElement("span");
      const size = Math.hypot(Math.max(e.clientX - r.left, r.right - e.clientX), Math.max(e.clientY - r.top, r.bottom - e.clientY)) * 2;
      dot.className = "hm-ripple";
      dot.style.cssText = `left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px;width:${size}px;height:${size}px`;
      clip.append(dot);
      layer.append(clip);
      dot.addEventListener("animationend", () => clip.remove(), { once: true });
      setTimeout(() => clip.remove(), 900); // safety net if animationend never fires
    };

    scope.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("scroll", release, { passive: true });
    return () => {
      scope.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("scroll", release);
      release();
    };
  }, []);

  return (
    <div ref={root} className="hm-chrome" aria-hidden="true">
      <div className="hm-backdrop">
        <span className="hm-backdrop-aurora" />
        <span className="hm-backdrop-dots" />
        <span className="hm-backdrop-scan" />
        <span className="hm-backdrop-grain" />
      </div>
      <motion.div className="hm-progress" style={{ opacity: barOpacity }}>
        <motion.div className="hm-progress-bar" style={{ x }}>
          <motion.span className="hm-progress-glow" style={{ opacity: glow, scale: glowScale }} />
          <span className="hm-progress-head" />
        </motion.div>
      </motion.div>
      <div ref={ripples} className="hm-ripples" />
    </div>
  );
}

/** Hairline + mono "0N / 0M" counter between two big blocks (phones only). The
 *  digits are CSS-drawn odometer columns, so no text enters the DOM. */
export function MobileSectionMark({ n, of }: { n: number; of: number }) {
  const digits = String(n).padStart(2, "0").split("").map(Number);
  return (
    <div className="hm-mark" data-hm-mark="" aria-hidden="true">
      <span className="hm-odo">
        {digits.map((d, i) => <span key={i} className="hm-digit" style={{ "--d": d, "--i": i } as CSSProperties} />)}
      </span>
      <span className="hm-of" data-of={`/ ${String(of).padStart(2, "0")}`} />
    </div>
  );
}

/** Entry wrapper: clip-reveals its block in and gives it depth on the way out
 *  (phones only); display:contents elsewhere. */
export function MobileBlock({ children, last = false }: { children: ReactNode; last?: boolean }) {
  // The last big block (closing) keeps full presence: the page ends on it.
  return <div className="hm-block" data-hm-block="" data-hm-last={last || undefined}>{children}</div>;
}
