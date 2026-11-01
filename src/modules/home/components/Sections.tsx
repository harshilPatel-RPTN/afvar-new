"use client";

export { Capabilities } from "./CapabilitiesTour";
export { LiveChip, MarketsCovered } from "./MarketsPanel";

import { motion, useReducedMotion } from "framer-motion";
import { OverviewVideoFrame, OverviewVideoPlayer } from "./OverviewVideo";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { EVIDENCE, HOW_IT_WORKS, KEY_TOPICS, OVERVIEW, WHY, WHY_INTRO } from "../content";
import {
  AnimatedHeading,
  BTN_OUTLINE,
  CoreHairline,
  DOWN_TEXT,
  DUR,
  EASE,
  EngineTile,
  GUTTER,
  Icon,
  LiveChip,
  PANEL,
  SectionHead,
  Spark,
  SymbolDisc,
  TerrainRidge,
  UP_TEXT,
  VIEW_ONCE,
  drawX,
  fade,
  rise,
  useOnce,
  usePauseOffscreen,
} from "./bits";
import { CandleCard, RollNumber, ScrubSeam, ScrubText, useMarqueeVelocity } from "./marketMotion";
import { CandleSnake } from "./CandleSnake";
import { fmtPrice, useLiveMarket } from "./useLiveMarket";
import { BullCharge } from "./BullCharge";

/** §8 transition motif — a scroll-scrubbed price line between sections: the line draws
 *  with the scroll through the gap and candles pop up as it passes them (marketMotion).
 *  Green = positive next section; `toRed` (into Launch) = red sell-off recovering green. */
export function PriceSeam({ toRed = false, className = "" }: { toRed?: boolean; className?: string }) {
  return <ScrubSeam toRed={toRed} className={className} />;
}

