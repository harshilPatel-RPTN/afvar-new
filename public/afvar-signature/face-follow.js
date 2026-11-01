import { eyeEdges, lidSourceV } from './lids.mjs';

const clamp = (value, low=0, high=1) => Math.max(low,Math.min(high,value));
function easing(lo, hi, value) {
  const t=clamp((value-lo)/(hi-lo));
  return t*t*(3-2*t);
}

// Coordinates are in the full approved artwork, independent of the canvas
// resolution. Tiny local buffers cover these three regions; only the traced
// eye folds and painted nostril rims can actually change.
const patches = [
  {kind:'left', bounds:[.354,.446,.468,.607], irisX:.408},
  {kind:'right',bounds:[.532,.446,.646,.607], irisX:.592},
  {kind:'nose', bounds:[.431,.640,.569,.694]}
];

function svgMask(box,outlines) {
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+box.join(' ')+
    '" preserveAspectRatio="none"><path fill="white" fill-rule="evenodd" d="'+outlines+'"/></svg>';
  return 'url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';
}

function motionContour(kind,W,H) {
  function polygon(points){
    return points.map(([u,v],i)=>(i?'L':'M')+(u*W).toFixed(3)+' '+(v*H).toFixed(3)).join('')+'Z';
  }
  if(kind==='nose') {
    return [.466,.535].map(center=>polygon(Array.from({length:56},(_,i)=>{
      const angle=i*2*Math.PI/56;
      return [center+.029*Math.cos(angle),.670+.0205*Math.sin(angle)];
    }))).join('');
  }
  const top=[],bottom=[];
  for(let i=0;i<=72;i++){
    const left=(460.503+116.994*i/72)/1254, u=kind==='left'?left:1-left;
    const edges=eyeEdges(u);
    if(!edges)continue;
    const width=edges.bottom-edges.top;
    const taper=clamp(width/.024);
    top.push([u,edges.anchor-.014*taper]);
    bottom.push([u,edges.bottom+.0008*taper]);
  }
  return polygon(top.concat(bottom.reverse()));
}

function createPatch(definition,reference,container) {
  const W=reference.width,H=reference.height;
  const [u0,v0,u1,v1]=definition.bounds;
  const x=Math.floor(u0*W),y=Math.floor(v0*H);
  const w=Math.ceil(u1*W)-x,h=Math.ceil(v1*H)-y;
  const canvas=document.createElement('canvas');
  canvas.width=w;canvas.height=h;
  canvas.setAttribute('aria-hidden','true');
  canvas.dataset.feature=definition.kind;
  Object.assign(canvas.style,{position:'absolute',left:100*x/W+'%',top:100*y/H+'%',
    width:100*w/W+'%',height:100*h/H+'%',pointerEvents:'none',display:'none'});
  container.appendChild(canvas);
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx) throw Error('Face patch context unavailable');
  const source=reference.getContext('2d').getImageData(x,y,w,h);
  const target=ctx.createImageData(w,h), colors=source.data;
  const pre=new Float32Array(colors.length);
  for(let i=0;i<colors.length;i+=4){
    const a=colors[i+3]/255;
    pre[i]=colors[i]*a;pre[i+1]=colors[i+1]*a;pre[i+2]=colors[i+2]*a;pre[i+3]=colors[i+3];
  }
  const columns=Array.from({length:w},(_,i)=>{
    const u=(x+i+.5)/W;
    return {u,edges:definition.kind==='nose'?null:eyeEdges(u)};
  });
  const contour=motionContour(definition.kind,W,H);
  const featherMask=svgMask([x,y,w,h],contour);
  Object.assign(canvas.style,{maskImage:featherMask,webkitMaskImage:featherMask,
    maskSize:'100% 100%',webkitMaskSize:'100% 100%'});
  return {...definition,x,y,w,h,W,H,canvas,ctx,source,target,pre,columns};
}

