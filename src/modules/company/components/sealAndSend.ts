// "Sent" flourish for the enquiry form: a rubber stamp slams "SENT ✓" onto the
// form (thud, shake, ink ring), the form flips over into a sealed envelope, the
// envelope shrinks and zips to the avatar launcher (bottom-right), and the robot
// leans out and catches it one-handed — a layered rig cut from launcher.png whose
// arm tracks the envelope in flight, gives with the impact, and carries it to the
// chest — then bounces with a burst of confetti, while the "sent"
// card fades in where the form was (the caller swaps the view when `onFormGone` fires).
//
// Imperative Web Animations; the stamp is appended inside the form so it flips
// with it, everything else lives on fixed layers in <body>. Skipped under
// reduced motion. With no avatar on screen the envelope zips to the corner.
import { playSfx } from "@/modules/home/kit";

const LAYER = 2147482000;
const MINT = "#a8dec2";
const MINT_RGB = "168,222,194";
const CRIMSON = "#a31c1b";
const SANS = "var(--font-geist-sans, system-ui), system-ui, sans-serif";

const STAMP_MS = 220;
const FLIP_MS = 260;
const FLIGHT_MS = 820;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.dataset.reduceMotion === "true";

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const done = (animation: Animation) =>
  animation.finished.then(
    () => undefined,
    () => undefined,
  );
const random = (min: number, max: number) => min + Math.random() * (max - min);

function fixed<T extends HTMLElement>(
  el: T,
  style: Partial<CSSStyleDeclaration>,
  z = LAYER,
): T {
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    pointerEvents: "none",
    zIndex: String(z),
    ...style,
  });
  document.body.appendChild(el);
  return el;
}

/** The launcher button and the rect to aim at (the robot render when it's visible, else the button). */
function findAvatar(): {
  launcher: HTMLElement;
  target: DOMRect;
  robot: HTMLImageElement | null;
} | null {
  const dock = document.querySelector<HTMLElement>("[data-avatar-dock]");
  if (!dock) return null;
  const dockStyle = getComputedStyle(dock);
  if (dockStyle.visibility === "hidden" || Number(dockStyle.opacity) < 0.1)
    return null;
  const launcher = dock.querySelector<HTMLElement>(
    ":scope > button[aria-expanded]",
  );
  if (!launcher || launcher.getAttribute("aria-expanded") === "true")
    return null;
  const rect = launcher.getBoundingClientRect();
  if (
    !rect.width ||
    !rect.height ||
    getComputedStyle(launcher).visibility === "hidden"
  )
    return null;
  const robot = launcher.querySelector<HTMLImageElement>("img");
  const robotShown =
    robot &&
    Number(getComputedStyle(robot).opacity) > 0.5 &&
    robot.getBoundingClientRect().right <= window.innerWidth + 4;
  return {
    launcher,
    target: robotShown ? robot.getBoundingClientRect() : rect,
    robot: robotShown ? robot : null,
  };
}

/**
 * The robot as a rig, cut from launcher.png (214×256) into body, head and left
 * arm (public/avatar/rig-*.png). Boxes and joints are in those source pixels:
 * the head turns about the neck, the arm swings about the shoulder.
 */
const RIG = {
  w: 214,
  h: 256,
  head: {
    src: "/avatar/rig-head.png",
    box: { left: 24, top: 0, width: 168, height: 122 },
    joint: { x: 107, y: 118 },
  },
  arm: {
    src: "/avatar/rig-arm.png",
    box: { left: 0, top: 135, width: 42, height: 116 },
    joint: { x: 36, y: 150 },
    hand: { x: 14, y: 232 },
  },
  body: { src: "/avatar/rig-body.png" },
  chest: { x: 107, y: 165 },
} as const;

function preloadRig(): Promise<boolean> {
  return Promise.all(
    [RIG.body.src, RIG.head.src, RIG.arm.src].map((src) => {
      const img = new Image();
      img.src = src;
      return img.decode();
    }),
  ).then(
    () => true,
    () => false,
  );
}

const easeOut = (p: number) => 1 - (1 - p) ** 3;
const easeInOut = (p: number) =>
  p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
const easeOutBack = (p: number) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;

