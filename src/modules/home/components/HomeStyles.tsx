// The "/" look as a reusable layer. Two parts:
//   • the green/red/black palette — `.mk.afvar-home` only ("/", /home-demo);
//   • the "/" motion — sparkline draws, price flashes, candle-row link
//     underlines, card print-in — on ANY `.mk` page that renders this, so the
//     markets / platform / pricing / company pages get the animations while
//     keeping their own colours.
import "../../markets/markets.css";
import { mkFontClassName } from "../../markets/fonts";
import { MarketMotionStyles } from "./marketMotion";

/** 12×6 tile: two tiny green candles (tall + short, each with a wick) — repeated along the underline. */
const CANDLE_ROW =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='12' height='6' viewBox='0 0 12 6'><g fill='#00E676'><rect x='2.5' y='0' width='1' height='6'/><rect x='1.5' y='1' width='3' height='4'/><rect x='8.5' y='1.5' width='1' height='4.5'/><rect x='7.5' y='3' width='3' height='2.5'/></g></svg>",
  );

const KEYFRAMES = [
  "@keyframes home-tape{to{transform:translateX(-50%)}}",
  "@keyframes modal-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
  // MARKET TERRAIN tokens (README §3): neutral graphite text/borders + green/red
  // market semantics over the markets-module `.mk` theme. In `@layer base` with
  // `.mk.afvar-home` specificity so it beats markets.css but never utilities.
  "@layer base{.mk.afvar-home{--mk-page:#030405;--mk-surface:#080A0B;--mk-raised:#111416;--mk-text:#F5F7F7;--mk-dim:#A3AAAC;--mk-faint:#6D7578;--mk-line:rgba(255,255,255,.11);--mk-accent:#FF3B3B;--mk-accent-bright:#FF6464;--mk-up:#00E676;--mk-primary:#00E676;--mk-primary-bright:#69F0AE;--mk-primary-deep:#00A85A;--mk-on-primary:#03140A;--mk-glow:#B9F6CA;--mk-footer:#030405;--mk-glass-border:rgba(255,255,255,.12);--mk-glass-border-hover:rgba(0,230,118,.5);--mk-glow-primary:0 0 0 1px rgba(105,240,174,.4),0 10px 30px -8px rgba(0,230,118,.45);--mk-glow-primary-strong:0 0 0 1px rgba(105,240,174,.6),0 14px 40px -8px rgba(0,230,118,.6);--mk-glow-card:0 0 0 1px rgba(0,230,118,.28),0 18px 48px -18px rgba(0,230,118,.25);background:#030405;color:#F5F7F7}",
  ".mk.afvar-home :focus-visible{outline:2px solid rgba(245,247,247,.6);outline-offset:2px}",
  ".mk.afvar-home ::selection{background:rgba(245,247,247,.22);color:#F5F7F7}",
  // perf: infinite loops pause while their container is off-screen (usePauseOffscreen)
  ".mk [data-offscreen],.mk [data-offscreen] *{animation-play-state:paused!important}",
  // Section motion (once per view) — any `.mk` page that renders <HomeStyles/>: sparkline / chart line draws, fill fade, real-tick price flash.
  ".mk .mk-draw{stroke-dasharray:1 1;stroke-dashoffset:1}",
  ".mk .mk-fadein{opacity:0}",
  ".mk [data-inview] .mk-draw{animation:home-draw .9s cubic-bezier(.16,1,.3,1) both}",
  ".mk [data-inview] .mk-draw-slow{animation-duration:1.1s}",
  ".mk [data-inview] .mk-fadein{animation:home-fade .45s cubic-bezier(.16,1,.3,1) .45s both}",
  ".mk .mk-flash-up{animation:home-flash-up .3s ease-out}",
  ".mk .mk-flash-down{animation:home-flash-down .3s ease-out}",
  "@media (prefers-reduced-motion:reduce){.mk .mk-draw{stroke-dashoffset:0;animation:none!important}.mk .mk-fadein{opacity:1;animation:none!important}}}",
  "@keyframes home-draw{to{stroke-dashoffset:0}}",
  "@keyframes home-fade{to{opacity:1}}",
  "@keyframes home-flash-up{from{color:#00E676}}",
  "@keyframes home-flash-down{from{color:#FF6464}}",
  // Candle-stick underline links (Phase 5 #6): inline text links in <main> (never buttons,
  // pills, chips or nav) swap the plain hover underline for a row of tiny green candles
  // that draws in left → right (clip-path). Reduced motion: the candle row appears static.
  `.mk main :is(a[class*="underline-offset"],p a):not([class*="rounded"],[role="button"]){position:relative;text-decoration:none}`,
  `.mk main :is(a[class*="underline-offset"],p a):not([class*="rounded"],[role="button"])::after{content:"";position:absolute;left:0;right:0;bottom:-7px;height:6px;pointer-events:none;background:url("${CANDLE_ROW}") 0 100%/12px 6px repeat-x;clip-path:inset(0 100% 0 0);opacity:0;transition:clip-path .5s cubic-bezier(.16,1,.3,1),opacity .12s linear}`,
  `.mk main :is(a[class*="underline-offset"],p a):not([class*="rounded"],[role="button"]):is(:hover,:focus-visible)::after{clip-path:inset(0 0 0 0);opacity:1}`,
  `@media (prefers-reduced-motion:reduce){.mk main :is(a[class*="underline-offset"],p a):not([class*="rounded"],[role="button"])::after{transition:none}}`,
  // The /home-demo look on every page in this scope: the markets / platform
  // gold is replaced by the green / red / black palette. Unlayered and one
  // class more specific than platform.css / markets.css so it always wins.
  ".afvar-home .ds-theme.pf-theme{--accent-pressed:#00A85A;--accent-dark:#00753F;--surface-inset:#050607;--surface-3:#171B1D;--surface-hover:#1C2124;--surface-active:#232A2E;--text-tertiary:#8A9295;--text-disabled:#4E5558;--ai-bg:#0B2A1D;--positive-soft:#07301D;--chart-grid:#1A2023;--mac-window:#111416;--mac-sidebar:rgba(17,20,22,.72);--mac-chrome:rgba(8,10,11,.55);--segment-active:#232A2E;--border-subtle:rgba(255,255,255,.08);--border-strong:rgba(255,255,255,.22);--accent-border:rgba(0,230,118,.45);--accent-subtle:rgba(0,230,118,.35);--accent-soft:rgba(0,230,118,.12);--mac-select:rgba(0,230,118,.9)}",
  // App icons: green for the primary/positive tones, red for risk, graphite for the rest (like "/"'s engine tiles).
  // Photo backdrops (gold / blue dunes, bokeh) become monochrome market green.
  ".afvar-home .pf-drift,.afvar-home .pf-animated-backdrop img{filter:grayscale(1) sepia(1) hue-rotate(85deg) saturate(2.2) brightness(.8)}",
  ".afvar-home .pf-tone-gold{background:linear-gradient(180deg,#69F0AE 0%,#00A85A 100%);color:#03140A}",
  ".afvar-home .pf-tone-green{background:linear-gradient(180deg,#00E676 0%,#007A41 100%)}",
  ".afvar-home .pf-tone-red{background:linear-gradient(180deg,#FF6464 0%,#C62828 100%)}",
  ".afvar-home .pf-tone-cyan,.afvar-home .pf-tone-slate{background:linear-gradient(180deg,#3A4246 0%,#1A1F22 100%);box-shadow:inset 0 0 0 1px rgba(0,230,118,.22)}",
  ".afvar-home .pf-tone-purple{background:linear-gradient(180deg,#2B3236 0%,#121517 100%);box-shadow:inset 0 0 0 1px rgba(255,59,59,.22)}",
  ".afvar-home .mk-gradient-text{background-image:linear-gradient(100deg,#B9F6CA 0%,#00E676 45%,#00A85A 100%)}",
  ".afvar-home .mk-spot::before{background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(0,230,118,.12),transparent 60%)}",
  ".afvar-home .mk-spot::after{background:radial-gradient(260px circle at var(--mx,50%) var(--my,50%),rgba(105,240,174,.8),rgba(0,230,118,.12) 45%,transparent 70%)}",
  ".afvar-home .pf-wallpaper,.afvar-home .pf-wall-night{background:radial-gradient(120% 80% at 10% 110%,rgba(0,230,118,.22),transparent 55%),radial-gradient(90% 70% at 95% 105%,rgba(255,59,59,.12),transparent 55%),linear-gradient(180deg,#0b0f0d 0%,#060807 100%)}",
  ".afvar-home .pf-wall-day{background:radial-gradient(120% 80% at 10% 110%,rgba(0,230,118,.3),transparent 55%),radial-gradient(90% 70% at 95% 105%,rgba(105,240,174,.16),transparent 55%),linear-gradient(180deg,#0d1612 0%,#080b0a 100%)}",
  ".afvar-home .pf-wall-dusk{background:radial-gradient(120% 80% at 50% 115%,rgba(255,59,59,.28),transparent 55%),radial-gradient(90% 70% at 10% 0%,rgba(0,230,118,.22),transparent 60%),linear-gradient(180deg,#120d0e 0%,#080707 100%)}",
  // Cards on the inherited pages (markets, platform, pricing, company): every
  // `.pf-tile` prints in like a candle — its body grows up from the bottom as
  // it enters — and an accent line draws across its top edge, in the page's
  // own accent colour. Pure CSS on the scroll timeline; unlayered so it beats
  // platform.css. Where scroll timelines are unsupported, or motion is reduced,
  // tiles simply render as before.
  "@supports (animation-timeline:view()){@media (prefers-reduced-motion:no-preference){.mk .pf-tile{background-image:linear-gradient(var(--accent,#00E676),var(--accent,#00E676));background-repeat:no-repeat;background-position:0 0;background-size:0% 2px;animation:pf-print linear both,pf-line linear both;animation-timeline:view(),view();animation-range:entry 0% entry 85%,entry 50% cover 40%}}}",
  // Mac windows print in the same way (12px corners); rows inside grouped
  // lists rise into place one after another as they enter.
  "@supports (animation-timeline:view()){@media (prefers-reduced-motion:no-preference){.mk .pf-window{animation:pf-print-sm linear both;animation-timeline:view();animation-range:entry 0% entry 70%}.mk .pf-group>*{animation:pf-rise linear both;animation-timeline:view();animation-range:entry 0% entry 100%}}}",
  "@keyframes pf-print-sm{from{clip-path:inset(100% 0 0 0 round 12px);opacity:.25}99%{clip-path:inset(0 0 0 0 round 12px);opacity:1}to{clip-path:none;opacity:1}}",
  "@keyframes pf-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
  "@keyframes pf-print{from{clip-path:inset(100% 0 0 0 round 28px);opacity:.25}99%{clip-path:inset(0 0 0 0 round 28px);opacity:1}to{clip-path:none;opacity:1}}",
  "@keyframes pf-line{to{background-size:100% 2px}}",
].join("");

/** Classes that put a subtree in the "/" theme (pair with <HomeStyles/>). */
export const HOME_SCOPE = `mk afvar-home ${mkFontClassName}`;

/** The "/" keyframes, tokens and motion CSS (deduplicated by href). */
export function HomeStyles() {
  return (
    <>
      <style href="afvar-home-kf" precedence="default">
        {KEYFRAMES}
      </style>
      <MarketMotionStyles />
    </>
  );
}
