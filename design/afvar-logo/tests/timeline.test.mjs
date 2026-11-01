import assert from 'node:assert/strict';
import test from 'node:test';
import { sample, TIMING as T } from '../timeline.mjs';

test('a ready signal during entrance completes the full mark before the dock', () => {
  assert.equal(sample(T.entrance / 2, 0).phase, 'entering');
  const completeMark = sample(T.entrance, 0);
  assert.equal(completeMark.formation, 1);
  assert.equal(completeMark.dock, 0);
  const start = T.entrance + T.hold + T.settle;
  assert.equal(sample(start - 1, 0).phase, 'holding');
  assert.equal(sample(start + T.dock, 0).phase, 'naming');
  assert.equal(sample(start + T.dock + T.name, 0).phase, 'opening');
  assert.equal(sample(start + T.dock + T.name + T.open, 0).phase, 'complete');
});

test('only pending readiness activates the waiting gaze and blink', () => {
  const duringBlink = T.entrance + T.firstBlink + T.close;
  assert.equal(sample(duringBlink, null).blink, 1);
  const settling = sample(duringBlink + T.settle / 2, duringBlink);
  assert.ok(settling.blink > 0 && settling.blink < 1);
  assert.equal(sample(duringBlink, duringBlink).blink, 1);
  assert.equal(sample(duringBlink + T.unclose, duringBlink).blink, 0);
  assert.equal(settling.dock, 0);
  assert.ok(settling.gazeStrength > 0 && settling.gazeStrength < 1);
  assert.equal(settling.waitTime, (duringBlink - T.entrance) / 1000);
  assert.equal(sample(duringBlink + T.settle, duringBlink).gazeStrength, 0);
});

test('reduced motion and a static fallback remain usable when graphics is unavailable', () => {
  assert.equal(sample(0, null, { reduce:true }).formation, 1);
  assert.equal(sample(0, 0, { reduce:true }).phase, 'complete');
  assert.equal(sample(0, null, { still:true }).phase, 'waiting');
  assert.equal(sample(10000, 0, { still:true }).phase, 'complete');
});
