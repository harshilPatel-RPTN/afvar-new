import type { IconTone } from "../../types";
import { PIcon, type PlatformIcon } from "./icons";

/** macOS app tile: continuous-corner square, soft vertical gradient, filled glyph. */
export function AppIcon({
  icon,
  tone,
  size = 56,
  className = "",
}: {
  icon: PlatformIcon;
  tone: IconTone;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`pf-app-icon pf-tone-${tone} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <PIcon name={icon} weight="fill" size={Math.round(size * 0.52)} />
    </span>
  );
}
