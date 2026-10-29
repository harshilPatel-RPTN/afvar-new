// Inline 20×20 stroke icons (lucide-react is not installed; no new dependency).
// One icon set for the whole app — modules add names here, not their own sets.
import Image from "next/image";

const PATHS = {
  search: "M9 15a6 6 0 1 1 0-12 6 6 0 0 1 0 12zM13.5 13.5 17 17",
  bell: "M5 14V9a5 5 0 0 1 10 0v5l1.5 2h-13zM8.5 18h3",
  bellOff: "M5 14V9a5 5 0 0 1 .7-2.6M8 4.3A5 5 0 0 1 15 9v5l1.5 2H6M8.5 18h3M3 3l14 14",
  globe: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM3 10h14M10 3c2 2 3 4.5 3 7s-1 5-3 7c-2-2-3-4.5-3-7s1-5 3-7z",
  user: "M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3.5 17.5c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5",
  users: "M7.5 9.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c.6-2.7 2.8-4 5.5-4s4.9 1.3 5.5 4M13 3.7a3 3 0 0 1 0 5.6M15 13.3c1.6.5 2.7 1.8 3 3.7",
  menu: "M3.5 6h13M3.5 10h13M3.5 14h13",
  close: "M5 5l10 10M15 5 5 15",
  chevronDown: "M6 8l4 4 4-4",
  chevronRight: "M8 6l4 4-4 4",
  chevronLeft: "M12 6l-4 4 4 4",
  arrowUp: "M10 15V5M6 9l4-4 4 4",
  arrowDown: "M10 5v10M6 11l4 4 4-4",
  arrowLeft: "M15 10H5M9 6l-4 4 4 4",
  minus: "M5 10h10",
  chart: "M3 15l4-5 3 3 4-6 3 4",
  candles: "M6 3v14M4.5 6h3v7h-3zM14 3v14M12.5 8h3v5h-3z",
  line: "M3 14l4-4 3 2 7-7",
  news: "M4 4h10v12H5a1 1 0 0 1-1-1zM14 7h2v8a1 1 0 0 1-2 0M7 7h4M7 10h4M7 13h2",
  calendar: "M4 5h12v11H4zM4 8h12M7 3v4M13 3v4",
  star: "M10 3l2.1 4.3 4.7.7-3.4 3.3.8 4.7L10 13.8 5.8 16l.8-4.7L3.2 8l4.7-.7z",
  sparkle: "M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z",
  shield: "M10 3l6 2.5v4.5c0 3.6-2.6 6.3-6 7-3.4-.7-6-3.4-6-7V5.5z",
  info: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 9v4.5M10 6.5v.5",
  warning: "M10 3.5 17.5 16.5h-15zM10 8.5v3.5M10 14v.4",
  offline: "M3 3l14 14M6.5 9.5a5 5 0 0 1 3.5-1.5M3.5 7A9 9 0 0 1 8 5.2M12 5.2A9 9 0 0 1 16.5 7M8.5 12.5a2 2 0 0 1 3 0M10 15.5v.01",
  clock: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 6v4l2.5 2",
  book: "M4 4.5A1.5 1.5 0 0 1 5.5 3H16v12H5.5A1.5 1.5 0 0 0 4 16.5zM4 16.5A1.5 1.5 0 0 0 5.5 18H16",
  layers: "M10 3l7 4-7 4-7-4zM3 11l7 4 7-4",
  refresh: "M16 10a6 6 0 1 1-1.8-4.3M16 4v3h-3",
  external: "M11 4h5v5M16 4l-7 7M14 12v4H4V6h4",
  check: "M4.5 10.5l3.5 3.5 7.5-8",
  plus: "M10 4v12M4 10h12",
  pulse: "M2.5 10h3l2-5 3 10 2-5h5",
  target: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM10 10v.01",
  lock: "M6 9V7a4 4 0 0 1 8 0v2M5 9h10v8H5z",
  desktop: "M3 4h14v9H3zM7.5 16.5h5M10 13v3.5",
  message: "M4 4h12v9H8l-4 3.5z",
  reply: "M8 5 3.5 9.5 8 14M3.5 9.5H12a4.5 4.5 0 0 1 4.5 4.5v1.5",
  bookmark: "M5.5 3.5h9v13l-4.5-3.2-4.5 3.2z",
  flag: "M4.5 17V3.5M4.5 4h9.5l-2 3.5 2 3.5H4.5",
  link: "M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-1 1M11.5 8.5a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l1-1",
  more: "M5 10h.01M10 10h.01M15 10h.01",
  thumbUp: "M6.5 9v7.5h-3V9zM6.5 9l3-5.5a1.8 1.8 0 0 1 2.5 2L11.2 8H16a1.5 1.5 0 0 1 1.5 1.8l-1.2 5.5a1.5 1.5 0 0 1-1.5 1.2H6.5",
  lightbulb: "M7.5 14h5M8 17h4M10 3a4.5 4.5 0 0 0-2.5 8.2V14h5v-2.8A4.5 4.5 0 0 0 10 3z",
  pin: "M7 3h6l-1 5 3 3H5l3-3zM10 11v6",
  edit: "M4 16l.6-3.4 8.2-8.2a1.6 1.6 0 0 1 2.3 2.3l-8.2 8.2zM11.5 5.5l3 3",
  trash: "M4.5 6h11M8 6V4h4v2M6 6l.8 10.5h6.4L14 6",
  filter: "M3.5 5h13M6 10h8M8.5 15h3",
  logout: "M8 4H4.5v12H8M12 6.5 15.5 10 12 13.5M15.5 10H8",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-4 w-4", label }: { name: IconName; className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`shrink-0 ${className}`} aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Brand mark: the gold AFVAR "A" emblem, cropped from the brand logo. */
export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden="true">
      <Image src="/afvar/afvar-mark.png" alt="" fill sizes="96px" className="object-contain" />
    </span>
  );
}
