import type { Metadata } from "next";
import { FontPreview, OVERVIEW, PlatformOverview } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Platform",
  description: `${OVERVIEW.title.join(" ")} ${OVERVIEW.summary}`,
  alternates: { canonical: "/platform" },
};

export default function PlatformPage() {
  return (
    <>
      <PlatformOverview />
      {/* TEMPORARY: font review for the team; remove once a font is chosen. */}
      <FontPreview />
    </>
  );
}
