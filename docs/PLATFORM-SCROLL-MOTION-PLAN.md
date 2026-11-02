# Platform pages — scroll motion plan (desktop + mobile)

Status: **proposal, nothing implemented.** Written 2026-11-02 from a full read of
`src/modules/platform` (film/, components/, content), `src/modules/afvarOs` (sections, story,
film hooks) and `docs/AFVAR-OS-DESIGN-SPEC.md` §1 §3 §8 §9 §11.

---

## 1. What the six pages are today

All six routes are on the AI OS theme (the old `CapabilityPage` is no longer routed):

| Route | Hero | Body | Under the body |
|---|---|---|---|
| `/platform` | `PlatformHero` — 3D glass stack, still frame | `PlatformSections`: 7 `OsSection`s (02 Two ways … 08 Five areas) | Try it yourself (desktop OS / phone "Talk"), At a glance (10 cards), globe closing |
| `/platform/market-data` | `MarketHero` — 3D price wall | `MarketSections`: 7 `OsSection`s | FeatureJumpGrid · OutcomeLine · Notes & Related · Other areas · closing |
| research / alerts / risk-review / community | `CapHero` — own 3D centrepiece | 7–11 `OsSection`s each | same template |

### How motion works right now
- **Hero** (`HeroStage`): 3D mounts after splash + idle; the **copy is static** (no entrance, no scroll reaction). Phones: 3D on top, copy in a bottom gradient panel — also static.
- **`OsSection` desktop (≥1024)**: section pins for `vh` (240) of scroll; windows / asks / notes appear at their `at` with opacity + 18 px rise; `Ask` types itself; `ScrollSteps` tick with progress; AI chart drawings ramp (`drawFrom`). **Caption is static for the whole pinned section**; the OS screen itself never moves; **hard cut** between one pinned section and the next.
- **`OsSection` stack (phones, tablets, reduced motion)**: caption + the same windows as cards, every card the **same one-shot fade (0.4 s, 14 px)**. `Ask` text is already complete, `Steps` are already all ✓, notes/labels/avatar are plain. The "OS doing something as you scroll" story is lost on mobile — it reads as a list of cards.
- **Template sections** (`FeatureJumpGrid`, `OutcomeLine`, `NotesAndRelated`, `OtherAreas`, `AtAGlanceGrid`, `TrySection`): **zero motion** on every screen.
- **Charts** (`CandleChart`): candles render instantly; only AI overlays draw.

### Diagnosis
1. Phones get 6 pages of flat cards; the desktop choreography does not translate.
2. Desktop sections are good inside, but entering / leaving a section is abrupt and the caption never moves.
3. Everything under the OS sections is static everywhere.
4. No orientation on long pages (8–12 sections, no rail, no progress).

---

## 2. Principles (mobile first)

- **Scroll-linked, not pinned, on phones.** No `position: sticky` + 100 vh stages below 1024 px (address-bar resize, jank, unreadable). Motion is tied to each element's own position in the viewport (`useScroll` on the element / IntersectionObserver), so it works at every width.
- **Cause → effect.** Every section shows: a request → the OS answering → a verified result. Motion must show that order (ask types → window opens → note arrives), on phones too.
- **Transform / opacity / clip-path only.** No blur, no backdrop-filter, no box-shadow or height animation. Scroll-linked values through framer `useScroll` (uses ScrollTimeline where available → off main thread).
- **One listener, no per-frame React state.** Motion values + `useTransform`; nothing animates while off screen (`viewport once` / IO).
- **Budget:** ≤ 6 animated elements per viewport; stagger ≤ 60 ms; entrance ≤ 500 ms; nothing loops forever.
- **Reduced motion = finished state** (existing `MotionConfig reducedMotion="user"` + `useAfvarReducedMotion`).
- **Design rules kept:** sage/gold only where the kit already uses them; no new colours; no text changes (tests read it); honesty labels untouched; CLS 0 (space reserved).
- **3D untouched**: heroes keep their scenes; we move the *container* (parallax), never the scene internals.

---

## 3. The animations

### A · Hero (all six pages, all screens)
| # | Motion | Desktop | Phone |
|---|---|---|---|
| A1 | **Copy staircase** — eyebrow → headline (clip-wipe left→right, 450 ms) → sage line → body → CTAs → facts strip, 70 ms apart, once the splash has gone | left column | bottom panel, same order |
| A2 | **Hand-off on scroll** — leaving the hero: copy slides up 24 px and fades; the 3D container parallaxes (y 0 → −10 %, scale 1 → .95, opacity 1 → .55) so section 02 arrives over a receding scene | yes | yes (container transform only) |
| A3 | **Scroll cue** — a 1 px sage line + "scroll" mono label under the copy that fades on the first 40 px of scroll | yes | yes (phones most need it) |

### B · OS sections — desktop (≥1024, pinned)
| # | Motion | What it adds |
|---|---|---|
| B1 | **Caption word-light** — title words brighten over the first 15 % of the section's progress; body fades in after | the caption lives with the section instead of sitting still for 240 vh |
| B2 | **Window open** — opacity + rise + scale .96→1 (origin top-left) + a 1-frame sage edge flash; `out` closes with scale .98 | reads as macOS windows opening, not fading |
| B3 | **Pointer path** — the OS `Pointer` travels Ask → the window it opens → the note (one per section) | shows cause → effect inside the screen |
| B4 | **Section hand-off** — at p .9→1 the OS screen scales to .97 and dims .6; the next section's caption rises in over it | removes the hard cut between pinned sections |
| B5 | **Candles draw in** — `CandleChart` gains `reveal` (0→1): candles grow from the baseline left→right over `at..at+.15`; levels / averages after (real data unchanged) | charts "load" instead of popping |
| B6 | **Ask send** — the ↵ glyph flashes and the orb pulses once when typing completes | closes the loop of the typed request |
| B7 | **Steps thread** — a thin line between step ticks fills as they turn ✓ (`ScrollSteps`) | shows the pipeline as one path |
| B8 | **Dock launch bounce** — the active dock app bounces once (macOS) as its section begins | the OS reacts |

