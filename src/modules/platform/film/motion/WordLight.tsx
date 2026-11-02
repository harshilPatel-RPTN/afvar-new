"use client";

// D2 — a large line whose words light up one by one as it crosses the middle
// of the viewport (scroll-linked, opacity only, ink colour; no market ticks).
// The words keep their spaces, so the text reads exactly as before.
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { useMotionOn } from "./state";

const DIM = 0.3;

export function WordLight({ text, id, className }: { text: string; id?: string; className?: string }) {
  const on = useMotionOn();
  const ref = useRef<HTMLParagraphElement>(null);
  // 0 when the line's top is just below the middle, 1 when its bottom has passed it.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.4"] });
  const words = text.split(" ");
  return (
    <p ref={ref} id={id} className={className}>
      {on
        ? words.map((w, i) => (
            <Word key={`${i}-${w}`} p={scrollYProgress} from={i / words.length} to={(i + 1) / words.length}>
              {i < words.length - 1 ? `${w} ` : w}
            </Word>
          ))
        : text}
    </p>
  );
}

function Word({ p, from, to, children }: { p: MotionValue<number>; from: number; to: number; children: string }) {
  const opacity = useTransform(p, [from, to], [DIM, 1]);
  return <motion.span style={{ opacity }}>{children}</motion.span>;
}
