/**
 * Browser storage that never throws: private windows, blocked site data and
 * server rendering all fall back to "nothing stored".
 */
type Area = "local" | "session";

function area(kind: Area): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorage(key: string, kind: Area = "local"): string | null {
  try {
    return area(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null, kind: Area = "local") {
  try {
    const store = area(kind);
    if (!store) return;
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    // Storage full or blocked — the app keeps working without persistence.
  }
}

/** Storage adapter for zustand's `persist` middleware. */
export const safeLocalStorage = {
  getItem: (key: string) => readStorage(key),
  setItem: (key: string, value: string) => writeStorage(key, value),
  removeItem: (key: string) => writeStorage(key, null),
};

/**
 * Cookies the proxy reads to make optimistic redirect decisions.
 * They carry no secrets: the backend re-checks every request.
 */
export const SESSION_COOKIE = "afwar_session";
export const ONBOARDED_COOKIE = "afwar_onboarded";
export const EDITION_COOKIE = "afwar_edition";
// A first-party display preference shared by the server layout and the browser.
export const INTRO_SEEN = "afvar_intro_seen";

export function setCookie(name: string, value: string | null, maxAgeDays = 30) {
  if (typeof document === "undefined") return;
  document.cookie =
    value === null
      ? `${name}=; Path=/; Max-Age=0; SameSite=Lax`
      : `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeDays * 86_400}; SameSite=Lax`;
}
