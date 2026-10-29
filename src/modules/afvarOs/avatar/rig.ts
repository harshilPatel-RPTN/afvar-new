"use client";

// The AFVAR avatar as a reusable 3D actor. One robot is built per page —
// lazily, in idle time — and moved between scenes (an Object3D has one
// parent), so a film can hand the same avatar from its 3D stage to an OS
// overlay without building a second 292k-triangle robot.
//
// Geometry, motions, LED face and hologram come unchanged from the avatar repo
// (./vendor). This file only adds what a scroll film needs: gesture
// crossfades, scripted speech amplitude, part assembly and placement.
import { useSyncExternalStore } from "react";
import * as THREE from "three";
import { createMemoryAura, type MemoryAura } from "./vendor/memory-aura";
import { motionFace, poseRobot, type MotionName } from "./vendor/motions";
import { createRobot, type AfvarRobot } from "./vendor/robot";

export type { MotionName };

/** Everything a film controls on the avatar for one frame. */
export interface AvatarFrame {
  visible: boolean;
  gesture: MotionName;
  emotion: string;
  /** 0..1 — scripted speech energy (drives the LED mouth like audio would). */
  talk: number;
  /** 0 assembled … 1 fully exploded into parts. */
  explode: number;
  /** Hologram energy phase: idle, listening, thinking, speaking, serious… */
  aura: string;
  /** Placement of the actor's feet (scene units or px, set by the host). */
  x: number;
  y: number;
  z: number;
  scale: number;
  /** Turn towards the travel direction (radians). */
  turn: number;
  /** Forward lean while moving fast (radians). */
  lean: number;
}

export const AVATAR_HEIGHT = 4.7; // robot body height in its own units (feet ≈ 0.87, head ≈ 5.56)
const EXPLODE_REACH = 4.2;
const BLEND_SECONDS = 0.35;

export interface AvatarRig {
  robot: AfvarRobot;
  aura: MemoryAura;
  /** Add this to a scene. Its transform is owned by update(). */
  root: THREE.Group;
  update(dt: number, elapsed: number, f: AvatarFrame, opts?: { reduced?: boolean; quality?: "balanced" | "performance" }): void;
}

/* ------------------------------------------------------------- the build */

let rig: AvatarRig | null = null;
const listeners = new Set<() => void>();

function build(): AvatarRig {
  const robot = createRobot(THREE);
  const root = new THREE.Group();
  root.name = "AFVAR_Avatar";
  const body = new THREE.Group(); // turn, then lean forward in the facing direction
  body.rotation.order = "YXZ";
  root.add(body);
  body.add(robot.root);
  const holder = new THREE.Group();
  root.add(holder);
  const aura = createMemoryAura(THREE, holder);
  // Rendering hygiene for a page with other scenes: no shadow maps here.
  robot.root.traverse((o) => {
    o.castShadow = false;
    o.receiveShadow = false;
  });

  const joints = Object.values(robot.joints);
  const snapshot = new Float32Array(joints.length);
  const anchor = new THREE.Vector3();
  const endpoint = new THREE.Vector3();
  let gesture: MotionName = "idle";
  let gestureStart = 0;
  let blendStart = -10;
  let lastExplode = -1;

  const update: AvatarRig["update"] = (dt, elapsed, f, opts = {}) => {
    root.visible = f.visible;
    if (!f.visible) return;
    root.position.set(f.x, f.y, f.z);
    root.scale.setScalar(Math.max(0.0001, f.scale));
    body.rotation.set(f.lean, f.turn, 0);

    // Gesture change: remember the current pose, then crossfade into the new one.
    if (f.gesture !== gesture) {
      joints.forEach((j, i) => (snapshot[i] = j.bone.rotation[j.axis]));
      gesture = f.gesture;
      gestureStart = elapsed;
      blendStart = elapsed;
    }
    const gt = elapsed - gestureStart;
    poseRobot(robot, gesture, gt, 1, { reducedMotion: opts.reduced });
    const k = Math.min(1, (elapsed - blendStart) / BLEND_SECONDS);
    if (k < 1) {
      const e = k * k * (3 - 2 * k);
      joints.forEach((j, i) => {
        j.bone.rotation[j.axis] = snapshot[i] + (j.bone.rotation[j.axis] - snapshot[i]) * e;
      });
    }

    robot.setExpression(f.emotion);
    const face = motionFace(gesture, gt);
    // Scripted speech energy: syllable-like pulses, never a fixed sine.
    const talk = f.talk > 0 ? f.talk * (0.3 + 0.7 * Math.abs(Math.sin(elapsed * 9.3) * Math.sin(elapsed * 3.1 + 1.3))) : 0;
    robot.updateFace(elapsed, { ...face, talk, speaking: f.talk > 0.02 });

    if (Math.abs(f.explode - lastExplode) > 1e-4) {
      lastExplode = f.explode;
      const x = f.explode * EXPLODE_REACH;
      for (const p of robot.parts) p.node.position.copy(p.rest).addScaledVector(p.explode, x);
    }

    // Hologram follows the body, in root space.
    robot.joints.body.bone.updateWorldMatrix(true, false);
    robot.joints.body.bone.getWorldPosition(anchor);
    root.worldToLocal(anchor);
    endpoint.set(0, -1.215, 0);
    robot.joints.body.bone.localToWorld(endpoint);
    root.worldToLocal(endpoint);
    aura.update(dt, {
      enabled: f.explode < 0.6,
      anchor,
      endpoint,
      phase: f.aura,
      amplitude: talk,
      reducedMotion: opts.reduced,
      quality: opts.quality ?? "balanced",
    });
  };

  return { robot, aura, root, update };
}

/** The page's avatar, built on first call. Prefer scheduleAvatarBuild() so it builds in idle time. */
export function getAvatarRig(): AvatarRig {
  if (!rig) {
    const t0 = performance.now();
    rig = build();
    try {
      performance.measure("afvar-avatar-build", { start: t0, end: performance.now() });
    } catch {
      /* measure unsupported */
    }
    listeners.forEach((l) => l());
  }
  return rig;
}

/** Build the avatar when the browser is idle (or after `timeout` ms at the latest). */
export function scheduleAvatarBuild(timeout = 2500): () => void {
  if (rig || typeof window === "undefined") return () => {};
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(() => getAvatarRig(), { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(() => getAvatarRig(), Math.min(timeout, 1200));
  return () => window.clearTimeout(id);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** The rig once it exists (null before), without forcing a build during render. */
export function useAvatarRig(): AvatarRig | null {
  return useSyncExternalStore(
    subscribe,
    () => rig,
    () => null,
  );
}

/** A neutral frame to start from. */
export function avatarFrame(over: Partial<AvatarFrame> = {}): AvatarFrame {
  return { visible: true, gesture: "idle", emotion: "happy", talk: 0, explode: 0, aura: "idle", x: 0, y: 0, z: 0, scale: 1, turn: 0, lean: 0, ...over };
}
