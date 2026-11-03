import type { Metadata } from "next";
import { HelpFilmPage } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Help & Support · Resources",
  description: "Troubleshooting topics, account and launch-status help, and one shared AFVAR support destination.",
  alternates: { canonical: "/resources/help" },
};

export default function Page() {
  return <HelpFilmPage />;
}
