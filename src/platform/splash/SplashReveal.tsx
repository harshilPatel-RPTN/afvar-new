"use client";

import { useEffect, useRef, useState } from "react";

// Full-screen splash shown on every full page load/reload while the page
// renders and loads behind it. This is the native port of the AFVAR logo
// reveal (assets/logo-reveal): a single SVG whose pieces are crops of one
// sprite atlas (public/afvar/atlas.webp), choreographed by a rAF loop:
//   1. candle wicks shoot up and the bodies pop in, like a live chart,
//   2. the gold mark outline draws itself (edge, top, ring, right, tip),
//   3. the solid artwork fills in with a glow pop,
//   4. the mark slides up and the AFVAR letters sweep in from the left,
//   5. glints sweep across the mark and the wordmark.
// The overlay fades out once the animation has played AND the window `load`
// event fired (capped so it can never trap the user).

const ATLAS = "/afvar/atlas.webp";
const MAX_COVER_MS = 15_000; // absolute cap: never hold the page hostage

// ---- geometry shared by the SVG and the animation loop ----------------------
// Ring outline of the mark; also reused for the two speed-dash strokes.
const RING =
  "M506.8,195.5 L521.2,192.8 L535.3,190.4 L549.1,188.3 L562.6,186.5 L575.8,185.1 L588.6,184.1 L601.0,183.3 L613.1,182.9 L624.7,182.8 L635.9,183.1 L646.6,183.7 L656.8,184.7 L666.5,186.0 L675.6,187.6 L684.3,189.6 L692.3,191.9 L699.8,194.5 L706.7,197.4 L713.0,200.6 L718.6,204.2 L723.7,208.0 L728.1,212.2 L731.8,216.6 L734.9,221.3 L737.4,226.3 L739.2,231.5 L740.3,236.9 L740.7,242.7 L740.5,248.6 L739.6,254.7 L738.1,261.1 L735.9,267.6 L733.0,274.4 L729.4,281.3 L725.2,288.3 L720.4,295.5 L715.0,302.8 L708.9,310.2 L702.2,317.7 L694.9,325.4 L687.1,333.0 L678.6,340.8 L669.6,348.5 L660.1,356.3 L650.1,364.1 L639.6,371.9 L628.6,379.7 L617.1,387.4 L605.2,395.1 L592.9,402.8 L580.2,410.3 L567.1,417.8 L553.7,425.1 L540.0,432.4 L526.0,439.5 L511.8,446.4 L497.3,453.2 L482.6,459.8 L467.7,466.2 L452.6,472.5 L437.5,478.5 L422.3,484.3 L406.9,489.8 L391.6,495.2 L376.3,500.2 L360.9,505.0 L345.7,509.6 L330.5,513.8 L315.4,517.8 L300.5,521.4 L285.7,524.8 L271.1,527.8 L256.8,530.5 L242.7,533.0 L228.9,535.0 L215.4,536.8 L202.2,538.2 L189.4,539.3 L176.9,540.0 L164.9,540.4 L153.3,540.5 L142.1,540.2 L131.4,539.6 L121.2,538.6 L111.5,537.4 L102.4,535.7 L93.7,533.8 L85.7,531.5 L78.2,528.9 L71.3,525.9 L65.0,522.7 L59.3,519.2 L54.3,515.3 L49.9,511.2 L46.1,506.7 L43.0,502.0 L40.6,497.1 L38.8,491.9 L37.7,486.4 L37.2,480.7 L37.5,474.7 L38.3,468.6 L39.9,462.2 L42.1,455.7 L45.0,449.0 L48.5,442.1 L52.7,435.0 L57.6,427.8 L63.0,420.5 L69.1,413.1 L75.8,405.6 L83.1,398.0 L90.9,390.3 L99.4,382.6 L108.3,374.8 L117.9,367.0 L127.9,359.2 L138.4,351.4 L149.4,343.6 L160.9,335.9 L184.3,328.2 L174.0,335.2 L164.0,342.2 L154.5,349.2 L145.5,356.2 L136.9,363.2 L128.7,370.2 L121.1,377.1 L114.0,384.0 L107.4,390.8 L101.4,397.6 L95.9,404.2 L90.9,410.8 L86.6,417.2 L82.8,423.5 L79.6,429.7 L77.0,435.7 L74.9,441.6 L73.5,447.2 L72.7,452.7 L72.5,458.0 L72.9,463.1 L73.9,468.0 L75.5,472.6 L77.7,477.0 L80.4,481.2 L83.8,485.1 L87.8,488.8 L92.3,492.2 L97.4,495.3 L103.1,498.1 L109.3,500.7 L116.0,503.0 L123.3,505.0 L131.0,506.6 L139.3,508.0 L148.0,509.1 L157.2,509.9 L166.9,510.4 L176.9,510.6 L187.4,510.4 L198.2,510.0 L209.5,509.2 L221.0,508.2 L232.9,506.8 L245.1,505.2 L257.5,503.3 L270.2,501.0 L283.2,498.5 L296.3,495.7 L309.6,492.6 L323.1,489.2 L336.7,485.6 L350.4,481.7 L364.2,477.6 L378.0,473.2 L391.8,468.6 L405.7,463.8 L419.5,458.7 L433.3,453.4 L446.9,448.0 L460.5,442.3 L473.9,436.5 L487.2,430.5 L500.3,424.4 L513.1,418.1 L525.8,411.7 L538.2,405.1 L550.3,398.5 L562.1,391.8 L573.5,384.9 L584.6,378.1 L595.4,371.1 L605.7,364.2 L615.7,357.2 L625.2,350.1 L634.3,343.1 L642.9,336.1 L651.0,329.1 L658.6,322.2 L665.7,315.3 L672.3,308.5 L678.3,301.7 L683.8,295.1 L688.8,288.5 L693.1,282.1 L696.9,275.8 L700.1,269.6 L702.7,263.6 L704.8,257.8 L706.2,252.1 L707.0,246.6 L707.2,241.3 L706.8,236.2 L705.8,231.3 L704.2,226.7 L702.1,222.3 L699.3,218.1 L695.9,214.2 L691.9,210.5 L687.4,207.2 L682.3,204.0 L676.6,201.2 L670.4,198.6 L663.7,196.3 L656.4,194.4 L648.7,192.7 L640.4,191.3 L631.7,190.2 L622.5,189.4 L612.9,188.9 L602.8,188.8 L592.3,188.9 L581.5,189.3 L570.3,190.1 L558.7,191.1 L546.8,192.5 L534.6,194.1 L522.2,196.1 L509.5,198.3 L496.5,200.8Z";

