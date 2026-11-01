import type { ReactNode } from "react";
import { SiteFrame } from "@/modules/homeDemo";
import { PfScope } from "@/modules/platform/kit";
import "../resources.css";

/**
 * Single guide and help-topic pages inside the site's AI OS frame (the same
 * navbar, ticker, avatar, sound and footer as every redesigned page), keeping
 * their working content in the platform kit's tokens.
 */
export function ResourcesFrame({ children }: { children: ReactNode }) {
  return (
    <SiteFrame>
      <PfScope className="rs-theme overflow-x-clip pb-10 pt-[72px]">{children}</PfScope>
    </SiteFrame>
  );
}
