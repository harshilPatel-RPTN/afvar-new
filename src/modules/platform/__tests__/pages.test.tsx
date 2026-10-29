import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CapabilityPage, PlatformOverview, REGISTER_URL, capabilityPath, getCapability } from "../index";

// The ⌘K palette uses the App Router.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// The closing block renders the markets SiteFooter, an async server component
// (it reads the edition cookie) that a client test renderer cannot render.
// These tests cover the platform pages, not the footer.
vi.mock("@/modules/markets", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/markets")>()),
  SiteFooter: () => null,
}));

beforeAll(() => {
  // framer-motion's whileInView needs IntersectionObserver, which jsdom lacks.
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
  // jsdom has no layout, so scrollIntoView is missing.
  Element.prototype.scrollIntoView = () => {};
});

afterEach(cleanup);

describe("PlatformOverview", () => {
  it("renders the WF03 heading and sends every Register Now to the app Welcome", () => {
    render(<PlatformOverview />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("One AI Operating System.");
    const register = screen.getAllByRole("link", { name: "Register Now" });
    expect(register.length).toBeGreaterThan(0);
    for (const link of register) expect(link).toHaveAttribute("href", REGISTER_URL);
  });

  it("links each capability card to its page", () => {
    render(<PlatformOverview />);
    const section = screen.getByRole("heading", { name: "Explore the platform" }).closest("section")!;
    // URLs come from the route registry (e.g. charts → /platform/market-data).
    for (const slug of ["charts", "research", "alerts", "trade-review", "community"] as const) {
      const links = within(section).getAllByRole("link").filter((a) => a.getAttribute("href") === capabilityPath(slug));
      expect(links.length).toBeGreaterThan(0);
    }
  });

  it("moves through the overview topics with the arrow keys", async () => {
    render(<PlatformOverview />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(10);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tabs[0], { key: "ArrowDown" });
    expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(screen.getAllByRole("tab")[1]);

    fireEvent.keyDown(screen.getAllByRole("tab")[1], { key: "End" });
    expect(screen.getAllByRole("tab")[9]).toHaveAttribute("aria-selected", "true");
    // The pane cross-fades (AnimatePresence mode="wait"), so the new topic lands after the exit.
    await waitFor(() => expect(screen.getByRole("tabpanel")).toHaveTextContent("Available Preview / In Development"));
  });
});

describe("CapabilityPage", () => {
  it("renders every Community section, the breadcrumb and the verification note", () => {
    const community = getCapability("community")!;
    render(<CapabilityPage capability={community} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Community");
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByRole("link", { name: /Platform/ })).toHaveAttribute("href", "/platform");

    for (const f of community.features) expect(screen.getByRole("heading", { name: f.title })).toBeInTheDocument();
    expect(screen.getByText(/Identity verification and verified trading records are different things/)).toBeInTheDocument();
  });

  it("offers the other four capabilities as the family", () => {
    render(<CapabilityPage capability={getCapability("charts")!} />);
    const family = screen.getByRole("heading", { name: "Capability family" }).closest("section")!;
    const cardTitles = within(family).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(cardTitles).toEqual(["Research & Analysis", "Alerts & Strategy Tools", "Risk & Trade Review", "Community"]);
  });
});

describe("Capability preview interactions", () => {
  it("shows the feature picked in the preview sidebar", () => {
    const charts = getCapability("charts")!;
    render(<CapabilityPage capability={charts} />);
    const preview = screen.getByRole("region", { name: /Interactive sample preview of Market Data & Charts/ });
    const features = within(preview).getByRole("group", { name: "Market Data & Charts features" });

    fireEvent.click(within(features).getByRole("button", { name: "Watchlists" }));
    expect(within(features).getByRole("button", { name: "Watchlists" })).toHaveAttribute("aria-pressed", "true");
    expect(within(features).getByRole("button", { name: "Quotes & Charts" })).toHaveAttribute("aria-pressed", "false");
  });

  it("opens a feature from the grid in the preview and marks it as showing", () => {
    render(<CapabilityPage capability={getCapability("research")!} />);
    const grid = screen.getByRole("heading", { name: "Explore this capability." }).closest("section")!;
    const buttons = within(grid).getAllByRole("button", { name: /See it in the preview|Showing in preview/ });

    fireEvent.click(buttons[2]);
    const features = screen.getByRole("group", { name: "Research & Analysis features" });
    expect(within(features).getByRole("button", { name: "Market Briefs" })).toHaveAttribute("aria-pressed", "true");
    expect(within(grid).getByRole("button", { name: /Showing in preview/ })).toHaveAttribute("aria-current", "true");
  });

  it("lets the sample alert switch be toggled", () => {
    render(<CapabilityPage capability={getCapability("alerts")!} />);
    const toggle = screen.getByRole("switch", { name: "Sample alert switch" });
    const before = toggle.getAttribute("aria-checked");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).not.toBe(before);
  });
});