// Atlas crop helper: a nested <svg> windows a region of the sprite sheet.
const crop = (x: number, y: number, w: number, h: number, vx: number, vy: number) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vx} ${vy} ${w} ${h}" overflow="hidden"><use href="#afs-atlas"/></svg>`;

// Candles: atlas crop params for wick + body, plus chart coordinates used by
// the loop (x center, body baseline, wick top, wick bottom). Crop params are
// [x, y, w, h, atlasX, atlasY].
const CANDLES = [
  { x: 328, yb: 446, wt: 346, wb: 475, wick: [324, 346, 7, 129, 896, 842], body: [313, 381, 30, 65, 33, 974] },
  { x: 382, yb: 423, wt: 315, wb: 456, wick: [381, 315, 6, 141, 931, 481], body: [368, 353, 30, 70, 978, 842] },
  { x: 434, yb: 397, wt: 305, wb: 434, wick: [431, 305, 5, 129, 905, 842], body: [419, 341, 30, 56, 65, 974] },
  { x: 483, yb: 379, wt: 275, wb: 414, wick: [480, 275, 6, 139, 939, 481], body: [468, 310, 31, 69, 0, 974] },
  { x: 539, yb: 348, wt: 232, wb: 384, wick: [537, 232, 6, 152, 923, 481], body: [524, 272, 31, 76, 945, 842] },
  { x: 584, yb: 276, wt: 99, wb: 332, wick: [580, 99, 11, 233, 708, 481], body: [569, 160, 31, 116, 912, 842] },
];

