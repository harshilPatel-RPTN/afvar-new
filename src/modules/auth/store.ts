import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Plan } from "@/modules/billing";
import { configureApiAuth } from "@/platform/api/client";
import { useI18nStore } from "@/platform/i18n";
import { ONBOARDED_COOKIE, SESSION_COOKIE, safeLocalStorage, setCookie } from "@/platform/storage";
import { authApi } from "./api";
import { markFreshUnlock, useLockStore } from "./lock";
import type { AuthResponse, MeResponse, OnboardingInput, ProfilePatch, RegisterInput, User } from "./types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface PromptUsage {
  promptsUsedToday: number;
  limit: number | null;
  resetsAt: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  usage: PromptUsage;

  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  register: (input: RegisterInput) => Promise<AuthResponse & { dev_verify_url?: string }>;
  logout: () => Promise<void>;
  /** Re-read `/me`; signs out locally if the session is gone. */
  refresh: () => Promise<MeResponse | null>;
  completeOnboarding: (input: OnboardingInput) => Promise<User>;
  updateProfile: (patch: ProfilePatch) => Promise<User>;
  setPin: (pin: string, currentPin?: string) => Promise<User>;
  replaceUser: (user: User) => void;
  /** Dev only — the floating Free ⇄ Pro switch. */
  setPlan: (plan: Plan) => Promise<void>;
  /** Count one analyst prompt locally after the server accepted it. */
  consumePrompt: () => void;
  setUsage: (usage: PromptUsage) => void;
  /** Forget the session without calling the API (expired or revoked). */
  clearSession: () => void;
}

const EMPTY_USAGE: PromptUsage = { promptsUsedToday: 0, limit: null, resetsAt: null };

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const startSession = (response: AuthResponse) => {
        set({ token: response.access_token, user: response.user, status: "authenticated", usage: EMPTY_USAGE });
        // The password was just entered, so this tab starts unlocked.
        useLockStore.getState().unlock(response.user.id);
        markFreshUnlock();
        void get().refresh();
        return response;
      };

      return {
        user: null,
        token: null,
        status: "loading",
        usage: EMPTY_USAGE,

        login: async (email, password) => startSession(await authApi.login(email, password)),
        loginWithGoogle: async () => startSession(await authApi.loginWithGoogle()),
        register: async (input) => {
          const response = await authApi.register(input);
          startSession(response);
          return response;
        },
        logout: async () => {
          try {
            await authApi.logout();
          } catch {
            // Signing out locally matters more than telling the server.
          }
          get().clearSession();
        },
        clearSession: () => {
          useLockStore.getState().lock();
          set({ user: null, token: null, status: "unauthenticated", usage: EMPTY_USAGE });
        },
        refresh: async () => {
          if (!get().token) {
            set({ status: "unauthenticated" });
            return null;
          }
          try {
            const me = await authApi.me();
            set({
              user: me.user,
              status: "authenticated",
              usage: {
                promptsUsedToday: me.usage.ai_prompts.used,
                limit: me.usage.ai_prompts.limit,
                resetsAt: me.usage.ai_prompts.resets_at,
              },
            });
            return me;
          } catch (error) {
            if ((error as { status?: number }).status === 401) get().clearSession();
            return null;
          }
        },
        completeOnboarding: async (input) => {
          const { user } = await authApi.completeOnboarding(input);
          set({ user });
          return user;
        },
        updateProfile: async (patch) => {
          const { user } = await authApi.updateProfile(patch);
          set({ user });
          return user;
        },
        setPin: async (pin, currentPin) => {
          const { user } = await authApi.setPin(pin, currentPin);
          set({ user });
          return user;
        },
        replaceUser: (user) => set({ user }),
        setPlan: async (plan) => {
          const { user } = await authApi.devSetPlan(plan);
          set({ user });
          await get().refresh();
        },
        consumePrompt: () =>
          set((state) => ({ usage: { ...state.usage, promptsUsedToday: state.usage.promptsUsedToday + 1 } })),
        setUsage: (usage) => set({ usage }),
      };
    },
    {
      name: "afwar.auth.v1",
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: ({ user, token, usage }) => ({ user, token, usage }),
      // Rehydrated from SessionSync after mount, so server and first client render agree.
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        useAuthStore.setState({ status: state.token && state.user ? "authenticated" : "unauthenticated" });
      },
    },
  ),
);

configureApiAuth(() => useAuthStore.getState().token);

// Mirror the session into the routing-hint cookies and into the active edition.
// `afwar_session` is a JS-readable "signed in" flag ("1"), never an identity:
// the only server-verifiable session is the httpOnly, HMAC-signed `afwar_sid`
// cookie set by /api/auth/login and /api/auth/register (server/session-token.ts).
useAuthStore.subscribe((state, previous) => {
  if (state.status === "loading") return;
  if (state.user?.id !== previous.user?.id || state.status !== previous.status) {
    setCookie(SESSION_COOKIE, state.user ? "1" : null);
  }
  if (state.user?.onboardingCompletedAt !== previous.user?.onboardingCompletedAt || state.user?.id !== previous.user?.id) {
    setCookie(ONBOARDED_COOKIE, state.user ? (state.user.onboardingCompletedAt ? "1" : "0") : null);
  }
  const edition = state.user?.edition;
  if (edition && (edition !== previous.user?.edition || state.user?.locale !== previous.user?.locale)) {
    useI18nStore.getState().setEdition(edition, state.user?.locale);
  }
});
