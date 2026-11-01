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
    <section ref={trackRef} id={id} aria-label={label} className="relative h-svh min-h-[600px] overflow-hidden bg-[#050607] text-[#F5F7F7]">
      <div className="absolute inset-0">
        <Poster left={posterLeft} />
        {webgl !== false && mounted && sceneReady ? <div className="absolute inset-0">{scene({ progress: zero, active, still: reduced, portrait, lite })}</div> : null}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[50%] bg-gradient-to-r from-[#050607] from-25% via-[rgba(5,6,7,0.7)] via-60% to-transparent lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#050607] from-45% via-[rgba(5,6,7,0.8)] via-70% to-transparent lg:hidden" />
      <div className="absolute inset-x-5 bottom-8 sm:inset-x-8 lg:inset-x-auto lg:bottom-auto lg:left-16 lg:top-1/2 lg:w-[min(36rem,44vw)] lg:-translate-y-[44%]">
        <div className="lg:hidden">{copy(true)}</div>
        <div className="hidden lg:block">{copy(false)}</div>
      </div>
      <p className={`${MONO} pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 text-[10px] text-[#5E6669] lg:block`}>Illustrative 3D · prices real where labelled</p>
    </section>
  );
}
