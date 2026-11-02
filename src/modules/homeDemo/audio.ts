"use client";

// /home-demo sound. It follows the "/" sound engine (home sfx): one on/off
// preference for both pages (on by default, like "/"), and every sound "/" has
// — the bull's snort and horn impact, the bear's growl and claw swipe, coins,
// crude pour, the toggle chime, the tick — is played BY "/"'s engine, so the
// two pages sound identical. Only cues "/" has no equivalent for (section
// whoosh, latch, verdict, alert, sonic logo, chapter ping / heartbeat) are
// synthesised here, through one limiter. A stored "on" still needs one click
// or key press before audio can start (scroll is not a user gesture).
//
//   playCue(name)       one-shot, throttled, max 6 voices
//   setDucked(bool)     fade all cues out under the overview video narration
//   useSoundState()     ["off" | "on" | "locked", set] for the toggle
//   resumeSound()       unlock from a click when sound is chosen but locked
//   setAmbience(scene)  a sparse per-chapter layer: a soft alert ping over
//                       Ch05, a slow resting heartbeat over Ch06

import { useSyncExternalStore } from "react";
import { isSoundEnabled, onSoundChange, playSfx, setSoundEnabled, type Sfx } from "@/modules/home/kit";
import { isMotionReduced } from "./motionPref";

export type Cue = "toggle" | "tick" | "latch" | "verdict" | "snort" | "bellow" | "impact" | "growl" | "swipe" | "whoosh" | "glug" | "alert" | "logo" | "coins" | "heartbeat" | "ping";

/** Cues "/" already has a sound for: played by its engine (null = "/" stays silent here). */
const VIA_HOME: Partial<Record<Cue, Sfx | null>> = {
  snort: "snort",
  impact: "impact",
  growl: "growl",
  swipe: "swipe",
  bellow: null,
  coins: "coin",
  glug: "pour",
  toggle: "chime",
  tick: "tick",
};
const MASTER = 0.16;
const MAX_VOICES = 6;

/** Minimum gap between repeats (ms) and voice length (s). */
const SPEC: Partial<Record<Cue, { gap: number; dur: number }>> = {
  latch: { gap: 400, dur: 0.3 },
  verdict: { gap: 600, dur: 0.4 },
  whoosh: { gap: 350, dur: 0.5 },
  alert: { gap: 800, dur: 0.65 },
  logo: { gap: 1500, dur: 1.3 },
  heartbeat: { gap: 500, dur: 0.4 },
  ping: { gap: 900, dur: 0.3 },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let duck: GainNode | null = null;
let enabled = false;
let voices = 0;
const listeners = new Set<() => void>();
const lastAt: Partial<Record<Cue, number>> = {};

const isBrowser = () => typeof window !== "undefined";

const reducedMotion = () => isMotionReduced();

function ensureCtx(): AudioContext | null {
  if (!isBrowser()) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // voices → duck → master → limiter → out
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    master = ctx.createGain();
    master.gain.value = MASTER * (reducedMotion() ? 0.5 : 1);
    duck = ctx.createGain();
    duck.connect(master).connect(limiter).connect(ctx.destination);
    ctx.addEventListener("statechange", emit);
  }
  return ctx;
}

/* ----------------------------------------------------- lifecycle wiring */

let wired = false;
function wire() {
  if (wired || !isBrowser()) return;
  wired = true;
  enabled = isSoundEnabled();
  // The "/" toggle (or ours, which drives it) changed the shared preference.
  onSoundChange(() => {
    enabled = isSoundEnabled();
    if (ctx) void (enabled ? ctx.resume() : ctx.suspend());
    emit();
  });
  // Scroll can't unlock audio; the first click / key press can.
  const unlock = () => {
    if (!enabled) return;
    const c = ensureCtx();
    if (c && c.state === "suspended") void c.resume();
  };
  // Any of these counts as a user gesture; wheel / trackpad scrolling never does.
  for (const type of ["pointerdown", "keydown", "touchend", "click"]) window.addEventListener(type, unlock, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (enabled) void ctx.resume();
  });
}

