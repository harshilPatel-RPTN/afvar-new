// Machined-metal asset kit for /home-demo hero objects. Instead of primitive
// tori, parts are modelled from real cross-sections: a closed (radius, height)
// profile with chamfered edges and grooves, revolved around Z with crisp
// per-facet normals (hard machined edges, smooth around the circumference),
// closed end caps on partial arcs, UVs, and circumferential tangents so the
// physical material's anisotropy reads as brushed, turned metal.
import * as THREE from "three";

/** Closed polygon in the (radius, height) plane, counter-clockwise. */
export type Profile = readonly (readonly [number, number])[];

/** A machined band: chamfered rectangle with a groove turned into the outer face. */
export function bandProfile({
  rIn,
  rOut,
  height,
  chamfer,
  grooveWidth = 0,
  grooveDepth = 0,
}: {
  rIn: number;
  rOut: number;
  height: number;
  chamfer: number;
  grooveWidth?: number;
  grooveDepth?: number;
}): Profile {
  const h = height / 2;
  const c = chamfer;
  const pts: [number, number][] = [
    [rIn + c, -h],
    [rOut - c, -h],
    [rOut, -h + c],
  ];
  if (grooveWidth > 0 && grooveDepth > 0) {
    const g = grooveWidth / 2;
    pts.push([rOut, -g], [rOut - grooveDepth, -g], [rOut - grooveDepth, g], [rOut, g]);
  }
  pts.push([rOut, h - c], [rOut - c, h], [rIn + c, h], [rIn, h - c], [rIn, -h + c]);
  return pts;
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _n = new THREE.Vector3();

/**
 * Revolve a closed profile around +Z through `phiLength` radians. Each profile
 * edge gets its own vertex strip (hard edges between facets); partial arcs get
 * triangulated end caps. Winding is checked per triangle against the intended
 * normal, so faces always point outward.
 */
export function revolveProfile(profile: Profile, segments: number, phiLength = Math.PI * 2, uRepeat = 8): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const tangents: number[] = [];
  const indices: number[] = [];

  // Total profile length for v coordinates.
  const n = profile.length;
  let perimeter = 0;
  for (let k = 0; k < n; k++) {
    const [r0, h0] = profile[k];
    const [r1, h1] = profile[(k + 1) % n];
    perimeter += Math.hypot(r1 - r0, h1 - h0);
  }

  const pushTri = (i0: number, i1: number, i2: number, nx: number, ny: number, nz: number) => {
    _a.fromArray(positions, i0 * 3);
    _b.fromArray(positions, i1 * 3);
    _c.fromArray(positions, i2 * 3);
    _n.subVectors(_b, _a).cross(_c.sub(_a));
    if (_n.x * nx + _n.y * ny + _n.z * nz >= 0) indices.push(i0, i1, i2);
    else indices.push(i0, i2, i1);
  };

  // Side strips — one per profile edge.
  let vAcc = 0;
  for (let k = 0; k < n; k++) {
    const [r0, h0] = profile[k];
    const [r1, h1] = profile[(k + 1) % n];
    const len = Math.hypot(r1 - r0, h1 - h0);
    if (len < 1e-9) continue;
    // Outward normal of a CCW polygon edge in (r, h): (dh, -dr).
    const nr = (h1 - h0) / len;
    const nh = -(r1 - r0) / len;
    const v0 = vAcc / perimeter;
    const v1 = (vAcc + len) / perimeter;
    vAcc += len;

    const base = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * phiLength;
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);
      const u = (i / segments) * uRepeat * (phiLength / (Math.PI * 2));
      for (const [r, h, v] of [
        [r0, h0, v0],
        [r1, h1, v1],
      ] as const) {
        positions.push(r * cos, r * sin, h);
        normals.push(nr * cos, nr * sin, nh);
        uvs.push(u, v);
        tangents.push(-sin, cos, 0, 1);
      }
    }
    for (let i = 0; i < segments; i++) {
      const a = base + i * 2;
      const b = a + 1;
      const c = a + 3;
      const d = a + 2;
      const phi = ((i + 0.5) / segments) * phiLength;
      const nx = nr * Math.cos(phi);
      const ny = nr * Math.sin(phi);
      pushTri(a, b, d, nx, ny, nh);
      pushTri(b, c, d, nx, ny, nh);
    }
  }

  // End caps on partial arcs.
  if (phiLength < Math.PI * 2 - 1e-6) {
    const contour = profile.map(([r, h]) => new THREE.Vector2(r, h));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const [phi, sign] of [
      [0, -1],
      [phiLength, 1],
    ] as const) {
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);
      // Cap faces along ∓ the circumferential tangent.
      const nx = -sin * sign;
      const ny = cos * sign;
      const base = positions.length / 3;
      for (const [r, h] of profile) {
        positions.push(r * cos, r * sin, h);
        normals.push(nx, ny, 0);
        uvs.push(r * 4, h * 4);
        tangents.push(cos, sin, 0, 1);
      }
      for (const [i0, i1, i2] of tris) pushTri(base + i0, base + i1, base + i2, nx, ny, 0);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("tangent", new THREE.Float32BufferAttribute(tangents, 4));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

