"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { useSyncExternalStore, type ReactNode } from "react";

const PHONE = "(max-width:639px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Phones only: the footer's link grid leans with the scroll speed (a slight
 *  skewY, max 4°) and springs back upright when the scroll settles. Wider
 *  screens and reduced motion get a plain, untransformed block. */
export function FooterSkew({ className, children }: { className?: string; children: ReactNode }) {
  const phone = useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches, () => false);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const lean = useSpring(useTransform(velocity, [-2400, 0, 2400], [4, 0, -4], { clamp: true }), { stiffness: 260, damping: 30, mass: .6 });
  if (!phone || reduce) return <div className={className}>{children}</div>;
  return <motion.div className={className} style={{ skewY: lean, transformOrigin: "50% 0" }}>{children}</motion.div>;
}
