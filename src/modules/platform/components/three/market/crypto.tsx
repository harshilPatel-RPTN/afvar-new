"use client";

/**
 * Crypto model: a blockchain ring of glass blocks orbiting a ₿ and an Ether coin.
 * A mining pulse rides the rail under the ring from block to block and each
 * block's core flashes as it is reached. Both coins always face the camera.
 */
import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { clamp01, easeBack, easeOut, GOLD, Live, Metal, Neon, SymbolCoin, useLocalClock, VIOLET } from "./parts";

/* ------------------------------------------------------------------- crypto */

const BLOCKS = 7;
const RADIUS = 2.6; // ring radius; chord between neighbours ≈ 2.26
const SIZE = 0.58; // glass block edge
const STEP = (Math.PI * 2) / BLOCKS;
const TILT = 0.62; // ring tilt toward the camera so it reads as an ellipse
const RAIL_Y = -(SIZE / 2 + 0.14); // mining rail runs just under the blocks
const LINK_R = 0.105; // chain link radius
const LINK_TUBE = 0.024;
const LINK_GAP = 0.095; // half distance between the two link centres
const SPIN = 0.11; // ring rotation, rad/s
const START = 2.4; // mining starts once the ring is built
const HOP = 0.8; // seconds per block hop (travel + dwell)
const TRAVEL = 0.5; // portion of a hop spent moving
const COIN_SCALE = 1; // coin radius 0.5, far inside the ring
/** Coin centres sit ±COIN_X apart: 2 × 0.62 − 2 × 0.5 leaves a 0.24 gap that the sway only widens. */
const COIN_X = 0.62;
const ETH = "#cad0cd"; // cool silver-violet so Ether reads as its own asset next to gold ₿

const appear = (i: number) => 0.25 + i * 0.16;
const smooth = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

const parentQuat = new THREE.Quaternion();
const parentEuler = new THREE.Euler();

