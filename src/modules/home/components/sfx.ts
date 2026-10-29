"use client";

// Homepage sound effects — synthesised live with WebAudio (no audio files, no
// licensing). Sound is ON by default (the visitor can turn it off with
// <SoundToggle>; that choice is remembered). Browsers only allow audio after a
// user gesture, so the audio context unlocks on the first click/tap/key — effects
// before that are skipped, not queued. Every effect is a no-op while disabled,
// while the tab is hidden, or under prefers-reduced-motion.
//
//   playSfx("snort" | "impact" | "growl" | "swipe" | "tick" | "chime" | "pour" | "clink" | "bell")
//   useSoundEnabled() → [enabled, setEnabled]

import { useSyncExternalStore } from "react";

export type Sfx = "snort" | "impact" | "growl" | "swipe" | "tick" | "chime" | "pour" | "clink" | "bell" | "coin" | "pop" | "yawn";

const STORAGE_KEY = "afvar-home-sound";
const MASTER = 0.32;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = typeof window !== "undefined" && readStoredPref() !== "off";
const listeners = new Set<() => void>();

function readStoredPref() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// Default-on: unlock audio on the visitor's first real gesture (scroll is not one).
if (typeof window !== "undefined") {
  const unlock = () => {
    if (enabled) ensureCtx();
    for (const ev of UNLOCK_EVENTS) window.removeEventListener(ev, unlock, true);
  };
  const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;
  for (const ev of UNLOCK_EVENTS) window.addEventListener(ev, unlock, { capture: true, passive: true });
}

function ensureCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Must be called from a user gesture (click/keydown) to unlock audio. */
export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* private mode — session only */
  }
  if (on) {
    const c = ensureCtx();
    if (c?.state === "running") playSfx("chime");
    else void c?.resume().then(() => playSfx("chime"));
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Non-React read + change subscription (for engines that follow this toggle). */
export function isSoundEnabled() {
  return enabled;
}
export { subscribe as onSoundChange };

/** React binding. A stored "on" preference still needs one gesture to unlock audio. */
export function useSoundEnabled(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, () => enabled, () => false);
  return [on, setSoundEnabled];
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

function env(c: AudioContext, g: GainNode, t: number, attack: number, peak: number, release: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

/** One nostril blast: band-passed noise with a falling centre frequency. */
function blast(c: AudioContext, out: AudioNode, t: number, peak: number) {
  const n = noise(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(1700, t);
  bp.frequency.exponentialRampToValueAtTime(520, t + 0.22);
  const g = c.createGain();
  env(c, g, t, 0.015, peak, 0.24);
  n.connect(bp).connect(g).connect(out);
  n.start(t);
  n.stop(t + 0.3);
}

function lowGrowl(c: AudioContext, out: AudioNode, t: number, freq: number, dur: number, peak: number) {
  const o = c.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(freq, t);
  o.frequency.linearRampToValueAtTime(freq * 0.82, t + dur);
  const vib = c.createOscillator();
  const vibGain = c.createGain();
  vib.frequency.value = 9;
  vibGain.gain.value = freq * 0.05;
  vib.connect(vibGain).connect(o.frequency);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  const g = c.createGain();
  env(c, g, t, 0.06, peak, dur);
  o.connect(lp).connect(g).connect(out);
  o.start(t);
  vib.start(t);
  o.stop(t + dur + 0.1);
  vib.stop(t + dur + 0.1);
}

const SYNTH: Record<Sfx, (c: AudioContext, out: AudioNode, t: number) => void> = {
  // Angry bull snort: two sharp nostril blasts over a short low rumble.
  snort: (c, out, t) => {
    blast(c, out, t, 0.9);
    blast(c, out, t + 0.16, 0.7);
    lowGrowl(c, out, t, 95, 0.38, 0.35);
  },
  // Horn impact: pitched-down thump + short click.
  impact: (c, out, t) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.28);
    const g = c.createGain();
    env(c, g, t, 0.005, 1, 0.32);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.4);
    const n = noise(c);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2400;
    const ng = c.createGain();
    env(c, ng, t, 0.002, 0.35, 0.05);
    n.connect(hp).connect(ng).connect(out);
    n.start(t);
    n.stop(t + 0.08);
  },
  // Bear growl: lower, longer, rougher.
  growl: (c, out, t) => {
    lowGrowl(c, out, t, 68, 0.7, 0.55);
    lowGrowl(c, out, t + 0.02, 103, 0.6, 0.18);
  },
  // Paw swipe: high-passed noise sweeping down.
  swipe: (c, out, t) => {
    const n = noise(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(4200, t);
    bp.frequency.exponentialRampToValueAtTime(700, t + 0.22);
    const g = c.createGain();
    env(c, g, t, 0.01, 0.6, 0.22);
    n.connect(bp).connect(g).connect(out);
    n.start(t);
    n.stop(t + 0.3);
  },
  // Candle tick: tiny, soft blip.
  tick: (c, out, t) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(1500, t);
    const g = c.createGain();
    env(c, g, t, 0.003, 0.12, 0.05);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.08);
  },
  // Crude oil pour: low, thick gurgle — lowpassed noise with slow bubbling AM.
  pour: (c, out, t) => {
    const n = noise(c);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(380, t);
    lp.frequency.linearRampToValueAtTime(220, t + 1.1);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.12);
    g.gain.setValueAtTime(0.5, t + 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
    const bub = c.createOscillator();
    const bubGain = c.createGain();
    bub.frequency.value = 7;
    bubGain.gain.value = 0.25;
    bub.connect(bubGain).connect(g.gain);
    n.connect(lp).connect(g).connect(out);
    n.start(t);
    bub.start(t);
    n.stop(t + 1.3);
    bub.stop(t + 1.3);
  },
  // Gold bar landing: bright metallic clink (inharmonic partials) + soft thud.
  clink: (c, out, t) => {
    [1840, 2760, 4100].forEach((f, k) => {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = c.createGain();
      env(c, g, t, 0.002, 0.22 / (k + 1), 0.5 - k * 0.1);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.6);
    });
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const g = c.createGain();
    env(c, g, t, 0.003, 0.4, 0.14);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.2);
  },
  // Market open bell: two bright strikes with a long decay.
  bell: (c, out, t) => {
    [0, 0.32].forEach((d) => {
      [880, 1320, 2210].forEach((f, k) => {
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const g = c.createGain();
        env(c, g, t + d, 0.004, 0.18 / (k + 1), 1.1);
        o.connect(g).connect(out);
        o.start(t + d);
        o.stop(t + d + 1.2);
      });
    });
  },
  // Coin spin + landing: quick ringing chirps that speed up, then a small clink.
  coin: (c, out, t) => {
    for (let k = 0; k < 6; k++) {
      const at = t + 0.5 * (1 - Math.pow(0.72, k));
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = 2600 + k * 120;
      const g = c.createGain();
      env(c, g, at, 0.002, 0.09, 0.08);
      o.connect(g).connect(out);
      o.start(at);
      o.stop(at + 0.12);
    }
    SYNTH.clink(c, out, t + 0.55);
  },
  // Click burst: tiny soft pop.
  pop: (c, out, t) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(260, t + 0.07);
    const g = c.createGain();
    env(c, g, t, 0.002, 0.16, 0.07);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.1);
  },
  // Sleepy bull: a slow, low exhale (filtered noise sweeping down).
  yawn: (c, out, t) => {
    const n = noise(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 2;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(220, t + 1.1);
    const g = c.createGain();
    env(c, g, t, 0.25, 0.28, 0.9);
    n.connect(bp).connect(g).connect(out);
    n.start(t);
    n.stop(t + 1.3);
  },
  // Sound-on confirmation: two soft rising tones.
  chime: (c, out, t) => {
    [660, 990].forEach((f, k) => {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = c.createGain();
      env(c, g, t + k * 0.09, 0.01, 0.25, 0.35);
      o.connect(g).connect(out);
      o.start(t + k * 0.09);
      o.stop(t + k * 0.09 + 0.45);
    });
  },
};

