"use client";

import {
  motionValue,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import { useId, useRef } from "react";

/* Copied from the home page's beastArt (same artwork), recoloured to the
 * /home-demo palette and keyed under its own style href.
 *
 * ── BULL & BEAR — hand-authored low-poly "faceted metal" characters.
 * Both are drawn in side profile FACING RIGHT (mirror with scaleX(-1)).
 * Graphite facets #14181b–#3b454b, lighter steel for horns/claws, a thin rim
 * light (green bull / red bear) and a glowing eye slit. Animated parts are
 * separate <g> groups whose `transform` attribute is written straight from a
 * framer MotionValue (event-driven — no rAF loop, no re-render). */

const UP = "#00E676";
const DOWN = "#FF3B3B";

/** Pivoted rotation of an SVG group, driven by a MotionValue (degrees). */
function useRotate(
  mv: MotionValue<number> | undefined,
  cx: number,
  cy: number,
) {
  const ref = useRef<SVGGElement>(null);
  const fmt = (v: number) => `rotate(${v.toFixed(2)} ${cx} ${cy})`;
  useMotionValueEvent(mv ?? FALLBACK, "change", (v) =>
    ref.current?.setAttribute("transform", fmt(v)),
  );
  return [ref, fmt(mv ? mv.get() : 0)] as const;
}

/** Group opacity driven by a MotionValue (0–1). */
function useOpacity(mv: MotionValue<number> | undefined) {
  const ref = useRef<SVGGElement>(null);
  useMotionValueEvent(mv ?? FALLBACK, "change", (v) =>
    ref.current?.setAttribute("opacity", v.toFixed(3)),
  );
  return [ref, (mv ? mv.get() : 0).toFixed(3)] as const;
}

// A never-changing value so the hooks above can be called unconditionally.
const FALLBACK = motionValue(0);

/** Soft white steam puffs from the nostril (CSS one-shot, re-keyed per burst). */
function Steam({
  x,
  y,
  grad,
  burst,
  puffs,
}: {
  x: number;
  y: number;
  grad: string;
  burst: number;
  puffs: readonly (readonly [number, number, number, number, number])[];
}) {
  return (
    <g key={burst}>
      {puffs.map(([jx, jy, dx, dy, s], i) => (
        <ellipse
          key={i}
          className="bx-puff"
          cx={x}
          cy={y}
          rx={11}
          ry={7}
          fill={`url(#${grad})`}
          style={{
            ["--jx" as string]: jx,
            ["--jy" as string]: jy,
            ["--dx" as string]: dx,
            ["--dy" as string]: dy,
            ["--s" as string]: s,
            ["--d" as string]: `${i * 0.035}s`,
          }}
        />
      ))}
    </g>
  );
}

// [jetX, jetY, driftX, driftY, scale] in art units — jet down/forward, then drift back & up.
const BULL_PUFFS = [
  [10, 14, -40, -18, 3.6],
  [18, 8, -58, -34, 4.2],
  [6, 18, -30, 6, 3.2],
  [14, 4, -70, -10, 4.8],
  [4, 12, -24, -30, 3],
  [16, 16, -50, 12, 3.8],
  [8, 6, -82, -26, 5.2],
  [20, 12, -36, -44, 3.4],
] as const;

export function BullArt({
  head,
  leg,
  dust,
  rage,
  burst = 0,
  idle = true,
  className = "",
}: {
  head?: MotionValue<number>;
  leg?: MotionValue<number>;
  dust?: MotionValue<number>;
  /** 0..1 — the eye burns red (fast scrolling makes the bull angry). */
  rage?: MotionValue<number>;
  burst?: number;
  idle?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const [headRef, headT] = useRotate(head, 196, 70);
  const [legRef, legT] = useRotate(leg, 146, 140);
  const [dustRef, dustO] = useOpacity(dust);
  const [rageRef, rageO] = useOpacity(rage);
  const steam = `bxs${uid}`;
  const glow = `bxg${uid}`;
  const fadeId = `bxm${uid}`;
  return (
    <svg
      viewBox="-6 0 316 190"
      className={`block h-auto w-full overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={steam}>
          <stop offset="0" stopColor="rgba(245,247,247,.85)" />
          <stop offset=".5" stopColor="rgba(245,247,247,.6)" />
          <stop offset="1" stopColor="rgba(245,247,247,0)" />
        </radialGradient>
        <linearGradient
          id={`${fadeId}g`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="101"
          y2="0"
        >
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask
          id={fadeId}
          maskUnits="userSpaceOnUse"
          x="-10"
          y="-10"
          width="336"
          height="210"
        >
          <rect
            x="-10"
            y="-10"
            width="336"
            height="210"
            fill={`url(#${fadeId}g)`}
          />
        </mask>
        <radialGradient id={glow}>
          <stop offset="0" stopColor={UP} stopOpacity=".95" />
          <stop offset="1" stopColor={UP} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${glow}r`}>
          <stop offset="0" stopColor={DOWN} stopOpacity="1" />
          <stop offset="1" stopColor={DOWN} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* hoof dust */}
      <g ref={dustRef} opacity={dustO} fill="rgba(163,170,172,.28)">
        <ellipse cx="118" cy="178" rx="16" ry="5" />
        <ellipse cx="96" cy="174" rx="11" ry="6" />
        <ellipse cx="170" cy="180" rx="12" ry="4" />
      </g>
      {/* front leg (paws the ground) */}
      <g ref={legRef} transform={legT}>
        <polygon points="132,138 162,138 166,170 136,170" fill="#1b2024" />
        <polygon points="146,138 162,138 166,170 152,170" fill="#232a2e" />
        <polygon points="135,169 167,169 170,180 132,180" fill="#0b0d0f" />
      </g>
      {/* body: shoulder, heavy hump, neck */}
      <g mask={`url(#${fadeId})`}>
        <g
          className={idle ? "bx-breathe" : undefined}
          style={{ transformOrigin: "60px 180px" }}
        >
          <polygon points="0,60 40,40 110,55 60,80" fill="#1f2529" />
          <polygon points="40,40 80,22 115,14 110,55" fill="#2c3439" />
          <polygon points="115,14 145,22 170,40 110,55" fill="#262d32" />
          <polygon points="0,60 60,80 0,132" fill="#171b1e" />
          <polygon points="60,80 110,55 132,102" fill="#21282c" />
          <polygon points="110,55 170,40 198,64 132,102" fill="#1b2024" />
          <polygon points="132,102 198,64 204,112" fill="#252c30" />
          <polygon points="0,132 60,80 132,102 104,142 40,136" fill="#14181b" />
          <polygon
            points="132,102 204,112 184,130 150,146 104,142"
            fill="#1a1f23"
          />
          <polyline
            points="0,60 40,40 80,22 115,14 145,22 170,40 198,64"
            fill="none"
            stroke={UP}
            strokeWidth="1.6"
            strokeLinejoin="round"
            opacity=".85"
          />
          <polyline
            points="204,112 184,130 150,146"
            fill="none"
            stroke={UP}
            strokeWidth="1"
            opacity=".35"
          />
        </g>
      </g>
      {/* head + horns (rotates about the neck joint) */}
      <g ref={headRef} transform={headT}>
        <polygon
          points="228,66 242,50 264,40 306,34 272,50 248,68"
          fill="#5f6a70"
        />
        <polygon points="206,62 186,52 194,74" fill="#20262a" />
        <polygon points="198,56 238,58 256,90 206,92" fill="#2b3338" />
        <polygon points="238,58 276,100 256,90" fill="#38424a" />
        <polygon points="256,90 276,100 290,124 262,122" fill="#283035" />
        <polygon
          points="206,92 256,90 262,122 234,140 204,120"
          fill="#1d2327"
        />
        <polygon
          points="262,122 290,124 298,140 292,158 264,160 248,146"
          fill="#30383d"
        />
        <polygon
          points="248,146 264,160 292,158 284,166 252,164"
          fill="#1a1f23"
        />
        <polygon
          points="204,120 234,140 248,146 252,164 232,158 212,138"
          fill="#121518"
        />
        <ellipse cx="288" cy="138" rx="4" ry="2.6" fill="#040506" />
        {/* near horn: base → up → forward hook, lighter steel facets */}
        <polygon
          points="220,64 226,44 242,30 266,20 304,16 268,32 248,46 238,64"
          fill="#9aa5ab"
        />
        <polygon
          points="226,44 242,30 266,20 304,16 268,32 248,46"
          fill="#c9d1d5"
        />
        <polygon points="220,64 238,64 234,58 224,58" fill="#5d676d" />
        {/* angry brow + eye slit with glow */}
        <polygon points="220,74 254,82 251,86 222,79" fill="#4a545a" />
        <circle
          key={`f${burst}`}
          className={burst ? "bx-flare" : "bx-eyeglow"}
          cx="239"
          cy="86"
          r="9"
          fill={`url(#${glow})`}
        />
        <polygon points="230,83 248,87 244,90 231,87" fill={UP} />
        {/* rage: the eye burns red over the green */}
        <g ref={rageRef} opacity={rageO}>
          <circle cx="239" cy="86" r="14" fill={`url(#${glow}r)`} />
          <polygon points="230,83 248,87 244,90 231,87" fill={DOWN} />
        </g>
        <polyline
          points="198,56 238,58 276,100 290,124 298,140"
          fill="none"
          stroke={UP}
          strokeWidth="1.4"
          strokeLinejoin="round"
          opacity=".8"
        />
        {idle && (
          <ellipse
            className="bx-idle"
            cx="292"
            cy="142"
            rx="6"
            ry="4"
            fill={`url(#${steam})`}
          />
        )}
        {burst > 0 && (
          <Steam
            x={292}
            y={142}
            grad={steam}
            burst={burst}
            puffs={BULL_PUFFS}
          />
        )}
      </g>
    </svg>
  );
}

export function BearArt({
  head,
  paw,
  burst = 0,
  idle = true,
  className = "",
}: {
  head?: MotionValue<number>;
  paw?: MotionValue<number>;
  burst?: number;
  idle?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const [headRef, headT] = useRotate(head, 96, 96);
  const [pawRef, pawT] = useRotate(paw, 108, 136);
  const glow = `bxr${uid}`;
  const fadeId = `bxn${uid}`;
  return (
    <svg
      viewBox="0 0 232 200"
      className={`block h-auto w-full overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`${fadeId}g`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="74"
          y2="0"
        >
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask
          id={fadeId}
          maskUnits="userSpaceOnUse"
          x="-10"
          y="-10"
          width="252"
          height="220"
        >
          <rect
            x="-10"
            y="-10"
            width="252"
            height="220"
            fill={`url(#${fadeId}g)`}
          />
        </mask>
        <radialGradient id={glow}>
          <stop offset="0" stopColor={DOWN} stopOpacity=".95" />
          <stop offset="1" stopColor={DOWN} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* shoulder mass with hump */}
      <g mask={`url(#${fadeId})`}>
        <g
          className={idle ? "bx-breathe" : undefined}
          style={{ transformOrigin: "60px 200px" }}
        >
          <polygon points="0,122 22,92 58,78 50,132" fill="#2c3439" />
          <polygon points="58,78 92,80 50,132" fill="#242b2f" />
          <polygon points="0,122 50,132 0,200" fill="#171b1e" />
          <polygon points="50,132 92,80 120,112 102,162" fill="#1d2327" />
          <polygon points="0,200 50,132 102,162 72,200" fill="#14181b" />
          <polygon
            points="102,162 120,112 134,152 140,200 72,200"
            fill="#1a1f23"
          />
          <polyline
            points="0,122 22,92 58,78 92,80"
            fill="none"
            stroke={DOWN}
            strokeWidth="1.6"
            strokeLinejoin="round"
            opacity=".85"
          />
        </g>
      </g>
      {/* raised arm + big paw (behind the head so the face stays readable) with steel claws (rotates about the shoulder) */}
      <g ref={pawRef} transform={pawT}>
        <polygon
          points="104,142 118,118 176,74 190,80 196,94 132,152"
          fill="#1d2327"
        />
        <polygon points="118,118 176,74 190,80 140,120" fill="#2c3439" />
        <polygon
          points="182,62 194,48 212,46 220,58 214,78 196,84 184,78"
          fill="#252c30"
        />
        <polygon points="194,48 212,46 220,58 202,62" fill="#3b444a" />
        <polygon points="200,48 206,30 212,26 208,48" fill="#c9d1d5" />
        <polygon points="210,50 220,34 226,32 216,54" fill="#c9d1d5" />
        <polygon points="216,58 228,48 232,48 219,64" fill="#9aa5ab" />
        <polygon points="214,72 226,68 229,70 214,78" fill="#9aa5ab" />
        <polyline
          points="118,118 176,74 194,48 212,46"
          fill="none"
          stroke={DOWN}
          strokeWidth="1.3"
          strokeLinejoin="round"
          opacity=".8"
        />
      </g>
      {/* head: rounded ears, snout, snarl */}
      <g ref={headRef} transform={headT}>
        <polygon points="80,48 82,34 92,28 103,32 106,46" fill="#2a3136" />
        <polygon points="87,44 91,36 98,37 99,45" fill="#101315" />
        <polygon points="108,42 110,28 120,23 130,28 129,42" fill="#2f373c" />
        <polygon points="114,40 117,30 124,30 124,40" fill="#101315" />
        <polygon points="90,46 112,38 134,42 120,66 96,64" fill="#353e43" />
        <polygon points="80,62 90,46 96,64 100,104 82,86" fill="#1d2327" />
        <polygon points="96,64 120,66 128,108 100,104" fill="#232a2e" />
        <polygon points="134,42 152,58 120,66" fill="#2b3338" />
        <polygon points="152,58 186,70 160,80 120,66" fill="#30383d" />
        <polygon
          points="120,66 160,80 190,82 182,92 166,96 128,108"
          fill="#1a1f23"
        />
        <polygon points="128,108 166,98 178,96 152,110" fill="#121518" />
        <polygon points="166,93 170,101 173,93" fill="#c9d1d5" />
        <polygon points="154,97 158,105 161,96" fill="#c9d1d5" />
        <polygon points="182,68 192,73 192,82 183,80" fill="#040506" />
        <polygon points="126,50 154,57 152,60 127,54" fill="#4a545a" />
        <circle
          key={`f${burst}`}
          className={burst ? "bx-flare" : "bx-eyeglow"}
          cx="141"
          cy="61"
          r="9"
          fill={`url(#${glow})`}
        />
        <polygon points="133,58 149,62 146,65 133,61" fill={DOWN} />
        <polyline
          points="80,62 90,46 112,38 134,42 152,58 186,70"
          fill="none"
          stroke={DOWN}
          strokeWidth="1.4"
          strokeLinejoin="round"
          opacity=".8"
        />
      </g>
    </svg>
  );
}

/* Shared keyframes/layout for BullCharge, BearSwipe and BullBearFaceoff
 * (React 19 hoists + dedupes <style href precedence>). Transform/opacity only. */
export const BEAST_CSS = [
  "@keyframes bx-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.022)}}",
  ".bx-breathe{transform-box:view-box;animation:bx-breathe 2.8s ease-in-out infinite}",
  "@keyframes bx-puff{0%{opacity:0;transform:translate(0,0) scale(.3)}10%{opacity:1;transform:translate(calc(var(--jx)*1px),calc(var(--jy)*1px)) scale(.9)}100%{opacity:0;transform:translate(calc(var(--dx)*1px),calc(var(--dy)*1px)) scale(var(--s))}}",
  ".bx-puff{transform-box:fill-box;transform-origin:center;opacity:0;animation:bx-puff 1.25s cubic-bezier(.15,.75,.3,1) var(--d) both}",
  "@keyframes bx-idle{0%,58%{opacity:0;transform:translate(0,0) scale(.4)}64%{opacity:.75;transform:translate(5px,6px) scale(1)}100%{opacity:0;transform:translate(-26px,-10px) scale(2.6)}}",
  ".bx-idle{transform-box:fill-box;transform-origin:center;opacity:0;animation:bx-idle 3.4s ease-out infinite}",
  "@keyframes bx-flare{0%{opacity:.4;transform:scale(1)}14%{opacity:1;transform:scale(2.9)}100%{opacity:.45;transform:scale(1)}}",
  ".bx-flare{transform-box:fill-box;transform-origin:center;animation:bx-flare .9s cubic-bezier(.2,.8,.2,1) both}",
  ".bx-eyeglow{opacity:.45}",
  "@keyframes bx-claw{0%{opacity:1;transform:rotate(var(--r)) scaleX(0)}30%{opacity:1;transform:rotate(var(--r)) scaleX(1)}70%{opacity:.9}100%{opacity:0;transform:rotate(var(--r)) scaleX(1)}}",
  ".bx-claw{position:absolute;height:3px;width:var(--w);border-radius:3px;background:linear-gradient(90deg,rgba(255,59,59,0),#FF3B3B 22%,#FF6464 55%,rgba(255,59,59,0));box-shadow:0 0 10px rgba(255,59,59,.55);transform-origin:0 50%;opacity:0;animation:bx-claw 1.2s cubic-bezier(.2,.8,.2,1) var(--d) both}",
  "@keyframes bx-spark{0%{opacity:1;transform:rotate(var(--r)) translateX(4px) scaleX(.1)}35%{opacity:1;transform:rotate(var(--r)) translateX(10px) scaleX(1)}100%{opacity:0;transform:rotate(var(--r)) translateX(22px) scaleX(.2)}}",
  ".bx-spark{position:absolute;left:0;top:0;height:2px;width:16px;border-radius:2px;transform-origin:0 50%;opacity:0;animation:bx-spark .6s cubic-bezier(.2,.8,.2,1) var(--d) both}",
  "@keyframes bx-flash{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(1.8)}}",
  ".bx-flash{position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,rgba(245,247,247,.95),rgba(245,247,247,0) 70%);opacity:0;animation:bx-flash .45s ease-out both}",
  // Bull stage: above the heading on small screens; from xl (1280px) beside it.
  // The xl clip box spans the heading box plus the measured free room to the
  // viewport edge (--bx-room), so the bull can enter from off-screen and its
  // horns can reach the words without ever widening the page.
  ".bx-stage{position:relative;height:100px;overflow:clip;pointer-events:none}",
  ".bx-stage .bx-art{position:absolute;bottom:0;width:172px}",
  ".bx-stage[data-side=right] .bx-art{right:0}",
  ".bx-stage[data-side=left] .bx-art{left:0}",
  "@media (min-width:1280px){.bx-stage{position:absolute;top:50%;height:360px;margin-top:-180px}",
  ".bx-stage[data-side=right]{left:0;right:calc(-1 * var(--bx-room,0px))}",
  ".bx-stage[data-side=left]{right:0;left:calc(-1 * var(--bx-room,0px))}",
  // hooves on the heading's last line, not hanging mid-air beside it
  ".bx-stage .bx-art{width:300px;top:auto;bottom:calc(180px - var(--bx-rh,0px) / 2 - 18px)}",
  ".bx-stage[data-side=right] .bx-art{right:auto;left:calc(100% - var(--bx-room,0px) - var(--bx-gap,0px) - 58px)}",
  ".bx-stage[data-side=left] .bx-art{left:auto;right:calc(100% - var(--bx-room,0px) - var(--bx-gap,0px) - 58px)}}",
  "@media (prefers-reduced-motion:reduce){.bx-breathe,.bx-flare{animation:none!important}.bx-idle,.bx-puff,.bx-claw,.bx-spark,.bx-flash{display:none}}",
  // The page's own Motion toggle, and pausing loops while off-screen.
  "html[data-reduce-motion=true] .bx-breathe,html[data-reduce-motion=true] .bx-flare{animation:none!important}html[data-reduce-motion=true] .bx-idle,html[data-reduce-motion=true] .bx-puff,html[data-reduce-motion=true] .bx-claw,html[data-reduce-motion=true] .bx-spark,html[data-reduce-motion=true] .bx-flash{display:none}",
  "[data-offscreen] .bx-breathe,[data-offscreen] .bx-idle,[data-offscreen] .bx-flare{animation-play-state:paused}",
].join("");

export function BeastStyles() {
  return (
    <style href="afvar-demo-beasts" precedence="default">
      {BEAST_CSS}
    </style>
  );
}
