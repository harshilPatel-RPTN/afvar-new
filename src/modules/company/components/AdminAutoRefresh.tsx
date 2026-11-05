"use client";

// Keeps the admin enquiry list fresh without a manual reload: re-fetches the
// server-rendered page every 20 s while the tab is visible, again the moment the
// tab regains focus, and on demand from the button.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERVAL_MS = 20_000;

export function AdminAutoRefresh() {
  const router = useRouter();
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      setRefreshedAt(new Date());
    };
    const id = window.setInterval(refresh, INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return (
    <div className="flex items-center gap-3 text-[12.5px] text-muted">
      <span aria-live="polite">
        {refreshedAt ? `Updated ${refreshedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" })} IST` : "Auto-refreshes every 20 s"}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          router.refresh();
          setRefreshedAt(new Date());
          window.setTimeout(() => setBusy(false), 600);
        }}
        className="h-10 rounded-full border border-border-subtle px-4 text-[13.5px] font-medium text-foreground hover:border-accent disabled:opacity-60"
      >
        {busy ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
