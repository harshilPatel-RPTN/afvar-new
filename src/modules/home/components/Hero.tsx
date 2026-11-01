"use client";

// W1.1.1 — MARKET TERRAIN hero (README §5–§7). The ticker sits directly under
// the fixed navbar; below it a 280vh track pins a full-bleed stage on lg+ where
// the live Market Terrain 3D scene renders on ONE canvas (HeroLive). ONE
// master value `u` (0..1) drives everything: a short automatic entry
// (u 0 → INTRO_END) that hands over to the scroll chapters (u INTRO_END → 1)
// without a snap, the single late real-data callout, the quiet dock labels and
// the release into content (#030405 → #080A0B). `u` lives in a ref plus a
// MotionValue mirror — never React state — so nothing re-renders per frame.
// < lg: copy first, then a large full-width portrait scene directly below
// (README §7: no small scene + black void). Reduced motion: one still 3D frame, no pin.
import { MotionConfig, motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { DOCK, HERO, HERO_CALLOUTS, STATS } from "../content";
import { BTN_OUTLINE, BTN_PRIMARY, DOWN_TEXT, GUTTER, Icon, LiveChip, Spark, UP_TEXT, usePauseOffscreen } from "./bits";
import { HeroOpenBell } from "./HeroOpenBell";
import { HeroLive } from "./HeroLive";
import { RollNumber } from "./marketMotion";
import { DOM, INTRO_END, INTRO_SECONDS, clamp01, easeInOut, easeOut, ramp, window4 } from "./marketTerrainConfig";
import { fmtPrice, useLiveMarket, type HomeQuote } from "./useLiveMarket";

/** Interrupted intro → scroll hand-over blend (§7.8: no snap, no jump cut). */
const HANDOVER_MS = 380;
/** Mobile box scroll-through plays a short, gentle slice of the film. */
const MOBILE_RANGE: readonly [number, number] = [INTRO_END, 0.9];
/** Canvas dims to this opacity across the release chapter. */
const RELEASE_DIM = 0.3;
/** Keys that scroll the page — any of them interrupts the auto intro. */
const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"]);

/** SSR-safe media query (server snapshot `false`): no setState-in-effect, no hydration mismatch. */
function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function Hero() {
  const { quotes, live } = useLiveMarket();

  return (
    <MotionConfig reducedMotion="user">
      {/* ticker strip first: directly under the fixed 72px site nav */}
      <div className="pt-[72px]">
        <Ticker quotes={quotes} live={live} />
      </div>
      <HeroStage quotes={quotes} />
    </MotionConfig>
  );
}

type Phase = { mode: "wait" | "intro" | "handover" | "scroll"; t0: number; from: number };

/** One DOM structure for every layout; JS only decides which motion features run. */
function HeroStage({ quotes }: { quotes: Record<string, HomeQuote> }) {
  const desktop = useMedia("(min-width: 1024px)");
  const still = useMedia("(prefers-reduced-motion: reduce)");
  const cinematic = desktop && !still;
  const mobileMotion = !desktop && !still;

  /* ── desktop master timeline: u = intro / handover / scroll ── */
  const trackRef = useRef<HTMLElement | null>(null);
  const deskU = useRef(INTRO_END);
  const uMV = useMotionValue(INTRO_END);
  const phase = useRef<Phase>({ mode: "scroll", t0: 0, from: 0 });
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!cinematic || phase.current.mode !== "scroll") return; // intro/handover loops read scroll themselves
    const u = INTRO_END + p * (1 - INTRO_END);
    deskU.current = u;
    uMV.set(u);
  });

  // The intro needs the live canvas: until the 3D chunk has drawn its first frame
  // the hero's dark background shows and u stays parked; the intro (which opens in
  // low light) starts the moment the canvas is live.
  const sceneReady = useRef(false);
  const onSceneReady = useRef<() => void>(() => {});
  const handleSceneReady = useCallback(() => {
    sceneReady.current = true;
    onSceneReady.current();
  }, []);

  useEffect(() => {
    if (!cinematic) return;
    const ph = phase.current;
    const scrollU = () => INTRO_END + clamp01(scrollYProgress.get()) * (1 - INTRO_END);
    const set = (u: number) => {
      deskU.current = u;
      uMV.set(u);
    };

    // Deep link / refresh at depth: no intro — render the frame for this scroll position.
    if (window.scrollY > 4) {
      ph.mode = "scroll";
      set(scrollU());
      return;
    }

    let raf = 0;
    const loop = (now: number) => {
      raf = 0;
      if (ph.mode === "intro") {
        const k = clamp01((now - ph.t0) / (INTRO_SECONDS * 1000));
        const introU = INTRO_END * easeInOut(k);
        set(Math.max(scrollYProgress.get() > 0 ? scrollU() : 0, introU));
        if (k >= 1) {
          // introU(1) === INTRO_END === scrollU at the top → seamless
          ph.mode = "scroll";
          detach();
          set(scrollU());
          return;
        }
      } else if (ph.mode === "handover") {
        // ease from the interrupted intro value toward the LIVE scroll value (it keeps moving)
        const k = clamp01((now - ph.t0) / HANDOVER_MS);
        set(ph.from + (scrollU() - ph.from) * easeOut(k));
        if (k >= 1) {
          ph.mode = "scroll";
          set(scrollU());
          return;
        }
      } else return;
      raf = requestAnimationFrame(loop);
    };

    const interrupt = () => {
      if (ph.mode === "wait") {
        // the scene isn't live yet: plain scroll from here, no intro
        detach();
        ph.mode = "scroll";
        set(scrollU());
        return;
      }
      if (ph.mode !== "intro") return;
      detach();
      ph.mode = "handover";
      ph.from = deskU.current;
      ph.t0 = performance.now();
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onScroll = () => {
      if (window.scrollY > 4) interrupt();
    };
    const onKey = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) interrupt();
    };
    const opts: AddEventListenerOptions = { passive: true };
    function detach() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchmove", interrupt);
      window.removeEventListener("keydown", onKey);
    }
    window.addEventListener("scroll", onScroll, opts);
    window.addEventListener("wheel", interrupt, opts);
    window.addEventListener("touchmove", interrupt, opts);
    window.addEventListener("keydown", onKey);

    // Park until the canvas is live.
    ph.mode = "wait";
    set(0); // the intro's first frame, so the canvas fades in exactly where the intro begins
    const start = () => {
      if (ph.mode !== "wait") return;
      // The canvas fades in from the dark background on the intro's low-light opener.
      ph.mode = "intro";
      ph.t0 = performance.now();
      set(0);
      raf = requestAnimationFrame(loop);
    };
    onSceneReady.current = start;
    if (sceneReady.current) start();

    return () => {
      onSceneReady.current = () => {};
      cancelAnimationFrame(raf);
      detach();
      ph.mode = "scroll";
    };
  }, [cinematic, scrollYProgress, uMV]);

  const deskActive = useInView(trackRef, { margin: "200px" });

  // Overlays + release, all derived from the one master value.
  const canvasOpacity = useTransform(uMV, (u) => 1 - (1 - RELEASE_DIM) * easeInOut(ramp(u, DOM.release[0], DOM.release[1])));
  const callout1 = useTransform(uMV, (u) => window4(u, DOM.callout1));
  const dock = useTransform(uMV, (u) => easeOut(ramp(u, DOM.dock[0], DOM.dock[1])));

  /* ── < lg: the full-width portrait scene scrubs its own short slice ── */
  const boxRef = useRef<HTMLDivElement | null>(null);
  const mobU = useRef(INTRO_END);
  const { scrollYProgress: boxProgress } = useScroll({ target: boxRef, offset: ["start end", "end start"] });
  const toMobileU = (p: number) => MOBILE_RANGE[0] + clamp01(p) * (MOBILE_RANGE[1] - MOBILE_RANGE[0]);
  useMotionValueEvent(boxProgress, "change", (p) => {
    if (mobileMotion) mobU.current = toMobileU(p);
  });
  useEffect(() => {
    if (mobileMotion) mobU.current = MOBILE_RANGE[0] + clamp01(boxProgress.get()) * (MOBILE_RANGE[1] - MOBILE_RANGE[0]);
  }, [mobileMotion, boxProgress]);
  const boxActive = useInView(boxRef, { margin: "200px" });

  const [sym1] = HERO_CALLOUTS;

  return (
    <section ref={trackRef} className={`relative ${cinematic ? "lg:h-[280vh]" : ""}`}>
      <div
        className={`relative overflow-hidden ${
          cinematic ? "lg:sticky lg:top-0 lg:h-svh" : "lg:h-[calc(100svh-120px)] lg:min-h-[620px]"
        }`}
      >
        {/* ── lg backdrop: transparent live 3D scene (one still frame under reduced motion) ── */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
          <motion.div style={{ opacity: cinematic ? canvasOpacity : 1 }} className="absolute inset-0">
            {desktop && <HeroLive progressRef={deskU} view="desktop" active={deskActive} still={still} onReady={handleSceneReady} />}
          </motion.div>

        </div>

        {/* ── overlays (lg, cinematic): ONE late real-data callout (Chapter E), then quiet dock labels ── */}
        {cinematic && (
          <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
            <div className="absolute bottom-[26%] right-[4%]">
              {quotes[sym1] && <Callout symbol={sym1} quote={quotes[sym1]} opacity={callout1} />}
            </div>
            <div className="absolute bottom-[7%] left-[64%] -translate-x-1/2">
              <Dock opacity={dock} />
            </div>
          </div>
        )}

        {/* market-open bell + one-shot green wave: above the film, below the copy (z-15) */}
        <HeroOpenBell />

        <div className={`${GUTTER} relative z-20 flex flex-col lg:h-full lg:pt-[84px]`}>
          {/* ── copy: visible immediately, a single short fade ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col pt-8 lg:min-h-0 lg:w-[48%] lg:max-w-[660px] lg:flex-1 lg:justify-center lg:pb-6 lg:pt-0"
          >
            <p className="inline-flex w-max items-center gap-2 rounded-full border border-(--mk-line) bg-(--afvar-panel) px-3.5 py-1.5 text-[11.5px] font-medium tracking-wide text-(--mk-dim)">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#A3AAAC]" />
              {HERO.badge}
            </p>
            <h1 className="mt-5 text-[40px] font-semibold leading-[1.06] tracking-[-.02em] text-(--mk-text) sm:text-[54px]">
              {HERO.titleA}
              <br />
              <span className="text-[#A3AAAC]">{HERO.titleB}</span>
            </h1>
            <p className="mt-6 max-w-[480px] text-[16px] leading-relaxed text-(--mk-dim)">{HERO.sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={HERO.primary.href} className={BTN_PRIMARY}>
                {HERO.primary.label}
                <Icon name="arrow" className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link href={HERO.secondary.href} className={BTN_OUTLINE}>
                <span className="grid h-6 w-6 place-items-center rounded-full border border-white/[.22] text-(--mk-text)">
                  <Icon name="play" className="h-3 w-3 translate-x-px" />
                </span>
                {HERO.secondary.label}
              </Link>
            </div>

            {/* trust facts: thin-separator row on lg, 2×2 grid below */}
            <dl className="mt-10 grid max-w-[460px] grid-cols-2 gap-x-6 gap-y-7 lg:mt-12 lg:flex lg:items-start lg:gap-0">
              {STATS.map((stat, index) => (
                <div key={stat.label} className={`flex flex-col-reverse lg:flex-1 ${index > 0 ? "lg:border-l lg:border-(--mk-line) lg:pl-6" : ""}`}>
                  <dt className="mt-1 text-[12px] leading-snug text-(--mk-dim)">{stat.label}</dt>
                  <dd className="text-[26px] font-semibold tabular-nums tracking-[-.02em] text-(--mk-text) lg:text-[30px]">
                    <RollNumber value={stat.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          {/* ── < lg: large full-bleed portrait scene directly under the copy — no frame, no void (README §7) ── */}
          <div
            ref={boxRef}
            className="relative -mx-5 mt-6 h-[max(420px,min(115vw,72svh))] overflow-hidden sm:-mx-10 lg:hidden"
          >
            {!desktop && <HeroLive progressRef={mobU} view="mobile" active={boxActive} still={still} />}
            {/* soft top/bottom fades so the render meets the page without a hard edge */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-(--afvar-charcoal) to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-(--afvar-charcoal) to-transparent" />
          </div>

          {/* caption: honest framing — the film is illustrative, the quotes are real */}
          <p className="shrink-0 pb-6 pt-3 text-[11px] leading-relaxed text-(--mk-faint) lg:pb-4 lg:pt-3">
            {HERO.caption}
            <span className="mx-2 hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="mt-1 block sm:mt-0 sm:inline">{HERO.sceneNote}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- overlays */

/** Hidden overlays leave the accessibility tree and hit-testing entirely. */
function useVisibility(opacity: MotionValue<number>) {
  return useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
}

/** One real-data callout: symbol · price · Δ% · LIVE/SNAPSHOT · one small spark. Solid surface. */
function Callout({ symbol, quote, opacity }: { symbol: string; quote: HomeQuote; opacity: MotionValue<number> }) {
  const up = quote.changePct >= 0;
  const y = useTransform(opacity, (o) => (1 - o) * 10);
  const visibility = useVisibility(opacity);
  return (
    <motion.div
      style={{ opacity, y, visibility }}
      className="w-[236px] rounded-xl border border-white/[.11] bg-(--afvar-panel) px-4 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[12px] font-semibold text-(--mk-text)">{symbol}</span>
        <LiveChip live={quote.live} pulse={false} />
      </div>
      <div className="mt-0.5 text-[11px] text-(--mk-faint)">{quote.name}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[19px] font-semibold leading-none tabular-nums text-(--mk-text)">{fmtPrice(quote.last, quote.decimals)}</div>
          <div className={`mt-1 font-mono text-[11px] tabular-nums ${up ? UP_TEXT : DOWN_TEXT}`}>
            {up ? "+" : ""}
            {quote.changePct.toFixed(2)}%
          </div>
        </div>
        <Spark closes={quote.closes.slice(-16)} up={up} w={84} h={26} />
      </div>
    </motion.div>
  );
}

/** Quiet dock labels of the eight desk apps (README §1.1: optional, late, secondary) — one solid strip, neutral glyphs. */
function Dock({ opacity }: { opacity: MotionValue<number> }) {
  const y = useTransform(opacity, (o) => (1 - o) * 12);
  const visibility = useVisibility(opacity);
  return (
    <motion.ul
      style={{ opacity, y, visibility }}
      aria-label="AFVAR desk apps"
      className="flex items-center gap-1 rounded-full border border-white/[.11] bg-(--afvar-charcoal) px-2 py-1.5"
    >
      {DOCK.map((app) => (
        <li key={app.label} className="flex items-center gap-1.5 px-2 py-0.5">
          <Icon name={app.glyph} className="h-3.5 w-3.5 text-[#6D7578]" strokeWidth={1.7} />
          <span className="whitespace-nowrap text-[11px] text-(--mk-dim)">{app.label}</span>
        </li>
      ))}
    </motion.ul>
  );
}

/* ----------------------------------------------------------------- ticker */

/** Live tape: LIVE/SNAPSHOT chip, price, signed green/red change, mini sparkline. */
function Ticker({ quotes, live }: { quotes: Record<string, HomeQuote>; live: boolean }) {
  const entries = Object.entries(quotes);
  const loop = [...entries, ...entries];
  const pauseRef = usePauseOffscreen<HTMLDivElement>();
  return (
    <div ref={pauseRef} className="border-y border-(--mk-line) bg-(--afvar-charcoal)">
      <div className="group flex h-12 items-center overflow-hidden">
        {/* Opaque block so the scrolling tape never shows through the state pill. */}
        <span className="z-10 flex h-full shrink-0 items-center bg-(--afvar-charcoal) pl-5 pr-4 sm:pl-10">
          <LiveChip live={live} />
        </span>
        <div className="flex w-max animate-[home-tape_54s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none" aria-hidden="true">
          {loop.map(([symbol, quote], index) => {
            const up = quote.changePct >= 0;
            return (
              <span key={`${symbol}-${index}`} className="flex items-center gap-2.5 px-6 font-mono text-[12px]">
                <span className="font-semibold text-(--mk-text)">{symbol}</span>
                <span className="tabular-nums text-(--mk-dim)">{fmtPrice(quote.last, quote.decimals)}</span>
                <span className={`tabular-nums ${up ? UP_TEXT : DOWN_TEXT}`}>
                  {up ? "+" : ""}{quote.changePct.toFixed(2)}%
                </span>
                <Spark closes={quote.closes.slice(-14)} up={up} w={44} h={16} />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
