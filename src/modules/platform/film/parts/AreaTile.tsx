"use client";

// One capability area as a gold-rimmed app tile — the door to its page. The
// same tile stands on the /platform workspace layer and opens each area page.
import { Html, RoundedBox } from "@react-three/drei";
import type { Ref, RefObject } from "react";
import type * as THREE from "three";
import { AppGlyph, COLORS, useStoryFrame, type AppGlyphName } from "@/modules/afvarOs";

export const TILE = { size: 0.56, depth: 0.1 } as const;

export function AreaTile({
  glyph,
  size = TILE.size,
  lit = 0.03,
  icon = 26,
  iconRef,
  matRef,
}: {
  glyph: AppGlyphName;
  size?: number;
  /** Emissive gold of the tile face (0.03 calm, 0.3 in focus). */
  lit?: number;
  /** Glyph size in CSS px. */
  icon?: number;
  iconRef?: Ref<HTMLDivElement>;
  matRef?: Ref<THREE.MeshStandardMaterial>;
}) {
  const { labels } = useStoryFrame();
  const depth = TILE.depth * (size / TILE.size);
  return (
    <group>
      <RoundedBox args={[size, size, depth]} radius={Math.min(0.1, size * 0.18)} smoothness={4}>
        <meshStandardMaterial ref={matRef} color="#0F1214" metalness={0.55} roughness={0.38} emissive={COLORS.gold} emissiveIntensity={lit} />
      </RoundedBox>
      {/* gold rim, like the OS dock's AI tile */}
      <RoundedBox args={[size * 1.1, size * 1.1, depth * 0.5]} radius={Math.min(0.12, size * 0.21)} smoothness={4} position={[0, 0, -depth * 0.3]}>
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.35} toneMapped={false} />
      </RoundedBox>
      <Html center position={[0, 0, depth / 2 + 0.01]} portal={labels as RefObject<HTMLElement>} zIndexRange={[19, 0]} style={{ pointerEvents: "none" }}>
        <div ref={iconRef} className="text-[#E9B44C] [@media(max-height:520px)]:scale-75">
          <AppGlyph name={glyph} size={icon} />
        </div>
      </Html>
    </group>
  );
}
