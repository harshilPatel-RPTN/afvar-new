"use client";

// Chapter 02 — THE MARKET WORLD. A 420vh sticky stage: eight lanes wake in the
// scene while a symbol strip lights up chip by chip in sync (same config), the
// three territory headers appear as the groups spread, a provenance card
// anatomises "source · venue · delay · cache age" during the scan, and the
// chapter settles into the markets copy. The lanes are drawn from real closes
// via the existing AFVAR data layer (useLiveMarket → /api/home/market); the
// per-lane live / delayed / snapshot state is shown as-is and never upgraded by the scene.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { useLiveMarket } from "@/modules/home/kit";
import { useChapterStage } from "./chapterStage";
import { PanelCard } from "./cards";
import { LaneBoard } from "./LaneBoard";
import { OilCaptionInView, OilPour } from "./transitions";
import { RollChip, WickText } from "./kinetic";
import { CAPTIONS, DOM2, GROUPS, LANES, OIL, SETTLED_P, chipRevealAt } from "./marketWorldConfig";
import { CopyScrim, RampFade, WindowFade } from "./reveal";
import { HAIR, MONO, REGISTER_HREF } from "./ui";

const MarketWorldScene = dynamic(() => import("./MarketWorldScene"), { ssr: false });

/** Data badge + honesty line sit under the chapter label (the top-right belongs
 *  to the launch reminder) and step aside before the closing copy arrives. */
const DATA_LABEL_WINDOW = [DOM2.illustrative[0], DOM2.illustrative[1], DOM2.finale[0] - 0.04, DOM2.finale[0]] as const;

