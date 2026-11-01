const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const glide = t => t * t * t * (10 + t * (-15 + t * 6));
const mix = (a, b, t) => a + (b - a) * t;

export function createLockup(stage, caption, backdrop, nameTarget) {
  const supportsIris = CSS.supports('mask-image', 'radial-gradient(transparent, black)') ||
    CSS.supports('-webkit-mask-image', 'radial-gradient(transparent, black)');
  let lastOpening = null;
  let layout;

  function measure(anchor, viewport) {
    const name = nameTarget.getBoundingClientRect();
    const width = stage.offsetWidth;
    const nameWidth = Math.min(350, Math.max(132, width * .81));
    const gap = viewport.height <= 390 ? -3 : Math.max(3, Math.min(12, viewport.height * .012));
    const dx = anchor.left + anchor.width / 2 - viewport.left;
    const dy = anchor.top + anchor.height / 2 - viewport.top;
    lastOpening = null;
    layout = {
      width, nameWidth, x: stage.offsetLeft, y: stage.offsetTop, dx, dy,
      symbolEnd: anchor.width, nameEnd: name.width,
      textStartX: stage.offsetLeft - nameWidth / 2,
      textStartY: stage.offsetTop + width / 2 + gap,
      textEndX: name.left - viewport.left, textEndY: name.top - viewport.top,
      radius: Math.hypot(Math.max(dx, viewport.width - dx), Math.max(dy, viewport.height - dy)) + 2
    };
    caption.style.width = nameWidth + 'px';
  }

  function paint(frame) {
    const l = layout;
    const p = glide(frame.dock);
    // Give the bull a slight lead. Both marks follow their own direct path,
    // so the lettering can clear the bull without reversing course.
    const lead = p + .82 * p * (1 - p);
    const x = mix(l.x, l.dx, lead), y = mix(l.y, l.dy, lead);
    const markWidth = mix(l.width, l.symbolEnd, lead);
    const textWidth = mix(l.nameWidth, l.nameEnd, p);
    const left = mix(l.textStartX, l.textEndX, p), top = mix(l.textStartY, l.textEndY, p);
    stage.style.transform = 'translate(calc(-50% + ' + (x - l.x) + 'px), calc(-50% + ' +
      (y - l.y) + 'px)) scale(' + markWidth / l.width + ')';
    caption.style.transform = 'translate(' + left + 'px,' + top + 'px) scale(' + textWidth / l.nameWidth + ')';
    const veil = 1 - .24 * Math.sin(Math.PI * p) ** 2;
    stage.style.opacity = String(veil);
    caption.style.setProperty('--wordmark-opacity', smooth((frame.formation - .38) / .38) * veil);
    caption.style.setProperty('--dock-weight', p);
    caption.style.setProperty('--surface', 1 - p);
    if (lastOpening !== frame.open) {
      const radius = l.radius * smooth(frame.open);
      const mask = frame.open > 0 && frame.open < 1 && supportsIris
        ? `radial-gradient(circle at ${l.dx}px ${l.dy}px, transparent ${radius}px, black ${radius + 1}px)`
        : 'none';
      backdrop.style.maskImage = mask;
      backdrop.style.webkitMaskImage = mask;
      backdrop.style.opacity = String(supportsIris ? Number(frame.open < 1) : 1 - smooth(frame.open));
      lastOpening = frame.open;
    }
  }
  return { measure, paint };
}
