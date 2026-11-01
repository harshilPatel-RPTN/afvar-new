"use client";

import { useEffect, useRef, useState } from "react";
import { NEBULA_FRAGMENT, NEBULA_VERTEX } from "./nebula-shader";

const MAX_PIXELS = 1_800_000;
const MAX_DPR = 1.25;
const NEBULA_FPS = 30;
const MOTE_COUNT = 110;
const LINK_DISTANCE = 120;
/** Nebula core in screen fractions; ripples start here. */
const CORE = { x: 0.49, y: 0.45 };

interface Mote {
  x: number;
  y: number;
  depth: number;
  vx: number;
  vy: number;
  phase: number;
  hue: "warm" | "cool";
}
interface Ripple {
  age: number;
  life: number;
}
interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  length: number;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader allocation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || "Shader compilation failed");
  }
  return shader;
}

function createNebula(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) throw new Error("WebGL unavailable");
  if (!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision)
    throw new Error("High precision rendering unavailable");

  const program = gl.createProgram();
  if (!program) throw new Error("Program allocation failed");
  const vertex = compile(gl, gl.VERTEX_SHADER, NEBULA_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, NEBULA_FRAGMENT);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program) || "Program linking failed");
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, "u_resolution");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uPointer = gl.getUniformLocation(program, "u_pointer");

  return {
    resize(width: number, height: number) {
      const ratio = Math.min(
        devicePixelRatio || 1,
        MAX_DPR,
        Math.sqrt(MAX_PIXELS / Math.max(1, width * height)),
      );
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    draw(time: number, px: number, py: number) {
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uPointer, px, py);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR)
        throw new Error("Frame failed");
    },
  };
}

function spawnMote(width: number, height: number, anywhere: boolean): Mote {
  const depth = 0.2 + Math.random() * 0.8;
  return {
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : height + 20,
    depth,
    vx: (Math.random() - 0.3) * 6 * depth,
    vy: -(4 + Math.random() * 10) * depth,
    phase: Math.random() * Math.PI * 2,
    hue: Math.random() < 0.55 ? "cool" : "warm",
  };
}

function spawnShootingStar(width: number, height: number): ShootingStar {
  const angle = (Math.PI / 180) * (14 + Math.random() * 26);
  const speed = 700 + Math.random() * 600;
  return {
    x: width * (0.25 + Math.random() * 0.8),
    y: height * Math.random() * 0.4,
    vx: -Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    age: 0,
    life: 0.7 + Math.random() * 0.6,
    length: 120 + Math.random() * 160,
  };
}

