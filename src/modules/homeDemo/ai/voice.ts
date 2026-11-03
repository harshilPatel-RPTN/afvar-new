"use client";

// AFVAR's spoken lines on the home film. Each clip was recorded once from the
// live avatar's own voice (Gemini "Puck", the avatar API's tts action) — its
// quota is a handful of requests a day, so visitors never call it. Lines follow
// the site sound switch and only one plays at a time.
//
// Every clip carries its loudness envelope (30 frames/s, digits 0–9, measured
// from the recording), which drives both the avatar's mouth and how far the
// line's text has been typed: text advances only while the voice is sounding,
// so it never runs ahead of or behind what is heard.

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { useMotionValueEvent } from "framer-motion";
import { ramp } from "@/modules/afvarOs";
import { isSoundEnabled } from "@/modules/home/kit";
import { useSoundState } from "../audio";

export interface VoiceLine {
  src: string;
  env: string;
  /** Playback speed; defaults to RATE. */
  rate?: number;
}

export const VOICE = {
  // Recorded straight from Gemini (gemini-3.8-flash-tts, voice "Puck", US English accent);
  // the name is sent as "Aff... Vaar" so it keeps its V (picked by ear).
  hello: { src: "/home-demo/voice/hello-en.m4a", env: "00000000059997996410000000467899768762037611111228987644210000000000", rate: 1 },
  avatarAnswer: {
    src: "/home-demo/voice/avatar-answer.m4a",
    env: "00000046786466999542321137698686227954558666731239587633257775354233234430001111111100001996332000999982257941947344597784253283018763340466899301454101775201750223665556565722342575456654135423343210000000000000000000479961110035776579787455561158897899897977654642455635454566587762336676686224765448765431000113455567434565432310000000000",
  },
} as const satisfies Record<string, VoiceLine>;

const FPS = 30;
/** Brisker than the recordings' natural pace; browsers keep the pitch when speeding up. */
const RATE = 1.3;
/** Envelope digits at or above this count as speech (below is breath / silence). */
const VOICED = 2;

let current: { line: VoiceLine; el: HTMLAudioElement } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// A line the browser refused to start (no click or key press on the page yet) waits here
// and starts on the visitor's first gesture, if it is still showing by then.
let pending: VoiceLine | null = null;
// Set once any line has played: from then on the mouth follows the voice alone.
let unlocked = false;

function onGesture() {
  if (!pending) return;
  const line = pending;
  pending = null;
  say(line);
}
if (typeof window !== "undefined") {
  for (const type of ["pointerdown", "keydown", "touchend"]) window.addEventListener(type, onGesture, { capture: true });
}

function say(line: VoiceLine) {
  if (!line.env) return;
  current?.el.pause();
  pending = null;
  const el = new Audio(line.src);
  // Loading resets playbackRate to the default, so set both.
  el.defaultPlaybackRate = el.playbackRate = line.rate ?? RATE;
  const done = () => {
    if (current?.el !== el) return;
    current = null;
    emit();
  };
  el.addEventListener("ended", done);
  current = { line, el };
  el.play().then(
    () => (unlocked = true),
    (error: unknown) => {
      if (current?.el !== el) return;
      if (error instanceof DOMException && error.name === "NotAllowedError") pending = line;
      done();
    },
  );
  emit();
}

function hush(line: VoiceLine) {
  if (pending === line) pending = null;
  if (current?.line !== line) return;
  current.el.pause();
  current = null;
  emit();
}

const level = (line: VoiceLine, t: number) => {
  const f = t * FPS;
  const i = Math.min(line.env.length - 1, Math.floor(f));
  const j = Math.min(line.env.length - 1, i + 1);
  const a = +line.env[i];
  return (a + (+line.env[j] - a) * (f - i)) / 9;
};

/** Share of the line's speech heard by `t` (silences add nothing). */
const cumulative = new Map<VoiceLine, number[]>();
function heard(line: VoiceLine, t: number) {
  let cum = cumulative.get(line);
  if (!cum) {
    let n = 0;
    cum = [...line.env].map((d) => (n += +d >= VOICED ? 1 : 0));
    cumulative.set(line, cum);
  }
  const i = Math.min(cum.length - 1, Math.max(0, Math.floor(t * FPS)));
  return cum[i] / cum[cum.length - 1];
}

/** The avatar's mouth for this frame: the playing line's loudness once voices are heard
 *  (closed between lines), or undefined to keep the scripted mouth while they can't be. */
export function voiceMouth(): number | undefined {
  if (current && !current.el.paused) return level(current.line, current.el.currentTime);
  return unlocked && isSoundEnabled() ? 0 : undefined;
}

/** Speaks `line` as `on` turns true (the line appears) and cuts it if `on` turns false again
 *  or sound is switched off. A line already showing on mount stays silent. Sound only has to
 *  be chosen on: a browser still waiting for a click holds the line until that click. */
export function useSpokenLine(line: VoiceLine, on: boolean) {
  const [sound] = useSoundState();
  const was = useRef(on);
  useEffect(() => {
    const before = was.current;
    was.current = on;
    if (on && !before && sound !== "off") say(line);
    else if (!on && before) hush(line);
  }, [on, line, sound]);
  useEffect(() => {
    if (sound === "off") hush(line);
  }, [sound, line]);
  useEffect(() => () => hush(line), [line]);
}

