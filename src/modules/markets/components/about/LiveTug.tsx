"use client";

// The "/" bull & bear tug of war over the real breadth of the eight covered
// lanes (same feed, provenance and LIVE / SNAPSHOT chip as "/").
import { TugOfWar, useLiveMarket } from "@/modules/home/kit";

export function LiveTug() {
  const { quotes } = useLiveMarket();
  return <TugOfWar quotes={quotes} />;
}