function sample(p,u,v,offset) {
  const x=clamp(u*p.W-.5-p.x,0,p.w-1), y=clamp(v*p.H-.5-p.y,0,p.h-1);
  const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;
  const a=(y0*p.w+x0)*4,b=a+(x0+1<p.w?4:0);
  const c=a+(y0+1<p.h?p.w*4:0),d=c+(b-a);
  const wa=(1-fx)*(1-fy),wb=fx*(1-fy),wc=(1-fx)*fy,wd=fx*fy;
  const raw=p.pre,out=p.target.data;
  const alpha=raw[a+3]*wa+raw[b+3]*wb+raw[c+3]*wc+raw[d+3]*wd;
  for(let k=0;k<3;k++){
    const value=raw[a+k]*wa+raw[b+k]*wb+raw[c+k]*wc+raw[d+k]*wd;
    out[offset+k]=alpha>.0001?value*255/alpha:0;
  }
  out[offset+3]=alpha;
}

function over(out,index,r,g,b,weight) {
  if(weight<=0)return;
  const original=out[index+3]/255;
  const alpha=weight+original*(1-weight);
  const keep=original*(1-weight);
  out[index]=(out[index]*keep+r*weight)/alpha;
  out[index+1]=(out[index+1]*keep+g*weight)/alpha;
  out[index+2]=(out[index+2]*keep+b*weight)/alpha;
  out[index+3]=alpha*255;
}

function drawChangedPixels(p) {
  const base=p.source.data,out=p.target.data;
  for(let i=0;i<out.length;i+=4) {
    if(out[i]===base[i] && out[i+1]===base[i+1] &&
       out[i+2]===base[i+2] && out[i+3]===base[i+3]) {
      out[i+3]=0;
      continue;
    }
    // The native image is permanently untouched: no mask switch or crop
    // can re-rasterize a remote foot, crown or bridge at fractional sizes.
    // A nostril response flexes the surrounding painted rim only; the hole
    // and any translucent outer edge keep their original alpha.
    if(p.kind==='nose' && (base[i+3]<244 || out[i+3]<244)) {
      out[i+3]=0;
      continue;
    }
    // The blue lid moves over an already opaque socket. Replace its
    // changed *interior* samples; where a lid covers clear pixels the
    // ordinary source-over alpha is already the desired one.
    if(base[i+3]>=244 && out[i+3]>=244) out[i+3]=255;
  }
  p.ctx.putImageData(p.target,0,0);
}

function paintEye(p,gx,gy,blink,expression) {
  p.target.data.set(p.source.data);
  const irisU=p.irisX+.0105*gx;
  const irisEdges=eyeEdges(irisU);
  const irisV=irisEdges.top+(irisEdges.bottom-irisEdges.top)*(.51+.215*gy);
  const side=p.kind==='left'?1:-1, cos=.850, sin=.527*side;
  for(let col=0;col<p.w;col++){
    const {u,edges}=p.columns[col];
    if(!edges || edges.bottom<=edges.top)continue;
    const aperture=edges.bottom-edges.top;
    // Each lid keeps both corners sewn down. Only its upper fold responds
    // to a glance. The main horn and the lower eyelid stay registered.
    const tipWeight=clamp(aperture/.028);
    for(let row=0;row<p.h;row++){
      const v=(p.y+row+.5)/p.H;
      if(v<edges.anchor-.014 || v>edges.bottom+.003)continue;
      const pixel=4*(row*p.w+col);
      const rise=tipWeight*easing(edges.anchor-.014,edges.anchor+.004,v)*
        (1-easing(edges.top,edges.bottom,v))*(1-blink);
      const shiftedV=v-.00225*gy*rise;
      const sourceV=lidSourceV(shiftedV,edges,blink);
      const sourceU=u-.0011*gx*rise;
      if(Math.abs(sourceV-v)+Math.abs(sourceU-u)>1e-8) sample(p,sourceU,sourceV,pixel);
      if(!expression || blink>=.9999)continue;
      const lip=edges.top+aperture*blink;
      const open=easing(lip,lip+.0019,v)*(1-easing(edges.bottom-.002,edges.bottom,v));
      if(!open)continue;
      // Suppress the original tiny stationary dot while this eye is aimed.
      // The dark almond remains bounded by the original upper and lower lip.
      over(p.target.data,pixel,5,11,19,.83*open*expression);
      const du=u-irisU,dv=v-irisV;
      const qx=du*cos+dv*sin,qy=-du*sin+dv*cos;
      const radius=Math.hypot(qx/.0144,qy/.0074);
      const iris=1-easing(.80,1,radius);
      if(!iris)continue;
      let r=36,g=89,b=107;
      const pupil=1-easing(.72,1,Math.hypot(qx/.0072,qy/.0025));
      r+=(3-r)*pupil;g+=(10-g)*pupil;b+=(17-b)*pupil;
      const glint=1-easing(.22,1,Math.hypot((qx+.0044)/.0031,(qy+.0026)/.0023));
      r+=(174-r)*glint;g+=(229-g)*glint;b+=(246-b)*glint;
      over(p.target.data,pixel,r,g,b,iris*open*expression);
    }
  }
  drawChangedPixels(p);
}

