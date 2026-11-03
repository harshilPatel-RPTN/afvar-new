import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import "./globals.css";
import "@/platform/ui/brand.css";
import { SplashReveal } from "@/platform/splash";
import { AvatarChatWidget } from "@/platform/avatar/AvatarChatWidget";
import { ButtonFx } from "@/platform/ui/ButtonFx";
import { Providers } from "./providers";
import { SITE_URL } from "./site";

// Not preloaded: the public Markets pages use their own fonts, so these
// would otherwise compete with the hero image on every /market request.
// They still load on demand wherever the lock screen and auth views use them.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const edition = await getServerEdition();
  const brand = translate(edition, "brand.name");
  const description = translate(edition, "meta.description");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: brand, template: `%s · ${brand}` },
    description,
    openGraph: { type: "website", siteName: brand, title: brand, description },
    twitter: { card: "summary_large_image", title: brand, description },
  };
}

// Without JavaScript nothing runs the scroll reveals or the full-screen
// gate, so this shows their finished state: reveal layers visible and in place,
// and the gated page itself instead of the launch card.
const NO_SCRIPT_CSS = [
  // Hero copy staircase (HeroStage) and framer-motion `initial` states (inline opacity / wipes).
  "[data-afv-enter] [data-afv-copy]>*>*,[data-afv-cue]{opacity:1!important;animation:none!important}",
  '[style*="opacity:0"]{opacity:1!important;transform:none!important;visibility:visible!important}',
  '[style*="clip-path:inset"]{clip-path:none!important}',
  '[style*="transform:translate"],[style*="transform:scale"]{transform:none!important}',
  // FullscreenGate: show the page, not the launch card.
  // Its suspended part streams into a hidden <div id="S:n"> that only React's script would move into place.
  // In Tailwind's base layer: its `[hidden]{display:none!important}` lives there, and layered
  // !important beats unlayered !important.
  "[data-fullscreen-gate]{display:none!important}",
  '@layer base{[data-fullscreen-gate-page]{display:contents!important}body:has([data-fullscreen-gate-page]) div[hidden][id^="S:"]{display:block!important}}',
].join("");

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The edition cookie decides lang on the server, so the first frame is already in the chosen edition.
  const edition = await getServerEdition();
  return (
    <html
      lang={edition}
      dir="ltr"
      // Next 16 no longer resets smooth scroll-behavior on navigation; this opts back in so new pages open at the top instantly.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* First Tab stop on every page; each page's <main> carries id="main". Above the splash (z 2147483000). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2147483647] focus:rounded-full focus:bg-(--afvar-text) focus:px-5 focus:py-3 focus:text-[14px] focus:font-semibold focus:text-(--afvar-charcoal) focus:outline-2 focus:outline-offset-2 focus:outline-(--afvar-mint)"
        >
          {translate(edition, "mk.shell.skip")}
        </a>
        <noscript><style>{NO_SCRIPT_CSS}</style></noscript>
        <SplashReveal />
        <Providers edition={edition}>
          {children}
          {/* Sudhakar's avatar chatbot, floating bottom-right on every page. */}
          <AvatarChatWidget />
          <ButtonFx />
        </Providers>
      </body>
    </html>
  );
}
