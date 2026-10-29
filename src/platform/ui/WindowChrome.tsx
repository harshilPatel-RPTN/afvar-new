"use client";

import type { ReactNode } from "react";
import { useT } from "../i18n";

/**
 * Panel title bar: title, optional status area, pop-out button.
 * `panelId` must match an entry in the app's panel registry so the
 * pop-out window (/popout?panels=<id>) can re-render this panel.
 */
export function WindowChrome({
  title,
  panelId,
  status,
}: {
  title: string;
  panelId?: string;
  status?: ReactNode;
}) {
  const { t } = useT();
  return (
    <header className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        {status}
        {panelId && (
          <button
            type="button"
            aria-label={t("window.popOutLabel", { title })}
            title={t("window.popOut")}
            className="text-muted transition-colors hover:text-foreground"
            onClick={() =>
              window.open(
                `/popout?panels=${panelId}`,
                `popout-${panelId}`,
                "width=720,height=520",
              )
            }
          >
            ⧉
          </button>
        )}
      </div>
    </header>
  );
}
