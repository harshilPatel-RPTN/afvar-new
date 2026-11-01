"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { OVERVIEW } from "../../content";
import { PIcon } from "../mac/icons";
import { Reveal } from "../mac/Reveal";
import { SectionHeading } from "../shared";

const { workspace } = OVERVIEW;
const [layouts, notes, connections, languages] = workspace.items;

/** Apple-style bento: four solid tiles, each with one quiet illustration. */
export function YourWorkspace() {
  return (
    <section aria-labelledby="your-workspace" className="px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading id="your-workspace" title={workspace.title} summary={workspace.summary} />
      <ul className="mx-auto mt-16 grid max-w-6xl gap-5 md:grid-cols-3">
        <Reveal as="li" className="pf-tile p-8 md:col-span-2">
          <TileText {...layouts} />
          <LayoutShuffle />
        </Reveal>
        <Reveal as="li" delay={0.08} className="pf-tile p-8">
          <TileText {...notes} />
          <FileStack />
        </Reveal>
        <Reveal as="li" delay={0.04} className="pf-tile p-8">
          <TileText {...connections} />
          <div className="mt-10 flex items-center gap-3" aria-hidden="true">
            <span className="pf-group flex items-center gap-2 px-3 py-2 text-[13px] text-(--text-secondary)">
              <PIcon name="plug" size={16} className="text-(--accent)" /> Connected account
            </span>
            <span className="flex items-center gap-1 text-[12px] text-(--text-muted)">
              <PIcon name="lock" size={13} /> Read-only
            </span>
          </div>
        </Reveal>
        <Reveal as="li" delay={0.12} className="pf-tile p-8 md:col-span-2">
          <TileText {...languages} />
          <div className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-3" aria-hidden="true">
            {["English", "हिन्दी"].map((l) => (
              <span key={l} className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.02em] text-(--text-primary)">
                {l}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-(--text-muted)">Planned editions; availability is confirmed at launch.</p>
        </Reveal>
      </ul>
    </section>
  );
}

function TileText({ title, description, icon }: (typeof workspace.items)[number]) {
  return (
    <div>
      <PIcon name={icon} size={28} weight="duotone" className="text-(--accent)" />
      <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-1.5 text-[16px] text-(--text-secondary)">{description}</p>
    </div>
  );
}

const ARRANGEMENTS = [
  ["col-span-2 row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-1"],
  ["col-span-1 row-span-2", "col-span-2 row-span-1", "col-span-2 row-span-1"],
  ["col-span-3 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-1"],
];

/** Windows re-tiling between saved arrangements (layout animation). */
function LayoutShuffle() {
  const still = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (still || !visible) return;
    const t = setInterval(() => setStep((s) => (s + 1) % ARRANGEMENTS.length), 1800);
    return () => clearInterval(t);
  }, [still, visible]);

  return (
    <div ref={ref} className="pf-wallpaper mt-10 grid h-48 grid-cols-3 grid-rows-2 gap-2 rounded-2xl p-3" aria-hidden="true">
      {ARRANGEMENTS[step].map((span, i) => (
        <motion.div key={i} layout transition={{ type: "spring", stiffness: 380, damping: 32 }} className={`${span} pf-window !rounded-md`}>
          <div className="flex h-4 items-center gap-1 px-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-(--light-close)" />
            <span className="h-1.5 w-1.5 rounded-full bg-(--light-minimize)" />
            <span className="h-1.5 w-1.5 rounded-full bg-(--light-zoom)" />
          </div>
          <div className="space-y-1 px-2 pt-1">
            <span className="pf-bar h-1 w-2/3" />
            <span className="pf-bar h-1 w-1/2" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Documents fan out like a Finder stack when scrolled into view. */
function FileStack() {
  return (
    <div className="relative mt-10 h-40" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-2 -ml-11 h-[120px] w-[88px] rounded-[6px] bg-[#f5f7fa] p-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
          style={{ zIndex: i, transformOrigin: "50% 100%" }}
          initial={{ rotate: 0, x: 0 }}
          whileInView={{ rotate: (i - 1) * 10, x: (i - 1) * 30 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.15 }}
        >
          <span className="block h-1.5 w-2/3 rounded bg-[#262a28]/70" />
          {[90, 75, 85, 60, 80].map((w, k) => (
            <span key={k} className="mt-1.5 block h-1 rounded bg-[#262a28]/25" style={{ width: `${w}%` }} />
          ))}
        </motion.div>
      ))}
    </div>
  );
}
