// A stretched length of sheer fabric wraps around the sun. Each vertex lies
// on a cylindrical strip with a periodic longitude; the width of that strip
// alternates between spreading across the sphere and folding into its volume.
export const veilVertex = /* glsl */ `
  uniform float uPhase;
  uniform float uSheet;
  uniform float uRadius;
  uniform float uThink;
  varying vec2 vLoom;
  varying vec3 vView;
  varying vec3 vNormal;
  varying float vDepth;
  const float TAU = 6.28318530718;
  mat2 turn(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a)); }

  vec3 drape(float u, float v, float opening, float cap) {
    float k = uSheet, t = uPhase;
    float a = u + k*2.13;
    float twist = 1.24*sin(a-t+.65*k) + .75*sin(2.0*a+t-.74*k);
    float width = .90 + .18*cos(a+t+.5*k) - .05*k;
    float latitude = .31*sin(a-t+.32*k) + .19*sin(2.0*a+t-.70*k)
                   + v*width*cos(twist) + .13*(1.0-v*v)*sin(a+twist);
    latitude *= mix(1.0,.67,opening);
    float longitude = u + t + .20*v*sin(2.0*a+t+k) + .095*sin(a-t);
    float tuck = max(0.0, v*sin(twist));
    float radius = .999 - .028*k - .32*tuck*tuck
                        - .19*(1.0-v*v)*(.50+.48*cos(2.0*a-t));
    vec3 p = radius * vec3(cos(latitude)*sin(longitude), sin(latitude), cos(latitude)*cos(longitude));
    p.yz = turn(mix(.22+.40*cos(t+k*1.3)+k*.53,1.56,opening))*p.yz;
    p.xy = turn(-.38+k*1.16+.33*sin(t+.6*k)+.08*uThink)*p.xy;
    p.y += cap*.81*radius*(1.0-p.y*p.y/(radius*radius));
    return normalize(p)*radius;
  }

  void main() {
    float u = uv.x*TAU, v = uv.y*2.0-1.0;
    float opening = pow(.5+.5*cos(uPhase-2.13),3.5);
    float cap = pow(.5+.5*cos(uPhase-3.6),6.);
    vec3 p = drape(u,v,opening,cap);
    vec3 du = drape(u+.002,v,opening,cap)-p;
    vec3 dv = drape(u,v+.002,opening,cap)-p;
    vNormal = normalMatrix * normalize(cross(du,dv));
    vec4 view = modelViewMatrix * vec4(p*uRadius,1.);
    vView = view.xyz;
    vDepth = (view.z-modelViewMatrix[3].z) / max(.0001,uRadius*length(modelViewMatrix[0].xyz));
    vLoom = uv;
    gl_Position = projectionMatrix * view;
  }
`;

export const veilFragment = /* glsl */ `
  uniform float uPhase;
  uniform float uSheet;
  uniform float uHeat;
  varying vec2 vLoom;
  varying vec3 vView;
  varying vec3 vNormal;
  varying float vDepth;
  const float TAU = 6.28318530718;

  // A subpixel thread averages to its mean instead of flickering on phones.
  float thread(float x) {
    return cos(TAU*x) * (1.0-smoothstep(.16,.52,fwidth(x)));
  }
  void main() {
    vec3 n = normalize(vNormal);
    float headOn = clamp(abs(dot(n,normalize(-vView))),0.,1.);
    float glancing = 1.0-headOn;
    float u = vLoom.x*TAU, v = vLoom.y, t = uPhase, k = uSheet;
    float edgeDist = min(v,1.0-v);
    float hem = 1.0-smoothstep(.002, .030+fwidth(v), edgeDist);
    float fold = pow(glancing,1.9);
    float front = smoothstep(-.86,.74,vDepth);
    float warmth = .5+.5*sin(u+t+.8*k+1.0*sin(2.0*u-t)+v*2.4);
    float lit = smoothstep(.16,.90,.62*front+.45*warmth);
    float threads = .60*thread(v*96.0 + 1.8*sin(u+t)) + .40*thread(vLoom.x*190.0);

    float copper = smoothstep(.40,.92,warmth);
    vec3 dye = mix(vec3(.28,.007,.090),vec3(.46,.037,.018),copper);
    vec3 color = dye*(.34+.70*lit)*(1.0+.18*threads);
    float caustic = clamp((fold + .54*hem)*(.32+.92*lit),0.,1.);
    color += mix(vec3(1.12,.052,.34),vec3(1.55,.25,.045),copper) * caustic;
    color += vec3(1.95,1.40,.61) * smoothstep(.44,.94,caustic) * lit * (.45+.55*copper);
    float alpha = clamp(.065+.105*front+.72*caustic,0.,.93);
    // The recessed side absorbs more light. Only the facing, turned hem
    // catches a fine amber reflection; the weave remains visible underneath.
    color *= mix(.74,1.0,front);
    color += vec3(.34,.14,.048) * hem*front*(.23+.77*fold);
    gl_FragColor = vec4(color*(.87+.20*uHeat),alpha);
    #include <colorspace_fragment>
  }
`;

// A faint plum atmosphere and amber halo around the three-dimensional sun.
export const hearthVertex = /* glsl */ `
  varying vec2 vDisc;
  void main() {
    vDisc = (uv-.5)*3.3;
    vec4 view = modelViewMatrix * vec4(0.,0.,0.,1.);
    view.xy += position.xy * vec2(length(modelViewMatrix[0].xyz),length(modelViewMatrix[1].xyz));
    gl_Position = projectionMatrix * view;
  }
`;

export const hearthFragment = /* glsl */ `
  uniform float uPhase;
  uniform float uSparks;
  varying vec2 vDisc;
  void main() {
    float r = length(vDisc);
    if (r >= 1.63) discard;
    float atmosphere = 1.0-smoothstep(.70,1.63,r);
    float fire = exp(-16.0*max(0.,r-.164));
    vec3 wine = vec3(.009,.0015,.0055) * (.78+.22*uSparks);
    float shellLight = smoothstep(-.3,.75, vDisc.y+.42*vDisc.x+.26*cos(uPhase));
    wine += vec3(.085,.012,.013)*shellLight*exp(-125.0*abs(r-.995));
    vec3 scene = wine + vec3(.54,.18,.034)*fire*(.95+.05*cos(uPhase));
    gl_FragColor = vec4(scene, clamp(.70*atmosphere+.30*fire,0.,1.));
    #include <colorspace_fragment>
  }
`;

export const sunVertex = /* glsl */ `
  varying vec3 vEye;
  varying vec3 vNormal;
  void main() {
    vec4 view = modelViewMatrix * vec4(position,1.);
    vNormal = normalMatrix * normal;
    vEye = -view.xyz;
    gl_Position = projectionMatrix * view;
  }
`;

export const sunFragment = /* glsl */ `
  varying vec3 vEye;
  varying vec3 vNormal;
  void main() {
    float facing = clamp(dot(normalize(vNormal),normalize(vEye)),0.,1.);
    float limb = 1.-facing;
    vec3 light = mix(vec3(1.42,1.17,.78),vec3(1.10,.52,.16),smoothstep(.08,.90,limb));
    gl_FragColor = vec4(light,1.);
    #include <colorspace_fragment>
  }
`;
