"use client";

// /about 06 · Company (split out of CompanySections.tsx so each section has one owner).
// Motion (Agent C): the company record types itself in, fact by fact (label, then
// value); "Awaiting confirmation" pulses once, softly, as its window opens.
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Chip, OsSection, Row, Win } from "@/modules/afvarOs";
import { ABOUT, COMPANY_FACTS, CONTACT } from "@/modules/company/kit";
import { Para } from "../shared";
import { Typed, useWinOpened } from "./motionBits";

// Label 0.6 s, value 0.6 s right after it, next fact 150 ms later.
const LABEL = 0.6;
const VALUE = 0.6;
const GAP = 0.15;
const START = 0.2;

export function Company() {
  return (
    <OsSection n={6} label="Company" title="Who is behind it." soft="Registered facts only." body={ABOUT.people.body} app="Workspace">
      <Win at={0.06} x={40} y={20} w={600} h={205} title="Company record" glyph="settings">
        <CompanyRecord />
      </Win>
      <Win at={0.24} x={670} y={20} w={490} h={205} title="Built in-house" glyph="layouts">
        <Row k="Designed" v="in-house" />
        <Row k="Engineered" v="in-house" />
        <Row k="Company" v="registered in India" />
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#B7C5BC]">No invented people, milestones or customer claims.</p>
      </Win>
      <Win at={0.4} x={40} y={250} w={740} h={240} title="Team profiles" glyph="community">
        <Para>Profiles are added here once each person’s details are confirmed.</Para>
        <div className="mt-3">
          <Row k="Invented bios" v="never" />
          <Row k="Stock-photo teams" v="never" />
          <Row k="Borrowed titles" v="never" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <PulseOnce>
            <Chip tone="delayed">Awaiting confirmation</Chip>
          </PulseOnce>
          <Chip>No stock photos</Chip>
        </div>
      </Win>
      <Win at={0.62} x={810} y={250} w={350} h={240} title="Contact the team · /contact" glyph="phone">
        {CONTACT.topics.map((t) => (
          <Row key={t} k={t} v="→ team" />
        ))}
      </Win>
    </OsSection>
  );
}

function CompanyRecord() {
  const go = useWinOpened();
  return COMPANY_FACTS.map(([k, val], r) => {
    const t = START + r * (LABEL + VALUE + GAP);
    return <Row key={k} k={<Typed text={k} go={go} delay={t} dur={LABEL} />} v={<Typed text={val} go={go} delay={t + LABEL} dur={VALUE} />} />;
  });
}

/** One soft pulse (scale + an amber ring that widens and fades) when the window opens. */
function PulseOnce({ children }: { children: ReactNode }) {
  const go = useWinOpened();
  if (go === null) return children;
  return (
    <motion.span
      className="relative inline-flex rounded-full"
      initial={false}
      animate={go ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={go ? { duration: 1.2, delay: 0.6, ease: "easeInOut" } : { duration: 0 }}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full border border-[rgba(246,185,74,0.7)]"
        initial={false}
        animate={go ? { opacity: [0, 0.8, 0], scale: [1, 1.12, 1.3] } : { opacity: 0, scale: 1 }}
        transition={go ? { duration: 1.4, delay: 0.6, ease: "easeOut" } : { duration: 0 }}
      />
      {children}
    </motion.span>
  );
}
