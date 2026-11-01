import { createFollowingLogo as createFace } from '../face-follow.js';

function smooth(low, high, value) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

function pixels(image, size) {
  const buffer = document.createElement('canvas');
  buffer.width = buffer.height = size;
  const context = buffer.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, size, size);
  return context.getImageData(0, 0, size, size).data;
}

// Each material pixel describes the approved artwork at the same coordinate.
// The red channel directs the traveling front around the real ribbon bends.
export async function createFollowingLogo(mount, canvas) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.hidden = true;
    return createFace(mount);
  }
  const map = new Image();
  map.src = new URL('./ribbon-material.webp', import.meta.url).href;
  // Decode the gold map in parallel with the approved art. If the optional
  // map is missing, retain ownership of the successfully created live surface.
  const [face, mapped] = await Promise.all([createFace(mount), map.decode().then(() => true, () => false)]);
  if (!mapped) { canvas.hidden = true; return face; }
  const context = canvas.getContext('2d');
  if (!context) { canvas.hidden = true; return face; }

  const size = Math.max(96, Math.min(map.width, Math.round(mount.getBoundingClientRect().width * .94)));
  canvas.width = canvas.height = size;
  const art = pixels(mount.querySelector('img'), size);
  const material = pixels(map, size);
  const output = context.createImageData(size, size);
  const surface = new Float32Array(256);
  const visible = [];
  const spread = new Uint8Array(size * size);
  for (let i = 0; i < 256; i++) surface[i] = (i / 255) ** 1.2 * .21;
  for (let i = 0; i < art.length; i += 4) {
    const alpha = art[i + 3] / 255;
    output.data[i + 3] = 255;
    if (!alpha && !material[i + 1] && !material[i + 2]) continue;
    visible.push(i);
    const col = (i / 4) % size;
    const left = col >= 2 ? i - 8 : i;
    const up = i >= size * 8 ? i - size * 8 : i;
    const right = col + 2 < size ? i + 8 : i;
    const down = i + size * 8 < art.length ? i + size * 8 : i;
    spread[i / 4] = (material[left + 1] + material[right + 1] + material[up + 1] + material[down + 1]) / 4;
  }
  const indices = new Uint32Array(visible);
  const front = new Float32Array(256);
  const body = new Float32Array(256);
  const fill = new Float32Array(256);
  const gold = [255, 198, 108];
  let previousFrame = -1;

  function paintGold(progress) {
    // Use a normalized clock so each ribbon keeps the same reveal order.
    const t = progress * 5.4;
    for (let i = 0; i < 256; i++) {
      const path = i / 255;
      const age = t - (.11 + 2.48 * path);
      const crest = Math.exp(-(((age - .15) / .22) ** 2));
      const pass = smooth(-.09, .25, age);
      // Illuminated ridges retain their gold until the same ridge takes its final color.
      front[i] = pass * (.84 + .16 * crest);
      body[i] = pass * (.53 + .17 * crest);
      fill[i] = smooth(0, 1.54, t - (1.98 + 1.62 * path));
    }
    const out = output.data;
    for (const i of indices) {
      const path = material[i];
      const ridge = (material[i + 1] + spread[i / 4] * .16) / 255;
      const energy = ridge * front[path] + surface[material[i + 2]] * body[path];
      const color = fill[path];
      const highlight = Math.max(0, energy - .44) * 48;
      const amount = energy * 1.37;
      out[i]     = gold[0] * amount + highlight;
      out[i + 1] = gold[1] * amount * .79 + highlight;
      out[i + 2] = gold[2] * amount * .60 + highlight;
      // The approved artwork is always underneath this layer at its native sampling.
      out[i + 3] = 255 * (1 - color);
    }
    context.putImageData(output, 0, 0);
  }
  return {
    draw(progress, options) {
      const fraction = options.reducedMotion ? 1 : progress;
      canvas.style.opacity = String(1 - smooth(.84, 1, fraction));
      if (fraction < 1 && previousFrame !== fraction) paintGold(fraction);
      face.draw(1, options);
      previousFrame = progress;
    },
    setActive(active) { face.setActive(active); },
    dispose() {
      canvas.hidden = true;
      canvas.width = canvas.height = 1;
      face.dispose();
    }
  };
}
