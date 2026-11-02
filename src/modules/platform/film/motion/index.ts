// Page-level motion primitives for the Platform pages (docs/PLATFORM-SCROLL-MOTION-PLAN.md D1–D4, E1).
// All of them render their finished state when PLATFORM_MOTION is false or motion is reduced.
export { PageProgress } from "./PageProgress";
export { RevealItem, RevealList, RevealMark, RevealRing, RuleDraw } from "./Reveal";
export { WordLight } from "./WordLight";
export { useMotionOn, useReveal, useSplashGone, type RevealState, type RevealStatus } from "./state";