/** Falls back to CSS gradients without WebGL; draws one still frame for reduced motion. */
export function LiveNebula({ dimmed = false }: { dimmed?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const nebulaRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const nebulaCanvas = nebulaRef.current;
    const overlay = overlayRef.current;
    const ctx = overlay?.getContext("2d");
    if (!host || !nebulaCanvas || !overlay || !ctx) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let nebula: ReturnType<typeof createNebula> | null = null;
    try {
      nebula = createNebula(nebulaCanvas);
    } catch {
      nebula = null;
    }

    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let lastNebulaDraw = 0;
    let elapsed = 0;
    let nextShootingStar = 1.5;
    let reported = false;
    const report = (ready: boolean) => {
      if (reported === ready) return;
      reported = ready;
      setWebglReady(ready);
    };
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const motes: Mote[] = [];
    const shootingStars: ShootingStar[] = [];
    const ripples: Ripple[] = [];
    let nextRipple = 2;
    const projected: { x: number; y: number; depth: number }[] = [];
    // Glow sprites (one per tint): a white-to-clear radial gradient in that tint, drawn once.
    const sprite = (tint: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, `rgba(${tint},1)`);
      grad.addColorStop(1, `rgba(${tint},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return c;
    };
    const sprites = { cool: sprite("150,210,255"), warm: sprite("255,190,150") };
    // Phones: fewer motes and a lighter overlay; the scene looks the same at that size.
    const small = matchMedia("(max-width: 767px)").matches;
    const moteCount = small ? Math.round(MOTE_COUNT * 0.55) : MOTE_COUNT;
    // Phones and low-core machines draw the slow-drifting overlay at 30 fps instead of every frame.
    const overlayEvery = small || (navigator.hardwareConcurrency ?? 8) <= 4 ? 1000 / 30 : 0;
    let lastOverlay = 0;
    let overlayDt = 0;

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
      overlay.width = Math.round(width * ratio);
      overlay.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      nebula?.resize(width, height);
      if (motes.length === 0)
        for (let i = 0; i < moteCount; i++) motes.push(spawnMote(width, height, true));
    };

    const drawNebula = () => {
      if (!nebula) return;
      try {
        nebula.draw(reducedMotion.matches ? 18 : elapsed, pointer.x, pointer.y);
        report(true);
      } catch {
        nebula = null;
        report(false);
      }
    };

    const drawOverlay = (dt: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      nextRipple -= dt;
      if (nextRipple <= 0) {
        ripples.push({ age: 0, life: 6 + Math.random() * 2 });
        nextRipple = 4 + Math.random() * 3;
      }
      const coreX = width * CORE.x + pointer.x * 3;
      const coreY = height * CORE.y - pointer.y * 3;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.age += dt;
        if (ripple.age >= ripple.life) {
          ripples.splice(i, 1);
          continue;
        }
        const t = ripple.age / ripple.life;
        const radius = 30 + t * Math.max(width, height) * 0.55;
        const alpha = 0.16 * Math.sin(t * Math.PI) * (1 - t);
        const ring = ctx.createRadialGradient(coreX, coreY, radius * 0.82, coreX, coreY, radius);
        ring.addColorStop(0, "rgba(255,200,150,0)");
        ring.addColorStop(0.7, `rgba(255,205,160,${alpha})`);
        ring.addColorStop(1, "rgba(160,210,255,0)");
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.arc(coreX, coreY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < motes.length; i++) {
        const mote = motes[i];
        mote.x += mote.vx * dt;
        mote.y += mote.vy * dt;
        if (mote.y < -20 || mote.x < -20 || mote.x > width + 20) {
          motes[i] = spawnMote(width, height, false);
          continue;
        }
        const flicker = 0.55 + 0.45 * Math.sin(elapsed * (0.8 + mote.depth) + mote.phase);
        const x = mote.x + pointer.x * 8 * mote.depth;
        const y = mote.y - pointer.y * 6 * mote.depth;
        projected[i] = { x, y, depth: mote.depth };
        const radius = 0.6 + mote.depth * 1.8;
        // Same glow as a per-frame radial gradient, stamped from a sprite drawn once.
        const r5 = radius * 5;
        ctx.globalAlpha = 0.5 * flicker * mote.depth;
        ctx.drawImage(mote.hue === "cool" ? sprites.cool : sprites.warm, x - r5, y - r5, r5 * 2, r5 * 2);
      }
      ctx.globalAlpha = 1;

      ctx.lineWidth = 0.6;
      for (let a = 0; a < projected.length; a++) {
        const pa = projected[a];
        if (!pa || pa.depth < 0.45) continue;
        for (let b = a + 1; b < projected.length; b++) {
          const pb = projected[b];
          if (!pb || Math.abs(pa.depth - pb.depth) > 0.25) continue;
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const distance = Math.hypot(dx, dy);
          if (distance > LINK_DISTANCE) continue;
          const alpha = (1 - distance / LINK_DISTANCE) * 0.22 * pa.depth;
          ctx.strokeStyle = `rgba(150,195,255,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }

      nextShootingStar -= dt;
      if (nextShootingStar <= 0) {
        shootingStars.push(spawnShootingStar(width, height));
        nextShootingStar = 1.2 + Math.random() * 3;
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.age += dt;
        if (star.age >= star.life) {
          shootingStars.splice(i, 1);
          continue;
        }
        star.x += star.vx * dt;
        star.y += star.vy * dt;
        const fade = Math.sin((star.age / star.life) * Math.PI);
        const speed = Math.hypot(star.vx, star.vy);
        const tailX = star.x - (star.vx / speed) * star.length;
        const tailY = star.y - (star.vy / speed) * star.length;
        const trail = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        trail.addColorStop(0, `rgba(235,245,255,${0.9 * fade})`);
        trail.addColorStop(0.3, `rgba(160,205,255,${0.35 * fade})`);
        trail.addColorStop(1, "rgba(120,170,255,0)");
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        const head = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 6);
        head.addColorStop(0, `rgba(255,255,255,${fade})`);
        head.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = head;
        ctx.beginPath();
        ctx.arc(star.x, star.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const tick = (now: number) => {
      frame = 0;
      if (document.hidden) return;
      const dt = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
      previous = now;
      elapsed += dt;
      const ease = 1 - Math.exp(-dt * 1.8);
      pointer.x += (pointer.targetX - pointer.x) * ease;
      pointer.y += (pointer.targetY - pointer.y) * ease;
      if (now - lastNebulaDraw >= 1000 / NEBULA_FPS) {
        drawNebula();
        lastNebulaDraw = now;
      }
      overlayDt += dt;
      if (now - lastOverlay >= overlayEvery) {
        drawOverlay(overlayDt);
        overlayDt = 0;
        lastOverlay = now;
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (reducedMotion.matches) {
        drawNebula();
        ctx.clearRect(0, 0, width, height);
        return;
      }
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      nebula = null;
      report(false);
    };

    const observer = new ResizeObserver(() => {
      resize();
      if (reducedMotion.matches) drawNebula();
    });
    observer.observe(host);
    resize();
    start();

    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("visibilitychange", start);
    reducedMotion.addEventListener("change", start);
    nebulaCanvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", start);
      reducedMotion.removeEventListener("change", start);
      nebulaCanvas.removeEventListener("webglcontextlost", onContextLost);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden bg-[#010205] transition-[filter] duration-700"
      style={{ filter: dimmed ? "blur(5px) brightness(.8) saturate(1.1)" : "none" }}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${webglReady ? "opacity-0" : "opacity-100"}`}
        style={{
          background:
            "radial-gradient(ellipse 22% 24% at 51% 44%,rgba(255,207,145,.55),transparent),radial-gradient(ellipse 61% 29% at 35% 68%,rgba(209,48,32,.72),transparent),radial-gradient(ellipse 20% 54% at 22% 46%,rgba(91,212,219,.62),transparent),radial-gradient(ellipse 39% 53% at 82% 39%,rgba(30,142,180,.7),transparent),radial-gradient(ellipse 70% 70% at 51% 48%,rgba(100,29,79,.52),transparent),#07111F",
        }}
      />
      <canvas
        ref={nebulaRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${webglReady ? "opacity-100" : "opacity-0"}`}
      />
      <canvas ref={overlayRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,5,16,.28),transparent_26%,transparent_70%,rgba(1,4,13,.45))]" />
    </div>
  );
}
