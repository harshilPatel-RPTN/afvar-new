import type { ReactNode } from "react";

/**
 * Dashboard grid — placeholder for the real layout engine (drag/resize/pop-out)
 * being ported from the Vite app. Keep this public API stable.
 */
export function PanelGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid auto-rows-[minmax(16rem,auto)] grid-cols-1 gap-4 lg:grid-cols-4">
      {children}
    </div>
  );
}

export function PanelSlot({
  id,
  className = "",
  children,
}: {
  /** Must match an entry in the app's panel registry (src/app/panels.tsx). */
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section data-panel-id={id} className={`min-h-0 ${className}`}>
      {children}
    </section>
  );
}
