"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { IconTone } from "../../types";
import { AppIcon } from "./AppIcon";
import type { PlatformIcon } from "./icons";

export interface DockItem {
  href: string;
  label: string;
  icon: PlatformIcon;
  tone: IconTone;
}

/**
 * macOS Dock. The magnification curve and spring follow PuruVJ/macos-web
 * (MIT) via Renovamen/playground-macos (MIT): icons change real width, so
 * neighbours slide apart instead of overlapping. Desktop pointer only; keyboard
 * focus shows the label; reduced motion keeps icons at rest size.
 */
export function Dock({ items, label, size = 54, magnification = 1.7 }: { items: DockItem[]; label: string; size?: number; magnification?: number }) {
  const mouseX = useMotionValue<number | null>(null);
  const still = useReducedMotion() ?? false;
  return (
    <nav aria-label={label} className="flex justify-center">
      <ul
        className="pf-dock pf-vibrant"
        style={{ height: size + 12 }}
        onMouseMove={(e) => mouseX.set(e.nativeEvent.clientX)}
        onMouseLeave={() => mouseX.set(null)}
      >
        {items.map((item) => (
          <DockIcon key={item.href} item={item} mouseX={mouseX} size={size} mag={magnification} still={still} />
        ))}
      </ul>
    </nav>
  );
}

export function useMagnify(mouseX: MotionValue<number | null>, ref: React.RefObject<HTMLElement | null>, size: number, mag: number) {
  const limit = size * 6;
  const input = [-limit, -limit / (mag * 0.65), -limit / (mag * 0.85), 0, limit / (mag * 0.85), limit / (mag * 0.65), limit];
  const output = [size, size * (mag * 0.55), size * (mag * 0.75), size * mag, size * (mag * 0.75), size * (mag * 0.55), size].map((v) =>
    Math.max(v, size),
  );
  const distance = useMotionValue(limit + 1);
  const width = useSpring(useTransform(distance, input, output), { stiffness: 1700, damping: 90 });

  useAnimationFrame(() => {
    const el = ref.current;
    const x = mouseX.get();
    if (el && x !== null) {
      const box = el.getBoundingClientRect();
      distance.set(x - (box.left + box.width / 2));
    } else {
      distance.set(limit + 1);
    }
  });
  return width;
}

function DockIcon({ item, mouseX, size, mag, still }: { item: DockItem; mouseX: MotionValue<number | null>; size: number; mag: number; still: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const width = useMagnify(mouseX, ref, size, mag);
  const [hint, setHint] = useState(false);
  const scale = useTransform(width, (w) => w / size);

  return (
    <li className="relative flex flex-col items-center justify-end">
      <AnimatePresence>
        {hint && (
          <motion.span
            role="tooltip"
            className="pf-dock-tooltip pf-vibrant absolute bottom-full mb-3 text-(--text-primary)"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      <Link
        ref={ref}
        href={item.href}
        aria-label={item.label}
        className="pf-dock-item block"
        onMouseEnter={() => setHint(true)}
        onMouseLeave={() => setHint(false)}
        onFocus={() => setHint(true)}
        onBlur={() => setHint(false)}
      >
        <motion.span className="block" style={still ? { width: size, height: size } : { width, height: width }} whileTap={{ filter: "brightness(0.7)" }}>
          <motion.span className="block" style={still ? undefined : { scale, transformOrigin: "0 0" }}>
            <AppIcon icon={item.icon} tone={item.tone} size={size} />
          </motion.span>
        </motion.span>
      </Link>
      <span className="mt-1 h-1 w-1 rounded-full bg-(--text-secondary)/70" aria-hidden="true" />
    </li>
  );
}
