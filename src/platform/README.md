# platform/ — shared kernel

Code every module depends on. **Changes here require the team lead's review**
(enforced via `.github/CODEOWNERS`).

| Folder | Contents |
|---|---|
| `api/` | Typed fetch wrapper, WebSocket client, generated FastAPI types |
| `ui/` | Design system: Glass, Badge, Pill, Button, WindowChrome |
| `layout-engine/` | Dashboard grid, drag/resize/pop-out logic |
| `hooks/` | Generic React hooks (media query, fullscreen, …) |

Rules:

- Nothing in `platform/` may import from `src/modules/` — dependencies flow one way.
- Keep it generic: anything domain-specific (market, trading, …) belongs in a module.

## Keyboard shortcuts (`platform/keyboard`)

Global shortcuts, mounted once in `app/providers.tsx` via `GlobalKeyboardShortcuts`:

| Action | Windows / Linux | macOS |
|---|---|---|
| Back (previous page in history) | Alt + ← | ⌘ + ← |
| Forward (next page in history) | Alt + → | ⌘ + → |
| Lock AFVAR (`auth` module's `LockShortcut`) | Ctrl + Shift + L | ⌘ + ⇧ + L |
| Show the shortcuts panel | ? | ? |

- Back/Forward call `router.back()` / `router.forward()` — real browser history, never a fixed route — and `preventDefault()` so the browser doesn't move a second page.
- The OS is detected with `navigator.userAgentData.platform`, falling back to `navigator.platform`; only that OS's combination is handled, the other keeps its native meaning.
- Ignored while typing (inputs, textareas, selects, content-editable), so text editing keeps its keys (e.g. ⌘+← to line start). Key repeats and already-handled events are ignored; a module-level owner token prevents duplicate listeners.
- **Blocked on the lock screen:** `useBlockHistoryShortcuts(true)` switches Back/Forward off while it's mounted (called by the workspace `HomeScreen` for the launch card and lock screen on `/`). The keys are still swallowed (`preventDefault()`), so neither the app nor the browser's own Alt/⌘+arrow can step past the PIN. They work on the unlocked desktop and every other page. Limitation: a web page can't block the browser's toolbar Back button — but returning to `/` always shows the lock screen again.
- The help panel (`KeyboardShortcutsPanel`) opens with `?` or from the desktop's account menu, and hides the Back/Forward rows while they're blocked. Add new shortcuts to `SHORTCUTS` in `shortcuts.ts` so they're documented there.
- **Locked history** (`useBlockHistoryShortcuts(true)`): besides Back/Forward, every browser history key (Alt/⌘ + ←/→, ⌘ + [ / ], BrowserBack/Forward keys) is swallowed — even inside the focused PIN field — and any forward history entry is dropped on entry (Navigation API `canGoForward` → one `pushState`), so the toolbar Forward button goes nowhere. Browsers without the Navigation API keep their forward entry.
