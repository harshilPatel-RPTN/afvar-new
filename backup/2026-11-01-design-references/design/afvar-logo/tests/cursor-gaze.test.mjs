import assert from 'node:assert/strict';
import test from 'node:test';
import {createGaze} from '../cursor-gaze.mjs';
import {sample} from '../timeline.mjs';

const waiting={waiting:true,blink:0,reduced:false};
test('the approved default is full size and ready to track from its first frame',()=>{
  const first=sample(0,null,{instantEntrance:true});
  assert.equal(first.phase,'waiting');
  assert.equal(first.formation,1);
});
test('gaze eases toward both pointer coordinates after an idle period and centers on leave',()=>{
  const gaze=createGaze();
  gaze.sample(0,waiting);
  gaze.target(-1,.7,8000);
  const first=gaze.sample(8016,waiting);
  assert.ok(first.x<0 && first.x>-.5);
  assert.ok(first.y>0 && first.y<.35);
  assert.equal(gaze.sample(9000,waiting).x,-1);
  gaze.leave(9600);
  assert.equal(gaze.sample(10500,waiting).x,0);
  assert.equal(gaze.sample(10500,waiting).y,0);
});
test('a gaze-triggered blink reopens when the host signals ready',()=>{
  const gaze=createGaze();
  gaze.target(.98,0,1000);gaze.sample(1000,waiting);
  assert.equal(gaze.sample(1130,waiting).blink,1);
  gaze.release(1130);
  const exiting={waiting:false,blink:0,reduced:false};
  assert.equal(gaze.sample(1130,exiting).blink,1);
  assert.ok(gaze.sample(1230,exiting).blink<1);
  assert.equal(gaze.sample(1380,exiting).blink,0);
});
