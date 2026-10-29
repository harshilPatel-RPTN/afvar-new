# src/app — routing shell

Routes and composition **only** — no business logic, no API calls. Every page renders a
component from `src/modules/*`.

**No routes for now.** Every page was removed; only the root `layout.tsx` and
`providers.tsx` remain (so the build serves just the 404). The code that is kept lives on as
components:

- `@/modules/workspace` — `HomeScreen` (launch card → lock screen), `LockScreen`,
  `FullscreenGate`, `LiveNebula`, `AnimatedWordmark`. A correct PIN (or the one-time unlock
  after a password sign-in) unlocks in place: the lock screen shows "Unlocked" with Lock and
  Log Out.
- `@/modules/auth` — `LoginView`, `RegisterView`, `ForgotPasswordView`,
  `ResetPasswordView`, `VerifyEmailView`, `OnboardingView`, PIN, session guards and stores.
- `@/modules/billing` — kept because auth's user/plan types depend on it.

To bring a page back, add a thin `page.tsx` that renders one of these (e.g. `/` →
`<HomeScreen />`, `/login` → `<LiveNebula /><FullscreenGate><LoginView /></FullscreenGate>`).
The pre-removal routes, the markets/desk/communities/support pages and their modules are in
git history (before this change). `ViewportGuard` is switched off in `providers.tsx` until
`/unsupported` exists again, and the e2e suites are skipped until the routes return.
