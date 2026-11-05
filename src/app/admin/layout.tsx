import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · AFVAR Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-1 flex-col bg-background text-foreground">{children}</div>;
}
