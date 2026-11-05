"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MESSAGES: Record<string, string> = {
  unauthorized: "Your session has expired. Sign in again.",
  not_found: "This enquiry was already deleted.",
  not_configured: "MongoDB is not configured on the server.",
  unavailable: "Couldn't reach the database. Try again in a moment.",
};

/** Two-step delete for one /admin table row: a Delete button that turns into Confirm / Cancel. */
export function DeleteEnquiryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      if (response.ok || response.status === 404) {
        // Already gone counts as done: the refreshed list won't show it either way.
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (body.error === "unauthorized") {
        router.replace("/admin/login");
        return;
      }
      setError(MESSAGES[body.error ?? ""] ?? "Couldn't delete this enquiry. Try again.");
    } catch {
      setError("Network error. Check your connection and try again.");
    }
    setPending(false);
  };

  const button = "inline-flex h-8 items-center rounded-md px-2.5 text-[12.5px] font-medium disabled:pointer-events-none disabled:opacity-60";

  return (
    <div className="flex flex-col items-end gap-1.5">
      {confirming ? (
        <div className="flex items-center gap-1.5" role="group" aria-label={`Confirm deleting the enquiry from ${name}`}>
          <button type="button" onClick={remove} disabled={pending} className={`${button} bg-negative/15 text-negative hover:bg-negative/25`}>
            {pending ? "Deleting…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={pending}
            className={`${button} text-muted hover:bg-surface-raised hover:text-foreground`}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete the enquiry from ${name}`}
          className={`${button} border border-border-subtle text-muted hover:border-negative hover:text-negative`}
        >
          Delete
        </button>
      )}
      {error && (
        <p role="alert" className="max-w-[22ch] text-right text-[12px] text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
