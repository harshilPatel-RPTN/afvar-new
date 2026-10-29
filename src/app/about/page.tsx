import type { Metadata } from "next";
import { AboutPage } from "@/modules/company";

export const metadata: Metadata = {
  title: "About Us — AFVAR",
  description:
    "AFVAR is one connected desk for understanding international markets, built by RedPhantom Tech Novelty Private Limited. Our purpose, principles and development stage — verified facts only.",
};

export default function Page() {
  return <AboutPage />;
}
