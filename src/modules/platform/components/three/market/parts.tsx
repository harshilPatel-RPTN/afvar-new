"use client";

/**
 * Shared building blocks for the W3 Markets models: palette, easing, the
 * visible-only clock, materials and the precise parts (bevelled bullion,
 * minted coins with struck ₿ / $ / € glyphs, glow rings).
 */
import { Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";

export const GOLD = "#e8bd68";
export const SILVER = "#8e98a6";
export const CYAN = "#69F0AE";
export const VIOLET = "#8cf9c3";
export const GLASS = "#252a28";

export type Live = { still: boolean };

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export function easeBack(x: number) {
  const k = clamp01(x);
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
}

/** Seconds of rendered time (frozen at a finished pose under reduced motion). */
export function useLocalClock(still: boolean): RefObject<number> {
  const time = useRef(still ? 30 : 0);
  useFrame((_, dt) => {
    if (!still) time.current += Math.min(dt, 1 / 20);
  });
  return time;
}

export function Bob({ still, children, speed = 1.3, float = 0.45, rotation = 0.12 }: Live & { children: ReactNode; speed?: number; float?: number; rotation?: number }) {
  if (still) return <>{children}</>;
  return (
    <Float speed={speed} floatIntensity={float} rotationIntensity={rotation}>
      {children}
    </Float>
  );
}

/* ---------------------------------------------------------------- materials */

export function Metal({ color = GOLD, roughness = 0.16 }: { color?: string; roughness?: number }) {
  return <meshPhysicalMaterial color={color} metalness={1} roughness={roughness} clearcoat={0.7} clearcoatRoughness={0.1} envMapIntensity={1.7} />;
}
export function Glass({ color = GLASS }: { color?: string }) {
  return <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.12} clearcoat={1} clearcoatRoughness={0.04} envMapIntensity={1.5} />;
}
export function Neon({ color, intensity = 2 }: { color: string; intensity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />;
}

/* -------------------------------------------------------------------- parts */

/** Bullion bar: bevelled trapezoid that also tapers front to back. */
export function useIngotGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.8, 0);
    shape.lineTo(0.8, 0);
    shape.lineTo(0.6, 0.4);
    shape.lineTo(-0.6, 0.4);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.62, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.045, bevelSegments: 4, curveSegments: 1 });
    geometry.center();
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      if (position.getY(i) > 0) position.setZ(i, position.getZ(i) * 0.74);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

export function Ingot({ geometry, color = GOLD, stamp = true, ...props }: { geometry: THREE.BufferGeometry; color?: string; stamp?: boolean } & React.ComponentProps<"group">) {
  return (
    <group {...props}>
      <mesh geometry={geometry}>
        <Metal color={color} />
      </mesh>
      {stamp && <Stamp />}
    </group>
  );
}

