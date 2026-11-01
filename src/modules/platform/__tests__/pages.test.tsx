import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CapabilityPage, PlatformOverview, REGISTER_URL, capabilityPath, getCapability } from "../index";

// The ⌘K palette and the site navbar use the App Router.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/platform" }));

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
  it("renders the overview heading and sends every Register Now to the app Welcome", () => {
    render(<PlatformOverview />);
    expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent("One AI Operating System.");
    const register = screen.getAllByRole("link", { name: "Register Now" });
    expect(register.length).toBeGreaterThan(1);
    for (const link of register) expect(link).toHaveAttribute("href", REGISTER_URL);
  });

  it("links each of the five areas to its capability page", () => {
    render(<PlatformOverview />);
    const list = screen.getAllByRole("list", { name: "Capability pages" })[0];
    for (const slug of ["charts", "research", "alerts", "trade-review", "community"] as const) {
      const links = within(list).getAllByRole("link").filter((a) => a.getAttribute("href") === capabilityPath(slug));
      expect(links.length).toBe(1);
    }
  });

  it("shows all ten overview topics at a glance", () => {
    render(<PlatformOverview />);
    const section = screen.getByRole("heading", { name: /Ten things to know/ }).closest("section")!;
    expect(within(section).getAllByRole("heading", { level: 3 })).toHaveLength(10);
    expect(within(section).getByText("Available Preview / In Development")).toBeInTheDocument();
  });

  it("runs a typed command in the hands-on OS and refuses orders", () => {
    render(<PlatformOverview />);
    const input = screen.getByPlaceholderText("Ask AFVAR or type a command");
    fireEvent.change(input, { target: { value: "open the trade journal" } });
    fireEvent.keyDown(input, { key: "Enter" });
    // The OS screen is laid out by ResizeObserver (none in jsdom), so it counts as hidden here.
    // (Matched by attribute: jsdom's selector engine reads "&" as CSS nesting.)
    const windows = Array.from(document.querySelectorAll("[role=group]")).map((g) => g.getAttribute("aria-label"));
    expect(windows).toContain("Risk & journal window");
    expect(screen.getByText("Opened Risk & journal")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "buy gold" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getAllByText("AFVAR never places, modifies or closes orders.").length).toBeGreaterThan(0);
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
