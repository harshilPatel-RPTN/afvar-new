import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import mr from "@/locales/mr.json";

export type Edition = "en" | "hi" | "mr";
export const EDITIONS: Edition[] = ["en", "hi", "mr"];
export const DEFAULT_EDITION: Edition = "en";

/** Every UI string key. `en.json` is the source of truth. */
export type MessageKey = keyof typeof en;

// Typing the other editions against `MessageKey` makes a missing translation a type error.
const DICTIONARIES: Record<Edition, Record<MessageKey, string>> = { en, hi, mr };

export const DEFAULT_LOCALE: Record<Edition, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

export function isEdition(value: unknown): value is Edition {
  return value === "en" || value === "hi" || value === "mr";
}

export type MessageVars = Record<string, string | number>;

export function translate(edition: Edition, key: MessageKey, vars?: MessageVars): string {
  const template = DICTIONARIES[edition][key] ?? DICTIONARIES.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function dictionary(edition: Edition) {
  return DICTIONARIES[edition];
}

