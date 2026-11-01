"use client";

// Chapter 10 — THE DESK. Captions over the assembly, a dock strip whose eight
// app names light as their panels land, and — after everything collapses into
// the first tick — the wordmark and the call to join the launch queue.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BullBearFaceoff, useMomentWindow } from "./beasts";
import { useChapterStage } from "./chapterStage";
import { WickText } from "./kinetic";
import { CAPTIONS, DOM10, PANELS, SETTLED_P, assembleAt } from "./deskConfig";
import { Chip, RampFade, WindowFade } from "./reveal";
import { HAIR, MONO, REGISTER_HREF } from "./ui";

const DeskScene = dynamic(() => import("./DeskScene"), { ssr: false });

export function Chapter10() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative text-(--afvar-text) ${cinematic ? "lg:h-[420vh]" : ""}`} aria-label="Chapter 10 — The Desk">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              <div className="absolute inset-0">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><DeskScene progress={progressRef} active={active} still={false} /></div> : null}
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-(--afvar-text)">10</span> / The Desk
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

                {/* dock: eight apps, each lighting as its window lands */}
                <WindowFade mv={scrollYProgress} w={DOM10.dock} className="absolute bottom-8 left-1/2 -translate-x-1/2">
                  <div className={`flex gap-5 rounded-2xl border ${HAIR} bg-(--afvar-panel) px-5 py-3`}>
                    {PANELS.map((panel, i) => (
                      <Chip key={panel.key} mv={scrollYProgress} at={assembleAt(i)} label={panel.label} />
                    ))}
                  </div>
                </WindowFade>

                {/* finale: the world is one tick again — wordmark + launch queue */}
                <RampFade mv={scrollYProgress} at={DOM10.finale} rise className="absolute inset-x-0 top-[58%] text-center">
                  <FinaleCopy centered mv={scrollYProgress} at={DOM10.finale} />
                </RampFade>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-16 pt-20 sm:px-8">
              <FinaleCopy />
              <div className="mt-8 flex flex-wrap gap-2">
                {PANELS.map((panel) => (
                  <span key={panel.key} className={`${MONO} rounded-full border ${HAIR} bg-(--afvar-panel) px-3 py-2 text-(--afvar-text)`}>
                    {panel.label}
                  </span>
                ))}
              </div>
              <div ref={revealRef} className="relative mt-8 h-[55svh] min-h-[320px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><DeskScene progress={progressRef} active={active} still={reduced} /></div> : null}
                <p className={`${MONO} absolute bottom-3 right-4 text-[#6D7578]`}>Illustrative</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}

function FinaleCopy({ centered, mv, at }: { centered?: boolean; mv?: MotionValue<number>; at?: readonly [number, number] }) {
  const faceoffP = useMomentWindow(mv, at);
  return (
    <div className={`pointer-events-auto ${centered ? "mx-auto max-w-xl" : ""}`}>
      <WickText as="p" className="text-5xl font-semibold tracking-tight text-(--afvar-text) sm:text-6xl" text="AFVAR" by="char" mv={mv} at={at} />
      <BullBearFaceoff p={faceoffP} className="mx-auto mt-1 w-full max-w-md" />
      <p className="mt-3 text-lg text-[#A3AAAC]">The AI operating system for trading.</p>
      <div className={`mt-7 flex flex-wrap items-center gap-4 ${centered ? "justify-center" : ""}`}>
        <Link
          href={REGISTER_HREF} prefetch={false}
          className="afvar-glass-button afvar-glass-primary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
        >
          Register Now
        </Link>
        <a href="#launch-queue" className="text-sm font-medium text-[#A3AAAC] transition-colors hover:text-(--afvar-text) afv-link">
          Join the launch queue
        </a>
      </div>
    </div>
  );
}

/** No-WebGL poster: a workspace of windows, zero canvas. */
function Poster() {
  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden="true">
      <div className="grid h-[52%] w-[62%] grid-cols-[2fr_1fr] grid-rows-[3fr_1fr] gap-2">
        <div className="border border-[rgba(0,230,118,0.3)] bg-[#0c110e]" />
        <div className="border border-[rgba(255,255,255,0.08)] bg-[#0c110e]" />
        <div className="border border-[rgba(255,255,255,0.08)] bg-[#0c110e]" />
        <div className="border border-[rgba(255,255,255,0.08)] bg-[#0c110e]" />
      </div>
    </div>
  );
}