const candlesMarkup = CANDLES.map((c, i) => {
  const [wx, wy, ww, wh, wvx, wvy] = c.wick;
  const [bx, by, bw, bh, bvx, bvy] = c.body;
  // The atlas wick sprite is transparent where the body sits in the final
  // artwork, so a wick revealed before its body has grown would show a gap in
  // the middle. This strip is the body's central column (same pixels the body
  // ends up covering), revealed together with the wick to keep the line whole.
  const strip = crop(wx, by, ww, bh, bvx + (wx - bx), bvy);
  return (
    `<g class="candle" data-x="${c.x}" data-yb="${c.yb}" data-wt="${c.wt}" data-wb="${c.wb}">` +
    `<clipPath id="afs-wk${i}"><rect class="wclip" x="${c.x - 12}" y="${c.wt}" width="24" height="${c.wb - c.wt + 1}"/></clipPath>` +
    `<g clip-path="url(#afs-wk${i})">${crop(wx, wy, ww, wh, wvx, wvy)}${strip}</g>` +
    `<g class="cbody">${crop(bx, by, bw, bh, bvx, bvy)}</g></g>`
  );
}).join("");

// Letter crops of the wordmark row in the atlas (x offset + width in the word
// coordinate space, used for the slide-in distance).
const LX: Record<string, number> = { lA1: 9, lF: 221, lV: 371, lA2: 530, lR: 733 };
const LW: Record<string, number> = { lA1: 200, lF: 137, lV: 189, lA2: 194, lR: 166 };
const LETTER_CROPS: Record<string, string> = {
  lA1: crop(9, 37, 200, 130, 0, 842),
  lF: crop(221, 37, 137, 130, 202, 842),
  lV: crop(371, 37, 189, 130, 341, 842),
  lA2: crop(530, 37, 194, 130, 532, 842),
  lR: crop(733, 37, 166, 130, 728, 842),
};
const LETTERS = ["lA1", "lF", "lV", "lA2", "lR"];

const SVG = `
<svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs>
  <radialGradient id="afs-bgGlow" cx="50%" cy="50%" r="60%">
    <stop offset="0" stop-color="#2a1d07"/><stop offset=".55" stop-color="#0d0908"/><stop offset="1" stop-color="#050406"/>
  </radialGradient>
  <radialGradient id="afs-pulseG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb43a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb43a" stop-opacity="0"/></radialGradient>
  <linearGradient id="afs-glintG" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <filter id="afs-glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="14" result="b"/><feColorMatrix in="b" values="1 0 0 0 .2  0 1 0 0 .1  0 0 1 0 0  0 0 0 .9 0" result="c"/>
    <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="afs-glowSoft" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="6" result="b"/><feColorMatrix in="b" values="1 0 0 0 .1  0 1 0 0 .05  0 0 1 0 0  0 0 0 .4 0" result="c"/>
    <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <linearGradient id="afs-fillG" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <mask id="afs-fillMask"><rect id="fillWipe" x="-1450" y="-150" width="1400" height="900" fill="url(#afs-fillG)" transform="skewX(-20)"/></mask>
  <linearGradient id="afs-fillGInv" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#000"/><stop offset=".75" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </linearGradient>
  <mask id="afs-fillMaskInv">
    <rect x="-300" y="-300" width="1800" height="1300" fill="#fff"/>
    <rect id="fillWipeInv" x="-1450" y="-350" width="1400" height="1400" fill="url(#afs-fillGInv)" transform="skewX(-20)"/>
  </mask>
  <image id="afs-atlas" width="1024" height="1043" href="${ATLAS}"/>
  <mask id="afs-markMask">${crop(34, 181, 706, 359, 0, 481)}${crop(104, 23, 484, 479, 0, 0)}${crop(55, 541, 136, 38, 97, 974)}${crop(498, 421, 200, 159, 721, 481)}${crop(313, 381, 30, 65, 33, 974)}${crop(368, 353, 30, 70, 978, 842)}${crop(419, 341, 30, 56, 65, 974)}${crop(468, 310, 31, 69, 0, 974)}${crop(524, 272, 31, 76, 945, 842)}${crop(569, 160, 31, 116, 912, 842)}</mask>
  <mask id="afs-wordMask">${LETTERS.map((l) => LETTER_CROPS[l]).join("")}</mask>
</defs>
<rect width="1920" height="1080" fill="url(#afs-bgGlow)"/>
<ellipse id="floor" cx="960" cy="540" rx="700" ry="420" fill="url(#afs-pulseG)" opacity="0"/>

<g id="mark">
  <g id="markInner">
    <g mask="url(#afs-fillMaskInv)">
      <g id="speedA">
        <path class="speed" d="M60,560 L400,-40"/><path class="speed" d="M90,575 L430,-25"/><path class="speed" d="M120,590 L460,-10"/>
      </g>
      <path id="dEdge" class="draw" d="M92.0,504.0 L381.0,24.0"/>
      <path id="dTop" class="draw" d="M381,24 L92,504 L211,497 L368,216 L392,222 L417,271 L504,235Z"/>
      <path id="dRing" class="draw" d="${RING}"/>
      <path id="dRight" class="draw" d="M498.0,477.0 L554.0,577.0 L697.0,577.0 L601.0,422.0 L551.0,453.0Z"/>
      <path id="dTip" class="draw" d="M56.0,577.0 L177.0,577.0 L189.0,552.0 L127.0,553.0 L76.0,541.0Z"/>
      <g id="speedR"><path class="speed draw" id="sR1" d="${RING}"/><path class="speed draw" id="sR2" d="${RING}"/></g>
    </g>
    <g id="solid">
      <g mask="url(#afs-fillMask)">
        <g class="pc" id="pTop">${crop(104, 23, 484, 479, 0, 0)}</g>
        <g class="pc" id="pTip">${crop(55, 541, 136, 38, 97, 974)}</g>
        <g class="pc" id="pRight">${crop(498, 421, 200, 159, 721, 481)}</g>
      </g>
      <g id="candles">${candlesMarkup}</g>
      <g mask="url(#afs-fillMask)">
        <g class="pc" id="pRing">${crop(34, 181, 706, 359, 0, 481)}</g>
      </g>
    </g>
    <g mask="url(#afs-markMask)"><rect id="glint" x="-300" y="-100" width="220" height="800" fill="url(#afs-glintG)" transform="skewX(-20)"/></g>
  </g>
</g>

<g id="word">
  ${LETTERS.map((l) => `<g class="lt" id="${l}">${LETTER_CROPS[l]}</g>`).join("")}
  <g mask="url(#afs-wordMask)"><rect id="glintW" x="-300" y="-50" width="160" height="300" fill="url(#afs-glintG)" transform="skewX(-20)"/></g>
</g>
</svg>`;

