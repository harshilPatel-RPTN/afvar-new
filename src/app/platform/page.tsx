import type { Metadata } from "next";
import { OVERVIEW, PlatformOverview } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Platform",
  description: `${OVERVIEW.title.join(" ")} ${OVERVIEW.summary}`,
  alternates: { canonical: "/platform" },
};

export default function PlatformPage() {
  return <PlatformOverview />;
}