/** Moves `state[key]` to `to` over `ms` on its own rAF clock. Several can run on different keys at once. */
function tween<K extends string>(
  state: Record<K, number>,
  key: K,
  to: number,
  ms: number,
  ease: (p: number) => number = easeOut,
) {
  return new Promise<void>((resolve) => {
    const from = state[key];
    const started = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - started) / ms);
      state[key] = from + (to - from) * ease(p);
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

/** A rubber stamp slammed onto the form: lands big-to-small at a tilt, the form jolts, ink rings out. */
async function stamp(form: HTMLElement, box: DOMRect) {
  if (getComputedStyle(form).position === "static")
    form.style.position = "relative";
  const mark = document.createElement("div");
  mark.setAttribute("aria-hidden", "true");
  const size = Math.min(170, Math.max(120, box.width * 0.34));
  Object.assign(mark.style, {
    position: "absolute",
    left: `${box.width / 2 - size / 2}px`,
    top: `${box.height / 2 - size * 0.22}px`,
    width: `${size}px`,
    height: `${size * 0.44}px`,
    boxSizing: "border-box",
    border: `${Math.max(3, size * 0.028)}px solid ${CRIMSON}`,
    borderRadius: `${size * 0.06}px`,
    color: CRIMSON,
    font: `800 ${size * 0.19}px/1 ${SANS}`,
    letterSpacing: ".08em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: `${size * 0.05}px`,
    transform: "rotate(-11deg)",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "5",
    // Slightly uneven ink: a faint mask makes the edges breathe.
    maskImage:
      "radial-gradient(120% 120% at 30% 40%, #000 55%, rgba(0,0,0,.72))",
    webkitMaskImage:
      "radial-gradient(120% 120% at 30% 40%, #000 55%, rgba(0,0,0,.72))",
  });
  mark.innerHTML = `SENT<svg viewBox="0 0 24 24" width="${size * 0.2}" height="${size * 0.2}" aria-hidden="true"><path d="M4 12.5 L9.5 18 L20 6.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  form.appendChild(mark);

  await done(
    mark.animate(
      [
        { transform: "rotate(-11deg) scale(2.6)", opacity: 0 },
        { transform: "rotate(-11deg) scale(2.2)", opacity: 0.6, offset: 0.35 },
        { transform: "rotate(-11deg) scale(1)", opacity: 0.95 },
      ],
      {
        duration: STAMP_MS,
        easing: "cubic-bezier(.6,0,.9,.4)",
        fill: "forwards",
      },
    ),
  );
  playSfx("impact");
  // The paper takes the hit.
  form.animate(
    [
      { transform: "none" },
      { transform: "translate(2px, 3px) rotate(.25deg)" },
      { transform: "translate(-2px, -1px) rotate(-.2deg)" },
      { transform: "translate(1px, 1px)" },
      { transform: "none" },
    ],
    { duration: 280, easing: "ease-out" },
  );
  // An ink ring spreads out from under the stamp.
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const ring = fixed(document.createElement("div"), {
    left: `${cx - size / 2}px`,
    top: `${cy - size * 0.22}px`,
    width: `${size}px`,
    height: `${size * 0.44}px`,
    borderRadius: `${size * 0.1}px`,
    border: `2px solid ${CRIMSON}`,
    transform: "rotate(-11deg)",
  });
  void done(
    ring.animate(
      [
        { transform: "rotate(-11deg) scale(1)", opacity: 0.8 },
        { transform: "rotate(-11deg) scale(1.5)", opacity: 0 },
      ],
      { duration: 420, easing: "ease-out", fill: "forwards" },
    ),
  ).then(() => ring.remove());
}

/** The envelope face the form flips into: paper, flap, and a wax seal pressed on. Landscape, centred on the form. */
function envelope(form: DOMRect) {
  const height = Math.min(form.height, form.width * 0.68);
  const box = {
    left: form.left,
    top: form.top + (form.height - height) / 2,
    width: form.width,
    height,
  };
  const env = fixed(document.createElement("div"), {
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    borderRadius: "14px",
    background: "linear-gradient(180deg, #f2f5f2, #d6e6dc)",
    boxShadow: `0 18px 40px rgba(0,0,0,.5), inset 0 0 0 1px rgba(${MINT_RGB},.8)`,
    transformOrigin: "50% 50%",
    transform: "perspective(1400px) rotateX(-90deg)",
    overflow: "hidden",
    willChange: "transform, opacity",
  });
  const flap = document.createElement("div");
  Object.assign(flap.style, {
    position: "absolute",
    inset: "0",
    background: "linear-gradient(180deg, #e3eee7, #cfe0d6)",
    clipPath: "polygon(0 0, 100% 0, 50% 58%)",
    boxShadow: "0 2px 0 rgba(0,0,0,.06)",
  });
  const crease = document.createElement("div");
  Object.assign(crease.style, {
    position: "absolute",
    inset: "0",
    background: "linear-gradient(180deg, transparent, rgba(0,0,0,.08))",
    clipPath: "polygon(0 100%, 50% 42%, 100% 100%)",
  });
  const sealSize = Math.min(72, Math.max(44, box.width * 0.14));
  const seal = document.createElement("div");
  Object.assign(seal.style, {
    position: "absolute",
    left: `${box.width / 2 - sealSize / 2}px`,
    top: `${box.height * 0.58 - sealSize / 2}px`,
    width: `${sealSize}px`,
    height: `${sealSize}px`,
    borderRadius: "999px",
    background: `radial-gradient(circle at 35% 30%, #d8403c, ${CRIMSON} 55%, #6e1211)`,
    boxShadow:
      "0 4px 10px rgba(0,0,0,.35), inset 0 -2px 4px rgba(0,0,0,.3), inset 0 2px 3px rgba(255,255,255,.25)",
    display: "grid",
    placeItems: "center",
    color: "#fff5f3",
    transform: "scale(0)",
  });
  seal.innerHTML = `<svg viewBox="0 0 24 24" width="${sealSize * 0.5}" height="${sealSize * 0.5}" aria-hidden="true"><path d="M4 12.5 L9.5 18 L20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  env.append(crease, flap, seal);
  return {
    el: env,
    show: () =>
      done(
        env.animate(
          [
            { transform: "perspective(1400px) rotateX(-90deg)" },
            { transform: "perspective(1400px) rotateX(0deg)" },
          ],
          {
            duration: FLIP_MS,
            easing: "cubic-bezier(.2,.8,.3,1)",
            fill: "forwards",
          },
        ),
      ),
    pressSeal: async () => {
      await done(
        seal.animate(
          [
            { transform: "scale(1.9)", opacity: 0 },
            { transform: "scale(.92)", opacity: 1, offset: 0.7 },
            { transform: "scale(1)", opacity: 1 },
          ],
          {
            duration: 200,
            easing: "cubic-bezier(.5,0,.8,.5)",
            fill: "forwards",
          },
        ),
      );
      playSfx("pop");
      env.animate(
        [
          { transform: "perspective(1400px) rotateX(0deg) scale(1)" },
          { transform: "perspective(1400px) rotateX(0deg) scale(.985)" },
          { transform: "perspective(1400px) rotateX(0deg) scale(1)" },
        ],
        { duration: 180, easing: "ease-out" },
      );
    },
  };
}

/** Confetti bursting up and out from the robot, falling under gravity. */
function confetti(around: DOMRect) {
  const host = fixed(document.createElement("div"), {
    left: "0px",
    top: "0px",
    width: "0",
    height: "0",
  });
  const colors = [MINT, "#ffffff", "#ff918b", "#f7b5a7", MINT];
  const ox = around.left + around.width / 2;
  const oy = around.top + around.height * 0.35;
  const flights: Promise<void>[] = [];
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement("span");
    const w = random(5, 8);
    Object.assign(piece.style, {
      position: "absolute",
      left: `${ox}px`,
      top: `${oy}px`,
      width: `${w}px`,
      height: `${w * random(1.1, 1.8)}px`,
      borderRadius: i % 3 ? "1px" : "999px",
      background: colors[i % colors.length],
      willChange: "transform, opacity",
    });
    host.appendChild(piece);
    const angle = random(-170, -10) * (Math.PI / 180); // upward fan
    const speed = random(260, 520);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const spin = random(-720, 720);
    const duration = random(800, 1150);
    const STEPS = 12;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= STEPS; k++) {
      const t = (k / STEPS) * (duration / 1000);
      const x = vx * t;
      const y = vy * t + 0.5 * 1500 * t * t;
      frames.push({
        offset: k / STEPS,
        transform: `translate(${x}px, ${y}px) rotate(${spin * t}deg)`,
        opacity: k > STEPS * 0.75 ? 1 - (k / STEPS - 0.75) / 0.25 : 1,
      });
    }
    flights.push(
      done(
        piece.animate(frames, { duration, easing: "linear", fill: "forwards" }),
      ),
    );
  }
  return Promise.all(flights).then(() => host.remove());
}

function ripple(around: DOMRect) {
  const size = Math.max(around.width, around.height);
  const ring = fixed(document.createElement("div"), {
    left: `${around.left + around.width / 2 - size / 2}px`,
    top: `${around.top + around.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "999px",
    border: `2px solid rgba(${MINT_RGB},.9)`,
    boxShadow: `0 0 24px rgba(${MINT_RGB},.55)`,
  });
  void done(
    ring.animate(
      [
        { transform: "scale(.6)", opacity: 0.9 },
        { transform: "scale(1.6)", opacity: 0 },
      ],
      { duration: 650, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" },
    ),
  ).then(() => ring.remove());
}