function paintNose(p,gx,gy) {
  p.target.data.set(p.source.data);
  for(let col=0;col<p.w;col++){
    const {u}=p.columns[col];
    const nostril=u<.5?.466:.535;
    for(let row=0;row<p.h;row++){
      const v=(p.y+row+.5)/p.H;
      const radius=Math.hypot((u-nostril)/.029,(v-.670)/.0205);
      const weight=1-easing(.10,1,radius);
      if(!weight)continue;
      // At 450 CSS px this shifts a nostril by at most 1.6 px horizontally.
      // The muzzle outline, central pad and underlying A stay untouched.
      sample(p,u-.0036*gx*weight,v-.00165*gy*weight,4*(row*p.w+col));
    }
  }
  drawChangedPixels(p);
}

export async function createFollowingLogo(mount) {
  const art=new Image();
  art.decoding='async';
  art.alt='AFVAR bull within the ribbon A';
  // Match the real header's picture source so the dock uses the same pixels and browser cache.
  const artFile = matchMedia('(max-width: 600px)').matches ? './assets/approved-lite.webp' : './assets/approved.webp';
  art.src = new URL(artFile, import.meta.url).href;
  await art.decode();
  const container=document.createElement('div');
  container.dataset.followSurface='true';
  Object.assign(container.style,{position:'absolute',inset:'3%',width:'94%',height:'94%',pointerEvents:'none'});
  Object.assign(art.style,{position:'absolute',inset:'0',width:'100%',height:'100%',display:'block'});
  container.appendChild(art);
  const reference=document.createElement('canvas');
  reference.width=art.naturalWidth;reference.height=art.naturalHeight;
  const ref=reference.getContext('2d',{willReadFrequently:true});
  if(!ref)throw Error('Face patch sampling unavailable');
  ref.drawImage(art,0,0);
  const pieces=patches.map(def=>createPatch(def,reference,container));
  mount.replaceChildren(container);
  mount.dataset.surface='follow';
  let previousFeatures='none', lastX=NaN,lastY=NaN,lastBlink=NaN,dead=false;
  function draw(_progress,options={}) {
    if(dead)return;
    const reduced=!!options.reducedMotion;
    const strength=reduced?0:clamp(options.gazeStrength??(options.waiting?1:0));
    const gx=clamp(options.gazeX||0,-1,1)*strength;
    const gy=clamp(options.gazeY||0,-1,1)*strength;
    const blink=reduced?0:clamp(options.blink||0);
    if(gx===lastX && gy===lastY && blink===lastBlink)return;
    const gaze=Math.hypot(gx,gy), expression=clamp(gaze*2.5);
    const key=gaze>.0002?'all':blink>.0002?'eyes':'none';
    if(key!==previousFeatures){
      pieces.forEach((p,i)=>{p.canvas.style.display=(key==='all'||(key==='eyes'&&i<2))?'block':'none';});
      previousFeatures=key;
    }
    if(key!=='none'){
      paintEye(pieces[0],gx,gy,blink,expression);
      paintEye(pieces[1],gx,gy,blink,expression);
      if(key==='all'&&(gx!==lastX||gy!==lastY))paintNose(pieces[2],gx,gy);
    }
    lastX=gx;lastY=gy;lastBlink=blink;
  }
  draw(1);
  return {draw,dispose(){dead=true;container.remove();for(const p of pieces)p.canvas.width=p.canvas.height=1;}};
}
