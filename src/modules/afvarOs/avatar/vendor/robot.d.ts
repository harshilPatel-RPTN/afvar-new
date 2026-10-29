// Types for the vendored AFVAR robot (see robot.js header).
import type * as THREE from "three";
export declare const EXPRESSIONS: readonly string[];
export interface RobotJoint { bone: THREE.Bone; axis: "x" | "y" | "z"; min: number; max: number; rest: number; label: string }
export interface RobotPart { id: string; key: string; name: string; node: THREE.Group; rest: THREE.Vector3; explode: THREE.Vector3; proposed: boolean }
export interface FaceOptions { blink?: number; talk?: number; speaking?: boolean; gazeX?: number; gazeY?: number; mouthWidth?: number; mouthHeight?: number }
export interface AfvarRobot {
  root: THREE.Group;
  parts: RobotPart[];
  joints: Record<string, RobotJoint>;
  bones: THREE.Bone[];
  materials: Record<string, THREE.Material>;
  setExpression(name?: string): string;
  getExpression(): string;
  updateFace(time?: number, options?: FaceOptions): void;
  setDisplayState(value?: string): string | undefined;
  getDisplayState(): string;
  resetPose(): void;
}
export declare function createRobot(three: typeof THREE): AfvarRobot;
