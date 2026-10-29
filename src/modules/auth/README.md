# modules/auth — owner: @dev-auth

Sign-in, registration, recovery, onboarding, the session store and the app PIN lock.

- **Backend:** `/v1/auth/*` and `/v1/me` (mocked in `src/mocks/api` during the static phase)
- **Public API (`index.ts`):** the auth views, `RequireSession`, `SessionSync`, `AppUnlock`, `LockShortcut`, `useAuthStore`, `useLockStore`, `consumeFreshUnlock`, the `User` types
- **Session:** persisted under `afwar.auth.v1`; mirrored into the `afwar_session` / `afwar_onboarded` cookies for the proxy.
- **App lock:** the OS on `/` is locked on every arrival — reload, new tab, leaving full screen, "Lock AFVAR", the shortcut, 5 minutes hidden (`lock.ts`). The PIN is typed on the keyboard. The one exception: a password sign-in sets a one-time in-memory "fresh unlock" (`markFreshUnlock` / `consumeFreshUnlock`) so the PIN isn't asked twice. Five wrong PINs end the session → `/login?reason=pin_locked` ("Too many wrong PINs…").
- **Redirects:** login, register, Google sign-in, verify-email "Continue" and five wrong PINs go to `/` (or `/login`), not `/markets`; `safeNext` defaults to `/`. Only a correct PIN on the lock screen goes to `/markets` (`AFTER_UNLOCK` in `@/modules/workspace`).
- **Lock shortcut:** Ctrl+Shift+L (⌘+Shift+L on macOS) while signed in (`LockShortcut`, mounted in the app providers): on `/` it locks in place; on any other page it goes to `/` and locks. A correct PIN then goes to `/markets`. Back/Forward shortcuts are blocked while the lock screen shows (`useBlockHistoryShortcuts` in `@/platform/keyboard`, called by the workspace `HomeScreen`).
