// Client-safe pieces of the home that other AFVAR pages reuse, so every page
// shares the same live ticker, sound, launch reminder and AI vocabulary.
// (The module index also exports server components such as SiteFrame.)
export { DemoHeader as SiteTicker } from "./DemoHeader";
export { LaunchReminder } from "./LaunchReminder";
export { HomeSoundToggle } from "./HomeSoundToggle";
export { playCue, type Cue } from "./audio";
export { MachinedArc } from "./MachinedArc";
export { LANE_KEYS, LiveClock, VoiceBars, openLiveAvatar, quoteLine, sessionsNow, useNowMinute, type Quotes } from "./ai/cards";
export { REGISTER_HREF } from "./ui";
