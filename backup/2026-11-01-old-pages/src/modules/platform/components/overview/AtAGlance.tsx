"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, type KeyboardEvent } from "react";
import { AT_A_GLANCE } from "../../content";
import type { IconTone } from "../../types";
import { AppIcon } from "../mac/AppIcon";
import { PIcon } from "../mac/icons";
import { MacWindow } from "../mac/MacWindow";
import { Reveal } from "../mac/Reveal";
import { AvailabilityBadge, SectionHeading } from "../shared";

const TONES: IconTone[] = ["gold", "cyan", "purple", "slate", "green", "slate", "cyan", "slate", "red", "gold"];

/**
 * W2.1.1–W2.1.10 as a System Settings window: source list of topics and an
 * inset-grouped detail pane. Real vertical tabs (arrow keys, Home, End).
 */
export function AtAGlance() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const item = AT_A_GLANCE[selected];

  const move = (to: number) => {
    const next = (to + AT_A_GLANCE.length) % AT_A_GLANCE.length;
    setSelected(next);
    tabs.current[next]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(selected + 1),
      ArrowUp: () => move(selected - 1),
      Home: () => move(0),
      End: () => move(AT_A_GLANCE.length - 1),
    };
    const run = keys[e.key];
    if (run) {
      e.preventDefault();
      run();
    }
  };

  return (
    <section aria-labelledby="at-a-glance" className="px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading id="at-a-glance" title="Everything in one place." summary="How the whole AFVAR experience fits together." />

      <Reveal y={28} className="mx-auto mt-16 max-w-5xl">
        <MacWindow bodyClassName="grid md:h-[480px] md:grid-cols-[280px_1fr]" className="!rounded-[14px]">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Platform topics"
            onKeyDown={onKey}
            className="pf-sidebar flex gap-0.5 overflow-x-auto p-2.5 md:block md:space-y-0.5 md:overflow-y-auto"
          >
            {AT_A_GLANCE.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`glance-tab-${t.id}`}
                aria-selected={i === selected}
                aria-controls="glance-panel"
                tabIndex={i === selected ? 0 : -1}
                onClick={() => setSelected(i)}
                className={`flex w-max shrink-0 items-center gap-2 rounded-[6px] px-2 py-[5px] text-left text-[13px] md:w-full ${
                  i === selected ? "bg-(--mac-select) font-medium text-(--text-inverse)" : "text-(--text-primary)/90 hover:bg-white/5"
                }`}
              >
                <AppIcon icon={t.icon} tone={TONES[i]} size={20} />
                <span className="whitespace-nowrap">{t.title}</span>
              </button>
            ))}
          </div>

          <div id="glance-panel" role="tabpanel" aria-labelledby={`glance-tab-${item.id}`} tabIndex={0} className="relative min-h-[320px] overflow-y-auto p-6 sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="flex flex-col items-center text-center">
                  <AppIcon icon={item.icon} tone={TONES[selected]} size={64} />
                  <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">{item.title}</h3>
                </div>
                <div className="pf-group mt-7">
                  {item.body.map((p) => (
                    <div key={p} className="flex gap-3 px-4 py-3.5 text-[14px] leading-relaxed text-(--text-secondary)">
                      <PIcon name="check" size={18} weight="fill" className="mt-0.5 text-(--accent)" />
                      <span>{p}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                    <span className="text-(--text-secondary)">Status</span>
                    <AvailabilityBadge value="in-development" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </MacWindow>
      </Reveal>
    </section>
  );
}
