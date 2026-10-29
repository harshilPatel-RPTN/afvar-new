"use client";

// The site's bottom-left sound switch, aware of the browser's autoplay lock.
// Browsers keep audio silent until the first click / tap / key press (scrolling
// never counts), so while sound is chosen on but still locked the switch says
// "Tap for sound" and pulses; clicking it then unlocks audio instead of
// turning sound off.
import { resumeSound, useSoundState } from "./audio";

export function HomeSoundToggle() {
  const [state, setOn] = useSoundState();
  const locked = state === "locked";
  const on = state === "on";
  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 flex items-center gap-2 sm:left-6">
      <button
        type="button"
        onClick={() => (locked ? resumeSound() : setOn(state === "off"))}
        aria-pressed={state !== "off"}
        aria-label={on ? "Turn sound off" : locked ? "Sound is paused by the browser — tap to start it" : "Turn sound on"}
        className={`inline-flex items-center gap-2 rounded-full border bg-[#111416] px-3.5 py-2 text-[12px] font-medium shadow-[0_10px_30px_-12px_rgba(0,0,0,.9)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(245,247,247,.6)] ${
          locked ? "animate-pulse border-[#00E676]/60 text-[#00E676]" : "border-white/[.11] text-(--mk-dim) hover:border-white/[.25] hover:text-(--mk-text)"
        }`}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 8h3l4-3.5v11L6.5 12h-3z" />
          {state === "off" ? (
            <path d="M13.5 8l4 4m0-4l-4 4" />
          ) : (
            <>
              <path d="M13.5 7.5a3.5 3.5 0 0 1 0 5" />
              <path d="M15.6 5.4a6.5 6.5 0 0 1 0 9.2" />
            </>
          )}
        </svg>
        <span>{on ? "Sound on" : locked ? "Tap for sound" : "Sound off"}</span>
        {on && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#00E676]" />}
      </button>
    </div>
  );
}
