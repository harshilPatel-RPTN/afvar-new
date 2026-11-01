"use client";

// On/off switch for the homepage's sound effects (on by default; audio starts
// after the visitor's first click/tap/key). No background/ambient audio. Solid
// surface, no glass. Fixed bottom-left, above the scroll-candle meter.
import { useSoundEnabled } from "./sfx";

export function SoundToggle() {
  const [on, setOn] = useSoundEnabled();

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 flex items-center gap-2 sm:left-6">
    <button
      type="button"
      onClick={() => setOn(!on)}
      aria-pressed={on}
      aria-label={on ? "Turn homepage sound off" : "Turn homepage sound on"}
      className="inline-flex items-center gap-2 rounded-full border border-white/[.11] bg-(--afvar-panel) px-3.5 py-2 text-[12px] font-medium text-(--mk-dim) shadow-[0_10px_30px_-12px_rgba(0,0,0,.9)] transition-colors hover:border-white/[.25] hover:text-(--mk-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(245,247,247,.6)] "
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8h3l4-3.5v11L6.5 12h-3z" />
        {on ? (
          <>
            <path d="M13.5 7.5a3.5 3.5 0 0 1 0 5" />
            <path d="M15.6 5.4a6.5 6.5 0 0 1 0 9.2" />
          </>
        ) : (
          <path d="M13.5 8l4 4m0-4l-4 4" />
        )}
      </svg>
      <span>{on ? "Sound on" : "Sound off"}</span>
      {on && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#00E676]" />}
    </button>
    </div>
  );
}
