// PUBLIC API of the home module (W1 · public website home + W4 · pricing).
export { HomePage } from "./components/HomePage";
export { PricingPage } from "./components/PricingPage";
export { SiteShell } from "./components/SiteShell";
// Market-motion layer, shared with the Resources pages (W5).
export { CandleCursor } from "./components/CandleCursor";
export { ClickBurst } from "./components/ClickBurst";
export { IdleScreensaver } from "./components/IdleScreensaver";
export { useLiveMarket, type HomeQuote, type QuoteStatus } from "./components/useLiveMarket";
export { NAV, OVERVIEW } from "./content";
