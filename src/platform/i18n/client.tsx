"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { create } from "zustand";
import { EDITION_COOKIE, setCookie, writeStorage } from "../storage";
import {
  DEFAULT_EDITION,
  DEFAULT_LOCALE,
  translate,
  type Edition,
  type MessageKey,
  type MessageVars,
} from "./core";

const EDITION_KEY = "afwar.edition";

interface I18nState {
  /** Null until the edition is chosen on this client; until then the server's edition applies. */
  edition: Edition | null;
  locale: string | null;
  setEdition: (edition: Edition, locale?: string) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  edition: null,
  locale: null,
  setEdition: (next, locale) => {
    writeStorage(EDITION_KEY, next);
    setCookie(EDITION_COOKIE, next, 365);
    set({ edition: next, locale: locale ?? DEFAULT_LOCALE[next] });
  },
}));

const ServerEdition = createContext<Edition>(DEFAULT_EDITION);

/** Hands the edition the server rendered with to the client, so hydration matches. */
export function I18nProvider({ edition, children }: { edition: Edition; children: ReactNode }) {
  return <ServerEdition.Provider value={edition}>{children}</ServerEdition.Provider>;
}

/** Translate with the active edition. Re-renders when the edition changes. */
export function useT() {
  const serverEdition = useContext(ServerEdition);
  const chosen = useI18nStore((state) => state.edition);
  const chosenLocale = useI18nStore((state) => state.locale);
  const edition = chosen ?? serverEdition;
  const locale = chosenLocale ?? DEFAULT_LOCALE[edition];
  const t = useCallback(
    (key: MessageKey, vars?: MessageVars) => translate(edition, key, vars),
    [edition],
  );
  return { t, edition, locale };
}

/** Keeps <html lang> in step with the edition chosen on the client. */
export function EditionSync() {
  const { edition } = useT();
  useEffect(() => {
    document.documentElement.lang = edition;
  }, [edition]);
  return null;
}
