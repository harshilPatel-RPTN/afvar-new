// Client-safe subset of the home module, split from index.ts so client
// components (/home-demo) can import it without pulling in HomePage ->
// SiteShell -> HomeNav/HomeFooter. Everything /home-demo reuses from "/" —
// the theme layer, motion primitives, widgets and sound — comes through here.
export { useLiveMarket, fmtPrice, type HomeQuote, type QuoteStatus, type Candle } from "./components/useLiveMarket";
export { NAV, OVERVIEW } from "./content";
export { PRICING_FAQS, PRICING_TIERS, PRICING_USAGE, formatInr } from "./content";

// theme + shared motion CSS
export { HOME_SCOPE, HomeStyles } from "./components/HomeStyles";
export { BTN_OUTLINE, BTN_PRIMARY } from "./components/classes";
export {
  AnimatedHeading,
  ChangePill,
  EASE,
  FlashPrice,
  Icon,
  LiveChip,
  PANEL,
  Spark,
  SymbolDisc,
  VIEW_ONCE,
  drawX,
  fade,
  rise,
  useOnce,
} from "./components/bits";
export { CandleCard, CandleWords, RollNumber, ScrubText } from "./components/marketMotion";
export { CurrencyLetters, CurrencyText, FxSymbol, useCurrencyScramble } from "./components/CurrencyText";

// page widgets and set pieces
export { CandleCursor } from "./components/CandleCursor";
export { ClickBurst } from "./components/ClickBurst";
export { IdleScreensaver } from "./components/IdleScreensaver";
export { ScrollCandleMeter } from "./components/ScrollCandleMeter";
export { EasterEgg } from "./components/EasterEgg";
export { CandleSnake } from "./components/CandleSnake";
export { PercentRain } from "./components/PercentRain";
export { GoldBar } from "./components/GoldBar";
export { BitcoinCoin } from "./components/BitcoinCoin";
export { TugOfWar } from "./components/TugOfWar";
export { SessionClock } from "./components/SessionClock";
export { VideoSpotlight } from "./components/OverviewVideo";
export { MotionTitle } from "./components/MotionTitle";
export { SiteFx } from "./components/SiteFx";
export { SoundToggle } from "./components/SoundToggle";
export { BreadthStrip, RegisterCoins, TypedBeasts } from "./components/Playful";
export { BullCharge } from "./components/BullCharge";
export { BearSwipe } from "./components/BearSwipe";
export { BullBearFaceoff } from "./components/BullBearFaceoff";
export { BearArt, BeastStyles, BullArt } from "./components/beastArt";

// sound
export { haptic, isSoundEnabled, onSoundChange, playSfx, setSoundEnabled, type Sfx } from "./components/sfx";
