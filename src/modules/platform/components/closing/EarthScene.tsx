"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Line, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, MathUtils, Matrix4, MeshStandardMaterial, Quaternion, ShaderMaterial, SRGBColorSpace, Vector3, type Group, type Mesh, type Texture } from "three";
import { useMediaQuery } from "@/platform/hooks/useMediaQuery";
import { EARTH_FRAG, EARTH_VERT, FLARE_FRAG, FLARE_VERT, MOON_FRAG, MOON_VERT, STAR_FRAG, STAR_VERT, STREAK_FRAG } from "./earth-shaders";

/** mulberry32: a small seeded generator, so the star field is the same on
 *  every render (render stays pure) and on every visit. */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
 * Closing-block earth: a real 3D globe (NASA Blue Marble day map and Black
 * Marble city lights) seen from orbit. The sun hangs in the upper-right sky,
 * in front of the planet: the whole visible cap sits in daylight, lit from
 * that side, with the shading falling away toward the lower left and the sun
 * disc itself drawn in the sky on the same side.
 *
 * The globe stands upright — north at the top — and is tipped a little away
 * from the viewer, so the arc shows the northern continents the way a globe
 * does (India front and centre at the start, Siberia along the apex) rather
 * than a view straight down onto the Arctic. The west-to-east turn carries
 * the surface left to right, as the real earth looks from space. Press and
 * drag with the mouse: sideways turns it along that spin, up/down nods the
 * axis a little (within limits, so it never ends up skewed). A release keeps
 * a little momentum, then the steady turn eases back in and the axis settles
 * back.
 *
 * Orthographic camera at zoom 1: one world unit is one CSS pixel, so the arc is
 * framed exactly at any aspect ratio. In the glass-footer layout the visible
 * disc spans the viewport width, its widest point on the footer's top border;
 * standalone (no footer) it is the classic shallow horizon, apex at
 * apexShare() of the box height, the limb meeting the box's bottom edge.
 */

const TEX = "/platform/earth";
// Horizon height as a share of the box: lower on phones, where the copy takes more of the box.
const apexShare = (width: number) => (width < 640 ? 0.66 : 0.57);
// Sun high to the upper right, in front — the whole visible cap in daylight,
// shading toward the lower left; the flare quad is placed on the same side.
const SUN = new Vector3(0.45, 0.6, 0.6).normalize();
// Seconds the plane-following rotation takes to ease back in after a drag.
const RESUME_AFTER = 0.5;
// Backward tip of the upright polar axis (radians, negative = north pole away from
// the viewer). It sets which latitude faces the viewer head-on at the cap's centre:
// 0 ≈ the Arctic, -0.32 ≈ 35°N (the northern countries read clearly), -0.5 ≈ 24°N.
const TIP = -0.32;
// Nod limits (radians) — generous, since following the plane down to Wellington
// needs the globe to pitch well forward; drags share the same range.
const SWING_MAX = 1.25;
// Where the opening view is centred: the middle of the visible cap.
const FOCUS = new Vector3(0, 0.8, 0.6).normalize();

const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const PITCH = new Quaternion().setFromAxisAngle(X_AXIS, TIP);

/** Globe orientation: spin on the upright polar axis, the fixed backward tip, then the nod (screen x axis). */
function orientation(out: Quaternion, swing: number, spin: number) {
  return out.setFromAxisAngle(Y_AXIS, spin).premultiply(PITCH).premultiply(new Quaternion().setFromAxisAngle(X_AXIS, swing));
}

/** Spin that opens on India (22°N, 78°E): searched once, since the axis is fixed. */
const START_SPIN = (() => {
  const phi = ((78 + 180) / 360) * Math.PI * 2;
  const theta = ((90 - 22) / 180) * Math.PI;
  const india = new Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
  const q = new Quaternion();
  let best = 0;
  let bestDot = -2;
  for (let i = 0; i < 720; i++) {
    const spin = (i / 720) * Math.PI * 2;
    const dot = india.clone().applyQuaternion(orientation(q, 0, spin)).dot(FOCUS);
    if (dot > bestDot) [best, bestDot] = [spin, dot];
  }
  return best;
})();

/**
 * Arc geometry, anchored to the line `inset` px above the canvas bottom: the
 * footer's top border when the canvas runs on behind a glass footer, the canvas
 * bottom itself when inset is 0 (the classic section-only layout).
 */
