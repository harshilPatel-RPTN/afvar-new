"use client";

// /about 04 · Who it serves (split out of CompanySections.tsx so each section has one owner).
// Motion (PLATFORM_MOTION, reduced motion = finished state): on phones / tablets the three cards rise with their own scroll position, so they
// arrive one after another as you scroll.
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { OsSection, Row, Win, useSection } from "@/modules/afvarOs";
import { ABOUT } from "@/modules/company/kit";

const PARA = "m-0 text-[13.5px] leading-relaxed text-[#F2F5F2]";
/** What each kind of trader uses, drawn from its description in ABOUT.serves. */
const USES: readonly (readonly [string, string])[][] = [
  [
    ["Markets", "commodities · forex · crypto"],
    ["Coverage lanes", "eight, confirmed"],
    ["On every number", "source · delay · cache age"],
  ],
  [
    ["Analysis", "in plain words"],
    ["Alerts", "repeated back, then confirmed"],
    ["Buy or sell pushes", "none"],
  ],
  [
    ["Deep research", "and event analysis"],
    ["Strategy tests", "assumptions stated"],
    ["Built for", "“why” before “how much”"],
  ],
];

export function WhoItServes() {
  return (
    <OsSection
      n={4}
      label="Who it serves"
      title="Three kinds of trader."
      soft="One workspace."
      body="Active traders, careful beginners and people who research before they act each find a different door into the same desk."
      app="Workspace"
    >
      {ABOUT.serves.map((s, i) => {
        const at = 0.06 + i * 0.18;
        return (
          <ScrollRise key={s.title}>
            <Win at={at} x={40 + i * 380} y={20 + i * 15} w={360} h={250} title={s.title} glyph={i === 0 ? "chart" : i === 1 ? "alerts" : "research"} ai={i === 1}>
              <ProseLight text={s.body} at={at + 0.04} span={0.12} className={PARA} />
              <div className="mt-3">
                {USES[i]?.map(([k, v]) => (
                  <Row key={k} k={k} v={v} />
                ))}
              </div>
            </Win>
          </ScrollRise>
        );
      })}
      <Win at={0.62} x={40} y={340} w={720} h={155} title="Whichever door" glyph="layouts">
        <Row k="Workspace" v="one, the same for all three" />
        <Row k="AI analyst" v="English · हिन्दी" />
        <Row k="Every price" v="source and time on it" />
      </Win>
      <Win at={0.72} x={790} y={340} w={370} h={155} title="No buy or sell calls, for anyone" glyph="risk">
        <Row k="Buy or sell calls" v="never" />
        <Row k="Orders placed" v="never" />
        <Row k="What you get" v="analysis and explanation" />
      </Win>
    </OsSection>
  );
}

/** Cards only: the card rises 48 px → 0 as its top travels from the bottom of the screen to 60 % up. */
function ScrollRise({ children }: { children: ReactNode }) {
  const { mode, on } = useSection();
  // Desk windows are absolutely placed in the OS screen: no wrapper (a transformed box would re-anchor them).
  if (mode !== "stack" || !on) return children;
  return <Riser>{children}</Riser>;
}

function Riser({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.6"] });
  const y = useTransform(scrollYProgress, [0, 1], [48, 0]);
  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
}

/** A card's paragraph, shown whole (no scroll-linked word-by-word lighting). */
export function ProseLight({ text, className }: { text: string; at: number; span?: number; className?: string }) {
  return <p className={className}>{text}</p>;
}
