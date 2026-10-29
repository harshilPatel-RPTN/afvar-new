"use client";

/** Briefs model: a stack of brief pages fanning open, the top edition sealed in gold. */
import { Edges, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { clamp01, Coin, Glass, Live, useLocalClock } from "./parts";

/* ------------------------------------------------------------------- briefs */

const PAGES = 5;
const W = 1.9;
const H = 2.55;
const THICK = 0.03;
/** Pages sit in parallel planes 0.05 apart (0.02 clear gap); the fan only rotates within those planes. */
const STEP = 0.05;
const CYCLE = 4.8;
const LIFT_START = 1.9;

/** Fan-out with a soft, critically damped settle (no ringing that reads as jitter). */
function fanEase(x: number) {
  const k = clamp01(x);
  return 1 - (1 + 6 * k) * Math.exp(-6 * k) * (1 - k);
}

/** 0 → 1 → 0 once per cycle after the entrance; never negative, so the top page only moves away from the stack. */
function liftAt(t: number) {
  if (t < LIFT_START) return 0;
  const p = ((t - LIFT_START) % CYCLE) / CYCLE;
  return 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
}

/** Additive diagonal highlight, masked to the page's rounded rectangle. */
function Sheen({ pos }: { pos: React.RefObject<number> }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: { uPos: { value: -2 }, uSize: { value: new THREE.Vector2(W, H) }, uColor: { value: new THREE.Color("#fff1d2") } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: `
          uniform float uPos; uniform vec2 uSize; uniform vec3 uColor; varying vec2 vUv;
          void main(){
            vec2 p = (vUv - 0.5) * uSize;
            vec2 q = abs(p) - uSize * 0.5 + 0.06;
            float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.06;
            float mask = 1.0 - smoothstep(-0.01, 0.0, d);
            float band = exp(-pow((p.x * 0.75 + p.y * 0.55 - uPos) / 0.22, 2.0));
            gl_FragColor = vec4(uColor * band * mask * 0.32, 1.0);
          }`,
      }),
    [],
  );
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const shader = mesh.current?.material as THREE.ShaderMaterial | undefined;
    if (shader) shader.uniforms.uPos.value = pos.current;
  });
  return (
    <mesh ref={mesh} position={[0, 0, THICK / 2 + 0.008]} material={material}>
      <planeGeometry args={[W, H]} />
    </mesh>
  );
}

export function BriefsScene({ still }: Live) {
  const time = useLocalClock(still);
  const fan = useRef<THREE.Group>(null);
  const hinge = useRef<THREE.Group>(null);
  const sheen = useRef(-2);

  useFrame(() => {
    const t = time.current;
    const k = fanEase((t - 0.25) / 1.4);
    fan.current?.children.forEach((pivot, i) => {
      pivot.rotation.z = (i - (PAGES - 1) / 2) * 0.13 * k;
    });
    const lift = still ? 0 : liftAt(t);
    if (hinge.current) {
      // Hinged at the bottom edge and only ever tipped forward, so it never cuts into the page below.
      hinge.current.rotation.x = 0.1 * lift;
      hinge.current.position.z = 0.03 * lift;
    }
    // The sweep crosses the page as the lift peaks.
    const p = t < LIFT_START ? -1 : ((t - LIFT_START) % CYCLE) / CYCLE;
    sheen.current = still ? -2 : p < 0 ? -2 : -1.9 + clamp01((p - 0.32) / 0.4) * 3.8;
  });

  return (
    <group position={[0, -0.12, 0]} rotation={[-0.28, 0.18, 0]}>
      <group ref={fan}>
        {Array.from({ length: PAGES }, (_, i) => {
          const last = i === PAGES - 1;
          return (
            <group key={i} position={[0, -H / 2 - 0.05, i * STEP]}>
              <group ref={last ? hinge : undefined} position={[0, 0.05, 0]}>
                <group position={[0, H / 2, 0]}>
                  <RoundedBox args={[W, H, THICK]} radius={0.06} smoothness={4}>
                    {last ? (
                      <meshPhysicalMaterial color="#7c8492" roughness={0.7} metalness={0} envMapIntensity={0.3} />
                    ) : (
                      <Glass color={i % 2 ? "#1c201e" : "#212523"} />
                    )}
                    {!last && <Edges color="#464f4a" threshold={30} />}
                  </RoundedBox>
                  {last && (
                    <>
                      <group position={[0, 0, THICK / 2]}>
                        <mesh position={[-0.25, 0.92, 0.003]}>
                          <boxGeometry args={[1.1, 0.13, 0.006]} />
                          <meshPhysicalMaterial color="#c99a45" metalness={1} roughness={0.36} envMapIntensity={0.7} />
                        </mesh>
                        {[0.6, 0.42, 0.24, 0.06, -0.12, -0.3, -0.48].map((y, line) => (
                          <mesh key={y} position={[line % 3 === 2 ? -0.2 : 0, y, 0.002]}>
                            <boxGeometry args={[line % 3 === 2 ? 1.1 : 1.5, 0.045, 0.004]} />
                            <meshStandardMaterial color="#252b35" roughness={0.8} />
                          </mesh>
                        ))}
                        {/* Coin half-depth at scale 0.38 is ≈0.027, so its back rim rests on the surface. */}
                        <Coin position={[0.55, -0.85, 0.028]} scale={0.38} />
                      </group>
                      <Sheen pos={sheen} />
                    </>
                  )}
                </group>
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}
