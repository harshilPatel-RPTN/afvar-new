"use client";

// FX trading sessions — real visitor time, honest labels. Three standard
// (approximate) session windows in UTC; each pill shows OPEN/CLOSED from the
// visitor's actual clock plus a 24h bar with the window and a "now" marker.
// Hydration-stable: the server snapshot is null (neutral placeholder) and the
// client snapshot is a 30s time bucket from useSyncExternalStore, so render
// stays pure and nothing calls setState in an effect.
import { useInView } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePauseOffscreen } from "./bits";
import { playSfx } from "./sfx";

/** Standard approximate FX session hours (UTC). DST shifts these by ~1h. */
const SESSIONS = [
  { id: "tokyo", city: "Tokyo", open: 0, close: 9 },
  { id: "london", city: "London", open: 7, close: 16 },
  { id: "newyork", city: "New York", open: 12, close: 21 },
] as const;

const BUCKET_MS = 30_000;

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, BUCKET_MS);
  return () => window.clearInterval(id);
}
/** Stable between ticks: the current 30s bucket (a primitive, so no re-render loop). */
const getSnapshot = () => Math.floor(Date.now() / BUCKET_MS);
const getServerSnapshot = () => null;

const KEYFRAMES = [
  "@keyframes mk-bell{0%{transform:rotate(0)}15%{transform:rotate(-7deg)}30%{transform:rotate(6deg)}45%{transform:rotate(-4deg)}60%{transform:rotate(3deg)}75%{transform:rotate(-1.5deg)}100%{transform:rotate(0)}}",
  ".mk-bell-ring{transform-origin:50% 0;animation:mk-bell .7s cubic-bezier(.36,.07,.19,.97) both}",
  "@media (prefers-reduced-motion:reduce){.mk-bell-ring{animation:none!important}}",
].join("");

/** FX is shut from Friday's New York close to Sunday's Asia-Pacific open (~21:00 UTC). */
function isWeekend(date: Date) {
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  return day === 6 || (day === 5 && hour >= 21) || (day === 0 && hour < 21);
}

/** Module-level so the bell rings at most once per page view, across remounts. */
let bellRung = false;

export function SessionClock() {
  const bucket = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: "0px 0px -10% 0px" });
  const pauseRef = usePauseOffscreen<HTMLDivElement>();

  const now = bucket === null ? null : new Date(bucket * BUCKET_MS);
  const weekend = now ? isWeekend(now) : false;
  const hours = now ? now.getUTCHours() + now.getUTCMinutes() / 60 : 0;
  const openIds = new Set<string>(now && !weekend ? SESSIONS.filter((s) => hours >= s.open && hours < s.close).map((s) => s.id) : []);
  const overlap = openIds.has("london") && openIds.has("newyork");
  const ring = inView && now !== null && openIds.size > 0;

  // Side effect only (no state): a soft session chime, once per page view (the hero owns the opening bell).
  // playSfx itself is opt-in (sound toggle) and throttled.
  useEffect(() => {
    if (!ring || bellRung) return;
    bellRung = true;
    playSfx("chime");
  }, [ring]);

  let status: string;
  if (!now) status = "Checking session times…";
  else if (weekend) status = "Weekend · FX closed";
  else if (openIds.size > 0) status = `${SESSIONS.filter((s) => openIds.has(s.id)).map((s) => s.city).join(" + ")} open`;
  else status = "Between main sessions · Asia-Pacific (Sydney/Wellington) only";

  const utcLabel = now ? `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} UTC` : "--:-- UTC";

  return (
    <div
      ref={(el) => {
        wrapRef.current = el;
        pauseRef.current = el;
      }}
      data-session-clock
      data-state={now ? (weekend ? "weekend" : overlap ? "overlap" : openIds.size ? "open" : "quiet") : "pending"}
      className="mt-3 rounded-xl border border-white/[.07] bg-[#0B0D0E] px-2.5 py-2.5"
    >
      <style href="afvar-session-clock" precedence="default">
        {KEYFRAMES}
      </style>
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-[.14em] text-[#6D7578]">
          FX sessions <span className="font-normal normal-case tracking-normal">· approx. hours, UTC</span>
        </p>
        <p className="shrink-0 font-mono text-[10.5px] tabular-nums text-[#A3AAAC]" suppressHydrationWarning>
          {utcLabel}
        </p>
      </div>

      <ul className="mt-2 grid grid-cols-3 gap-1.5">
        {SESSIONS.map((session) => {
          const open = openIds.has(session.id);
          const inOverlap = overlap && (session.id === "london" || session.id === "newyork");
          return (
            <li
              key={session.id}
              data-session={session.id}
              data-open={open ? "true" : "false"}
              className={`min-w-0 rounded-lg border px-2 py-1.5 transition-colors duration-300 ${
                inOverlap ? "border-[#00E676]/45 bg-[#00E676]/[.07]" : open ? "border-white/[.14] bg-[#171B1D]" : "border-white/[.06] bg-[#111416]"
              } ${open && ring ? "mk-bell-ring" : ""}`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${open ? "bg-[#00E676] motion-safe:animate-pulse" : "bg-[#6D7578]/60"}`}
                />
                <span className="truncate text-[11.5px] font-semibold text-[#F5F7F7]">{session.city}</span>
              </div>
              <p className={`mt-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wide ${now ? (open ? "text-[#00E676]" : "text-[#6D7578]") : "text-[#6D7578]/60"}`}>
                {now ? (open ? "Open" : "Closed") : "—"}
              </p>
              {/* 24h timeline: session window + "now" marker (transform only). */}
              <div className="relative mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[.06]" aria-hidden="true">
                <span
                  className={`absolute inset-y-0 rounded-full ${open ? "bg-[#00E676]/70" : "bg-white/[.18]"}`}
                  style={{ left: `${(session.open / 24) * 100}%`, width: `${((session.close - session.open) / 24) * 100}%` }}
                />
                {now && (
                  <span
                    className="absolute inset-y-[-1px] left-0 w-full"
                    style={{ transform: `translateX(${(hours / 24) * 100}%)`, transition: "transform .6s cubic-bezier(.16,1,.3,1)" }}
                  >
                    <span className="absolute inset-y-0 left-0 w-[2px] -translate-x-1/2 bg-[#F5F7F7]" />
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-[9px] tabular-nums text-[#6D7578]">
                {String(session.open).padStart(2, "0")}–{String(session.close).padStart(2, "0")}
              </p>
              <span className="sr-only">
                {session.city} session, approximately {session.open}:00 to {session.close}:00 UTC, {now ? (open ? "open now" : "closed now") : "status loading"}
              </span>
            </li>
          );
        })}
      </ul>

      <p data-session-status className={`mt-2 px-0.5 text-[11px] leading-snug ${overlap ? "text-[#00E676]" : "text-[#A3AAAC]"}`} aria-live="polite">
        {overlap && <span className="mr-1 font-semibold">Overlap ·</span>}
        {overlap ? "London + New York both open — usually the busiest FX window" : status}
      </p>
    </div>
  );
}
