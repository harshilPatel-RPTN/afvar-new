"use client";

// The /platform film's WebGL stage. The home's core is not here: this page
// shows the system the AI runs — the platform stack (markets → AI → workspace →
// you). Core names appear only in the acts after the hero. Every transform is
// a pure function of (damped progress, clock), so scrolling back replays.
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, type RefObject } from "react";
import type * as THREE from "three";
import { easeInOut, easeOut, ramp, window4 } from "@/modules/afvarOs";
import { AvatarActor, CoreCanvas, GoldDust, NearRange, useStoryFrame, type AvatarFrame } from "@/modules/afvarOs/gl";
import { playCue, type Quotes } from "@/modules/homeDemo/kit";
import { STOP, stopRows, type OverviewAct, type OverviewFilm } from "./overviewFilm";
import { PlatformStack } from "./stack/PlatformStack";

export interface PlatformSceneProps {
  film: OverviewFilm;
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  portrait: boolean;
  lite: boolean;
  /** Compact cut: the avatar speaks in the 3D scene during the stop act. */
  avatarHere: boolean;
  quotes: Quotes;
}

const Ctx = createContext<{ film: OverviewFilm; portrait: boolean; lite: boolean } | null>(null);
function useFilm() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFilm outside PlatformScene");
  return c;
}

export default function PlatformScene({ film, progress, active, still, portrait, lite, avatarHere, quotes }: PlatformSceneProps) {
  const ctx = useMemo(() => ({ film, portrait, lite }), [film, portrait, lite]);
  const near = (id: OverviewAct, m = 0.03) => ({ lo: film.story.range[id][0] - m, hi: film.story.range[id][1] + m });
  // layer names: in the hero, then again when the five areas return
  const labelShow = useMemo(() => (p: number) => window4(p, [-1, -0.5, film.at("hero", 0.62), film.at("hero", 0.95)]), [film]);
  return (
    <CoreCanvas
      progress={progress}
      active={active}
      still={still}
      settledP={film.settledP}
      camera={portrait ? film.cameraPortrait : film.camera}
      fov={portrait ? 50 : 38}
      parallax={portrait ? 0.04 : 0.12}
      bloom={lite ? 0.55 : 0.75}
      dpr={lite ? [1, 1.4] : [1, 1.75]}
      cues={film.sound}
      onCue={playCue}
    >
      <Ctx.Provider value={ctx}>
        <StackStage>
          <PlatformStack quotes={quotes} compact={film.kind === "compact"} lite={lite} labelShow={labelShow} />
        </StackStage>
        <GoldDust count={lite ? 160 : 240} box={[10, 6.5, 6]} center={[0, 0, -0.6]} drift={[0.01, 0.04, 0]} opacity={0.42} />
        {avatarHere ? (
          <NearRange {...near("stop", 0.04)}>
            <SceneAvatar />
          </NearRange>
        ) : null}
      </Ctx.Provider>
    </CoreCanvas>
  );
}

/** Phones: the stack steps back while the avatar speaks in the stop act. */
function StackStage({ children }: { children: React.ReactNode }) {
  const { film } = useFilm();
  const { smoothed } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const p = smoothed.current ?? 0;
    const away =
      film.kind === "compact" ? easeInOut(ramp(p, film.at("stop", 0.02), film.at("stop", 0.1))) * (1 - easeOut(ramp(p, film.at("stop", 0.92), film.at("stop", 1)))) : 0;
    const k = 1 - 0.999 * away;
    group.current.scale.setScalar(k);
    group.current.visible = k > 0.01;
  });
  return (
    <group ref={group} name="StackStage">
      {children}
    </group>
  );
}

/* ------------------------------------------- the avatar (compact stop act) */

function SceneAvatar() {
  const { film, lite } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const track = useMemo(() => {
    const S = (f: number) => film.at("stop", f);
    return (p: number, _t: number, out: AvatarFrame): AvatarFrame => {
      out.visible = p >= S(0.02) && p < S(0.97);
      if (!out.visible) return out;
      const grow = easeOut(ramp(p, S(0.02), S(0.07)));
      out.x = 0;
      out.y = -1.05;
      out.z = 0;
      out.scale = 0.44 * Math.max(0.001, grow * (1 - ramp(p, S(0.92), S(0.97))));
      out.explode = 1 - easeInOut(ramp(p, S(0.03), S(0.1)));
      out.turn = 0;
      out.lean = 0;
      out.talk = 0;
      const f = film.story.local(p, "stop");
      const { speaking } = stopRows(f);
      if (p < S(0.1)) {
        out.gesture = "idle";
        out.emotion = "curious";
        out.aura = "connecting";
      } else if (speaking) {
        out.gesture = f < STOP.reset[0] ? "talk" : "explain";
        out.emotion = "happy";
        out.aura = "speaking";
        out.talk = 1;
      } else if (f < STOP.reset[0]) {
        // speech stopped: it keeps working quietly
        out.gesture = "listen";
        out.emotion = "focused";
        out.aura = "idle";
      } else {
        out.gesture = "acknowledge";
        out.emotion = "neutral";
        out.aura = "idle";
      }
      return out;
    };
  }, [film]);
  return <AvatarActor track={track} getP={() => smoothed.current ?? 0} still={still} quality={lite ? "performance" : "balanced"} />;
}