function frame(width: number, height: number, inset: number) {
  // Glass-footer layout: a fixed-size arc floating inside the frame. The apex
  // always rises `bulge` px above the anchor line (the footer's top border) —
  // capped, so the height stays put on wide screens and only phones scale it
  // down — and the limb meets the line `half` out from the centre, leaving open
  // sky in the bottom corners. Raise/lower the px caps to resize the planet.
  if (inset > 0) {
    // A floating globe with a fixed share of it above the anchor line (the
    // footer's top border): for share s, the chord equation gives
    // radius = half / sqrt(4·s·(1-s)) and the apex sits s·diameter up.
    const SHARE = 0.6; // 60% of the globe above the footer
    const half = Math.min(width * 0.42, 400); // half-width where the limb meets the line
    const radius = half / Math.sqrt(4 * SHARE * (1 - SHARE));
    const bulge = SHARE * 2 * radius; // apex height above the line
    return { radius, centerY: inset - height / 2 + bulge - radius };
  }
  // Standalone (no sibling footer, e.g. the /about closing band): the classic
  // shallow horizon, apex at apexShare of the box, limb meeting the bottom corners.
  const apexY = height / 2 - apexShare(width) * height;
  const depth = apexY + height / 2;
  const half = Math.max(width * 0.56, 1);
  const radius = Math.max((half * half + depth * depth) / (2 * depth), width * 0.72);
  return { radius, centerY: apexY - radius };
}

/*
 * Forex corridor: the five financial centres behind the currencies the desk
 * focuses on, joined by lifted great-circle routes that a little plane flies
 * in an endless loop. Everything lives on the unit sphere inside the orient
 * group, so it rides the globe's spin and drags.
 */
const CENTRES = [
  { code: "USD", lat: 40.71, lon: -74.01 }, // New York
  { code: "GBP", lat: 51.51, lon: -0.13 }, // London
  { code: "EUR", lat: 50.11, lon: 8.68 }, // Frankfurt
  { code: "JPY", lat: 35.68, lon: 139.69 }, // Tokyo
  { code: "NZD", lat: -41.29, lon: 174.78 }, // Wellington
] as const;

/** Unit vector on the globe for a latitude/longitude (same mapping as START_SPIN's India). */
function latLon(lat: number, lon: number) {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  return new Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
}
const CITY_VECS = CENTRES.map((c) => latLon(c.lat, c.lon));

// Flight arc height above the surface (unit-sphere scale).
const ROUTE_LIFT = 0.045;
// Seconds for one full lap of the corridor, flown at constant speed.
const LAP_SECONDS = 34;
// The convoy's candles, head to tail: green, green, red, red, green. Spaced a
// fixed ARC distance apart (radians on the sphere) — legs differ hugely in
// length (London→Frankfurt is tiny), so leg fractions would bunch the train
// on short hops.
const CANDLE_COLORS = ["#00F57A", "#00F57A", "#FF2E2E", "#FF2E2E", "#00F57A"];
const CANDLE_COUNT = CANDLE_COLORS.length;
const CANDLE_GAP = 0.09;

// The glyph shown over the convoy for each centre's currency.
const SIGNS: Record<(typeof CENTRES)[number]["code"], string> = { USD: "$", GBP: "£", EUR: "€", JPY: "¥", NZD: "NZ$" };
// Slight fixed tilt for the coin after billboarding, so it never sits perfectly flat to the camera.
const SIGN_TILT = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.22);

/** Point along leg `i` (city i → i+1) at t ∈ [0,1]: great-circle slerp, lifted into a flight arc. */
function routePoint(i: number, t: number, out: Vector3) {
  const a = CITY_VECS[i];
  const b = CITY_VECS[(i + 1) % CITY_VECS.length];
  const omega = Math.acos(MathUtils.clamp(a.dot(b), -1, 1));
  const s = Math.sin(omega);
  out.copy(a).multiplyScalar(Math.sin((1 - t) * omega) / s).addScaledVector(b, Math.sin(t * omega) / s);
  return out.multiplyScalar(1 + ROUTE_LIFT * Math.sin(Math.PI * t));
}

/** The route polylines, sampled once (65 points per leg). */
const LEG_LINES = CITY_VECS.map((_, i) => Array.from({ length: 65 }, (_, k) => routePoint(i, k / 64, new Vector3()).toArray() as [number, number, number]));

// Each leg's great-circle angle and its start along the loop, for constant-speed flight.
const LEG_OMEGAS = CITY_VECS.map((a, i) => Math.acos(MathUtils.clamp(a.dot(CITY_VECS[(i + 1) % CITY_VECS.length]), -1, 1)));
const LEG_STARTS: number[] = [];
let TOTAL_OMEGA = 0;
for (const w of LEG_OMEGAS) {
  LEG_STARTS.push(TOTAL_OMEGA);
  TOTAL_OMEGA += w;
}

/** Point at an angular distance `s` along the whole loop (wraps around). */
function alongRoute(s: number, out: Vector3) {
  s = ((s % TOTAL_OMEGA) + TOTAL_OMEGA) % TOTAL_OMEGA;
  let leg = LEG_OMEGAS.length - 1;
  for (let i = 0; i < LEG_OMEGAS.length; i++) {
    if (s < LEG_STARTS[i] + LEG_OMEGAS[i]) {
      leg = i;
      break;
    }
  }
  return routePoint(leg, (s - LEG_STARTS[leg]) / LEG_OMEGAS[leg], out);
}

