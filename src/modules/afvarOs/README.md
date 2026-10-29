# afvarOs — AFVAR OS design system

The shared look, motion and OS UI for every AI-first AFVAR page. The home page
(`homeDemo/ai`) is the reference implementation; new pages (Platform, Markets,
AI, Pricing…) should be built from the same pieces so the site feels like one
operating system.

```ts
import { defineStory, useStory, StoryAct, StoryRail, CoreCanvas, AiCore, OsScreen, OsWindow } from "@/modules/afvarOs";
```

## Theme (`theme.ts`)

- **Gold is the AI.** Anything the AI does, says or owns is gold (`COLORS.gold`, `EYEBROW`, `GOLD_CTA`, `CARD_AI`, `<AiOrb/>`).
- **Green / red only mean up / down** (or allowed / refused).
- Near-black surfaces (`COLORS.bg`, `CARD`), hairlines (`HAIR`), no glass.
- Headline pattern: `<h2 className={H2}>Statement. <span className={SOFT}>Explanation.</span></h2>`.
- Render `<AfvarStyles />` once per page.
- Honesty: label illustrations ("Illustrative · not market data"), mark samples `SAMPLE`, show source + freshness for every number.

## Scroll stories (`story/`)

1. Describe the acts once — every scene, overlay, sound and rail reads these numbers:
   ```ts
   export const STORY = defineStory([
     { id: "intro", vh: 120, label: "Intro" },
     { id: "detail", vh: 300, label: "Detail" },
   ]);
   ```
2. In the page: `const s = useStory({ settledP: 0.02 })`, a section with `ref={s.trackRef}` and
   `height: STORY.totalVh + "vh"` when `s.cinematic`, containing a `sticky top-0 h-svh` stage.
3. Overlays: `<StoryAct mv={s.progress} at={STORY.copy.intro}>…</StoryAct>`; sub-windows with `STORY.win("detail", [0.1, 0.2, 0.6, 0.7])`.
4. `<StoryRail mv story trackRef />` for chapter navigation.
5. Discrete states from progress: `useStep(mv, thresholds)`; typing: `useTypedText`; keyframed boxes: `useBoxKeys(mv, keys)`.
6. Non-cinematic (mobile, reduced motion): render the same content stacked; pass a fixed `useMotionValue(x)` to timeline components to show a chosen state.

## 3D (`three/`)

`<CoreCanvas progress={s.progressRef} active={s.active} still={…} settledP camera={KEYS} cues onCue>` sets
background, light, environment, bloom, the damped progress (read with `useStoryFrame()`), the spline camera and
sound cues. `<AiCore drive={(p) => ({ glow, scale, think })} />` is the AI. `<SceneLabel position show>` pins DOM text to 3D.

## OS UI (`os/`)

`<OsScreen>` is a 1200×660 design canvas scaled to fit (crisp DOM text). Inside: `<MenuBar>`, `<Dock>`,
`<OsWindow title glyph tabs activeTab focused dimmed aiOwned style>`, `<Spotlight typedRef>`, `<Toast tone>`,
`<Pointer>`, `<SnapGhost>`, `<MiniChart closes levels>`. Positions are motion styles, so they can be driven by a
scroll timeline today and by real interaction later.
