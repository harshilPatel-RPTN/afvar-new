// Upper/lower lip of each eye, sampled from the approved 1254 px image.
// The right eye is traced independently. Only the coordinate used to index
// its samples is mirrored. Origin is the center of the upper-left texel.
const WIDTH = 1254;
const SECTIONS = [
  // x, left upper/lower, right upper/lower
  [460,604,604,603,603], [468,607,610,608,613],
  [476,610,620,611,623], [484,614,639,615,647],
  [492,618,656,620,661], [500,623,665,624,668],
  [508,627,671,629,674], [516,632,676,635,676],
  [524,639,678,642,680], [532,646,682,651,684],
  [540,657,688,662,690], [548,669,694,675,698],
  [556,685,705,690,710], [564,704,722,711,730],
  [572,730,737,735,740], [577,749,749,752,752],
];
const slopes = SECTIONS.map((s,i) => {
  const a = SECTIONS[Math.max(0,i-1)], b = SECTIONS[Math.min(i+1,SECTIONS.length-1)];
  return s.map((_,k) => k ? (b[k]-a[k])/(b[0]-a[0]) : 0);
});

function interpolate(a,b,da,db,dx,t) {
  return a+(b-a)*(3-2*t)*t*t+dx*(da*(1-t)-db*t)*t*(1-t);
}

// Cache this once per source x column on the CPU. Coordinates and results
// are expressed in normalized UV except for the center-of-texel arithmetic.
export function eyeEdges(u) {
  const px=u*WIDTH-.5, x=Math.min(px,WIDTH-1-px);
  if (x<460 || x>577) return null;
  const offset=px<WIDTH/2 ? 1 : 3;
  const i=Math.min(SECTIONS.length-2,SECTIONS.findIndex((section,index)=>index>0&&x<=section[0])-1);
  const a=SECTIONS[i], b=SECTIONS[i+1], dx=b[0]-a[0], t=(x-a[0])/dx;
  const at=k=>(interpolate(a[k],b[k],slopes[i][k],slopes[i+1][k],dx,t)+.5)/WIDTH;
  const top=at(offset), lower=Math.max(top, at(offset+1));
  // Both sides of this deforming patch stay attached to their existing
  // ribbons. At full closure a little overlap hides the anti-aliased seam.
  const travel=lower-top;
  const bottom=lower+Math.min(2.6/WIDTH,travel*.18);
  const anchor=top-Math.min(27/WIDTH,travel*.9);
  return {anchor,top,bottom};
}

export function lidSourceV(v,edges,blink) {
  if (!blink || !edges || v<=edges.anchor || v>=edges.bottom) return v;
  const {anchor,top,bottom}=edges;
  const lip=top+(bottom-top)*blink;
  if (v>lip) return top+(v-lip)*(bottom-top)/Math.max(1e-7,bottom-lip);
  // The upper rim's leading eight texels translate together. The shaded
  // fabric above them stretches from its fixed anchor to supply the fold.
  const strip=Math.min(8/WIDTH,(top-anchor)*.45);
  if (v>lip-strip) return top-(lip-v);
  return anchor+(v-anchor)*(top-strip-anchor)/Math.max(1e-7,lip-strip-anchor);
}

export function lidAperture(v,edges,blink) {
  if (!blink || !edges) return 1;
  if (blink>=.9999) return 0;
  const lip=edges.top+(edges.bottom-edges.top)*blink;
  const x=Math.max(0,Math.min(1,(v-lip)*WIDTH+.3));
  return x*x*(3-2*x);
}

// Generate the GLSL calibration from the exact same measured curves as the
// CPU rasterizer. No textures or shader state beyond the blink fraction.
const f=n=>n.toFixed(5);
const vec=(l,r)=>`vec2(${f(l)},${f(r)})`;
const sectionsGLSL=SECTIONS.slice(0,-1).map((a,i)=>{
  const b=SECTIONS[i+1], dx=b[0]-a[0];
  const pair=(source,offset)=>vec(source[offset],source[offset+1]);
  const choose=source=>`mix(${pair(source,1)},${pair(source,3)},rightSide)`;
  return `if(x<=${f(b[0])}){
    float t=(x-${f(a[0])})/${f(dx)};
    edges=mix(${choose(a)},${choose(b)},(3.-2.*t)*t*t)
      +${f(dx)}*(${choose(slopes[i])}*(1.-t)-${choose(slopes[i+1])}*t)*t*(1.-t);
  }`;
}).join('else ');
export const LID_GLSL=`
vec3 afvarEdges(vec2 uv){
  float px=uv.x*1254.-.5, x=min(px,1253.-px);
  if(x<460. || x>577. || uv.y<.45 || uv.y>.61) return vec3(0.);
  float rightSide=step(626.5,px);
  vec2 edges=vec2(0.);
  ${sectionsGLSL}
  edges=(edges+.5)/1254.;
  float travel=max(0.,edges.y-edges.x);
  return vec3(edges.x-min(27./1254.,travel*.9),edges.x,edges.y+min(2.6/1254.,travel*.18));
}
vec2 afvarLidUV(vec2 uv,float blink){
  if(blink<=0.) return uv;
  vec3 e=afvarEdges(uv); float y=uv.y;
  if(e.z<=0. || y<=e.x || y>=e.z) return uv;
  float lip=mix(e.y,e.z,blink);
  float strip=min(8./1254.,(e.y-e.x)*.45);
  if(y>lip) uv.y=e.y+(y-lip)*(e.z-e.y)/max(.000001,e.z-lip);
  else if(y>lip-strip) uv.y=e.y-(lip-y);
  else uv.y=e.x+(y-e.x)*(e.y-strip-e.x)/max(.000001,lip-strip-e.x);
  return uv;
}
float afvarLidAperture(vec2 uv,float blink){
  if(blink<=0.) return 1.;
  if(blink>=.9999) return 0.;
  vec3 e=afvarEdges(uv);
  if(e.z<=0.) return 1.;
  float t=clamp((uv.y-mix(e.y,e.z,blink))*1254.+.3,0.,1.);
  return t*t*(3.-2.*t);
}
`;
