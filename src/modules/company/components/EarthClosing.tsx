import type { ReactNode } from "react";
import { SiteFooter } from "@/modules/markets";
import { EarthHorizon } from "@/modules/platform/kit";

/**
 * The /market closing band with page-specific copy: stars and the live 3D
 * earth rising as a horizon behind the children, then the solid site footer
 * meeting the arc. Pages using it must pass `footer={false}` to their SiteShell.
 */
export function EarthClosing({ id, label, children }: { id?: string; label: string; children: ReactNode }) {
  return (
    <>
      <EarthHorizon id={id} label={label}>
        {children}
      </EarthHorizon>
      <SiteFooter />
    </>
  );
}