export function Chapter02() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);
  const barScale = useTransform(scrollYProgress, (p) => Math.max(0.001, p));

  // Real closes shape each lane; direction and the chip numbers use the data
  // layer's own % change — the same figure the ticker shows. The geometry only
  // rebuilds when the closes or a direction change.
  const { quotes, live, updatedAt, mix } = useLiveMarket();
  const statusText = live ? [mix.live && `${mix.live} live`, mix.delayed && `${mix.delayed} delayed`].filter(Boolean).join(" · ") : "Snapshot";
  const changes = LANES.map((lane) => quotes[lane.symbol]?.changePct ?? 0);
  const signature = LANES.map((lane, i) => `${changes[i] >= 0 ? "+" : "-"}${quotes[lane.symbol]?.closes.join(",") ?? ""}`).join("|");
  const lanes = useMemo(
    () =>
      signature.split("|").map((s) => {
        const closes = s.length > 1 ? s.slice(1).split(",").map(Number) : [];
        return { closes, up: s[0] === "+" };
      }),
    [signature],
  );
  const updated = updatedAt ? new Date(updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <MotionConfig reducedMotion="user">
      <section ref={trackRef} className={`relative bg-[#080A0B] text-[#F5F7F7] ${cinematic ? "lg:h-[420vh]" : ""}`} aria-label="Chapter 02 — The Market World">
        <div className={`overflow-hidden ${cinematic ? "lg:sticky lg:top-0 lg:h-svh" : ""}`}>
          {cinematic ? (
            <div className="relative h-svh w-full">
              <div className="absolute inset-0">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><MarketWorldScene progress={progressRef} active={active} still={false} lanes={lanes} /></div> : null}
              </div>

              <div className="pointer-events-none absolute inset-0">
                {/* chapter label + progress line */}
                <div className="absolute left-10 top-32">
                  <p className={`${MONO} text-[#6D7578]`}>
                    <span className="text-[#F5F7F7]">02</span> / The Market World
                  </p>
                  <div className="mt-3 h-px w-28 bg-[rgba(255,255,255,0.12)]">
                    <motion.div className="h-px origin-left bg-[#00E676]" style={{ scaleX: barScale }} />
                  </div>
                </div>

                {/* data state — exactly what the data layer reports */}
                <WindowFade mv={scrollYProgress} w={DATA_LABEL_WINDOW} className="absolute left-10 top-44">
                  <DataBadge live={live} text={statusText} />
                </WindowFade>

                {/* stage captions */}
                <div className="absolute bottom-[20vh] left-10 max-w-xl">
                  {CAPTIONS.map((c, i) => (
                    <WindowFade key={i} mv={scrollYProgress} w={c.window} className="absolute bottom-0 left-0 w-max max-w-xl">
                      <WickText as="p" className="text-3xl font-medium leading-snug tracking-tight text-[#F5F7F7] xl:text-4xl" text={c.text} mv={scrollYProgress} at={[c.window[0], c.window[1]]} />
                      {i === OIL.caption ? <OilPour mv={scrollYProgress} at={OIL.at} /> : null}
                    </WindowFade>
                  ))}
                </div>

                {/* symbol strip: chips light in sync with their 3D lanes */}
                <div className="absolute bottom-8 left-10 flex gap-10">
                  {GROUPS.map((group, g) => (
                    <div key={group.key}>
                      <RampFade mv={scrollYProgress} at={DOM2.headers}>
                        <p className={`${MONO} text-[#A3AAAC]`}>{group.label}</p>
                        <p className="mt-0.5 text-[11px] text-[#6D7578]">{group.note}</p>
                      </RampFade>
                      <div className="mt-2 flex gap-3">
                        {LANES.map((lane, i) =>
                          lane.group === g ? (
                            <RollChip key={lane.symbol} mv={scrollYProgress} at={chipRevealAt(i)} symbol={lane.symbol} pct={changes[i]} />
                          ) : null,
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* provenance anatomy — shown during the scan sweep */}
                <WindowFade mv={scrollYProgress} w={DOM2.provCard} className="absolute right-10 top-1/2 w-72 -translate-y-1/2">
                  <PanelCard mv={scrollYProgress} at={[DOM2.provCard[0], DOM2.provCard[1]]}>
                    <p className={`${MONO} text-[#00E676]`}>These lanes show</p>
                    <dl className="mt-3 space-y-2">
                      {(
                        [
                          ["Sources", "Gold-API · Binance · Yahoo"],
                          ["Status", statusText],
                          ["Updated", live ? updated : "Stored snapshot"],
                          ["Live", "Gold · Silver spot, BTC"],
                          ["Delayed", "Oil ~10 min · FX ~1–2 min"],
                        ] as const
                      ).map(([f, v]) => (
                        <div key={f} className="flex items-baseline justify-between gap-4">
                          <dt className="text-sm text-[#A3AAAC]">{f}</dt>
                          <dd className={`${MONO} text-[#F5F7F7]`}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </PanelCard>
                </WindowFade>

                {/* finale: markets copy takes over */}
                <CopyScrim mv={scrollYProgress} at={DOM2.finale} />
                <RampFade mv={scrollYProgress} at={DOM2.finale} rise className="absolute left-10 top-1/2 max-w-xl -translate-y-1/2">
                  <FinaleCopy mv={scrollYProgress} at={DOM2.finale} />
                </RampFade>

                {/* honesty label */}
                <WindowFade mv={scrollYProgress} w={DATA_LABEL_WINDOW} className={`${MONO} absolute left-10 top-56 max-w-sm rounded-full border ${HAIR} bg-[#111416] px-3 py-2 leading-relaxed text-[#A3AAAC]`}>
                  {live ? "Lanes drawn from recent hourly closes" : "Lanes drawn from a stored snapshot — not live"} · candles &amp; motion stylised · not
                  investment advice
                </WindowFade>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-16 pt-20 sm:px-8">
              <FinaleCopy />
              <div className="mt-6">
                <DataBadge live={live} text={statusText} />
              </div>
              <OilCaptionInView text={CAPTIONS[OIL.caption].text} />
              <div ref={revealRef} className="relative mt-8 h-[55svh] min-h-[320px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)]">
                <div className="absolute inset-0"><Poster /></div>
                {webgl !== false && mounted ? <div className="absolute inset-0"><MarketWorldScene progress={progressRef} active={active} still={reduced} lanes={lanes} /></div> : null}
                <p className={`${MONO} absolute bottom-3 right-4 text-[#6D7578]`}>{live ? "Recent hourly closes" : "Stored snapshot — not live"}</p>
              </div>
            </div>
          )}
        </div>
      </section>
      <LaneBoard />
    </MotionConfig>
  );
}

/** States exactly what the data layer reports: how many lanes are live vs delayed, or the stored snapshot. */
function DataBadge({ live, text }: { live: boolean; text: string }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border ${HAIR} bg-[#111416] px-3 py-1.5`}>
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-[#00E676]" : "bg-[#6D7578]"}`} aria-hidden="true" />
      <span className={`${MONO} ${live ? "text-[#00E676]" : "text-[#A3AAAC]"}`}>{text}</span>
      <span className={`${MONO} text-[#6D7578]`}>· {live ? "recent hourly closes" : "stored data"}</span>
    </div>
  );
}

/* ------------------------------------------------------------ finale copy */

function FinaleCopy({ mv, at }: { mv?: MotionValue<number>; at?: readonly [number, number] } = {}) {
  return (
    <div className="pointer-events-auto">
      <p className={`${MONO} text-[#00E676]`}>Markets</p>
      <WickText as="h2" className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-[#F5F7F7] sm:text-4xl xl:text-5xl" text="International market{s|$}. Covered deeply." mv={mv} at={at} />
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#A3AAAC]">
        Eight confirmed coverage lanes across three categories — every number with its source and freshness.
      </p>
      <p className={`${MONO} mt-4 text-[#6D7578]`}>Futures delayed · crypto 24/7</p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href="/market"
          className="afv-cta inline-block rounded-full bg-[#00E676] px-6 py-3 text-sm font-semibold text-[#05130C] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69F0AE]"
        >
          Explore markets
        </Link>
        <Link href={REGISTER_HREF} prefetch={false} className="text-sm font-medium text-[#A3AAAC] transition-colors hover:text-[#F5F7F7] afv-link">
          Register Now
        </Link>
      </div>
    </div>
  );
}

/** No-WebGL poster: eight faint lanes, zero canvas. */
function Poster() {
  return (
    <div className="relative h-full w-full bg-[#080A0B]" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="absolute inset-y-[12%] w-px bg-gradient-to-b from-transparent via-[rgba(0,230,118,0.4)] to-transparent"
          style={{ left: `${16 + i * 9.5}%`, opacity: 0.35 + (i % 3) * 0.2 }}
        />
      ))}
    </div>
  );
}
