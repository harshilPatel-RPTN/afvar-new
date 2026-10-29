"use client";

/**
 * Forex model: a dark-glass Earth drawn as a dotted gold land map. Session
 * pulses hand over Sydney → Tokyo → London → New York while the globe eases
 * round to show the active leg; $ / € / ¥ / £ / NZ$ coins ride a stabilised orbit,
 * each tethered to its home centre by a dotted bead link.
 */
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { clamp01, CYAN, GOLD, Live, Neon, SILVER, SymbolCoin, type CoinSymbol, useLocalClock } from "./parts";

/* -------------------------------------------------------------- geometry */

const R = 1.42;
const TILT: [number, number, number] = [0.16, 0, -0.1];

function onGlobe(lat: number, lon: number, radius = R) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

const smooth = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
const band = (x: number, a: number, b: number) => smooth((x - a) / (b - a));
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Great-circle arc that rises off the surface (never dips into the globe). */
class SkyArc extends THREE.Curve<THREE.Vector3> {
  private readonly omega: number;
  constructor(
    private readonly a: THREE.Vector3,
    private readonly b: THREE.Vector3,
    private readonly height: number,
  ) {
    super();
    this.omega = a.angleTo(b);
  }
  override getPoint(t: number, target = new THREE.Vector3()) {
    const s = Math.sin(this.omega);
    target
      .copy(this.a)
      .multiplyScalar(Math.sin((1 - t) * this.omega) / s)
      .addScaledVector(this.b, Math.sin(t * this.omega) / s);
    return target.setLength(R * (1 + this.height * Math.sin(Math.PI * t)));
  }
}

/** Session order: Sydney → Tokyo → London → New York → (next day) Sydney. */
const CENTRES = [
  { name: "sydney", lat: -33.87, lon: 151.21 },
  { name: "tokyo", lat: 35.68, lon: 139.69 },
  { name: "london", lat: 51.51, lon: -0.13 },
  { name: "newyork", lat: 40.71, lon: -74.01 },
];
const FRANKFURT = { lat: 50.11, lon: 8.68 };
const WELLINGTON = { lat: -41.29, lon: 174.78 };
/** Home centres that are not part of the session hand-over: small gold dots, no sonar. */
const EXTRAS = [FRANKFURT, WELLINGTON];
const LEG = 2.9;

/** Orbit: a flat ellipse in its own plane, inclined so the front pass runs below the globe's middle. */
const ORBIT = { x: 3.05, z: 2.3, inclination: 0.3, speed: 0.22 };
const COINS: { symbol: CoinSymbol; color: string; home: { lat: number; lon: number } }[] = [
  { symbol: "usd", color: GOLD, home: CENTRES[3] },
  { symbol: "eur", color: SILVER, home: FRANKFURT },
  { symbol: "jpy", color: "#d9a48a", home: CENTRES[1] },
  { symbol: "gbp", color: "#efd9a0", home: CENTRES[2] },
  { symbol: "nzd", color: "#a8c9b8", home: WELLINGTON },
];
const BEADS = 22;

/* ------------------------------------------------------------- land dots */

/** Samples the NASA day map once and keeps Fibonacci-sphere points that fall on land. */
function useLandDots() {
  const [points, setPoints] = useState<{ lat: number; lon: number }[]>([]);
  useEffect(() => {
    let live = true;
    const image = new Image();
    image.decoding = "async";
    image.src = "/platform/earth/earth_day_4096.jpg";
    image.onload = () => {
      if (!live) return;
      const w = 360;
      const h = 180;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const n = 30000;
      const golden = Math.PI * (3 - Math.sqrt(5));
      const out: { lat: number; lon: number }[] = [];
      for (let i = 0; i < n; i++) {
        const y = 1 - ((i + 0.5) / n) * 2;
        const lat = THREE.MathUtils.radToDeg(Math.asin(y));
        if (lat < -60) continue;
        const lon = THREE.MathUtils.radToDeg(wrap(i * golden));
        const px = Math.min(w - 1, Math.floor(((lon + 180) / 360) * w));
        const py = Math.min(h - 1, Math.floor(((90 - lat) / 180) * h));
        const o = (py * w + px) * 4;
        const r = data[o];
        const g = data[o + 1];
        const b = data[o + 2];
        if (b > Math.max(r, g) * 0.95) continue; // ocean
        out.push({ lat, lon });
      }
      setPoints(out);
    };
    return () => {
      live = false;
    };
  }, []);
  return points;
}

