"use client";

// Market Data hero: the price wall (3D), with the page's hero copy.
import dynamic from "next/dynamic";
import { useFilmMode } from "@/modules/afvarOs";
import { useLiveMarket } from "@/modules/home/kit";
import { HeroStage } from "../hero/HeroStage";
import { HeroCopy } from "./MarketCopy";
import { MARKET_COMPACT, MARKET_DESKTOP, MARKET_FILM_ID } from "./marketFilm";

const MarketScene = dynamic(() => import("./MarketScene"), { ssr: false });

export function MarketHero() {
  const { wide } = useFilmMode();
  const { quotes } = useLiveMarket();
  const film = wide === false ? MARKET_COMPACT : MARKET_DESKTOP;
  return (
    <HeroStage
      id={MARKET_FILM_ID}
      label="Market Data & Charts — quotes, charts and watchlists, every price with its source"
      copy={(compact) => <HeroCopy compact={compact} />}
      scene={(a) => <MarketScene film={film} progress={a.progress} active={a.active} still={a.still} portrait={a.portrait} lite={a.lite} avatarHere={false} quotes={quotes} />}
    />
  );
}