// Scratch objects for the per-frame plane update (no allocations in the loop).
const PLANE_POS = new Vector3();
const PLANE_AHEAD = new Vector3();
const PLANE_UP = new Vector3();
const PLANE_M = new Matrix4();

// Lead-candle position (globe-local), saved each frame for the follow rotation.
const LEAD_POS = new Vector3();
// Candle-following rotation: the tipped polar axis in world space, and scratch
// objects for measuring how far the lead candle sits from the front of the cap.
const POLAR = Y_AXIS.clone().applyQuaternion(PITCH);
const FOLLOW_Q = new Quaternion();
const FOLLOW_W = new Vector3();
const PA = new Vector3();
const PB = new Vector3();
const PC = new Vector3();

/** Signed angle (radians) from a to b around the axis n, both projected off n. */
function angleAround(n: Vector3, a: Vector3, b: Vector3) {
  PA.copy(a).addScaledVector(n, -a.dot(n));
  PB.copy(b).addScaledVector(n, -b.dot(n));
  PC.crossVectors(PA, PB);
  return Math.atan2(PC.dot(n), PA.dot(PB));
}

/** Crisp at grazing angles; colour maps in sRGB. Runs once when the textures load. */
function prepareTextures(textures: Texture | Texture[]) {
  for (const t of Array.isArray(textures) ? textures : [textures]) {
    t.anisotropy = 16;
    t.colorSpace = SRGBColorSpace;
  }
}