/** Minted coin: body, raised rims, matte field and an emblem ring on both faces. */
export function Coin({ color = GOLD, ...props }: { color?: string } & React.ComponentProps<"group">) {
  return (
    <group {...props}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.08, 96]} />
          <Metal color={color} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.38, 0.38, 0.092, 96]} />
          <Metal color={color} roughness={0.38} />
        </mesh>
      </group>
      {[0.045, -0.045].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh>
            <torusGeometry args={[0.455, 0.026, 16, 96]} />
            <Metal color={color} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.19, 0.022, 12, 64]} />
            <Metal color={color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Flat glowing ring, the pedestal / floor line of every scene. */
export function Halo({ radius, color, y = 0, intensity = 1.5, tube = 0.014 }: { radius: number; color: string; y?: number; intensity?: number; tube?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <torusGeometry args={[radius, tube, 8, 160]} />
      <Neon color={color} intensity={intensity} />
    </mesh>
  );
}


/* ------------------------------------------------------- precise glyphs */

/** ₿ as solid geometry: stem, two bowls (with counters) and the four strokes, tilted like the logo. */
export function useBitcoinGeometry() {
  return useMemo(() => {
    const shapes: THREE.Shape[] = [];
    const rect = (x0: number, y0: number, x1: number, y1: number) => {
      const shape = new THREE.Shape();
      shape.moveTo(x0, y0);
      shape.lineTo(x1, y0);
      shape.lineTo(x1, y1);
      shape.lineTo(x0, y1);
      shape.closePath();
      shapes.push(shape);
    };
    const bowl = (top: number, bottom: number, right: number, thick: number) => {
      const r = (top - bottom) / 2;
      const cy = (top + bottom) / 2;
      const shape = new THREE.Shape();
      shape.moveTo(-0.16, top);
      shape.lineTo(right, top);
      shape.absarc(right, cy, r, Math.PI / 2, -Math.PI / 2, true);
      shape.lineTo(-0.16, bottom);
      shape.closePath();
      const hole = new THREE.Path();
      hole.moveTo(-0.16, top - thick);
      hole.lineTo(right, top - thick);
      hole.absarc(right, cy, r - thick, Math.PI / 2, -Math.PI / 2, true);
      hole.lineTo(-0.16, bottom + thick);
      hole.closePath();
      shape.holes.push(hole);
      shapes.push(shape);
    };
    rect(-0.36, -0.5, -0.16, 0.5);
    bowl(0.5, 0.02, 0.06, 0.15);
    bowl(0.02, -0.5, 0.1, 0.15);
    rect(-0.27, 0.5, -0.17, 0.66);
    rect(-0.04, 0.5, 0.06, 0.66);
    rect(-0.27, -0.66, -0.17, -0.5);
    rect(-0.04, -0.66, 0.06, -0.5);
    const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 32 });
    geometry.center();
    geometry.rotateZ(-0.24);
    return geometry;
  }, []);
}

/**
 * Ethereum logo as solid geometry: the upper diamond and the lower chevron with a
 * small gap, proportioned like the official mark (256 × 417). Each part is split
 * down the centre into left / right halves so the two facets can take different
 * finishes. Returns [left, right], centred on the whole logo.
 */
export function useEthereumGeometry() {
  return useMemo(() => {
    const H = 0.62; // half-height at scale 1
    const f = (2 * H) / 417;
    const P = (x: number, y: number): [number, number] => [(x - 128) * f, (208.5 - y) * f];
    const poly = (points: [number, number][]) => {
      const shape = new THREE.Shape();
      shape.moveTo(...points[0]);
      points.slice(1).forEach((p) => shape.lineTo(...p));
      shape.closePath();
      return shape;
    };
    // upper diamond: top, side point, lower centre; lower chevron: side, inner top, bottom point
    const left = [poly([P(128, 0), P(0, 212), P(128, 294)]), poly([P(0, 236), P(128, 316), P(128, 417)])];
    const right = [poly([P(128, 0), P(128, 294), P(256, 212)]), poly([P(256, 236), P(128, 417), P(128, 316)])];
    const options = { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 1 };
    return [left, right].map((shapes) => {
      const geometry = new THREE.ExtrudeGeometry(shapes, options);
      geometry.translate(0, 0, -0.025); // centre the extrusion depth (x / y are already centred)
      return geometry;
    });
  }, []);
}

/** $ and € as rounded engraved strokes (tubes), the way minted lettering catches light. */
/** Currency symbols drawn as rounded engraved strokes. */
export type StrokeSymbol = "usd" | "eur" | "jpy" | "gbp" | "nzd";
export type CoinSymbol = "btc" | "eth" | StrokeSymbol;

