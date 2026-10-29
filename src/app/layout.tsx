import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import "./globals.css";
import { SplashReveal } from "@/platform/splash";
import { AvatarChatWidget } from "@/platform/avatar/AvatarChatWidget";
import { Providers } from "./providers";

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
  return {
    title: { default: translate(edition, "brand.name"), template: `%s · ${translate(edition, "brand.name")}` },
    description: translate(edition, "meta.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The edition cookie decides lang on the server, so the first frame is already in the chosen edition.
  const edition = await getServerEdition();
  return (
    <html
      lang={edition}
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Covers the first paint on every full load; the page hydrates and loads behind it. */}
        <SplashReveal />
        <Providers edition={edition}>
          {children}
          {/* Sudhakar's avatar chatbot, floating bottom-right on every page. */}
          <AvatarChatWidget />
        </Providers>
      </body>
    </html>
  );
}
