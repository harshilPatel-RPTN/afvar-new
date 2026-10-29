import type { Metadata } from "next";
import { HomeDemoPage } from "@/modules/homeDemo";

// The cinematic home (built as /home-demo) is now the main homepage.
export const metadata: Metadata = {
  title: "AFVAR — Your AI Operating System for Trading",
  description:
    "One connected place to understand international markets, explore ideas and review your trading — commodities, forex and crypto in English and Hindi. Pre-launch.",
};

export default function Page() {
  return <HomeDemoPage />;
}
