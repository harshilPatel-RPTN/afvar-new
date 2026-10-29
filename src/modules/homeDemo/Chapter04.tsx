"use client";

// Chapter 04 — CONTEXT. Event chips light as their pillars rise in the scene,
// the next-event card anatomises "consensus vs previous · past reaction"
// during the countdown (em-dashes only, Illustrative tag), and the chapter
// settles on "markets never move in isolation".
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useChapterStage } from "./chapterStage";
import { PanelCard } from "./cards";
import { WickText } from "./kinetic";
import { CAPTIONS, DOM4, EVENTS, FOCUS, SETTLED_P } from "./contextConfig";
import { Chip, CopyScrim, RampFade, WindowFade } from "./reveal";
import { MONO, REGISTER_HREF } from "./ui";

const ContextScene = dynamic(() => import("./ContextScene"), { ssr: false });

export function Chapter04() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative bg-[#080A0B] text-[#F5F7F7] ${cinematic ? "lg:h-[420vh]" : ""}`} aria-label="Chapter 04 — Context">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              <div className="absolute inset-0">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><ContextScene progress={progressRef} active={active} still={false} /></div> : null}
              </div>

              <div className="pointer-events-none absolute inset-0">
                {/* chapter label + progress line */}
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-[#F5F7F7]">04</span> / Context
                  </p>
                  <div className="mt-3 h-px w-28 bg-[rgba(255,255,255,0.12)]">
                    <motion.div className="h-px origin-left bg-[#00E676]" style={{ scaleX: barScale }} />
                  </div>
                </div>

                {/* stage captions */}
                <div className="absolute bottom-[20vh] left-10 max-w-xl">
                  {CAPTIONS.map((c, i) => (
                    <WindowFade key={i} mv={scrollYProgress} w={c.window} className="absolute bottom-0 left-0 w-max max-w-xl">
                      <WickText as="p" className="text-3xl font-medium leading-snug tracking-tight text-[#F5F7F7] xl:text-4xl" text={c.text} mv={scrollYProgress} at={[c.window[0], c.window[1]]} />
                    </WindowFade>
                  ))}
                </div>

                {/* event chips light with their pillars */}
                <div className="absolute bottom-8 left-10 flex gap-6">
                  {EVENTS.map((ev) => (
                    <div key={ev.key} className="flex flex-col gap-0.5">
                      <Chip mv={scrollYProgress} at={ev.reveal} label={ev.key} />
                      <RampFade mv={scrollYProgress} at={ev.reveal}>
                        <span className="text-[11px] text-[#6D7578]">{ev.name}</span>
                      </RampFade>
                    </div>
                  ))}
                </div>

                {/* next-event anatomy — shown during the countdown */}
                <WindowFade mv={scrollYProgress} w={DOM4.card} className="absolute right-10 top-1/2 w-72 -translate-y-1/2">
                  <PanelCard mv={scrollYProgress} at={[DOM4.card[0], DOM4.card[1]]}>
                    <div className="flex items-baseline justify-between">
                      <p className={`${MONO} text-[#00E676]`}>Next event</p>
                      <p className={`${MONO} text-[#6D7578]`}>Illustrative</p>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-[#F5F7F7]">
                      {EVENTS[FOCUS.index].key} <span className="font-normal text-[#A3AAAC]">· {EVENTS[FOCUS.index].name}</span>
                    </p>
                    <dl className="mt-3 space-y-2">
                      {["Countdown", "Consensus", "Previous", "Past reaction"].map((f) => (
                        <div key={f} className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-[#A3AAAC]">{f}</dt>
                          <dd className={`${MONO} text-[#6D7578]`}>—</dd>
                        </div>
                      ))}
                    </dl>
                  </PanelCard>
                </WindowFade>

                {/* finale */}
                <CopyScrim mv={scrollYProgress} at={DOM4.finale} />
                <RampFade mv={scrollYProgress} at={DOM4.finale} rise className="absolute left-10 top-1/2 max-w-xl -translate-y-1/2">
                  <FinaleCopy mv={scrollYProgress} at={DOM4.finale} />
                </RampFade>

                <RampFade mv={scrollYProgress} at={DOM4.illustrative} className={`${MONO} absolute bottom-8 right-10 text-[#6D7578]`}>
                  Illustrative · the 3D scene is an illustration, not market data
                </RampFade>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-16 pt-20 sm:px-8">
              <FinaleCopy />
              <div className="mt-8 grid gap-3 sm:grid-cols-4">
                {EVENTS.map((ev, i) => (
                  <PanelCard key={ev.key} index={i} bodyClassName="p-4">
                    <p className={`${MONO} text-[#F5F7F7]`}>{ev.key}</p>
                    <p className="mt-1 text-[12px] text-[#6D7578]">{ev.name}</p>
                  </PanelCard>
                ))}
              </div>
              <div ref={revealRef} className="relative mt-8 h-[55svh] min-h-[320px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><ContextScene progress={progressRef} active={active} still={reduced} /></div> : null}
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
      <p className={`${MONO} text-[#00E676]`}>Context</p>
      <WickText as="h2" className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-[#F5F7F7] sm:text-4xl xl:text-5xl" text="Mark{e|€}ts never move in isolation." mv={mv} at={at} />
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#A3AAAC]">
        News, economic calendar and market briefs tied to the instruments they move — with the source and freshness on every number.
      </p>
      <p className={`${MONO} mt-4 text-[#6D7578]`}>FOMC · CPI · NFP · EIA — counted down, in context</p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href="/platform/research"
          className="afv-cta inline-block rounded-full bg-[#00E676] px-6 py-3 text-sm font-semibold text-[#05130C] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69F0AE]"
        >
          Explore research
        </Link>
        <Link href={REGISTER_HREF} prefetch={false} className="text-sm font-medium text-[#A3AAAC] transition-colors hover:text-[#F5F7F7] afv-link">
          Register Now
        </Link>
      </div>
    </div>
  );
}

/** No-WebGL poster: a line with event markers, zero canvas. */
function Poster() {
  return (
    <div className="relative h-full w-full bg-[#080A0B]" aria-hidden="true">
      <div className="absolute inset-x-[10%] top-[52%] h-px bg-gradient-to-r from-transparent via-[rgba(0,230,118,0.5)] to-transparent" />
      {[22, 42, 62, 80].map((left, i) => (
        <div key={i} className="absolute top-[36%] h-[16%] w-px bg-gradient-to-b from-[rgba(0,230,118,0.6)] to-transparent" style={{ left: `${left}%` }} />
      ))}
    </div>
  );
}
