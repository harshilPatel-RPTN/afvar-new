import type { Metadata } from "next";
import { CookiesPage } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Cookies",
  description: "Every cookie and local-storage item the AFVAR website keeps, and why.",
  alternates: { canonical: "/cookies" },
};

export default function Page() {
  return <CookiesPage />;
}
