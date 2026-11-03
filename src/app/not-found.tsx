import type { Metadata } from "next";
import Link from "next/link";
import { BTN_OUTLINE, BTN_PRIMARY } from "@/modules/home/kit";
import { SiteFrame } from "@/modules/homeDemo";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <SiteFrame>
      <main id="main" className="mx-auto flex min-h-[70svh] w-full max-w-[720px] flex-col items-center justify-center gap-5 px-5 py-32 text-center">
        <p className="text-[13px] font-medium tracking-[.2em] text-(--afvar-muted)">404</p>
        <h1 className="text-[clamp(32px,6vw,56px)] font-semibold leading-tight">This page could not be found</h1>
        <p className="max-w-md text-[15px] text-(--afvar-muted)">The link may be old, or the address may have a typo.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/" className={BTN_PRIMARY}>Back to home</Link>
          <Link href="/resources/help" className={BTN_OUTLINE}>Help & Support</Link>
        </div>
      </main>
    </SiteFrame>
  );
}
