"use client";

// Chapter 01 — ORIGIN. A 420vh sticky stage: the WebGL scene plays the story
// of one tick becoming structure and understanding, while mono chapter labels
// and stage captions crossfade over it. One master scrollYProgress drives the
// scene (via ref) and every DOM window from originConfig — always in sync.
// Non-cinematic contexts (mobile / reduced motion) get a composed single
// viewport with the scene settled; no WebGL gets a CSS poster.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BullCharge, useMomentWindow } from "./beasts";
import { useChapterStage } from "./chapterStage";
import { TickRoll, WickText } from "./kinetic";
import { CopyScrim, useInertWhileHidden } from "./reveal";
import { CAPTIONS, DOM, SETTLED_P, ramp, window4 } from "./originConfig";
import { HAIR, MONO, REGISTER_HREF } from "./ui";

const OriginScene = dynamic(() => import("./OriginScene"), { ssr: false });

const FACTS = [
  ["8", "coverage lanes"],
  ["2", "language editions"],
  ["24/7", "crypto coverage"],
  ["0", "order buttons"],
] as const;

export function Chapter01() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);

  // DOM reveal windows — same config the scene reads.
  const captionOpacities = CAPTIONS.map((c) => c.window);
  const cap0 = useTransform(scrollYProgress, (p) => window4(p, captionOpacities[0]));
  const cap1 = useTransform(scrollYProgress, (p) => window4(p, captionOpacities[1]));
  const cap2 = useTransform(scrollYProgress, (p) => window4(p, captionOpacities[2]));
  const cap3 = useTransform(scrollYProgress, (p) => window4(p, captionOpacities[3]));
  const caps = [cap0, cap1, cap2, cap3];
  const hintOpacity = useTransform(scrollYProgress, (p) => 1 - ramp(p, DOM.scrollHint[0], DOM.scrollHint[1]));
  const illuOpacity = useTransform(scrollYProgress, (p) => ramp(p, DOM.illustrative[0], DOM.illustrative[1]));
  const finaleOpacity = useTransform(scrollYProgress, (p) => ramp(p, DOM.finale[0], DOM.finale[1]));
  const finaleY = useTransform(finaleOpacity, (o) => (1 - o) * 26);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));
  const { ref: finaleRef } = useInertWhileHidden(finaleOpacity);

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative text-(--afvar-text) ${cinematic ? "lg:h-[420vh]" : ""}`} id="chapter-01" aria-label="Chapter 01 — Origin">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              {/* scene fills the stage */}
              <div className="absolute inset-0">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><OriginScene progress={progressRef} active={active} still={false} /></div> : null}
              </div>

              {/* overlays never intercept the canvas */}
              <div className="pointer-events-none absolute inset-0">
                {/* chapter label + progress line */}
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-(--afvar-text)">01</span> / Origin
                  </p>
                  <div className="mt-3 h-px w-28 bg-[rgba(255,255,255,0.12)]">
                    <motion.div className="h-px origin-left bg-(--afvar-mint)" style={{ scaleX: barScale }} />
                  </div>
                </div>

                {/* stage captions, lower-left */}
                <div className="absolute bottom-[18vh] left-10 max-w-xl">
                  {CAPTIONS.map((c, i) => (
                    <motion.div key={i} className="absolute bottom-0 left-0 w-max max-w-xl" style={{ opacity: caps[i] }}>
                      <WickText as="p" className="text-3xl font-medium leading-snug tracking-tight text-(--afvar-text) xl:text-4xl" text={c.text} mv={scrollYProgress} at={[c.window[0], c.window[1]]} />
                    </motion.div>
                  ))}
                </div>

                {/* finale: product copy takes over */}
                <CopyScrim mv={scrollYProgress} at={DOM.finale} />
                <motion.div ref={finaleRef} className="absolute left-10 top-1/2 max-w-xl -translate-y-1/2" style={{ opacity: finaleOpacity, y: finaleY }} inert={finaleOpacity.get() < 0.05}>
                  <FinaleCopy mv={scrollYProgress} at={DOM.finale} />
                </motion.div>

                {/* honesty label */}
                <motion.p className={`${MONO} absolute bottom-8 right-10 text-[#6D7578]`} style={{ opacity: illuOpacity }}>
                  Illustrative · the 3D scene is an illustration, not market data
                </motion.p>

                {/* scroll hint */}
                <motion.div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2" style={{ opacity: hintOpacity }}>
                  <p className={`${MONO} text-[#6D7578]`}>Scroll</p>
                  <div className="h-8 w-px bg-gradient-to-b from-(--afvar-mint) to-transparent" />
                </motion.div>
              </div>
            </div>
          ) : (
            /* composed single-viewport layout: copy first, settled scene after */
            <div className="px-5 pb-16 pt-36 sm:px-8">
              <FinaleCopy />
              <div ref={revealRef} className="relative mt-10 h-[55svh] min-h-[320px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><OriginScene progress={progressRef} active={active} still={reduced} /></div> : null}
                <p className={`${MONO} absolute bottom-3 right-4 text-[#6D7578]`}>Illustrative · not market data</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}

