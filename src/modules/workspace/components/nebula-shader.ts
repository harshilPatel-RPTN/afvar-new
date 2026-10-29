/** Procedural nebula, no image assets. `u_pointer` (-1..1) is the smoothed cursor. */

export const NEBULA_VERTEX = /* glsl */ `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

export const NEBULA_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_pointer;

  vec4 hash4(vec4 p) {
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
  float hash2(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * .1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise3(vec3 p) {
    vec3 cell = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float base = cell.x + cell.y * 157.0 + cell.z * 113.0;
    vec4 corners = base + vec4(0.0, 1.0, 157.0, 158.0);
    vec4 values = mix(hash4(corners), hash4(corners + 113.0), f.z);
    return mix(mix(values.x, values.y, f.x), mix(values.z, values.w, f.x), f.y);
  }
  const mat3 OCTAVE_TURN = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
  float fbm3(vec3 p) {
    float result = .50 * noise3(p);
    p = OCTAVE_TURN * p * 2.03 + 7.13;
    result += .25 * noise3(p);
    p = OCTAVE_TURN * p * 2.01 + 3.71;
    return result + .125 * noise3(p);
  }
  float fbm4(vec3 p) {
    float result = 0.0, amplitude = .5;
    for (int i = 0; i < 4; i++) {
      result += amplitude * noise3(p);
      p = OCTAVE_TURN * p * 2.03 + 7.13;
      amplitude *= .5;
    }
    return result;
  }
  float fbm5(vec3 p) {
    float result = 0.0, amplitude = .5;
    for (int i = 0; i < 5; i++) {
      result += amplitude * noise3(p);
      p = OCTAVE_TURN * p * 2.03 + 7.13;
      amplitude *= .5;
    }
    return result;
  }
  float starLayer(vec2 uv, vec2 cells, float threshold, float size) {
    vec2 cell = floor(uv * cells);
    vec2 local = fract(uv * cells);
    float seed = hash2(cell);
    vec2 point = .14 + .72 * vec2(hash2(cell + 13.7), hash2(cell + 47.2));
    vec2 starOffset = (local - point) * u_resolution / cells;
    float radius = size * (.65 + .55 * hash2(cell + 71.3));
    float core = exp(-dot(starOffset, starOffset) / (radius * radius));
    float halo = exp(-dot(starOffset, starOffset) / (radius * radius * 15.0)) * .08;
    float twinkle = .67 + .33 * sin(u_time * (.35 + .42 * hash2(cell + 9.1)) + seed * 62.83);
    float cross = exp(-abs(starOffset.x) * 3.5) * exp(-abs(starOffset.y) / 4.2);
    cross += exp(-abs(starOffset.y) * 3.5) * exp(-abs(starOffset.x) / 4.2);
    float diffraction = cross * .28 * step(.9985, seed);
    return step(threshold, seed) * (core + halo + diffraction) * twinkle;
  }
  float cloudRegion(vec2 point, vec2 center, vec2 extent) {
    vec2 local = (point - center) / extent;
    return exp(-dot(local, local) * 1.35);
  }
  float embeddedStar(vec2 uv, vec2 position, float size) {
    vec2 delta = (uv - position) * u_resolution;
    float squared = dot(delta, delta);
    return exp(-squared / (size * size)) + exp(-squared / (size * size * 42.0)) * .14;
  }

  void main() {
    vec2 rawUv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    // The gas gently swirls and parts around the (smoothed) cursor.
    vec2 toCursor = (rawUv - (u_pointer * .5 + .5)) * vec2(aspect, 1.0);
    float nearCursor = exp(-dot(toCursor, toCursor) * 8.0);
    float swirl = nearCursor * .08;
    vec2 stirred = mat2(cos(swirl), -sin(swirl), sin(swirl), cos(swirl)) * toCursor * (1.0 + nearCursor * .05);
    vec2 uv = rawUv + (stirred - toCursor) / vec2(aspect, 1.0);

    vec2 p = (uv - .5) * vec2(aspect, 1.0) * 4.6;
    float time = u_time * 7.0;
    // Slow wind: gas texture slides through the fixed cloud banks.
    vec2 wind = vec2(u_time * .022, sin(u_time * .045) * .08);

    vec2 flow = vec2(
      fbm3(vec3(p * .63 + vec2(3.1, 9.2) + wind * .5, time * .019)),
      fbm3(vec3(p * .63 + vec2(17.4, 2.8) + wind * .5, time * .016 + 8.4))
    ) - .43;
    vec2 domain = p + flow * .3 + wind;
    float backGas = fbm5(vec3(domain * 1.17 + vec2(5.2, 13.1), time * .012 + 2.7));
    float billows = fbm5(vec3(domain * 3.63 + vec2(18.4, 3.6), time * .010 + 11.2));
    float dust = fbm4(vec3(domain * 1.91 + vec2(7.3, 24.1), time * .008 + 29.6));
    float fine = fbm4(vec3(domain * 12.7 + vec2(31.7, 8.2), time * .006 + 43.3));
    // Large cloud masses sway gently around their places.
    vec2 composed = uv + flow * .034 + vec2(sin(u_time * .07), cos(u_time * .053)) * .012;

    float ridgeY = .13 + .66 * composed.x + .035 * sin(composed.x * 10.0);
    float ridgeDistance = (composed.y - ridgeY) / .105;
    float ridge = exp(-ridgeDistance * ridgeDistance) * (1.0 - smoothstep(.91, 1.10, composed.x));
    float warmCenter = cloudRegion(composed, vec2(.47,.56), vec2(.23,.30));
    float upperRed = cloudRegion(composed, vec2(.52,.85), vec2(.26,.30));
    float warmVolume = max(ridge * 1.14, warmCenter * .88 + upperRed * .52);
    warmVolume += cloudRegion(composed, vec2(.16,.20), vec2(.25,.17)) * .48;

    float plumeX = .17 + .022 * sin(composed.y * 9.0);
    float plumeDistance = (composed.x - plumeX) / .062;
    float leftColumn = exp(-plumeDistance * plumeDistance) * smoothstep(.27,.43,composed.y) * (1.0-smoothstep(.76,.90,composed.y));
    float leftBank = cloudRegion(composed, vec2(.20,.57), vec2(.135,.28));
    float rightBank = cloudRegion(composed, vec2(.84,.59), vec2(.245,.30));
    float upperBank = cloudRegion(composed, vec2(.76,.84), vec2(.235,.26));
    float lowerBank = cloudRegion(composed, vec2(.88,.34), vec2(.23,.25));
    float coolVolume = leftColumn * 1.08 + leftBank * .57 + rightBank * .95 + upperBank * .88 + lowerBank * .53;
    float roseVolume = cloudRegion(composed, vec2(.32,.56), vec2(.23,.32));
    roseVolume += cloudRegion(composed, vec2(.60,.25), vec2(.29,.20)) * .85;
    roseVolume += cloudRegion(composed, vec2(.62,.93), vec2(.23,.21)) * .62;

    float warmDensity = smoothstep(.22,.67,backGas*.48 + billows*.32 + fine*.20) * warmVolume;
    float coolDensity = smoothstep(.23,.69,(1.0-backGas)*.38 + billows*.42 + fine*.20) * coolVolume;
    float roseDensity = smoothstep(.23,.69,backGas*.40 + billows*.35 + fine*.25) * roseVolume;
    float granules = .83 + fine * .31;
    float hotCenter = cloudRegion(composed, vec2(.49,.55), vec2(.085,.155));
    float hotRight = cloudRegion(composed, vec2(.76,.68), vec2(.065,.105));
    float hotLeft = cloudRegion(composed, vec2(.18,.72), vec2(.048,.105));
    float heat = smoothstep(.40,.70,billows*.67 + fine*.33 + nearCursor * .04);

    vec3 color = vec3(.0035,.0075,.021);
    color += vec3(.10,.018,.085) * roseDensity * .98;
    color += vec3(.012,.045,.10) * (coolVolume + roseVolume) * (.11 + backGas*.20);
    vec3 hydrogen = mix(vec3(.82,.022,.040), vec3(1.17,.19,.038), heat);
    color += hydrogen * warmDensity * granules * 1.38;
    vec3 oxygen = mix(vec3(.008,.30,.51), vec3(.015,.80,.85), heat);
    color += oxygen * coolDensity * granules * 1.20;
    color += vec3(1.62,1.18,.73) * hotCenter * warmDensity * (.55 + billows*.80);
    color += vec3(.57,.73,.55) * hotRight * coolDensity * .55;
    color += vec3(.20,.88,.84) * hotLeft * coolDensity * .64;

    float pillars = cloudRegion(composed,vec2(.60,.50),vec2(.080,.125));
    pillars += cloudRegion(composed,vec2(.49,.32),vec2(.11,.13))*.88;
    pillars += cloudRegion(composed,vec2(.38,.20),vec2(.12,.13))*.63;
    pillars += cloudRegion(composed,vec2(.75,.47),vec2(.12,.085))*.63;
    float brokenEdge = (billows-.46)*1.25 + (fine-.46)*.58;
    float silhouette = smoothstep(.31,.91,pillars + brokenEdge * ridge);
    float dustKnots = smoothstep(.44,.67,dust+(billows-.46)*.26) * ridge;
    float opticalDepth = silhouette * 2.45 + dustKnots * .84;
    vec3 transmission = exp(-opticalDepth * vec3(.80,1.12,1.36));
    color *= transmission;
    color += vec3(.050,.003,.012) * silhouette * (.45+fine);

    vec2 filamentDomain = vec2(domain.x * 8.0 + domain.y * 5.2, domain.y * 26.0 - domain.x * 16.9);
    filamentDomain += flow * 5.0 + vec2(backGas * 3.0, billows * 1.6);
    float threads = fbm4(vec3(filamentDomain + 8.7, time * .007 + 52.2));
    float wisps = smoothstep(.47,.69,threads*.78+fine*.22) * smoothstep(.25,.61,billows);
    float dustEdgeLight = 4.0 * silhouette * (1.0-silhouette);
    vec3 warmWisps = mix(vec3(.88,.10,.055),vec3(1.35,.85,.48),clamp(hotCenter*.72+hotRight*.30+dustEdgeLight*.36,0.0,1.0));
    color += warmWisps * wisps * warmVolume * (.12+dustEdgeLight*.48) * (1.0-silhouette*.72);
    color += vec3(.22,.64,.77) * wisps * coolVolume * .44 * (1.0-silhouette*.83);
    color += vec3(.36,.055,.16) * wisps * roseVolume * .17;
    color += vec3(.30,.40,.62) * nearCursor * (warmDensity + coolDensity + roseDensity) * .08;
    vec2 drift = vec2(u_time*.000085,u_time*.000027);
    float stars = starLayer(rawUv + drift + u_pointer * .0015, vec2(235.0*max(aspect/1.8,.65),128.0),.980,.80);
    stars += starLayer(rawUv + drift*.6 + u_pointer * .0035, vec2(88.0*max(aspect/1.8,.65),51.0),.989,1.25)*1.85;
    float extinction = clamp(exp(-warmDensity*.38-coolDensity*.30-opticalDepth*.45),.18,1.0);
    color += vec3(.73,.86,1.0) * stars * extinction;
    color += vec3(1.25,1.19,1.08) * embeddedStar(uv,vec2(.488,.556),1.48);
    color += vec3(.78,1.02,1.20) * embeddedStar(uv,vec2(.298,.493),1.04);
    color += vec3(.95,1.06,1.25) * embeddedStar(uv,vec2(.781,.945),1.31);

    float corner = smoothstep(.49,.83,length((rawUv-.5)*vec2(.96,.85)));
    color *= 1.0-corner*.32;
    color = vec3(1.0)-exp(-max(color,vec3(0.0))*1.27);
    float luminance = dot(color,vec3(.2126,.7152,.0722));
    color = max(mix(vec3(luminance),color,1.13),vec3(0.0));
    gl_FragColor = vec4(color,1.0);
  }
`;
