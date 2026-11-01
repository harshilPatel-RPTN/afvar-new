import { easeOut, sample, TIMING } from './timeline.mjs';
import { createGaze } from './cursor-gaze.mjs';

const $ = id => document.getElementById(id);
const template = $('template');
const stage = $('logo-stage');
const mount = $('logo-renderer');
const slot = $('content-slot');
const wordmark = $('wordmark');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const phases = {
  entering: 'The logo is approaching.', waiting: 'The full AFVAR logo is ready to inspect.',
  holding: 'The full AFVAR logo is visible.', docking: 'The logo is moving into place.',
  naming: 'AFVAR unfolds from the logo.', opening: 'Opening the content slot.', complete: 'Content slot open.'
};
let renderer = null;
let prepared = false;
let staticMark = false;
let disposed = false;
let paused = false;
let elapsed = 0;
let readyAt = null;
let activeSince = null;
let frameRequest = 0;
let sleeping = 0;
let lastProgress = -1;
let lastBlink = -1;
let lastStrength = -1;
let geometry = null;
let aperture = null;
const gaze = createGaze();
let lastX=NaN,lastY=NaN,facialMotion=false;

function cancelScheduled() {
  cancelAnimationFrame(frameRequest);
  clearTimeout(sleeping);
  frameRequest = 0;
  sleeping = 0;
}
function accumulate(now = performance.now()) {
  if (activeSince !== null) elapsed += Math.max(0, now - activeSince);
  activeSince = null;
}
function measure() {
  const anchor = $('dock').getBoundingClientRect();
  const box = template.getBoundingClientRect();
  // offsetLeft/Top locate the stage origin before its centering transform.
  geometry = {
    dx: anchor.left + anchor.width / 2 - box.left - stage.offsetLeft,
    dy: anchor.top + anchor.height / 2 - box.top - stage.offsetTop,
    scale: anchor.width / Math.max(1, stage.offsetWidth),
    width: box.width, height: box.height
  };
  aperture = null;
}
function slotClip(progress) {
  if (progress <= 0) return 'polygon(0 0,0 0,0 0)';
  if (progress >= 1) return 'none';
  if (!aperture) {
    const letter = $('aperture-letter').getBoundingClientRect();
    aperture = { x: letter.left + letter.width * .49, y: letter.top + letter.height * .35 };
  }
  const { x, y } = aperture;
  const { width, height } = geometry;
  const initial = [[x,y-3],[x,y-3],[x+3.2,y+3],[x+3.2,y+3],[x+3.2,y+3],[x-3.2,y+3],[x-3.2,y+3],[x-3.2,y+3]];
  const final = [[0,0],[width,0],[width,0],[width,height],[width,height],[0,height],[0,height],[0,0]];
  const t = easeOut(Math.max(0, (progress - .1) / .9));
  return 'polygon(' + initial.map(([x0, y0], i) =>
    (x0 + (final[i][0] - x0) * t).toFixed(2) + 'px ' +
    (y0 + (final[i][1] - y0) * t).toFixed(2) + 'px').join(',') + ')';
}
function staticFallback() {
  renderer?.dispose();
  renderer = null;
  staticMark = true;
  mount.replaceChildren();
  const connection = navigator.connection;
  const lite = innerWidth <= 600 || connection?.saveData || ['2g', 'slow-2g'].includes(connection?.effectiveType);
  const fallback = $('approved-fallback');
  template.dataset.poster='true';
  fallback.onload=()=>{delete template.dataset.poster;};
  fallback.src = lite ? './assets/approved-lite.webp' : './assets/approved.webp';
  fallback.hidden = false;
}
function paint(frame) {
  const face=gaze.sample(elapsed,{waiting:frame.phase==='waiting',blink:frame.blink,reduced:motionPreference.matches});
  facialMotion=face.active||face.blink>0;
  if (renderer && (frame.formation !== lastProgress ||
    face.blink!==lastBlink || face.x!==lastX || face.y!==lastY || frame.gazeStrength !== lastStrength)) {
    try {
      renderer.draw(frame.formation, {blink:face.blink,gazeX:face.x,gazeY:face.y,reducedMotion:motionPreference.matches,
        waiting: frame.phase === 'waiting', gazeStrength: frame.gazeStrength });
    }
    catch { staticFallback(); }
    lastProgress = frame.formation;
    lastBlink = face.blink;lastX=face.x;lastY=face.y;
    lastStrength = frame.gazeStrength;
  }
  const dock = easeOut(frame.dock);
  const name = easeOut(frame.name);
  const scale = 1 + (geometry.scale - 1) * dock;
  stage.style.transform = 'translate(calc(-50% + ' + geometry.dx * dock + 'px), calc(-50% + ' +
    geometry.dy * dock + 'px)) scale(' + scale + ')';
  wordmark.style.opacity = String(name);
  wordmark.style.transform = 'translateX(' + (-30 * (1 - name)) + 'px)';
  wordmark.style.clipPath = 'inset(0 ' + (100 * (1 - name)) + '% 0 0)';
  slot.style.clipPath = slotClip(frame.open);
  $('loading-caption').hidden = readyAt !== null || !['entering', 'waiting'].includes(frame.phase);
  const complete = frame.phase === 'complete';
  slot.inert = !complete;
  slot.setAttribute('aria-hidden', String(!complete));
  $('pause').disabled = complete || motionPreference.matches;
  $('exit').disabled = readyAt !== null;
  template.dataset.formation = frame.formation.toFixed(4);
  template.dataset.blink = face.blink.toFixed(3);
  template.dataset.gazeX=face.x.toFixed(3);template.dataset.gazeY=face.y.toFixed(3);
  if (template.dataset.phase !== frame.phase) {
    template.dataset.phase = frame.phase;
    $('announcement').textContent = phases[frame.phase];
    if (complete) window.dispatchEvent(new CustomEvent('afvar:opened'));
  }
}
function update() {
  cancelScheduled();
  if (!prepared || disposed || document.hidden) return;
  accumulate();
  const frame = sample(elapsed, readyAt, { reduce: motionPreference.matches, still: staticMark, instantEntrance:true });
  paint(frame);
  if (paused || frame.phase === 'complete') return;
  if (frame.phase === 'waiting' && (motionPreference.matches || staticMark)) return;
  activeSince = performance.now();
  if (frame.phase === 'waiting') {
    // Eyes at rest wait for the next blink or a pointer event.
    const since=elapsed,period=TIMING.blinkCycle;
    const beat=((since%period)+period)%period;
    const schedule=[TIMING.firstBlink,5760,10220];
    const length=TIMING.close+TIMING.shut+TIMING.unclose;
    const inBlink=schedule.some(start=>beat>=start&&beat<=start+length);
    const next=schedule.find(start=>start>beat)??period+schedule[0];
    const delay=(facialMotion||inBlink)?20:Math.max(16,next-beat);
    sleeping = setTimeout(() => { frameRequest = requestAnimationFrame(update); }, delay);
  } else {
    frameRequest = requestAnimationFrame(update);
  }
}
function setPaused(value) {
  accumulate();
  paused = value;
  template.dataset.paused = String(paused);
  const button = $('pause');
  button.setAttribute('aria-pressed', String(paused));
  button.title = paused ? 'Resume motion' : 'Pause motion';
  button.setAttribute('aria-label', button.title);
  update();
}
function ready() {
  if (disposed || readyAt !== null) return;
  accumulate();
  readyAt = elapsed;
  gaze.release(elapsed);
  setPaused(false);
}
function replay() {
  if (disposed) return;
  cancelScheduled();
  elapsed = 0;
  readyAt = null;
  activeSince = null;
  aperture = null;
  lastProgress = -1;
  lastBlink = -1;
  lastStrength = -1;
  gaze.reset();lastX=lastY=NaN;
  setPaused(false);
}
function resize() { measure(); update(); }
function visibility() {
  if (document.hidden) {
    gaze.leave();
    accumulate();
    cancelScheduled();
  } else { measure(); update(); }
}
function onReducedChange() {
  accumulate();
  // Once reduced motion has shown the complete mark, clearing the preference
  // must preserve that reached frame instead of rewinding the logo.
  if (motionPreference.matches && readyAt !== null) {
    const exitEnd = TIMING.settle + TIMING.dock + TIMING.name + TIMING.open;
    elapsed = Math.max(elapsed, Math.max(readyAt, TIMING.hold) + exitEnd);
  }
  update();
}
function dispose() {
  if (disposed) return;
  disposed = true;
  cancelScheduled();
  renderer?.dispose();
  renderer = null;
  window.removeEventListener('afvar:ready', ready);
  window.removeEventListener('resize', resize);
  motionPreference.removeEventListener('change', onReducedChange);
  document.removeEventListener('visibilitychange', visibility);
  pointerListeners.abort();
}
function wakeEyes() {
  if(!prepared||paused||disposed||document.hidden||motionPreference.matches||readyAt!==null||frameRequest)return;
  clearTimeout(sleeping);sleeping=0;
  frameRequest=requestAnimationFrame(update);
}
function pointAtCursor(event) {
  if(readyAt!==null||motionPreference.matches)return;
  const box=stage.getBoundingClientRect(), scale=Math.max(1,box.width*.65);
  gaze.target((event.clientX-box.left-box.width*.5)/scale,(event.clientY-box.top-box.height*.522)/scale,liveTime());
  wakeEyes();
}
function liveTime(){return elapsed+(activeSince===null?0:Math.max(0,performance.now()-activeSince));}
function stopTracking(){gaze.leave(liveTime());wakeEyes();}
const pointerListeners=new AbortController();
const pointerOptions={signal:pointerListeners.signal,passive:true};
window.addEventListener('pointermove',pointAtCursor,pointerOptions);
window.addEventListener('pointerdown',pointAtCursor,pointerOptions);
window.addEventListener('pointerup',e=>{if(e.pointerType==='touch')stopTracking();},pointerOptions);
window.addEventListener('pointercancel',stopTracking,pointerOptions);
window.addEventListener('pointerout',e=>{if(!e.relatedTarget)stopTracking();},pointerOptions);
window.addEventListener('blur',stopTracking,pointerOptions);
window.afvarLoader = Object.freeze({
  ready, replay, pause: () => setPaused(true), resume: () => setPaused(false),
  get phase() { return template.dataset.phase; }
});
window.addEventListener('afvar:ready', ready);
mount.addEventListener('afvar:graphics-lost', () => { staticFallback(); update(); }, {once:true});
window.addEventListener('resize', resize);
window.addEventListener('pagehide', e => {
  accumulate();
  cancelScheduled();
  if (!e.persisted) dispose();
});
window.addEventListener('pageshow', e => { if (e.persisted) resize(); });
document.addEventListener('visibilitychange', visibility);
motionPreference.addEventListener('change', onReducedChange);
$('replay').addEventListener('click', replay);
$('exit').addEventListener('click', ready);
$('pause').addEventListener('click', () => setPaused(!paused));
$('controls').hidden = false;
measure();

async function prepare() {
  let deadline;
  let expired = false;
  try {
    const enhancement = import('./face-follow.js').then(async ({ createFollowingLogo }) => {
      if (expired || disposed) return null;
      const candidate = await createFollowingLogo(mount);
      if (expired || disposed) { candidate.dispose(); return null; }
      return candidate;
    });
    renderer = await Promise.race([
      enhancement,
      new Promise((_, reject) => {
        deadline = setTimeout(() => reject(new Error('Artwork preparation expired')), 2500);
      })
    ]);
    if (!renderer && !disposed) staticFallback();
  } catch {
    expired = true;
    if (!disposed) staticFallback();
  } finally { clearTimeout(deadline); }
  if (disposed) return;
  prepared = true;
  if (motionPreference.matches) onReducedChange();
  else update();
  window.dispatchEvent(new CustomEvent('afvar:template-ready'));
}
prepare();
