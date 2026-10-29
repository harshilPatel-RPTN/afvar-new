"use client";

// Chapter 08 — COMMUNITY. Room chips light as their rooms rise, captions carry
// the story, and a verified-record card appears with the halos. Room set
// follows the built /communities page; no member counts or results invented.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useChapterStage } from "./chapterStage";
import { PanelCard } from "./cards";
import { WickText } from "./kinetic";
import { CAPTIONS, DOM8, ROOMS, SETTLED_P, roomRiseAt } from "./communityConfig";
import { Chip, CopyScrim, RampFade, WindowFade } from "./reveal";
import { HAIR, MONO, REGISTER_HREF } from "./ui";

const CommunityScene = dynamic(() => import("./CommunityScene"), { ssr: false });

export function Chapter08() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative bg-[#080A0B] text-[#F5F7F7] ${cinematic ? "lg:h-[420vh]" : ""}`} aria-label="Chapter 08 — Community">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              <div className="absolute inset-0">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><CommunityScene progress={progressRef} active={active} still={false} /></div> : null}
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-[#F5F7F7]">08</span> / Community
                  </p>
                  <div className="mt-3 h-px w-28 bg-[rgba(255,255,255,0.12)]">
                    <motion.div className="h-px origin-left bg-[#00E676]" style={{ scaleX: barScale }} />
                  </div>
                </div>

                <div className="absolute bottom-[20vh] left-10 max-w-xl">
                  {CAPTIONS.map((c, i) => (
                    <WindowFade key={i} mv={scrollYProgress} w={c.window} className="absolute bottom-0 left-0 w-max max-w-xl">
                      <WickText as="p" className="text-3xl font-medium leading-snug tracking-tight text-[#F5F7F7] xl:text-4xl" text={c.text} mv={scrollYProgress} at={[c.window[0], c.window[1]]} />
                    </WindowFade>
                  ))}
                </div>

                {/* official room chips light with their rooms */}
                <div className="absolute bottom-8 left-10">
                  <p className={`${MONO} text-[#A3AAAC]`}>Official rooms</p>
                  <div className="mt-2 flex gap-5">
                    {ROOMS.map((room, i) => (
                      <Chip key={room.key} mv={scrollYProgress} at={roomRiseAt(i)} label={room.label} />
                    ))}
                  </div>
                </div>

                {/* verified record anatomy */}
                <WindowFade mv={scrollYProgress} w={DOM8.recordCard} className="absolute right-10 top-1/2 w-80 -translate-y-1/2">
                  <PanelCard mv={scrollYProgress} at={[DOM8.recordCard[0], DOM8.recordCard[1]]}>
                    <div className="flex items-baseline justify-between">
                      <p className={`${MONO} text-[#00E676]`}>Verified record</p>
                      <p className={`${MONO} text-[#6D7578]`}>Illustrative</p>
                    </div>
                    <dl className="mt-3 space-y-2">
                      {["Member", "Room", "Shared charts", "Record"].map((f) => (
                        <div key={f} className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-[#A3AAAC]">{f}</dt>
                          <dd className={`${MONO} text-[#6D7578]`}>—</dd>
                        </div>
                      ))}
                    </dl>
                    <p className={`${MONO} mt-5 border-t ${HAIR} pt-4 text-[#6D7578]`}>AI summaries labelled · polls hide results until you vote</p>
                  </PanelCard>
                </WindowFade>

                <CopyScrim mv={scrollYProgress} at={DOM8.finale} />

                <RampFade mv={scrollYProgress} at={DOM8.finale} rise className="absolute left-10 top-1/2 max-w-xl -translate-y-1/2">
                  <FinaleCopy mv={scrollYProgress} at={DOM8.finale} />
                </RampFade>

                <RampFade mv={scrollYProgress} at={DOM8.illustrative} className={`${MONO} absolute bottom-8 right-10 text-[#6D7578]`}>
                  Illustrative · the 3D scene is an illustration
                </RampFade>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-16 pt-20 sm:px-8">
              <FinaleCopy />
              <div className="mt-8 flex flex-wrap gap-3">
                {ROOMS.map((room) => (
                  <span key={room.key} className={`${MONO} rounded-full border ${HAIR} bg-[#111416] px-3 py-2 text-[#F5F7F7]`}>
                    {room.label}
                  </span>
                ))}
              </div>
              <div ref={revealRef} className="relative mt-8 h-[55svh] min-h-[320px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><CommunityScene progress={progressRef} active={active} still={reduced} /></div> : null}
                <p className={`${MONO} absolute bottom-3 right-4 text-[#6D7578]`}>Illustrative</p>
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
      <p className={`${MONO} text-[#00E676]`}>Community</p>
      <WickText as="h2" className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-[#F5F7F7] sm:text-4xl xl:text-5xl" text="Connect with trader{s|$}." mv={mv} at={at} />
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#A3AAAC]">
        Official rooms with shared charts and verified records. No scam channels, by design.
      </p>
      <p className={`${MONO} mt-4 text-[#6D7578]`}>Support will never ask for your password, money or keys</p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href="/platform/community"
          className="afv-cta inline-block rounded-full bg-[#00E676] px-6 py-3 text-sm font-semibold text-[#05130C] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69F0AE]"
        >
          Explore community
        </Link>
        <Link href={REGISTER_HREF} prefetch={false} className="text-sm font-medium text-[#A3AAAC] transition-colors hover:text-[#F5F7F7] afv-link">
          Register Now
        </Link>
      </div>
    </div>
  );
}

/** No-WebGL poster: four rooms in a ring, zero canvas. */
function Poster() {
  return (
    <div className="relative h-full w-full bg-[#080A0B]" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,230,118,0.25)]" />
      {[
        [38, 38],
        [62, 38],
        [38, 62],
        [62, 62],
      ].map(([l, t], i) => (
        <div
          key={i}
          className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,230,118,0.45)]"
          style={{ left: `${l}%`, top: `${t}%` }}
        />
      ))}
    </div>
  );
}
