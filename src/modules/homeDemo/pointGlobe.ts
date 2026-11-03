import { CURRENCY_ROUTES, routePairLabel, type CurrencyHub } from "./currencyRoutes";

// Orthographic earth. Precompute latitude, lighting and land samples once;
// each frame only shifts longitude and projects the visible point field.
const TAU = Math.PI * 2;
const TILT = 15 * Math.PI / 180;
const COS_TILT = Math.cos(TILT), SIN_TILT = Math.sin(TILT);
const CENTER = 320, RADIUS = 285;
const tones = ["#66777759", "#80908970", "#728d80", "#937478", "#aabbb2", "#d1c4be", "#eaf1e9"];
type LandMask = { width: number; height: number; data: Uint8ClampedArray };

async function readLandMask(): Promise<LandMask> {
  const img = new Image();
  img.src = "/home-globe/land-mask.png";
  await img.decode();
  const source = document.createElement("canvas");
  source.width = img.naturalWidth; source.height = img.naturalHeight;
  const ctx = source.getContext("2d", { willReadFrequently:true });
  if (!ctx) throw new Error("Map sampling unavailable");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, source.width, source.height);
}

function surfacePoints(mask: LandMask) {
  const points = [];
  const count = 16500;
  for (let i = 0; i < count; i++) {
    const noise = Math.sin((i + 1) * 127.1) * 43758.5453;
    const seed = noise - Math.floor(noise);
    const y = 1 - 2 * (i + .5) / count;
    const lon = (((i * .618033988749895 + (seed - .5) * .0016) % 1 + 1) % 1 - .5) * TAU;
    const lat = Math.asin(y);
    const u = Math.min(mask.width-1, Math.floor((lon / TAU + .5) * mask.width));
    const v = Math.floor((.5 - lat / Math.PI) * mask.height);
    const land = mask.data[(v * mask.width + u) * 4] > 108;
    if (!land && seed > .14) continue;
    const belt = Math.abs(lat - .52 * Math.sin(lon * 2.2 + .45));
    const beacon = land && (seed > .979 || (belt < .09 && seed > .74));
    const ring = Math.sqrt(1 - y * y);
    points.push({ x:ring * Math.sin(lon), y, z:ring * Math.cos(lon), land, beacon, seed });
  }
  return points;
}

function makeSurface(mask: LandMask) {
  const image = document.createElement("canvas");
  const side = 176;
  image.width = image.height = side;
  const context = image.getContext("2d");
  if (!context) throw new Error("Globe surface unavailable");
  const ctx = context;
  const pixels = ctx.createImageData(side, side);
  const texels = new Int32Array(side * side).fill(-1);
  const sea = new Uint8Array(side * side * 3), land = new Uint8Array(sea.length);
  for (let i = 0; i < texels.length; i++) {
    const x = 2 * ((i % side + .5) / side) - 1, y = 1 - 2 * ((Math.floor(i / side) + .5) / side);
    const r = x * x + y * y;
    if (r >= 1) continue;
    const z = Math.sqrt(1 - r);
    const lon = Math.atan2(x, z * COS_TILT - y * SIN_TILT);
    const lat = Math.asin(y * COS_TILT + z * SIN_TILT);
    const u = Math.floor((lon / TAU + .5) * mask.width) % mask.width;
    const v = Math.min(mask.height - 1, Math.floor((.5 - lat / Math.PI) * mask.height));
    texels[i] = v * mask.width + u;
    const west = (1 - x) / 2, east = 1 - west, rim = Math.pow(1 - z, 2);
    sea.set([7 + 3*east + 4*rim, 8 + 5*west + 3*rim, 10 + 2*rim], i*3);
    land.set([12 + 15*east + 5*rim, 11 + 18*west + 4*y, 13 + 9*west + 4*east], i*3);
    pixels.data[i*4 + 3] = Math.min(255, (1 - Math.sqrt(r)) * side * 128);
  }
  let lastColumn = -1;
  function paint(angle: number) {
    const offset = Math.floor(angle / TAU * mask.width);
    if (lastColumn === offset) return image;
    lastColumn = offset;
    for (let i = 0; i < texels.length; i++) {
      const address = texels[i];
      if (address < 0) continue;
      const u = address % mask.width;
      const sample = address - u + (u + offset) % mask.width;
      const coverage = mask.data[sample * 4] / 255;
      for (let c = 0; c < 3; c++) pixels.data[i*4+c] = sea[i*3+c] + coverage * (land[i*3+c] - sea[i*3+c]);
    }
    ctx.putImageData(pixels, 0, 0);
    return image;
  }
  return paint;
}


