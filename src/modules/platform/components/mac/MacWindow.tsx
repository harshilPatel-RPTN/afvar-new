import type { ReactNode } from "react";

/**
 * macOS window frame for illustrative previews. Traffic lights are decorative
 * (aria-hidden): these previews are not real windows and must not look like
 * working controls to assistive tech.
 */
export function MacWindow({
  title,
  size = "md",
  inactive = false,
  toolbar,
  className = "",
  bodyClassName = "",
  children,
}: {
  title?: string;
  size?: "md" | "sm";
  inactive?: boolean;
  toolbar?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`pf-window ${size === "sm" ? "pf-window-sm" : ""} ${inactive ? "pf-window-inactive" : ""} ${className}`}>
      <div className="pf-window-toolbar">
        <TrafficLights />
        {title && (
          <span
            className={`pointer-events-none absolute inset-x-0 truncate text-center font-semibold ${inactive ? "text-(--text-muted)" : "text-(--text-secondary)"} ${
              size === "sm" ? "px-12 text-[11px] max-sm:hidden" : "px-28 text-[13px]"
            }`}
          >
            {title}
          </span>
        )}
        {toolbar && <div className="relative ml-auto flex items-center gap-2">{toolbar}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

export function TrafficLights() {
  return (
    <div className="pf-lights relative z-10" aria-hidden="true">
      <span className="pf-light pf-light-close">
        <svg viewBox="0 0 8 8">
          <path d="M2 2l4 4M6 2 2 6" stroke="#4d0000" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="pf-light pf-light-min">
        <svg viewBox="0 0 8 8">
          <path d="M1.5 4h5" stroke="#5a3d00" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="pf-light pf-light-zoom">
        <svg viewBox="0 0 8 8">
          <path d="M2 2.2v3.2l3.2-3.2zM6 5.8V2.6L2.8 5.8z" fill="#003d00" />
        </svg>
      </span>
    </div>
  );
}
