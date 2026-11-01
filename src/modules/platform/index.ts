// Public API of the platform module (W2 · Platform pages).
export { PlatformOverview } from "./components/PlatformOverview";
export { CapabilityPage } from "./components/CapabilityPage";
export { MarketDataPage } from "./film/market/MarketDataPage";
export { AlertsPage, CommunityPage, ResearchPage, RiskPage } from "./film/capability/CapPages";
export { AboutFilmPage, BriefsFilmPage, EvidenceFilmPage, FaqsFilmPage, GuidesFilmPage, HelpFilmPage, InstrumentFilmPage, MarketGroupFilmPage, MarketsFilmPage, PricingFilmPage, ResourcesFilmPage, StartFilmPage } from "./film/pages/SitePages";
export { CAPABILITIES, CAPABILITY_SLUGS, OVERVIEW, getCapability, getCapabilityBySegment, isCapabilitySlug } from "./content";
export { ROUTES, REGISTER_URL, pathOf, capabilityPath } from "./routes";
export type { Capability, CapabilitySlug, Availability } from "./types";

// Shared macOS kit lives in ./kit so client pages can import it directly.
export * from "./kit";