function emit() {
  syncAmbience();
  listeners.forEach((l) => l());
}

/** Call from the toggle's click handler (a user gesture). */
export function setSoundOn(on: boolean) {
  wire();
  // Stores the shared preference and plays "/"'s chime; onSoundChange syncs us.
  setSoundEnabled(on);
  if (on) void ensureCtx()?.resume();
}

function subscribe(cb: () => void) {
  wire();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** "off" · "on" (playing) · "locked" (chosen on, but the browser is waiting
 *  for a click / tap / key before any audio may start). */
export type SoundState = "off" | "on" | "locked";

const stateOf = (): SoundState => (!enabled ? "off" : ctx && ctx.state === "running" ? "on" : "locked");

/** [state, set]. Server and first client render report "off". */
export function useSoundState(): [SoundState, (on: boolean) => void] {
  const state = useSyncExternalStore(subscribe, stateOf, () => "off" as const);
  return [state, setSoundOn];
}

/** Unlock audio from a click handler when sound is already chosen on. */
export function resumeSound() {
  const c = ensureCtx();
  if (c) void c.resume().then(() => playSfx("chime"));
}

/** Fade every cue out (e.g. while the overview narration plays) and back in. */
export function setDucked(on: boolean) {
  if (!ctx || !duck) return;
  duck.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, on ? 0.05 : 0.2);
}

/* ------------------------------------------------------------ synthesis */

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  return src;
}

/** Exponential attack/release envelope on a fresh gain node. */
function envGain(c: AudioContext, t: number, attack: number, peak: number, release: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  return g;
}

function tone(c: AudioContext, out: AudioNode, t: number, freq: number, type: OscillatorType, attack: number, peak: number, release: number) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(envGain(c, t, attack, peak, release)).connect(out);
  o.start(t);
  o.stop(t + attack + release + 0.05);
}

function filteredNoise(
  c: AudioContext,
  out: AudioNode,
  t: number,
  type: BiquadFilterType,
  from: number,
  to: number,
  q: number,
  attack: number,
  peak: number,
  release: number,
) {
  const n = noise(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + attack + release);
  n.connect(f).connect(envGain(c, t, attack, peak, release)).connect(out);
  n.start(t);
  n.stop(t + attack + release + 0.05);
}

/** A low chest thump. */
function thump(c: AudioContext, out: AudioNode, t: number, freq: number, peak: number) {
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + 0.18);
  o.connect(envGain(c, t, 0.006, peak, 0.2)).connect(out);
  o.start(t);
  o.stop(t + 0.26);
}

