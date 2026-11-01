// Entrance progress measures the choreography only.
export const TIMING = Object.freeze({
  entrance: 2400, hold: 300, settle: 350,
  dock: 650, pairedDock: 1400, name: 450, open: 900,
  firstBlink: 1690, blinkCycle: 12200, close: 128, shut: 85, unclose: 222
});

const clamp = value => Math.max(0, Math.min(1, value));
export function easeOut(value) { return 1 - (1 - value) ** 4; }

const smooth = t => t * t * (3 - 2 * t);
function lidClosure(waitMs) {
  if (waitMs < 0) return 0;
  const time = waitMs % TIMING.blinkCycle;
  for (const start of [TIMING.firstBlink, 5760, 10220]) {
    const phase = time - start;
    if (phase < 0 || phase > TIMING.close + TIMING.shut + TIMING.unclose) continue;
    if (phase < TIMING.close) return smooth(phase / TIMING.close);
    if (phase <= TIMING.close + TIMING.shut) return 1;
    return 1 - smooth((phase - TIMING.close - TIMING.shut) / TIMING.unclose);
  }
  return 0;
}
export function sample(time, readyAt, { reduce = false, still = false, instantEntrance = false, entranceMs = TIMING.entrance, pairedExit = false } = {}) {
  const finish = still || instantEntrance ? 0 : entranceMs;
  const formation = reduce || finish === 0 ? 1 : clamp(time / finish);
  const base = { formation, dock: 0, name: 0, open: 0, blink: 0, waitTime: 0, gazeStrength: 0 };
  if (reduce) {
    return readyAt == null ? { ...base, phase: 'waiting' }
      : { ...base, phase: 'complete', dock: 1, name: 1, open: 1 };
  }
  if (time < finish) return { ...base, phase: 'entering' };
  if (readyAt == null) {
    return { ...base, phase: 'waiting', blink: still ? 0 : lidClosure(time - finish),
      waitTime: Math.max(0, (time - finish) / 1000), gazeStrength: 1 };
  }
  const settleAt = Math.max(readyAt, finish + TIMING.hold);
  const exitElapsed = time - settleAt - TIMING.settle;
  const waitTime = Math.max(0, (readyAt - finish) / 1000);
  const gazeStrength = waitTime ? 1 - easeOut(clamp((time - settleAt) / TIMING.settle)) : 0;
  // If readiness arrives mid-blink, let the actual lid open before docking.
  const blink = still ? 0 : lidClosure(readyAt - finish) *
    (1 - smooth(clamp((time - readyAt) / TIMING.unclose)));
  const flight = pairedExit ? TIMING.pairedDock : TIMING.dock;
  const dock = clamp(exitElapsed / flight);
  const name = pairedExit ? dock : clamp((exitElapsed - flight) / TIMING.name);
  const open = clamp((exitElapsed - flight - (pairedExit ? 0 : TIMING.name)) / TIMING.open);
  const phase = exitElapsed < 0 ? 'holding' : dock < 1 ? 'docking' : name < 1 ? 'naming' : open < 1 ? 'opening' : 'complete';
  return { ...base, phase, dock, name, open, waitTime, gazeStrength, blink };
}
