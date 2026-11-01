import type { Metadata } from "next";
import { AuthPageFrame, RegisterView } from "@/modules/auth";

export const metadata: Metadata = { title: "Create account" };

export default function Page() {
  return <AuthPageFrame><RegisterView /></AuthPageFrame>;
}
