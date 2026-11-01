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
    "<svg xmlns='http://www.w3.org/2000/svg' width='12' height='6' viewBox='0 0 12 6'><g fill='#A8DEC2'><rect x='2.5' y='0' width='1' height='6'/><rect x='1.5' y='1' width='3' height='4'/><rect x='8.5' y='1.5' width='1' height='4.5'/><rect x='7.5' y='3' width='3' height='2.5'/></g></svg>",
  );

const KEYFRAMES = [
  "@keyframes home-tape{to{transform:translateX(-50%)}}",
  "@keyframes modal-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
  // MARKET TERRAIN tokens (README §3): neutral graphite text/borders + green/red
  // market semantics over the markets-module `.mk` theme. In `@layer base` with
  // `.mk.afvar-home` specificity so it beats markets.css but never utilities.
  `@layer base{.mk.afvar-home{
    --mk-page:var(--afvar-charcoal);--mk-surface:var(--afvar-forest);--mk-raised:var(--afvar-panel);
    --mk-text:var(--afvar-text);--mk-dim:var(--afvar-muted);--mk-faint:#96aa9e;--mk-line:rgba(168,222,194,.16);
    --mk-accent:var(--afvar-loss);--mk-accent-bright:#ffc5bf;--mk-up:#00E676;
    --mk-primary:var(--afvar-mint);--mk-primary-bright:#d8f3e4;--mk-primary-deep:#76a58c;--mk-on-primary:var(--afvar-forest);
    --mk-glow:var(--afvar-mint);--mk-footer:var(--afvar-charcoal);--mk-glass-border:rgba(168,222,194,.17);--mk-glass-border-hover:rgba(168,222,194,.48);
    --mk-glow-primary:0 0 0 1px rgba(168,222,194,.28),0 10px 30px -8px rgba(168,222,194,.16);
    --mk-glow-primary-strong:0 0 0 1px rgba(168,222,194,.42),0 14px 40px -8px rgba(168,222,194,.25);
    --mk-glow-card:0 0 0 1px rgba(168,222,194,.2),0 18px 48px -18px rgba(168,222,194,.12);
    background:transparent;color:var(--afvar-text)
  }}`,
  ".mk.afvar-home,.mk.afvar-home .afvar-pricing-backdrop.pf-theme{background:transparent}",
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
  // Pricing uses the shared platform palette, icon tones and intact editorial photography.
  ".afvar-home .mk-gradient-text{background-image:linear-gradient(100deg,var(--afvar-text),var(--afvar-mint) 45%,#76a58c)}",
  ".afvar-home .mk-spot::before{background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(168,222,194,.12),transparent 60%)}",
  ".afvar-home .mk-spot::after{background:radial-gradient(260px circle at var(--mx,50%) var(--my,50%),rgba(168,222,194,.65),rgba(168,222,194,.12) 45%,transparent 70%)}",
  // Cards on the inherited pages (markets, platform, pricing, company): every
  // `.pf-tile` prints in like a candle — its body grows up from the bottom as
  // it enters — and an accent line draws across its top edge, in the page's
  // own accent colour. Pure CSS on the scroll timeline; unlayered so it beats
  // platform.css. Where scroll timelines are unsupported, or motion is reduced,
  // tiles simply render as before.
  "@supports (animation-timeline:view()){@media (prefers-reduced-motion:no-preference){.mk .pf-tile{background-image:linear-gradient(var(--accent,var(--afvar-mint)),var(--accent,var(--afvar-mint)));background-repeat:no-repeat;background-position:0 0;background-size:0% 2px;animation:pf-print linear both,pf-line linear both;animation-timeline:view(),view();animation-range:entry 0% entry 85%,entry 50% cover 40%}}}",
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
