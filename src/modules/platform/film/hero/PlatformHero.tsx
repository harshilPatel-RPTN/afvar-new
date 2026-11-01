"use client";

// /platform hero: the platform stack (3D), with the overview's hero copy.
import dynamic from "next/dynamic";
import { useFilmMode } from "@/modules/afvarOs";
import { useLiveMarket } from "@/modules/home/kit";
import { HeroCopy } from "../OverviewCopy";
import { OVERVIEW_COMPACT, OVERVIEW_DESKTOP } from "../overviewFilm";
import { HeroStage } from "./HeroStage";

const PlatformScene = dynamic(() => import("../PlatformScene"), { ssr: false });

export function PlatformHero() {
  const { wide } = useFilmMode();
  const { quotes } = useLiveMarket();
  const film = wide === false ? OVERVIEW_COMPACT : OVERVIEW_DESKTOP;
  return (
    <HeroStage
      id="afvar-platform"
      label="AFVAR Platform — one AI operating system, one connected workspace"
      copy={(compact) => <HeroCopy compact={compact} />}
      scene={(a) => <PlatformScene film={film} progress={a.progress} active={a.active} still={a.still} portrait={a.portrait} lite={a.lite} avatarHere={false} quotes={quotes} />}
    />
  );
}