const CSS = `
[data-afvar-splash]{
  position:fixed;inset:0;z-index:99999;
  background:#050406;
  transition:opacity .5s ease;
}
[data-afvar-splash] svg{width:100%;height:100%;display:block}
[data-afvar-splash] .speed{fill:none;stroke:#ffd45a;stroke-width:2;stroke-linecap:round;opacity:0}
[data-afvar-splash] .draw{fill:none;stroke:#ffd65c;stroke-width:3;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
[data-afvar-splash] #glint,[data-afvar-splash] #glintW{mix-blend-mode:screen;pointer-events:none}
/* Hidden until the renderer takes over (inline styles win): the server-rendered
   SVG would otherwise flash the untransformed artwork in the top-left corner
   between first paint and hydration. */
[data-afvar-splash] .pc,[data-afvar-splash] .candle,[data-afvar-splash] .lt,
[data-afvar-splash] .draw,[data-afvar-splash] #floor,
[data-afvar-splash] #glint,[data-afvar-splash] #glintW{opacity:0}
`;

// ---- timing (oneshot cut of the looping original) ---------------------------
const OFF = 0.8; // build phases start after the candles have grown
const S0 = 4.05 + OFF; // AFVAR slide-in start
const SEND = S0 + 1.35; // slide-in end
const GL0 = SEND + 0.9; // glint sweep
const T_START = 1.55; // skip the loop's initial hold/shatter
const T_END = SEND + 1.6;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeIn = (p: number) => p * p * p;
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const back = (p: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};