type Vector = { x: number; y: number; z: number };
type ScreenPoint = { x: number; y: number; depth: number };
const STEPS = 64;
const DEPART = 550, TRAVEL = 3100, ARRIVE = 700;
const LEG_TIME = DEPART + TRAVEL + ARRIVE;

function unitPoint(hub: CurrencyHub): Vector {
  const lat = hub.lat * Math.PI / 180, lon = hub.lon * Math.PI / 180;
  return { x: Math.cos(lat) * Math.sin(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.cos(lon) };
}

const tracks = CURRENCY_ROUTES.map(({ from, to }) => {
  const start = unitPoint(from), end = unitPoint(to);
  const distance = Math.acos(Math.max(-1, Math.min(1, start.x * end.x + start.y * end.y + start.z * end.z)));
  const denominator = Math.sin(distance);
  const lift = .045 + .057 * distance / Math.PI;
  // Spherical interpolation follows the shortest great circle, including
  // Sydney–New York across the dateline. Lift vanishes at both city locations.
  const points = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS, h = 1 + lift * Math.sin(Math.PI * t);
    const a = Math.sin((1 - t) * distance) / denominator, b = Math.sin(t * distance) / denominator;
    return { x: h * (a * start.x + b * end.x), y: h * (a * start.y + b * end.y), z: h * (a * start.z + b * end.z) };
  });
  const middle = points[STEPS / 2];
  const ahead = points[Math.round(STEPS * .625)];
  const heading = Math.atan2(middle.x, middle.z), turn = Math.atan2(ahead.x, ahead.z) - heading;
  return { points, heading, pan: Math.atan2(Math.sin(turn), Math.cos(turn)) };
});

function project({ x, y, z }: Vector, sin: number, cos: number): ScreenPoint {
  const ahead = x * sin + z * cos;
  return {
    x: CENTER + RADIUS * (x * cos - z * sin),
    y: CENTER - RADIUS * (y * COS_TILT - ahead * SIN_TILT),
    depth: ahead * COS_TILT + y * SIN_TILT,
  };
}

function exposed(p: ScreenPoint) {
  // Elevated segments on the far side can still be seen above the limb.
  return p.depth >= 0 || (p.x - CENTER) ** 2 + (p.y - CENTER) ** 2 > RADIUS ** 2;
}

function between(a: ScreenPoint, b: ScreenPoint, t: number): ScreenPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, depth: a.depth + (b.depth - a.depth) * t };
}

function visiblePath(points: ScreenPoint[]) {
  const path = new Path2D();
  let lastVisible = exposed(points[0]);
  if (lastVisible) path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const p = points[i], visible = exposed(p);
    if (visible !== lastVisible) {
      // Find where this segment meets the globe silhouette instead of
      // drawing through the earth or flashing between neighboring samples.
      let low = 0, high = 1;
      for (let n = 0; n < 7; n++) {
        const t = (low + high) / 2;
        if (exposed(between(points[i - 1], p, t)) === lastVisible) low = t;
        else high = t;
      }
      const limb = between(points[i - 1], p, (low + high) / 2);
      if (visible) path.moveTo(limb.x, limb.y);
      else path.lineTo(limb.x, limb.y);
    }
    if (visible) path.lineTo(p.x, p.y);
    lastVisible = visible;
  }
  return path;
}

function cityRing(ctx: CanvasRenderingContext2D, p: ScreenPoint, color: string) {
  if (p.depth <= 0) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 5, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 1.7, 0, TAU);
  ctx.fill();
}

type LabelBox = { x: number; y: number; w: number; h: number };

function placeLabel(anchor: ScreenPoint, w: number, h: number, side: number, vertical: number, occupied: LabelBox[]) {
  // Try both sides of the hub before moving further away. This keeps nearby
  // cities distinct and leaves the travelling code and all three dots clear.
  for (const gap of [9, h + 14, h * 2 + 18]) {
    const xSide = side > 0 ? gap : -w - gap, xOther = side > 0 ? -w - gap : gap;
    const ySide = vertical > 0 ? gap : -h - gap, yOther = vertical > 0 ? -h - gap : gap;
    for (const [dx, dy] of [[xSide, ySide], [xSide, yOther], [xOther, ySide], [xOther, yOther], [-w / 2, ySide], [-w / 2, yOther]]) {
      const x = Math.max(4, Math.min(636 - w, anchor.x + dx)), y = Math.max(4, Math.min(636 - h, anchor.y + dy));
      if (occupied.some(r => x < r.x + r.w + 3 && x + w + 3 > r.x && y < r.y + r.h + 3 && y + h + 3 > r.y)) continue;
      const box = { x, y, w, h };
      occupied.push(box);
      return box;
    }
  }
}

