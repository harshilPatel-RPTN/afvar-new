// PUBLIC API of the auth module.
export { AuthCard, AuthField, AuthSelect, BrandMark, FormNotice, SubmitButton, safeNext, useShake } from "./components/AuthCard";
export { LoginView } from "./components/LoginView";
export { RegisterView, StrengthMeter } from "./components/RegisterView";
export { ForgotPasswordView, ResetPasswordView, VerifyEmailView } from "./components/RecoveryViews";
export { OnboardingView } from "./components/OnboardingView";
export { AppUnlock, ChangePinForm, PinPad } from "./components/Pin";
export { RequireSession, SessionSplash, SessionSync } from "./components/SessionGuards";
export { LockShortcut } from "./components/LockShortcut";
export { useSession } from "./hooks/useSession";
export { useDemoSession } from "./hooks/useDemoSession";
export { useAuthStore, type AuthStatus, type PromptUsage } from "./store";
export { useLockStore, AUTO_LOCK_AFTER_MS, consumeFreshUnlock, isLockShortcut } from "./lock";
export { authApi } from "./api";
export { COUNTRIES, CURRENCIES, detectedTimeZone, displayName, errorKey, timeZones } from "./locale-data";
export { useHydrated } from "./hooks/useHydrated";
export { LEGAL_VERSIONS } from "./types";
export { testUser } from "./testing";
export type {
  AiUsage,
  AuthResponse,
  Device,
  MeResponse,
  OnboardingInput,
  ProfilePatch,
  RegisterInput,
  Subscription,
  User,
} from "./types";
