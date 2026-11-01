"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { useRef, useState, type RefObject } from "react";
import { AppIcon } from "../mac/AppIcon";
import { Backdrop } from "../mac/Backdrop";
import { PIcon, type PlatformIcon } from "../mac/icons";
import { Reveal } from "../mac/Reveal";
import { AnimatedBeam } from "../os/AnimatedBeam";
import { PageNote, SectionHeading } from "../shared";

type Step = { label: string; detail: [string, string]; icon: PlatformIcon };

/** Runtime action flow, product board D.1.3 (text verbatim). */
const STEPS: Step[] = [
  {
    label: "Request",
    detail: ["Trader input from UI", "Cancel / clarify / confirm"],
    icon: "message",
  },
  {
    label: "Backend",
    detail: ["Validate session", "Assemble allowed context"],
    icon: "layers",
  },
  {
    label: "Resolve request",
    detail: ["Local commands first", "Model only if needed"],
    icon: "search",
  },
  {
    label: "Policy gate",
    detail: ["Validate and authorize", "Confirm when required"],
    icon: "shield",
  },
  {
    label: "Action runner",
    detail: ["Call owning service", "Or permitted shell tool"],
    icon: "zap",
  },
  {
    label: "Verify",
    detail: ["Check actual outcome", "Persist operation result"],
    icon: "check",
  },
];

const RETURN_LABEL = "Verified result, clarification or error";
const LAST = STEPS.length - 1;

/**
 * D.1.3 as an Apple-style scroll story. Desktop: a tall section with a sticky
 * panel; scroll advances the active step and the beams carry the request along.
 * Mobile and reduced motion: a plain vertical list.
 */
export function VerifyFlow() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      aria-labelledby="verify-flow-title"
      className="px-4 py-20 sm:px-6 sm:py-28"
    >
      <SectionHeading
        id="verify-flow-title"
        title="From request to verified result."
        summary="Every action follows the same path: validated, authorized, run by the service that owns it, then checked against what actually happened."
      />

      {reduce ? (
        <StepList highlightAll />
      ) : (
        <>
          <div className="hidden lg:block">
            <StickyStory />
          </div>
          <div className="lg:hidden">
            <StepList />
          </div>
        </>
      )}

      <div className="mt-12">
        <PageNote>
          AFVAR reports the outcome it verified, not the one it expected. If a
          step cannot complete, you get a clarification or an error instead.
        </PageNote>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- desktop */

