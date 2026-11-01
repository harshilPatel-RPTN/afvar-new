// AFVAR OS theme — the one visual language for every AI-first page.
//
// Rules (keep them when building new pages):
//   • Gold is the AI. Anything the AI does, says or owns is gold.
//   • Green / red only ever mean market up / down (or allowed / refused).
//   • Near-black surfaces, hairline borders, no glassmorphism.
//   • Manrope for words, Geist Mono for labels, numbers and timestamps.
//   • Every illustration is labelled; every sample is marked SAMPLE.

export const COLORS = {
  bg: "#050607",
  surface: "#0F1214",
  surface2: "#15191B",
  raised: "#1B2023",
  line: "rgba(255,255,255,0.1)",
  gold: "#E9B44C",
  goldHot: "#FFD98A",
  goldDeep: "#7A4E10",
  ink: "#F5F7F7",
  ink2: "#C9CFD1",
  dim: "#A3AAAC",
  mute: "#6D7578",
  up: "#00E676",
  down: "#FF4D4D",
  downSoft: "#FF6B6B",
  metal: "#2A2F35",
} as const;

/* ---------------------------------------------------------------- classes */

export const MONO = "font-mono text-[11px] tracking-[0.18em] uppercase";
export const HAIR = "border-[rgba(255,255,255,0.1)]";
export const EYEBROW = `${MONO} text-[#E9B44C]`;
export const H1 = "text-[clamp(2.6rem,4.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[#F5F7F7]";
export const H2 = "text-[clamp(2rem,3.4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#F5F7F7]";
export const H3 = "text-[clamp(1.4rem,2vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#F5F7F7]";
export const BODY = "text-base leading-relaxed text-[#A3AAAC] xl:text-[17px]";
export const SMALL = "text-[13px] leading-snug text-[#8A9295]";
/** Secondary half of a headline: `<span className={SOFT}>…</span>`. */
export const SOFT = "text-[#A3AAAC]";
export const GOLD_TEXT = "text-[#E9B44C]";

export const CARD = "rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0F1214]";
export const CARD_AI = "rounded-2xl border border-[rgba(233,180,76,0.35)] bg-[#0F1214]";
export const CHIP = "rounded-full border border-[rgba(255,255,255,0.14)] px-3.5 py-1.5 text-[13px] text-[#C9CFD1]";

export const GOLD_CTA =
  "afv-cta afv-gold inline-block rounded-full bg-[#E9B44C] px-6 py-3 text-sm font-semibold text-[#1A1206] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD98A]";
export const GHOST_LINK = "afv-link inline-flex min-h-6 items-end text-sm font-medium text-[#A3AAAC] transition-colors hover:text-[#F5F7F7]";

/* -------------------------------------------------------------------- CSS */

/** Global CSS the theme relies on. Render once per page with <AfvarStyles />. */
export const AFVAR_CSS = `
.afv-cta { position: relative; overflow: hidden; isolation: isolate; transition: transform .12s ease; }
.afv-cta::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #69F0AE; transform: translateY(101%); transition: transform .35s cubic-bezier(.2,.8,.2,1); }
.afv-cta:hover::before, .afv-cta:focus-visible::before { transform: translateY(0); }
.afv-cta:active { transform: scale(.98); }
.afv-gold::before { background: #FFD98A; }
.afv-link { background: linear-gradient(currentColor, currentColor) left bottom / 0 1px no-repeat; padding-bottom: 2px; transition: background-size .3s ease, color .2s; }
.afv-link:hover, .afv-link:focus-visible { background-size: 100% 1px; }
@keyframes afv-voice { 0%,100% { transform: scaleY(.45) } 50% { transform: scaleY(1) } }
.afv-voice > span { animation: afv-voice 1.1s ease-in-out infinite; transform-origin: center; }
@keyframes afv-blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
.afv-caret { display: inline-block; width: 2px; height: 1em; margin-left: 2px; vertical-align: -0.15em; background: #E9B44C; animation: afv-blink 1s steps(1) infinite; }
/* The AI orb's glow breathes on opacity only (no box-shadow animation: that would repaint every frame). */
@keyframes afv-orb { 0%,100% { opacity: .3 } 50% { opacity: 1 } }
.afv-orb { position: relative; box-shadow: 0 0 10px 2px rgba(233,180,76,.45); }
.afv-orb::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: 0 0 22px 6px rgba(233,180,76,.75); opacity: .3; animation: afv-orb 1.8s ease-in-out infinite; will-change: opacity; }
/* Anything scrolled out of view stops animating (set by PauseOffscreen). */
[data-offscreen], [data-offscreen] *, [data-offscreen] *::before, [data-offscreen] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .afv-cta, .afv-cta::before, .afv-link { transition: none; }
  .afv-voice > span, .afv-caret, .afv-orb::after { animation: none; }
}
html[data-reduce-motion="true"] .afv-cta, html[data-reduce-motion="true"] .afv-cta::before, html[data-reduce-motion="true"] .afv-link { transition: none; }
html[data-reduce-motion="true"] .afv-voice > span, html[data-reduce-motion="true"] .afv-caret, html[data-reduce-motion="true"] .afv-orb::after { animation: none; }
`;
