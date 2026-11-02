import type { ReactNode } from "react";

/**
 * A hero's main heading. Heroes render a phone and a desktop copy side by side
 * and CSS shows one, so the phone twin (`twin`) carries the level-1 heading role
 * without being a second <h1>: the page keeps one <h1>, and the copy on screen
 * is the heading assistive tech hears (the hidden one is display:none).
 */
export function HeroTitle({ twin = false, className, children }: { twin?: boolean; className?: string; children: ReactNode }) {
  if (twin) {
    return (
      <div role="heading" aria-level={1} className={className}>
        {children}
      </div>
    );
  }
  return <h1 className={className}>{children}</h1>;
}
