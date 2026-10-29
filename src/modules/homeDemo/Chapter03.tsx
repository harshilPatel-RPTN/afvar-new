"use client";

// Chapter 03 — INTELLIGENCE. The typed question appears over the pulsing
// query node, calc tags surface while the lattice weighs its paths, the
// verdict card crystallises as the output core forms, and the chapter closes
// on the public-track-record promise. All anatomy fields are em-dashes with
// an Illustrative tag — no fabricated numbers anywhere.
import { MotionConfig, motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BullVerdictCard, BullVerdictInView } from "./bull";
import { useChapterStage } from "./chapterStage";
import { WickText } from "./kinetic";
import { CALCS, CAPTIONS, DOM3, QUESTION, SETTLED_P } from "./intelligenceConfig";
import { CopyScrim, RampFade, WindowFade } from "./reveal";
import { HAIR, MONO, REGISTER_HREF } from "./ui";

const IntelligenceScene = dynamic(() => import("./IntelligenceScene"), { ssr: false });

export function Chapter03() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));
  // The bull rides a spring on the scroll so the lunge feels physical, not scrubbed.
  const bullP = useSpring(scrollYProgress, { stiffness: 170, damping: 30, mass: 0.6 });

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative bg-[#080A0B] text-[#F5F7F7] ${cinematic ? "lg:h-[420vh]" : ""}`} aria-label="Chapter 03 — Intelligence">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              <div className="absolute inset-0">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><IntelligenceScene progress={progressRef} active={active} still={false} /></div> : null}
              </div>

              <div className="pointer-events-none absolute inset-0">
                {/* chapter label + progress line */}
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-[#F5F7F7]">03</span> / Intelligence
                  </p>
                  <div className="mt-3 h-px w-28 bg-[rgba(255,255,255,0.12)]">
                    <motion.div className="h-px origin-left bg-[#00E676]" style={{ scaleX: barScale }} />
                  </div>
                </div>

                {/* the question, typed in plain words */}
                <WindowFade mv={scrollYProgress} w={QUESTION.window} className="absolute bottom-[20vh] left-10 max-w-xl">
                  <p className={`${MONO} text-[#00E676]`}>Ask</p>
                  <p className="mt-2 text-3xl font-medium leading-snug tracking-tight text-[#F5F7F7] xl:text-4xl">&ldquo;{QUESTION.text}&rdquo;</p>
                  <p className={`${MONO} mt-3 text-[#6D7578]`}>{QUESTION.langs}</p>
                </WindowFade>

                {/* stage captions */}
                <div className="absolute bottom-[20vh] left-10 max-w-xl">
                  {CAPTIONS.map((c, i) => (
                    <WindowFade key={i} mv={scrollYProgress} w={c.window} className="absolute bottom-0 left-0 w-max max-w-xl">
                      <WickText as="p" className="text-3xl font-medium leading-snug tracking-tight text-[#F5F7F7] xl:text-4xl" text={c.text} mv={scrollYProgress} at={[c.window[0], c.window[1]]} />
                    </WindowFade>
                  ))}
                </div>

                {/* calc tags — code computes each step */}
                <div className="absolute right-10 top-1/3 flex flex-col items-end gap-2">
                  {CALCS.map((c) => (
                    <WindowFade key={c.label} mv={scrollYProgress} w={c.window}>
                      <span className={`${MONO} rounded-full border ${HAIR} bg-[#111416] px-3 py-1.5 text-[#A3AAAC]`}>{c.label}</span>
                    </WindowFade>
                  ))}
                </div>

                {/* the verdict card */}
                <WindowFade mv={scrollYProgress} w={DOM3.verdict} className="absolute right-10 top-1/2 w-80 -translate-y-1/2">
                  <BullVerdictCard p={bullP} />
                </WindowFade>

                {/* finale */}
                <CopyScrim mv={scrollYProgress} at={DOM3.finale} />
                <RampFade mv={scrollYProgress} at={DOM3.finale} rise className="absolute left-10 top-1/2 max-w-xl -translate-y-1/2">
                  <FinaleCopy mv={scrollYProgress} at={DOM3.finale} />
                </RampFade>

                <RampFade mv={scrollYProgress} at={DOM3.illustrative} className={`${MONO} absolute bottom-8 right-10 text-[#6D7578]`}>
                  Illustrative · the 3D scene is an illustration, not market data
                </RampFade>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-16 pt-20 sm:px-8">
              <FinaleCopy />
              <BullVerdictInView />
              <div ref={revealRef} className="relative mt-8 h-[55svh] min-h-[320px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><IntelligenceScene progress={progressRef} active={active} still={reduced} /></div> : null}
                <p className={`${MONO} absolute bottom-3 right-4 text-[#6D7578]`}>Illustrative · not market data</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}

function FinaleCopy({ mv, at }: { mv?: MotionValue<number>; at?: readonly [number, number] } = {}) {
  return (
    <div className="pointer-events-auto">
      <p className={`${MONO} text-[#00E676]`}>Intelligence</p>
      <WickText as="h2" className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-[#F5F7F7] sm:text-4xl xl:text-5xl" text="From question to graded in{s|$}ight." mv={mv} at={at} />
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#A3AAAC]">
        Every verdict — BULLISH, BEARISH or WAIT — carries its levels, its invalidation and its reasoning. And every one is graded publicly
        against what price actually did, including every WAIT.
      </p>
      <p className={`${MONO} mt-4 text-[#6D7578]`}>Code computes · the AI explains</p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href="/platform"
          className="afv-cta inline-block rounded-full bg-[#00E676] px-6 py-3 text-sm font-semibold text-[#05130C] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69F0AE]"
        >
          Explore the platform
        </Link>
        <Link href={REGISTER_HREF} prefetch={false} className="text-sm font-medium text-[#A3AAAC] transition-colors hover:text-[#F5F7F7] afv-link">
          Register Now
        </Link>
      </div>
    </div>
  );
}

/** No-WebGL poster: a branching lattice, zero canvas. */
function Poster() {
  return (
    <div className="relative h-full w-full bg-[#080A0B]" aria-hidden="true">
      <div className="absolute left-[18%] top-[48%] h-2 w-2 rounded-full bg-[#69F0AE] shadow-[0_0_20px_5px_rgba(0,230,118,0.5)]" />
      <div className="absolute left-[22%] right-[30%] top-[49%] h-px bg-gradient-to-r from-[rgba(0,230,118,0.5)] via-[rgba(0,230,118,0.2)] to-[rgba(0,230,118,0.55)]" />
      <div className="absolute right-[26%] top-[46%] h-4 w-4 rounded-full bg-[radial-gradient(circle,rgba(0,230,118,0.6),transparent_70%)]" />
    </div>
  );
}
