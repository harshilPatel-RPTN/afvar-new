import { describe, expect, it } from "vitest";
import { resolve } from "../components/os/commands";

describe("demo command resolver", () => {
  it("opens a chart with instrument and timeframe", () => {
    expect(resolve("Open my Gold chart 1D")).toMatchObject({ status: "resolved", action: "open", app: "charts", instrument: "Gold", timeframe: "1D" });
  });

  it("understands Hindi phrases", () => {
    expect(resolve("sona ka chart kholo")).toMatchObject({ status: "resolved", app: "charts", instrument: "Gold" });
    expect(resolve("जर्नल खोलो")).toMatchObject({ status: "resolved", app: "trade-review" });
  });

  it("asks which dollar is meant instead of guessing (D.1.4.2.2)", () => {
    const intent = resolve("open the dollar chart");
    expect(intent.status).toBe("clarify");
    expect(intent.options?.map((o) => o.label)).toEqual(["Dollar Index", "A currency pair (EUR/USD)"]);
    expect(resolve(intent.options![0].command)).toMatchObject({ status: "resolved", instrument: "Dollar Index" });
  });

  it("never acts on a negated request", () => {
    expect(resolve("don't open gold")).toEqual({ status: "negated" });
  });

  it("refuses order placement", () => {
    expect(resolve("buy gold now")).toEqual({ status: "refused" });
    expect(resolve("trade gold")).toEqual({ status: "refused" });
    expect(resolve("place a trade on EUR/USD")).toEqual({ status: "refused" });
  });

  it("opens the trade journal (the noun 'trade' is not an order)", () => {
    expect(resolve("Open the trade journal")).toMatchObject({ status: "resolved", action: "open", app: "trade-review" });
  });

  it("reports unknown requests as unsupported", () => {
    expect(resolve("play some music")).toEqual({ status: "unsupported" });
    expect(resolve("   ")).toEqual({ status: "empty" });
  });

  it("handles window commands", () => {
    expect(resolve("close the chart")).toMatchObject({ action: "close", app: "charts" });
    expect(resolve("minimize news")).toMatchObject({ action: "minimize", app: "research" });
    expect(resolve("arrange my windows")).toMatchObject({ status: "resolved", action: "arrange" });
  });
});
