import type { Metadata } from "next";
import type { ReactNode } from "react";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const edition = await getServerEdition();
  return {
    title: { default: "AFVAR Markets", template: "%s · AFVAR Markets" },
    description: translate(edition, "mk.shell.metaDescription"),
  };
}

/** Each Markets page brings its own frame (the film pages use the home's; a single brief keeps the Markets shell). */
export default function MarketLayout({ children }: { children: ReactNode }) {
  return children;
}
