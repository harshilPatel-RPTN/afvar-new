// Timeline math for scroll stories: one master progress (0..1) and pure
// functions of it. No allocation in the hot paths except where noted.

export type Window4 = readonly [number, number, number, number];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0→1 inside [a, b]. */
export const ramp = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** Fade in over [a, b], hold, fade out over [c, d]. */
export const window4 = (p: number, [a, b, c, d]: Window4) => ramp(p, a, b) * (1 - ramp(p, c, d));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/* ------------------------------------------------------------ story shape */

export interface StoryActDef<Id extends string> {
  id: Id;
  /** Scroll length of the act in viewport heights. */
  vh: number;
  /** Short name for the chapter rail. */
  label: string;
}

export interface Story<Id extends string> {
  order: readonly Id[];
  labels: Record<Id, string>;
  /** [start, end] of each act in master progress. */
  range: Record<Id, readonly [number, number]>;
  /** Default copy window per act (first act starts visible, last act stays). */
  copy: Record<Id, Window4>;
  totalVh: number;
  /** Master progress at fraction f (0..1) of act `id`. */
  at: (id: Id, f: number) => number;
  /** Window inside an act, given as act fractions. */
  win: (id: Id, w: Window4) => Window4;
  /** Local 0..1 progress of an act (clamped). */
  local: (p: number, id: Id) => number;
  /** The act that contains p. */
  actAt: (p: number) => Id;
}

/** Turn an ordered list of acts into the numbers every scene and overlay reads. */
export function defineStory<Id extends string>(acts: readonly StoryActDef<Id>[]): Story<Id> {
  if (acts.length === 0) throw new Error("defineStory: no acts");
  const totalVh = acts.reduce((s, a) => s + a.vh, 0);
  const range = {} as Record<Id, readonly [number, number]>;
  const copy = {} as Record<Id, Window4>;
  const labels = {} as Record<Id, string>;
  let acc = 0;
  acts.forEach((a, i) => {
    const s = acc / totalVh;
    acc += a.vh;
    const e = acc / totalVh;
    const len = e - s;
    range[a.id] = [s, e];
    labels[a.id] = a.label;
    if (i === 0) copy[a.id] = [-1, -0.5, e - len * 0.32, e - len * 0.04];
    else if (i === acts.length - 1) copy[a.id] = [s + len * 0.04, s + len * 0.22, 2, 3];
    else copy[a.id] = [s + len * 0.05, s + len * 0.2, e - len * 0.2, e - len * 0.04];
  });
  const order = acts.map((a) => a.id);
  const at = (id: Id, f: number) => range[id][0] + (range[id][1] - range[id][0]) * f;
  return {
    order,
    labels,
    range,
    copy,
    totalVh,
    at,
    win: (id, w) => [at(id, w[0]), at(id, w[1]), at(id, w[2]), at(id, w[3])] as const,
    local: (p, id) => ramp(p, range[id][0], range[id][1]),
    actAt: (p) => order.find((id) => p >= range[id][0] && p < range[id][1]) ?? order[order.length - 1],
  };
}

/* ------------------------------------------------------------- keyframes */

export type Keyframe<K extends string> = { at: number } & Record<K, number>;

/**
 * Sample eased keyframes at p. Before the first key → first; after the last →
 * last. Writes into `out` (pass a reused object to avoid allocation).
 */
export function sampleKeys<T extends { at: number }>(
  keys: readonly T[],
  p: number,
  out: Omit<T, "at"> = {} as Omit<T, "at">,
  ease: (t: number) => number = easeInOut,
): Omit<T, "at"> {
  const n = keys.length;
  let i = 0;
  while (i < n - 1 && p >= keys[i + 1].at) i++;
  const a = keys[i] as unknown as Record<string, number>;
  const b = keys[Math.min(i + 1, n - 1)] as unknown as Record<string, number>;
  const t = a === b || p <= a.at ? (p <= a.at ? 0 : 1) : ease(ramp(p, a.at, b.at));
  const o = out as unknown as Record<string, number>;
  for (const k in a) {
    if (k === "at") continue;
    o[k] = lerp(a[k], b[k], t);
  }
  return out;
}