// Builds the per-frame renderer against one mounted splash root. Transcribed
// from assets/logo-reveal; only the element lookups are scoped to the root.
function createRenderer(root: HTMLElement) {
  const $ = (id: string) => root.querySelector<SVGGraphicsElement>(`#${id}`)!;

  // layout: mark above, AFVAR below (same proportions as the logo file)
  const S = 0.8;
  const MW = 740 * S;
  const MH = 610 * S;
  const contentTop = 23 * S;
  const contentH = 734 * S;
  const markX = (1920 - MW) / 2;
  const markYTop = (1080 - contentH) / 2 - contentTop;
  const markYCenter = (1080 - MH) / 2;
  const wordX = markX - 80 * S;
  const wordY = markYTop + 590 * S;

  const draws = ["dEdge", "dTop", "dRing", "dRight", "dTip", "sR1", "sR2"].map((id) => $(id) as SVGPathElement);
  for (const p of draws) {
    const l = p.getTotalLength();
    p.dataset.len = String(l);
    p.style.strokeDasharray = String(l);
    p.style.strokeDashoffset = String(l);
  }
  const drawTo = (p: SVGPathElement, prog: number) => {
    const l = +p.dataset.len!;
    p.style.strokeDashoffset = String(l * (1 - prog));
  };
  const dash = (p: SVGPathElement, head: number, len: number) => {
    const l = +p.dataset.len!;
    p.style.strokeDasharray = `${len} ${l}`;
    p.style.strokeDashoffset = String(-(head * l - len));
  };
  const pieces: Record<string, [number, number]> = {
    pRing: [-120, 60],
    pTop: [0, -140],
    pTip: [-60, 120],
    pRight: [150, 90],
  };
  const cs = [...root.querySelectorAll<SVGGElement>("#candles .candle")];

  return function render(t: number) {
    const hold1 = t < 0.95;
    const pBreak = seg(t, 0.95, 1.55);
    const pEdge = seg(t, 1.55 + OFF, 1.95 + OFF);
    const pTop = seg(t, 1.9 + OFF, 2.4 + OFF);
    const pRing = seg(t, 2.25 + OFF, 2.95 + OFF);
    const pRight = seg(t, 2.7 + OFF, 3.0 + OFF);
    const pTip = seg(t, 2.8 + OFF, 3.05 + OFF);
    const FILL0 = 3.2 + OFF; // gold wipe-fill of the mark starts…
    const FILL1 = 3.85 + OFF; // …and completes here
    const pFill = seg(t, FILL0, FILL1);
    const pSlide = seg(t, 3.85 + OFF, 4.55 + OFF);
    const building = t >= 1.55 + OFF && t < FILL0;

    // mark position + fill pop
    const my = hold1 ? markYTop : t < 3.85 + OFF ? markYCenter : markYCenter + (markYTop - markYCenter) * easeInOut(pSlide);
    $("mark").setAttribute("transform", `translate(${markX},${my}) scale(${S})`);
    const pop = t >= FILL0 && t < FILL1 ? 1 + 0.06 * Math.sin(Math.PI * easeOut(pFill)) : 1;
    $("markInner").setAttribute("transform", `translate(${370 * (1 - pop)},${300 * (1 - pop)}) scale(${pop})`);

    // solid pieces (real artwork layers)
    let solidOp: number;
    let pieceMove = 0;
    if (hold1) solidOp = 1;
    else if (t < 1.55) {
      solidOp = 1 - easeIn(pBreak);
      pieceMove = easeIn(pBreak);
    } else if (t < FILL0) solidOp = 0;
    else solidOp = 1; // the wipe mask below does the gradual reveal
    for (const [id, [dx, dy]] of Object.entries(pieces)) {
      const e = $(id);
      e.style.opacity = String(solidOp);
      e.setAttribute("transform", `translate(${dx * pieceMove},${dy * pieceMove})`);
    }
    // Gold fill sweeps diagonally across the mark instead of fading in at once:
    // the mask rect's soft leading edge travels left → right during pFill. The
    // inverse mask erases the outline at the same edge, so the hand-drawn
    // blueprint lines never sit on top of the beveled artwork (their shapes
    // don't coincide exactly).
    const wipeX = t < 1.55 ? -200 : -1450 + 1250 * easeInOut(pFill);
    $("fillWipe").setAttribute("x", String(wipeX));
    $("fillWipeInv").setAttribute("x", String(wipeX));
    $("solid").style.filter = t >= FILL0 && t < 4.2 + OFF ? "url(#afs-glow)" : "url(#afs-glowSoft)";

    // candles: grow first, like a live chart (wick shoots up, body fills)
    const cStart = 1.6;
    const cStag = 0.13;
    const cEnd = 2.75;
    cs.forEach((c, i) => {
      const x = +c.dataset.x!;
      const yb = +c.dataset.yb!;
      const wt = +c.dataset.wt!;
      const wb = +c.dataset.wb!;
      let op = 1;
      let wickP = 1;
      let bodyP = 1;
      let ty = 0;
      if (hold1) {
        /* intact */
      } else if (t < 1.55) {
        const p = easeIn(seg(t, 0.95 + i * 0.05, 1.45 + i * 0.05));
        op = 1 - p;
        ty = -90 * p;
      } else if (t < cStart) op = 0;
      else if (t < cEnd) {
        const d = cStart + i * cStag;
        wickP = easeOut(seg(t, d, d + 0.16));
        bodyP = back(seg(t, d + 0.08, d + 0.34));
        op = clamp(wickP * 3, 0, 1);
      }
      c.style.opacity = String(op);
      c.setAttribute("transform", `translate(0,${ty})`);
      const top = yb - (yb - wt) * Math.min(1, wickP * 1.25);
      const bot = yb + (wb - yb) * clamp((wickP - 0.6) / 0.4, 0, 1);
      const r = c.querySelector<SVGRectElement>(".wclip")!;
      r.setAttribute("y", String(top));
      r.setAttribute("height", String(Math.max(0.01, bot - top)));
      c.querySelector<SVGGElement>(".cbody")!.setAttribute(
        "transform",
        `translate(${x},${yb}) scale(${0.6 + 0.4 * clamp(bodyP, 0, 1)},${Math.max(0.001, bodyP)}) translate(${-x},${-yb})`,
      );
    });
    if (t >= SEND) {
      const sh = seg(t, GL0, GL0 + 0.6);
      cs.forEach((c, i) => {
        const k = clamp(sh * 1.7 - i * 0.13, 0, 1);
        c.querySelector<SVGGElement>(".cbody")!.style.filter =
          k > 0 && k < 1 ? `brightness(${1 + 0.45 * Math.sin(Math.PI * k)})` : "none";
      });
    } else cs.forEach((c) => (c.querySelector<SVGGElement>(".cbody")!.style.filter = "none"));

    // outline drawing
    // During the fill the outline stays at full strength; the inverse wipe mask
    // erases it exactly where the gold has arrived (a clean spatial hand-off).
    const vis = building || (t >= FILL0 && t < FILL1) ? 1 : 0;
    for (const p of draws) p.style.opacity = "0";
    if (vis > 0) {
      drawTo($("dEdge") as SVGPathElement, easeOut(pEdge));
      $("dEdge").style.opacity = String(vis * (1 - seg(t, 2.05 + OFF, 2.3 + OFF)));
      drawTo($("dTop") as SVGPathElement, easeInOut(pTop));
      $("dTop").style.opacity = String(vis * (pTop > 0 ? 1 : 0));
      drawTo($("dRing") as SVGPathElement, easeInOut(pRing));
      $("dRing").style.opacity = String(vis * (pRing > 0 ? 1 : 0));
      drawTo($("dRight") as SVGPathElement, easeOut(pRight));
      $("dRight").style.opacity = String(vis * (pRight > 0 ? 1 : 0));
      drawTo($("dTip") as SVGPathElement, easeOut(pTip));
      $("dTip").style.opacity = String(vis * (pTip > 0 ? 1 : 0));
      if (pRing > 0 && pRing < 1) {
        const h = easeInOut(pRing);
        dash($("sR1") as SVGPathElement, Math.max(0, h - 0.03), 90);
        dash($("sR2") as SVGPathElement, Math.max(0, h - 0.09), 50);
        $("sR1").style.opacity = ".7";
        $("sR2").style.opacity = ".35";
        $("sR1").style.strokeWidth = "1.5";
        $("sR2").style.strokeWidth = "1";
      }
    }
    root.querySelectorAll<SVGPathElement>("#speedA .speed").forEach((s, i) => {
      const p = seg(t, 1.5 + OFF + i * 0.06, 1.95 + OFF + i * 0.06);
      const o = p > 0 && p < 1 ? Math.sin(Math.PI * p) * (0.7 - i * 0.2) : 0;
      s.style.opacity = String(o);
      const l = s.getTotalLength();
      s.style.strokeDasharray = `${60 - i * 12} ${l}`;
      s.style.strokeDashoffset = String(-(easeOut(p) * l * 0.9));
    });

    // AFVAR: slides in from the left as R, A, V, F, A
    $("word").setAttribute("transform", `translate(${wordX},${wordY}) scale(${S})`);
    LETTERS.forEach((id, i) => {
      const e = $(id);
      let op: number;
      let dx = 0;
      let dy = 0;
      if (hold1) op = 1;
      else if (t < 1.55) {
        const p = easeIn(seg(t, 0.95 + i * 0.04, 1.35 + i * 0.04));
        op = 1 - p;
        dx = 120 * p;
        dy = -30 * p * (i % 2 ? 1 : -1);
      } else if (t < S0) op = 0;
      else {
        const en = 4 - i;
        const p = easeOut(seg(t, S0 + en * 0.15, S0 + en * 0.15 + 0.6));
        op = clamp(p * 4, 0, 1);
        dx = -(LX[id] + LW[id] + 760) * (1 - p);
      }
      e.style.opacity = String(op);
      e.setAttribute("transform", `translate(${dx},${dy})`);
    });

    // glints + floor pulse
    const gl = seg(t, GL0, GL0 + 0.6);
    const glw = seg(t, SEND + 0.2, SEND + 0.7);
    $("glint").setAttribute("x", String(-300 + 1300 * gl));
    $("glint").style.opacity = gl > 0 && gl < 1 ? "1" : "0";
    $("glintW").setAttribute("x", String(-300 + 1500 * glw));
    $("glintW").style.opacity = glw > 0 && glw < 1 ? "1" : "0";
    $("floor").style.opacity = String(Math.sin(Math.PI * easeOut(pFill)) * (pFill > 0 && pFill < 1 ? 1 : 0));
  };
}

