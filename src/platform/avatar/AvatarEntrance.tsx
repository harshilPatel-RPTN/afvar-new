"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { AvatarController, AvatarState } from "./embed";

// The viewer is a cross-origin iframe whose Talk / Stop buttons and status label sit
// under the robot, so the robot itself cannot be moved from here. Instead the entrance
// is drawn over the 3D area: an unresolved hologram field hides the robot, a cyan scan
// beam rises out of the floor ring and resolves it from the feet up while the robot
// waves (happy face), then the wave clip finishes and the viewer settles into idle.

/** Distance from the stage bottom to the hologram ring: the field never covers the status label or buttons below it. */
const FIELD_BOTTOM = "110px";
const RISE_DELAY = 180; // lets the panel's own 420 ms scale-in get going first
const RISE_MS = 1300;
/** The viewer's wave clip lowers the arm by ~3.64 s (motions.js envelope); idle then takes over without a snap. */
const WAVE_MS = 3700;

const EASE_RISE = "cubic-bezier(.5,0,.2,1)";

interface Props {
  /** True while the panel is open and the viewer is ready. Each false → true edge replays the entrance. */
  active: boolean;
  avatarRef: RefObject<AvatarController | null>;
  /** Latest state the viewer reported (onState), so the idle hand-off never interrupts a conversation. */
  stateRef: RefObject<AvatarState | null>;
}

export function AvatarEntrance({ active, avatarRef, stateRef }: Props) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const beamRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  // Layout effect: the field is applied before the first painted frame of the opened panel,
  // so the robot is never seen popping in mid-pose.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    const beam = beamRef.current;
    const ring = ringRef.current;
    if (!active || !field || !beam || !ring) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // No rise and no wave: the viewer is shown settled.

    const avatar = avatarRef.current;
    avatar?.setState({ gesture: "wave", emotion: "happy" }).catch(() => {});

    const timing = { delay: RISE_DELAY, duration: RISE_MS, easing: EASE_RISE, fill: "both" as const };
    const animations = [
      field.animate(
        [
          { clipPath: "inset(0 0 0 0)", opacity: 1 },
          { clipPath: "inset(0 0 100% 0)", opacity: 1, offset: 0.92 },
          { clipPath: "inset(0 0 100% 0)", opacity: 0 },
        ],
        timing,
      ),
      // Same offsets and easing as the field, so the beam always sits on the field's edge.
      beam.animate(
        [{ bottom: FIELD_BOTTOM }, { bottom: "100%", offset: 0.92 }, { bottom: "100%" }],
        timing,
      ),
      beam.animate([{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], timing),
      // The ring ignites as the beam leaves it.
      ring.animate(
        [
          { opacity: 0, transform: "translateX(-50%) scale(.55)" },
          { opacity: 1, transform: "translateX(-50%) scale(1)", offset: 0.35 },
          { opacity: 0, transform: "translateX(-50%) scale(1.25)" },
        ],
        { duration: 900, delay: RISE_DELAY / 2, easing: "ease-out", fill: "both" },
      ),
    ];

    const settle = window.setTimeout(() => {
      const state = stateRef.current;
      // Only hand back to idle if nothing else (voice turn, Controls) has taken over.
      if (state && (state.gesture !== "wave" || state.phase !== "idle")) return;
      avatarRef.current?.setState({ gesture: "idle" }).catch(() => {});
    }, WAVE_MS);

    return () => {
      window.clearTimeout(settle);
      for (const animation of animations) animation.cancel();
    };
  }, [active, avatarRef, stateRef]);

  return (
    <div aria-hidden data-avatar-entrance="" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Unresolved hologram: blurred, cyan-tinted scanlines over the robot until the beam passes. */}
      <div
        ref={fieldRef}
        className="absolute inset-x-0 top-0 opacity-0"
        style={{
          bottom: FIELD_BOTTOM,
          backdropFilter: "blur(18px) saturate(.55)",
          WebkitBackdropFilter: "blur(18px) saturate(.55)",
          background:
            "repeating-linear-gradient(0deg, rgba(64,253,255,.07) 0 1px, transparent 1px 4px), linear-gradient(to top, rgba(64,253,255,.18), rgba(64,253,255,.05) 45%, rgba(23,35,46,.35))",
        }}
      />
      {/* Scan beam: a bright line with a soft trailing glow below it. */}
      <div ref={beamRef} className="absolute inset-x-0 h-6 opacity-0" style={{ bottom: FIELD_BOTTOM }}>
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, #40fdff 18%, #e6ffff 50%, #40fdff 82%, transparent)",
            boxShadow: "0 0 8px 1px rgba(64,253,255,.7), 0 0 22px 4px rgba(64,253,255,.25)",
          }}
        />
        <div
          className="absolute inset-x-0 top-px bottom-0"
          style={{ background: "linear-gradient(to bottom, rgba(64,253,255,.16), transparent)" }}
        />
      </div>
      {/* Ring ignition flash at the hologram base. */}
      <div
        ref={ringRef}
        className="absolute left-1/2 h-14 w-[62%] opacity-0"
        style={{
          bottom: `calc(${FIELD_BOTTOM} - 1.75rem)`,
          background: "radial-gradient(ellipse at center, rgba(230,255,255,.55), rgba(64,253,255,.35) 35%, transparent 70%)",
        }}
      />
    </div>
  );
}
