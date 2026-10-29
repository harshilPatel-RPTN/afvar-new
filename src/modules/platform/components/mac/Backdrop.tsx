import Image from "next/image";

/**
 * Decorative section background (Figma-generated artwork in /public/platform/bg).
 * Sits behind the section's content (parent needs `relative isolate`), fades out
 * at the edges with a mask, and drifts very slowly unless motion is reduced.
 */
export function Backdrop({
  src,
  className = "absolute inset-0",
  fade = "linear-gradient(to bottom, transparent, black 20%, black 70%, transparent)",
  opacity = 0.6,
  position = "center",
  priority = false,
}: {
  src: string;
  className?: string;
  fade?: string;
  opacity?: number;
  position?: string;
  priority?: boolean;
}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none -z-10 overflow-hidden ${className}`} style={{ maskImage: fade, WebkitMaskImage: fade, opacity }}>
      <Image src={src} alt="" fill sizes="100vw" priority={priority} className="pf-drift object-cover" style={{ objectPosition: position }} />
    </div>
  );
}
