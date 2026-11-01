import type { ReactNode } from "react";
import "@/platform/ui/tokens.css";
import "../../platform.css";

/** The platform kit's colour tokens, for older working components (forms, guide steps) shown inside the new frame. */
export function PfScope({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`ds-theme pf-theme ${className}`}>{children}</div>;
}
