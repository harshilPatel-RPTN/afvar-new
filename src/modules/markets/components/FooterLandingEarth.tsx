"use client";

import { motion, useTransform } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore } from "react";
import "./footer-landing-earth.css";
import { useCachedScrollProgress } from "./footerLandingScroll";

/* The top of a huge dotted planet curving across the bottom of the footer
 * landing pad. Plain canvas 2D (no WebGL — this sits on every page):
 * - continents are a lattice of dots laid in rows parallel to the rim, sampled
 *   from the same land mask the home globe uses (/home-globe/land-mask.png);
 * - scroll-in: the rim-light draws out from the centre, dots rise in from the
 *   bottom toward the horizon;
 * - idle: slow rotation (dots drift sideways and wrap), breathing rim-light,
 *   twinkling city lights, a scanning arc along the atmosphere and tiny
 *   particles lifting off the rim;
 * - paused off screen, devicePixelRatio ≤ 2, reduced motion → one static frame.
 * The bottom-right corner stays dim for the avatar launcher. */

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const MASK_SRC = "/home-globe/land-mask.png";

/** Latitude at the rim (limb) and at the bottom-centre of the canvas. */
const LAT_TOP = 76;
const LAT_BOT = -42;
/** How far round the virtual sphere the visible band reaches (foreshortening near the rim). */
const ALPHA_MAX = 72 * DEG;
/** Rotation speed, radians of longitude per second. */
const SPIN = 1.6 * DEG;
/** Longitude in the middle of the screen at rest (Atlantic: Americas left, Africa/Europe centre). */
const LON_START = -8 * DEG;
const BUCKETS = 8;
const FPS_GAP = 1000 / 40;
const INTRO_MS = 2000;
/** Bottom-right box kept dim (avatar launcher). */
const CLEAR = 140;

const CITIES: readonly [number, number][] = [
  [40.7, -74], [51.5, -0.1], [35.7, 139.7], [1.35, 103.8], [22.3, 114.2], [19.1, 72.9],
  [-23.5, -46.6], [25.2, 55.3], [48.9, 2.35], [-33.9, 151.2], [37.8, -122.4], [55.8, 37.6],
  [6.5, 3.4], [-26.2, 28], [19.4, -99.1], [31.2, 121.5], [41.9, -87.6], [50.1, 8.7],
];

type Mask = { w: number; h: number; land: Uint8Array };

let maskPromise: Promise<Mask | null> | null = null;
function loadMask(): Promise<Mask | null> {
  maskPromise ??= (async () => {
    try {
      const img = new Image();
      img.src = MASK_SRC;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      const land = new Uint8Array(c.width * c.height);
      for (let i = 0; i < land.length; i++) land[i] = px[i * 4] > 108 ? 1 : 0;
      return { w: c.width, h: c.height, land };
    } catch {
      maskPromise = null;
      return null;
    }
  })();
  return maskPromise;
}

function reducedNow() {
  return (
    document.documentElement.dataset.reduceMotion === "true" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduce-motion"] });
  return () => {
    mq.removeEventListener("change", cb);
    mo.disconnect();
  };
}

const sat = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const wrapPi = (a: number) => a - TAU * Math.floor((a + Math.PI) / TAU);

type Row = { ri: number; d: number; v: number; dlon: number; thetaM: number; alpha: number; squash: number };
type Geo = {
  w: number; h: number; cx: number; cy: number; R: number; dmax: number;
  s: number; dot: number; kappa: number; thetaEdge: number; rows: Row[];
  glow: HTMLCanvasElement; body: HTMLCanvasElement; rimGreen: CanvasGradient; rimCore: CanvasGradient;
};
type Particle = { theta: number; age: number; life: number; vy: number; vx: number; size: number; dx: number; dy: number };

function layer(w: number, h: number, dpr: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const ctx = c.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, ctx };
}

