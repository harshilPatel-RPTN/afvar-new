"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AppIcon, PIcon } from "@/modules/platform/kit";
import { GUIDE_GROUPS, GUIDES, type Guide, type GuideGroupId } from "../content";
import { MarketCard, ResLink } from "./ui";

/** W5.3 · guides grouped by task (W5.3.1), filterable by group and searchable. */
export function GuidesIndex() {
  const [group, setGroup] = useState<GuideGroupId | "all">("all");
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return GUIDES.filter((g) => {
      if (group !== "all" && g.group !== group) return false;
      const hay = `${g.title} ${g.task} ${g.steps.map((s) => `${s.title} ${s.body}`).join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [group, query]);

  const groups = GUIDE_GROUPS.filter((g) => group === "all" || g.id === group);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
        <LayoutGroup id="guide-filter">
          <div role="radiogroup" aria-label="Guide group" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-(--segment-fill) p-1 [scrollbar-width:none]">
            {[{ id: "all" as const, title: "All guides" }, ...GUIDE_GROUPS].map((g) => {
              const active = group === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setGroup(g.id)}
                  className={`relative h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors ${active ? "text-[#030405]" : "text-(--text-secondary) hover:text-(--text-primary)"}`}
                >
                  {active && <motion.span layoutId="guide-filter-pill" className="absolute inset-0 rounded-full bg-(--accent)" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{g.title}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        <label className="flex h-9 w-full max-w-[280px] items-center gap-2 rounded-full bg-(--segment-fill) px-3.5 text-(--text-muted) focus-within:ring-2 focus-within:ring-(--accent)/60">
          <PIcon name="search" size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides"
            aria-label="Search guides"
            className="min-w-0 flex-1 bg-transparent text-[13.5px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
          />
        </label>
      </div>

      <div className="mt-12 space-y-16">
        <AnimatePresence mode="popLayout" initial={false}>
          {groups.map((g) => {
            const items = matches.filter((m) => m.group === g.id);
            if (!items.length) return null;
            return (
              <motion.section
                key={g.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                aria-labelledby={`group-${g.id}`}
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <AppIcon icon={g.icon} tone={g.tone} size={44} />
                    <div>
                      <p className="text-[12px] font-semibold text-(--text-muted)">{g.ref}</p>
                      <h2 id={`group-${g.id}`} className="text-[26px] font-semibold tracking-[-0.025em]">
                        {g.title}
                      </h2>
                    </div>
                  </div>
                  <ResLink href={g.capability} className="!text-[15px]">
                    Related capability
                  </ResLink>
                </div>
                <ul className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((guide, i) => (
                    <GuideCard key={guide.slug} guide={guide} index={i} />
                  ))}
                </ul>
              </motion.section>
            );
          })}
        </AnimatePresence>
        {!matches.length && (
          <p className="py-16 text-center text-[15px] text-(--text-muted)">
            No guide matches “{query}”.{" "}
            <Link href="/resources/help" className="text-(--accent) hover:underline">
              Try Help & Support
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function GuideCard({ guide, index }: { guide: Guide; index: number }) {
  const group = GUIDE_GROUPS.find((g) => g.id === guide.group)!;
  const number = GUIDES.findIndex((g) => g.slug === guide.slug) + 1;
  const steps = guide.steps.length;
  return (
    <MarketCard as="li" index={index} delay={(index % 3) * 0.07} snakeTarget={number === 1} tone={index % 2 ? "down" : "up"}>
      <Link href={`/resources/guides/${guide.slug}`} className="group/link flex h-full flex-col p-6 outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:p-7">
        <div className="flex items-center gap-3">
          <AppIcon icon={group.icon} tone={group.tone} size={38} />
          <div className="min-w-0">
            <p className="font-mono text-[10.5px] tracking-[0.14em] text-(--text-muted)">GUIDE {String(number).padStart(2, "0")}</p>
            <p className="truncate text-[12.5px] text-(--text-secondary)">{group.title}</p>
          </div>
        </div>

        <h3 className="mt-5 text-[19px] font-semibold leading-snug tracking-[-0.015em] text-(--text-primary)">{guide.title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-(--text-secondary)">{guide.task}</p>

        <ol className="mt-5 space-y-2 border-l border-white/[.08] pl-4">
          {guide.steps.slice(0, 3).map((step, i) => (
            <li key={step.title} className="relative text-[13px] text-(--text-muted) transition-colors duration-300 group-hover/link:text-(--text-secondary)">
              <span className="absolute -left-[19.5px] top-[7px] h-[6px] w-[6px] rounded-full border border-white/25 bg-[#111416] transition-colors duration-300 group-hover/link:border-[#00E676] group-hover/link:bg-[#00E676]" style={{ transitionDelay: `${i * 80}ms` }} />
              {step.title}
            </li>
          ))}
          {steps > 3 && <li className="text-[12px] text-(--text-disabled)">+{steps - 3} more</li>}
        </ol>

        <div className="mt-auto pt-6">
        <div className="flex items-end justify-between gap-4 border-t border-white/[.07] pt-5">
          <span className="flex items-end gap-2.5">
            <span aria-hidden="true" className="flex h-5 items-end gap-[3px]">
              {guide.steps.map((step, i) => (
                <span
                  key={step.title}
                  className="w-[5px] origin-bottom rounded-[1px] bg-[#00E676]/45 transition-[transform,background-color] duration-300 group-hover/link:bg-[#00E676]"
                  style={{ height: 7 + i * 4, transitionDelay: `${i * 60}ms` }}
                />
              ))}
            </span>
            <span className="text-[12px] text-(--text-muted)">
              {steps} steps · <span className="text-(--text-disabled)">in development</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-[13.5px] font-medium text-(--text-primary)">
            Read guide
            <PIcon name="chevron" size={12} weight="bold" className="text-(--accent) transition-transform duration-200 group-hover/link:translate-x-1" />
          </span>
        </div>
        </div>
      </Link>
    </MarketCard>
  );
}
