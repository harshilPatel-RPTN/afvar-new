// afvarOs — the shared AFVAR OS design system for AI-first pages.
//
//   theme     colours, type and surface classes, global CSS (gold = the AI)
//   story     scroll-story engine: defineStory → useStory → StoryAct / StoryRail
//   three     <CoreCanvas> (look + motion system) and <AiCore> (the protagonist)
//   os        real OS UI: screen, menu bar, dock, windows with tabs, spotlight,
//             toasts, pointer, snap ghost, resizable chart
//
// Client-only module (every export is safe in "use client" components).
// See README.md for how a new page uses it.
export * from "./theme";
export { AfvarStyles } from "./AfvarStyles";
export * from "./story/timeline";
export { useStory, useAfvarReducedMotion, prefersReducedMotion, type StoryStage } from "./story/useStory";
export { StoryAct, StoryRail, ProgressBar, useStep, useTypedText, useInertWhileHidden, useBoxKeys, type BoxKeyframe } from "./story/components";
export { CoreCanvas, SceneLabel, useStoryFrame, type CameraKey, type SceneCue, type CoreCanvasProps } from "./three/stage";
export { AiCore, CORE_SIZE, type CoreDrive } from "./three/AiCore";
export { OsScreen, MenuBar, Dock, AppGlyph, AiOrb, dockSlotX, DOCK_ITEM, type DockItem, type AppGlyphName } from "./os/chrome";
export { OsWindow, Spotlight, Toast, Pointer, SnapGhost } from "./os/window";
export { MiniChart, type ChartLevel } from "./os/MiniChart";
