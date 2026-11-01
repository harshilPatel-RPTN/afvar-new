// afvarOs — the shared AFVAR OS design system for AI-first pages.
//
//   theme     colours, type and surface classes, global CSS (mint = the AI)
//   story     scroll-story engine: defineStory → useStory → StoryAct / StoryRail
//   three     <CoreCanvas> (look + motion system), <AiCore> (the home's protagonist)
//             and the material kit for every other page (spark, dust, glass, lines)
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
// Plain data, safe without three.js. Everything that renders 3D lives in ./gl.
export { AI_CORES, coreIndex, type AiCoreId } from "./three/cores";
export type { CameraKey, SceneCue } from "./three/stage";
export { setFilmOnScreen, useFilmOnScreen } from "./film/presence";
export { useAvatarWarmup, useFilmMode, useFilmPresence, useMedia, useSceneReady, type FilmMode } from "./film/hooks";
export { Poster } from "./film/Poster";
export { OsScreen, MenuBar, Dock, AppGlyph, AiOrb, dockSlotX, DOCK_ITEM, type DockItem, type AppGlyphName } from "./os/chrome";
export { OsWindow, Spotlight, Toast, Pointer, SnapGhost } from "./os/window";
export { MiniChart, type ChartLevel } from "./os/MiniChart";
export { CandleChart, type ChartCandle, type ChartLevel2 } from "./os/CandleChart";
export { OsSection, Win, Ask, Note, AvatarLine, DeskLabel, useSection, useAppear, useSectionRamp } from "./sections/OsSection";
export { Row, Chip, Pct, Steps } from "./sections/bits";

// Compatibility: the home page imports its 3D pieces from here. They are the same
// exports as ./gl; package.json "sideEffects" lets the bundler drop them from pages
// that do not use them, so three.js still loads only where a scene mounts.
export { cameraViewport, createCameraTrack, sampleCameraTrack } from "./three/framing";
export { CoreCanvas, SceneLabel, useStoryFrame, type CoreCanvasProps } from "./three/stage";
export { AiCore, CORE_SIZE, type CoreDrive } from "./three/AiCore";
export { AiSpark, GlassPlate, GlowLine, GoldDust, hdr } from "./three/kit";
export { CORE_NODE, CoreNodes, CorePulses, NearRange, orbitPlace, useCorePositions, useNearRange } from "./three/parts";
export { getAvatarRig, scheduleAvatarBuild, useAvatarRig, avatarFrame, AVATAR_HEIGHT, type AvatarFrame, type AvatarRig, type MotionName } from "./avatar/rig";
export { AvatarActor, AvatarOverlay, type AvatarTrack } from "./avatar/actors";