function paintLabel(ctx: CanvasRenderingContext2D, text: string, anchor: ScreenPoint, side: number, vertical: number,
  occupied: LabelBox[], font: number, color: string, currency = false) {
  ctx.font = currency ? `600 ${font}px ui-monospace, monospace` : `500 ${font}px system-ui, sans-serif`;
  const box = placeLabel(anchor, ctx.measureText(text).width + font * .78, font * 1.45, side, vertical, occupied);
  if (!box) return;
  ctx.fillStyle = currency ? "#091711" : "rgba(7,14,11,.84)";
  ctx.fillRect(box.x, box.y, box.w, box.h);
  if (currency) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(168,222,194,.56)";
    ctx.strokeRect(box.x, box.y, box.w, box.h);
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, box.x + box.w / 2, box.y + box.h / 2);
}

/** Spin across one leg: whole turns, so the coin lands face up still carrying
 *  FROM; the sign only changes hands in the flip once it reaches the city. */
const SPIN = 4 * Math.PI;

/** A small metal coin carrying the currency sign; `turn` fakes a 3D spin by
 *  squeezing it horizontally (|cos| of the spin angle). */
function paintCoin(ctx: CanvasRenderingContext2D, at: ScreenPoint, radius: number, turn: number, sign: string) {
  const squeeze = Math.max(.07, Math.abs(Math.cos(turn)));
  ctx.save();
  ctx.translate(at.x, at.y);
  // The edge: a darker band that shows as the face turns away.
  const edge = radius * .16 * (1 - squeeze);
  if (edge > .2) {
    ctx.fillStyle = "#6f5420";
    ctx.beginPath();
    ctx.ellipse(Math.sign(Math.sin(turn) || 1) * edge, 0, radius * squeeze, radius, 0, 0, TAU);
    ctx.fill();
  }
  ctx.scale(squeeze, 1);
  const face = ctx.createRadialGradient(-radius * .35, -radius * .4, radius * .1, 0, 0, radius);
  face.addColorStop(0, "#fbecb8");
  face.addColorStop(.55, "#dcb75e");
  face.addColorStop(1, "#a07a2c");
  ctx.fillStyle = face;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.fill();
  ctx.lineWidth = radius * .14;
  ctx.strokeStyle = "#8a6726";
  ctx.beginPath(); ctx.arc(0, 0, radius - ctx.lineWidth / 2, 0, TAU); ctx.stroke();
  ctx.lineWidth = Math.max(.6, radius * .05);
  ctx.strokeStyle = "rgba(255,240,196,.7)";
  ctx.beginPath(); ctx.arc(0, 0, radius * .7, 0, TAU); ctx.stroke();
  ctx.fillStyle = "#3b2a07";
  ctx.font = `700 ${radius * (sign.length > 1 ? .78 : 1.02)}px system-ui, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(sign, 0, radius * .05);
  ctx.restore();
}

function drawRoutes(ctx: CanvasRenderingContext2D, sin: number, cos: number, index: number, progress: number, width: number,
  pair: string, arrive: number, still: boolean) {
  let selected: ScreenPoint[] = [];
  ctx.save();
  ctx.lineJoin = ctx.lineCap = "round";
  for (const [i, track] of tracks.entries()) {
    const projected = track.points.map(p => project(p, sin, cos));
    if (i === index) { selected = projected; continue; }
    ctx.strokeStyle = "rgba(130,179,151,.33)";
    ctx.lineWidth = 1.35;
    ctx.stroke(visiblePath(projected));
  }
  const start = selected[0], end = selected[STEPS];
  const color = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
  color.addColorStop(0, "#9dddb6");
  color.addColorStop(1, "#d7a09c");
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.45;
  ctx.stroke(visiblePath(selected));
  cityRing(ctx, start, "#a8dec2");
  cityRing(ctx, end, "#e1a7a2");

  // Reduced motion: the coin rests at the destination, face up, no spin.
  const travelled = still ? 1 : progress;
  const along = (t: number) => {
    const offset = t * STEPS, i = Math.min(STEPS - 1, Math.floor(offset));
    return between(selected[i], selected[i + 1], offset - i);
  };
  const bead = along(travelled);
  const route = CURRENCY_ROUTES[index], visibleBead = exposed(bead);
  const scale = 640 / Math.max(1, width);
  // ~26 CSS px across, plus a short landing bounce.
  const landing = still ? 0 : Math.sin(Math.PI * Math.min(1, arrive * 1.6)) * (1 - arrive);
  const coin = Math.min(24, Math.max(10, 13.5 * scale)) * (1 + .28 * landing);
  const occupied = [start, end].filter(exposed).map(p => ({ x: p.x - 5, y: p.y - 5, w: 10, h: 10 }));
  if (visibleBead) occupied.push({ x: bead.x - coin, y: bead.y - coin, w: coin * 2, h: coin * 2 });
  const font = Math.min(28, Math.max(14, 11 * scale));
  const side = start.x <= end.x ? -1 : 1, vertical = start.y <= end.y ? -1 : 1;
  if (visibleBead) {
    // A faint trail of fading sparks behind the coin while it travels.
    if (!still && progress > 0 && progress < 1) {
      for (const [lag, alpha] of [[.025, .5], [.05, .32], [.08, .18], [.115, .09]]) {
        const spark = along(Math.max(0, travelled - lag));
        if (!exposed(spark)) continue;
        ctx.fillStyle = `rgba(232,214,150,${alpha})`;
        ctx.beginPath(); ctx.arc(spark.x, spark.y, coin * (.42 - lag * 2), 0, TAU); ctx.fill();
      }
    }
    const halo = coin * 1.9;
    const glow = ctx.createRadialGradient(bead.x, bead.y, coin * .6, bead.x, bead.y, halo);
    glow.addColorStop(0, "rgba(240,222,160,.42)");
    glow.addColorStop(1, "rgba(240,222,160,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(bead.x - halo, bead.y - halo, halo * 2, halo * 2);
    // Landing pulse: a ring that widens and fades at the destination.
    if (!still && arrive > 0 && arrive < 1) {
      ctx.strokeStyle = `rgba(240,222,160,${.6 * (1 - arrive)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(bead.x, bead.y, coin * (1 + arrive * 1.4), 0, TAU); ctx.stroke();
    }
    // FROM rides the whole route; on landing the coin flips once and shows TO from edge-on.
    const flip = still ? Math.PI : Math.PI * arrive * arrive * (3 - 2 * arrive);
    const sign = flip < Math.PI / 2 ? route.from.symbol : route.to.symbol;
    paintCoin(ctx, bead, coin, still ? 0 : travelled * SPIN + flip, sign);

    paintLabel(ctx, pair, bead, -side, -1, occupied, font, "#dcf2e2", true);
  }
  if (start.depth > 0) paintLabel(ctx, `${route.from.city} · ${route.from.code}`, start, side, vertical, occupied, font, "#c9e4d2");
  if (end.depth > 0) paintLabel(ctx, `${route.to.city} · ${route.to.code}`, end, -side, -vertical, occupied, font, "#efd0c9");
  ctx.restore();
}

