import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

/** Calm, specific empty state (DESIGN-GUIDE §11.1.1). Not for unavailable data. */
export function EmptyState({ icon = "info", title, description, action }: { icon?: IconName; title: string; description: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[360px] flex-col items-center gap-3 py-10 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-(--surface-2) text-(--text-tertiary)">
        <Icon name={icon} className="h-8 w-8" />
      </span>
      <p className="text-[15px] font-semibold text-(--text-primary)">{title}</p>
      <div className="text-[13px] leading-normal text-(--text-secondary)">{description}</div>
      {action}
    </div>
  );
}
