# modules/workspace — owner: @dev-workspace

The lock screen, kept as components while no routes exist (see `src/app/README.md`):
launch card (full-screen gate) → lock screen (app PIN, typed on the keyboard). A correct PIN,
or the one-time fresh unlock right after a password sign-in, unlocks **in place**: the lock
screen shows "Unlocked" with Lock and Log Out. `AnimatedWordmark` is the looping
letter-by-letter AFVAR; `FullscreenGate` shows the launch card until the browser is in full
screen.

- **Public API (`index.ts`):** `HomeScreen`, `LockScreen`, `FullscreenGate`, `LiveNebula`, `AnimatedWordmark`
- **History shortcuts:** `HomeScreen` calls `useBlockHistoryShortcuts(true)` (`@/platform/keyboard`), so Back/Forward (Alt/⌘ + ←/→) are off on the launch card and lock screen.
- **Removed for now:** the windowed desktop, Settings and Alerts windows and the workspace store (in git history).
