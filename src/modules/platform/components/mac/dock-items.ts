import { capabilityPath } from "../../routes";
import type { Capability } from "../../types";
import type { DockItem } from "./Dock";

/** Plain helper (not client-only) so Server Components can build Dock items. */
export const dockItems = (caps: Capability[]): DockItem[] =>
  caps.map((c) => ({ href: capabilityPath(c.slug), label: c.title, icon: c.icon, tone: c.tone }));