/** Speaks `line` while `on` and types `text` into the returned span in step with the voice.
 *  Without sound the text types with the scroll over `range` of `mv`, or shows whole without one. */
export function useVoicedText(mv: MotionValue<number>, line: VoiceLine, text: string, on: boolean, range?: readonly [number, number]) {
  const ref = useRef<HTMLSpanElement>(null);
  // Set once this showing of the line has been voiced, so the text stays whole after the voice ends.
  const voiced = useRef(false);
  useSpokenLine(line, on);

  const write = () => {
    const el = ref.current;
    if (!el) return;
    if (!on) voiced.current = false;
    let share: number;
    if (current?.line === line) {
      voiced.current = true;
      share = heard(line, current.el.currentTime);
    } else share = voiced.current ? 1 : range ? ramp(mv.get(), range[0], range[1]) : 1;
    el.textContent = text.slice(0, Math.round(text.length * share));
  };
  const latest = useRef(write);
  useEffect(() => {
    latest.current = write;
    write();
  });
  useMotionValueEvent(mv, "change", () => latest.current());
  // While this line plays, follow the audio every frame.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      latest.current();
      frame = current?.line === line ? requestAnimationFrame(tick) : 0;
    };
    const onVoice = () => {
      if (!frame && current?.line === line) frame = requestAnimationFrame(tick);
      else latest.current();
    };
    listeners.add(onVoice);
    onVoice();
    return () => {
      listeners.delete(onVoice);
      cancelAnimationFrame(frame);
    };
  }, [line]);
  return ref;
}

/** Where each of `count` sentences of an envelope starts, in seconds of audio: the speech is cut
 *  at its `count - 1` longest pauses (runs of digits below VOICED), and each part starts on its
 *  first voiced frame. Parts the envelope has no pause left for start never (Infinity). */
export function splitEnvelope(env: string, count: number): number[] {
  const voiced = [...env].map((d) => +d >= VOICED);
  const first = voiced.indexOf(true);
  if (first < 0 || count < 1) return Array<number>(Math.max(0, count)).fill(Infinity);
  // Pauses between speech: [length, index of the voiced frame after it].
  const pauses: [number, number][] = [];
  for (let i = first, run = 0; i < voiced.length; i++) {
    if (!voiced[i]) run++;
    else {
      if (run) pauses.push([run, i]);
      run = 0;
    }
  }
  const cuts = pauses
    .map((p, k) => [...p, k] as const)
    .sort((a, b) => b[0] - a[0] || a[2] - b[2])
    .slice(0, count - 1)
    .map(([, at]) => at)
    .sort((a, b) => a - b);
  const starts = [first, ...cuts].map((f) => f / FPS);
  while (starts.length < count) starts.push(Infinity);
  return starts;
}

const parts = new Map<VoiceLine, number[]>();
function partStarts(line: VoiceLine, count: number) {
  let starts = parts.get(line);
  if (starts?.length !== count) parts.set(line, (starts = splitEnvelope(line.env, count)));
  return starts;
}

/** Speaks `line` (one sentence per step) while `on` and returns how many of `thresholds.length`
 *  steps to show and which one is being spoken (−1 for none). While the line plays a step shows
 *  as its sentence starts; without sound the steps follow the scroll over `thresholds` of `mv`;
 *  once voiced they stay shown whole until `on` turns false. Re-renders only on change. */
export function useVoicedSteps(mv: MotionValue<number>, line: VoiceLine, on: boolean, thresholds: readonly number[]) {
  const count = thresholds.length;
  const byScroll = (p: number) => thresholds.filter((x) => p >= x).length;
  const [steps, setSteps] = useState<readonly [shown: number, speaking: number]>(() => [byScroll(mv.get()), -1]);
  const voiced = useRef(false);
  useSpokenLine(line, on);

  const update = () => {
    if (!on) voiced.current = false;
    let next: readonly [number, number];
    if (current?.line === line) {
      voiced.current = true;
      const t = current.el.currentTime;
      const shown = partStarts(line, count).filter((s) => s <= t).length;
      next = [shown, shown - 1];
    } else next = [voiced.current ? count : byScroll(mv.get()), -1];
    setSteps((s) => (s[0] === next[0] && s[1] === next[1] ? s : next));
  };
  const latest = useRef(update);
  useEffect(() => {
    latest.current = update;
    update();
  });
  useMotionValueEvent(mv, "change", () => latest.current());
  // While this line plays, follow the audio every frame (state only changes as a sentence starts).
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      latest.current();
      frame = current?.line === line ? requestAnimationFrame(tick) : 0;
    };
    const onVoice = () => {
      if (!frame && current?.line === line) frame = requestAnimationFrame(tick);
      else latest.current();
    };
    listeners.add(onVoice);
    onVoice();
    return () => {
      listeners.delete(onVoice);
      cancelAnimationFrame(frame);
    };
  }, [line]);
  return steps;
}
