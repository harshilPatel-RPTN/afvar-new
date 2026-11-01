import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { VerifyFlow } from "../components/overview/VerifyFlow";

const LABELS = [
  "Request",
  "Backend",
  "Resolve request",
  "Policy gate",
  "Action runner",
  "Verify",
];

beforeAll(() => {
  // framer-motion's whileInView needs IntersectionObserver; AnimatedBeam needs ResizeObserver. jsdom has neither.
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
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(cleanup);

describe("VerifyFlow", () => {
  it("renders the heading and all six D.1.3 steps", () => {
    render(<VerifyFlow />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "From request to verified result.",
      }),
    ).toBeInTheDocument();
    // Desktop story and mobile list both render in jsdom (no media queries).
    for (const label of LABELS) {
      expect(
        screen.getAllByText(label, { exact: true }).length,
      ).toBeGreaterThan(0);
    }
    expect(
      screen.getAllByText("Verified result, clarification or error").length,
    ).toBeGreaterThan(0);
  });
});