export function useStrokeGlyph(kind: StrokeSymbol) {
  return useMemo(() => {
    const geometries: THREE.BufferGeometry[] = [];
    const R = 0.045;
    if (kind === "usd") {
      const s = new THREE.CatmullRomCurve3(
        [
          [0.22, 0.27],
          [0.02, 0.37],
          [-0.2, 0.27],
          [-0.17, 0.08],
          [0.16, -0.06],
          [0.21, -0.26],
          [-0.02, -0.37],
          [-0.24, -0.26],
        ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
      );
      geometries.push(new THREE.TubeGeometry(s, 96, R, 12, false));
      geometries.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0.52, 0), new THREE.Vector3(0, -0.52, 0)), 4, R * 0.8, 12, false));
    } else if (kind === "nzd") {
      // NZ$: a compact N and Z at ~60% height beside a full-height $, centred in the field
      const r = R * 0.8;
      const line = (x0: number, y0: number, x1: number, y1: number, radius = r) =>
        geometries.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(x0, y0, 0), new THREE.Vector3(x1, y1, 0)), 4, radius, 12, false));
      const h = 0.23;
      // N
      line(-0.57, -h, -0.57, h);
      line(-0.57, h, -0.31, -h);
      line(-0.31, -h, -0.31, h);
      // Z
      line(-0.2, h, 0.06, h);
      line(0.06, h, -0.2, -h);
      line(-0.2, -h, 0.06, -h);
      // $
      const cx = 0.36;
      const sCurve = new THREE.CatmullRomCurve3(
        [
          [0.22, 0.27],
          [0.02, 0.37],
          [-0.2, 0.27],
          [-0.17, 0.08],
          [0.16, -0.06],
          [0.21, -0.26],
          [-0.02, -0.37],
          [-0.24, -0.26],
        ].map(([x, y]) => new THREE.Vector3(cx + x * 0.75, y * 0.82, 0)),
      );
      geometries.push(new THREE.TubeGeometry(sCurve, 96, r, 12, false));
      line(cx, 0.43, cx, -0.43, r * 0.8);
    } else if (kind === "jpy") {
      // ¥: two arms meeting at the centre, a stem, two crossbars
      const line = (x0: number, y0: number, x1: number, y1: number, r = R) =>
        geometries.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(x0, y0, 0), new THREE.Vector3(x1, y1, 0)), 4, r, 12, false));
      line(-0.3, 0.44, 0, 0.04);
      line(0.3, 0.44, 0, 0.04);
      line(0, 0.04, 0, -0.46);
      line(-0.24, -0.06, 0.24, -0.06, R * 0.75);
      line(-0.24, -0.22, 0.24, -0.22, R * 0.75);
    } else if (kind === "gbp") {
      // £: hooked bowl into a stem, a crossbar and a flat base
      const hook = new THREE.CatmullRomCurve3(
        [
          [0.24, 0.28],
          [0.13, 0.41],
          [-0.04, 0.42],
          [-0.15, 0.3],
          [-0.15, 0.06],
          [-0.17, -0.22],
          [-0.27, -0.4],
        ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
      );
      geometries.push(new THREE.TubeGeometry(hook, 96, R, 12, false));
      geometries.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(-0.3, -0.41, 0), new THREE.Vector3(0.28, -0.41, 0)), 4, R, 12, false));
      geometries.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(-0.32, 0.0, 0), new THREE.Vector3(0.1, 0.0, 0)), 4, R * 0.75, 12, false));
    } else {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const a = THREE.MathUtils.degToRad(50 + (i / 40) * 260);
        points.push(new THREE.Vector3(0.08 + Math.cos(a) * 0.34, Math.sin(a) * 0.38, 0));
      }
      geometries.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, R, 12, false));
      for (const y of [0.08, -0.08]) {
        geometries.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(-0.4, y, 0), new THREE.Vector3(0.12, y, 0)), 4, R * 0.75, 12, false));
      }
    }
    return geometries;
  }, [kind]);
}

