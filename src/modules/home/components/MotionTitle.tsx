"use client";

// The "/" heading motion as a standalone title, for pages outside "/": each
// word opens on a price gap (green from above / red from below, alternating)
// and settles, while a few letters slot through $ € ¥ £ ₹ and land back on
// the real letter (with "/"'s soft tick). Plays once on entering the view.
// The accessible name is always the plain text.
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { VIEW_ONCE } from "./bits";
import { CurrencyLetters, useCurrencyScramble } from "./CurrencyText";
import { CandleWords } from "./marketMotion";

const TAGS = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p, span: motion.span } as const;

/** Currency glyphs only make sense on Latin letters (Hindi / Marathi stay still). */
const latin = (text: string) => /^[\u0000-ɏ\s\p{P}\p{S}\d]*$/u.test(text);

export function MotionTitle({
  text,
  as = "h2",
  id,
  className,
  delay = 0.08,
}: {
  text: string;
  as?: keyof typeof TAGS;
  id?: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, VIEW_ONCE);
  const currency = latin(text);
  useCurrencyScramble(ref, currency && inView, { tick: true });
  const M = TAGS[as];
  return (
    <M ref={ref} id={id} className={className} aria-label={text} initial="hidden" animate={inView ? "visible" : "hidden"}>
      <CandleWords text={text} delay={delay} renderWord={currency ? (word) => <CurrencyLetters text={word} /> : undefined} />
    </M>
  );
}
