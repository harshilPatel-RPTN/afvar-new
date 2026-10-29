// Shared flat-UI tokens for /home-demo. No glass effects anywhere: dark
// surfaces, hairline borders, mono micro-labels.
// The client-safe entry: the module index pulls in the server-only SiteFooter.
import { REGISTER_URL } from "@/modules/platform/kit";

export const MONO = "font-mono text-[11px] tracking-[0.18em] uppercase";
export const HAIR = "border-[rgba(255,255,255,0.1)]";

/** Every Register / launch-queue CTA. The platform route registry is the
 *  source of truth: registration lives in the app, not on the website. */
export const REGISTER_HREF = REGISTER_URL;

/** Sign in also lives in the app; no website route is configured for it. */
export const SIGN_IN_HREF = REGISTER_URL;

/** Page-wide CSS for interactive bits (rendered once by HomeDemoPage).
 *  .afv-cta  primary pill: a brighter candle-fill rises from below on hover,
 *            a price sparkline draws across it, and it presses in on click.
 *            While Register coins drop in (data-filling) it fills gold.
 *  .afv-link text link: the underline draws left → right.
 *  Both go instant under reduced motion (OS or the page toggle). */
const SPARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 10' preserveAspectRatio='none'%3E%3Cpolyline points='0,8 12,6 20,7 30,3 40,5 52,2 60,4 72,1 82,3 100,0' fill='none' stroke='%2305130C' stroke-width='1.4' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E";

export const DEMO_CSS = `
.afv-cta { position: relative; overflow: hidden; isolation: isolate; transition: transform .12s ease; }
.afv-cta::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #69F0AE; transform: translateY(101%); transition: transform .35s cubic-bezier(.2,.8,.2,1); }
.afv-cta::after { content: ""; position: absolute; left: 14%; right: 14%; bottom: 4px; height: 7px; background: url("${SPARK}") center / 100% 100% no-repeat; opacity: .5; clip-path: inset(0 100% 0 0); transition: clip-path .5s ease .05s; }
.afv-cta:hover::before, .afv-cta:focus-visible::before { transform: translateY(0); }
.afv-cta:hover::after, .afv-cta:focus-visible::after { clip-path: inset(0 0 0 0); }
.afv-cta:active { transform: scale(.98); }
.afv-cta[data-filling]::before { transform: translateY(0); background: #E8C547; transition-duration: .6s; }
.afv-link { background: linear-gradient(currentColor, currentColor) left bottom / 0 1px no-repeat; padding-bottom: 2px; transition: background-size .3s ease, color .2s; }
.afv-link:hover, .afv-link:focus-visible { background-size: 100% 1px; }
@media (prefers-reduced-motion: reduce) { .afv-cta, .afv-cta::before, .afv-cta::after, .afv-link { transition: none; } }
html[data-reduce-motion="true"] .afv-cta, html[data-reduce-motion="true"] .afv-cta::before, html[data-reduce-motion="true"] .afv-cta::after, html[data-reduce-motion="true"] .afv-link { transition: none; }
`;
