"use client";

// A page's hero: its own 3D centrepiece (the only 3D on the page) with the
// hero copy, one screen tall. The OS sections follow it. WebGL mounts after
// the splash + idle; until then (and without WebGL) the CSS poster shows.
import { useRef, type ReactNode, type RefObject } from "react";
import { MONO, Poster, useFilmMode, useSceneReady, useStory } from "@/modules/afvarOs";

export interface HeroSceneArgs {
  /** Fixed progress (the hero frame): scenes read it like a film's progress. */
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  portrait: boolean;
  lite: boolean;
}

export function HeroStage({ id, label, scene, copy, posterLeft = "64%" }: { id: string; label: string; scene: (a: HeroSceneArgs) => ReactNode; copy: (compact: boolean) => ReactNode; posterLeft?: string }) {
  const { portrait, lite, reduced } = useFilmMode();
  const { trackRef, active, mounted, webgl } = useStory({ settledP: 0, minWidth: 0 });
  const sceneReady = useSceneReady();
  const zero = useRef(0);
  return (
    <section ref={trackRef} id={id} aria-label={label} className="relative h-svh min-h-[600px] overflow-hidden bg-transparent text-[#F2F5F2]">
      <div className="absolute inset-0">
        <Poster left={posterLeft} />
        {webgl !== false && mounted && sceneReady ? <div className="absolute inset-0">{scene({ progress: zero, active, still: reduced, portrait, lite })}</div> : null}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[rgba(4,4,4,0.85)] from-35% via-[rgba(4,4,4,0.55)] via-65% to-transparent lg:hidden" />
      <div className="absolute inset-x-5 bottom-8 sm:inset-x-8 lg:inset-x-auto lg:bottom-auto lg:left-16 lg:top-1/2 lg:w-[min(36rem,44vw)] lg:-translate-y-[44%]">
        <div className="lg:hidden">{copy(true)}</div>
        <div className="hidden lg:block">{copy(false)}</div>
      </div>
      <p className={`${MONO} pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 text-[10px] text-[#7E8F85] lg:block`}>Illustrative 3D · prices real where labelled</p>
    </section>
  );
}
