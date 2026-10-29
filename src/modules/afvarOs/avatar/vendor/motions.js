// Vendored from https://github.com/Sudhakarrupnar/AFVAR_Avatar_Final @ 4e0d45e (public/avatar/AFVAR/motions.js).
// Keep in sync with the avatar repo; do not edit here — change it there and re-vendor.
// Authored rigid-part gestures, not a learned human motion model. The interaction
// controller owns semantic timing, speech and crossfades between these poses.
export const MOTIONS = ['idle','wave','talk','look','dance','listen','think','explain','pointLeft','pointRight','acknowledge','unsure','serious','celebrate'];
export const MOTION_EXPRESSIONS = {idle:'happy',wave:'happy',talk:'happy',look:'curious',dance:'happy',listen:'focused',think:'thinking',explain:'confident',pointLeft:'focused',pointRight:'focused',acknowledge:'happy',unsure:'curious',serious:'concerned',celebrate:'happy'};
const clamp=(n,min,max,fallback=0)=>Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
const smooth=x=>{x=clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
const phase=(t,d)=>((t%d)+d)%d;
function envelope(t,start,attack,hold,release){
  const x=t-start;
  if(x<0||x>=attack+hold+release)return 0;
  if(x<attack)return smooth(x/attack);
  if(x<attack+hold)return 1;
  return 1-smooth((x-attack-hold)/release);
}
// Conversational accents have preparation, a brief hold, a slower release and
// actual pauses. Alternating unequal phrases avoids synchronized arm pendulums.
const TALK_PHRASES={R:[[.45,.62,.35,.95,.92],[4.25,.66,.18,1.02,.54],[9.2,.72,.3,1.15,.76]],L:[[2.45,.72,.28,1.05,.8],[6.6,.67,.48,1.12,.66],[11.65,.6,.18,1.0,.6]]};
const EXPLAIN_PHRASES={R:[[.3,.78,.75,1.22,.96],[5.3,.82,.4,1.25,.57],[10.25,.72,.5,1.18,.72]],L:[[2.85,.84,.6,1.3,.82],[7.7,.8,.65,1.35,.76],[12.7,.72,.45,1.2,.58]]};
function phrase(t,side,lag=0,explain=false){
  const schedule=explain?EXPLAIN_PHRASES:TALK_PHRASES,p=phase(t-lag,explain?16:14);
  let value=0;for(const [start,attack,hold,release,strength] of schedule[side])value+=envelope(p,start,attack,hold,release)*strength;
  return value;
}
function lookYaw(t){const p=phase(t,10);return -.5*envelope(p,.65,.72,1.2,1.0)+.42*envelope(p,4.75,.65,.9,1.05);}

export function poseRobot(robot, mode, time, amplitude=1, options={}) {
  const sin=Math.sin,t=Number.isFinite(time)?Math.max(0,time):0,a=clamp(amplitude,0,1,1)*(options.reducedMotion ? .25 : 1);
  for(const joint of Object.values(robot.joints))joint.bone.rotation[joint.axis]=joint.rest;
  const quiet=['listen','think','serious','unsure'].includes(mode),still=quiet?.28:1;
  // The rig floats: this is a small hover/settle, not human locomotion or breathing anatomy.
  robot.root.position.x=mode==='manual'?0:(.008*sin(t*.31)+.0025*sin(t*.83))*a*still;
  robot.root.position.y=mode==='manual'?0:(.018*sin(t*.9)+.008*sin(t*.43))*a*still;
  const set=(name,delta)=>{const j=robot.joints[name];if(j)j.bone.rotation[j.axis]=clamp(j.rest+delta*a,j.min,j.max,j.rest);};
  const angle=(name,target)=>{const j=robot.joints[name];if(j)set(name,target-j.rest);};
  if(mode==='manual')return;
  set('body',(.012*sin(t*.34)+.005*sin(t*.75))*still);
  set('headPitch',(.018*sin(t*.73)+.006*sin(t*.29))*still);
  set('neckYaw',(.025*sin(t*.41)+.009*sin(t*.91))*still);
  for(const [i,side] of ['L','R'].entries()){
    set('shoulderSwing'+side,(.012*sin(t*.91+i*1.4)+.005*sin(t*.43+i))*still);
    set('elbow'+side,(-.018-.008*sin(t*.63+i*1.3))*still);
  }
  const openHand=(side,amount=1)=>{
    const openness=clamp(amount,0,1),sign=side==='L'?1:-1;
    for(let f=0;f<4;f++){
      const anatomical=side==='L'?3-f:f;
      for(const [index,segment] of ['a','b','c'].entries()){
        const name='finger'+side+f+segment,j=robot.joints[name],target=[-.025-anatomical*.018,-.055-anatomical*.025,-.025-anatomical*.012][index];
        angle(name,j.rest+(target-j.rest)*openness);
      }
    }
    set('thumb'+side+'0',sign*.08*openness);set('thumb'+side+'1',.065*openness);
  };
  if(mode==='wave'){
    const p=phase(t,7),lift=envelope(p,.12,.95,1.42,1.15),hand=envelope(p,.25,.92,1.32,1.23),sweep=envelope(p,1.0,.25,1.2,.45);
    set('shoulderR',(-1.84+.035*sin((p-1)*5))*lift);set('shoulderSwingR',-.10*lift);
    set('elbowR',(-.3-.075*sin((p-1)*5))*envelope(p,.2,.92,1.35,1.16));
    angle('wristR',robot.joints.wristR.rest*(1-hand)+.27*sin((p-1)*5)*sweep);
    set('body',-.028*lift);set('neckYaw',-.075*envelope(p,0,.78,1.55,1.25));set('headPitch',-.04*lift);openHand('R',hand);
  } else if(mode==='talk'||mode==='explain'){
    const explain=mode==='explain',left=phrase(t,'L',0,explain),right=phrase(t,'R',0,explain);
    for(const [i,side] of ['L','R'].entries()){
      const sign=i?-1:1,shoulder=phrase(t,side,-.07,explain),elbow=phrase(t,side,.04,explain),hand=phrase(t,side,.17,explain);
      set('shoulder'+side,sign*((explain?.06:.025)+(explain?.22:.105)*shoulder));
      set('shoulderSwing'+side,-(explain?.09:.055)-(explain?.2:.14)*shoulder);
      set('elbow'+side,-(explain?.10:.09)-(explain?.22:.20)*elbow);
      set('wrist'+side,-robot.joints['wrist'+side].rest*((explain?.22:.12)+(explain?.52:.22)*hand));
      openHand(side,(explain?.18:.05)+(explain?.67:.44)*phrase(t,side,.23,explain));
    }
    set('body',.038*(phrase(t,'L',.19,explain)-phrase(t,'R',.19,explain)));
    set('neckYaw',.065*(phrase(t,'L',-.16,explain)-phrase(t,'R',-.16,explain)));
    set('headPitch',.028*(left+right));
  } else if(mode==='look'){
    const yaw=lookYaw(t);set('body',lookYaw(t-.25)*.12);set('neckYaw',yaw);set('headPitch',-.05*Math.abs(yaw));
  } else if(mode==='dance'){
    robot.root.position.y=(.06+.09*sin(t*3.6))*a;
    set('body',.065*sin(t*1.8));set('neckYaw',.21*sin(t*1.8-.15));set('headPitch',.09*sin(t*3.6));
    for(const [i,side] of ['L','R'].entries()){
      set('shoulder'+side,(i?-1:1)*(.28+.2*sin(t*1.8+i*Math.PI)));set('shoulderSwing'+side,.3*sin(t*1.8+i*Math.PI));set('elbow'+side,-.36-.25*sin(t*3.6+i));set('wrist'+side,.3*sin(t*1.8+i));
      for(let f=0;f<4;f++)for(const seg of ['a','b','c'])set('finger'+side+f+seg,-.18-.15*sin(t*2+f));
      set('thumb'+side+'0',-.15-.12*sin(t*2));set('thumb'+side+'1',-.2-.12*sin(t*2));
    }
  } else if(mode==='listen'){
    const nod=envelope(phase(t,17),3.1,.4,.02,.64);
    set('headPitch',.016+.033*nod);set('neckYaw',.008*sin(t*.4));set('body',0);
    for(const side of ['L','R']){set('elbow'+side,-.035);set('shoulderSwing'+side,-.025);}
  } else if(mode==='think'){
    const settle=smooth(t/.95);set('neckYaw',(.13+.012*sin(t*.53))*settle);set('headPitch',-.05*settle);set('body',.02*settle);
    for(const side of ['L','R'])set('elbow'+side,-.06*settle);
  } else if(mode==='pointLeft'||mode==='pointRight'){
    const side=mode==='pointLeft'?'R':'L',sign=side==='L'?1:-1,p=phase(t,7),reach=envelope(p,.25,.8,2.2,1.15),hand=envelope(p,.37,.75,2.1,1.2);
    set('body',sign*.035*envelope(p,.32,.9,2.0,1.25));set('shoulder'+side,sign*1.12*reach);set('shoulderSwing'+side,-.10*reach);set('elbow'+side,-.08*reach);set('wrist'+side,-robot.joints['wrist'+side].rest*.78*hand);
    set('neckYaw',sign*.28*envelope(p,0,.7,2.6,1.05));set('headPitch',-.025*reach);
    for(let f=0;f<4;f++)for(const segment of ['a','b','c']){const j=robot.joints['finger'+side+f+segment],target=f===(side==='L'?3:0)?-.025:-.42;angle('finger'+side+f+segment,j.rest+(target-j.rest)*hand);}
  } else if(mode==='acknowledge'){
    const p=phase(t,7),pulse=p<1.4?Math.sin(p/1.4*Math.PI)**2:0;set('headPitch',.115*pulse);set('neckYaw',0);set('body',0);
  } else if(mode==='unsure'){
    const p=phase(t,9),offer=envelope(p,.2,.7,1.25,1.05);set('neckYaw',.085*offer);set('headPitch',-.04*offer);set('body',.015*offer);
    set('shoulderL',.12*offer);set('elbowL',-.18*offer);set('wristL',-robot.joints.wristL.rest*.65*envelope(p,.32,.68,1.17,1.15));openHand('L',.8*offer);
  } else if(mode==='serious'){
    set('headPitch',.015);set('neckYaw',0);set('body',0);
    for(const side of ['L','R']){set('shoulderSwing'+side,0);set('elbow'+side,-.045);}
  } else if(mode==='celebrate'){
    const p=phase(t,7),pulse=p<2.2?Math.sin(p/2.2*Math.PI)**2:0;robot.root.position.y=.07*pulse*a;
    for(const [i,side] of ['L','R'].entries()){
      const lift=envelope(p,i*.10,.65,.35,1.15);set('shoulder'+side,(i?-1:1)*.46*lift);set('elbow'+side,-.27*lift);set('wrist'+side,-robot.joints['wrist'+side].rest*.65*lift);openHand(side,lift);
    }
    set('body',.018*pulse);set('headPitch',-.035*pulse);
  }
}
export function motionFace(mode,t,amplitude=1){
  const a=clamp(amplitude,0,1,1),time=Number.isFinite(t)?Math.max(0,t):0,p=phase(time,5.2);
  let gazeX=0,gazeY=0;
  if(mode==='look')gazeX=lookYaw(time+.18)/.58*.8*a;
  else if(mode==='think'){gazeX=.30*smooth(time/.8)*a;gazeY=.16*smooth(time/.8)*a;}
  else if(mode==='pointLeft'||mode==='pointRight')gazeX=(mode==='pointLeft'?-.65:.65)*envelope(phase(time,7),0,.48,2.7,1.0)*a;
  else if(mode==='talk'||mode==='explain')gazeX=.20*(phrase(time,'L',-.22,mode==='explain')-phrase(time,'R',-.22,mode==='explain'))*a;
  else if(mode==='listen')gazeX=(.025*Math.sin(time*.31)+.012*Math.sin(time*.77))*a;
  return {blink:p>4.85?Math.max(0,Math.sin((p-4.85)/.35*Math.PI)):0,talk:mode==='talk'?(.5+.5*Math.sin(time*10))*a:0,gazeX,gazeY};
}
export function makeClips(THREE,robot) {
  const clips=[],duration=7,fps=24;
  const bones=Object.values(robot.joints).map(j=>j.bone),seen=new Set();
  const unique=bones.filter(b=>!seen.has(b.uuid)&&seen.add(b.uuid));
  const face=[];robot.root.traverse(o=>{if(o.name.endsWith('_LED_eye')||o.name.startsWith('Smile_LED_')||o.name.startsWith('Eye_LED_'))face.push(o);});
  const saved=unique.map(b=>b.quaternion.clone()),pos=robot.root.position.clone(),savedExpression=robot.getExpression?.()||'happy';
  for(const motion of MOTIONS){
    robot.setExpression(MOTION_EXPRESSIONS[motion]);
    const times=[],positions=[],values=unique.map(()=>[]),facePos=face.map(()=>[]),faceScale=face.map(()=>[]),faceRot=face.map(()=>[]);
    let firstQ,firstP,firstF;
    for(let n=0;n<=duration*fps;n++){
      const t=n/fps;times.push(t);poseRobot(robot,motion,t);robot.updateFace(t,motionFace(motion,t));
      if(n===0){firstQ=unique.map(b=>b.quaternion.clone());firstP=robot.root.position.clone();firstF=face.map(o=>[o.position.clone(),o.scale.clone(),o.quaternion.clone()]);}
      if(t>duration-.6){const x=(t-(duration-.6))/.6,w=x*x*(3-2*x);unique.forEach((b,i)=>b.quaternion.slerp(firstQ[i],w));robot.root.position.lerp(firstP,w);face.forEach((o,i)=>{o.position.lerp(firstF[i][0],w);o.scale.lerp(firstF[i][1],w);o.quaternion.slerp(firstF[i][2],w);});}
      positions.push(...robot.root.position.toArray());unique.forEach((b,i)=>values[i].push(...b.quaternion.toArray()));face.forEach((o,i)=>{facePos[i].push(...o.position.toArray());faceScale[i].push(...o.scale.toArray());faceRot[i].push(...o.quaternion.toArray());});
    }
    const tracks=unique.map((b,i)=>new THREE.QuaternionKeyframeTrack(b.name+'.quaternion',times,values[i]));
    tracks.push(new THREE.VectorKeyframeTrack(robot.root.name+'.position',times,positions));
    face.forEach((o,i)=>{tracks.push(new THREE.VectorKeyframeTrack(o.name+'.position',times,facePos[i]));tracks.push(new THREE.VectorKeyframeTrack(o.name+'.scale',times,faceScale[i]));if(o.name.endsWith('_LED_eye'))tracks.push(new THREE.QuaternionKeyframeTrack(o.name+'.quaternion',times,faceRot[i]));});
    clips.push(new THREE.AnimationClip(motion,duration,tracks));
  }
  unique.forEach((b,i)=>b.quaternion.copy(saved[i]));robot.root.position.copy(pos);robot.setExpression(savedExpression);robot.updateFace(0,{blink:0,talk:0});
  return clips;
}
