"use client";

// D1 / D3 / D4 — entrances for the sections under the OS film.
//
//   <RevealList className="grid …" step={0.14}>      one observer for the list
//     <RevealItem i={0} className="…">                rises 10 px + fades in
//       <RevealRing className="rounded-xl border …" /> the icon ring draws left → right
//       <RevealMark>›</RevealMark>                     fades in after the whole batch
//     </RevealItem>
//   </RevealList>
//   <RuleDraw />   a section's top hairline, drawn from the left (scaleX) as it enters
//
// Transform / opacity / clip-path only; space is always reserved (no layout shift).
import { motion, type Transition } from "framer-motion";
import { createContext, useContext, useRef, type ComponentProps, type ReactNode } from "react";
import { useReveal, type RevealState } from "./state";

const EASE = [0.22, 1, 0.36, 1] as const;
const NOW: Transition = { duration: 0 };

const ListCtx = createContext<((i: number) => RevealState) | null>(null);
const ItemCtx = createContext<RevealState>({ s: "static", d: 0, end: 0 });

export function RevealList({ step = 0.14, children, ...rest }: { step?: number; children: ReactNode } & ComponentProps<"ul">) {
  const ref = useRef<HTMLUListElement>(null);
  const status = useReveal(ref, step);
  return (
    <ListCtx.Provider value={status}>
      <ul ref={ref} {...rest}>
        {children}
      </ul>
    </ListCtx.Provider>
  );
}

export function RevealItem({ i, className, children }: { i: number; className?: string; children: ReactNode }) {
  const status = useContext(ListCtx);
  const st = status ? status(i) : { s: "static" as const, d: 0, end: 0 };
  const hidden = st.s === "wait";
  return (
    <ItemCtx.Provider value={st}>
      <motion.li
        data-reveal={i}
        className={className}
        initial={false}
        animate={hidden ? { opacity: 0, y: 26 } : { opacity: 1, y: 0 }}
        transition={hidden || st.s === "static" ? NOW : { duration: 0.9, delay: st.d, ease: EASE }}
      >
        {children}
      </motion.li>
    </ItemCtx.Provider>
  );
}

/** An icon's ring (absolutely placed over its box) that draws left → right as its card enters. */
export function RevealRing({ className }: { className: string }) {
  const st = useContext(ItemCtx);
  const hidden = st.s === "wait";
  return (
    <motion.span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      initial={false}
      animate={{ clipPath: hidden ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 0%)" }}
      transition={hidden || st.s === "static" ? NOW : { duration: 0.9, delay: st.d + 0.3, ease: EASE }}
    />
  );
}

/** A list mark (e.g. `›`) that fades in after every item of its batch has risen. */
export function RevealMark({ className, children }: { className?: string; children: ReactNode }) {
  const st = useContext(ItemCtx);
  const hidden = st.s === "wait";
  return (
    <motion.span
      className={className}
      initial={false}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={hidden || st.s === "static" ? NOW : { duration: 0.6, delay: st.end + 0.5 }}
    >
      {children}
    </motion.span>
  );
}

/** D4: a section's top hairline (replaces `border-t`; the section must be `relative`). */
export function RuleDraw({ className = "bg-[rgba(255,255,255,0.06)]" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const status = useReveal(ref);
  const st = status(0);
  const hidden = st.s === "wait";
  // The observer watches the untransformed track (a scaleX(0) box never intersects).
  return (
    <span ref={ref} data-reveal={0} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 block h-px">
      <motion.span
        className={`block h-full w-full origin-left ${className}`}
        initial={false}
        animate={{ scaleX: hidden ? 0 : 1 }}
        transition={hidden || st.s === "static" ? NOW : { duration: 1.4, ease: EASE }}
      />
    </span>
  );
}
