import type * as THREE from "three";
export declare const MEMORY_AURA_PHASES: Record<string, number>;
export interface AuraSettings {
  enabled?: boolean;
  hidden?: boolean;
  anchor?: { x: number; y: number; z: number };
  endpoint?: { x: number; y: number; z: number };
  phase?: string;
  amplitude?: number;
  reducedMotion?: boolean;
  quality?: "balanced" | "performance";
}
export interface MemoryAura { group: THREE.Group; update(dt: number, settings?: AuraSettings): void; getState(): Record<string, unknown>; dispose(): void }
export declare function createMemoryAura(three: typeof THREE, scene: { add(o: THREE.Object3D): void; remove(o: THREE.Object3D): void }): MemoryAura;
