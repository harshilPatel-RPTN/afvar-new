import Link from "next/link";
import { SiteFooter } from "@/modules/markets";
import { EarthHorizon, PageNote, Reveal, ScrollWords } from "@/modules/platform/kit";
import { PRELAUNCH_NOTE } from "../content";
import { ResLink } from "./ui";

/**
 * The /market closing band (stars + the live, draggable earth horizon) with
 * Resources copy, then the solid site footer — the same ending as every page.
 */
export function ResourcesClosing({
  title,
  lede,
  primary,
  secondary,
}: {
  title: string;
  lede: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <>
    <EarthHorizon label="Next steps">
      <div className="mx-auto max-w-3xl text-center">
        <ScrollWords text={title} className="pf-title" />
        <Reveal delay={0.1}>
          <p className="pf-lede mx-auto mt-5 max-w-lg">{lede}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            {primary.href.startsWith("http") ? (
              <a href={primary.href} className="afvar-glass-button afvar-glass-primary rs-primary">
                {primary.label}
              </a>
            ) : (
              <Link href={primary.href} className="afvar-glass-button afvar-glass-primary rs-primary">
                {primary.label}
              </Link>
            )}
            {secondary && <ResLink href={secondary.href}>{secondary.label}</ResLink>}
          </div>
        </Reveal>
      </div>
      <div className="mt-16">
        <PageNote>{PRELAUNCH_NOTE}</PageNote>
      </div>
    </EarthHorizon>
    <SiteFooter />
    </>
  );
}