function StickyStory() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(LAST, Math.max(0, Math.floor(v * STEPS.length))));
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const n0 = useRef<HTMLDivElement>(null);
  const n1 = useRef<HTMLDivElement>(null);
  const n2 = useRef<HTMLDivElement>(null);
  const n3 = useRef<HTMLDivElement>(null);
  const n4 = useRef<HTMLDivElement>(null);
  const n5 = useRef<HTMLDivElement>(null);
  // Bottom-centre anchors for the return beam under the first and last tiles.
  const returnFrom = useRef<HTMLSpanElement>(null);
  const returnTo = useRef<HTMLSpanElement>(null);

  const step = STEPS[active];

  return (
    <div ref={trackRef} className="relative mt-4 h-[260vh]">
      <div className="sticky top-0 isolate flex h-screen flex-col justify-center">
        <Backdrop src="/platform/bg/verify.jpg" opacity={0.6} className="absolute inset-y-0 -inset-x-6" fade="radial-gradient(ellipse 60% 55% at center, black 35%, transparent 100%)" />
        <div className="mx-auto w-full max-w-6xl">
          <div ref={containerRef} className="relative pb-28">
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={n0}
              toRef={n1}
              duration={3}
              delay={0}
              className={beamClass(0 < active)}
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={n1}
              toRef={n2}
              duration={3}
              delay={0.25}
              className={beamClass(1 < active)}
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={n2}
              toRef={n3}
              duration={3}
              delay={0.5}
              className={beamClass(2 < active)}
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={n3}
              toRef={n4}
              duration={3}
              delay={0.75}
              className={beamClass(3 < active)}
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={n4}
              toRef={n5}
              duration={3}
              delay={1}
              className={beamClass(4 < active)}
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={returnFrom}
              toRef={returnTo}
              curvature={-110}
              reverse
              duration={4}
              className={beamClass(active === LAST)}
            />

            <ol className="relative z-10 grid grid-cols-6 gap-6">
              <li aria-current={current(active, 0)}>
                <FlowTile
                  step={STEPS[0]}
                  index={0}
                  state={tileState(active, 0)}
                  tileRef={n0}
                  anchorRef={returnTo}
                />
              </li>
              <li aria-current={current(active, 1)}>
                <FlowTile
                  step={STEPS[1]}
                  index={1}
                  state={tileState(active, 1)}
                  tileRef={n1}
                />
              </li>
              <li aria-current={current(active, 2)}>
                <FlowTile
                  step={STEPS[2]}
                  index={2}
                  state={tileState(active, 2)}
                  tileRef={n2}
                />
              </li>
              <li aria-current={current(active, 3)}>
                <FlowTile
                  step={STEPS[3]}
                  index={3}
                  state={tileState(active, 3)}
                  tileRef={n3}
                />
              </li>
              <li aria-current={current(active, 4)}>
                <FlowTile
                  step={STEPS[4]}
                  index={4}
                  state={tileState(active, 4)}
                  tileRef={n4}
                />
              </li>
              <li aria-current={current(active, 5)}>
                <FlowTile
                  step={STEPS[5]}
                  index={5}
                  state={tileState(active, 5)}
                  tileRef={n5}
                  anchorRef={returnFrom}
                />
              </li>
            </ol>

            <p
              className={`absolute inset-x-0 bottom-0 text-center text-[13px] transition-colors duration-500 ${
                active === LAST ? "text-(--accent)" : "text-(--text-muted)"
              }`}
            >
              {RETURN_LABEL}
            </p>
          </div>

          <div
            className="pf-tile mx-auto mt-10 min-h-[132px] max-w-xl px-8 py-7 text-center"
            aria-live="polite"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <p className="text-[12px] font-medium tracking-wide text-(--text-muted) uppercase">
                  Step {active + 1} of {STEPS.length}
                </p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight text-(--text-primary)">
                  {step.label}
                </p>
                <p className="mt-2 text-[15px] text-(--text-secondary)">
                  {step.detail[0]}
                  <span className="mx-2 text-(--text-muted)" aria-hidden="true">
                    ·
                  </span>
                  {step.detail[1]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

const beamClass = (lit: boolean) =>
  `transition-opacity duration-500 ${lit ? "opacity-100" : "opacity-25"}`;
const current = (active: number, i: number) =>
  i === active ? ("step" as const) : undefined;
const tileState = (active: number, i: number) =>
  (i === active ? "active" : i < active ? "done" : "next") as TileState;

type TileState = "active" | "done" | "next";

function FlowTile({
  step,
  index,
  state,
  tileRef,
  anchorRef,
}: {
  step: Step;
  index: number;
  state: TileState;
  tileRef: RefObject<HTMLDivElement | null>;
  anchorRef?: RefObject<HTMLSpanElement | null>;
}) {
  const ring =
    state === "active"
      ? "shadow-[inset_0_0_0_1.5px_var(--accent)] opacity-100"
      : state === "done"
        ? "shadow-[inset_0_0_0_0.5px_var(--border-default)] opacity-90"
        : "shadow-[inset_0_0_0_0.5px_var(--border-default)] opacity-45";

  return (
    <div
      ref={tileRef}
      className={`relative flex h-[148px] flex-col items-center justify-center gap-3 rounded-[20px] bg-(--card) px-3 text-center transition-[opacity,box-shadow] duration-500 ${ring}`}
    >
      {state === "done" && (
        <span className="absolute top-2.5 right-2.5 text-(--accent)">
          <PIcon name="check" size={16} weight="fill" label="Completed" />
        </span>
      )}
      <AppIcon
        icon={step.icon}
        tone={state === "active" ? "gold" : "slate"}
        size={48}
      />
      <span className="text-[14px] leading-tight font-medium text-(--text-primary)">
        <span className="sr-only">Step {index + 1}: </span>
        {step.label}
      </span>
      {anchorRef && (
        <span
          ref={anchorRef}
          className="absolute bottom-0 left-1/2 h-px w-px"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* ----------------------------------------------- mobile / reduced motion */

function StepList({ highlightAll = false }: { highlightAll?: boolean }) {
  return (
    <ol className="mx-auto mt-12 max-w-xl space-y-3">
      {STEPS.map((s, i) => (
        <Reveal as="li" key={s.label} delay={highlightAll ? 0 : i * 0.04}>
          <div
            className={`flex items-center gap-4 rounded-[18px] bg-(--card) p-4 ${
              highlightAll
                ? "shadow-[inset_0_0_0_1px_var(--accent-border)]"
                : "shadow-[inset_0_0_0_0.5px_var(--border-default)]"
            }`}
          >
            <AppIcon
              icon={s.icon}
              tone={highlightAll || i === LAST ? "gold" : "slate"}
              size={44}
            />
            <div className="min-w-0">
              <p className="text-[12px] text-(--text-muted)">Step {i + 1}</p>
              <p className="text-[17px] font-semibold tracking-tight text-(--text-primary)">
                {s.label}
              </p>
              <p className="text-[14px] text-(--text-secondary)">
                {s.detail[0]} · {s.detail[1]}
              </p>
            </div>
          </div>
        </Reveal>
      ))}
      <li className="flex items-center justify-center gap-2 pt-3 text-[13px] text-(--text-muted)">
        <PIcon
          name="chevron"
          size={12}
          weight="bold"
          className="-rotate-90 text-(--accent)"
        />
        {RETURN_LABEL}
      </li>
    </ol>
  );
}