function LandDots() {
  const points = useLandDots();
  const mesh = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = mesh.current;
    if (!m || !points.length) return;
    const homes = [...CENTRES, ...EXTRAS].map((c) => onGlobe(c.lat, c.lon).normalize());
    const base = new THREE.Color(GOLD);
    const color = new THREE.Color();
    const matrix = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const z = new THREE.Vector3(0, 0, 1);
    const scale = new THREE.Vector3(1, 1, 1);
    points.forEach((p, i) => {
      const pos = onGlobe(p.lat, p.lon, R + 0.004);
      const n = pos.clone().normalize();
      q.setFromUnitVectors(z, n);
      matrix.compose(pos, q, scale);
      m.setMatrixAt(i, matrix);
      const near = Math.max(...homes.map((h) => 1 - smooth(h.angleTo(n) / 0.16)));
      m.setColorAt(i, color.copy(base).multiplyScalar(0.58 + 0.5 * near));
    });
    m.count = points.length;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [points]);
  if (!points.length) return null;
  return (
    <instancedMesh key={points.length} ref={mesh} args={[undefined, undefined, points.length]} frustumCulled={false}>
      <circleGeometry args={[0.0085, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ scene */

export function ForexScene({ still }: Live) {
  const time = useLocalClock(still);
  const root = useRef<THREE.Group>(null);
  const globe = useRef<THREE.Group>(null);
  const yaw = useRef<number | null>(null);
  const comets = useRef<THREE.Group>(null);
  const arcMeshes = useRef<THREE.Group>(null);
  const dots = useRef<THREE.Group>(null);
  const sonars = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const coins = useRef<(THREE.Group | null)[]>([]);
  const homes = useRef<(THREE.Object3D | null)[]>([]);
  const links = useRef<(THREE.InstancedMesh | null)[]>([]);
  const runners = useRef<(THREE.Mesh | null)[]>([]);
  const linkAlpha = useRef(COINS.map(() => 0));

  const arcs = useMemo(
    () =>
      CENTRES.map((from, i) => {
        const to = CENTRES[(i + 1) % CENTRES.length];
        const a = onGlobe(from.lat, from.lon);
        const b = onGlobe(to.lat, to.lon);
        const curve = new SkyArc(a, b, 0.07 + 0.1 * (a.angleTo(b) / Math.PI));
        const mid = curve.getPoint(0.5);
        return { curve, tube: new THREE.TubeGeometry(curve, 96, 0.0065, 6, false), facing: -Math.atan2(mid.x, mid.z) };
      }),
    [],
  );
  const surface = useMemo(() => {
    const z = new THREE.Vector3(0, 0, 1);
    return [...CENTRES, ...EXTRAS].map((c) => {
      const position = onGlobe(c.lat, c.lon, R + 0.012);
      return { position, quaternion: new THREE.Quaternion().setFromUnitVectors(z, position.clone().normalize()) };
    });
  }, []);
  const scratch = useMemo(
    () => ({
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      n: new THREE.Vector3(),
      c: new THREE.Vector3(),
      cam: new THREE.Vector3(),
      p: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(),
      m: new THREE.Matrix4(),
      s: new THREE.Vector3(),
      bez: new THREE.CubicBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()),
    }),
    [],
  );

  useFrame((state, dt) => {
    const t = time.current;
    const intro = still ? 1 : smooth(t / 1.6);
    const phase = (t / LEG) % CENTRES.length;
    const active = Math.floor(phase);
    const f = phase - active;
    const next = (active + 1) % CENTRES.length;
    const travel = smooth((f - 0.1) / 0.58);
    const arrive = band(f, 0.64, 0.74);

    /* globe: intro scale + yaw eased toward the leg about to play */
    if (globe.current) {
      const lead = Math.floor(phase + 0.22) % CENTRES.length;
      const target = arcs[lead].facing;
      if (yaw.current === null || still) yaw.current = target;
      else yaw.current += wrap(target - yaw.current) * (1 - Math.exp(-dt * 1.15));
      globe.current.rotation.y = yaw.current;
      globe.current.scale.setScalar(0.72 + 0.28 * intro);
    }

    /* the session glow: source city until the comet lands, then the next one */
    const glow = (i: number) => (i === active ? 1 - arrive : i === next ? arrive : 0);

    arcMeshes.current?.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      const on = i === active ? band(f, 0, 0.12) * (1 - band(f, 0.78, 1)) : 0;
      mat.color.set(CYAN).multiplyScalar(0.55 + 0.75 * on);
      mat.opacity = 0.22 + 0.78 * on;
    });

    comets.current?.children.forEach((trail, i) => {
      const on = i === active && f > 0.08 && f < 0.82;
      trail.visible = on;
      if (!on) return;
      const fade = 1 - band(f, 0.66, 0.8);
      trail.children.forEach((bead, k) => {
        bead.position.copy(arcs[i].curve.getPoint(clamp01(travel - k * 0.024)));
        const mat = (bead as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = fade * (1 - k / trail.children.length) * (travel > k * 0.024 ? 1 : 0);
      });
    });

    dots.current?.children.forEach((child, i) => {
      const g = i < CENTRES.length ? glow(i) : 0;
      const pop = i === next ? Math.sin(Math.PI * clamp01((f - 0.66) / 0.22)) : 0;
      child.scale.setScalar(1 + 0.45 * g + 0.7 * pop);
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = (i < CENTRES.length ? 0.9 : 0.6) + 2.2 * Math.max(g, pop);
    });

    sonars.current?.children.forEach((city, i) => {
      const g = glow(i);
      city.children.forEach((ring, k) => {
        const s = (t * 0.75 + k * 0.5) % 1;
        ring.scale.setScalar(0.05 + 0.3 * s);
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = still ? 0 : g * Math.pow(1 - s, 1.6) * 0.85;
        ring.visible = mat.opacity > 0.01;
      });
    });

    /* orbit plane: counter part of the rig's pitch so the ring never turns edge-on through the globe */
    if (orbit.current?.parent) {
      orbit.current.parent.getWorldQuaternion(scratch.q);
      scratch.e.setFromQuaternion(scratch.q, "XYZ");
      orbit.current.rotation.x = ORBIT.inclination - 0.75 * scratch.e.x;
    }
    const spin = t * ORBIT.speed + 0.35;
    coins.current.forEach((coin, i) => {
      if (!coin) return;
      const a = spin + (i * Math.PI * 2) / COINS.length;
      coin.position.set(Math.cos(a) * ORBIT.x, 0, Math.sin(a) * ORBIT.z);
      coin.scale.setScalar(0.5 * intro);
      coin.lookAt(state.camera.position);
      coin.rotateY(still ? 0 : Math.sin(t * 0.8 + i * 1.7) * 0.22);
    });

    /* bead links: home centre (world) → coin (world), bowed outward, faded on the far side */
    const r = root.current;
    if (!r || !globe.current) return;
    r.updateWorldMatrix(true, true);
    const centre = globe.current.getWorldPosition(scratch.c);
    r.worldToLocal(centre);
    scratch.cam.copy(state.camera.position);
    r.worldToLocal(scratch.cam);
    const radius = R * globe.current.scale.x;
    COINS.forEach((_, i) => {
      const home = homes.current[i];
      const coin = coins.current[i];
      const beads = links.current[i];
      const runner = runners.current[i];
      if (!home || !coin || !beads || !runner) return;
      const a = r.worldToLocal(home.getWorldPosition(scratch.a));
      const b = r.worldToLocal(coin.getWorldPosition(scratch.b));
      const n = scratch.n.copy(a).sub(centre).normalize();
      const reach = a.distanceTo(b);
      const bez = scratch.bez;
      bez.v0.copy(a);
      bez.v1.copy(a).addScaledVector(n, 0.22 + 0.12 * reach);
      bez.v3.copy(b);
      bez.v2.copy(bez.v1).lerp(b, 0.55).sub(centre);
      bez.v2.setLength(Math.max(bez.v2.length(), radius * 1.4)).add(centre);
      // clearance + facing decide visibility
      let clear = Infinity;
      for (let k = 2; k <= 16; k++) clear = Math.min(clear, bez.getPoint(k / 16, scratch.p).distanceTo(centre));
      const facing = scratch.p.copy(scratch.cam).sub(a).normalize().dot(n);
      const target = intro * band(facing, 0.02, 0.3) * band(clear / radius, 1.04, 1.14);
      linkAlpha.current[i] = still ? target : linkAlpha.current[i] + (target - linkAlpha.current[i]) * (1 - Math.exp(-dt * 5));
      const alpha = linkAlpha.current[i];
      (beads.material as THREE.MeshBasicMaterial).opacity = 0.75 * alpha;
      (runner.material as THREE.MeshBasicMaterial).opacity = alpha;
      beads.visible = alpha > 0.01;
      runner.visible = alpha > 0.01 && !still;
      for (let k = 0; k < BEADS; k++) {
        const u = 0.03 + (k / (BEADS - 1)) * 0.86;
        bez.getPoint(u, scratch.p);
        scratch.m.compose(scratch.p, scratch.q.identity(), scratch.s.setScalar(1));
        beads.setMatrixAt(k, scratch.m);
      }
      beads.instanceMatrix.needsUpdate = true;
      const run = (t * 0.42 + i / COINS.length) % 1;
      runner.position.copy(bez.getPoint(0.03 + 0.86 * smooth(run), scratch.p));
      runner.scale.setScalar(1 - 0.5 * band(run, 0.8, 1));
    });
  });

  return (
    <group ref={root} position={[0, 0.05, 0]}>
      <group rotation={TILT}>
        <group ref={globe}>
          {/* dark glass body */}
          <mesh>
            <sphereGeometry args={[R, 96, 96]} />
            <meshPhysicalMaterial color="#151816" metalness={0.88} roughness={0.3} clearcoat={0.12} clearcoatRoughness={0.25} envMapIntensity={0.2} />
          </mesh>
          {/* a faint rim of atmosphere */}
          <mesh scale={1.035}>
            <sphereGeometry args={[R, 64, 64]} />
            <meshBasicMaterial color={CYAN} transparent opacity={0.035} side={THREE.BackSide} depthWrite={false} />
          </mesh>
          {/* soft graticule */}
          {[-60, -30, 0, 30, 60].map((lat) => (
            <mesh key={lat} position={[0, R * Math.sin(THREE.MathUtils.degToRad(lat)), 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[R * Math.cos(THREE.MathUtils.degToRad(lat)) + 0.002, 0.0022, 6, 180]} />
              <meshBasicMaterial color={GOLD} transparent opacity={lat === 0 ? 0.42 : 0.2} depthWrite={false} />
            </mesh>
          ))}
          {[0, 30, 60, 90, 120, 150].map((lon) => (
            <mesh key={lon} rotation={[0, THREE.MathUtils.degToRad(lon), 0]}>
              <torusGeometry args={[R + 0.002, 0.0022, 6, 180]} />
              <meshBasicMaterial color={GOLD} transparent opacity={0.2} depthWrite={false} />
            </mesh>
          ))}
          <LandDots />
          <group ref={arcMeshes}>
            {arcs.map((arc, i) => (
              <mesh key={i} geometry={arc.tube}>
                <meshBasicMaterial color={CYAN} transparent opacity={0.22} depthWrite={false} toneMapped={false} />
              </mesh>
            ))}
          </group>
          <group ref={dots}>
            {surface.map((s, i) => (
              <mesh
                key={i}
                position={s.position}
                ref={(m) => {
                  const coin = COINS.findIndex((c) => c.home === (i < CENTRES.length ? CENTRES[i] : EXTRAS[i - CENTRES.length]));
                  if (coin >= 0) homes.current[coin] = m;
                }}
              >
                <sphereGeometry args={[i < CENTRES.length ? 0.036 : 0.026, 20, 20]} />
                <meshStandardMaterial color={i < CENTRES.length ? "#e7fef2" : GOLD} emissive={i < CENTRES.length ? "#c2fcdf" : GOLD} emissiveIntensity={1} toneMapped={false} />
              </mesh>
            ))}
          </group>
          <group ref={sonars}>
            {CENTRES.map((c, i) => (
              <group key={c.name} position={surface[i].position} quaternion={surface[i].quaternion}>
                {[0, 1].map((k) => (
                  <mesh key={k} visible={false}>
                    <ringGeometry args={[0.82, 1, 48]} />
                    <meshBasicMaterial color={CYAN} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
          <group ref={comets}>
            {arcs.map((_, i) => (
              <group key={i} visible={false}>
                {Array.from({ length: 12 }, (_, k) => (
                  <mesh key={k} scale={1 - k * 0.065}>
                    <sphereGeometry args={[k === 0 ? 0.042 : 0.03, 16, 16]} />
                    <meshBasicMaterial color={k === 0 ? "#eafef4" : CYAN} transparent opacity={0} depthWrite={false} toneMapped={false} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        </group>
      </group>

      {/* stabilised orbit with the five currency coins */}
      <group ref={orbit} rotation={[ORBIT.inclination, 0, 0]}>
        <OrbitRing />
        {COINS.map((c, i) => (
          <group
            key={c.symbol}
            ref={(g) => {
              coins.current[i] = g;
            }}
            scale={0}
          >
            <SymbolCoin symbol={c.symbol} color={c.color} />
          </group>
        ))}
      </group>

      {/* bead links, in root space */}
      {COINS.map((c, i) => (
        <group key={c.symbol}>
          <instancedMesh
            ref={(m) => {
              links.current[i] = m;
            }}
            args={[undefined, undefined, BEADS]}
            frustumCulled={false}
            visible={false}
          >
            <sphereGeometry args={[0.011, 8, 8]} />
            <meshBasicMaterial color={new THREE.Color(c.color).multiplyScalar(1.15)} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </instancedMesh>
          <mesh
            ref={(m) => {
              runners.current[i] = m;
            }}
            visible={false}
          >
            <sphereGeometry args={[0.024, 12, 12]} />
            <meshBasicMaterial color={new THREE.Color(c.color).lerp(new THREE.Color("#ffffff"), 0.5).multiplyScalar(1.6)} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function OrbitRing() {
  const ring = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, ORBIT.x, ORBIT.z, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(200).map((p) => new THREE.Vector3(p.x, 0, p.y));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 400, 0.0055, 6, true);
  }, []);
  return (
    <mesh geometry={ring}>
      <Neon color={GOLD} intensity={0.75} />
    </mesh>
  );
}
