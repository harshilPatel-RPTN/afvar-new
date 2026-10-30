import type { Metadata } from "next";
import { HomeClassicPage } from "@/modules/homeDemo";

// Home 2 — the previous homepage (the ten-chapter film), kept alongside the AI OS home at "/".
export const metadata: Metadata = {
  title: "AFVAR — Home 2",
  description:
    "One connected place to understand international markets, explore ideas and review your trading — commodities, forex and crypto in English and Hindi. Pre-launch.",
  // Same product story as "/", so keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HomeClassicPage />;
}
