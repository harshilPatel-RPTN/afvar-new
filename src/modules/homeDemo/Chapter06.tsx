"use client";

// Chapter 06 — RISK GUARDIAN. The plain-words limit, the Guardian's warning
// card — "Warning only · it never acts on your account" — and the 0-order-
// buttons close. Em-dash anatomy with Illustrative tags; the one illustrative
// sentence ("2% daily loss") is the documented product example.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BearSwipe, useMomentWindow } from "./beasts";
import { useChapterStage } from "./chapterStage";
import { PanelCard } from "./cards";
import { WickText } from "./kinetic";
import { CopyScrim, RampFade, WindowFade } from "./reveal";
import { CAPTIONS, DOM6, SENTENCE6, SETTLED_P } from "./riskConfig";
import { HAIR, MONO, REGISTER_HREF } from "./ui";

const RiskScene = dynamic(() => import("./RiskScene"), { ssr: false });

export function Chapter06() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative text-(--afvar-text) ${cinematic ? "lg:h-[420vh]" : ""}`} aria-label="Chapter 06 — Risk Guardian">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              <div className="absolute inset-0">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><RiskScene progress={progressRef} active={active} still={false} /></div> : null}
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-(--afvar-text)">06</span> / Risk Guardian
                  </p>
                  <div className="mt-3 h-px w-28 bg-[rgba(255,255,255,0.12)]">
                    <motion.div className="h-px origin-left bg-(--afvar-mint)" style={{ scaleX: barScale }} />
                  </div>
                </div>

                {/* stage captions */}
                <div className="absolute bottom-[20vh] left-10 max-w-xl">
                  {CAPTIONS.map((c, i) => (
                    <WindowFade key={i} mv={scrollYProgress} w={c.window} className="absolute bottom-0 left-0 w-max max-w-xl">
                      <WickText as="p" className="text-3xl font-medium leading-snug tracking-tight text-(--afvar-text) xl:text-4xl" text={c.text} mv={scrollYProgress} at={[c.window[0], c.window[1]]} tone="down" />
                    </WindowFade>
                  ))}
                </div>

                {/* the plain-words limit, confirmed back */}
                <WindowFade mv={scrollYProgress} w={SENTENCE6.window} className="absolute right-10 top-1/2 w-80 -translate-y-1/2">
                  <PanelCard mv={scrollYProgress} at={[SENTENCE6.window[0], SENTENCE6.window[1]]}>
                    <p className={`${MONO} text-(--afvar-mint)`}>You say</p>
                    <p className="mt-2 text-xl font-medium text-(--afvar-text)">&ldquo;{SENTENCE6.text}&rdquo;</p>
                    <dl className="mt-4 space-y-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-[#A3AAAC]">Daily loss limit</dt>
                        <dd className={`${MONO} text-(--afvar-mint)`}>Set</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-[#A3AAAC]">Drawdown · margin</dt>
                        <dd className={`${MONO} text-[#6D7578]`}>Watched</dd>
                      </div>
                    </dl>
                    <p className={`${MONO} mt-4 text-[#6D7578]`}>Confirmed back before it arms</p>
                  </PanelCard>
                </WindowFade>

                {/* the warning — and only a warning */}
                <WindowFade mv={scrollYProgress} w={DOM6.warningCard} className="absolute right-10 top-1/2 w-80 -translate-y-1/2">
                  <PanelCard mv={scrollYProgress} at={[DOM6.warningCard[0], DOM6.warningCard[1]]} tone="down">
                    <div className="flex items-baseline justify-between">
                      <p className={`${MONO} text-[#FF3B3B]`}>Risk Guardian · Warning</p>
                      <p className={`${MONO} text-[#6D7578]`}>Illustrative</p>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-(--afvar-text)">Daily loss approaching your limit</p>
                    <dl className="mt-3 space-y-2">
                      {["Daily loss", "Drawdown", "Margin"].map((f) => (
                        <div key={f} className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-[#A3AAAC]">{f}</dt>
                          <dd className={`${MONO} text-[#6D7578]`}>—</dd>
                        </div>
                      ))}
                    </dl>
                    <p className={`${MONO} mt-5 border-t ${HAIR} pt-4 text-(--afvar-text)`}>Warning only — it never acts on your account</p>
                  </PanelCard>
                </WindowFade>

                {/* finale */}
                <CopyScrim mv={scrollYProgress} at={DOM6.finale} />
                <RampFade mv={scrollYProgress} at={DOM6.finale} rise className="absolute left-10 top-1/2 max-w-xl -translate-y-1/2">
                  <FinaleCopy mv={scrollYProgress} at={DOM6.finale} />
                </RampFade>

                <RampFade mv={scrollYProgress} at={DOM6.illustrative} className={`${MONO} absolute bottom-8 right-10 text-[#6D7578]`}>
                  Illustrative · the 3D scene is an illustration, not market data
                </RampFade>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-16 pt-20 sm:px-8">
              <FinaleCopy />
              <PanelCard className="mt-8 max-w-sm">
                <p className={`${MONO} text-(--afvar-mint)`}>You say</p>
                <p className="mt-2 text-base text-(--afvar-text)">&ldquo;{SENTENCE6.text}&rdquo;</p>
                <p className={`${MONO} mt-3 text-[#6D7578]`}>Daily loss · drawdown · margin — watched. Warning only.</p>
              </PanelCard>
              <div ref={revealRef} className="relative mt-8 h-[55svh] min-h-[320px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><RiskScene progress={progressRef} active={active} still={reduced} /></div> : null}
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
  const beastP = useMomentWindow(mv, at);
  return (
    <div className="pointer-events-auto">
      <p className={`${MONO} text-(--afvar-mint)`}>Risk Guardian</p>
      <BearSwipe p={beastP}>
        <WickText as="h2" className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-(--afvar-text) sm:text-4xl xl:text-5xl" text="It warns. It n{e|€}ver acts." mv={mv} at={at} tone="down" />
      </BearSwipe>
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#A3AAAC]">
        Read-only broker connections, exposure, personal limits and a journal. Risk Guardian warns — it never acts on your account.
      </p>
      <p className={`${MONO} mt-4 text-[#6D7578]`}>0 order buttons · read-only by design</p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href="/platform/trade-review"
          className="afvar-glass-button afvar-glass-primary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
        >
          Explore risk &amp; review
        </Link>
        <Link href={REGISTER_HREF} prefetch={false} className="text-sm font-medium text-[#A3AAAC] transition-colors hover:text-(--afvar-text) afv-link">
          Register Now
        </Link>
      </div>
    </div>
  );
}

/** No-WebGL poster: a core inside a perimeter, zero canvas. */
function Poster() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,230,118,0.35)]" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,230,118,0.15)]" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#69F0AE] shadow-[0_0_24px_6px_rgba(0,230,118,0.5)]" />
    </div>
  );
}
