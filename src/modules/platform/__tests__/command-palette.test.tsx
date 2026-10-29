import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { isMacPlatform } from "@/platform/keyboard";
import { CommandPalette, openCommandPalette } from "../components/CommandPalette";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

beforeAll(() => {
  // jsdom has no layout, so scrollIntoView is missing.
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  cleanup();
  push.mockClear();
});

function pressShortcut() {
  const mac = isMacPlatform();
  fireEvent.keyDown(window, { key: "k", metaKey: mac, ctrlKey: !mac });
}

function renderPage() {
  return render(
    <>
      <main>
        <section aria-labelledby="h">
          <h2 id="h">Test section</h2>
        </section>
      </main>
      <CommandPalette />
    </>,
  );
}

describe("CommandPalette", () => {
  it("opens with the shortcut, filters, closes on Escape and lists page sections", async () => {
    renderPage();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    pressShortcut();
    const input = await screen.findByRole("combobox");
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "comm" } });
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByRole("option", { name: /Community/ })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: /Market Data/ })).not.toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("combobox")).not.toBeInTheDocument());

    pressShortcut();
    await screen.findByRole("combobox");
    const group = screen.getByRole("group", { name: "On this page" });
    expect(within(group).getByRole("option", { name: /Test section/ })).toBeInTheDocument();
  });

  it("shows the empty state and navigates pages with Enter", async () => {
    renderPage();
    openCommandPalette();
    const input = await screen.findByRole("combobox");

    fireEvent.change(input, { target: { value: "zzzz" } });
    expect(screen.getByText("No matches found.")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "community" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/platform/community");
  });
});
