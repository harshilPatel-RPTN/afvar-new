"use client";

// Header switches: sound (opt-in) and reduce motion.
// Sound: Labelled, off by default, remembered per visitor.
// The click is the user gesture that unlocks WebAudio.
import { resumeSound, useSoundState } from "./audio";
import { useMotionToggle } from "./motionPref";
import { HAIR, MONO } from "./ui";

export function SoundButton() {
  const [state, setOn] = useSoundState();
  // "locked": chosen on, but the browser needs one tap before audio can play.
  const locked = state === "locked";
  return (
    <button
      type="button"
      aria-pressed={state !== "off"}
      aria-label={state === "on" ? "Sound on — turn off" : locked ? "Sound is on but paused by the browser — tap to start" : "Sound off — turn on"}
      onClick={() => (locked ? resumeSound() : setOn(state === "off"))}
      className={`flex h-10 items-center gap-2 rounded-full border px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69F0AE] ${
        state === "on" ? "border-[#00E676] text-[#00E676]" : locked ? "animate-pulse border-[#FFB020] text-[#FFB020]" : `${HAIR} text-[#A3AAAC] hover:text-(--afvar-text)`
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 6h3l4-3v10l-4-3H2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        {state === "off" ? (
          <path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        ) : (
          <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.6a6 6 0 0 1 0 8.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        )}
      </svg>
      <span className={`${MONO} hidden 2xl:inline`}>{state === "on" ? "Sound On" : locked ? "Tap for sound" : "Sound Off"}</span>
    </button>
  );
}

/** Page-level reduce-motion switch (WCAG 2.3.3). Stops scroll stories,
 *  marquees and reveals without touching system settings. */
export function MotionButton() {
  const [reduced, setReduced] = useMotionToggle();
  return (
    <button
      type="button"
      aria-pressed={reduced}
      aria-label={reduced ? "Motion reduced — turn animations back on" : "Reduce motion"}
      onClick={() => setReduced(!reduced)}
      className={`flex h-10 items-center gap-2 rounded-full border px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69F0AE] ${
        reduced ? "border-[#FFB020] text-[#FFB020]" : `${HAIR} text-[#A3AAAC] hover:text-(--afvar-text)`
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        {reduced ? (
          <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        ) : (
          <path d="M1.5 8c2-4 3.5-4 5.5 0s3.5 4 5.5 0 1.5-2 2-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        )}
      </svg>
      <span className={`${MONO} hidden 2xl:inline`}>Motion {reduced ? "Off" : "On"}</span>
    </button>
  );
}