export function CryptoScene({ still }: Live) {
  const time = useLocalClock(still);
  const tilt = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const blocks = useRef<THREE.Group[]>([]);
  const cores = useRef<THREE.Mesh[]>([]);
  const links = useRef<THREE.Group[]>([]);
  const rail = useRef<THREE.Mesh>(null);
  const pulse = useRef<THREE.Group>(null);
  const coins = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    const t = time.current;

    // Damp the rig's vertical tilt so the ellipse never collapses into a line across the coin.
    if (tilt.current?.parent) {
      tilt.current.parent.getWorldQuaternion(parentQuat);
      parentEuler.setFromQuaternion(parentQuat);
      tilt.current.rotation.x = TILT - parentEuler.x * 0.85;
    }
    if (ring.current) ring.current.rotation.y = t * SPIN;

    // Mining pulse: hop from block to block along the rail, dwelling at each one.
    const run = Math.max(0, t - START);
    const hop = Math.floor(run / HOP);
    const frac = (run % HOP) / HOP;
    const pos = hop + smooth(frac / TRAVEL);
    const angle = pos * STEP;
    if (pulse.current) {
      pulse.current.visible = t > START;
      pulse.current.position.set(Math.sin(angle) * RADIUS, RAIL_Y, Math.cos(angle) * RADIUS);
    }

    blocks.current.forEach((block, i) => {
      if (!block) return;
      const k = easeBack((t - appear(i)) / 0.55);
      // Time since the pulse last arrived at this block (blocks hit at hop index ≡ i mod BLOCKS).
      let since = Infinity;
      if (t > START) {
        const arrivals = frac >= TRAVEL ? hop : hop - 1;
        if (arrivals >= 0) {
          const last = arrivals - ((((arrivals - i) % BLOCKS) + BLOCKS) % BLOCKS);
          if (last >= 0) since = run - (last * HOP + TRAVEL * HOP);
        }
      }
      const flash = Number.isFinite(since) ? Math.exp(-since * 2.6) : 0;
      block.scale.setScalar(Math.max(0.001, k * (1 + flash * 0.06)));
      const core = cores.current[i];
      if (core) {
        (core.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.1 + flash * 5;
        core.rotation.set(t * 0.6 + i, t * 0.8 + i, 0);
      }
    });

    links.current.forEach((link, i) => {
      if (link) link.scale.setScalar(Math.max(0.001, easeBack((t - appear(i + 1) - 0.15) / 0.45)));
    });
    if (rail.current) rail.current.scale.setScalar(Math.max(0.001, easeOut((t - 0.1) / 1.2)));

    coins.current.forEach((coin, i) => {
      if (!coin) return;
      const k = easeBack((t - 0.1 - i * 0.18) / 0.8);
      coin.scale.setScalar(Math.max(0.001, k * COIN_SCALE));
      coin.position.y = 0.05 + (still ? 0 : Math.sin(t * 1.1 + i * 1.9) * 0.06);
      coin.lookAt(state.camera.position);
      coin.rotateY(Math.sin(t * 0.7 + i * 2.2) * 0.26);
      coin.rotateX(Math.sin(t * 0.5 + i * 1.4) * 0.08);
    });
  });

  return (
    <group position={[0, 0.12, 0]} scale={0.8}>
      <group ref={(g) => void (coins.current[0] = g)} position={[-COIN_X, 0.05, 0]}>
        <SymbolCoin symbol="btc" />
      </group>
      <group ref={(g) => void (coins.current[1] = g)} position={[COIN_X, 0.05, 0]}>
        <SymbolCoin symbol="eth" color={ETH} />
      </group>
      <group ref={tilt} rotation={[TILT, 0, 0]}>
        <group ref={ring}>
          <mesh ref={rail} rotation={[-Math.PI / 2, 0, 0]} position={[0, RAIL_Y, 0]}>
            <torusGeometry args={[RADIUS, 0.011, 8, 220]} />
            <Neon color={VIOLET} intensity={1} />
          </mesh>
          {Array.from({ length: BLOCKS }, (_, i) => {
            const a = i * STEP;
            return (
              <group
                key={i}
                ref={(g) => {
                  if (g) blocks.current[i] = g;
                }}
                position={[Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS]}
                rotation={[0, a, 0]}
              >
                <mesh>
                  <boxGeometry args={[SIZE, SIZE, SIZE]} />
                  <meshPhysicalMaterial color="#333936" metalness={0.2} roughness={0.08} clearcoat={1} transparent opacity={0.45} depthWrite={false} envMapIntensity={1.6} />
                  <Edges color={GOLD} threshold={15} />
                </mesh>
                <mesh
                  ref={(mesh) => {
                    if (mesh) cores.current[i] = mesh;
                  }}
                >
                  <boxGeometry args={[0.22, 0.22, 0.22]} />
                  <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={1.1} toneMapped={false} />
                </mesh>
              </group>
            );
          })}
          {Array.from({ length: BLOCKS }, (_, i) => {
            const a = (i + 0.5) * STEP;
            return (
              <group
                key={i}
                ref={(g) => {
                  if (g) links.current[i] = g;
                }}
                position={[Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS]}
                rotation={[0, a, 0]}
              >
                <mesh position={[-LINK_GAP, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[LINK_R, LINK_TUBE, 12, 40]} />
                  <Metal />
                </mesh>
                <mesh position={[LINK_GAP, 0, 0]}>
                  <torusGeometry args={[LINK_R, LINK_TUBE, 12, 40]} />
                  <Metal />
                </mesh>
              </group>
            );
          })}
          <group ref={pulse} visible={false}>
            <mesh>
              <sphereGeometry args={[0.055, 20, 20]} />
              <Neon color="#ffffff" intensity={4} />
            </mesh>
            <pointLight color={VIOLET} intensity={2.5} distance={1.6} decay={2} />
          </group>
        </group>
      </group>
    </group>
  );
}
