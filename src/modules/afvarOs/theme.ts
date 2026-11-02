// AFVAR OS theme — the one visual language for every AI-first page.
//
// Rules (keep them when building new pages):
//   • Pale mint identifies the AI. Crimson marks its smallest accent details.
//   • Green / red only ever mean market up / down (or allowed / refused).
//   • Charcoal canvases, forest panels and glass actions share the same palette.
//   • Manrope for words, Geist Mono for labels, numbers and timestamps.
//   • Every illustration is labelled; every sample is marked SAMPLE.

const mint = "#A8DEC2";
const mintHot = "#D8F3E4";
const mintDeep = "#315947";

export const COLORS = {
  bg: "#040404",
  surface: "#06110C",
  surface2: "#10231B",
  raised: "#1A2F25",
  line: "rgba(255,255,255,0.1)",
  mint, mintHot, mintDeep,
  // Earlier integrations use these names for the AI accent.
  gold: mint, goldHot: mintHot, goldDeep: mintDeep,
  crimson: "#A31C1B",
  ink: "#F2F5F2",
  ink2: "#C9CFD1",
  dim: "#B7C5BC",
  mute: "#92A399",
  up: "#00E676",
  down: "#FF4D4D",
  downSoft: "#FF6B6B",
  metal: "#2A2F35",
} as const;

/* ---------------------------------------------------------------- classes */

export const MONO = "font-mono text-[11px] tracking-[0.18em] uppercase";
export const HAIR = "border-[rgba(255,255,255,0.1)]";
export const EYEBROW = `${MONO} text-[#A8DEC2]`;
export const H1 = "text-[clamp(2.6rem,4.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[#F2F5F2]";
export const H2 = "text-[clamp(2rem,3.4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#F2F5F2]";
export const H3 = "text-[clamp(1.4rem,2vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#F2F5F2]";
export const BODY = "text-base leading-relaxed text-[#B7C5BC] xl:text-[17px]";
export const SMALL = "text-[13px] leading-snug text-[#8A9295]";
/** Secondary half of a headline: `<span className={SOFT}>…</span>`. */
export const SOFT = "text-[#B7C5BC]";
export const AI_TEXT = "text-[#A8DEC2]";

export const CARD = "rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#10231B]";
export const CARD_AI = "rounded-2xl border border-[rgba(168,222,194,0.35)] bg-[#10231B]";
export const CHIP = "rounded-full border border-[rgba(255,255,255,0.14)] px-3.5 py-1.5 text-[13px] text-[#C9CFD1]";

export const AI_CTA =
  "afvar-glass-button afvar-glass-primary inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-3 text-[13px] font-semibold sm:px-6 sm:text-sm";
/** Backward-compatible names for existing AI story consumers. */
export const GOLD_CTA = AI_CTA;
export const GOLD_TEXT = AI_TEXT;
export const GHOST_LINK = "afvar-glass-button inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium text-[#F2F5F2] sm:px-5 sm:text-sm";

/* -------------------------------------------------------------------- CSS */

/** Global CSS the theme relies on. Render once per page with <AfvarStyles />. */
export const AFVAR_CSS = `
.afv-cta { position: relative; overflow: hidden; isolation: isolate; transition: transform .12s ease; }
.afv-cta::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--afvar-mint); transform: translateY(101%); transition: transform .35s cubic-bezier(.2,.8,.2,1); }
.afv-cta:hover::before, .afv-cta:focus-visible::before { transform: translateY(0); }
.afv-cta:active { transform: scale(.98); }
.afv-link { background: linear-gradient(currentColor, currentColor) left bottom / 0 1px no-repeat; padding-bottom: 2px; transition: background-size .3s ease, color .2s; }
.afv-link:hover, .afv-link:focus-visible { background-size: 100% 1px; }
@keyframes afv-voice { 0%,100% { transform: scaleY(.45) } 50% { transform: scaleY(1) } }
.afv-voice > span { animation: afv-voice 1.1s ease-in-out infinite; transform-origin: center; }
@keyframes afv-blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
.afv-caret { display: inline-block; width: 2px; height: 1em; margin-left: 2px; vertical-align: -0.15em; background: #A8DEC2; animation: afv-blink 1s steps(1) infinite; }
/* The AI orb's glow breathes on opacity only (no box-shadow animation: that would repaint every frame). */
@keyframes afv-orb { 0%,100% { opacity: .3 } 50% { opacity: 1 } }
.afv-orb { position: relative; box-shadow: 0 0 10px 2px rgba(168,222,194,.45); }
.afv-orb::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: 0 0 22px 6px rgba(168,222,194,.75); opacity: .3; animation: afv-orb 1.8s ease-in-out infinite; will-change: opacity; }
/* Anything scrolled out of view stops animating (set by PauseOffscreen). */
[data-offscreen], [data-offscreen] *, [data-offscreen] *::before, [data-offscreen] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .afv-cta, .afv-cta::before, .afv-link { transition: none; }
  .afv-voice > span, .afv-caret, .afv-orb::after { animation: none; }
}
html[data-reduce-motion="true"] .afv-cta, html[data-reduce-motion="true"] .afv-cta::before, html[data-reduce-motion="true"] .afv-link { transition: none; }
html[data-reduce-motion="true"] .afv-voice > span, html[data-reduce-motion="true"] .afv-caret, html[data-reduce-motion="true"] .afv-orb::after { animation: none; }
/* Platform motion layer, hero A1/A3: the copy waits (hidden) until the splash has gone, then the
   staircase plays (HeroStage). Failsafe: it shows by itself after 5 s if the script never runs. */
@keyframes afv-failsafe { to { opacity: 1 } }
[data-afv-enter="wait"] [data-afv-copy] > * > *, [data-afv-enter="wait"] ~ [data-afv-cue] { opacity: 0; animation: afv-failsafe .01s 5s forwards; }
@media (prefers-reduced-motion: reduce) { [data-afv-enter="wait"] [data-afv-copy] > * > * { opacity: 1; animation: none; } }
html[data-reduce-motion="true"] [data-afv-enter="wait"] [data-afv-copy] > * > * { opacity: 1; animation: none; }
`;
