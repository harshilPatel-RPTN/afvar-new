import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { translate } from "../i18n";

const SRC = path.resolve(__dirname, "../..");
const load = (edition: string) => JSON.parse(readFileSync(path.join(SRC, "locales", `${edition}.json`), "utf8")) as Record<string, string>;
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe("locales", () => {
  const en = load("en");

  for (const edition of ["hi", "mr"]) {
    it(`${edition} has every English key with the same placeholders`, () => {
      const other = load(edition);
      expect(Object.keys(other)).toEqual(Object.keys(en));
      for (const key of Object.keys(en)) expect(placeholders(other[key]), key).toEqual(placeholders(en[key]));
    });
  }

  it("never tells anyone to buy or sell, in any edition", () => {
    // Marathi: खरेदी/विक्री/विकत/विकणे/विकू — not bare विका, which also matches विकास ("growth").
    const forbidden = /\b(buy|sell|selling|buying)\b|खरीद|बेच|बिक्री|खरेदी|विक्री|विकत|विकणे|विकू/i;
    for (const edition of ["en", "hi", "mr"]) {
      for (const [key, value] of Object.entries(load(edition))) expect(forbidden.test(value), `${edition}:${key}`).toBe(false);
    }
  });

  it("interpolates variables", () => {
    expect(translate("en", "pin.wrong", { count: 3 })).toBe("Wrong PIN · 3 attempts left");
  });
});

describe("source boundaries", () => {
  const files = sourceFiles(SRC);

  it("has no premium boolean — gating goes through can()/quota()", () => {
    const offenders = files.filter((file) => /isPremium/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("has no hard-coded Buy/Sell labels in components", () => {
    const offenders = files.filter((file) => file.endsWith(".tsx") && /\b(Buy|Sell)\b/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