function buildGeo(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, maskH: number): Geo {
  const phone = w < 640;
  const y0 = h * (phone ? 0.38 : 0.3);
  const hw = w / 2;
  const sag = Math.min(h * (phone ? 0.25 : 0.4), hw * 0.9);
  const R = (hw * hw + sag * sag) / (2 * sag);
  const cx = hw;
  const cy = y0 + R;
  const dmax = h - y0 + 2;
  const s = Math.min(6.2, Math.max(3.6, w / 300));
  const thetaEdge = Math.asin(Math.min(1, (hw + 24) / R));
  const lonHalf = (phone ? 62 : w < 1100 ? 85 : 105) * DEG;
  const kappa = lonHalf / Math.asin(Math.min(1, hw / R));

  const rows: Row[] = [];
  for (let r = s * 0.6; r < dmax; r += s) {
    const ri = R - r;
    const d = r / dmax;
    const a = Math.acos(1 - d * (1 - Math.cos(ALPHA_MAX)));
    const lat = LAT_TOP - (a / ALPHA_MAX) * (LAT_TOP - LAT_BOT);
    const v = Math.min(maskH - 1, Math.max(0, Math.floor((0.5 - lat / 180) * maskH)));
    const t1 = Math.acos(Math.max(-1, Math.min(1, (cy - h - s) / ri)));
    const t2 = Math.asin(Math.min(1, (hw + s) / ri));
    rows.push({
      ri, d, v,
      dlon: (s / ri) * kappa,
      thetaM: Math.min(t1, t2),
      alpha: (0.34 + 0.66 * (1 - d) ** 1.4) * (1 - 0.55 * sat((d - 0.7) / 0.3)),
      squash: 0.42 + 0.58 * Math.sqrt(d),
    });
  }

  // Outer atmosphere: green haze rising off the rim, fading up into the dark.
  const g = layer(w, h, dpr);
  if (g.ctx) {
    const reach = Math.max(h * 0.75, 120);
    const grad = g.ctx.createRadialGradient(cx, cy, R - 3, cx, cy, R + reach);
    const k = (px: number) => sat(px / (reach + 3));
    grad.addColorStop(0, "rgba(0,230,118,0.55)");
    grad.addColorStop(k(6), "rgba(0,230,118,0.32)");
    grad.addColorStop(k(reach * 0.14), "rgba(0,230,118,0.14)");
    grad.addColorStop(k(reach * 0.45), "rgba(0,200,110,0.045)");
    grad.addColorStop(1, "rgba(0,200,110,0)");
    g.ctx.fillStyle = grad;
    g.ctx.fillRect(0, 0, w, h);
    // Soften the far sides and dim the launcher corner.
    g.ctx.globalCompositeOperation = "destination-in";
    const side = g.ctx.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, "rgba(0,0,0,0.35)");
    side.addColorStop(0.18, "#000");
    side.addColorStop(0.82, "#000");
    side.addColorStop(1, "rgba(0,0,0,0.25)");
    g.ctx.fillStyle = side;
    g.ctx.fillRect(0, 0, w, h);
  }

  // Planet body: near-black, a green sheen just under the rim.
  const b = layer(w, h, dpr);
  if (b.ctx) {
    const inner = Math.max(0, R - dmax * 1.15);
    const grad = b.ctx.createRadialGradient(cx, cy, inner, cx, cy, R);
    grad.addColorStop(0, "#020504");
    grad.addColorStop(0.62, "#03100a");
    grad.addColorStop(0.9, "#052315");
    grad.addColorStop(0.975, "#0a3d25");
    grad.addColorStop(1, "#13643c");
    b.ctx.fillStyle = grad;
    b.ctx.beginPath();
    b.ctx.arc(cx, cy, R, 0, TAU);
    b.ctx.fill();
  }

  const rimGrad = (core: boolean) => {
    const lg = ctx.createLinearGradient(0, 0, w, 0);
    const c = core ? "214,255,233" : "0,230,118";
    lg.addColorStop(0, `rgba(${c},0.12)`);
    lg.addColorStop(0.2, `rgba(${c},0.9)`);
    lg.addColorStop(0.5, `rgba(${c},1)`);
    lg.addColorStop(0.8, `rgba(${c},0.85)`);
    lg.addColorStop(Math.max(0.81, 1 - 150 / w), `rgba(${c},0.32)`);
    lg.addColorStop(1, `rgba(${c},0.06)`);
    return lg;
  };

  return {
    w, h, cx, cy, R, dmax, s, dot: s * 0.46, kappa, thetaEdge, rows,
    glow: g.c, body: b.c, rimGreen: rimGrad(false), rimCore: rimGrad(true),
  };
}