export interface SealOptions {
  /** Fires once the form has flipped away: swap in the "sent" view now. Always called, even when skipped. */
  onFormGone: () => void;
  /** Fires when the envelope reaches the robot (chime, haptic). Always called. */
  onLand?: () => void;
}

export async function sealFormAndSend(
  form: HTMLElement,
  { onFormGone, onLand }: SealOptions,
): Promise<void> {
  if (
    typeof window === "undefined" ||
    reducedMotion() ||
    !document.body.animate
  ) {
    onFormGone();
    onLand?.();
    return;
  }
  const box = form.getBoundingClientRect();
  if (!box.width || !box.height) {
    onFormGone();
    onLand?.();
    return;
  }

  // 1. Stamped.
  await stamp(form, box);
  await wait(380);

  // 2. The form flips over (top edge away) and the envelope flips in to replace it.
  form.style.transformOrigin = "50% 50%";
  form.style.backfaceVisibility = "hidden";
  await done(
    form.animate(
      [
        { transform: "perspective(1400px) rotateX(0deg)" },
        { transform: "perspective(1400px) rotateX(90deg)" },
      ],
      {
        duration: FLIP_MS,
        easing: "cubic-bezier(.6,0,.9,.4)",
        fill: "forwards",
      },
    ),
  );
  form.style.opacity = "0"; // gone until it unmounts
  const env = envelope(box);
  await env.show();
  await wait(90);
  await env.pressSeal();
  await wait(260);

  // 3. The envelope lifts off, shrinks and zips to the robot; the sent card fades in beneath it.
  onFormGone();
  const avatar = findAvatar();
  const t = avatar?.target ?? null;
  const robotImg = avatar?.robot ?? null;
  const rigReady = robotImg ? await preloadRig() : false;
  const catching = Boolean(t && robotImg && rigReady);
  const from = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  // It comes in on one side; the robot leans that way, watches it, and reaches with that arm.
  const fromLeft = !t || from.x <= t.left + t.width / 2;
  const LEAN = fromLeft ? -16 : 16; // degrees about the base; negative = top tips to the left
  const CATCH_ARM = 100; // arm angle at contact: out to the side and up, hand beside the head (not over the face)
  const k = t ? t.width / RIG.w : 1; // source px → screen px

  // Rig geometry, in the robot's own (unmirrored) frame: origin at the top-left of its box.
  const mirrorX = (x: number) => (fromLeft || !t ? x : t.width - x);
  const toScreen = (local: { x: number; y: number }, lean: number) => {
    if (!t) return local;
    const pivot = { x: t.width / 2, y: t.height * 0.85 };
    const d = { x: mirrorX(local.x) - pivot.x, y: local.y - pivot.y };
    const r = (lean * Math.PI) / 180;
    return {
      x: t.left + pivot.x + d.x * Math.cos(r) - d.y * Math.sin(r),
      y: t.top + pivot.y + d.x * Math.sin(r) + d.y * Math.cos(r),
    };
  };
  const shoulder = { x: RIG.arm.joint.x * k, y: RIG.arm.joint.y * k };
  const reach = {
    x: (RIG.arm.hand.x - RIG.arm.joint.x) * k,
    y: (RIG.arm.hand.y - RIG.arm.joint.y) * k,
  };
  /** The open hand, for an arm rotated `arm` degrees (CSS sense) and the body leaning `lean` degrees. */
  const handAt = (arm: number, lean: number) => {
    const r = (arm * Math.PI) / 180;
    return toScreen(
      {
        x: shoulder.x + reach.x * Math.cos(r) - reach.y * Math.sin(r),
        y: shoulder.y + reach.x * Math.sin(r) + reach.y * Math.cos(r),
      },
      lean,
    );
  };
  /** The arm angle that points the hand at a screen point. */
  const armToward = (p: { x: number; y: number }, lean: number) => {
    const s = toScreen(shoulder, lean);
    const r = (-lean * Math.PI) / 180;
    const dx0 = p.x - s.x;
    const dy0 = p.y - s.y;
    const dx = (dx0 * Math.cos(r) - dy0 * Math.sin(r)) * (fromLeft ? 1 : -1);
    const dy = dx0 * Math.sin(r) + dy0 * Math.cos(r);
    return Math.max(-10, Math.min(150, (Math.atan2(-dx, dy) * 180) / Math.PI));
  };

  const to = catching
    ? handAt(CATCH_ARM, LEAN)
    : t
      ? { x: t.left + t.width / 2, y: t.top + t.height * 0.55 }
      : { x: window.innerWidth - 40, y: window.innerHeight - 40 };
  const endScale = t
    ? Math.min(0.3, (t.width * 0.55) / box.width)
    : Math.min(0.22, 64 / box.width);
  const control = {
    x: (from.x + to.x) / 2,
    y: Math.min(from.y, to.y) - Math.max(120, Math.abs(to.x - from.x) * 0.25),
  };
  const STEPS = 24;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const p = i / STEPS;
    const x =
      (1 - p) ** 2 * from.x + 2 * (1 - p) * p * control.x + p ** 2 * to.x;
    const y =
      (1 - p) ** 2 * from.y + 2 * (1 - p) * p * control.y + p ** 2 * to.y;
    const scale = 1 - (1 - endScale) * p ** 0.8;
    frames.push({
      offset: p,
      transform: `translate(${x - from.x}px, ${y - from.y}px) scale(${scale}) rotate(${-16 * Math.sin(Math.PI * p) + (catching ? LEAN * p ** 3 : 0)}deg)`,
      opacity: !catching && p > 0.92 ? 0 : 1,
    });
  }
  env.el.style.transform = "none";
  // Caught: still moving when it meets the hand (the hand does the stopping). Not caught: glides in and fades.
  const flight = env.el.animate(frames, {
    duration: FLIGHT_MS,
    easing: catching
      ? "cubic-bezier(.4,.05,.7,.65)"
      : "cubic-bezier(.5,.05,.4,1)",
    fill: "forwards",
  });

  if (!catching || !t || !robotImg || !avatar) {
    await done(flight);
    onLand?.();
    env.el.remove();
    if (avatar && t) {
      avatar.launcher.animate(
        [{ scale: "1" }, { scale: "1.14" }, { scale: ".95" }, { scale: "1" }],
        { duration: 480, easing: "ease-out" },
      );
      ripple(t);
      await confetti(t);
    }
    return;
  }

  // The rig takes the docked robot's place for the catch.
  const state = { lean: 0, head: 0, arm: 0 };
  let tracking = false;
  let carrying = false;
  let running = true;
  const rig = fixed(
    document.createElement("div"),
    {
      left: `${t.left}px`,
      top: `${t.top}px`,
      width: `${t.width}px`,
      height: `${t.height}px`,
      transformOrigin: "50% 85%",
      filter: "drop-shadow(0 6px 12px rgba(0,0,0,.65))",
      opacity: "0",
    },
    LAYER - 1,
  );
  const inner = document.createElement("div");
  Object.assign(inner.style, {
    position: "absolute",
    inset: "0",
    scale: fromLeft ? "1" : "-1 1",
  });
  rig.appendChild(inner);
  const part = (
    src: string,
    b: { left: number; top: number; width: number; height: number },
    origin: string,
  ) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    Object.assign(img.style, {
      position: "absolute",
      left: `${b.left * k}px`,
      top: `${b.top * k}px`,
      width: `${b.width * k}px`,
      height: `${b.height * k}px`,
      transformOrigin: origin,
    });
    inner.appendChild(img);
    return img;
  };
  const headEl = part(
    RIG.head.src,
    RIG.head.box,
    `${((RIG.head.joint.x - RIG.head.box.left) / RIG.head.box.width) * 100}% ${((RIG.head.joint.y - RIG.head.box.top) / RIG.head.box.height) * 100}%`,
  );
  part(
    RIG.body.src,
    { left: 0, top: 0, width: RIG.w, height: RIG.h },
    "50% 50%",
  );
  const armEl = part(
    RIG.arm.src,
    RIG.arm.box,
    `${((RIG.arm.joint.x - RIG.arm.box.left) / RIG.arm.box.width) * 100}% ${((RIG.arm.joint.y - RIG.arm.box.top) / RIG.arm.box.height) * 100}%`,
  );
  const render = () => {
    if (!running) return;
    if (tracking) {
      const e = env.el.getBoundingClientRect();
      const target = armToward(
        { x: e.left + e.width / 2, y: e.top + e.height / 2 },
        state.lean,
      );
      state.arm += (target - state.arm) * 0.24; // follows with a little lag, like a real arm
    }
    rig.style.rotate = `${state.lean}deg`;
    headEl.style.rotate = `${state.head}deg`;
    armEl.style.rotate = `${state.arm}deg`;
    if (carrying) {
      const h = handAt(state.arm, state.lean);
      env.el.style.transform = `translate(${h.x - from.x}px, ${h.y - from.y}px) scale(${endScale}) rotate(${state.lean + (state.arm - CATCH_ARM) * 0.6}deg)`;
    }
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);

  // A third of the way in it spots the envelope: head turns to it, body leans, arm comes up to meet it.
  const previousVisibility = robotImg.style.visibility;
  const cleanup = () => {
    running = false;
    rig.remove();
    env.el.remove();
    robotImg.style.visibility = previousVisibility;
  };
  try {
    await wait(FLIGHT_MS * 0.33);
    robotImg.style.visibility = "hidden";
    rig.style.opacity = "1";
    tracking = true;
    void tween(state, "lean", LEAN, 360);
    void tween(state, "head", fromLeft ? -9 : 9, 320);
    await done(flight);

    // 4. Contact. The hand carries the envelope from here; it gives with the hit — arm and body follow
    //    the envelope's momentum, slow it, recoil, and settle a touch lower under the weight.
    tracking = false;
    flight.cancel();
    carrying = true;
    onLand?.();
    const give = fromLeft ? 1 : -1;
    rig.animate(
      [{ scale: "1" }, { scale: "1.03 .96", offset: 0.3 }, { scale: "1" }],
      { duration: 280, easing: "ease-out" },
    );
    await Promise.all([
      tween(state, "arm", state.arm + 13, 140),
      tween(state, "lean", LEAN + 7 * give, 140),
    ]);
    await Promise.all([
      tween(state, "arm", state.arm - 6, 220, easeInOut),
      tween(state, "lean", LEAN - 2 * give, 240, easeInOut),
    ]);
    await wait(260);

    // 5. It straightens up and brings the envelope across to its chest — the arm swings down and over,
    //    the hand still holding it — then the envelope goes in and the arm drops back to its side.
    void tween(state, "head", 0, 420, easeInOut);
    await Promise.all([
      tween(state, "lean", 0, 520, easeOutBack),
      tween(state, "arm", -92, 640, easeInOut),
    ]);
    carrying = false;
    const chest = toScreen({ x: RIG.chest.x * k, y: RIG.chest.y * k }, 0);
    const tuck = env.el.animate(
      [
        { transform: env.el.style.transform, opacity: 1 },
        {
          transform: `translate(${chest.x - from.x}px, ${chest.y - from.y}px) scale(${endScale * 0.3}) rotate(0deg)`,
          opacity: 0,
        },
      ],
      { duration: 240, easing: "ease-in", fill: "forwards" },
    );
    await Promise.all([done(tuck), tween(state, "arm", 0, 380, easeInOut)]);
  } finally {
    // The launcher lives in the root layout: a robot left hidden here would stay hidden on every page.
    cleanup();
  }

  // 6. Delivered.
  avatar.launcher.animate(
    [
      { scale: "1" },
      { scale: "1.14" },
      { scale: ".95" },
      { scale: "1.03" },
      { scale: "1" },
    ],
    { duration: 480, easing: "ease-out" },
  );
  ripple(t);
  await confetti(t);
}