function Earth({ still, inset, onReady }: { still: boolean; inset: number; onReady?: () => void }) {
  const [day, night, moonMap] = useTexture([`${TEX}/earth_day_4096.jpg`, `${TEX}/earth_night_4096.jpg`, `${TEX}/moon_1024.jpg`], prepareTextures);
  const canvas = useThree((state) => state.gl.domElement);

  const globe = useRef<Group>(null);
  const orient = useRef<Group>(null);
  const flare = useRef<Mesh>(null);
  const earthMat = useRef<ShaderMaterial>(null);
  const flareMat = useRef<ShaderMaterial>(null);
  const candles = useRef<(Group | null)[]>([]);
  const glows = useRef<(Mesh | null)[]>([]);
  const routes = useRef<({ material: { dashOffset: number } } | null)[]>([]);
  const moon = useRef<Mesh>(null);
  const moonMat = useRef<ShaderMaterial>(null);
  const stars = useRef<Group>(null);
  const starMat = useRef<ShaderMaterial>(null);
  const sign = useRef<Group>(null);
  const coinSpin = useRef<Group>(null);
  const signState = useRef({ city: -1, scale: 0 }); // which centre's sign shows, and its pop-in scale
  // The coin: a metallic gold edge, and one shared face material whose map is swapped per currency.
  const coinEdgeMat = useMemo(() => new MeshStandardMaterial({ color: "#C9992F", metalness: 0.95, roughness: 0.28, emissive: "#8A6A1E", emissiveIntensity: 0.08, envMapIntensity: 1.4 }), []);
  const streaks = useRef<(Mesh | null)[]>([]);
  // Shooting-star flights: time past (t), wait before launch (delay), flight
  // seconds (dur), start point and velocity. t starts huge: first frame respawns.
  const streakState = useRef(Array.from({ length: 6 }, () => ({ t: 1e3, delay: 2, dur: 0.8, x: 0, y: 0, vx: -800, vy: -320 })));
  const flight = useRef(0); // lead candle's angular distance along the loop (0..TOTAL_OMEGA)

  const size = useRef({ radius: 1, centerY: 0, inset: 0, sunX: 0, sunY: 0 });
  // Day/night toggle: clicking the sun turns it into a moon and slides the earth
  // into night (value eases toward target; both shaders read the blend).
  const mode = useRef({ target: 0, value: 0 });
  const motion = useRef({
    dragging: false,
    spin: START_SPIN, // around the polar axis
    swing: 0, // around the screen's vertical axis
    velocity: { spin: 0, swing: 0 }, // momentum after a release (rad/s)
    idle: RESUME_AFTER, // seconds since the last drag
  });

  // Runs after the textures resolved and the first commit: the earth is really there.
  const rendered = useRef(false);
  useEffect(() => {
    if (!rendered.current) {
      rendered.current = true;
      onReady?.();
    }
  }, [onReady]);

  // The canvas sits under the copy and ignores pointer events, so drags are read on the window
  // and only start on the globe itself (never on links, buttons or text above the horizon).
  useEffect(() => {
    const surface = canvas.closest("section, [data-earth-surface]") ?? canvas.parentElement;
    const m = motion.current;
    let lastMove = 0;
    let last = { x: 0, y: 0 };
    const setCursor = (cursor: string) => {
      if (surface instanceof HTMLElement) surface.style.cursor = cursor;
      document.body.style.cursor = cursor === "grabbing" ? cursor : "";
    };

    const onGlobe = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      // Below the anchor line sits the footer: its empty space never grabs the globe.
      if (clientY > rect.bottom - size.current.inset || clientX < rect.left || clientX > rect.right) return false;
      const x = clientX - rect.left - rect.width / 2;
      const y = rect.height / 2 - (clientY - rect.top) - size.current.centerY;
      return Math.hypot(x, y) < size.current.radius + 24;
    };
    // The sun/moon disc is a click target: a generous circle around its centre.
    const onSun = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = rect.height / 2 - (clientY - rect.top);
      return Math.hypot(x - size.current.sunX, y - size.current.sunY) < 56;
    };
    let sunDown: { x: number; y: number } | null = null;

    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest("a, button, input, select, textarea, [role='button']")) return;
      if (onSun(e.clientX, e.clientY)) {
        sunDown = { x: e.clientX, y: e.clientY }; // resolved as a click on release
        return;
      }
      if (e.pointerType === "touch" || e.button !== 0) return; // touch keeps scrolling the page
      if (!onGlobe(e.clientX, e.clientY)) return;
      e.preventDefault(); // no text selection while dragging
      m.dragging = true;
      m.velocity = { spin: 0, swing: 0 };
      last = { x: e.clientX, y: e.clientY };
      lastMove = performance.now();
      setCursor("grabbing");
    };
    const move = (e: PointerEvent) => {
      if (!m.dragging) {
        setCursor(onSun(e.clientX, e.clientY) ? "pointer" : onGlobe(e.clientX, e.clientY) ? "grab" : "");
        return;
      }
      // One pixel of drag moves the surface about one pixel under the cursor.
      const r = size.current.radius;
      // Dragging sideways turns it the way it spins (surface left/right); up/down nods the axis.
      const spin = (e.clientX - last.x) / r;
      const swing = (e.clientY - last.y) / r;
      m.spin += spin;
      m.swing = MathUtils.clamp(m.swing + swing, -SWING_MAX, SWING_MAX);
      // Momentum for the release: this move's rate per second.
      const now = performance.now();
      const dt = Math.max((now - lastMove) / 1000, 1 / 240);
      m.velocity = { spin: MathUtils.clamp(spin / dt, -3, 3), swing: MathUtils.clamp(swing / dt, -2, 2) };
      lastMove = now;
      last = { x: e.clientX, y: e.clientY };
      m.idle = 0;
    };
    const up = (e: PointerEvent) => {
      // A clean tap on the sun (barely moved since the press) flips day/night.
      if (sunDown) {
        if (Math.hypot(e.clientX - sunDown.x, e.clientY - sunDown.y) < 8 && onSun(e.clientX, e.clientY)) {
          mode.current.target = mode.current.target ? 0 : 1;
        }
        sunDown = null;
      }
      if (!m.dragging) return;
      m.dragging = false;
      // A pause before letting go means no flick.
      if (performance.now() - lastMove > 80) m.velocity = { spin: 0, swing: 0 };
      setCursor("grab");
    };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setCursor("");
    };
  }, [canvas]);

  const earthUniforms = useMemo(() => ({ uDay: { value: day }, uNight: { value: night }, uSun: { value: SUN }, uMode: { value: 0 } }), [day, night]);
  const flareUniforms = useMemo(() => ({ uTime: { value: 0 }, uWidth: { value: 1 }, uMoon: { value: 0 } }), []);
  // One material per candle (body + wick share it), coloured from CANDLE_COLORS,
  // as translucent glass. Standard material + the scene lights shade each face
  // differently, so the bodies read as 3D blocks; a touch of emissive keeps the
  // colour sharp on the shadowed sides.
  const candleMats = useMemo(
    () =>
      CANDLE_COLORS.map((color) => {
        // depthWrite on: the body occludes the stretch of wick inside it, so no line shows through the glass.
        return new MeshStandardMaterial({ color, transparent: true, opacity: 0.8, roughness: 0.25, metalness: 0.15, emissive: color, emissiveIntensity: 0.22 });
      }),
    []
  );
  const moonUniforms = useMemo(() => ({ uMap: { value: moonMap }, uFade: { value: 0 } }), [moonMap]);
  const starUniforms = useMemo(() => ({ uTime: { value: 0 }, uFade: { value: 0 } }), []);
  // Night star field: positions in canvas-normalised space (the group is scaled
  // to the canvas each frame), each with its own twinkle phase and size.
  const starGeo = useMemo(() => {
    const rnd = seeded(220);
    const n = 220;
    const pos = new Float32Array(n * 3);
    const phase = new Float32Array(n);
    const sizes = new Float32Array(n);
    const color = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = rnd() - 0.5;
      pos[i * 3 + 1] = rnd() - 0.5;
      phase[i] = rnd() * Math.PI * 2;
      // Magnitude distribution (most faint, a few bright; sizes padded for the gaussian falloff)
      // and colour temperature: cool blue-whites mostly, the odd warm orange or hot blue star.
      sizes[i] = rnd() < 0.8 ? 2 + rnd() * 1.2 : 3.6 + rnd() * 1.6;
      const hue = rnd();
      const [cr, cg, cb] = hue < 0.1 ? [1.0, 0.85, 0.66] : hue < 0.18 ? [0.75, 0.83, 1.0] : [0.91, 0.94, 1.0];
      color[i * 3] = cr;
      color[i * 3 + 1] = cg;
      color[i * 3 + 2] = cb;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aPhase", new BufferAttribute(phase, 1));
    g.setAttribute("aSize", new BufferAttribute(sizes, 1));
    g.setAttribute("aColor", new BufferAttribute(color, 3));
    return g;
  }, []);
  // Coin faces drawn once onto small canvases (no font assets to load): a gold
  // radial sheen, an inner rim ring, and the currency glyph embossed — a light
  // catch above, the dark strike below — like a minted coin.
  const signTextures = useMemo(
    () =>
      CENTRES.map((c) => {
        const el = document.createElement("canvas");
        el.width = el.height = 512;
        const ctx = el.getContext("2d");
        if (ctx) {
          const glyph = SIGNS[c.code];
          // Base metal with an off-centre sheen, darkening toward the rim.
          const sheen = ctx.createRadialGradient(208, 200, 36, 256, 256, 268);
          sheen.addColorStop(0, "#F8E2A0");
          sheen.addColorStop(0.65, "#E2BB5B");
          sheen.addColorStop(0.92, "#B5892C");
          sheen.addColorStop(1, "#8F6A1F");
          ctx.fillStyle = sheen;
          ctx.beginPath();
          ctx.arc(256, 256, 256, 0, Math.PI * 2);
          ctx.fill();
          // Fine radial brushing: the faint grain of struck metal.
          ctx.strokeStyle = "rgba(120, 88, 24, 0.07)";
          ctx.lineWidth = 2;
          for (let i = 0; i < 72; i++) {
            const a = (i / 72) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(256 + Math.cos(a) * 70, 256 + Math.sin(a) * 70);
            ctx.lineTo(256 + Math.cos(a) * 244, 256 + Math.sin(a) * 244);
            ctx.stroke();
          }
          // Raised-rim shading and the beaded ring just inside it.
          ctx.strokeStyle = "rgba(122, 90, 23, 0.55)";
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.arc(256, 256, 226, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(250, 230, 170, 0.75)";
          for (let i = 0; i < 56; i++) {
            const a = (i / 56) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(256 + Math.cos(a) * 208, 256 + Math.sin(a) * 208, 4.4, 0, Math.PI * 2);
            ctx.fill();
          }
          // The glyph, struck in: shadow below, light catch above, bronze body.
          ctx.font = `700 ${glyph.length > 1 ? 190 : 296}px ui-sans-serif, system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "rgba(74, 51, 10, 0.8)";
          ctx.fillText(glyph, 256, 282);
          ctx.fillStyle = "rgba(255, 249, 224, 0.75)";
          ctx.fillText(glyph, 256, 268);
          ctx.fillStyle = "#705013";
          ctx.fillText(glyph, 256, 274);
        }
        const tex = new CanvasTexture(el);
        tex.colorSpace = SRGBColorSpace;
        tex.anisotropy = 8;
        return tex;
      }),
    []
  );
  const coinFaceMat = useMemo(() => new MeshStandardMaterial({ map: signTextures[0], metalness: 0.75, roughness: 0.3, envMapIntensity: 1.3 }), [signTextures]);
  const streakMats = useMemo(
    () =>
      Array.from({ length: 6 }, () => new ShaderMaterial({ vertexShader: FLARE_VERT, fragmentShader: STREAK_FRAG, uniforms: { uFade: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending })),
    []
  );

  // The render loop mutates these three.js materials (coin face texture, streak
  // fade); it reaches them through refs so React's memoised values stay untouched.
  const coinMatRef = useRef<MeshStandardMaterial | null>(null);
  const streakMatsRef = useRef<ShaderMaterial[] | null>(null);
  useEffect(() => {
    coinMatRef.current = coinFaceMat;
    streakMatsRef.current = streakMats;
  }, [coinFaceMat, streakMats]);
  // Everything above is built by hand (not from JSX), so R3F never frees it:
  // release the GPU buffers, programs and coin-face textures on unmount.
  useEffect(
    () => () => {
      coinEdgeMat.dispose();
      coinFaceMat.dispose();
      candleMats.forEach((m) => m.dispose());
      streakMats.forEach((m) => m.dispose());
      signTextures.forEach((t) => t.dispose());
      starGeo.dispose();
    },
    [coinEdgeMat, coinFaceMat, candleMats, streakMats, signTextures, starGeo]
  );

  useFrame((state, delta) => {
    const { width, height } = state.size;
    const { radius, centerY } = frame(width, height, inset);
    size.current = { radius, centerY, inset, sunX: width * 0.36, sunY: centerY + radius * 1.12 };
    globe.current?.position.set(0, centerY, 0);
    globe.current?.scale.setScalar(radius);

    // A convoy of trading candles on one trail, flown at constant speed with a
    // fixed arc gap between them (so the train never bunches up on short hops
    // like London→Frankfurt), parked with reduced motion. The lookAt keeps each
    // candle's +y standing off the surface, so it flies upright and banks with
    // the arc; a gentle bob keeps the convoy alive.
    // Updated first: the globe's own motion follows the lead candle below.
    const now = state.clock.elapsedTime;
    if (!still) flight.current = (flight.current + (delta * TOTAL_OMEGA) / LAP_SECONDS) % TOTAL_OMEGA;
    for (let i = 0; i < CANDLE_COUNT; i++) {
      const c = candles.current[i];
      if (!c) continue;
      const s = flight.current - i * CANDLE_GAP;
      alongRoute(s, PLANE_POS);
      if (!still) PLANE_POS.multiplyScalar(1 + 0.006 * Math.sin(now * 2.6 + i * 2.1));
      alongRoute(s + 0.015, PLANE_AHEAD);
      c.position.copy(PLANE_POS);
      PLANE_M.lookAt(PLANE_POS, PLANE_AHEAD, PLANE_UP.copy(PLANE_POS).normalize());
      c.quaternion.setFromRotationMatrix(PLANE_M);
      if (i === 0) LEAD_POS.copy(PLANE_POS);
    }

    // A gold coin flies one gap AHEAD of the lead candle, leading the train,
    // slowly spinning. Its currency flips exactly as it strikes each centre
    // (the moment the route crosses the city): $ on hitting New York, £ on
    // hitting London, and so on — each new face pops in from small. It rides
    // the route like the candles; the orientation billboards to the camera
    // with a slight tilt so the metal edge stays in view.
    if (sign.current && orient.current) {
      const sAhead = flight.current + CANDLE_GAP * 1.4;
      const s = ((sAhead % TOTAL_OMEGA) + TOTAL_OMEGA) % TOTAL_OMEGA;
      let leg = LEG_OMEGAS.length - 1;
      for (let i = 0; i < LEG_OMEGAS.length; i++) {
        if (s < LEG_STARTS[i] + LEG_OMEGAS[i]) {
          leg = i;
          break;
        }
      }
      const city = leg; // the centre the coin last struck (legs start at their city)
      const st = signState.current;
      if (st.city !== city) {
        st.city = city;
        st.scale = 0;
        const coinMat = coinMatRef.current;
        if (coinMat) {
          coinMat.map = signTextures[city];
          coinMat.needsUpdate = true;
        }
      }
      st.scale += (1 - st.scale) * Math.min(1, delta * 6);
      alongRoute(sAhead, PLANE_POS);
      if (!still) PLANE_POS.multiplyScalar(1 + 0.006 * Math.sin(now * 2.6 + 9.0));
      sign.current.position.copy(PLANE_POS);
      sign.current.quaternion.copy(orient.current.quaternion).invert().multiply(SIGN_TILT);
      sign.current.scale.setScalar(st.scale);
      sign.current.visible = true;
      if (coinSpin.current && !still) {
        // Spin with a slight precession wobble, like a real coin in flight.
        coinSpin.current.rotation.y += delta * 2.0;
        coinSpin.current.rotation.x = 0.1 * Math.sin(now * 1.7);
      }
    }

    // Decorative life: the city glows breathe out of phase, and the route dashes
    // stream from city to city (still under reduced motion).
    if (!still) {
      for (let i = 0; i < glows.current.length; i++) glows.current[i]?.scale.setScalar(1 + 0.3 * Math.sin(now * 2 + i * 1.3));
      for (let i = 0; i < routes.current.length; i++) {
        const line = routes.current[i];
        if (line) line.material.dashOffset = -now * 0.045;
      }
    }

    const m = motion.current;
    if (!m.dragging) {
      m.idle += delta;
      // Momentum after a flick, fading out.
      const fade = Math.exp(-delta * 2.5);
      m.spin += m.velocity.spin * delta;
      m.swing = MathUtils.clamp(m.swing + m.velocity.swing * delta, -SWING_MAX, SWING_MAX);
      m.velocity = { spin: m.velocity.spin * fade, swing: m.velocity.swing * fade };
      if (!still) {
        // Follow the flight: chase the spin and nod that bring the plane to the
        // front of the cap, so the globe turns at the plane's own pace and the
        // journey is always in view. Eases back in after a drag.
        const chase = Math.min(1, m.idle / RESUME_AFTER) * Math.min(1, delta * 2.5);
        FOLLOW_W.copy(LEAD_POS).normalize().applyQuaternion(orientation(FOLLOW_Q, m.swing, m.spin));
        m.spin += angleAround(POLAR, FOLLOW_W, FOCUS) * chase;
        m.swing = MathUtils.clamp(m.swing + angleAround(X_AXIS, FOLLOW_W, FOCUS) * chase, -SWING_MAX, SWING_MAX);
      }
    }
    if (orient.current) orientation(orient.current.quaternion, m.swing, m.spin);

    // Ease the day/night blend toward its target and feed it to both shaders.
    const md = mode.current;
    md.value = still ? md.target : md.value + (md.target - md.value) * Math.min(1, delta * 3);
    if (earthMat.current) earthMat.current.uniforms.uMode.value = md.value;

    // Sun flare and the textured moon share the sky spot in the upper right;
    // the click cross-fades one into the other. The moon turns very slowly.
    const sun = Math.min(520, width);
    flare.current?.position.set(size.current.sunX, size.current.sunY, radius + 1);
    flare.current?.scale.set(sun, sun, 1);
    if (flareMat.current) {
      flareMat.current.uniforms.uWidth.value = sun;
      flareMat.current.uniforms.uMoon.value = md.value;
      if (!still) flareMat.current.uniforms.uTime.value += delta;
    }
    if (moon.current) {
      moon.current.visible = md.value > 0.01;
      moon.current.position.set(size.current.sunX, size.current.sunY, radius + 2);
      moon.current.scale.setScalar(26 * (0.92 + 0.08 * md.value));
      if (!still) moon.current.rotation.y += delta * 0.04;
    }
    if (moonMat.current) moonMat.current.uniforms.uFade.value = md.value;

    // Night sky: an extra field of twinkling stars fades in with the moon, and
    // every few seconds a shooting star darts down the upper sky.
    if (stars.current) {
      stars.current.visible = md.value > 0.02;
      stars.current.scale.set(width, height, 1);
    }
    if (starMat.current) {
      starMat.current.uniforms.uFade.value = md.value;
      if (!still) starMat.current.uniforms.uTime.value += delta;
    }
    for (let i = 0; i < streakMats.length; i++) {
      const mesh = streaks.current[i];
      if (!mesh) continue;
      const st = streakState.current[i];
      if (!still && md.value > 0.05) st.t += delta;
      let p = (st.t - st.delay) / st.dur;
      if (p >= 1) {
        st.t = 0;
        st.delay = 0.8 + Math.random() * 2.8;
        st.dur = 0.55 + Math.random() * 0.45;
        st.x = (Math.random() - 0.3) * width * 0.8;
        st.y = height * (0.12 + Math.random() * 0.3);
        const angle = Math.PI + 0.25 + Math.random() * 0.45; // down and to the left
        st.vx = Math.cos(angle) * 950;
        st.vy = Math.sin(angle) * 950;
        p = 0;
      }
      const visible = !still && md.value > 0.05 && p > 0;
      mesh.visible = visible;
      if (!visible) continue;
      mesh.position.set(st.x + st.vx * p * st.dur, st.y + st.vy * p * st.dur, 600);
      mesh.rotation.z = Math.atan2(st.vy, st.vx);
      mesh.scale.set(95, 2.6, 1);
      const streakMat = streakMatsRef.current?.[i];
      // Uniform writes inside the three.js render loop are how R3F animates a shader; nothing React renders reads them.
      // eslint-disable-next-line react-hooks/immutability
      if (streakMat) streakMat.uniforms.uFade.value = md.value * Math.sin(Math.PI * p);
    }
  });

  return (
    <>
      {/* Lights for the lit materials (the coin and candles): the sun's direction
          plus a soft fill. The earth, markers and flare use unlit shaders — unaffected. */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[SUN.x * 1000, SUN.y * 1000, SUN.z * 1000]} intensity={1.4} />
      {/* A procedural studio environment, rendered once and kept offline: two warm
          softboxes and a cool fill on black. Metals are only as real as what they
          reflect — this is what puts the streaks of light on the gold coin. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} color="#FFE2B0" position={[3, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer intensity={1.1} color="#BBD2FF" position={[-4, -1, 3]} scale={[6, 1.5, 1]} />
        <Lightformer intensity={0.8} color="#FFFFFF" position={[0, 5, -2]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <group ref={globe}>
        <group ref={orient}>
          <mesh>
            <sphereGeometry args={[1, 160, 160]} />
            <shaderMaterial ref={earthMat} vertexShader={EARTH_VERT} fragmentShader={EARTH_FRAG} uniforms={earthUniforms} />
          </mesh>
          {/* Forex centres: a bright core dot with a breathing gold glow at each city. */}
          {CITY_VECS.map((v, i) => (
            <group key={CENTRES[i].code} position={v.clone().multiplyScalar(1.002)}>
              <mesh>
                <sphereGeometry args={[0.008, 16, 16]} />
                <meshBasicMaterial color="#FFE9B8" />
              </mesh>
              <mesh ref={(el) => void (glows.current[i] = el)}>
                <sphereGeometry args={[0.018, 16, 16]} />
                <meshBasicMaterial color="#E8B64C" transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} />
              </mesh>
            </group>
          ))}
          {/* Great-circle routes joining the centres, dashes streaming along them;
              the far side hides behind the globe. */}
          {LEG_LINES.map((pts, i) => (
            <Line
              key={CENTRES[i].code}
              ref={(el) => void (routes.current[i] = el)}
              points={pts}
              color="#E8C47A"
              lineWidth={1.4}
              transparent
              opacity={0.55}
              depthWrite={false}
              dashed
              dashSize={0.045}
              gapSize={0.025}
            />
          ))}
          {/* The spinning currency coin leading the convoy: metal edge (cylinder
              laid along z) with a minted face on each side (see useFrame). */}
          <group ref={sign} visible={false}>
            <group ref={coinSpin}>
              <mesh material={coinEdgeMat} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.024, 0.024, 0.006, 64]} />
              </mesh>
              {/* Raised rim lips, one on each face — the profile of a struck coin. */}
              <mesh material={coinEdgeMat} position={[0, 0, 0.003]}>
                <torusGeometry args={[0.0228, 0.0013, 10, 64]} />
              </mesh>
              <mesh material={coinEdgeMat} position={[0, 0, -0.003]}>
                <torusGeometry args={[0.0228, 0.0013, 10, 64]} />
              </mesh>
              <mesh material={coinFaceMat} position={[0, 0, 0.0032]}>
                <circleGeometry args={[0.0225, 64]} />
              </mesh>
              <mesh material={coinFaceMat} position={[0, 0, -0.0032]} rotation={[0, Math.PI, 0]}>
                <circleGeometry args={[0.0225, 64]} />
              </mesh>
            </group>
          </group>
          {/* The convoy's travelling trading candles: a body with a wick through each. */}
          {Array.from({ length: CANDLE_COUNT }).map((_, i) => (
            <group key={i} ref={(el) => void (candles.current[i] = el)}>
              {/* Body drawn first (renderOrder) so its depth hides the wick inside it. */}
              <mesh material={candleMats[i]} renderOrder={0}>
                <boxGeometry args={[0.013, 0.021, 0.007]} />
              </mesh>
              <mesh material={candleMats[i]} renderOrder={1}>
                <cylinderGeometry args={[0.0015, 0.0015, 0.036, 6]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      <mesh ref={flare} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={flareMat} vertexShader={FLARE_VERT} fragmentShader={FLARE_FRAG} uniforms={flareUniforms} transparent depthTest={false} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      {/* The real moon: NASA's albedo map on a slowly turning sphere, cross-faded
          in where the sun was clicked away. */}
      <mesh ref={moon} renderOrder={3} visible={false}>
        <sphereGeometry args={[1, 48, 48]} />
        <shaderMaterial ref={moonMat} vertexShader={MOON_VERT} fragmentShader={MOON_FRAG} uniforms={moonUniforms} transparent depthTest={false} depthWrite={false} />
      </mesh>
      {/* Night-only star field behind the globe (the planet occludes its share). */}
      <group ref={stars} position={[0, 0, -600]} visible={false}>
        <points geometry={starGeo}>
          <shaderMaterial ref={starMat} vertexShader={STAR_VERT} fragmentShader={STAR_FRAG} uniforms={starUniforms} transparent depthWrite={false} />
        </points>
      </group>
      {/* Shooting stars, launched now and then across the night sky. */}
      {streakMats.map((mat, i) => (
        <mesh key={i} ref={(el) => void (streaks.current[i] = el)} material={mat} visible={false} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Default export (lazy-loaded by EarthBlock). Fills its parent; drags are read
 * on the window (see Earth). `bottomInset` is the footer height when the scene
 * runs on behind a glass footer: the arc anchors that many px above the bottom.
 */
export default function EarthScene({ onReady, bottomInset = 0 }: { onReady?: () => void; bottomInset?: number }) {
  const still = useMediaQuery("(prefers-reduced-motion: reduce)");
  return (
    <Canvas
      orthographic
      camera={{ zoom: 1, position: [0, 0, 5000], near: 1, far: 20000 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Earth still={still} inset={bottomInset} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
