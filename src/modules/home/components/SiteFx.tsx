// The "/" + /home-demo page-level effects for any page: the motion CSS, the
// candle cursor, the "your scroll" candle meter, the sound toggle, the
// Konami easter egg, the sleeping bull & bear screensaver, coins into
// Register links and the typed BULL / BEAR egg. Mount once per
// page, inside an element carrying `data-candle-trail` (the cursor only draws
// there) — and put <ClickBurst/> as a DIRECT child of that element, since it
// listens on its parent.
import { CandleCursor } from "./CandleCursor";
import { EasterEgg } from "./EasterEgg";
import { HomeStyles } from "./HomeStyles";
import { IdleScreensaver } from "./IdleScreensaver";
import { RegisterCoins, TypedBeasts } from "./Playful";
import { ScrollCandleMeter } from "./ScrollCandleMeter";
import { SoundToggle } from "./SoundToggle";

export function SiteFx() {
  return (
    <>
      <HomeStyles />
      <CandleCursor />
      <ScrollCandleMeter />
      <SoundToggle />
      <EasterEgg />
      <IdleScreensaver />
      {/* /home-demo's own moments */}
      <RegisterCoins />
      <TypedBeasts />
    </>
  );
}
