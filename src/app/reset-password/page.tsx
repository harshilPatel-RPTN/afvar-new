import type { Metadata } from "next";
import { AuthPageFrame, ResetPasswordView } from "@/modules/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function Page() {
  return <AuthPageFrame><ResetPasswordView /></AuthPageFrame>;
}