/** Throttle per effect so fast scrolling can't machine-gun sounds. */
const lastAt: Partial<Record<Sfx, number>> = {};
/** Per-effect trim, measured offline (loudest-300ms RMS) so the set sits in three tiers:
 *  hero moments ≈ −21 dB, mid accents ≈ −25 dB, micro feedback (tick/pop) well below. */
const LEVEL: Record<Sfx, number> = { snort: 1.29, impact: 0.58, growl: 0.81, swipe: 1.55, tick: 1.25, chime: 0.9, pour: 1.17, clink: 0.82, bell: 1, coin: 0.84, pop: 1, yawn: 3.1 };
const MIN_GAP: Record<Sfx, number> = { snort: 900, impact: 600, growl: 900, swipe: 500, tick: 70, chime: 300, pour: 1400, clink: 400, bell: 2500, coin: 300, pop: 90, yawn: 3000 };

export function playSfx(name: Sfx) {
  if (!enabled || typeof window === "undefined" || document.hidden) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const now = performance.now();
  if ((lastAt[name] ?? -1e9) > now - MIN_GAP[name]) return;
  // Before the first gesture the context can't start; skip rather than queue a burst.
  if (!ctx && !navigator.userActivation?.hasBeenActive) return;
  const c = ensureCtx();
  if (!c || !master || c.state !== "running") return;
  lastAt[name] = now;
  const trim = c.createGain();
  trim.gain.value = LEVEL[name];
  trim.connect(master);
  SYNTH[name](c, trim, c.currentTime + 0.01);
  window.setTimeout(() => trim.disconnect(), 3000);
}

/* ------------------------------------------------------------ haptics */

/** Short vibration for physical moments (bull impact, gold landing). Only after the
 *  visitor turned sound on (a user gesture), only where supported (Android Chrome),
 *  never under reduced motion. iOS Safari has no Vibration API — silently a no-op. */
export function haptic(pattern: number | number[] = 18) {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* blocked — ignore */
  }
}
