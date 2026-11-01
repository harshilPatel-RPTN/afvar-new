import test from 'node:test';
import assert from 'node:assert/strict';
import { eyeEdges, lidSourceV, lidAperture } from '../lids.mjs';

test('the original upper rim arrives at the lower eyelid in both traced pockets', () => {
  for (const u of [.408,.592]) {
    const eye=eyeEdges(u);
    const sample=eye.top+.53*(eye.bottom-eye.top);
    assert.equal(lidSourceV(sample,eye,0),sample);
    const halfway=(eye.top+eye.bottom)/2;
    assert.ok(Math.abs(lidSourceV(halfway,eye,.5)-eye.top)<1e-10);
    assert.ok(Math.abs(lidSourceV(eye.bottom-1e-9,eye,1)-eye.top)<2e-9);
    assert.equal(lidAperture(sample,eye,1),0);
    assert.equal(lidSourceV(eye.bottom+.005,eye,1),eye.bottom+.005);
    assert.equal(lidSourceV(sample,eye,0),sample);
  }
  assert.equal(eyeEdges(.5),null);
});
