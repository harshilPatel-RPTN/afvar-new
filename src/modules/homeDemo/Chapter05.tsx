"use client";

// Chapter 05 — ALERTS & STRATEGY. The plain-words sentence, AFVAR's repeat-back
// confirmation, the armed captions, and the fired-alert card — all synced to
// the scene's gates, scanner and threshold break. Em-dash anatomy only, with
// Illustrative tags; no fabricated values.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CAPTIONS, DOM5, SENTENCE, SETTLED_P, STEPS } from "./alertsConfig";
import { useChapterStage } from "./chapterStage";
import { PanelCard } from "./cards";
import { ramp } from "./timeline";
import { WickText } from "./kinetic";
import { CopyScrim, RampFade, WindowFade } from "./reveal";
import { HAIR, MONO, REGISTER_HREF } from "./ui";

const AlertsScene = dynamic(() => import("./AlertsScene"), { ssr: false });

export function Chapter05() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative bg-[#080A0B] text-[#F5F7F7] ${cinematic ? "lg:h-[420vh]" : ""}`} aria-label="Chapter 05 — Alerts & Strategy">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              <div className="absolute inset-0">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><AlertsScene progress={progressRef} active={active} still={false} /></div> : null}
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-[#F5F7F7]">05</span> / Alerts &amp; Strategy
                  </p>
                  <div className="mt-3 h-px w-28 bg-[rgba(255,255,255,0.12)]">
                    <motion.div className="h-px origin-left bg-[#00E676]" style={{ scaleX: barScale }} />
                  </div>
                </div>

                {/* four-step tracker: where the alert is right now */}
                <StepTracker mv={scrollYProgress} />

                {/* the plain-words sentence */}
                <WindowFade mv={scrollYProgress} w={SENTENCE.window} className="absolute bottom-[20vh] left-10 max-w-xl">
                  <p className={`${MONO} text-[#00E676]`}>You say</p>
                  <p className="mt-2 text-3xl font-medium leading-snug tracking-tight text-[#F5F7F7] xl:text-4xl">&ldquo;{SENTENCE.text}&rdquo;</p>
                </WindowFade>

                {/* stage captions */}
                <div className="absolute bottom-[20vh] left-10 max-w-xl">
                  {CAPTIONS.map((c, i) => (
                    <WindowFade key={i} mv={scrollYProgress} w={c.window} className="absolute bottom-0 left-0 w-max max-w-xl">
                      <WickText as="p" className="text-3xl font-medium leading-snug tracking-tight text-[#F5F7F7] xl:text-4xl" text={c.text} mv={scrollYProgress} at={[c.window[0], c.window[1]]} />
                    </WindowFade>
                  ))}
                </div>

                {/* AFVAR repeats it back — confirmed before anything is armed */}
                <WindowFade mv={scrollYProgress} w={DOM5.confirmCard} className="absolute right-10 top-1/2 w-80 -translate-y-1/2">
                  <PanelCard mv={scrollYProgress} at={[DOM5.confirmCard[0], DOM5.confirmCard[1]]}>
                    <p className={`${MONO} text-[#00E676]`}>AFVAR repeats it back</p>
                    <dl className="mt-3 space-y-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-[#A3AAAC]">Condition 1</dt>
                        <dd className={`${MONO} text-[#F5F7F7]`}>Close &gt; weekly high</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-[#A3AAAC]">Condition 2</dt>
                        <dd className={`${MONO} text-[#F5F7F7]`}>RSI &gt; 70</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex gap-2">
                      <span className={`${MONO} border border-[#00E676] px-3 py-1.5 text-[#00E676]`}>Confirm</span>
                      <span className={`${MONO} border ${HAIR} px-3 py-1.5 text-[#6D7578]`}>Edit</span>
                    </div>
                    <p className={`${MONO} mt-4 text-[#6D7578]`}>Nothing arms until you confirm</p>
                  </PanelCard>
                </WindowFade>

                {/* the fired alert */}
                <WindowFade mv={scrollYProgress} w={DOM5.alertCard} className="absolute right-10 top-1/2 w-80 -translate-y-1/2">
                  <PanelCard mv={scrollYProgress} at={[DOM5.alertCard[0], DOM5.alertCard[1]]}>
                    <div className="flex items-baseline justify-between">
                      <p className={`${MONO} text-[#00E676]`}>Alert fired</p>
                      <p className={`${MONO} text-[#6D7578]`}>Illustrative</p>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-[#F5F7F7]">XAUUSD · closed candle</p>
                    <dl className="mt-3 space-y-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-[#A3AAAC]">Close &gt; weekly high</dt>
                        <dd className={`${MONO} text-[#00E676]`}>True</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-[#A3AAAC]">RSI &gt; 70</dt>
                        <dd className={`${MONO} text-[#00E676]`}>True</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-[#A3AAAC]">Delivered</dt>
                        <dd className={`${MONO} text-[#6D7578]`}>In-app · push · voice</dd>
                      </div>
                    </dl>
                  </PanelCard>
                </WindowFade>

                {/* finale */}
                <CopyScrim mv={scrollYProgress} at={DOM5.finale} />
                <RampFade mv={scrollYProgress} at={DOM5.finale} rise className="absolute left-10 top-1/2 max-w-xl -translate-y-1/2">
                  <FinaleCopy mv={scrollYProgress} at={DOM5.finale} />
                </RampFade>

                <RampFade mv={scrollYProgress} at={DOM5.illustrative} className={`${MONO} absolute bottom-8 right-10 text-[#6D7578]`}>
                  Illustrative · the 3D scene is an illustration, not market data
                </RampFade>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-16 pt-20 sm:px-8">
              <FinaleCopy />
              <PanelCard className="mt-8 max-w-sm">
                <p className={`${MONO} text-[#00E676]`}>You say</p>
                <p className="mt-2 text-base text-[#F5F7F7]">&ldquo;{SENTENCE.text}&rdquo;</p>
                <p className={`${MONO} mt-3 text-[#6D7578]`}>Repeated back · confirmed · checked on closed candles</p>
              </PanelCard>
              <div ref={revealRef} className="relative mt-8 h-[55svh] min-h-[320px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><AlertsScene progress={progressRef} active={active} still={reduced} /></div> : null}
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
      <p className={`${MONO} text-[#00E676]`}>Alerts &amp; Strategy</p>
      <WickText as="h2" className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-[#F5F7F7] sm:text-4xl xl:text-5xl" text="{E|€}valuate ideas. In plain words." mv={mv} at={at} />
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#A3AAAC]">
        Plain-words alerts, screeners and strategy tests — repeated back and confirmed before anything is armed. Costs and assumptions stay
        visible.
      </p>
      <p className={`${MONO} mt-4 text-[#6D7578]`}>Checked by code · on closed candles</p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href="/platform/alerts"
          className="afv-cta inline-block rounded-full bg-[#00E676] px-6 py-3 text-sm font-semibold text-[#05130C] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69F0AE]"
        >
          Explore alerts &amp; tools
        </Link>
        <Link href={REGISTER_HREF} prefetch={false} className="text-sm font-medium text-[#A3AAAC] transition-colors hover:text-[#F5F7F7] afv-link">
          Register Now
        </Link>
      </div>
    </div>
  );
}

/** No-WebGL poster: a line breaking a level, zero canvas. */
function Poster() {
  return (
    <div className="relative h-full w-full bg-[#080A0B]" aria-hidden="true">
      <div className="absolute inset-x-[12%] top-[44%] h-px bg-[rgba(0,230,118,0.4)]" />
      <div className="absolute inset-x-[12%] top-[58%] h-px bg-gradient-to-r from-transparent via-[rgba(0,230,118,0.5)] to-transparent" />
      <div className="absolute right-[18%] top-[38%] h-2 w-2 rounded-full bg-[#69F0AE] shadow-[0_0_20px_5px_rgba(0,230,118,0.5)]" />
    </div>
  );
}


/** "1 You say it → 2 AFVAR confirms → 3 Armed & watching → 4 Alert fires" —
 *  the current step is lit green, finished steps white, upcoming ones dim. */
function StepTracker({ mv }: { mv: MotionValue<number> }) {
  // Steps aside before the closing copy takes the left column.
  const opacity = useTransform(mv, (p) => 1 - ramp(p, DOM5.finale[0] - 0.04, DOM5.finale[0]));
  return (
    <motion.ol className="absolute left-10 top-44 flex flex-col gap-2" aria-label="How an alert works" style={{ opacity }}>
      {STEPS.map((step, i) => (
        <Step key={step.label} mv={mv} n={i + 1} label={step.label} at={step.at} />
      ))}
    </motion.ol>
  );
}

function Step({ mv, n, label, at }: { mv: MotionValue<number>; n: number; label: string; at: readonly [number, number] }) {
  const color = useTransform(mv, (p) => (p >= at[0] && p < at[1] ? "#00E676" : p >= at[1] ? "#F5F7F7" : "#4A4A4F"));
  const bar = useTransform(mv, (p) => Math.max(0.001, ramp(p, at[0], at[1])));
  return (
    <motion.li className={`${MONO} flex items-center gap-3`} style={{ color }}>
      <span className="w-4 tabular-nums">{n}</span>
      <span className="relative h-px w-10 bg-[rgba(255,255,255,0.12)]">
        <motion.span className="absolute inset-0 origin-left bg-current" style={{ scaleX: bar }} />
      </span>
      <span>{label}</span>
    </motion.li>
  );
}
