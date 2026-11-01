import { createLockup } from "./golden-reveal/lockup.js";
import { createGaze } from "./cursor-gaze.mjs";
import { sample, TIMING } from "./timeline.mjs";

const IDLE_MS = 10000;
const FLIGHT_MS = TIMING.pairedDock;
const blinkStarts = [TIMING.firstBlink, 5760, 10220];
const blinkDuration = TIMING.close + TIMING.shut + TIMING.unclose;
const clamp = n => Math.max(0, Math.min(1, n));

// A Hermite segment starts at the actual last pose and velocity. Interrupting
// the outbound journey never rewinds the logo to an endpoint.
function interpolate(segment, now) {
  const t = clamp((now - segment.time) / segment.duration);
  const d = segment.end - segment.start;
  const p = segment.start + d * (t*t*(3-2*t)) + segment.speed * segment.duration * t*(1-t)*(1-t);
  const v = d * 6*t*(1-t)/segment.duration + segment.speed*(1-4*t+3*t*t);
  return { position:clamp(p), speed:v, done:t >= 1 };
}

export function startStandby(root, signal, lastActivity) {
  const stage = root.querySelector("[data-signature-stage]");
  const caption = root.querySelector("[data-signature-caption]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const gaze = createGaze();
  const observer = new ResizeObserver(resize);
  let idleTimer, blinkTimer, raf, segment, target, lockup;
  let position = 0, speed = 0, enteredAt, visibleSince = lastActivity(), cursor;
  let face, faceHost, faceAttempted = false;

  function usable(node) {
    if (!node) return false;
    const b = node.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && b.right > 0 && b.bottom > 0 && b.left < innerWidth && b.top < innerHeight;
  }
  function selectTarget() {
    const mark = document.querySelector("[data-afvar-brand-mark]");
    const name = mark?.closest("a")?.querySelector("[data-afvar-brand-name]");
    const real = usable(mark) && usable(name);
    const symbol = real ? mark : root.querySelector("[data-standby-mark-target]");
    const word = real ? name : root.querySelector("[data-standby-name-target]");
    if (target?.symbol === symbol && target.word === word) return;
    restoreTarget();
    target = {symbol, word, symbolOpacity:symbol.style.opacity, wordOpacity:word.style.opacity, virtual: !real && Boolean(mark)};
    root.dataset.target = real ? "header" : "fallback";
    symbol.style.opacity = "0";
    word.style.opacity = "0";
    lockup = createLockup(stage, caption, null, word);
    observer.observe(root); observer.observe(symbol); observer.observe(word);
    lockup.measure(symbol.getBoundingClientRect(), root.getBoundingClientRect());
  }
  function restoreTarget() {
    if (!target) return;
    target.symbol.style.opacity = target.symbolOpacity;
    target.word.style.opacity = target.wordOpacity;
    target = lockup = null;
    observer.disconnect();
  }
  function resize() {
    if (!target) return;
    selectTarget();
    lockup.measure(target.symbol.getBoundingClientRect(), root.getBoundingClientRect());
    paint(performance.now());
  }
  function stopFrames() {
    clearTimeout(blinkTimer);
    cancelAnimationFrame(raf);
  }
  function reset() {
    stopFrames();
    restoreTarget();
    position = speed = 0; segment = null; enteredAt = null;
    root.dataset.phase = "armed";
    root.dataset.progress = "0";
    root.style.setProperty("--standby-depth","0");
    root.style.setProperty("--standby-brand","0");
    gaze.reset();
  }
  function paint(now) {
    if (!target.symbol.isConnected || !target.word.isConnected) selectTarget();
    lockup.paint({dock:1-position, formation:1, open:0});
    root.dataset.progress = position.toFixed(4);
    const strength = position*position*(3-2*position);
    root.style.setProperty("--standby-depth", String(strength));
    // An off-screen header has no visible endpoint. True headerless routes
    // instead show the small fallback brand and hand it back at progress zero.
    root.style.setProperty("--standby-brand", String(target.virtual ? clamp(position/.16) : 1));
    if (!face || reduced.matches) return;
    if (cursor) {
      const box = stage.getBoundingClientRect();
      const unit = Math.max(1, box.width*.65);
      gaze.target((cursor.x-box.left-box.width/2)/unit, (cursor.y-box.top-box.height*.522)/unit, now);
    }
    const blink = enteredAt == null ? 0 : sample(now-enteredAt,null,{instantEntrance:true}).blink;
    const look = gaze.sample(now, {waiting:true, blink, reduced:false});
    face.draw(1,{waiting:true, gazeStrength:position, gazeX:look.x, gazeY:look.y, blink:look.blink*position});
  }
  function nextBlink(now) {
    if (!face || reduced.matches || enteredAt == null) return;
    const beat = (now-enteredAt) % TIMING.blinkCycle;
    const blinking = blinkStarts.some(start=>beat >= start && beat <= start+blinkDuration);
    const upcoming = blinkStarts.find(start=>start>beat) ?? TIMING.blinkCycle+blinkStarts[0];
    blinkTimer = setTimeout(()=>{raf=requestAnimationFrame(frame);}, blinking ? 24 : Math.max(20,upcoming-beat));
  }
  function frame(now) {
    if (signal.aborted || document.hidden || !target) return;
    try {
      if (segment) {
        const value=interpolate(segment, now);
        position=value.position; speed=value.speed;
        if (value.done) {
          const end=segment.end;
          segment=null; speed=0; position=end;
          if (!end) { reset(); return; }
          root.dataset.phase="centered";
          enteredAt=now;
        }
      }
      paint(now);
      if (segment) raf=requestAnimationFrame(frame);
      else nextBlink(now);
    } catch { reset(); }
  }
  function move(end) {
    if (signal.aborted || document.hidden) return;
    if (end === 1 && (root.dataset.phase==="centering" || root.dataset.phase==="centered")) return;
    if (end === 0 && (root.dataset.phase==="armed" || root.dataset.phase==="returning")) return;
    stopFrames();
    const now=performance.now();
    if (end) { selectTarget(); startFace(); }
    root.dataset.phase=end ? "centering" : "returning";
    if (reduced.matches || Math.abs(end-position)<.00001) {
      position=end; speed=0; segment=null;
      if (!end) { reset(); return; }
      root.dataset.phase="centered"; enteredAt=now; paint(now); return;
    }
    const distance=Math.abs(end-position);
    const duration=Math.max(140,FLIGHT_MS*Math.sqrt(distance));
    const limit=3*distance/duration;
    segment={start:position, end, speed:Math.max(-limit,Math.min(limit,speed)), time:now, duration};
    paint(now);
    raf=requestAnimationFrame(frame);
  }
  async function startFace() {
    if (faceAttempted || reduced.matches || navigator.connection?.saveData || ['slow-2g','2g'].includes(navigator.connection?.effectiveType)) return;
    faceAttempted=true;
    const holder=document.createElement("div"); holder.dataset.signatureMount="";
    stage.append(holder); faceHost=holder;
    try {
      const {createFollowingLogo}=await import("./face-follow.js");
      if (signal.aborted) return;
      const instance=await createFollowingLogo(holder);
      if (signal.aborted) { instance.dispose(); return; }
      face=instance; root.dataset.face="true";
      if (target) {
        paint(performance.now());
        if (!segment) { stopFrames(); nextBlink(performance.now()); }
      }
    } catch { holder.remove(); } // The original still artwork is already in the stage.
  }
  function arm() {
    if (signal.aborted || document.hidden) return;
    clearTimeout(idleTimer); idleTimer=0;
    const remaining=IDLE_MS - (performance.now()-Math.max(lastActivity(),visibleSince));
    if (remaining <= 0) { move(1); return; }
    idleTimer=setTimeout(arm,remaining);
  }
  function wake(event) {
    if (signal.aborted || document.hidden) return;
    if (event.type === "pointermove") cursor={x:event.clientX,y:event.clientY};
    if (root.dataset.phase!=="armed") move(0);
    // One pending timeout checks the actual last-input clock; high-frequency
    // pointer/scroll events do not reconstruct the monitor.
    if (!idleTimer) arm();
  }
  function visibility() {
    clearTimeout(idleTimer); idleTimer=0;
    reset(); visibleSince=performance.now();cursor=null;
    if (!document.hidden) arm();
  }
  const options={signal};
  document.addEventListener("visibilitychange",visibility,options);
  window.addEventListener("pagehide",visibility,options);
  window.addEventListener("pageshow",visibility,options);
  reduced.addEventListener("change",()=>{
    if (!target) return;
    if (reduced.matches) {
      stopFrames();
      if (root.dataset.phase==="returning") { reset(); return; }
      segment=null;position=1;speed=0;enteredAt=performance.now();
      root.dataset.phase="centered";paint(enteredAt);
    } else if (root.dataset.phase==="centered") {
      enteredAt=performance.now(); startFace(); stopFrames(); nextBlink(enteredAt);
    }
  },options);
  signal.addEventListener("abort",()=>{
    clearTimeout(idleTimer); reset();
    face?.dispose(); faceHost?.remove();
    delete root.dataset.face; delete root.dataset.target;
  },{once:true});
  reset(); arm();
  return wake;
}
