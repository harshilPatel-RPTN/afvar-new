import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/modules/company/kit";
import { currentAdmin } from "@/modules/company/server/admin-session";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page() {
  // Already signed in → straight to the dashboard. If the database is down, just show the form.
  const admin = await currentAdmin().catch(() => null);
  if (admin) redirect("/admin");
  return (
    <main id="main" className="grid flex-1 place-items-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8">
        <p className="text-[12px] font-medium tracking-wide text-accent uppercase">AFVAR · Admin</p>
        <h1 className="mt-2 text-[22px] font-semibold">Sign in</h1>
        <p className="mt-1 text-[13.5px] text-muted">Contact enquiries are visible to admins only.</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
