"use client";

// The AFVAR AI core: a gold mind behind glass — two counter-turning geodesic
// nets around a white-hot nucleus, a beating glow, a cloud of thought sparks.
// It is the brand's protagonist; reuse it on any page inside <CoreCanvas>.
//
//   <AiCore drive={(p) => ({ glow: 1, scale: 1, think: 0 })} />
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { COLORS } from "../theme";
import { useStoryFrame } from "./stage";

export const CORE_SIZE = { radius: 0.62, shell: 0.82 } as const;

export interface CoreDrive {
  /** Overall brightness (≈1 calm, 1.5 working hard). */
  glow: number;
  /** Uniform scale. */
  scale: number;
  /** 0..1 — faster heartbeat and spin while the AI is busy (listening, reasoning). */
  think: number;
  /** 0..1 — opacity of the thought-spark cloud. */
  sparks?: number;
}

const DEFAULT: CoreDrive = { glow: 1, scale: 1, think: 0, sparks: 1 };
const HOT = new THREE.Color(COLORS.goldHot);

export function AiCore({ drive, position = [0, 0, 0] }: { drive?: (p: number) => CoreDrive; position?: readonly [number, number, number] }) {
  const { smoothed, still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const shell = useRef<THREE.Mesh>(null);
  const neural = useRef<THREE.Group>(null);
  const nucleus = useRef<THREE.MeshBasicMaterial>(null);
  const sparks = useRef<THREE.Points>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const t = s.clock.elapsedTime;
    const d = drive ? drive(p) : DEFAULT;
    const hz = 1.15 * (1 + d.think * 1.2);
    const beat = still ? 0.5 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * hz);
    const glow = d.glow * (0.82 + 0.36 * beat);
    if (inner.current) inner.current.emissiveIntensity = 0.55 * glow;
    if (light.current) light.current.intensity = (10 + glow * 10) * Math.min(1, d.scale * d.scale);
    if (nucleus.current) nucleus.current.color.setScalar(1).lerp(HOT, 0.4).multiplyScalar(1.5 + glow);
    if (group.current) {
      // A hidden core must not stay in the scene: its glass (transmission) shell
      // makes three.js render everything twice.
      group.current.visible = d.scale > 0.002;
      group.current.scale.setScalar(Math.max(0.0001, d.scale * (1 + 0.03 * beat)));
    }
    if (!still) {
      if (shell.current) shell.current.rotation.y = t * 0.15;
      if (neural.current) {
        neural.current.rotation.y = t * (0.35 + d.think * 0.9);
        neural.current.rotation.x = t * 0.21;
      }
      if (sparks.current) sparks.current.rotation.y = t * 0.06;
    }
    if (sparks.current) {
      const o = 0.55 * (d.sparks ?? 1);
      sparks.current.visible = o > 0.005;
      (sparks.current.material as THREE.PointsMaterial).opacity = o;
    }
  });

  const sparkGeo = useMemo(() => {
    const COUNT = 260;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < COUNT; i++) {
      const r = 1.05 + rnd() * 1.1;
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.7;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <group position={position as [number, number, number]}>
      <group ref={group} name="AiCore">
        <mesh>
          <icosahedronGeometry args={[CORE_SIZE.radius, 6]} />
          <meshStandardMaterial ref={inner} color={COLORS.goldDeep} emissive={COLORS.gold} emissiveIntensity={0.55} roughness={0.35} metalness={0.2} transparent opacity={0.7} depthWrite={false} toneMapped={false} />
        </mesh>
        <group ref={neural}>
          <mesh>
            <icosahedronGeometry args={[CORE_SIZE.radius * 0.82, 1]} />
            <meshBasicMaterial color={COLORS.goldHot} wireframe transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <mesh rotation={[0.6, 0.9, 0]}>
            <dodecahedronGeometry args={[CORE_SIZE.radius * 0.6, 0]} />
            <meshBasicMaterial color={COLORS.gold} wireframe transparent opacity={0.7} toneMapped={false} />
          </mesh>
        </group>
        <mesh>
          <sphereGeometry args={[CORE_SIZE.radius * 0.16, 24, 24]} />
          <meshBasicMaterial ref={nucleus} color="#FFF4DA" toneMapped={false} />
        </mesh>
        <mesh ref={shell}>
          <icosahedronGeometry args={[CORE_SIZE.shell, 2]} />
          <meshPhysicalMaterial color="#d9b77a" metalness={0} roughness={0.12} transmission={0.9} thickness={0.5} ior={1.4} clearcoat={1} transparent opacity={0.55} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[CORE_SIZE.shell * 1.002, 2]} />
          <meshBasicMaterial color={COLORS.gold} wireframe transparent opacity={0.12} toneMapped={false} />
        </mesh>
        <pointLight ref={light} color={COLORS.gold} intensity={12} distance={9} decay={2} />
      </group>
      <points ref={sparks} geometry={sparkGeo}>
        <pointsMaterial color={COLORS.goldHot} size={0.028} sizeAttenuation transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </points>
    </group>
  );
}