function makeSprite() {
  const size = 32;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(240,255,247,1)");
    grad.addColorStop(0.18, "rgba(168,222,194,0.85)");
    grad.addColorStop(0.45, "rgba(0,230,118,0.28)");
    grad.addColorStop(1, "rgba(0,230,118,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  return c;
}

export function FooterLandingEarth() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useSyncExternalStore(subscribeReduced, reducedNow, () => false);
  const scrollYProgress = useCachedScrollProgress(root, "enter");
  const lift = useTransform(scrollYProgress, [0, 1], ["16%", "0%"]);

  useEffect(() => {
    const node = root.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!node || !cv || !ctx) return;

    const pad = node.closest(".fl-root");
    let mask: Mask | null = null;
    let geo: Geo | null = null;
    let dpr = 1;
    let raf = 0;
    let visible = false;
    let introAt = -1;
    let clock = 0;
    let last = 0;
    let lastDraw = 0;
    let lon0 = LON_START;
    let alive = true;
    const sprite = makeSprite();
    const particles: Particle[] = [];

    const clearZone = (x: number, y: number, g: Geo) =>
      1 - 0.78 * sat((x - (g.w - CLEAR - 30)) / 40) * sat((y - (g.h - CLEAR - 30)) / 40);

    const spawn = (g: Geo, p: Particle) => {
      p.theta = (Math.random() * 2 - 1) * g.thetaEdge * 0.82;
      p.age = 0;
      p.life = 2.2 + Math.random() * 2.6;
      p.vy = 7 + Math.random() * 14;
      p.vx = (Math.random() - 0.5) * 6;
      p.size = 0.8 + Math.random() * 1.1;
      p.dx = 0;
      p.dy = 0;
    };

    const draw = (now: number) => {
      const g = geo;
      if (!g) return;
      const { w, h, cx, cy, R } = g;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (introAt < 0) return;
      const p = reduced ? 9 : (now - introAt) / INTRO_MS;

      const rimP = easeOut(sat(p / 0.55));
      const dotsP = sat((p - 0.18) / 0.82);
      const idle = sat(p - 1);
      const breath = reduced ? 1 : 0.84 + 0.16 * Math.sin(clock * 1.25);

      // Atmosphere haze and planet body.
      ctx.globalAlpha = rimP * breath;
      ctx.drawImage(g.glow, 0, 0, w, h);
      ctx.globalAlpha = sat(p / 0.3);
      ctx.drawImage(g.body, 0, 0, w, h);
      ctx.globalAlpha = 1;

      // Land dots, batched by brightness.
      if (mask && dotsP > 0) {
        const buckets = Array.from({ length: BUCKETS }, () => new Path2D());
        const { land, w: mw } = mask;
        const dot = g.dot;
        for (const row of g.rows) {
          const reveal = sat((dotsP * 1.3 - (1 - row.d)) / 0.3);
          if (reveal <= 0) continue;
          const rowA = row.alpha * reveal;
          const base = row.v * mw;
          const dh = dot * row.squash;
          let k = Math.ceil((lon0 - row.thetaM * g.kappa) / row.dlon);
          for (;;) {
            const lon = k * row.dlon;
            const theta = (lon - lon0) / g.kappa;
            if (theta > row.thetaM) break;
            k++;
            let u = Math.floor((lon / TAU + 0.5) * mw) % mw;
            if (u < 0) u += mw;
            if (!land[base + u]) continue;
            const x = cx + row.ri * Math.sin(theta);
            const y = cy - row.ri * Math.cos(theta);
            const edge = 1 - 0.6 * sat((Math.abs(x - cx) / (w / 2) - 0.72) / 0.28);
            const a = rowA * edge * clearZone(x, y, g);
            const bi = Math.min(BUCKETS - 1, Math.round(a * (BUCKETS - 1)));
            if (bi <= 0) continue;
            buckets[bi].rect(x - dot / 2, y - dh / 2, dot, dh);
          }
        }
        for (let i = 1; i < BUCKETS; i++) {
          const a = i / (BUCKETS - 1);
          ctx.fillStyle = a > 0.8 ? `rgba(168,236,200,${a})` : `rgba(0,214,112,${0.25 + a * 0.75})`;
          ctx.fill(buckets[i]);
        }
      }

      // Rim-light, drawn out from the centre.
      if (rimP > 0) {
        const span = g.thetaEdge * rimP;
        const a0 = -Math.PI / 2 - span;
        const a1 = -Math.PI / 2 + span;
        ctx.lineCap = "round";
        const stroke = (style: CanvasGradient, width: number, alpha: number, r = R) => {
          ctx.strokeStyle = style;
          ctx.lineWidth = width;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(cx, cy, r, a0, a1);
          ctx.stroke();
        };
        stroke(g.rimGreen, 16, 0.08 * breath, R + 2);
        stroke(g.rimGreen, 6, 0.32 * breath, R + 0.5);
        stroke(g.rimGreen, 2.6, 0.75 * breath);
        stroke(g.rimCore, 1.1, 0.95);
        ctx.globalAlpha = 1;
      }

      if (reduced || idle <= 0) return;

      // Scanning arc along the atmosphere: one sweep every ~6.5 s.
      const cycle = (clock % 6.5) / 2.4;
      if (cycle < 1) {
        const head = -g.thetaEdge + 2 * g.thetaEdge * (cycle * cycle * (3 - 2 * cycle));
        const tail = 0.16 * Math.min(1, 900 / w) + 0.05;
        const fade = idle * Math.sin(Math.PI * cycle);
        ctx.lineCap = "round";
        ctx.strokeStyle = "#E4FFF1";
        for (let i = 0; i < 8; i++) {
          const t0 = head - (tail * (i + 1)) / 8;
          const t1 = head - (tail * i) / 8;
          const hx = cx + R * Math.sin(t1);
          const hy = cy - R * Math.cos(t1);
          ctx.globalAlpha = fade * (1 - i / 8) ** 1.6 * 0.9 * clearZone(hx, hy, g);
          ctx.lineWidth = 2.2 - i * 0.15;
          ctx.beginPath();
          ctx.arc(cx, cy, R + 3, -Math.PI / 2 + t0, -Math.PI / 2 + t1);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // City lights.
      ctx.globalCompositeOperation = "lighter";
      const cosMax = 1 - Math.cos(ALPHA_MAX);
      CITIES.forEach(([lat, lonDeg], i) => {
        const theta = wrapPi(lonDeg * DEG - lon0) / g.kappa;
        const al = ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * ALPHA_MAX;
        const r = ((1 - Math.cos(al)) / cosMax) * g.dmax;
        const ri = R - r;
        const x = cx + ri * Math.sin(theta);
        const y = cy - ri * Math.cos(theta);
        if (x < -10 || x > w + 10 || y > h + 6 || r < 2) return;
        const tw = Math.max(0, Math.sin(clock * (0.9 + (i % 5) * 0.23) + i * 1.7)) ** 3;
        const a = idle * (0.25 + 0.75 * tw) * clearZone(x, y, g) * (1 - 0.5 * (r / g.dmax));
        const size = g.s * (2.6 + 2.2 * tw);
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      });

      // Particles lifting off the rim.
      ctx.fillStyle = "#BFF5D8";
      for (const pt of particles) {
        const x = cx + R * Math.sin(pt.theta) + pt.dx;
        const y = cy - R * Math.cos(pt.theta) + pt.dy;
        const a = Math.sin(Math.PI * sat(pt.age / pt.life)) * 0.75 * idle * clearZone(x, y, g);
        if (a <= 0.01 || x < 0 || x > w) continue;
        ctx.globalAlpha = a;
        ctx.fillRect(x - pt.size / 2, y - pt.size / 2, pt.size, pt.size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive || !visible || reduced) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      clock += dt;
      lon0 -= SPIN * dt;
      if (geo) {
        for (const pt of particles) {
          pt.age += dt;
          pt.dy -= pt.vy * dt;
          pt.dx += pt.vx * dt;
          if (pt.age >= pt.life) spawn(geo, pt);
        }
      }
      // While the footer logo is in flight (FooterLanding sets data-fl-flying), hold the last frame: the frame budget goes to the logo.
      if (now - lastDraw >= FPS_GAP && !pad?.hasAttribute("data-fl-flying")) {
        lastDraw = now;
        draw(now);
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || reduced || !visible) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = cv.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(1.5, window.devicePixelRatio || 1); // ≤1.5: the dots stay crisp enough and the redraw stays cheap
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      const g = buildGeo(ctx, w, h, dpr, mask?.h ?? 256);
      geo = g;
      particles.length = 0;
      const count = w < 640 ? 10 : 24;
      for (let i = 0; i < count; i++) {
        const pt: Particle = { theta: 0, age: 0, life: 1, vy: 0, vx: 0, size: 1, dx: 0, dy: 0 };
        spawn(g, pt);
        pt.age = Math.random() * pt.life;
        pt.dy = -pt.vy * pt.age;
        pt.dx = pt.vx * pt.age;
        particles.push(pt);
      }
      draw(performance.now());
    };

    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && introAt < 0) introAt = performance.now();
        if (!visible) return;
        if (reduced) draw(performance.now());
        else start();
      },
      { threshold: 0.12 },
    );
    io.observe(node);

    loadMask().then((m) => {
      if (!alive) return;
      mask = m;
      if (geo) resize();
    });

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [reduced]);

  return (
    <div ref={root} className="fle-root" aria-hidden="true">
      <motion.div className="fle-lift" style={{ y: reduced ? 0 : lift }}>
        <canvas ref={canvas} className="fle-canvas" />
      </motion.div>
    </div>
  );
}
