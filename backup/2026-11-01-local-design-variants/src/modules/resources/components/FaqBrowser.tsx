"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { PIcon, type PlatformIcon } from "@/modules/platform/kit";
import { FAQ_GROUPS } from "../content";
import { FaqList } from "./Faq";
import { Window } from "./Window";

const ICONS: Record<string, PlatformIcon> = { status: "info", markets: "chart", devices: "desktop", offers: "star", verification: "shield", priority: "users" };

/**
 * W5.5 in a System Settings window: the six FAQ groups in the sidebar, search
 * across every answer, and deep links (#offers, #verification …) that open
 * the right group.
 */
export function FaqBrowser() {
  const [groupId, setGroupId] = useState(FAQ_GROUPS[0].id);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (FAQ_GROUPS.some((g) => g.id === id)) {
        setGroupId(id);
        setQuery("");
      }
    };
    const t = window.setTimeout(fromHash, 0);
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", fromHash);
    };
  }, []);

  const hits = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    return FAQ_GROUPS.flatMap((g) => g.items.filter((i) => words.every((w) => `${i.q} ${i.a}`.toLowerCase().includes(w))).map((i) => ({ ...i, group: g.title })));
  }, [query]);

  const group = FAQ_GROUPS.find((g) => g.id === groupId)!;

  return (
    <div className="mx-auto max-w-6xl">
      {/* group anchors for deep links */}
      {FAQ_GROUPS.map((g) => (
        <span key={g.id} id={g.id} className="block scroll-mt-48" aria-hidden="true" />
      ))}
      <div data-snake-target>
      <Window title="FAQs" bodyClassName="grid md:min-h-[560px] md:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="pf-sidebar p-3" aria-label="FAQ groups">
          <label className="mb-3 flex h-8 items-center gap-2 rounded-md bg-white/[.06] px-2.5 text-(--text-muted) focus-within:ring-2 focus-within:ring-(--accent)/60">
            <PIcon name="search" size={13} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search answers"
              aria-label="Search answers"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
            />
          </label>
          <ul className="flex gap-1 overflow-x-auto md:block md:space-y-0.5 [scrollbar-width:none]">
            {FAQ_GROUPS.map((g) => {
              const active = !hits && g.id === groupId;
              return (
                <li key={g.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setGroupId(g.id);
                      setQuery("");
                      window.history.replaceState(null, "", `#${g.id}`);
                    }}
                    aria-pressed={active}
                    className="afvar-glass-tab flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors"
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-[6px] ${active ? "bg-(--afvar-mint)/10 text-(--afvar-mint)" : "bg-white/[.07] text-(--text-secondary)"}`}>
                      <PIcon name={ICONS[g.id] ?? "info"} size={13} />
                    </span>
                    <span className="whitespace-nowrap md:whitespace-normal">{g.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        <div className="p-5 sm:p-8">
          <AnimatePresence mode="wait" initial={false}>
            {hits ? (
              <motion.div key="search" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <p className="text-[13px] text-(--text-muted)">
                  {hits.length} {hits.length === 1 ? "answer" : "answers"} for “{query}”
                </p>
                {hits.length ? (
                  <ul className="mt-4 space-y-3">
                    {hits.map((h) => (
                      <li key={h.q} className="rounded-xl bg-white/[.035] p-5 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.08)]">
                        <p className="text-[11.5px] font-semibold text-(--accent)">{h.group}</p>
                        <p className="mt-1 text-[16px] font-medium">{h.q}</p>
                        <p className="mt-2 text-[14.5px] leading-relaxed text-(--text-secondary)">{h.a}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-10 text-center text-[14px] text-(--text-muted)">
                    Nothing here yet.{" "}
                    <Link href="/resources/help#support" className="text-(--accent) hover:underline">
                      Ask support
                    </Link>
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div key={group.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <p className="text-[12px] font-semibold text-(--text-muted)">{group.ref}</p>
                <h2 className="mt-1 text-[26px] font-semibold tracking-[-0.025em]">{group.title}</h2>
                <div className="mt-6">
                  <FaqList key={group.id} items={group.items} defaultOpen={0} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Window>
      </div>
    </div>
  );
}
