"use client";

// W1.1.2 overview video — a real capture of the AFVAR interactive OS preview
// (/platform TryDesktop autoplay demo, sample data), recorded by
// scripts/record-overview-video.mjs. Plays muted and looped only while on
// screen; reduced motion shows the poster and plays only on request.
//
// Spotlight: when the section arrives, the screen "powers on" like a trading-desk
// monitor (a green scan line, then the picture opens from the centre), and while
// it crosses the middle of the viewport the frame lifts toward the viewer — a
// little bigger, a deeper shadow, viewfinder corners — then settles back. Scroll-
// scrubbed transform/opacity only; reduced motion keeps it flat and static (the
// scroll progress pins to 1 → scale 1, no lift, no halo; the cover is CSS-hidden).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { OVERVIEW } from "../content";
import { Icon } from "./bits";
import { useScrollProgress } from "./marketMotion";
import { playSfx } from "./sfx";

/** Scroll progress (frame top at viewport bottom → frame bottom at viewport top) for the lift. */
const LIFT_AT = [0, 0.36, 0.6, 0.86];
const CORNERS = ["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"];
const CORNER_DIR = [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const;

const SPOT_CSS = [
  ".ov-cover{position:absolute;inset:0;z-index:3;background:#030405;pointer-events:none}",
  ".ov-line{position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:#00E676;box-shadow:0 0 14px #00E676;transform:scaleX(0);opacity:0}",
  "[data-on] .ov-cover{animation:ov-open .62s .34s cubic-bezier(.7,0,.2,1) forwards}",
  "[data-on] .ov-line{animation:ov-line .6s cubic-bezier(.2,.7,.3,1) forwards}",
  "@keyframes ov-line{0%{opacity:1;transform:scaleX(0)}55%{opacity:1;transform:scaleX(1)}100%{opacity:0;transform:scaleX(1)}}",
  "@keyframes ov-open{0%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(50% 0 50% 0)}}",
  ".ov-rec{animation:ov-rec 1.4s ease-in-out infinite}",
  "@keyframes ov-rec{0%,100%{opacity:1}50%{opacity:.25}}",
  "@media (prefers-reduced-motion:reduce){.ov-cover,.ov-line{display:none}.ov-rec{animation:none}}",
].join("");

export const OVERVIEW_VIDEO = { src: "/afvar/overview/afvar-overview.webm", poster: "/afvar/overview/poster.jpg" } as const;

/** The overview's spotlight stage: the frame powers on (green scan line, opens
 *  from the centre) with a tick once most of it is on screen, lifts toward the
 *  viewer mid-scroll with a green underglow and closing viewfinder corners, and
 *  shows a pulsing REC badge while `playing`. Wraps any 16:9 media. */
export function VideoSpotlight({ children, playing = false, badge = "PREVIEW" }: { children: ReactNode; playing?: boolean; badge?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // Power-on once most of the frame is on screen (not at the bottom edge).
  const on = useInView(wrapRef, { once: true, amount: 0.6 });
  const lift = useScrollProgress(wrapRef, [0, 1], [1, 0]);
  const scale = useTransform(lift, LIFT_AT, [0.94, 1.06, 1.06, 1]);
  const y = useTransform(lift, LIFT_AT, [48, -22, -22, 0]);
  const halo = useTransform(lift, LIFT_AT, [0, 1, 1, 0]);
  const gap = useTransform(lift, LIFT_AT, [16, 0, 0, 16]);

  useEffect(() => {
    if (on && !reduce) playSfx("tick");
  }, [on, reduce]);

  return (
    <div ref={wrapRef} className="relative" data-on={on && !reduce ? "" : undefined}>
    <style href="afvar-overview-spotlight" precedence="default">{SPOT_CSS}</style>
    <motion.div className="relative z-10" style={{ scale, y }}>
    {/* Lifted state: green underglow + viewfinder corners (they close in as it rises). */}
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-[8%] -bottom-6 h-16 rounded-full bg-[#00E676]/25 blur-2xl"
      style={{ opacity: halo }}
    />
    {CORNERS.map((pos, i) => (
      <Corner key={pos} pos={pos} dir={CORNER_DIR[i]} gap={gap} opacity={halo} />
    ))}
    <div className="group relative aspect-video w-full overflow-hidden rounded-[18px] border border-white/[.11] bg-(--afvar-charcoal) shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)]">
      {children}
      {playing && (
        <p className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/[.11] bg-(--afvar-charcoal) px-2.5 py-1 font-mono text-[10px] tracking-[.12em] text-(--mk-text)">
          <span className="ov-rec h-1.5 w-1.5 rounded-full bg-[#FF3B3B]" aria-hidden="true" />
          {badge}
        </p>
      )}
      {/* Same markup on server and client; reduced motion hides it in CSS. */}
      <div className="ov-cover" aria-hidden="true">
        <span className="ov-line" />
      </div>
    </div>
    </motion.div>
    </div>
  );
}

/** Inline 16:9 frame: autoplays muted while visible, pauses off-screen. */
export function OverviewVideoFrame({ onExpand }: { onExpand: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || reduce) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <VideoSpotlight playing={playing}>
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        src={OVERVIEW_VIDEO.src}
        poster={OVERVIEW_VIDEO.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="AFVAR overview: interactive preview capture with sample data"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {/* Expand to the full player (and the only way to play under reduced motion). */}
      <button
        type="button"
        aria-label="Open the AFVAR overview video"
        onClick={onExpand}
        className="absolute inset-0 grid place-items-center bg-transparent transition-colors hover:bg-black/20"
      >
        <span
          className={`grid h-16 w-16 place-items-center rounded-full border border-white/[.16] bg-(--afvar-panel) text-(--mk-text) transition-opacity duration-200 ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
        >
          <Icon name={playing ? "arrow" : "play"} className="h-6 w-6 translate-x-0.5" />
        </span>
      </button>
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/[.11] bg-(--afvar-charcoal) px-3 py-1 font-mono text-[10.5px] tracking-wide text-(--mk-dim)">
        {OVERVIEW.playNote}
      </p>
    </VideoSpotlight>
  );
}

/** One viewfinder corner, offset outward by `gap` px (closes to the frame at the lift's peak). */
function Corner({ pos, dir, gap, opacity }: { pos: string; dir: readonly [number, number]; gap: MotionValue<number>; opacity: MotionValue<number> }) {
  const x = useTransform(gap, (g) => dir[0] * (g + 8));
  const y = useTransform(gap, (g) => dir[1] * (g + 8));
  return <motion.span aria-hidden="true" className={`pointer-events-none absolute h-5 w-5 rounded-[3px] border-[#00E676] ${pos}`} style={{ x, y, opacity }} />;
}

/** Full player shown inside the section's modal: controls, starts from the top. */
export function OverviewVideoPlayer() {
  return (
    <video
      className="aspect-video w-full rounded-2xl bg-black"
      src={OVERVIEW_VIDEO.src}
      poster={OVERVIEW_VIDEO.poster}
      controls
      autoPlay
      muted
      playsInline
      aria-label="AFVAR overview: interactive preview capture with sample data"
    />
  );
}