/** Shared dialog: solid dark surface + hairline (no glass, spec §0), Escape/backdrop to close, scroll lock. */
export function Modal({ label, onClose, children, wide = false }: { label: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-[90] grid place-items-center p-4 sm:p-6" onClick={onClose}>
      <div aria-hidden="true" className="absolute inset-0 bg-black/75" />
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative w-full animate-[modal-in_.25s_ease-out] ${wide ? "max-w-[760px]" : "max-w-[540px]"} rounded-2xl border border-white/[.11] bg-(--afvar-panel) shadow-[0_40px_90px_-30px_rgba(0,0,0,.9)]`}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/[.11] bg-[#171B1D] text-(--mk-dim) transition-colors hover:border-white/[.24] hover:text-(--mk-text)"
        >
          <Icon name="x" className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        {children}
      </div>
    </div>
  );
}

/** W1.1.2 — overview video: copy + play row on the left, thumbnail on the right. Play opens a lightbox. */
export function VideoSection() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  return (
    <section id="overview" className={`${GUTTER} overflow-x-clip py-16 md:py-20`}>
      {/* Transition A: the hero's price-line leads down into the overview. */}
      <PriceSeam />
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <motion.div initial="hidden" whileInView="visible" viewport={VIEW_ONCE}>
          <AnimatedHeading
            kicker={OVERVIEW.kicker}
            title={OVERVIEW.title}
            currency
            sub={OVERVIEW.body}
            titleClassName="mt-3 max-w-[420px] text-[30px] font-semibold leading-[1.1] tracking-[-.02em] text-(--mk-text) sm:text-[40px]"
            subClassName="mt-5 max-w-[440px] text-[15.5px] leading-relaxed text-(--mk-dim)"
          />
          <motion.div variants={rise(reduce, 0.3, 8)}>
          <button type="button" onClick={() => setOpen(true)} className="group mt-8 flex items-center gap-4 text-left">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-white/[.16] bg-[#171B1D] text-(--mk-text) transition-colors duration-200 group-hover:border-white/[.3]">
              <Icon name="play" className="h-5 w-5 translate-x-0.5" />
            </span>
            <span>
              <span className="block text-[15px] font-medium text-(--mk-text)">{OVERVIEW.playLabel}</span>
              <span className="mt-0.5 block text-[12.5px] text-(--mk-faint)">{OVERVIEW.playNote}</span>
            </span>
          </button>
          </motion.div>
        </motion.div>
        {/* Real capture of the AFVAR interactive preview (sample data) — plays while on screen.
            Powers on as it arrives and lifts toward the viewer mid-scroll (see OverviewVideo). */}
        <OverviewVideoFrame onExpand={() => setOpen(true)} />
      </div>

      {open && (
        <Modal label="AFVAR overview video" onClose={() => setOpen(false)} wide>
          <div className="p-2 sm:p-3">
            <OverviewVideoPlayer />
            <p className="px-2 pb-1 pt-3 text-[12.5px] text-(--mk-dim)">
              Captured from the AFVAR interactive preview with sample data. The final ninety-second film ships with the launch build.
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
}

/** W1.1.5 — how it works: one compact pipeline band. The connector line draws
 *  once on inView and each step's number chip pulses in sequence as the line
 *  passes it. Reduced motion: line rendered full, no pulses. */
export function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <section id="how" className={`${GUTTER} relative mt-4`}>
      <div className={`relative overflow-hidden px-6 py-10 sm:px-10 md:py-12 ${PANEL}`}>
        <motion.div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6" initial="hidden" whileInView="visible" viewport={VIEW_ONCE}>
          <AnimatedHeading
            kicker={HOW_IT_WORKS.kicker}
            title={HOW_IT_WORKS.title}
            sub={HOW_IT_WORKS.body}
            className="max-w-[560px]"
            titleClassName="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-.02em] text-(--mk-text) sm:text-[34px]"
            subClassName="mt-3 max-w-[520px] text-[14.5px] leading-relaxed text-(--mk-dim)"
          />
          <motion.div variants={rise(reduce, 0.3, 8)} className="shrink-0">
            <Link href={HOW_IT_WORKS.cta.href} className={BTN_OUTLINE}>
              {HOW_IT_WORKS.cta.label}
              <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </motion.div>
        </motion.div>

        <div className="relative mt-10">
          {/* Connector: a thin price-line that draws left→right across the three stations (sm+).
              Drawn with an origin-left scaleX instead of SVG pathLength: framer's pathLength
              SSR attributes (stroke-dasharray) don't hydrate cleanly under React 19. */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px origin-left bg-white/[.16] sm:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            // `reduce` only shapes the transition (never the SSR'd styles): the line snaps in full.
            transition={{ duration: reduce ? 0 : 1.2, ease: "easeInOut" }}
          />
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {HOW_IT_WORKS.steps.map((step, index) => (
              <div key={step.n} className="relative">
                <motion.span
                  className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-white/[.16] bg-[#171B1D] font-mono text-[13px] font-semibold text-(--mk-text)"
                  initial={{ opacity: 0.35 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: reduce ? 0 : DUR.panel, delay: reduce ? 0 : 0.15 + index * 0.4, ease: EASE }}
                >
                  <RollNumber value={step.n} />
                </motion.span>
                <h3 className="mt-4 text-[15px] font-semibold text-(--mk-text)">{step.title}</h3>
                <p className="mt-1 max-w-[300px] text-[13px] leading-relaxed text-(--mk-dim)">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** W1.1.6 companion — key topics as a full-bleed marquee band of linked chips.
 *  Reuses the `home-tape` keyframes (two copies, translateX −50%); pauses on
 *  hover; reduced motion swaps the loop for static wrapped rows. */
export function KeyTopics() {
  const pauseRef = usePauseOffscreen<HTMLElement>();
  // The loop speeds up with scroll velocity and eases back to 1× (Web Animations playbackRate).
  const trackRef = useMarqueeVelocity<HTMLDivElement>();
  return (
    <section ref={pauseRef} id="topics" className="relative mt-16 border-y border-white/[.08] py-10 md:mt-20">
      <div className={`${GUTTER} flex flex-wrap items-center justify-between gap-x-8 gap-y-3`}>
        <p className="mk-eyebrow">Key topics</p>
        <Link href="/desk" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-(--mk-text) underline-offset-4 hover:text-white hover:underline">
          View All Market Briefs
          <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
      <div className="group relative mt-6 overflow-hidden">
        <div ref={trackRef} className="flex w-max animate-[home-tape_56s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-y-3 motion-reduce:animate-none motion-reduce:px-5">
          {[false, true].map((dup) =>
            KEY_TOPICS.map((topic) => (
              <Link
                key={`${topic.title}${dup ? "-dup" : ""}`}
                href="/desk"
                aria-hidden={dup || undefined}
                tabIndex={dup ? -1 : undefined}
                className={`mkc-chip mr-3 flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full border border-white/[.11] bg-[#171B1D] py-2 pl-2.5 pr-5 transition-colors duration-300 hover:border-white/[.24] ${dup ? "motion-reduce:hidden" : ""}`}
              >
                <EngineTile glyph={topic.glyph} className="h-8 w-8" />
                <span className="text-[13.5px] font-medium text-(--mk-text)">{topic.title}</span>
              </Link>
            )),
          )}
        </div>
        {/* Solid edge fades (no glass): the band colour easing over the loop seams. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-[linear-gradient(90deg,#080A0B,transparent)] motion-reduce:hidden" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-[linear-gradient(270deg,#080A0B,transparent)] motion-reduce:hidden" />
      </div>
    </section>
  );
}

/** W1.1.6 — sources & evidence: a single statement card. On view the green→red
 *  top hairline draws left→right and the statement fades up in three phrases. */
export function EvidenceBanner() {
  const reduce = useReducedMotion();
  return (
    <section id="evidence" className={`${GUTTER} relative pb-4`}>
      <CandleCard standalone index={0}>
      <div className={`relative overflow-hidden px-7 py-10 text-center transition-colors duration-200 hover:border-white/[.2] sm:px-12 ${PANEL}`}>
        <motion.span variants={drawX(reduce, 0.15, 0.9)} className="absolute inset-x-0 top-0 block origin-left">
          <CoreHairline />
        </motion.span>
        <motion.p variants={fade(reduce, 0.1, DUR.panel)} className="mk-eyebrow">
          {EVIDENCE.kicker}
        </motion.p>
        {/* The statement lights word-by-word with the scroll (reverses on scroll up). */}
        <ScrubText
          text={EVIDENCE.statement}
          className="mx-auto mt-4 max-w-[680px] text-[21px] font-semibold leading-snug tracking-[-.01em] text-(--mk-text) sm:text-[25px]"
        />
        <motion.div variants={fade(reduce, 0.65)}>
          <Link href={EVIDENCE.cta.href} className="mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-(--mk-text) underline-offset-4 hover:text-white hover:underline">
            {EVIDENCE.cta.label}
            <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </motion.div>
      </div>
      </CandleCard>
    </section>
  );
}

/** W1.1.5 — why AFVAR: three equal principle cards (stagger), then the provenance
 *  chain demonstrated on a real quote (spec §12 + honesty contract). */
export function WhyAfvar() {
  const [ref, inView] = useOnce<HTMLDivElement>();
  return (
    <section id="why" className="relative overflow-hidden">
      <CandleSnake from="right" />
      <TerrainRidge seed={31} />
      <div className={`${GUTTER} relative py-16 md:py-20`}>
        {/* Transition D: market rows settle, the line leads into the three principles. */}
        <PriceSeam />
        <SectionHead
          kicker="Why AFVAR"
          title="Built so every number can defend itself."
          currency
          tape
          wrapTitle={(node) => <BullCharge side="right">{node}</BullCharge>}
          sub={WHY_INTRO}
          action={
            <Link href="/contact" className={BTN_OUTLINE}>
              Learn More About AFVAR
              <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          }
        />
        <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} className="mt-10 grid gap-4 md:grid-cols-3">
          {WHY.map((item, index) => (
            <CandleCard key={item.title} index={index} delay={index * 0.08} snakeTarget={index === 0}>
              <div className={`flex h-full flex-col p-6 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-white/[.2] ${PANEL}`}>
                <EngineTile glyph={item.glyph} className="h-11 w-11" />
                <h3 className="mt-4 text-[15.5px] font-semibold text-(--mk-text)">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-(--mk-dim)">{item.body}</p>
              </div>
            </CandleCard>
          ))}
        </motion.div>
        <CandleCard standalone index={1} className="mt-4" spark={false}>
          <ProvenanceDemo />
        </CandleCard>
      </div>
    </section>
  );
}

