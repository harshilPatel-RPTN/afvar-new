"use client";

import { useEffect, useRef } from "react";

/**
 * Animated silk aurora for the Markets heroes: the /about hero artwork recreated
 * live — two curtains of striated, wavy ribbons framing a dark starry centre,
 * bull green on the left and bear red on the right. Raw
 * WebGL, rendered at reduced resolution, paused off-screen,
 * one still frame under reduced motion. Decorative only.
 */

export type SilkTone = "gold" | "cyan" | "violet";

const TONES: Record<SilkTone, [number[], number[]]> = {
  // The /home-demo palette: market green over deep green, with a red curtain
  // for contrast — no gold. (Tone names kept for the call sites.)
  gold: [[0.0, 0.9, 0.46], [0.0, 0.32, 0.18]],
  cyan: [[0.41, 0.94, 0.68], [0.0, 0.28, 0.16]],
  violet: [[1.0, 0.23, 0.23], [0.0, 0.5, 0.28]],
};

/** The right-hand curtain: bear red (front ribbons) over deep red (back ribbons). */
const BEAR: [number[], number[]] = [[1.0, 0.23, 0.23], [0.34, 0.03, 0.05]];

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uPointer; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uD;
// Precision-safe hash (no large sin arguments, so no banding patterns).
float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
// One curtain of silk: six wavy ribbons, front ones bright (uA), back ones dim (uB).
vec3 curtain(vec2 p, float cx, float dir, float t, float seed, vec3 ca, vec3 cb){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float y = p.y;
    float off = cx + dir * (fi - 2.5) * 0.11
      + 0.36 * sin(y * 1.35 + t * 0.2 + seed + fi * 0.9)
      + 0.13 * sin(y * 3.1 - t * 0.31 + fi * 1.7)
      + dir * y * 0.5;
    float d = p.x - off;
    float w = 0.065 + 0.07 * (0.5 + 0.5 * sin(y * 1.9 + fi * 2.3 + t * 0.17));
    float band = exp(-d * d / (w * w));
    float fine = 0.5 + 0.5 * sin(d * 260.0 + 4.0 * sin(y * 1.2 + fi * 3.1 + t * 0.1));
    float coarse = 0.5 + 0.5 * sin(d * 30.0 + y * 1.6 + fi * 2.0);
    float streak = mix(coarse, fine, 0.15);
    float sheen = pow(band, 3.0) * (0.5 + 0.5 * sin(y * 2.2 - t * 0.45 + fi * 1.9));
    float glow = exp(-abs(d) / (w * 4.0));
    float front = 1.0 - fi / 6.0;
    vec3 c = mix(cb, ca, smoothstep(0.15, 0.7, front + 0.25 * sin(y * 1.4 + t * 0.08 + fi)));
    float fade = smoothstep(-1.1, -0.3, y) * smoothstep(1.45, 0.35, y);
    acc += (c * (band * (0.78 + 0.22 * streak) + glow * 0.09) + mix(c, vec3(1.0, 0.94, 0.82), 0.6) * sheen * 0.9) * fade * (0.4 + 0.8 * front);
  }
  return acc;
}
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 2.0;
  p += uPointer * vec2(0.12, 0.06);
  float t = uTime;
  float aspect = uRes.x / uRes.y;
  // portrait screens: push the curtains to the edges and dim them so the copy stays legible
  float narrow = smoothstep(1.25, 0.6, aspect);
  // bull green on the left, bear red on the right (the site's green / red theme)
  vec3 col = curtain(p, -aspect * 0.66 - narrow * 0.42, -1.0, t, 0.0, uA, uB) + curtain(p, aspect * 0.64 + narrow * 0.42, 1.0, t * 0.93, 2.7, uC, uD);
  col *= 1.0 - 0.45 * narrow;
  // keep the copy column dark
  col *= mix(0.04, 1.0, smoothstep(0.26, 0.66, abs(p.x) / aspect));
  col = 1.0 - exp(-col * 1.05);
  // sparse twinkling stars
  vec2 g = floor(gl_FragCoord.xy / 2.0);
  float h = hash(g);
  float tw = 0.5 + 0.5 * sin(t * (1.0 + h * 2.0) + h * 40.0);
  col += vec3(0.88, 0.9, 1.0) * step(0.9975, h) * (0.25 + 0.6 * tw);
  col += (hash(gl_FragCoord.xy + fract(t) * 91.0) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

export function SilkBackdrop({ tone = "gold", className = "" }: { tone?: SilkTone; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!canvas || !gl) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const [a, b] = TONES[tone];
    gl.uniform3f(u("uA"), a[0], a[1], a[2]);
    gl.uniform3f(u("uB"), b[0], b[1], b[2]);
    gl.uniform3f(u("uC"), BEAR[0][0], BEAR[0][1], BEAR[0][2]);
    gl.uniform3f(u("uD"), BEAR[1][0], BEAR[1][1], BEAR[1][2]);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let visible = true;
    let frame = 0;
    const start = performance.now() - 40_000; // start mid-flow, not from the symmetric t = 0

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = (now: number) => {
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      gl.uniform2f(u("uRes"), canvas.width, canvas.height);
      gl.uniform1f(u("uTime"), (now - start) / 1000);
      gl.uniform2f(u("uPointer"), pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      draw(now);
      frame = visible ? requestAnimationFrame(loop) : 0;
    };

    resize();
    canvas.dataset.ready = "1";
    const observer = new ResizeObserver(() => {
      resize();
      if (still) draw(start + 40_000);
    });
    observer.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !still && !frame) frame = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    const onPointer = (event: PointerEvent) => {
      pointer.tx = event.clientX / window.innerWidth - 0.5;
      pointer.ty = 0.5 - event.clientY / window.innerHeight;
    };
    if (still) draw(start + 40_000);
    else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, [tone]);

  return <canvas ref={ref} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
