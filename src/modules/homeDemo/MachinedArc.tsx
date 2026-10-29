"use client";

// A precision-machined arc: a revolved chamfered band with a turned groove,
// closed end caps, brushed anisotropic titanium, engraved graduation marks on
// its front face and one green index mark at the start. Lies in the XY plane
// like a torus, starting at angle 0, so it drops into torus choreography.
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { bandProfile, graduationMatrices, machinedMetalMaterial, revolveProfile } from "./machined";
import { COLORS } from "./originConfig";

export function MachinedArc({
  radius,
  thickness,
  phiLength = Math.PI * 2,
  segments = 160,
  ticks = true,
}: {
  /** Mid radius of the band. */
  radius: number;
  /** Radial thickness; axial depth and details scale from it. */
  thickness: number;
  phiLength?: number;
  segments?: number;
  ticks?: boolean;
}) {
  const minorRef = useRef<THREE.InstancedMesh>(null);
  const majorRef = useRef<THREE.InstancedMesh>(null);

  const t = thickness;
  const depth = t * 1.5;

  const { geo, material, marks } = useMemo(() => {
    const profile = bandProfile({
      rIn: radius - t / 2,
      rOut: radius + t / 2,
      height: depth,
      chamfer: t * 0.16,
      grooveWidth: depth * 0.3,
      grooveDepth: t * 0.14,
    });
    return {
      geo: revolveProfile(profile, Math.max(24, Math.round(segments * (phiLength / (Math.PI * 2)))), phiLength, 10),
      material: machinedMetalMaterial(),
      marks: graduationMatrices({
        rMid: radius + t * 0.1,
        faceZ: depth / 2 + 0.0015,
        phiLength,
        perTurn: 72,
        majorEvery: 6,
        minorLen: t * 0.32,
        majorLen: t * 0.62,
        width: Math.max(0.0035, t * 0.05),
      }),
    };
  }, [radius, t, depth, phiLength, segments]);

  useLayoutEffect(() => {
    const write = (mesh: THREE.InstancedMesh | null, list: THREE.Matrix4[]) => {
      if (!mesh) return;
      list.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };
    write(minorRef.current, marks.minor);
    write(majorRef.current, marks.major);
  }, [marks]);

  return (
    <group>
      <mesh geometry={geo} material={material} />
      {ticks ? (
        <>
          {/* engraved graduations: dark cut marks catch no light */}
          <instancedMesh ref={minorRef} args={[undefined, undefined, marks.minor.length]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#0b0d10" metalness={0.4} roughness={0.7} />
          </instancedMesh>
          <instancedMesh ref={majorRef} args={[undefined, undefined, marks.major.length]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#8a939e" metalness={1} roughness={0.2} />
          </instancedMesh>
          {/* index mark at the arc's start */}
          <mesh position={[radius + t * 0.1, 0, depth / 2 + 0.002]} rotation={[0, 0, 0.012]}>
            <boxGeometry args={[t * 0.7, Math.max(0.006, t * 0.1), 0.004]} />
            <meshBasicMaterial color={COLORS.upBright} toneMapped={false} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}