/** The core promise, demonstrated live: one real quote (XAUUSD via useLiveMarket)
 *  with its provenance chain — source, venue, delay, cache age — revealed in
 *  sequence on inView (or instantly on hover/focus). Tapping a chip explains it
 *  in plain words. All values real; nothing invented. */
function ProvenanceDemo() {
  const { quotes, live, updatedAt } = useLiveMarket();
  const reduce = useReducedMotion();
  const quote = quotes["XAUUSD"];
  const up = quote.changePct >= 0;
  const [mode, setMode] = useState<"hidden" | "stagger" | "instant">("hidden");
  const [open, setOpen] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Tick the cache-age label every 5s while the live feed is attached.
  useEffect(() => {
    if (!updatedAt) return;
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, [updatedAt]);

  const age = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null;

  const chips: { key: string; label: string; note: string }[] = [
    { key: "source", label: "Source · Yahoo proxy", note: "This price comes from AFVAR's server-side Yahoo Finance proxy — the page never invents or interpolates a number." },
    { key: "venue", label: "Venue · reference", note: "A reference price for orientation, not a tradeable quote from one specific exchange." },
    { key: "delay", label: "Delay · futures delayed", note: "Gold is quoted from futures, which arrive delayed. The delay is disclosed on every surface, never hidden." },
    live && age !== null
      ? { key: "cache", label: `Cache · updated ${age}s ago`, note: "How old the cached server response behind this number is — the page re-polls roughly every 30 seconds." }
      : { key: "cache", label: "Cache · snapshot", note: "The live feed hasn't answered yet, so this is the labelled static snapshot — honest over fake ticks." },
  ];

  const reveal = () => setMode((current) => (current === "hidden" ? "instant" : current));

  return (
    <motion.div
      className={`p-6 transition-colors duration-200 hover:border-white/[.2] sm:p-7 ${PANEL}`}
      onViewportEnter={() => setMode((current) => (current === "hidden" ? "stagger" : current))}
      viewport={{ once: true, amount: 0.5 }}
      onMouseEnter={reveal}
      onFocusCapture={reveal}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="mk-eyebrow">Provenance · live example</p>
        <LiveChip live={live} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <SymbolDisc symbol="XAUUSD" className="h-10 w-10" />
          <span>
            <span className="block text-[14.5px] font-semibold text-(--mk-text)">XAUUSD</span>
            <span className="block text-[11.5px] text-(--mk-faint)">{quote.name}</span>
          </span>
        </div>
        <Spark closes={quote.closes.slice(-18)} up={up} w={64} h={22} />
        <span className="font-mono text-[22px] font-semibold tabular-nums tracking-[-.01em] text-(--mk-text)">{fmtPrice(quote.last, quote.decimals)}</span>
        <span className={`font-mono text-[13.5px] font-semibold tabular-nums ${up ? UP_TEXT : DOWN_TEXT}`}>
          {up ? "+" : ""}
          {quote.changePct.toFixed(2)}%
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <motion.span
            key={chip.key}
            role="button"
            tabIndex={0}
            aria-expanded={open === index}
            aria-label={`${chip.label} — explain`}
            onClick={() => setOpen((current) => (current === index ? null : index))}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen((current) => (current === index ? null : index));
              }
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={mode === "hidden" ? undefined : { opacity: 1, y: 0 }}
            transition={{
              duration: mode === "instant" || reduce ? DUR.fast : DUR.section,
              delay: mode === "stagger" && !reduce ? index * 0.15 : 0,
              ease: EASE,
            }}
            className={`cursor-pointer select-none rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-wide outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[rgba(245,247,247,.6)] ${
              open === index ? "border-white/[.34] bg-[#171B1D] text-(--mk-text)" : "border-white/[.11] bg-[#171B1D] text-(--mk-dim) hover:border-white/[.24]"
            }`}
          >
            {chip.label}
          </motion.span>
        ))}
      </div>

      <p className="mt-4 text-[11.5px] text-(--mk-faint)">Every number carries this chain — tap any chip</p>
      {open !== null && (
        <p role="status" className="mt-2 text-[12.5px] leading-relaxed text-(--mk-dim)">
          {chips[open].note}
        </p>
      )}
    </motion.div>
  );
}
