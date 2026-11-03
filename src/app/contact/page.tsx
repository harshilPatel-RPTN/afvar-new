import type { Metadata } from "next";
import { ContactFilmPage } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "General enquiries, partnerships and press for AFVAR. Product or account help has its own support destination. Verified contact options only — no response-time promises before launch.",
};

export default function Page() {
  return <ContactFilmPage />;
}
