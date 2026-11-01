"use client";

/** Overview model: stamped bullion, $ and € coins, and ₿ and Ether coins on glowing pedestals. */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { clamp01, CYAN, easeBack, easeOut, GOLD, Ingot, Live, SILVER, SymbolCoin, useIngotGeometry, useLocalClock, VIOLET } from "./parts";

/* ------------------------------------------------------------------ layout */

const FLOOR_R = 2.75;
const FLOOR_Y = -1.05;
const PEDESTAL_Y = -0.95;
/** Ingot at scale 0.7: ≈1.18 wide at the base, 0.34 tall incl. bevel. */
const BAR = 0.7;
const BAR_H = 0.49 * BAR;
const BAR_BASE_Y = -0.86 + BAR_H / 2; // bottom bars rest just above the gold ring
const TRAIL = [0, 0.035, 0.07];
const SIDE_X = 2.0;
const ETH = "#cad0cd"; // cool silver-violet Ether coin beside the gold ₿

/** Entrance progress (0..1) for a slot that starts at `delay` seconds. */
const enter = (t: number, delay: number, length = 0.9) => clamp01((t - delay) / length);

/** Flat glowing ring whose emissive strength can be driven per frame. */
function PulseRing({ radius, color, y, tube = 0.014, material }: { radius: number; color: string; y: number; tube?: number; material: React.RefObject<THREE.MeshStandardMaterial | null> }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <torusGeometry args={[radius, tube, 10, 160]} />
      <meshStandardMaterial ref={material} color={color} emissive={color} emissiveIntensity={1.8} toneMapped={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ markets */

export function MarketsScene({ still }: Live) {
  const time = useLocalClock(still);
  const ingot = useIngotGeometry();

  const floor = useRef<THREE.Group>(null);
  const floorGlow = useRef<THREE.MeshStandardMaterial>(null);
  const trail = useRef<THREE.Group>(null);
  const slots = useRef<(THREE.Group | null)[]>([]);
  const glowL = useRef<THREE.MeshStandardMaterial>(null);
  const glowC = useRef<THREE.MeshStandardMaterial>(null);
  const glowR = useRef<THREE.MeshStandardMaterial>(null);
  const floats = useRef<(THREE.Group | null)[]>([]);
  const coins = useRef<(THREE.Group | null)[]>([]);
  const topBar = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = time.current;

    // floor ring opens first, then the node starts its orbit
    const f = enter(t, 0, 1.1);
    floor.current?.scale.setScalar(0.6 + 0.4 * easeOut(f));
    if (floorGlow.current) floorGlow.current.emissiveIntensity = 1.3 * easeOut(f);
    trail.current?.children.forEach((dot, i) => {
      const a = t * 0.42 - TRAIL[i] - Math.PI / 2;
      dot.position.set(Math.cos(a) * FLOOR_R, FLOOR_Y, Math.sin(a) * FLOOR_R);
      dot.scale.setScalar(easeOut(enter(t, 0.5 + i * 0.05, 0.6)) * (1 - i * 0.3));
    });

    // three slots rise in left → centre → right, each with a soft pedestal pulse
    slots.current.forEach((slot, i) => {
      if (!slot) return;
      const k = enter(t, 0.25 + i * 0.22);
      slot.scale.setScalar(Math.max(0.001, easeBack(k)));
      slot.position.y = -0.35 * (1 - easeOut(k));
      const glow = [glowL, glowC, glowR][i].current;
      if (glow) glow.emissiveIntensity = easeOut(k) * (1.6 + 0.45 * Math.sin(t * 1.1 + i * 2.1));
    });

    // gentle independent floats; amplitudes kept below every clearance
    const lift = [0.06, 0.04, 0.06];
    const speed = [0.9, 0.7, 0.8];
    floats.current.forEach((g, i) => {
      if (!g) return;
      // bullion only lifts upward (never into its ring); coins bob around a raised rest
      g.position.y = i === 1 ? lift[i] * (0.5 + 0.5 * Math.sin(t * speed[i])) : lift[i] * Math.sin(t * speed[i] + i * 1.3);
    });
    if (topBar.current) topBar.current.position.y = BAR_BASE_Y + BAR_H + 0.02 + 0.03 * (0.5 + 0.5 * Math.sin(t * 0.9 + 0.8));

    // coins always face the camera, then a small sway so light glints across the struck face
    coins.current.forEach((coin, i) => {
      if (!coin) return;
      const bobY = i === 1 ? 0.025 * Math.sin(t * 1.3 + 2.4) : 0.025 * Math.sin(t * 1.15 + i);
      coin.position.y = (coin.userData.y as number) + bobY;
      coin.lookAt(state.camera.position);
      coin.rotateY(Math.sin(t * 0.55 + i * 1.7) * 0.3);
      coin.rotateX(Math.sin(t * 0.4 + i * 2.3) * 0.08);
    });
  });

  return (
    <group position={[0, 0.32, 0]}>
      {/* floor orbit with a travelling light node and a short fading trail */}
      <group ref={floor}>
        <PulseRing radius={FLOOR_R} color={GOLD} y={FLOOR_Y} material={floorGlow} />
      </group>
      <group ref={trail}>
        {TRAIL.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.065, 24, 24]} />
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={3 - i * 0.9} toneMapped={false} transparent opacity={1 - i * 0.35} />
          </mesh>
        ))}
      </group>

      {/* left: $ and € (forex). Centres 1.1 apart > summed radii 0.86 (+ float), and the € stays left of the bars, so they never touch. */}
      <group position={[-SIDE_X, 0, 0]}>
        <group ref={(g) => void (slots.current[0] = g)}>
          <PulseRing radius={0.6} color={CYAN} y={PEDESTAL_Y} material={glowL} />
          <group ref={(g) => void (floats.current[0] = g)}>
            <group ref={(g) => void (coins.current[0] = g)} position={[-0.47, 0.1, 0.32]} userData={{ y: 0.1 }}>
              <SymbolCoin symbol="usd" scale={0.9} />
            </group>
            <group ref={(g) => void (coins.current[1] = g)} position={[0.29, -0.28, -0.38]} userData={{ y: -0.28 }}>
              <SymbolCoin symbol="eur" color={SILVER} scale={0.82} />
            </group>
          </group>
        </group>
      </group>

      {/* centre: bullion stack (commodities); 0.06 gap between bottom bars, top bar rests above */}
      <group>
        <group ref={(g) => void (slots.current[1] = g)}>
          <PulseRing radius={1.28} color={GOLD} y={PEDESTAL_Y} material={glowC} />
          <group ref={(g) => void (floats.current[1] = g)}>
            <Ingot geometry={ingot} position={[-0.62, BAR_BASE_Y, 0]} scale={BAR} />
            <Ingot geometry={ingot} position={[0.62, BAR_BASE_Y, 0]} scale={BAR} />
            <group ref={topBar} position={[0, BAR_BASE_Y + BAR_H + 0.02, 0]}>
              <Ingot geometry={ingot} scale={BAR} />
            </group>
          </group>
        </group>
      </group>

      {/* right: ₿ and Ether (crypto), mirroring the $ / € pair so they never touch each other or the bars */}
      <group position={[SIDE_X, 0, 0]}>
        <group ref={(g) => void (slots.current[2] = g)}>
          <PulseRing radius={0.6} color={VIOLET} y={PEDESTAL_Y} material={glowR} />
          <group ref={(g) => void (floats.current[2] = g)}>
            <group ref={(g) => void (coins.current[2] = g)} position={[0.47, 0.1, 0.32]} userData={{ y: 0.1 }}>
              <SymbolCoin symbol="btc" scale={0.9} />
            </group>
            <group ref={(g) => void (coins.current[3] = g)} position={[-0.29, -0.28, -0.38]} userData={{ y: -0.28 }}>
              <SymbolCoin symbol="eth" color={ETH} scale={0.82} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
