"use client";

import { useAfvarReducedMotion } from "@/modules/afvarOs";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PIcon } from "../mac/icons";
import { MacWindow } from "../mac/MacWindow";
import { Reveal } from "../mac/Reveal";
import { PageNote, SectionHeading } from "../shared";

/** Product board U07: a task that opens the user's selected charts. */
const STEPS = ["Gold chart", "Dollar chart", "Ten-year yield"] as const;
const STEP_MS = 1200;
const LOOP_PAUSE_MS = 2600;

const CAPTION_STOPPED = "Playback stopped. The task keeps running.";
const CAPTION_CANCELLED = "Stopping remaining work. Opened chart stays open.";

type StepStatus = "done" | "active" | "pending" | "cancelled";

const STATUS_TEXT: Record<StepStatus, string> = {
  done: "Opened and verified",
  active: "Checking outcome",
  pending: "Not started",
  cancelled: "Cancelled",
};

export function StopVsCancel() {
  return (
    <section aria-labelledby="stop-cancel-title" className="px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading id="stop-cancel-title" title="Stop speaking. Or cancel the task." summary="Two separate controls, because they do different things." />
      <Reveal className="mx-auto mt-16 max-w-3xl">
        <TaskDemo />
      </Reveal>
      <div className="mt-10">
        <PageNote>Stopping speech never cancels the task. Cancelling never undoes work that is already done.</PageNote>
      </div>
    </section>
  );
}

/**
 * Board rule D.0: "Stop speaking" only silences playback; "Cancel task" only
 * stops pending steps. Completed steps always stay completed.
 */
function TaskDemo() {
  const still = useAfvarReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.4 });

  // Number of completed steps. The demo opens with step 1 done and step 2 checking.
  const [progress, setProgress] = useState(1);
  const [speechStopped, setSpeechStopped] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [interacted, setInteracted] = useState(false);

  const finished = progress >= STEPS.length;
  const running = !finished && !cancelled;
  const speaking = running && !speechStopped;

  useEffect(() => {
    if (still || !visible || cancelled) return;
    if (!finished) {
      const t = setTimeout(() => setProgress((p) => Math.min(p + 1, STEPS.length)), STEP_MS);
      return () => clearTimeout(t);
    }
    // Loop the untouched demo; once someone has used the controls, wait for Replay.
    if (interacted) return;
    const t = setTimeout(() => {
      setProgress(1);
      setSpeechStopped(false);
    }, LOOP_PAUSE_MS);
    return () => clearTimeout(t);
  }, [still, visible, cancelled, finished, interacted, progress]);

  const replay = () => {
    setProgress(1);
    setSpeechStopped(false);
    setCancelled(false);
    setInteracted(false);
  };

  const statusOf = (i: number): StepStatus => {
    if (i < progress) return "done";
    if (cancelled) return "cancelled";
    return i === progress ? "active" : "pending";
  };

  const caption = cancelled ? CAPTION_CANCELLED : speechStopped ? CAPTION_STOPPED : "";
  const taskState = cancelled ? "Cancelled" : finished ? "Complete" : "Running";

  return (
    <div ref={ref}>
      <MacWindow title="Opening your selected charts" bodyClassName="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <PIcon name="mic" size={18} className={speaking ? "text-(--accent)" : "text-(--text-muted)"} />
            <span className="text-[13px] font-medium text-(--text-secondary)">{speaking ? "AFVAR is speaking" : "Speech off"}</span>
            <LevelMeter on={speaking} still={still} />
          </div>
          <span className="text-[12px] font-medium text-(--text-muted)">Task: {taskState}</span>
        </div>

        <ol className="pf-group mt-5" aria-label="Task steps">
          {STEPS.map((step, i) => {
            const status = statusOf(i);
            return (
              <li key={step} className="flex items-center gap-3 px-4 py-3">
                <StepIcon status={status} still={still} />
                <span className={`flex-1 text-[15px] ${status === "cancelled" ? "text-(--text-muted) line-through" : "text-(--text-primary)"}`}>
                  <span className="mr-2 text-(--text-muted)">{i + 1}</span>
                  {step}
                </span>
                <span className={`text-[13px] ${status === "done" ? "text-(--positive)" : "text-(--text-muted)"}`}>{STATUS_TEXT[status]}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <MacButton
            onClick={() => {
              setSpeechStopped(true);
              setInteracted(true);
            }}
            disabled={!speaking}
          >
            Stop speaking
          </MacButton>
          <MacButton
            tone="destructive"
            onClick={() => {
              setCancelled(true);
              setInteracted(true);
            }}
            disabled={!running}
          >
            Cancel task
          </MacButton>
          {still && (
            <MacButton onClick={() => setProgress((p) => Math.min(p + 1, STEPS.length))} disabled={!running}>
              Next step
            </MacButton>
          )}
          <MacButton onClick={replay} className="ml-auto">
            Replay
          </MacButton>
        </div>

        <p aria-live="polite" className="mt-4 min-h-[1.5em] text-[13px] text-(--text-secondary)">
          {caption}
        </p>
      </MacWindow>
    </div>
  );
}

function LevelMeter({ on, still }: { on: boolean; still: boolean }) {
  const resting = ["35%", "70%", "50%", "85%"];
  return (
    <span className="flex h-4 items-center gap-[3px]" aria-hidden="true">
      {resting.map((h, i) =>
        on && !still ? (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-(--accent)"
            animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
          />
        ) : (
          <span key={i} className={`w-[3px] rounded-full ${on ? "bg-(--accent)" : "bg-(--text-disabled)"}`} style={{ height: on ? h : "20%" }} />
        ),
      )}
    </span>
  );
}

function StepIcon({ status, still }: { status: StepStatus; still: boolean }) {
  if (status === "done") return <PIcon name="check" size={20} weight="fill" className="text-(--positive)" />;
  if (status === "cancelled") return <PIcon name="close" size={20} className="text-(--text-muted)" />;
  if (status === "active") {
    return (
      <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">
        <motion.span
          className="h-4 w-4 rounded-full border-2 border-(--border-strong) border-t-(--accent)"
          animate={still ? undefined : { rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">
      <span className="h-4 w-4 rounded-full border border-dashed border-(--border-strong)" />
    </span>
  );
}

function MacButton({
  children,
  onClick,
  disabled,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "destructive";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 rounded-[7px] bg-(--surface-3) px-3.5 text-[13px] font-medium shadow-[inset_0_0.5px_0_rgba(255,255,255,.12),0_0_0_0.5px_var(--mac-edge)] transition-colors hover:bg-(--surface-hover) active:bg-(--surface-active) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring) disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "destructive" ? "text-(--negative)" : "text-(--text-primary)"
      } ${className}`}
    >
      {children}
    </button>
  );
}
