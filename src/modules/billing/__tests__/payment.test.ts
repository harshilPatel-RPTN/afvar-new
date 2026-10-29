import { describe, expect, it } from "vitest";
import { STRIPE_TEST_CARDS, luhnValid, validateCard } from "../payment";

const card = (number: string, expiry = "12 / 34", cvc = "123") => ({ number, expiry, cvc, name: "Test", country: "IN" });
const now = new Date("2026-10-22T00:00:00Z");

describe("card validation", () => {
  it("accepts every Stripe test card", () => {
    for (const number of Object.values(STRIPE_TEST_CARDS)) expect(luhnValid(number)).toBe(true);
  });

  it("rejects a bad number, past expiry and short CVC", () => {
    expect(validateCard(card("4242 4242 4242 4241"), now)).toBe("invalid_number");
    expect(validateCard(card(STRIPE_TEST_CARDS.success, "13 / 30"), now)).toBe("invalid_expiry");
    expect(validateCard(card(STRIPE_TEST_CARDS.success, "09 / 26"), now)).toBe("expired_card");
    expect(validateCard(card(STRIPE_TEST_CARDS.success, "12 / 34", "1"), now)).toBe("incorrect_cvc");
    expect(validateCard(card(STRIPE_TEST_CARDS.success), now)).toBeNull();
  });
});
