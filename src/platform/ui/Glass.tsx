import type { HTMLAttributes } from "react";

/** Translucent panel surface — the base container for every dashboard panel. */
export function Glass({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border-subtle bg-surface/80 backdrop-blur-md ${className}`}
      {...props}
    />
  );
}
