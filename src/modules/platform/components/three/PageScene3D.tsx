"use client";

// Lazy 3D stage for the public pages, following platform/Scene3D: near the
// viewport it loads the WebGL models; until then (or without WebGL) a CSS 3D
// fallback shows — tilting layered planes, or a caller-supplied scene.
import { motion, useAnimationFrame, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PageModelKind } from "./PageModels3D";

type Models = typeof import("./PageModels3D").PageModels3D;

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Soft fade on every edge so a full-width stage has no visible border. */
const BLEED_MASK = "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent), linear-gradient(to bottom, transparent, #000 14%, #000 80%, transparent)";

export function PageScene3D({
  kind,
  label,
  caption,
  fallback,
  hint = "Move your pointer to look around",
  bleed = false,
  className = "",
}: {
  /** Full-width, borderless stage that melts into the page (Markets). */
  bleed?: boolean;
  kind: PageModelKind;
  label: string;
  caption: string;
  /** Pointer hint under the stage (translated by the caller). */
  hint?: string;
  fallback?: ReactNode;
  className?: string;
}) {
  const still = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.3 });
  const run = visible && !still;
  const hovering = useRef(false);
  const near = useInView(ref, { margin: "400px", once: true });
  const [Scene, setScene] = useState<Models | null>(null);

  useEffect(() => {
    if (!near || !hasWebGL()) return;
    let live = true;
    import("./PageModels3D").then((m) => live && setScene(() => m.PageModels3D));
    return () => {
      live = false;
    };
  }, [near]);

  const rx = useSpring(8, { stiffness: 110, damping: 18 });
  const ry = useSpring(-12, { stiffness: 110, damping: 18 });
  const gx = useMotionValue(30);
  const gy = useMotionValue(20);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,240,200,0.14), transparent 45%)`;

  useAnimationFrame((t) => {
    if (!run || hovering.current || Scene) return;
    ry.set(Math.sin(t / 2600) * 14);
    rx.set(7 + Math.cos(t / 3400) * 4);
    gx.set(50 + Math.sin(t / 2600) * 30);
  });

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (still || Scene) return;
    hovering.current = true;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 28);
    rx.set(6 - py * 18);
    gx.set((px + 0.5) * 100);
    gy.set((py + 0.5) * 100);
  }

  return (
    <figure className={className}>
      <div
        ref={ref}
        role="img"
        aria-label={label}
        onPointerMove={onPointerMove}
        onPointerEnter={() => (hovering.current = true)}
        onPointerLeave={() => (hovering.current = false)}
        className={
          bleed
            ? "relative h-[clamp(360px,58vw,720px)] w-full overflow-hidden [perspective:1300px]"
            : "relative aspect-[16/10] overflow-hidden [perspective:1300px] sm:aspect-[16/9]"
        }
        // No card behind the model: it sits on the page, edges faded so it blends in.
        style={{ maskImage: BLEED_MASK, WebkitMaskImage: BLEED_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        {Scene ? (
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
            <Scene kind={kind} run={run} still={still} hover={hovering} />
          </motion.div>
        ) : (
          <>
            <motion.div
              className="absolute inset-0 [transform-style:preserve-3d]"
              style={{ rotateX: still ? 8 : rx, rotateY: still ? -12 : ry }}
              aria-hidden="true"
            >
              {fallback ?? <DefaultFallback />}
            </motion.div>
            <motion.div className="pointer-events-none absolute inset-0" style={{ background: glare }} aria-hidden="true" />
          </>
        )}
      </div>
      <figcaption className={`mt-3 flex flex-wrap justify-between gap-2 text-[12px] text-(--text-muted) ${bleed ? "mx-auto max-w-6xl px-4 sm:px-6" : ""}`}>
        <span>{caption}</span>
        {!still && <span className="max-sm:hidden">{hint}</span>}
      </figcaption>
    </figure>
  );
}

/** Generic CSS stand-in: three layered glass planes at increasing depth. */
function DefaultFallback() {
  return (
    <>
      {[-70, 0, 70].map((z, index) => (
        <div
          key={z}
          className="absolute left-1/2 top-1/2 rounded-xl"
          style={{
            width: "46%",
            height: "52%",
            transform: `translate(-50%, -50%) translate3d(${(index - 1) * 60}px, ${(1 - index) * 14}px, ${z}px)`,
            background: index === 2 ? "rgba(0,230,118,0.12)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${index === 2 ? "rgba(0,230,118,0.45)" : "rgba(255,255,255,0.08)"}`,
            boxShadow: index === 2 ? "0 0 44px rgba(0,230,118,0.2)" : undefined,
          }}
        />
      ))}
    </>
  );
}
