// Client-safe macOS kit, split from index.ts so client components (W4 pricing)
// can import it without pulling in PlatformOverview -> ClosingCta -> the
// server-only SiteFooter (next/headers).
export { REGISTER_URL } from "./routes";
export { PlatformShell } from "./components/PlatformShell";
export { MacWindow, TrafficLights } from "./components/mac/MacWindow";
export { Dock } from "./components/mac/Dock";
export type { DockItem } from "./components/mac/Dock";
export { AppIcon } from "./components/mac/AppIcon";
export { PIcon } from "./components/mac/icons";
export type { PlatformIcon } from "./components/mac/icons";
export { Backdrop } from "./components/mac/Backdrop";
export { Reveal } from "./components/mac/Reveal";
export { ScrollWords } from "./components/mac/motion-kit";
export { SectionHeading, RegisterLink, ChevronLink, PageNote } from "./components/shared";
export type { IconTone } from "./types";
export { PageScene3D } from "./components/three/PageScene3D";
export type { PageModelKind } from "./components/three/PageModels3D";
export { EarthBlock } from "./components/closing/EarthBlock";
export { EarthHorizon } from "./components/closing/EarthHorizon";
export { horizonStars } from "./components/closing/horizonStars";
export { AnimatedBackdrop } from "./components/mac/AnimatedBackdrop";
export type { BackdropEffect, BackdropTint } from "./components/mac/AnimatedBackdrop";
