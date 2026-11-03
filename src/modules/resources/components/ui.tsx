"use client";

import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { PointerEvent, ReactNode } from "react";
import { CandleCard } from "./motion";
import { PIcon } from "@/modules/platform/kit";

/**
 * Text link in the Resources green: green text and chevron. The
 * `underline-offset-4` class opts it into the shell's candle-row underline
 * that draws in on hover.
 */
export function ResLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex min-h-10 items-center gap-1 text-[17px] font-medium text-(--accent) underline-offset-4 transition-colors hover:text-(--accent-hover) ${className}`}>
      {children}
      <PIcon name="chevron" size={14} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  );
}

/**
 * Every Resources card. Outside: the home page's CandleCard — the card prints
 * in like a candle (body grows from the bottom, a green wick draws and fades)
 * and six mini candles rise in its corner on hover. Inside: a 3D tilt toward
 * the pointer, a green spotlight that follows it and a lit top edge. The
 * pointer is tracked on a wrapper that never moves, so the tilt can't make the
 * card slip out from under the cursor and flicker.
 */
export function MarketCard({
  children,
  index = 0,
  delay = 0,
  as = "div",
  className = "",
  panelClassName = "",
  snakeTarget = false,
  tone = "up",
}: {
  children: ReactNode;
  index?: number;
  delay?: number;
  as?: "div" | "li";
  className?: string;
  panelClassName?: string;
  snakeTarget?: boolean;
  tone?: "up" | "down";
}) {
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 220, damping: 22 });
  const ry = useSpring(0, { stiffness: 220, damping: 22 });
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const color = tone === "up" ? "var(--afvar-mint)" : "var(--afvar-crimson)";
  const glow = useMotionTemplate`radial-gradient(380px circle at ${mx}% ${my}%, color-mix(in srgb, ${color} 13%, transparent), transparent 55%)`;

  function onMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width;
    const py = (event.clientY - box.top) / box.height;
    mx.set(px * 100);
    my.set(py * 100);
    if (reduce) return;
    ry.set((px - 0.5) * 8);
    rx.set(-(py - 0.5) * 8);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <CandleCard as={as} index={index} delay={delay} snakeTarget={snakeTarget} className={`h-full ${className}`}>
      <div className="h-full [perspective:1100px]" onPointerMove={onMove} onPointerLeave={onLeave}>
        <motion.div
          style={{ rotateX: rx, rotateY: ry }}
          className={`group/card relative h-full overflow-hidden rounded-2xl border border-white/[.08] bg-(--card) transition-[border-color,background-color,box-shadow] duration-300 hover:border-white/[.18] hover:bg-(--card-hover) hover:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] ${panelClassName}`}
        >
          <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" style={{ background: glow }} />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-6 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-500 group-hover/card:scale-x-100 ${tone === "up" ? "via-(--afvar-mint)" : "via-(--afvar-loss)"}`}
          />
          <div className="relative h-full">{children}</div>
        </motion.div>
      </div>
    </CandleCard>
  );
}