/** Minted coin profile: field, raised bevelled rim, both faces. */
export function useCoinGeometry() {
  return useMemo(() => {
    const profile = [
      [0, 0.036],
      [0.38, 0.036],
      [0.405, 0.052],
      [0.47, 0.054],
      [0.5, 0.042],
      [0.5, -0.042],
      [0.47, -0.054],
      [0.405, -0.052],
      [0.38, -0.036],
      [0, -0.036],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const geometry = new THREE.LatheGeometry(profile, 128);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }, []);
}

export function GlyphFaces({ symbol }: { symbol: CoinSymbol }) {
  const btc = useBitcoinGeometry();
  const eth = useEthereumGeometry();
  const strokes = useStrokeGlyph(symbol === "btc" || symbol === "eth" ? "usd" : symbol);
  const face = (z: number, flip: boolean) =>
    symbol === "eth" ? (
      <group key={z} position={[0, 0, z]} rotation={[0, flip ? Math.PI : 0, 0]} scale={0.52}>
        <mesh geometry={eth[0]}>
          <meshPhysicalMaterial color="#ffffff" metalness={0.75} roughness={0.08} clearcoat={1} emissive="#6c7a73" envMapIntensity={2} />
        </mesh>
        <mesh geometry={eth[1]}>
          <meshPhysicalMaterial color="#d3fde8" metalness={0.85} roughness={0.28} clearcoat={0.6} emissive="#47504c" envMapIntensity={1.7} />
        </mesh>
      </group>
    ) : symbol === "btc" ? (
      <mesh key={z} geometry={btc} position={[0, 0, z]} rotation={[0, flip ? Math.PI : 0, 0]} scale={0.48}>
        <meshPhysicalMaterial color="#f6d68f" metalness={0.85} roughness={0.12} clearcoat={1} emissive="#3a2a08" envMapIntensity={1.9} />
      </mesh>
    ) : (
      <group key={z} position={[0, 0, z]} rotation={[0, flip ? Math.PI : 0, 0]} scale={0.5}>
        {strokes.map((geometry, i) => (
          <mesh key={i} geometry={geometry} scale={[1, 1, 0.45]}>
            <Metal roughness={0.1} />
          </mesh>
        ))}
      </group>
    );
  return (
    <>
      {face(0.05, false)}
      {face(-0.05, true)}
    </>
  );
}

/** A precise coin: minted profile with a ₿, Ξ (Ethereum), $, €, ¥ or £ struck on both faces. */
export function SymbolCoin({ symbol, color = GOLD, ...props }: { symbol: CoinSymbol; color?: string } & React.ComponentProps<"group">) {
  const coin = useCoinGeometry();
  return (
    <group {...props}>
      <mesh geometry={coin}>
        <Metal color={color} roughness={0.22} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.074, 96]} />
        <Metal color={color} roughness={0.34} />
      </mesh>
      <GlyphFaces symbol={symbol} />
    </group>
  );
}

/** "999.9" struck into the bar's top face in segment strokes. */
export const SEGMENTS: Record<string, string> = { "9": "abcdfg" };
export const SEG: Record<string, [number, number, number, number]> = {
  a: [0, 0.1, 0.07, 0.014],
  b: [0.04, 0.05, 0.014, 0.09],
  c: [0.04, -0.05, 0.014, 0.09],
  d: [0, -0.1, 0.07, 0.014],
  f: [-0.04, 0.05, 0.014, 0.09],
  g: [0, 0, 0.07, 0.014],
};
export function Stamp() {
  const digits = ["9", "9", "9", ".", "9"];
  let x = -0.2;
  return (
    <group position={[0.05, 0.252, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.85}>
      {digits.map((digit, i) => {
        const at = x;
        x += digit === "." ? 0.06 : 0.12;
        if (digit === ".") {
          return (
            <mesh key={i} position={[at - 0.02, -0.1, 0]}>
              <boxGeometry args={[0.02, 0.02, 0.012]} />
              <Metal roughness={0.5} />
            </mesh>
          );
        }
        return (
          <group key={i} position={[at, 0, 0]}>
            {SEGMENTS[digit].split("").map((seg) => {
              const [sx, sy, w, h] = SEG[seg];
              return (
                <mesh key={seg} position={[sx, sy, 0]}>
                  <boxGeometry args={[w, h, 0.012]} />
                  <Metal roughness={0.5} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

