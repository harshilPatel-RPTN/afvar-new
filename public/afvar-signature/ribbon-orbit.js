// The approved image is sampled once. Its blue, red and green materials all
// keep the same value, highlight detail and outline. During motion the browser
// composites cached textures; it never loops over the logo's pixels again.
const tau = Math.PI * 2;
const period = 6400;
const players = new Set();
let reduced, visibleSince, elapsed = 0, timer = 0, frame = 0;
let frozen = false, pageAway = false;
const materials = new Map();

function canvas(size, read = false) {
  const node = document.createElement('canvas');
  node.width = node.height = size;
  const ctx = node.getContext('2d', read ? {willReadFrequently:true} : undefined);
  if (!ctx) throw new Error('Ribbon canvas unavailable');
  return ctx;
}

function smooth(a, b, v) {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function makeMaterials(image, size) {
  const ref = canvas(size, true);
  ref.drawImage(image, 0, 0, size, size);
  const original = ref.getImageData(0, 0, size, size);
  const blue = canvas(size), red = canvas(size), green = canvas(size);
  const variants = [blue, red, green].map(ctx => ctx.createImageData(size, size));
  const [base, warm, cool] = variants.map(data => data.data);
  const src = original.data;
  for (let i = 0; i < src.length; i += 4) {
    base[i + 3] = 255;
    if (!src[i + 3]) continue;
    const r = src[i], g = src[i + 1], b = src[i + 2];
    const hi = Math.max(r, g, b), lo = Math.min(r, g, b), c = hi - lo;
    const x = ((i / 4) % size + .5) / size - .5;
    const y = (Math.floor(i / (4 * size)) + .5) / size - .5;
    // Protect the eyes, nose and their adjoining folds. The color follows
    // the outer ribbon and its horns, never the black holes or facial patches.
    const edge = smooth(.26, .405, Math.hypot(x, y));
    const h = !c ? 0 : hi === r ? ((g - b) / c + 6) % 6 :
      hi === g ? 2 + (b - r) / c : 4 + (r - g) / c;
    let br = r, bg = g, bb = b;
    if (c && edge && (h < 3 || h > 4.08)) {
      // Remap the baked red and green to the *adjacent* cyan/blue material.
      // Both limits meet continuously at their original blue neighbours.
      const neutral = h < 3 ? 3 + (3 - h) * .23 : 4.08 - (h - 4.08) * .203;
      br += (lo + c * Math.max(0, neutral - 4) - r) * edge;
      bg += (lo + c * Math.max(0, 4 - neutral) - g) * edge;
      bb += (hi - b) * edge;
    }
    base[i] = br; base[i+1] = bg; base[i+2] = bb;
    warm[i] = hi; warm[i+1] = lo + .025 * c; warm[i+2] = lo + .215 * c;
    cool[i] = lo + .015 * c; cool[i+1] = hi; cool[i+2] = lo + .40 * c;
    warm[i+3] = cool[i+3] = Math.round(255 * edge);
  }
  [blue, red, green].forEach((ctx, i) => ctx.putImageData(variants[i], 0, 0));
  return {blue:blue.canvas, red:red.canvas, green:green.canvas, alpha:ref.canvas};
}

// An oversize alpha wheel can rotate without any bounding-box corner cutting
// into a foot of the A. Both materials are stationary inside that wheel.
function makeMask(size, shoulder, feather) {
  const side = Math.ceil(size * Math.SQRT2) + 4;
  const ctx = canvas(side);
  const field = ctx.createConicGradient(-Math.PI / 2, side / 2, side / 2);
  for (let i = 0; i <= 128; i++) {
    const f = i / 128;
    const alpha = 1 - smooth(shoulder, feather, Math.min(f, 1 - f) * 360);
    field.addColorStop(f, 'rgba(255,255,255,' + alpha.toFixed(4) + ')');
  }
  ctx.fillStyle = field; ctx.fillRect(0, 0, side, side);
  return ctx.canvas;
}

function getMaterials(image, size) {
  const key = image.currentSrc + ':' + size;
  let set = materials.get(key);
  if (!set) {
    set = makeMaterials(image, size);
    set.redMask = makeMask(size, 13, 55);
    set.greenMask = makeMask(size, 33, 87);
    // Small set of logo variants (desktop/mobile and dock/full) only.
    if (materials.size >= 8) materials.delete(materials.keys().next().value);
    materials.set(key, set);
  }
  return set;
}

function phase(now) {
  if (visibleSince != null) {
    // Some embedders suspend the compositor without dispatching freeze or
    // visibilitychange. An unpainted interval is not part of the animation.
    const delta = Math.max(0, now - visibleSince);
    if (delta < 250) elapsed += delta;
    visibleSince = Math.max(visibleSince, now);
  }
  return tau * (elapsed % period) / period;
}

function cancel() {
  clearTimeout(timer); cancelAnimationFrame(frame); timer = frame = 0;
}

function renderPlayer(player, now) {
  try {
    player.render(phase(now));
    player.next = now + player.interval;
    return true;
  } catch {
    // A missing conic-gradient implementation or a lost canvas must leave
    // the real artwork visible, including after changing a motion preference.
    player.show(false);
    player.failed = true;
    players.delete(player);
    return false;
  }
}

function paint(now) {
  timer = frame = 0;
  if (visibleSince == null) return;
  let next = Infinity;
  for (const player of players) {
    if (!player.active) continue;
    if (now >= player.next - 1 && !renderPlayer(player, now)) continue;
    next = Math.min(next, player.next);
  }
  if (next !== Infinity) {
    timer = setTimeout(() => { timer = 0; frame = requestAnimationFrame(paint); },
      Math.max(0, next - performance.now() - 5));
  }
}

function schedule() {
  if (!timer && !frame && visibleSince != null &&
      [...players].some(p => p.active)) frame = requestAnimationFrame(paint);
}

function preferences() {
  const now = performance.now();
  const running = !document.hidden && !reduced.matches && !frozen && !pageAway;
  if (!running && visibleSince != null) {
    phase(now);
    visibleSince = null;
  } else if (running && visibleSince == null) {
    visibleSince = now;
  }
  cancel();
  for (const player of players) {
    if (running && player.active && !renderPlayer(player, now)) continue;
    player.show(!reduced.matches);
    if (reduced.matches) player.next = 0;
  }
  schedule();
}

function startClock() {
  if (reduced) return;
  reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('visibilitychange', preferences);
  reduced.addEventListener('change', preferences);
  document.addEventListener('freeze', () => { frozen = true; preferences(); });
  document.addEventListener('resume', () => { frozen = false; preferences(); });
  window.addEventListener('pagehide', () => { pageAway = true; preferences(); });
  window.addEventListener('pageshow', () => { pageAway = frozen = false; preferences(); });
  preferences();
}

export function createRibbonOrbit(container, image, compact) {
  const size = compact ? Math.min(128, Math.max(64, Math.ceil((container.parentElement?.offsetWidth || 48) * Math.min(devicePixelRatio || 1, 2)))) :
    Math.min(image.naturalWidth, 512);
  let set;
  const surface = canvas(size), scratch = canvas(size);
  const node = surface.canvas;
  node.dataset.ribbonOrbit = '';
  node.setAttribute('aria-hidden','true');
  Object.assign(node.style, {position:'absolute', inset:'0', width:'100%', height:'100%', pointerEvents:'none'});
  container.append(node);

  function pass(texture, mask, angle) {
    scratch.globalCompositeOperation = 'copy';
    scratch.drawImage(texture, 0, 0);
    scratch.globalCompositeOperation = 'destination-in';
    scratch.save();
    scratch.translate(size / 2, size / 2);
    scratch.rotate(angle);
    scratch.drawImage(mask, -mask.width / 2, -mask.height / 2);
    scratch.restore();
    surface.drawImage(scratch.canvas, 0, 0);
  }

  function render(theta) {
    set ??= getMaterials(image, size);
    const angle = theta - .12;
    surface.globalCompositeOperation = 'copy';
    surface.drawImage(set.blue, 0, 0);
    surface.globalCompositeOperation = 'source-over';
    pass(set.red, set.redMask, angle);
    pass(set.green, set.greenMask, angle + Math.PI);
    // Mask the opaque RGB composition exactly once, including antialiased edges.
    surface.globalCompositeOperation = 'destination-in';
    surface.drawImage(set.alpha, 0, 0);
  }

  function show(moving) {
    node.style.display = moving ? 'block' : 'none';
    image.style.visibility = moving ? 'hidden' : 'visible';
  }

  startClock();
  const player = {active:true, failed:false, render, show, next:0, interval:compact ? 1000 / 24 : 1000 / 30};
  players.add(player);
  const moving = visibleSince != null && renderPlayer(player, performance.now());
  show(moving);
  schedule();
  return {
    setActive(active) {
      if (player.failed) return;
      player.active = Boolean(active);
      if (player.active && visibleSince != null) {
        if (renderPlayer(player, performance.now())) show(true);
      }
      schedule();
    },
    dispose() {
      players.delete(player);
      if (![...players].some(p => p.active)) cancel();
      node.remove(); node.width = node.height = scratch.canvas.width = scratch.canvas.height = 1;
      image.style.visibility = '';
    }
  };
}
