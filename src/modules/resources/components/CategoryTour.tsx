"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AppIcon, PIcon } from "@/modules/platform/kit";
import { CATEGORY_COUNTS } from "../catalog";
import { CATEGORIES, EVIDENCE, FAQ_GROUPS, GETTING_STARTED, GUIDE_GROUPS, GUIDES, HELP, type Category, type CategoryId } from "../content";
import { Window } from "./Window";
import { ResLink } from "./ui";

/**
 * W5.1.1–W5.1.5 as the platform's sticky tour: the window stays pinned while
 * each resource category scrolls past and swaps in its own preview.
 */
export function CategoryTour() {
  const [active, setActive] = useState(0);
  const current = CATEGORIES[active];
  return (
    <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div className="hidden lg:block">
        <div className="sticky top-[18vh]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <CategoryPreview id={current.id} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <ol className="space-y-5 lg:space-y-0">
        {CATEGORIES.map((c, i) => (
          <TourStep key={c.id} category={c} index={i} onActive={setActive} />
        ))}
      </ol>
    </div>
  );
}

function TourStep({ category: c, index, onActive }: { category: Category; index: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  return (
    <li ref={ref} className="flex flex-col justify-center lg:min-h-[72vh]">
      <motion.div animate={{ opacity: inView ? 1 : 0.35 }} transition={{ duration: 0.25 }} className="rounded-[28px] bg-(--card) p-7 lg:rounded-none lg:bg-transparent lg:p-0">
        <AppIcon icon={c.icon} tone={c.tone} size={52} />
        <p className="mt-6 text-[13px] font-semibold text-(--text-muted)">
          {c.ref} · {CATEGORY_COUNTS[c.id]} entries
        </p>
        <h3 className="mt-1 text-[32px] font-semibold leading-tight tracking-[-0.03em]">{c.title}</h3>
        <p className="mt-3 text-[17px] leading-relaxed text-(--text-secondary)">{c.summary}</p>
        <div className="mt-7">
          <ResLink href={c.href}>Open {c.title}</ResLink>
        </div>
        <div className="mt-8 lg:hidden">
          <CategoryPreview id={c.id} />
        </div>
      </motion.div>
    </li>
  );
}

export function CategoryPreview({ id }: { id: CategoryId }) {
  if (id === "start") {
    return (
      <Window title="Getting Started" bodyClassName="p-5">
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
          <div className="h-full w-2/5 rounded-full bg-(--accent)" />
        </div>
        <ul className="pf-group">
          {GETTING_STARTED.steps.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-[13.5px]">
              <span className={`grid h-5 w-5 place-items-center rounded-full ${i < 2 ? "bg-(--accent) text-(--text-inverse)" : "border border-white/20 text-transparent"}`}>
                <PIcon name="check" size={11} weight="bold" />
              </span>
              <span className={i < 2 ? "text-(--text-muted) line-through decoration-white/20" : "text-(--text-primary)"}>{s.title}</span>
            </li>
          ))}
        </ul>
      </Window>
    );
  }
  if (id === "guides") {
    return (
      <Window title="Product Guides" bodyClassName="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
        {GUIDE_GROUPS.map((g) => (
          <div key={g.id} className="rounded-xl bg-white/[.035] p-4 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.08)]">
            <AppIcon icon={g.icon} tone={g.tone} size={34} />
            <p className="mt-3 text-[13px] font-semibold leading-snug">{g.title}</p>
            <p className="mt-1 text-[11.5px] text-(--text-muted)">{(() => { const n = GUIDES.filter((x) => x.group === g.id).length; return `${n} ${n === 1 ? "guide" : "guides"}`; })()}</p>
          </div>
        ))}
      </Window>
    );
  }
  if (id === "evidence") {
    return (
      <Window title="Sources & Evidence" bodyClassName="p-6">
        <p className="text-[12px] text-(--text-muted)">Every number carries its envelope</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-black/30 p-4 font-mono text-[12px]">
          <span className="font-semibold text-(--text-primary)">XAUUSD</span>
          {EVIDENCE.badge.map((b) => (
            <span key={b.key} className="rounded-md bg-white/[.06] px-2 py-1 text-(--text-secondary)">
              {b.sample}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {EVIDENCE.labels.map((l) => (
            <span key={l.id} className="rs-chip" data-tone={l.tone}>
              {l.label}
            </span>
          ))}
        </div>
        <p className="mt-5 text-[11px] text-(--text-muted)">Sample · illustration, not live data</p>
      </Window>
    );
  }
  if (id === "faqs") {
    return (
      <Window title="FAQs" bodyClassName="p-5">
        <ul className="pf-group">
          {FAQ_GROUPS.slice(0, 4).map((g, i) => (
            <li key={g.id} className="px-4 py-3">
              <p className="flex items-center justify-between text-[13.5px] font-medium">
                {g.items[0].q}
                <PIcon name="chevron" size={12} className={i === 0 ? "rotate-90 text-(--accent)" : "text-(--text-muted)"} />
              </p>
              {i === 0 && <p className="mt-2 text-[12.5px] leading-relaxed text-(--text-secondary)">{g.items[0].a}</p>}
            </li>
          ))}
        </ul>
      </Window>
    );
  }
  return (
    <Window title="Help & Support" bodyClassName="p-5">
      <div className="rounded-xl border border-(--negative)/30 bg-(--negative)/[.07] p-4">
        <p className="flex items-center gap-2 text-[12.5px] font-semibold text-[#ff6464]">
          <PIcon name="shield" size={14} />
          AFVAR support will never
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-(--text-secondary)">{HELP.never[0]}</p>
      </div>
      <ul className="pf-group mt-4">
        {HELP.account.map((a) => (
          <li key={a.title} className="flex items-center justify-between px-4 py-3 text-[13px]">
            {a.title}
            <PIcon name="chevron" size={12} className="text-(--text-muted)" />
          </li>
        ))}
      </ul>
    </Window>
  );
}