/* ---------------------------------------------------------- brushed finish */

/** mulberry32 — seeded so the finish is identical on every load. */
const prng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

let brushedCache: THREE.DataTexture | null = null;

/**
 * Roughness map of fine turning marks: streaks run around the circumference
 * (constant along u, varying along v), with faint per-texel grain. Shared and
 * built once. Green channel drives roughness.
 */
function brushedRoughnessMap(): THREE.DataTexture {
  if (brushedCache) return brushedCache;
  const w = 16;
  const h = 512;
  const rnd = prng(7);
  const data = new Uint8Array(w * h * 4);
  let streak = 0.5;
  for (let y = 0; y < h; y++) {
    // Correlated streak value per row — fine turned lines.
    streak = 0.7 * streak + 0.3 * rnd();
    for (let x = 0; x < w; x++) {
      const g = 0.62 + streak * 0.3 + (rnd() - 0.5) * 0.06;
      const v = Math.max(0, Math.min(255, Math.round(g * 255)));
      const i = (y * w + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  brushedCache = tex;
  return tex;
}

/** Dark turned titanium: brushed anisotropic metal with a thin clear coat. */
export function machinedMetalMaterial(color = "#7b8490"): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 1,
    roughness: 0.4,
    envMapIntensity: 1.35,
    roughnessMap: brushedRoughnessMap(),
    anisotropy: 0.7,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
  });
}

/* ------------------------------------------------------- graduation marks */

/**
 * Instance matrices for engraved graduation ticks on a band's front face
 * (z = +height/2): `perTurn` marks per full turn, every `majorEvery`-th one
 * longer. Returns matrices for minor and major marks separately.
 */
export function graduationMatrices({
  rMid,
  faceZ,
  phiLength,
  perTurn,
  majorEvery,
  minorLen,
  majorLen,
  width,
}: {
  rMid: number;
  faceZ: number;
  phiLength: number;
  perTurn: number;
  majorEvery: number;
  minorLen: number;
  majorLen: number;
  width: number;
}): { minor: THREE.Matrix4[]; major: THREE.Matrix4[] } {
  const minor: THREE.Matrix4[] = [];
  const major: THREE.Matrix4[] = [];
  const count = Math.floor((perTurn * phiLength) / (Math.PI * 2));
  const q = new THREE.Quaternion();
  const axis = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i <= count; i++) {
    const phi = (i / perTurn) * Math.PI * 2;
    if (phi > phiLength) break;
    const isMajor = i % majorEvery === 0;
    const len = isMajor ? majorLen : minorLen;
    q.setFromAxisAngle(axis, phi);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(phi) * rMid, Math.sin(phi) * rMid, faceZ),
      q,
      new THREE.Vector3(len, width, 0.003),
    );
    (isMajor ? major : minor).push(m);
  }
  return { minor, major };
}
