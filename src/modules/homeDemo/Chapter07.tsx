"use client";

// Chapter 07 — JOURNAL. Captions, a journal-entry anatomy card while trades
// are tagged, and an illustrative pattern card while the threads draw — then
// the review copy. Em-dash anatomy with Illustrative tags; no fabricated stats.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useChapterStage } from "./chapterStage";
import { PanelCard } from "./cards";
import { WickText } from "./kinetic";
import { CAPTIONS, DOM7, SETTLED_P } from "./journalConfig";
import { CopyScrim, RampFade, WindowFade } from "./reveal";
import { HAIR, MONO, REGISTER_HREF } from "./ui";

const JournalScene = dynamic(() => import("./JournalScene"), { ssr: false });

export function Chapter07() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative text-(--afvar-text) ${cinematic ? "lg:h-[420vh]" : ""}`} aria-label="Chapter 07 — Journal">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              <div className="absolute inset-0">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><JournalScene progress={progressRef} active={active} still={false} /></div> : null}
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-(--afvar-text)">07</span> / Journal
                  </p>
                  <div className="mt-3 h-px w-28 bg-[rgba(255,255,255,0.12)]">
                    <motion.div className="h-px origin-left bg-(--afvar-mint)" style={{ scaleX: barScale }} />
                  </div>
                </div>

                <div className="absolute bottom-[20vh] left-10 max-w-xl">
                  {CAPTIONS.map((c, i) => (
                    <WindowFade key={i} mv={scrollYProgress} w={c.window} className="absolute bottom-0 left-0 w-max max-w-xl">
                      <WickText as="p" className="text-3xl font-medium leading-snug tracking-tight text-(--afvar-text) xl:text-4xl" text={c.text} mv={scrollYProgress} at={[c.window[0], c.window[1]]} />
                    </WindowFade>
                  ))}
                </div>

                {/* journal entry anatomy */}
                <WindowFade mv={scrollYProgress} w={DOM7.entryCard} className="absolute right-10 top-1/2 w-80 -translate-y-1/2">
                  <PanelCard mv={scrollYProgress} at={[DOM7.entryCard[0], DOM7.entryCard[1]]}>
                    <div className="flex items-baseline justify-between">
                      <p className={`${MONO} text-(--afvar-mint)`}>Journal entry</p>
                      <p className={`${MONO} text-[#6D7578]`}>Illustrative</p>
                    </div>
                    <dl className="mt-3 space-y-2">
                      {["Instrument", "Entry", "Exit", "Result"].map((f) => (
                        <div key={f} className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-[#A3AAAC]">{f}</dt>
                          <dd className={`${MONO} text-[#6D7578]`}>—</dd>
                        </div>
                      ))}
                    </dl>
                    <div className={`mt-4 flex gap-2 border-t ${HAIR} pt-4`}>
                      <span className={`${MONO} border border-[#00E676] px-2.5 py-1 text-[#00E676]`}>Plan followed</span>
                      <span className={`${MONO} border border-[rgba(255,59,59,0.6)] px-2.5 py-1 text-[#FF3B3B]`}>Plan broken</span>
                    </div>
                  </PanelCard>
                </WindowFade>

                {/* the pattern */}
                <WindowFade mv={scrollYProgress} w={DOM7.patternCard} className="absolute right-10 top-1/2 w-80 -translate-y-1/2">
                  <PanelCard mv={scrollYProgress} at={[DOM7.patternCard[0], DOM7.patternCard[1]]}>
                    <div className="flex items-baseline justify-between">
                      <p className={`${MONO} text-(--afvar-mint)`}>Pattern</p>
                      <p className={`${MONO} text-[#6D7578]`}>Illustrative</p>
                    </div>
                    <dl className="mt-3 space-y-3">
                      <div>
                        <dt className={`${MONO} text-(--afvar-mint)`}>Plan followed</dt>
                        <dd className="mt-1 text-sm text-[#A3AAAC]">Wins and losses — the plan held either way.</dd>
                      </div>
                      <div>
                        <dt className={`${MONO} text-[#FF3B3B]`}>Plan broken</dt>
                        <dd className="mt-1 text-sm text-[#A3AAAC]">The losses cluster here.</dd>
                      </div>
                    </dl>
                  </PanelCard>
                </WindowFade>

                <CopyScrim mv={scrollYProgress} at={DOM7.finale} />

                <RampFade mv={scrollYProgress} at={DOM7.finale} rise className="absolute left-10 top-1/2 max-w-xl -translate-y-1/2">
                  <FinaleCopy mv={scrollYProgress} at={DOM7.finale} />
                </RampFade>

                <RampFade mv={scrollYProgress} at={DOM7.illustrative} className={`${MONO} absolute bottom-8 right-10 text-[#6D7578]`}>
                  Illustrative · the 3D scene is an illustration, not trading data
                </RampFade>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-16 pt-20 sm:px-8">
              <FinaleCopy />
              <div className={`mt-8 flex max-w-sm gap-2`}>
                <span className={`${MONO} border border-[#00E676] px-2.5 py-1 text-[#00E676]`}>Plan followed</span>
                <span className={`${MONO} border border-[rgba(255,59,59,0.6)] px-2.5 py-1 text-[#FF3B3B]`}>Plan broken</span>
              </div>
              <div ref={revealRef} className="relative mt-8 h-[55svh] min-h-[320px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><JournalScene progress={progressRef} active={active} still={reduced} /></div> : null}
                <p className={`${MONO} absolute bottom-3 right-4 text-[#6D7578]`}>Illustrative · not trading data</p>
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
      <p className={`${MONO} text-(--afvar-mint)`}>Journal</p>
      <WickText as="h2" className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-(--afvar-text) sm:text-4xl xl:text-5xl" text="{R|₹}eview your trading. See your discipline." mv={mv} at={at} />
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#A3AAAC]">
        Read-only broker connections, exposure, personal limits and a journal — every session replayed, reviewed and learned from.
      </p>
      <p className={`${MONO} mt-4 text-[#6D7578]`}>Pre-launch · in development</p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href="/platform/trade-review"
          className="afvar-glass-button afvar-glass-primary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
        >
          Explore trade review
        </Link>
        <Link href={REGISTER_HREF} prefetch={false} className="text-sm font-medium text-[#A3AAAC] transition-colors hover:text-(--afvar-text) afv-link">
          Register Now
        </Link>
      </div>
    </div>
  );
}

/** No-WebGL poster: arcs on a timeline, zero canvas. */
function Poster() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="absolute inset-x-[10%] top-[60%] h-px bg-[rgba(0,230,118,0.35)]" />
      {[
        [14, 8, true],
        [26, 5, false],
        [38, 10, true],
        [52, 6, false],
        [64, 11, true],
        [78, 7, false],
      ].map(([left, w, win], i) => (
        <div
          key={i}
          className={`absolute top-[48%] h-[12%] rounded-t-full border-x border-t ${win ? "border-[rgba(0,230,118,0.5)]" : "border-[rgba(255,59,59,0.5)]"}`}
          style={{ left: `${left}%`, width: `${w}%` }}
        />
      ))}
    </div>
  );
}
