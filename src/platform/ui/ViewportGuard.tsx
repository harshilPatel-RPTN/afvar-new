"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** A multi-window OS does not degrade below this width. */
export const MIN_VIEWPORT_PX = 1000;

// The public Markets landing is responsive and must work on phones.
const EXEMPT = ["/unsupported", "/legal", "/markets"];

/** Sends narrow screens to /unsupported, remembering where they were going. */
export function ViewportGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (EXEMPT.some((prefix) => pathname.startsWith(prefix))) return;
    const check = () => {
      if (window.innerWidth < MIN_VIEWPORT_PX) {
        const from = `${pathname}${window.location.search}`;
        router.replace(`/unsupported?from=${encodeURIComponent(from)}`);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [pathname, router]);

  return null;
}
