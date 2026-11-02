"use client";

// /about 07 · Build status (split out of CompanySections.tsx so each section has one owner).
// Motion (Agent C): the steps arrive and tick in order — Website ✓, Launch queue ✓ —
// while the in-development ones stay pending; the thread stops at the last done step.
// "What registering does" fills in row by row, each answer after its question.
import { useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { OsSection, Row, Steps, Win, useCardEntered, useSection } from "@/modules/afvarOs";
import { ABOUT } from "@/modules/company/kit";
import { Arrive, ArrivingRows, useWinOpened } from "./motionBits";

const STEPS = [
  { label: "Website", detail: "public preview, labelled" },
  { label: "Launch queue", detail: "registration open" },
  { label: "OS workspace", detail: "in development" },
  {
    label: "Public grading",
    detail: "starts with analysis at launch",
  },
] as const;
// Desk: when each step ticks (section progress). Only the first two are done.
const AT = [0.12, 0.24] as const;
// Desk: when each row arrives (the pending ones too).
const ARRIVE = [0.12, 0.24, 0.3, 0.36] as const;

export function BuildStatus() {
  return (
    <OsSection n={7} label="Build status" title="Where the build stands." soft="Updated only when verified." body={ABOUT.stage.body} app="Workspace">
      <Win at={0.06} x={40} y={20} w={600} h={330} title="Build status" glyph="calendar">
        <ArrivingRows at={ARRIVE}>
          <BuildSteps />
        </ArrivingRows>
      </Win>
      <Win at={0.36} x={670} y={20} w={490} h={330} title="What registering does" glyph="alerts" ai>
        <Registering />
      </Win>
    </OsSection>
  );
}

/**
 * The build steps. Desk: Website and Launch queue tick as the section scrolls; phones:
 * they tick 300 ms apart once the card enters (the pending two never tick, so the
 * thread fills only to Launch queue). Without the motion layer: the finished state.
 */
function BuildSteps() {
  const { p, mode, on } = useSection();
  const count = (v: number) => AT.filter((a) => v >= a).length;
  const [deskDone, setDeskDone] = useState(() => count(p.get()));
  useMotionValueEvent(p, "change", (v) => setDeskDone(count(v)));
  // Phones + motion: null = finished state (before / without the entrance), else how many have ticked.
  const [ticked, setTicked] = useState<number | null>(null);
  useCardEntered(() => {
    if (mode !== "stack" || !on) return;
    setTicked(0);
    AT.forEach((_, i) => window.setTimeout(() => setTicked(i + 1), 400 + i * 300));
  });
  const done = mode === "desk" && on ? deskDone : mode === "stack" && on && ticked !== null ? ticked : AT.length;
  return (
    <Steps
      items={STEPS.map((s, i) => ({ ...s, state: i < done ? "ok" : "idle" }))}
      thread={on ? Math.max(0, done - 1) / (STEPS.length - 1) : undefined}
    />
  );
}

const ANSWERS = [
  { k: "Joins the launch queue", v: "yes", gold: true },
  { k: "Unlocks the full OS", v: "not yet" },
  { k: "Takes payment", v: "no" },
  { k: "Invitations", v: "in queue order" },
] as const;

/** Rows arrive one by one (450 ms apart); each answer pops in 350 ms after its question. */
function Registering() {
  const go = useWinOpened();
  return ANSWERS.map((a, i) => (
    <Row
      key={a.k}
      k={
        <Arrive go={go} delay={0.2 + i * 0.45}>
          {a.k}
        </Arrive>
      }
      v={
        <Arrive go={go} delay={0.55 + i * 0.45} pop>
          {a.v}
        </Arrive>
      }
      gold={"gold" in a && a.gold}
    />
  ));
}