/** The chapter's destination copy — also the page's H1. */
function FinaleCopy({ mv, at }: { mv?: MotionValue<number>; at?: readonly [number, number] } = {}) {
  const beastP = useMomentWindow(mv, at);
  return (
    <div className="pointer-events-auto">
      <p className={`${MONO} text-(--afvar-mint)`}>Pre-launch · OS in development</p>
      <BullCharge side="right" p={beastP}>
        <WickText as="h1" className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-(--afvar-text) sm:text-5xl xl:text-6xl" text="Your AI trading a{s|$}sistant." mv={mv} at={at} />
      </BullCharge>
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#A3AAAC]">
        One desk that follows commodities, forex and crypto with you, explains every move with its source — and never places a trade.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href={REGISTER_HREF} prefetch={false}
          className="afvar-glass-button afvar-glass-primary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
        >
          Register Now
        </Link>
        <Link href="/platform" className="text-sm font-medium text-[#A3AAAC] transition-colors hover:text-(--afvar-text) afv-link">
          Explore the platform
        </Link>
      </div>
      <dl className={`mt-9 grid max-w-md grid-cols-2 gap-y-4 border-t ${HAIR} pt-5 sm:grid-cols-4 sm:gap-y-0`}>
        {FACTS.map(([n, label], i) => (
          <div key={label} className={`${i % 2 === 1 ? `border-l ${HAIR} pl-4` : ""} ${i > 0 ? "sm:border-l sm:border-[rgba(255,255,255,0.1)] sm:pl-4" : ""}`}>
            <dt className="sr-only">{label}</dt>
            <dd className="text-lg font-semibold text-(--afvar-text)">
              <FactValue n={n} mv={mv} at={at} />
            </dd>
            <dd className="mt-0.5 text-[11px] leading-tight text-[#6D7578]">{label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** No-WebGL poster: same meaning, zero canvas. */
function Poster() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="absolute right-[22%] top-[38%] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(0,230,118,0.35),transparent_70%)]" />
      <div className="absolute right-[22%] top-[38%] mt-20 ml-20 h-2 w-2 rounded-full bg-[#69F0AE] shadow-[0_0_24px_6px_rgba(0,230,118,0.6)]" />
      <div className="absolute inset-x-[8%] bottom-[28%] h-px bg-gradient-to-r from-transparent via-[rgba(0,230,118,0.5)] to-transparent" />
    </div>
  );
}

/** Trust facts tick-roll like a feed; "0 order buttons" stays still — it is a fact, not a countdown. */
function FactValue({ n, mv, at }: { n: string; mv?: MotionValue<number>; at?: readonly [number, number] }) {
  if (n === "0") return <>{n}</>;
  const [num, rest] = n.includes("/") ? [n.split("/")[0], `/${n.split("/")[1]}`] : [n, ""];
  return <TickRoll value={Number(num)} suffix={rest} mv={mv} at={at} />;
}
