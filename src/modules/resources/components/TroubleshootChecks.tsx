"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PIcon } from "@/modules/platform/kit";
import type { TroubleTopic } from "../content";

/** W5.8 checks and recovery steps: tick what you tried, then say whether it worked. */
export function TroubleshootChecks({ topic, supportTopic }: { topic: TroubleTopic; supportTopic: string }) {
  const [tried, setTried] = useState<number[]>([]);
  const [outcome, setOutcome] = useState<"fixed" | "blocked" | null>(null);
  const all = tried.length === topic.checks.length;

  return (
    <div>
      <ol className="pf-group">
        {topic.checks.map((check, i) => {
          const on = tried.includes(i);
          return (
            <li key={check}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setTried((t) => (on ? t.filter((x) => x !== i) : [...t, i]))}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[.02]"
              >
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${on ? "bg-(--accent) text-(--text-inverse)" : "border border-white/25 text-(--text-muted)"}`}>
                  {on ? <PIcon name="check" size={13} weight="bold" /> : <span className="text-[11px] tabular-nums">{i + 1}</span>}
                </span>
                <span className={`flex-1 text-[15.5px] leading-relaxed ${on ? "text-(--text-muted)" : "text-(--text-primary)"}`}>{check}</span>
                <span className="text-[11.5px] text-(--text-disabled)">{on ? "Tried" : "Tap when tried"}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 rounded-2xl bg-(--card) p-6 shadow-[inset_0_0_0_0.5px_var(--card-edge)]">
        <p className="text-[15px] font-semibold">{all ? "Tried everything — did that fix it?" : "Did that fix it?"}</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setOutcome("fixed")}
            aria-pressed={outcome === "fixed"}
            className={outcome === "fixed" ? "rs-btn !h-10 !px-5 !text-[14px]" : "rs-ghost !h-10 !px-5 !text-[14px]"}
          >
            <PIcon name="check" size={14} />
            Yes, it&rsquo;s fixed
          </button>
          <button
            type="button"
            onClick={() => setOutcome("blocked")}
            aria-pressed={outcome === "blocked"}
            className={`rs-ghost !h-10 !px-5 !text-[14px] ${outcome === "blocked" ? "!border-[#FF3B3B]/60 !bg-[#FF3B3B]/15 !text-[#ff8080]" : ""}`}
          >
            <PIcon name="close" size={13} />
            Still blocked
          </button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {outcome && (
            <motion.div key={outcome} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-5" role="status">
              {outcome === "fixed" ? (
                <p className="text-[14.5px] leading-relaxed text-(--text-secondary)">
                  <span className="font-semibold text-(--accent)">Good.</span> Expected result: {topic.recovery}
                </p>
              ) : (
                <p className="text-[14.5px] leading-relaxed text-(--text-secondary)">
                  Send one request and include what you tried.{" "}
                  <Link href={`/resources/help?topic=${encodeURIComponent(supportTopic)}#support`} className="font-medium text-(--accent) hover:underline">
                    Contact Support — topic “{supportTopic}” pre-filled
                  </Link>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
