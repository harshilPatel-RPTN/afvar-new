import type { AfvarRobot } from "./robot";
export type MotionName = "idle" | "wave" | "talk" | "look" | "dance" | "listen" | "think" | "explain" | "pointLeft" | "pointRight" | "acknowledge" | "unsure" | "serious" | "celebrate";
export declare const MOTIONS: readonly MotionName[];
export declare const MOTION_EXPRESSIONS: Record<MotionName, string>;
export declare function poseRobot(robot: AfvarRobot, mode: MotionName | "manual", time: number, amplitude?: number, options?: { reducedMotion?: boolean }): void;
export declare function motionFace(mode: MotionName, t: number, amplitude?: number): { blink: number; talk: number; gazeX: number; gazeY: number };
