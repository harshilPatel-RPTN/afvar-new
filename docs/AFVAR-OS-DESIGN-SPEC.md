# AFVAR OS — design, animation & component spec

Source of truth for every AFVAR page. Code lives in `src/modules/afvarOs` (shared kit) and
`src/modules/homeDemo/ai` (the home film, reference implementation). Numbers below are the
values in code; change the code, then this file.

## 1. Rules
- **Gold is the AI** (#E9B44C, hot #FFD98A, deep #7A4E10). Green #00E676 / red #FF4D4D only mean market up/down or allowed/refused.
- Near-black surfaces (#050607 bg, #0F1214 card, #15191B raised), hairlines rgba(255,255,255,.10). No glassmorphism.
- Manrope for words, Geist Mono for labels/numbers/timestamps.
- Headline pattern: `Statement. <soft>Explanation.</soft>` (soft = #A3AAAC).
- Honesty: label illustrations ("Illustrative · not market data"), mark samples SAMPLE, show source + freshness for real numbers, never "buy/sell", the AI never places trades.
- **No sentence appears twice on a page** (enforced by a unit test on the home page).
- The avatar keeps its own identity (white shell, green LED face, cyan hologram) — it is the AI's body.

## 2. Type & surface classes (`afvarOs/theme.ts`)
| Token | Value |
|---|---|
| EYEBROW | mono 11px, tracking .18em, uppercase, gold |
| H1 | clamp(2.6rem, 4.6vw, 4.4rem), 600, leading 1.02, tracking -.035em |
| H2 | clamp(2rem, 3.4vw, 3.25rem), 600, leading 1.06, tracking -.03em |
| H2 compact (phones) | clamp(1.55rem, 6.4vw, 2.2rem) |
| H3 | clamp(1.4rem, 2vw, 1.9rem) |
| BODY | 16px (17px xl), leading relaxed, #A3AAAC |
| CARD / CARD_AI | rounded-2xl, border white/10 (AI: gold/35), bg #0F1214 |
| GOLD_CTA | gold pill, text #1A1206, hover fill #FFD98A from bottom (.35s) |
| GHOST_LINK | #A3AAAC, underline draws left→right (.3s) |

## 3. Scroll-story engine (`afvarOs/story`)
- `defineStory([{id, vh, label}])` → acts tile 0..1 by scroll length.
- Default copy window per act (fractions of the act): in .05→.20, out .80→.96. First act starts visible; last stays.
- One sticky stage (`h-svh`) per film; one master progress feeds WebGL (ref) and DOM (motion value).
- `StoryAct` fades + rises 28px (18px compact) over its window; hidden overlays are `inert`.
- `StoryRail`: right-edge chapter index, smooth jump; buttons carry `aria-label`.
- Discrete states: `useStep(mv, thresholds)`; typing: `useTypedText`; keyframed boxes: `useBoxKeys`.

## 4. 3D stage (`afvarOs/three`)
| Property | Desktop | Compact (phones/tablets) |
|---|---|---|
| FOV | 38° | 50° (portrait) |
| Pointer parallax | .12 | .04 |
| Bloom | mipmap, threshold .85, intensity .75 | .55 |
| Device pixel ratio | [1, 1.75] adaptive | [1, 1.4] adaptive |
| Fog | #050607, 10 → 28 | same |
| Progress damping | λ = 4.2 + 12·gap, dt capped .1 s | same |
| Camera | Catmull-Rom (centripetal) through keys, eased per segment | separate portrait key set |

AI core: radius .62, glass shell .82 (transmission .9, ior 1.4), heartbeat 1.15 Hz (+120% while thinking),
two counter-rotating geodesic nets, white-hot nucleus, 260 gold sparks r 1.05–2.15. When hidden it
leaves the scene (no extra transmission pass).

## 5. Home film (`homeDemo/ai/aiConfig.ts`)
| Act | Desktop vh | Compact vh | What moves |
|---|---|---|---|
| hero | 110 | 110 | core breathes; H1 + CTA in first screen |
| cores | 200 | 200 | core opens into 7 cores (orbit r 2.15, tilt .38, 0.12 rad/s) |
| stream | 320 | 300 | cores settle into a column (x 1.9, gap 1.0) by .20; only then labels + 5 source streams appear (sources x 4.6) |
| think | 300 | 280 | cores speak in turn at .16/.26/.36/.46/.56/.66; verified answer at .78 |
| always | 220 | 200 | cores on the 24 h ring (r 2.25) + session arcs; desktop sessions card sits under the copy, never over the ring |
| avatar | 380 | 440 | robot assembles .08–.32, waves .32, listens .46, thinks .58, answers .66–.94 |
| os | 1250 | — | desktop only (section 7) |
| trust | 260 | 240 | policy gate (x 2.4, r 1.05, tilt .55); trade refused at .30–.45 |
| finale | 160 | 160 | cores fold in; avatar returns waving |

Seven cores: Market, Macro, News, Risk, Memory, Voice, Verify.
Sources → cores: price feed→Market, calendar→Macro, newswire→News, account→Risk, journal→Memory.
Sound cues (opt-in switch): latch, tick, verdict, whoosh, ping, alert, logo on visual beats.

## 6. Avatar (`afvarOs/avatar`, vendored from AFVAR_Avatar_Final @ 4e0d45e)
- One rig per page (292k tris). Build: ≈0.1 s on Apple M5, ≈0.5 s mid phone, built in idle time 2 s after the 3D stage starts; guaranteed build when the film reaches the act before the avatar. Shaders precompile in idle time.
- The same Object3D moves between `<AvatarActor>` (3D film) and `<AvatarOverlay>` (over DOM UI). Mount one at a time.
- Frame: gesture (idle, wave, talk, look, dance, listen, think, explain, pointLeft, pointRight, acknowledge, unsure, serious, celebrate), emotion (happy, neutral, curious, surprised, sad, thinking, focused, concerned, confident, empathetic), talk 0..1 (syllable-like mouth), explode 0..1 (assembly reach 4.2), x/y/scale, turn, lean. Gesture changes crossfade over .35 s.
- Film placement: feet y -1.2, scale .44 (≈2.1 units tall). Finale: x 1.45 (portrait 1.05), scale .42.
- OS: docked corner feet (1105, 606) h 150 + control pill (mic · speaker · Text toggle · ⋮⋮ Drag to move);
  steps forward to (500, 830) h 600 at boot [.112–.198] and at the end [.884–.944], with typed speech bubble;
  runs to Risk Guardian (x 655) at .765–.79 (lean .28, turn −1.25, hop 7 px), back at .85–.875.
- Live conversation: dispatch `afvar:avatar` `{open:true}`; `{launcher:"hide"|"show"}` moves the floating launcher aside.

## 7. OS kit (`afvarOs/os`) and the OS film
- Design canvas 1200×660 scaled to fit (crisp DOM). Menu bar 30 px. Dock items 44 px, gap 10.
- Windows: chrome 30 px, tabs 28 px, resize grip, focus = gold dot, focus mode = dim .62, AI-owned = gold ring.
- Beats (os fractions): boot .04–.10 · apps .10–.205 · windows .205–.36 (drag-resize, snap ghost, ⌃⌥→ hint, tabs)
  · AI command .36–.56 (spotlight types, 5-step plan, panel lists actions) · memory .56–.76 (layout saved, space 2, restore)
  · focus .76–.985 (Risk Guardian, Focus mode, widgets, phone handoff).
- London layout boxes: chart [12,40,560,330], research [584,40,296,540], calendar [12,380,276,200], risk [296,380,276,200], AI panel [892,40,296,382].

## 8. Responsive behaviour
- ≥1024 px: desktop cut (with OS). <1024 px: compact cut — same continuous film, no OS.
- Portrait (compact): 3D on top, caption panel at the bottom (gradient scrim, pb 3.6 rem for the sound button).
- Landscape phones: caption column on the left below the header, scaled .66 when height ≤520 px.
- Short desktops: think-act body hides ≤860 px tall, card tightens ≤780/760 px.
- While the film is on screen: launch reminder waits; sound switch becomes an icon (desktop bottom-right, phones top-right).
- Narrower landscape screens: the copy column is rem-sized, so `CameraRig` compensates the 3D for width
  (k = (1680 − w) / 656 when w ≥ 1.2 h): zoom 1 − 0.28 k^1.5 and a right shift of 4.5 % w (via `setViewOffset`).
  1920 → none · 1280 → 0.87× / 56 px · 1024 (4:3) → 0.72× / 46 px · phone landscape same as 1024.
  New pages get this for free from `<CoreCanvas>`; keep left-column copy ≤ 42 vw.
- Scene labels shrink on short screens (≤520 px tall: 8.5 px, tighter padding).
- Core labels leave as the think card arrives on portrait and on the phone cut (the card names every core).
- Story rail: the active chapter name shows only ≥1440 px wide (ticks + hover below that), so it never sits on the 3D.
- Portrait 24 h ring camera pulled back (z 18.3) so every city label fits a 360–390 px phone.
- Reduced motion: stacked sections, static frames.

## 9. Performance rules
- 3D stage mounts after first paint + intro splash + idle; avatar never builds during page load.
- Scene parts mount only near their acts (stream chips, 24 h ring, gate, core labels).
- Main canvas pauses while the OS covers the stage; at most 2 WebGL canvases.
- Html labels portal into a fixed host div.
- Measured (Apple M5, Vercel preview): desktop & compact films 120 fps, 0 janky frames, 0 long tasks; LCP 0.93 s; CLS .02.
- Avatar: idle build 2 s after the stage starts, guaranteed build when the film reaches the act before it
  (measured: built at ~9 s into a continuous scroll, 99 ms, well before the avatar act).
- Runtime caching: the avatar rig is a module singleton, so it survives client-side navigation between pages;
  Next static chunks are immutable-cached, so return visits don't re-download the film.

## 10. Testing protocol (run before every merge)
1. **Static**: `tsc`, `eslint`, `vitest` (film invariants, OS keyframes, no repeated copy).
2. **Browser, 7 viewports** (1440×900, 1280×720, 1024×768, 820×1180, 390×844, 360×640, 844×390): right act visible, nothing under the navbar / cut / overlapping / under floating UI, no horizontal overflow, same state scrolling back, rail jump, Talk button, launcher hand-off, no console errors.
3. **Alignment matrix**: screenshots per act at 1920×1080, 1280×720, 1024×768, 768×1024, 390×844, 844×390
   (`align/run.sh`, waits for the rail to settle). Software-GL sandboxes can capture blank frames in the avatar
   act (292k tris); confirm those on real hardware before treating them as bugs.
4. **Performance**: scripted forward/back/forward scroll — frame pacing per act, long tasks, heap growth, canvas count; WebGL-off run isolates DOM cost; Lighthouse mobile + desktop; real-hardware run in the desktop app's browser.

## 11. Pages built on the kit
Every AI OS page shares, in code (not by copying):
- **Frame**: `SiteFrame` (homeDemo) — navbar, live ticker, launch reminder, page, closing (earth horizon), footer, sound switch.
- **Film plumbing** (`afvarOs/film`): `useFilmMode` (desktop / compact / stacked / boot), `useSceneReady`,
  `useAvatarWarmup`, `useFilmPresence` (sound switch + reminder step aside, launcher hides), `Poster`.
- **3D vocabulary** (`afvarOs/three/parts`): `AI_CORES`, `CoreNodes`, `CorePulses`, `orbitPlace`, `NearRange` — the
  home film's exact seven cores and pulses. (The home film still uses its own copies; migrate it with a pixel check.)
- **OS kit** (`afvarOs/os`) and the avatar (`AvatarActor` in 3D, `AvatarOverlay` over an OS screen).
- **Layouts**: 3D acts → caption column on the left (`LEFT`); OS acts → caption on top + OS screen below
  (`inset-x-[4vw] top-[218px]`); phones → bottom caption panel, no OS screens.
- **Copy rule**: same look, never the same text — `src/__tests__/same-site-copy.test.tsx` fails if a home sentence
  appears on another page; each page also has its own "no sentence twice" test.

### /platform (W2.1) — "The OS, opened up"
| Act | Desktop vh | Compact vh | What it shows |
|---|---|---|---|
| hero | 110 | 110 | the core with the five capability apps (dark tiles, gold rim) on a drifting ring (r 2.45) |
| ways | 240 | 200 | OS: Gold chart opened by hand (move, resize, snap, minimise) and by asking; same verified result |
| stop | 230 | 240 | OS + avatar in its corner: "Stop speaking" keeps the task running; "Cancel task" ends the rest, keeps what is done |
| verify | 300 | 280 | a pulse walks six stations on a ring around the core (Request → Backend → Resolve → Policy gate → Action runner → Verify), returns along the left |
| workspace | 280 | 200 | OS: layout saved / Space 2 / restored, notes pinned to the chart, read-only connections, menus switch to हिन्दी |
| trust | 200 | 180 | promises list + one chart cycling Live / Delayed / Stale / Sample labels |
| areas | 300 | 280 | the five apps return; the focused one grows, its lead cores burn (charts: Market + Verify; research: News + Macro + Verify; alerts: Market + Memory; risk review: Risk + Memory; community: Voice + Verify + Memory) |
After the film: **Try it yourself** (interactive OS, desktop; phones get Talk to AFVAR), **At a glance** (ten topics), closing.
