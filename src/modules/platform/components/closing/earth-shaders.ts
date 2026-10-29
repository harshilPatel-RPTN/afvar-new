/* GLSL for the closing-block earth (see EarthScene.tsx). View-space lighting; the orthographic view direction is +z. */

export const EARTH_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
void main() {
  vUv = uv;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const EARTH_FRAG = /* glsl */ `
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform vec3 uSun;
uniform float uMode;
varying vec2 vUv;
varying vec3 vN;

void main() {
  vec3 n = normalize(vN);
  // uMode 1 = night view (the sun was clicked into a moon): pushing the sun dot
  // negative slides the whole visible face into night — city lights, twilight
  // tints and the glint all follow through the same maths.
  float sunDot = mix(dot(n, uSun), -0.6, uMode);

  vec3 surface = texture2D(uDay, vUv).rgb;
  // Land/ocean/ice from the day map: blue-dominant pixels are ocean; bright,
  // desaturated pixels are polar ice (Greenland, the caps). Ice must be carved
  // out of the ocean mask — white has a high blue channel, so without this the
  // ice sheet half-reads as sea and Greenland comes out as a dark smudge — and
  // it stays bright with a cool cast instead of being dimmed to rock.
  float ice = smoothstep(0.45, 0.68, min(surface.r, min(surface.g, surface.b)));
  float ocean = smoothstep(-0.01, 0.06, surface.b - max(surface.r, surface.g) * 0.95) * (1.0 - ice);
  surface = mix(surface, surface * vec3(0.88, 0.94, 1.0), ice);
  float land = 1.0 - ocean;

  // Day/night, realistic but never pitch black: the sun sits high to the upper right
  // in front of the planet, so the visible cap is in daylight with night falling away
  // to the lower left. The terminator is wide and soft (twilight) rather than a hard line.
  float lambert = max(sunDot, 0.0);
  float dayMix = smoothstep(0.0, 0.42, sunDot);
  // Low sun near the terminator is warm (sunrise); higher up it turns to clean daylight.
  vec3 sunColor = mix(vec3(1.0, 0.6, 0.34), vec3(1.0, 0.96, 0.9), smoothstep(0.2, 0.62, sunDot));
  vec3 oceanDay = vec3(0.007, 0.025, 0.068);
  // Kept deliberately dim: from orbit the earth is darker than the eye expects.
  vec3 dayCol = mix(oceanDay * (0.38 + 0.45 * lambert), surface * sunColor * (0.10 + 0.38 * lambert), land);

  // Night: moonlit continents (cool, dimmed, still readable) and city lights
  // graded like current VIIRS composites — a contrast curve cuts the haze floor
  // and pops the urban cores, sodium-orange in the dim sprawl turning LED-white
  // in the brightest centres. The clicked night view runs them a touch brighter.
  vec3 nightTex = texture2D(uNight, vUv).rgb;
  float lum = dot(nightTex, vec3(0.299, 0.587, 0.114));
  vec3 cityLights = mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.93, 0.82), smoothstep(0.25, 0.8, lum)) * pow(lum, 1.5) * 1.6 * (1.0 + 0.5 * uMode);
  // New Zealand's lights are barely-there on the Black Marble map (uv box around
  // 166–180°E, 34–47°S); lift them so the NZD corner of the corridor glows at night.
  float nzBox = smoothstep(0.955, 0.962, vUv.x) * smoothstep(0.232, 0.245, vUv.y) * (1.0 - smoothstep(0.305, 0.32, vUv.y));
  cityLights *= 1.0 + nzBox * 3.0;
  vec3 oceanNight = vec3(0.004, 0.009, 0.028);
  vec3 nightCol = mix(oceanNight, surface * vec3(0.16, 0.19, 0.28) + cityLights, land);

  vec3 col = mix(nightCol, dayCol, dayMix);

  // Soft sun glint on the ocean, where the water mirrors the sun to the viewer.
  vec3 bounced = reflect(vec3(0.0, 0.0, -1.0), n);
  col += vec3(1.0, 0.85, 0.6) * pow(max(dot(bounced, uSun), 0.0), 90.0) * ocean * dayMix * 0.12;

  // Twilight band: a soft dawn tint where night meets day.
  float twilight = exp(-pow((sunDot - 0.16) / 0.13, 2.0));
  col += vec3(0.55, 0.26, 0.12) * twilight * mix(0.025, 0.14, land);

  // Thin blue scattering haze over the lit face, like a real atmosphere seen from orbit.
  float edgeView = 1.0 - max(n.z, 0.0);
  col = mix(col, vec3(0.32, 0.52, 0.9), pow(edgeView, 3.0) * 0.05 * dayMix);

  // Limb darkening: grazing surface falls off toward the edges, as in photos from
  // orbit — kept gentle so the countries along the top of the arc stay readable.
  col *= 0.78 + 0.22 * max(n.z, 0.0);

  // No glowing atmosphere band: only a faint cool edge away from the sun so the limb still reads.
  float toSun = smoothstep(-0.2, 0.45, sunDot);
  col += vec3(0.04, 0.1, 0.3) * pow(1.0 - max(n.z, 0.0), 6.0) * (1.0 - toSun) * 0.6;

  // The maps are sampled as linear light; encode for the screen (sRGB) or every tone comes out far too dark.
  col = linearToOutputTexel(vec4(col, 1.0)).rgb;
  // Dither against banding in the dark gradients.
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

export const FLARE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/*
 * Sun hanging in the clear sky to the planet's upper right (EarthScene sets the
 * quad's position), in pixel space: the quad is square, uWidth px a side, and
 * the sun sits at its centre. A crisp disc with a tight bloom and a wide soft
 * halo — no horizon streak and no occlusion, since the disc floats well clear
 * of the limb. uMoon fades the sun out; the moon itself is a real textured
 * sphere (MOON_FRAG) that EarthScene cross-fades in at the same spot.
 */
export const FLARE_FRAG = /* glsl */ `
uniform float uTime;
uniform float uWidth;
uniform float uMoon;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * uWidth;
  float r = length(p);
  // Sun as a camera sees it: a blinding, overexposed core bleeding into a warm
  // glare with a steep falloff, a faint four-point diffraction spike and a wide
  // soft halo — no hard disc edge, since real optics never draw one.
  float core = exp(-r * r / 180.0) * 2.4;
  float glare = exp(-r / 34.0) * 1.1;
  float halo = exp(-r / 150.0) * 0.38;
  vec2 a = abs(p);
  float spikes = (exp(-a.y * a.y / 3.0) + exp(-a.x * a.x / 3.0)) * exp(-r / 90.0) * 0.5;
  float shimmer = 0.96 + 0.04 * sin(uTime * 1.3);
  vec3 col = (vec3(1.0, 0.99, 0.97) * core + vec3(1.0, 0.9, 0.7) * glare * shimmer + vec3(1.0, 0.78, 0.5) * halo + vec3(1.0, 0.95, 0.85) * spikes) * (1.0 - uMoon);
  // Alpha follows brightness so the transparent canvas stays clear around the flare.
  gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
}`;

/*
 * Night-only star points (drawn when the sun is clicked into the moon): each
 * point twinkles on its own phase, and uFade slides the whole field in and out
 * with the night view.
 */
export const STAR_VERT = /* glsl */ `
attribute float aPhase;
attribute float aSize;
attribute vec3 aColor;
uniform float uTime;
varying float vTwinkle;
varying vec3 vColor;
void main() {
  // Gentle scintillation, not blinking: real stars shimmer a little.
  vTwinkle = 0.55 + 0.45 * (0.5 + 0.5 * sin(uTime * (0.6 + aPhase * 0.3) + aPhase * 17.0));
  vColor = aColor;
  gl_PointSize = aSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const STAR_FRAG = /* glsl */ `
uniform float uFade;
varying float vTwinkle;
varying vec3 vColor;
void main() {
  // Gaussian falloff: a soft point of light with no hard disc edge.
  vec2 d = gl_PointCoord - 0.5;
  float a = exp(-dot(d, d) * 16.0) * vTwinkle * uFade;
  gl_FragColor = vec4(vColor, a);
}`;

/*
 * Shooting-star streak (night view only): a thin quad with a bright head at
 * vUv.x = 1 and a tail fading behind it; uFade carries both the flight's own
 * envelope and the night blend.
 */
export const STREAK_FRAG = /* glsl */ `
uniform float uFade;
varying vec2 vUv;
void main() {
  float tail = pow(vUv.x, 2.2);
  float edge = exp(-pow((vUv.y - 0.5) * 3.2, 2.0));
  float a = tail * edge * uFade;
  gl_FragColor = vec4(vec3(0.95, 0.97, 1.0) * a, a);
}`;

export const MOON_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
void main() {
  vUv = uv;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/*
 * The moon that replaces the clicked-away sun: a real sphere carrying NASA's
 * moon albedo map, lit gibbous from the sun's old corner with a soft regolith
 * falloff. uFade cross-fades it in while FLARE_FRAG fades the sun out.
 */
export const MOON_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uFade;
varying vec2 vUv;
varying vec3 vN;
void main() {
  vec3 n = normalize(vN);
  float lit = pow(clamp(dot(n, normalize(vec3(0.42, 0.3, 0.84))), 0.0, 1.0), 0.8);
  vec3 col = texture2D(uMap, vUv).rgb * (0.05 + 1.05 * lit);
  col = linearToOutputTexel(vec4(col, 1.0)).rgb;
  gl_FragColor = vec4(col, uFade);
}`;
