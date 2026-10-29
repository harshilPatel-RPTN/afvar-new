import type { PlatformIcon as IconName } from "./components/mac/icons";

/** Board label on every feature that is not confirmed live (W2.1.10, WA-T06). */
export type Availability = "preview" | "in-development";

/** One of the five capability pages, W2.2–W2.6. */
export type CapabilitySlug = "charts" | "research" | "alerts" | "trade-review" | "community";

/** Palette used for an app-icon tile; values map to classes in platform.css. */
export type IconTone = "gold" | "cyan" | "purple" | "red" | "green" | "slate";

export interface Feature {
  title: string;
  description: string;
  icon: IconName;
  availability: Availability;
}

/** A destination on another page, resolved through the route registry. */
export interface RouteLink {
  route: RouteKey;
  title: string;
  description: string;
  icon: IconName;
}

export interface Capability {
  slug: CapabilitySlug;
  /** Board reference, e.g. "W2.2". */
  ref: string;
  title: string;
  /** Short line used on cards and in the Dock tooltip. */
  tagline: string;
  /** Hero sentence under the page heading. */
  summary: string;
  icon: IconName;
  tone: IconTone;
  features: Feature[];
  outcome: { title: string; description: string };
  preview: { title: string; description: string };
  related: RouteLink[];
  /** Board-specific note shown under the feature grid, if any. */
  note?: string;
}

export type RouteKey =
  | "platform"
  | "charts"
  | "research"
  | "alerts"
  | "trade-review"
  | "community"
  | "markets"
  | "instrument"
  | "briefs"
  | "pricing"
  | "getting-started"
  | "guides"
  | "evidence"
  | "help";