const SYNTH: Partial<Record<Cue, (c: AudioContext, out: AudioNode, t: number) => void>> = {
  // Ch01 instrument locks: machined latch — a click with a short metal ring.
  latch: (c, out, t) => {
    filteredNoise(c, out, t, "bandpass", 2600, 1800, 2.5, 0.001, 0.6, 0.04);
    tone(c, out, t + 0.012, 2400, "sine", 0.002, 0.18, 0.22);
    tone(c, out, t + 0.012, 3720, "sine", 0.002, 0.06, 0.14);
  },
  // Ch03 verdict lands — identical for BULLISH, BEARISH and WAIT.
  verdict: (c, out, t) => {
    tone(c, out, t, 880, "sine", 0.008, 0.55, 0.36);
    tone(c, out, t, 1760, "sine", 0.004, 0.12, 0.2);
  },
  // Section transition: a candle chain sweeping across the screen.
  whoosh: (c, out, t) => {
    filteredNoise(c, out, t, "bandpass", 500, 3200, 1.1, 0.12, 0.35, 0.28);
  },
  // Ch05 alert fires: a recognisable two-tone notification with a soft transient.
  alert: (c, out, t) => {
    filteredNoise(c, out, t, "highpass", 5000, 4000, 0.7, 0.001, 0.15, 0.03);
    tone(c, out, t, 784, "sine", 0.005, 0.7, 0.26);
    tone(c, out, t + 0.14, 1175, "sine", 0.005, 0.65, 0.42);
  },
  // Ch06 risk layer: a low "lub-dub".
  heartbeat: (c, out, t) => {
    thump(c, out, t, 58, 0.28);
    thump(c, out, t + 0.18, 50, 0.2);
  },
  // Ch05 alerts layer: a distant, quiet terminal ping.
  ping: (c, out, t) => {
    tone(c, out, t, 1320, "sine", 0.006, 0.08, 0.26);
    tone(c, out, t, 1980, "sine", 0.006, 0.025, 0.14);
  },
  // Ch10 sonic logo: the desk inhales to one tick, then a soft resonant tone.
  logo: (c, out, t) => {
    filteredNoise(c, out, t, "bandpass", 300, 1800, 1.2, 0.22, 0.18, 0.05);
    const at = t + 0.26;
    tone(c, out, at, 1500, "triangle", 0.003, 0.4, 0.05);
    tone(c, out, at + 0.04, 220, "sine", 0.02, 0.6, 0.95);
    tone(c, out, at + 0.04, 330, "sine", 0.02, 0.3, 0.8);
    tone(c, out, at + 0.04, 440, "sine", 0.02, 0.18, 0.7);
  },
};

/** Play one cue if sound is on, the context is running, and it isn't throttled. */
export function playCue(name: Cue) {
  // Wire on first use: the page may have no sound button subscribed to the engine.
  wire();
  if (!enabled || !isBrowser() || document.hidden) return;
  if (name in VIA_HOME) {
    const sfx = VIA_HOME[name];
    if (sfx) playSfx(sfx);
    return;
  }
  const synth = SYNTH[name];
  const spec = SPEC[name];
  if (!synth || !spec) return;
  // The context may not exist yet if the visitor clicked before this engine was wired:
  // any earlier click/tap on the page is enough to create and start it now.
  const c = ctx ?? (navigator.userActivation?.hasBeenActive ? ensureCtx() : null);
  if (!c || !duck) return;
  const now = performance.now();
  if ((lastAt[name] ?? -1e9) > now - spec.gap) return;
  if (voices >= MAX_VOICES) return;
  lastAt[name] = now;
  const out = duck;
  const play = () => {
    voices++;
    window.setTimeout(() => (voices = Math.max(0, voices - 1)), spec.dur * 1000);
    synth(c, out, c.currentTime + 0.01);
  };
  // Suspended (idle tab, power saving, or never started): resume, then play — never drop the cue.
  if (c.state === "running") play();
  else void c.resume().then(() => c.state === "running" && play()).catch(() => {});
}

// Listen for the first click/tap from page load, so the context can start on it.
if (isBrowser()) wire();

/* ------------------------------------------------------------- ambience */

/** What's on screen: plain chapters stay silent; two chapters get a layer. */
export type Scene = "floor" | "alerts" | "risk";

const LAYER: Partial<Record<Scene, { cue: Cue; every: number }>> = {
  alerts: { cue: "ping", every: 5200 },
  risk: { cue: "heartbeat", every: 1400 },
};

let scene: Scene | null = null;
let layerTimer: number | undefined;

function syncAmbience() {
  const c = ctx;
  const live = enabled && scene !== null && !!c && c.state === "running";
  window.clearInterval(layerTimer);
  layerTimer = undefined;
  const layer = live && scene ? LAYER[scene] : undefined;
  if (layer) layerTimer = window.setInterval(() => playCue(layer.cue), layer.every);
}

/** Set the layer for what's on screen (null = silence, e.g. page unmount). */
export function setAmbience(next: Scene | null) {
  wire();
  if (next === scene) return;
  scene = next;
  if (isBrowser()) syncAmbience();
}
