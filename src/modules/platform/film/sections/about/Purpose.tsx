"use client";

// /about 02 · Purpose (split out of CompanySections.tsx so each section has one owner).
// Motion (PLATFORM_MOTION, reduced motion = finished state): the "without AFVAR" rows write
// themselves in one by one (a left → right wipe), then the "on AFVAR" window answers them row
// by row. Desk: tied to the section's progress, and each old row dims as its answer arrives.
// Cards (phones, tablets): each card's rows wipe in, in order, once the card has entered.
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { Note, OsSection, Row, Win, useCardEntered, useSection, useSectionRamp } from "@/modules/afvarOs";
import { ABOUT } from "@/modules/company/kit";
import { SYM, StatusChip, fmt, sourceLine, useQuote } from "../shared";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Desk progress at which row i of each window writes itself in. */
const LEFT_AT = (i: number) => 0.1 + i * 0.045;
const RIGHT_AT = (i: number) => 0.36 + i * 0.06;

export function Purpose() {
  return (
    <OsSection n={2} label="Purpose" title="Why AFVAR exists." soft="Fewer tabs, more proof." body={ABOUT.purpose} app="Workspace">
      <Win at={0.06} x={40} y={20} w={520} h={196} title="A trader’s morning, without AFVAR" glyph="layouts">
        <RowIn i={0} at={LEFT_AT(0)} answeredAt={RIGHT_AT(0)}>
          <Row k="Eleven browser tabs" v="three price sources" />
        </RowIn>
        <RowIn i={1} at={LEFT_AT(1)} answeredAt={RIGHT_AT(1)}>
          <Row k="A tip in a chat group" v="no source" />
        </RowIn>
        <RowIn i={2} at={LEFT_AT(2)} answeredAt={RIGHT_AT(2)}>
          <Row k="A screenshot of someone’s profit" v="not checkable" />
        </RowIn>
        <RowIn i={3} at={LEFT_AT(3)} answeredAt={RIGHT_AT(3)}>
          <Row k="A headline from last night" v="time unknown" />
        </RowIn>
      </Win>
      <Win at={0.32} x={600} y={20} w={560} h={196} title="The same morning, on AFVAR" glyph="research" ai>
        <RowIn i={0} at={RIGHT_AT(0)}>
          <Row k="One price per market" v="source and time on it" gold />
        </RowIn>
        <RowIn i={1} at={RIGHT_AT(1)}>
          <Row k="Analysis with its calculations linked" v="graded afterwards" />
        </RowIn>
        <RowIn i={2} at={RIGHT_AT(2)}>
          <Row k="Headlines tagged to your markets" v="with their time" />
        </RowIn>
        <RowIn i={3} at={RIGHT_AT(3)}>
          <Row k="The decision" v="stays with you" />
        </RowIn>
      </Win>
      <Win at={0.58} x={40} y={232} w={520} h={196} title="One price per market · live" glyph="chart">
        <LiveRow k="XAUUSD" />
        <LiveRow k="EURUSD" />
        <LiveRow k="BTC-USD" />
        <SourceFoot k="XAUUSD" />
      </Win>
      <Win at={0.64} x={600} y={232} w={560} h={196} title="Our purpose" glyph="research">
        <Row k="Every price" v="names its source" />
        <Row k="Every analysis" v="graded in public" />
        <Row k="Every headline" v="tagged with its time" />
        <Row k="Every decision" v="stays with the trader" gold />
      </Win>
      <Note at={0.72} x={40} y={452} w={1120} title="Built in-house in India" sub="RedPhantom Tech Novelty Private Limited" />
    </OsSection>
  );
}

/** One market's last price from the live feed, with its freshness label. */
function LiveRow({ k }: { k: string }) {
  const q = useQuote(k);
  return (
    <Row
      k={SYM[k] ?? k}
      v={
        <span className="flex items-center gap-2">
          {fmt(q?.last, q?.decimals)}
          <StatusChip q={q} />
        </span>
      }
    />
  );
}

/** The source and time of one market's price, as a footer line. */
function SourceFoot({ k }: { k: string }) {
  return <p className="mt-2 break-words font-mono text-[10px] leading-snug text-[#92A399] lg:truncate">{sourceLine(useQuote(k))}</p>;
}

/**
 * One row writing itself in: a clip-path wipe left → right with a 10 px slide.
 * Desk: over [at, at + .05] of the section; `answeredAt` dims it to .55 as its answer arrives.
 * Cards: 0.9 s, starting 0.35 s after the card enters, rows 0.25 s apart.
 */
function RowIn({ i, at, answeredAt, children }: { i: number; at: number; answeredAt?: number; children: ReactNode }) {
  const { mode, on } = useSection();
  const desk = useSectionRamp(at, at + 0.05);
  const answered = useSectionRamp(answeredAt ?? 2, (answeredAt ?? 2) + 0.05);
  const card = useMotionValue(0);
  useCardEntered(() => {
    if (mode === "stack") animate(card, 1, { delay: 0.35 + i * 0.25, duration: 0.9, ease: EASE });
  });
  const v = mode === "desk" ? desk : card;
  const clipPath = useTransform(v, (k) => (k >= 1 ? "none" : `inset(-2px ${(1 - k) * 100}% -2px 0)`));
  const x = useTransform(v, [0, 1], [-10, 0]);
  const deskOpacity = useTransform([desk, answered], ([a, b]: number[]) => a * (1 - 0.45 * b));
  if (!on) return children;
  return (
    <motion.div style={{ clipPath, x, opacity: mode === "desk" ? deskOpacity : card }}>
      {children}
      {/* Keeps Row's `last:border-b-0` for the window's last row only (the wrapper makes every Row a last child). */}
      {i < 3 ? <span aria-hidden="true" className="hidden" /> : null}
    </motion.div>
  );
}
