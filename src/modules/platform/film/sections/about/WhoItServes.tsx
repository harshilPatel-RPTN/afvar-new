"use client";

// /about 04 · Who it serves (split out of CompanySections.tsx so each section has one owner).
// Motion (PLATFORM_MOTION, reduced motion = finished state): each card's body lights word by
// word (desk: with the section's progress after its window opens; cards: as it scrolls up the
// screen); on phones / tablets the three cards also rise with their own scroll position, so they
// arrive one after another as you scroll.
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { Note, OsSection, Win, useSection, useSectionRamp } from "@/modules/afvarOs";
import { ABOUT } from "@/modules/company/kit";

const PARA = "m-0 text-[13.5px] leading-relaxed text-[#F2F5F2]";
const DIM = 0.3;

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
            <Win at={at} x={40 + i * 380} y={20 + i * 30} w={360} h={300} title={s.title} glyph={i === 0 ? "chart" : i === 1 ? "alerts" : "research"} ai={i === 1}>
              <ProseLight text={s.body} at={at + 0.04} span={0.12} className={PARA} />
            </Win>
          </ScrollRise>
        );
      })}
      <Note at={0.7} x={40} y={420} w={480} title="No buy or sell calls, for anyone" sub="Analysis and explanation only" />
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

/**
 * A paragraph whose words light up one by one (opacity only, ink colour; the text is
 * unchanged — words keep their spaces). Desk: over [at, at + span] of the section's
 * progress (the screen is pinned, so the element itself never moves). Cards: as the
 * paragraph scrolls from 80 % to 55 % of the screen height (lit before the next card arrives).
 */
export function ProseLight({ text, at, span = 0.1, className }: { text: string; at: number; span?: number; className?: string }) {
  const { mode, on } = useSection();
  const ref = useRef<HTMLParagraphElement>(null);
  const desk = useSectionRamp(at, at + span);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.55"] });
  const p = mode === "desk" ? desk : scrollYProgress;
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {on
        ? words.map((w, i) => (
            <Lit key={`${mode}-${i}`} p={p} from={i / words.length} to={(i + 1) / words.length}>
              {i < words.length - 1 ? `${w} ` : w}
            </Lit>
          ))
        : text}
    </p>
  );
}

function Lit({ p, from, to, children }: { p: MotionValue<number>; from: number; to: number; children: string }) {
  const opacity = useTransform(p, [from, to], [DIM, 1]);
  return <motion.span style={{ opacity }}>{children}</motion.span>;
}
