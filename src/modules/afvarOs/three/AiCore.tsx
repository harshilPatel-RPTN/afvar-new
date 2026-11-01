"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, Group, PointLight, ShaderMaterial } from "three";
import { hearthFragment, hearthVertex, sunFragment, sunVertex, veilFragment, veilVertex } from "./plasma";
import { useStoryFrame } from "./stage";

export const CORE_SIZE = { radius: 0.62, shell: 0.82 } as const;

export interface CoreDrive {
  glow: number;
  scale: number;
  think: number;
  sparks?: number;
}

const DEFAULT: CoreDrive = { glow: 1, scale: 1, think: 0, sparks: 1 };
const LOOP_SECONDS = 30;

function veilUniforms(sheet: number) {
  return { uPhase: {value:0}, uSheet:{value:sheet}, uRadius:{value:CORE_SIZE.shell},
    uThink:{value:0}, uHeat:{value:1} };
}

export function AiCore({ drive, position = [0, 0, 0] }: {
  drive?: (p: number) => CoreDrive;
  position?: readonly [number, number, number];
}) {
  const { smoothed, still } = useStoryFrame();
  const group = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const veils = useRef<(ShaderMaterial | null)[]>([]);
  const hearth = useRef<ShaderMaterial>(null);
  const animationStart = useRef<number | null>(null);
  const materials = useMemo(() => [veilUniforms(0), veilUniforms(1)], []);
  const hearthUniforms = useMemo(() => ({uPhase:{value:0}, uSparks:{value:1}}), []);

  useFrame(({ clock }) => {
    const d = drive ? drive(smoothed.current ?? 0) : DEFAULT;
    // The poster is this exact phase. Loading/compiling time must not advance
    // the animation before the first real frame replaces it.
    animationStart.current ??= clock.elapsedTime;
    const phase = still ? 0 : ((clock.elapsedTime - animationStart.current) % LOOP_SECONDS) * (Math.PI*2 / LOOP_SECONDS);
    for (const veil of veils.current) {
      if (!veil) continue;
      veil.uniforms.uPhase.value = phase;
      veil.uniforms.uHeat.value = d.glow;
      veil.uniforms.uThink.value = d.think;
    }
    if (hearth.current) {
      hearth.current.uniforms.uPhase.value = phase;
      hearth.current.uniforms.uSparks.value = d.sparks ?? 1;
    }
    if (group.current) {
      group.current.visible = d.scale > .002;
      group.current.scale.setScalar(Math.max(.0001,d.scale));
    }
    if (light.current) light.current.intensity = 12*d.glow*Math.min(1,d.scale*d.scale);
  });

  return (
    <group ref={group} name="AiCore" position={[...position]}>
      {/* The sun writes depth so rear sheets pass behind it and near sheets cross its face. */}
      <mesh>
        <sphereGeometry args={[CORE_SIZE.shell * .169, 36, 24]} />
        <shaderMaterial name="AFVAR solar nucleus" vertexShader={sunVertex} fragmentShader={sunFragment} toneMapped={false} />
      </mesh>
      <mesh renderOrder={-1}>
        <planeGeometry args={[CORE_SIZE.shell*3.3, CORE_SIZE.shell*3.3]} />
        <shaderMaterial ref={hearth} name="AFVAR solar hearth" uniforms={hearthUniforms}
          vertexShader={hearthVertex} fragmentShader={hearthFragment} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {materials.map((uniforms, i) => (
        <mesh key={i}>
          <planeGeometry args={[2*CORE_SIZE.shell, 2*CORE_SIZE.shell, 168, 28]} />
          <shaderMaterial ref={node => { veils.current[i] = node; }} name={`AFVAR silk ${i+1}`}
            uniforms={uniforms} vertexShader={veilVertex} fragmentShader={veilFragment}
            side={DoubleSide} forceSinglePass transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      <pointLight ref={light} color="#FFAD85" distance={9} decay={2} />
    </group>
  );
}