type RouteOptions = { initialLeg?: number; onLegChange?: (index: number) => void; still?: boolean };

export async function mountGlobe(canvas: HTMLCanvasElement, { initialLeg = 0, onLegChange, still: initialStill = false }: RouteOptions = {}) {
  const context = canvas.getContext("2d");
  if (!context || typeof Path2D === "undefined") throw new Error("Globe canvas unavailable");
  const ctx = context;
  const mask = await readLandMask(), points = surfacePoints(mask), paintSurface = makeSurface(mask);
  let index = tracks[initialLeg] ? initialLeg : 0;
  let legTime = 0, follow = true, disposed = false, still = initialStill;
  // Comet labels per leg ("SGD → JPY", with the feed's rate when it has one).
  let pairs: readonly string[] = CURRENCY_ROUTES.map(route => routePairLabel(route, null));
  let angle = tracks[index].heading, inView = false, playing = false, held = false;
  // Tablets and touch screens paint a lighter backing store than desktops.
  const maxRatio = matchMedia("(max-width:1099px), (pointer:coarse)").matches ? 1.25 : 1.5;
  function announce() {
    canvas.dataset.routeIndex = String(index);
    canvas.dataset.routeCurrency = CURRENCY_ROUTES[index].from.code;
    onLegChange?.(index);
  }
  let frame = 0, timer = 0, last = 0;
  function draw() {
    angle = (angle % TAU + TAU) % TAU;
    const ratio = Math.min(window.devicePixelRatio || 1, maxRatio);
    const size = Math.max(1, Math.round(canvas.clientWidth * ratio));
    if (size !== canvas.width || size !== canvas.height) canvas.width = canvas.height = size;
    ctx.setTransform(size/640, 0, 0, size/640, 0, 0);
    ctx.clearRect(0, 0, 640, 640);
    ctx.drawImage(paintSurface(angle), CENTER-RADIUS, CENTER-RADIUS, RADIUS*2, RADIUS*2);
    const paths = tones.map(() => new Path2D());
    const sin = Math.sin(angle), cos = Math.cos(angle);
    for (const dot of points) {
      const x = dot.x*cos - dot.z*sin, z = dot.x*sin + dot.z*cos;
      const depth = z*COS_TILT + dot.y*SIN_TILT;
      if (depth <= 0) continue;
      const y = dot.y*COS_TILT - z*SIN_TILT;
      const px = CENTER+RADIUS*x, py = CENTER-RADIUS*y;
      const light = depth*.58 - x*.24 + y*.18 + dot.seed*.48;
      const tone = !dot.land ? (dot.seed < .07 ? 0 : 1) : dot.beacon ? (light>.68 ? 6 : 5) :
        (light > .87 ? 4 : x < .16 ? 2 : 3);
      const path = paths[tone];
      const radius = (dot.beacon ? 1.1 + dot.seed*1.1 : dot.land ? .47 + .5*dot.seed : .38) * (.58 + .51*depth);
      if (radius < .62) path.rect(px-radius*.75, py-radius*.75, radius*1.5, radius*1.5);
      else { path.moveTo(px+radius, py); path.arc(px, py, radius, 0, TAU); }
    }
    paths.forEach((path, i) => { ctx.fillStyle = tones[i]; ctx.fill(path); });
    const progress = Math.max(0, Math.min(1, (legTime - DEPART) / TRAVEL));
    const arrive = Math.max(0, Math.min(1, (legTime - DEPART - TRAVEL) / ARRIVE));
    drawRoutes(ctx, sin, cos, index, progress, canvas.clientWidth, pairs[index] ?? routePairLabel(CURRENCY_ROUTES[index], null), arrive, still);
    const value = progress.toFixed(3);
    if (canvas.dataset.routeProgress !== value) canvas.dataset.routeProgress = value;
    if (canvas.dataset.ready === undefined) canvas.dataset.ready = "";
  }
  function stop() {
    cancelAnimationFrame(frame); clearTimeout(timer);
    frame = timer = last = 0;
  }
  function tick(now: number) {
    if (disposed || !inView || document.hidden || !playing || held) return;
    if (last) {
      const dt = Math.min(100, now - last);
      legTime += dt;
      if (legTime >= LEG_TIME) {
        legTime -= LEG_TIME;
        index = (index + 1) % tracks.length;
        announce();
      }
      if (follow) {
        // Take the shorter turn across ±180°. A drag gives camera ownership
        // to the visitor until they select or explicitly focus a leg again.
        const progress = Math.max(0, Math.min(1, (legTime - DEPART) / TRAVEL));
        const track = tracks[index];
        const delta = track.heading + progress * track.pan - angle;
        angle += Math.atan2(Math.sin(delta), Math.cos(delta)) * (1 - Math.exp(-dt / 550));
      }
    }
    last = now; draw();
    timer = window.setTimeout(() => { frame = requestAnimationFrame(tick); }, 40);
  }
  function sync() {
    stop();
    if (!disposed && inView && !document.hidden) {
      draw();
      if (playing && !held) frame = requestAnimationFrame(tick);
    }
  }
  const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
  observer.observe(canvas);
  const resize = new ResizeObserver(sync);
  resize.observe(canvas);
  document.addEventListener("visibilitychange", sync);
  function focusLeg() {
    if (disposed) return;
    follow = true;
    angle = tracks[index].heading;
    if (inView && !document.hidden) draw();
  }
  announce();
  return {
    selectLeg(next: number) {
      if (disposed || !tracks[next]) return;
      if (index !== next) {
        index = next; legTime = 0; last = 0;
        announce();
      }
      focusLeg();
    },
    focusLeg,
    setStill(value: boolean) {
      if (disposed || still === value) return;
      still = value;
      if (inView && !document.hidden) draw();
    },
    setPairs(next: readonly string[]) {
      if (disposed || next.join() === pairs.join()) return;
      pairs = next;
      if (inView && !document.hidden) draw();
    },
    setPlaying(value: boolean) { if (playing !== value) { playing = value; sync(); } },
    hold(value: boolean) { if (held !== value) { held = value; sync(); } },
    rotate(radians: number) {
      if (disposed || !Number.isFinite(radians)) return;
      follow = false;
      angle += radians;
      if (inView && !document.hidden) draw();
    },
    dispose() {
      disposed = true;
      stop(); observer.disconnect(); resize.disconnect();
      document.removeEventListener("visibilitychange", sync);
      delete canvas.dataset.ready;
      delete canvas.dataset.routeIndex;
      delete canvas.dataset.routeCurrency;
      delete canvas.dataset.routeProgress;
    },
  };
}
