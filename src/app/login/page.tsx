import type { Metadata } from "next";
import { AuthPageFrame, LoginView } from "@/modules/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return <AuthPageFrame><LoginView /></AuthPageFrame>;
}
