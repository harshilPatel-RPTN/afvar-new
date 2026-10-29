import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { StopVsCancel } from "../components/overview/StopVsCancel";
import { TrustSection } from "../components/overview/TrustSection";

beforeAll(() => {
  // framer-motion's whileInView/useInView need IntersectionObserver, which jsdom lacks.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

afterEach(cleanup);

describe("StopVsCancel", () => {
  it("stops speech without cancelling the task", () => {
    render(<StopVsCancel />);
    fireEvent.click(screen.getByRole("button", { name: "Stop speaking" }));
    expect(screen.getByText("Playback stopped. The task keeps running.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel task" })).toBeEnabled();
  });

  it("cancels pending steps but keeps completed work", () => {
    render(<StopVsCancel />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel task" }));
    expect(screen.getByText("Stopping remaining work. Opened chart stays open.")).toBeInTheDocument();
    expect(screen.getByText("Opened and verified")).toBeInTheDocument();
    expect(screen.getAllByText("Cancelled").length).toBeGreaterThanOrEqual(2);
  });
});

describe("TrustSection", () => {
  it("shows the six trust statements and labels stale data", () => {
    render(<TrustSection />);
    for (const title of [
      "Never places orders",
      "Read-only connections",
      "Verified means verified",
      "No fake live data",
      "You stay in control",
      "No silent success",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }

    expect(screen.queryByText("Data stale — conclusions paused until fresh")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Stale" }));
    expect(screen.getByRole("radio", { name: "Stale" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Data stale — conclusions paused until fresh")).toBeInTheDocument();
  });

  it("moves through freshness states with the arrow keys", () => {
    render(<TrustSection />);
    fireEvent.keyDown(screen.getByRole("radiogroup", { name: "Data freshness" }), { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "Delayed" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Delayed by the provider · delay shown")).toBeInTheDocument();
  });
});
