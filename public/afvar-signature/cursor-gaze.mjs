// Screen-relative gaze only; this object never transforms the head or frame.
const clamp = n => Math.max(-1,Math.min(1,n));
const ease = n => { const t=Math.max(0,Math.min(1,n)); return t*t*(3-2*t); };
function responseBlink(age) {
  if (age < 0 || age >= 395) return 0;
  if (age < 112) return ease(age/112);
  if (age <= 165) return 1;
  return 1-ease((age-165)/230);
}
export function createGaze() {
  let target=null, x=0,y=0,last=0,fixX=0,fixY=0,blinkAt=-Infinity,coolUntil=0;
  let lastBlink=0,releaseBlink=0,releaseAt=null;
  function reset() {target=null;x=y=fixX=fixY=last=lastBlink=coolUntil=0;blinkAt=-Infinity;releaseAt=null;}
  return {
    reset,
    target(nextX,nextY,time) {
      if (Number.isFinite(time) && x===(target?.x||0) && y===(target?.y||0)) last=Math.max(last,time);
      target={x:clamp(nextX),y:clamp(nextY)};
    },
    leave(time) {
      if (Number.isFinite(time) && target && x===target.x && y===target.y)last=Math.max(last,time);
      target=null;
    },
    release(time){releaseBlink=lastBlink;releaseAt=time;target=null;},
    sample(time,{waiting,blink,reduced}){
      if (reduced) {reset();return {x:0,y:0,blink:0,active:false};}
      const dt=Math.max(0,time-last);last=time;
      const tx=waiting&&target ? target.x : 0, ty=waiting&&target ? target.y : 0;
      if(waiting && target && Math.hypot(tx-fixX,ty-fixY)>.78 && time>=coolUntil && blink===0){
        blinkAt=time;coolUntil=time+1750;fixX=tx;fixY=ty;
      }
      if(!target)fixX=fixY=0;
      const k=1-Math.exp(-dt/76);
      x+=(tx-x)*k;y+=(ty-y)*k;
      if(Math.abs(tx-x)<.001)x=tx;
      if(Math.abs(ty-y)<.001)y=ty;
      const age=time-blinkAt;
      if(waiting){
        lastBlink=age<1000 ? responseBlink(age) : blink;
        if(lastBlink>.05 && age>=1000)coolUntil=Math.max(coolUntil,time+1050);
      }else lastBlink=releaseAt!==null ? releaseBlink*(1-ease((time-releaseAt)/225)) : 0;
      return {x,y,blink:lastBlink,active:Math.abs(x-tx)+Math.abs(y-ty)>.001 || (age>=0&&age<395)};
    }
  };
}
