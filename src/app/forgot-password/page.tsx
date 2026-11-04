import type { Metadata } from "next";
import { AuthPageFrame, ForgotPasswordView } from "@/modules/auth";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function Page() {
  return <AuthPageFrame><ForgotPasswordView /></AuthPageFrame>;
}
