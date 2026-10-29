"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PIcon } from "@/modules/platform/kit";
import type { Guide } from "../content";

/** W5.7 ordered instructions as a step-through: one step in focus, Previous / Next to move. */
export function GuideSteps({ steps }: { steps: Guide["steps"] }) {
  const [current, setCurrent] = useState(0);
  return (
    <div>
      <ol className="space-y-3">
        {steps.map((step, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <li key={step.title}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                aria-current={active ? "step" : undefined}
                className={`flex w-full gap-4 rounded-2xl p-5 text-left transition-colors ${active ? "bg-(--card-hover) shadow-[inset_0_0_0_1px_var(--accent-border)]" : "bg-(--card) shadow-[inset_0_0_0_0.5px_var(--card-edge)] hover:bg-(--card-hover)"}`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold transition-colors ${
                    active ? "bg-(--accent) text-(--text-inverse)" : done ? "bg-(--accent)/20 text-(--accent)" : "bg-white/[.06] text-(--text-muted)"
                  }`}
                >
                  {done ? <PIcon name="check" size={14} weight="bold" /> : i + 1}
                </span>
                <span className="flex-1">
                  <span className={`block text-[17px] font-semibold tracking-[-0.01em] ${active ? "" : "text-(--text-secondary)"}`}>{step.title}</span>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="block overflow-hidden">
                        <span className="block pt-2 text-[15px] leading-relaxed text-(--text-secondary)">{step.body}</span>
                        {step.keys && (
                          <span className="mt-3 flex gap-1.5">
                            {step.keys.map((k) => (
                              <kbd key={k} className="rs-kbd">
                                {k}
                              </kbd>
                            ))}
                          </span>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="rs-ghost"
        >
          <PIcon name="chevron" size={12} className="rotate-180" />
          Previous
        </button>
        <span className="text-[12.5px] tabular-nums text-(--text-muted)">
          Step {current + 1} of {steps.length}
        </span>
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}
          disabled={current === steps.length - 1}
          className="rs-btn"
        >
          Next
          <PIcon name="chevron" size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}
