import type { Metadata } from "next";
import { StartFilmPage } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Getting Started · Resources",
  description: "Verify your mobile and email, follow your launch queue status and get ready for your first AFVAR session.",
  alternates: { canonical: "/resources/getting-started" },
};

export default function Page() {
  return <StartFilmPage />;
}
