"use client";

// Chapter 09 — WHY AFVAR. The quiet chapter: three large words, one at a time,
// then the three reasons and the evidence promise held on a dimmed scene.
// Shorter track (320vh) — breathing room, not another set piece.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useChapterStage } from "./chapterStage";
import { RollNumber } from "@/modules/home/kit";
import { PanelCard } from "./cards";
import { WickText } from "./kinetic";
import { RampFade, WindowFade } from "./reveal";
import { MONO } from "./ui";
import { DOM9, EVIDENCE, REASONS, SETTLED_P, WORDS } from "./whyConfig";

const WhyScene = dynamic(() => import("./WhyScene"), { ssr: false });

export function Chapter09() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl } = useChapterStage(SETTLED_P);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative text-(--afvar-text) ${cinematic ? "lg:h-[320vh]" : ""}`} aria-label="Chapter 09 — Why AFVAR">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              <div className="absolute inset-0">
                {/* shown until the scene's first frame paints over it (and as the no-WebGL fallback) */}
                <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_55%,rgba(0,230,118,0.12),transparent_70%)]" />
                {webgl !== false && mounted ? <div className="absolute inset-0"><WhyScene progress={progressRef} active={active} still={false} /></div> : null}
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-(--afvar-text)">09</span> / Why AFVAR
                  </p>
                  <div className="mt-3 h-px w-28 bg-[rgba(255,255,255,0.12)]">
                    <motion.div className="h-px origin-left bg-(--afvar-mint)" style={{ scaleX: barScale }} />
                  </div>
                </div>

                {/* three words, one at a time */}
                <div className="absolute left-10 top-1/2 -translate-y-1/2">
                  {WORDS.map((w) => (
                    <WindowFade key={w.text} mv={scrollYProgress} w={w.window} className="absolute left-0 top-0 -translate-y-1/2">
                      <WickText as="p" className="text-7xl font-semibold tracking-tight text-(--afvar-text) xl:text-8xl" text={w.text} mv={scrollYProgress} at={[w.window[0], w.window[1]]} by="char" />
                    </WindowFade>
                  ))}
                </div>

                {/* the reasons hold on the dimmed scene */}
                <RampFade mv={scrollYProgress} at={DOM9.reasons} rise className="absolute inset-x-10 bottom-8 top-[104px] mx-auto flex max-w-[1100px] flex-col [justify-content:safe_center]">
                  <Reasons mv={scrollYProgress} at={DOM9.reasons} />
                </RampFade>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-16 pt-20 sm:px-8">
              <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Follow. Understand. <span className="text-(--afvar-mint)">Review.</span>
              </p>
              <div className="mt-10">
                <Reasons />
              </div>
            </div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}

function Reasons({ mv, at }: { mv?: MotionValue<number>; at?: readonly [number, number] } = {}) {
  return (
    <div className="pointer-events-auto">
      <p className={`${MONO} text-(--afvar-mint)`}>Why AFVAR</p>
      <WickText as="h2" className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-(--afvar-text) sm:text-4xl xl:text-5xl" text="Built so {e|€}very number can defend itself." mv={mv} at={at} />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {REASONS.map((r, i) => (
          <PanelCard key={r.title} mv={mv} at={at} index={i} bodyClassName="p-6">
            <RollNumber value={`0${i + 1}`} className="font-mono text-[11px] tracking-wide text-(--mk-faint)" />
            <h3 className="mt-3 text-lg font-semibold text-(--mk-text)">{r.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-(--mk-dim)">{r.body}</p>
          </PanelCard>
        ))}
      </div>
      {/* evidence banner: fine green-to-red hairline on top */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/[.11] bg-(--afvar-panel)">
        <div className="h-[2px] bg-gradient-to-r from-(--afvar-mint) to-(--afvar-crimson)" />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-(--afvar-text)">{EVIDENCE}</p>
          <Link href="/platform/research" className="shrink-0 text-sm font-medium text-(--afvar-mint) afv-link">
            Explore our evidence
          </Link>
        </div>
      </div>
    </div>
  );
}
