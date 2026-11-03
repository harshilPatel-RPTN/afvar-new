"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { horizonStars } from "@/modules/platform/kit";
import "./home-ambient.css";

// Most stars are still. Two quiet groups twinkle out of phase, avoiding an
// independently animated element for every point in the closing sky.
const stars = horizonStars.slice(0, 84);
const starGroups = [0, 1, 2].map(group =>
  stars.map((star, index) => ({ star, index })).filter(({ index }) =>
    (index % 7 === 0 ? 1 : index % 5 === 0 ? 2 : 0) === group),
);

// Like the launch-section rain, these marks are decoration only. Fixed lanes
// and staggered phases leave space around the headline and the AI core.
const drifters = [
  { sign: "+", x: 6,  y: 24, dx: 12,  size: 17, seconds: 16, delay: 4 },
  { sign: "−", x: 86, y: 37, dx: -12, size: 20, seconds: 19, delay: 11 },
  { sign: "+", x: 26, y: 80, dx: -8,  size: 15, seconds: 21, delay: 13 },
  { sign: "−", x: 62, y: 62, dx: 14,  size: 18, seconds: 18, delay: 5 },
  { sign: "−", x: 17, y: 55, dx: -10, size: 16, seconds: 22, delay: 16 },
  { sign: "+", x: 76, y: 16, dx: 9,   size: 15, seconds: 17, delay: 12 },
  { sign: "−", x: 42, y: 20, dx: 16,  size: 14, seconds: 20, delay: 2 },
  { sign: "+", x: 92, y: 76, dx: -12, size: 18, seconds: 23, delay: 9 },
  { sign: "−", x: 3,  y: 88, dx: 10,  size: 17, seconds: 19, delay: 7 },
  { sign: "+", x: 50, y: 10, dx: -9,  size: 16, seconds: 18, delay: 14 },
  { sign: "+", x: 96, y: 46, dx: -10, size: 17, seconds: 20, delay: 3 },
  { sign: "−", x: 34, y: 92, dx: 11,  size: 15, seconds: 21, delay: 10 },
  { sign: "+", x: 83, y: 92, dx: -8,  size: 16, seconds: 22, delay: 6 },
  { sign: "−", x: 58, y: 28, dx: 10,  size: 15, seconds: 17, delay: 15 },
  { sign: "+", x: 2,  y: 42, dx: 9,   size: 15, seconds: 23, delay: 1 },
  { sign: "−", x: 70, y: 8,  dx: -11, size: 16, seconds: 19, delay: 18 },
  { sign: "+", x: 47, y: 74, dx: 8,   size: 14, seconds: 20, delay: 8 },
  { sign: "−", x: 98, y: 12, dx: -9,  size: 15, seconds: 18, delay: 13 },
];

export function HomeAmbient() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const sync = () => { host.dataset.paused = String(document.hidden); };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div ref={root} data-home-ambient="" aria-hidden="true" className="home-ambient">
      <svg data-ambient-stars="" focusable="false" aria-hidden="true" className="home-ambient-stars">
        {starGroups.map((group, index) => (
          <g key={index} data-twinkle={index}>
            {group.map(({ star, index: i }) => (
              <circle key={i} cx={star.x + "%"} cy={(star.y / 52 * 100).toFixed(2) + "%"}
                r={Math.max(.6, star.size * .54)} fill={star.color}
                fillOpacity={star.alpha * .9} data-bright={star.size >= 2.5 || undefined} data-wide={i >= 32 || undefined} />
            ))}
          </g>
        ))}
      </svg>
      {drifters.map(({ sign, x, y, dx, size, seconds, delay }, i) => (
        <span key={i} data-ambient-sign={sign === "+" ? "plus" : "minus"} data-wide={i >= 4 || undefined}
          style={{ left: x + "%", top: y + "%", fontSize: size, "--dx": dx + "px",
            animationDuration: seconds + "s", animationDelay: -delay + "s" } as CSSProperties}>
          {/* Each mark also blinks on its own beat while it drifts. */}
          <span data-ambient-blink="" style={{ animationDuration: 2.4 + (i % 5) * 0.7 + "s", animationDelay: -(i * 0.9) + "s" }}>{sign}</span>
        </span>
      ))}
    </div>
  );
}
