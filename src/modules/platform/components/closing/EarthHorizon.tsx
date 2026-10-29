import type { ReactNode } from "react";
import { EarthBlock } from "./EarthBlock";

/**
 * The /market closing band — the single source for every page's ending: stars
 * and the live 3D earth (sun / moon toggle, drag to spin, the candle convoy)
 * rising as a huge horizon whose arc runs down to the section's bottom edge,
 * where the solid site footer starts. Render <SiteFooter /> directly after it.
 * The tall bottom padding is what sets how high the earth rises — keep it
 * identical everywhere so every page closes on the same horizon.
 */
export function EarthHorizon({
  id,
  label,
  labelledBy,
  className = "",
  children,
}: {
  id?: string;
  label?: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      aria-labelledby={labelledBy}
      className={`relative isolate scroll-mt-24 overflow-hidden px-4 pt-24 pb-[min(80vw,640px)] sm:px-6 sm:pb-[min(56vw,730px)] ${className}`}
    >
      <EarthBlock />
      {children}
    </section>
  );
}
