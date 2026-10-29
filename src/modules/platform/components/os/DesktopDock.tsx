"use client";

import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { CAPABILITIES } from "../../content";
import type { CapabilitySlug } from "../../types";
import { AppIcon } from "../mac/AppIcon";
import { useMagnify } from "../mac/Dock";

/**
 * Dock for the demo desktop: same magnification as the page Dock
 * (PuruVJ/macos-web via Renovamen/playground-macos, MIT), plus the launch
 * bounce when an app opens. Clicking opens, restores or focuses the app.
 */
export function DesktopDock({
  open,
  bounce,
  onLaunch,
}: {
  open: Set<CapabilitySlug>;
  /** App id + counter; a new value bounces that icon once. */
  bounce: { app: CapabilitySlug; n: number } | null;
  onLaunch: (app: CapabilitySlug) => void;
}) {
  const mouseX = useMotionValue<number | null>(null);
  const still = useReducedMotion() ?? false;
  return (
    <div className="absolute bottom-2 left-1/2 z-[60] -translate-x-1/2">
      <div
        className="pf-dock pf-vibrant !gap-1.5 !rounded-[16px] !p-1.5"
        style={{ height: 48 }}
        onMouseMove={(e) => mouseX.set(e.nativeEvent.clientX)}
        onMouseLeave={() => mouseX.set(null)}
      >
        {CAPABILITIES.map((c) => (
          <DockButton
            key={c.slug}
            app={c.slug}
            label={c.title}
            icon={c.icon}
            tone={c.tone}
            running={open.has(c.slug)}
            bounceKey={bounce?.app === c.slug ? bounce.n : 0}
            mouseX={mouseX}
            still={still}
            onLaunch={onLaunch}
          />
        ))}
      </div>
    </div>
  );
}

function DockButton({
  app,
  label,
  icon,
  tone,
  running,
  bounceKey,
  mouseX,
  still,
  onLaunch,
}: {
  app: CapabilitySlug;
  label: string;
  icon: (typeof CAPABILITIES)[number]["icon"];
  tone: (typeof CAPABILITIES)[number]["tone"];
  running: boolean;
  bounceKey: number;
  mouseX: MotionValue<number | null>;
  still: boolean;
  onLaunch: (app: CapabilitySlug) => void;
}) {
  const size = 34;
  const ref = useRef<HTMLButtonElement>(null);
  const width = useMagnify(mouseX, ref, size, 1.6);
  const scale = useTransform(width, (w) => w / size);
  return (
    <div className="flex flex-col items-center justify-end">
      <button
        ref={ref}
        type="button"
        data-dock-app={app}
        aria-label={`${running ? "Show" : "Open"} ${label}`}
        title={label}
        onClick={() => onLaunch(app)}
        className="pf-dock-item block"
      >
        <motion.span className="block" style={still ? { width: size, height: size } : { width, height: width }}>
          <motion.span
            key={bounceKey}
            className="block"
            animate={still || bounceKey === 0 ? undefined : { y: [0, -16, 0, -8, 0] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <motion.span className="block" style={still ? undefined : { scale, transformOrigin: "0 0" }}>
              <AppIcon icon={icon} tone={tone} size={size} />
            </motion.span>
          </motion.span>
        </motion.span>
      </button>
      <span className={`mt-0.5 h-[3px] w-[3px] rounded-full bg-white/80 transition-opacity ${running ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
    </div>
  );
}
