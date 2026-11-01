# scripts/qa — the AFVAR page testing protocol

The three test layers every AFVAR page passes before it ships (see
docs/AFVAR-OS-DESIGN-SPEC.md §10). They drive a production build
(`npm run build && npx next start -p 3100`) with the Chrome Playwright channel
and software WebGL, so they run on any machine.

| Script | Layer | What it checks |
|---|---|---|
| `layer2-film.mjs` | 2 · browser | Any scroll film page (`URL`, `SEC` = the film section id). Seven viewports (`VP`): the right act is visible at every probe, nothing under the navbar / cut / off-screen / under floating UI, no horizontal overflow, same state scrolling back, rail navigation, launcher hand-off, no console errors. |
| `layer2-home.mjs` | 2 · browser | The home film (`/`), including the Talk to AFVAR button and the OS act. |
| `shots.mjs` | alignment | `node shots.mjs <tag> <w> <h> "act:f,act:f" [waitMs] [mobile]` — one screenshot per act fraction, after the page itself reports the act. Use it for the alignment matrix (1920×1080, 1280×720, 1024×768, 768×1024, 390×844, 844×390). |
| `grid.py` | alignment | `python3 grid.py <tag> <out.png> [cols] [width]` — contact sheet of a tag's screenshots. |
| `layer3.mjs` | 3 · performance | Scripted forward / back / forward scroll: frame pacing, long tasks, heap growth, canvas count. `NOGL=1` isolates the DOM cost. |

Examples:

```bash
URL=http://localhost:3100/platform SEC=afvar-platform node scripts/qa/layer2-film.mjs
URL=http://localhost:3100/platform SEC=afvar-platform node scripts/qa/shots.mjs d1280 1280 720 "hero:0,ways:.85,verify:.5" 5000
```

Software WebGL is slow: the avatar (292k triangles) can stall a frame for
seconds, so the sandbox may report "page never reported this act" or blank
frames around it. Confirm those on real hardware (the desktop app's browser)
before treating them as bugs. Real-hardware frame pacing is measured there.