### C · OS sections — phones & tablets (stack mode) ← the big gap
| # | Motion | What it adds |
|---|---|---|
| C1 | **Section header** — mono eyebrow types (250 ms), title clip-wipes, once in view | same entrance language as the hero |
| C2 | **Card storyboard** — cards enter in order (0 / 60 / 120 ms, scale .97→1, origin top) and **reading focus**: the card nearest the viewport middle is full ink, the others sit at .82 opacity + scale .985 (scroll-linked) | replaces the pinned "one thing at a time" with a scroll-linked one |
| C3 | **Ask types on phones** — the Ask card types its text when it enters (≈600 ms); the following window card enters only after typing ends | restores cause → effect |
| C4 | **Steps tick in sequence** — 120 ms apart on enter, the thread fills (today: all ✓ at once) | the pipeline is visible on phones |
| C5 | **Candles draw in** — same `reveal` as B5, on enter | |
| C6 | **Toast arrives** — `Note` slides in from the right edge (x 24→0) like a system notification, with the site's soft tick (sound toggle respected) | |
| C7 | **Avatar speaks** — portrait fades, bubble pops (scale .9→1) 150 ms later | |
| C8 | **Sticky mini-eyebrow** — "02 · Two ways" sticks under the navbar while that section's cards scroll; number counts up as sections pass | orientation on long card stacks (the desktop rail equivalent) |

### D · Under the OS sections (all pages, all screens)
| # | Motion | Where |
|---|---|---|
| D1 | **Card stagger** — rise 10 px + fade, 40 ms apart, icon ring draws | FeatureJumpGrid, OtherAreas, AtAGlance, Related |
| D2 | **Outcome word-light** — the one big statement lights word by word as it scrolls through the middle (sage, no green/red ticks) | OutcomeLine |
| D3 | **Notes list** — items rise one by one, the `›` marks fade in last | NotesAndRelated |
| D4 | **Section rule draws** — every `border-t` section rule draws from the left (scaleX) as the section enters | all template sections (ties pages together, near-zero cost) |
| D5 | **At a glance on phones** — 10 cards as a horizontal snap rail with a progress line (today: a 10-card vertical stack) | `/platform` only; layout change — optional |
| D6 | **Try it yourself** — the playground OS screen rises + scales in; phone "Talk" card pulses its orb once | `/platform` |

### E · Page level
| # | Motion | |
|---|---|---|
| E1 | **Progress** — desktop: a right-edge section index (dots + current label ≥1440) that jumps on click; phones: a 2 px sage progress line under the navbar | orientation on 8–12 section pages |
| E2 | **Closing hand-off** — the last section's bottom fades into the globe closing (already exists, keep) | — |

---

## 4. Mobile performance checklist (every item above passes it)
- Transform / opacity / clip-path only; `will-change` only while animating.
- Scroll-linked values: framer `useScroll` + `useTransform` (ScrollTimeline where supported); one IO per section, not per card.
- No animation starts off screen; entrance animations `once`; reading focus (C2) is the only continuous scroll-link on phones and it moves 2 properties on ≤ 4 cards.
- 3D: unchanged (`lite` on coarse pointers already); hero parallax moves the wrapper div.
- Reserve all space (no layout animation) → CLS stays 0.
- Verify on 360×800, 390×844, 768×1024 (portrait + landscape), 1024, 1280, 1440×900; Lighthouse mobile perf not below current; `prefers-reduced-motion` pass; the site's own tests (`same-site-copy`, platform pages) pass — no copy changes.

---

## 5. Where it goes (kit-level first → all six pages at once)

| File | Items |
|---|---|
| `afvarOs/sections/OsSection.tsx` (+ `Win`, `Ask`, `Note`, `AvatarLine`, `ScrollSteps`) | B1 B2 B4 B6 B7 · C1–C4 C6–C8 |
| `afvarOs/os` `CandleChart` | B5 / C5 `reveal` prop |
| `afvarOs/os/chrome` Dock | B8 |
| `platform/film/hero/HeroStage.tsx` | A1 A2 A3 |
| `platform/film/capability/sections.tsx`, `components/overview/AtAGlanceGrid.tsx`, `playground/OsPlayground.tsx` | D1–D6 |
| new `afvarOs/motion/` (Stagger, WordLight, RuleDraw, useEnter) + `platform/film/PageProgress.tsx` | shared primitives · E1 |
| `afvarOs/motion/flag.ts` | one `PLATFORM_MOTION` switch to turn the whole layer off (revert in one line) |

Because `OsSection` and the template sections are shared, **one change reaches all six pages**; per-page files (`PlatformSections`, `MarketSections`, …) need no edits unless a section wants a pointer path (B3) — that is one prop per `Ask`.

## 6. Order
1. **Wave 1 — phones first, kit-level:** C1–C5, C8 · A1–A3 · D1–D4 · E1 · flag. (Every page, every screen moves.)
2. **Wave 2 — desktop depth:** B1 B2 B4 B5 B7 · C6 C7 · D6.
3. **Wave 3 — polish:** B3 pointer path, B8 dock bounce, D5 phone rail.
Review after each wave on the user's dev server at the viewports above (max 2 agents unless asked).