export function SplashReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let animDone = false;
    let pageLoaded = document.readyState === "complete";
    let finished = false;
    let raf = 0;
    let stopped = false;
    const maybeFinish = () => {
      if (!finished && animDone && pageLoaded) {
        finished = true;
        setFading(true);
      }
    };
    const onLoad = () => {
      pageLoaded = true;
      maybeFinish();
    };
    window.addEventListener("load", onLoad);

    const render = createRenderer(root);
    // Paint the first frame right away: the raw SVG defaults would otherwise
    // flash the untransformed artwork in the top-left corner until the atlas
    // decodes. At T_START everything is hidden except the background glow.
    render(T_START);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Start only once the atlas is decoded, so pieces never pop in late.
    // Falls through after 900ms regardless.
    let started = false;
    let animTimer: number | undefined;
    const start = () => {
      // `stopped` also guards against a late atlas-decode resolution starting
      // an orphan loop after this effect was cleaned up (StrictMode re-runs
      // the effect; two live loops would flicker between two timelines).
      if (started || stopped) return;
      started = true;
      if (reduced) {
        render(T_END - 0.001);
        animTimer = window.setTimeout(() => {
          animDone = true;
          maybeFinish();
        }, 600);
        return;
      }
      let t0: number | null = null;
      const loop = (ts: number) => {
        if (stopped) return;
        if (t0 === null) t0 = ts;
        const t = T_START + (ts - t0) / 1000;
        if (t >= T_END) {
          render(T_END - 0.001);
          animDone = true;
          maybeFinish();
          return;
        }
        render(t);
        raf = requestAnimationFrame(loop);
      };
      render(T_START);
      raf = requestAnimationFrame(loop);
    };
    const im = new window.Image();
    im.src = ATLAS;
    im.decode().then(start, start);
    const fallback = window.setTimeout(start, 900);

    if (process.env.NODE_ENV === "development") {
      // Dev aid: freeze the choreography at any point (used by visual tests).
      (window as unknown as { __afsSeek?: (t: number) => void }).__afsSeek = (t) => {
        stopped = true;
        cancelAnimationFrame(raf);
        render(t);
      };
    }

    // never cover the page forever, even if something above stalls
    const cap = window.setTimeout(() => {
      if (!finished) {
        finished = true;
        setFading(true);
      }
    }, MAX_COVER_MS);

    return () => {
      stopped = true;
      window.removeEventListener("load", onLoad);
      window.clearTimeout(cap);
      window.clearTimeout(fallback);
      if (animTimer !== undefined) window.clearTimeout(animTimer);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      data-afvar-splash=""
      aria-hidden="true"
      onTransitionEnd={() => fading && setGone(true)}
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? "none" : "auto" }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: SVG }} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
