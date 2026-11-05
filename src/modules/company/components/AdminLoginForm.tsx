"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const FIELD =
  "h-11 w-full rounded-[9px] border border-border-subtle bg-black/30 px-3.5 text-[16px] text-foreground outline-none focus:border-accent sm:text-[14px]";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "That username and password don't match.",
  rate_limited: "Too many attempts. Wait a minute and try again.",
  not_configured: "Admin sign-in is not configured on the server.",
  unavailable: "Couldn't reach the database. Try again in a moment.",
};

export function AdminLoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (response.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(MESSAGES[body.error ?? ""] ?? "Sign-in failed. Try again.");
    } catch {
      setError("Network error. Check your connection and try again.");
    }
    setPending(false);
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="admin-username" className="mb-1.5 block text-[12px] font-medium text-muted">
          Username
        </label>
        <input id="admin-username" name="username" autoComplete="username" required className={FIELD} />
      </div>
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-[12px] font-medium text-muted">
          Password
        </label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required className={FIELD} />
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-negative">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="afvar-glass-button afvar-glass-primary inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-medium active:scale-[.98] disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
