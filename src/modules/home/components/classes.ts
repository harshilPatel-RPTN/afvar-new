// Shared button class strings. Kept out of "use client" bits.tsx so server
// components (SiteFrame, HomeDemoPage, HomePage) get the strings themselves,
// not client-reference stubs.
export const BTN_PRIMARY =
  "afvar-glass-button afvar-glass-primary inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[14.5px] font-semibold";

export const BTN_OUTLINE =
  "afvar-glass-button inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[14.5px] font-medium";
