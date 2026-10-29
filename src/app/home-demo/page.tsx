import type { Metadata } from "next";
import { HomePage } from "@/modules/home";

// The previous homepage, kept at /home-demo for reference.
export const metadata: Metadata = {
  title: "AFVAR — Previous Home",
  description: "Previous AFVAR homepage, kept for reference.",
  // Duplicate of the homepage content — keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HomePage />;
}
