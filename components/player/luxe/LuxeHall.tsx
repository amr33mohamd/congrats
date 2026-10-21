'use client';

import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, MeshReflectorMaterial, RoundedBox, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * The world of the Noir & Gold invitation, in WebGL.
 *
 *   ring box ──open──▶ rings rise ──camera flies through them──▶ the hall
 *
 * The hall is a black-marble gallery with one gold arch per section of the
 * card. Scrolling moves the camera down it: each section's text (real DOM,
 * owned by LuxePlayer) is projected into its arch every frame, grows as the
 * camera approaches, and dissolves as the camera passes through.
 *
 * Real materials, served from public/art/luxe (see README there): the gold
 * reflects a photographed ballroom (Poly Haven HDRI), the floor is real
 * marble, the box real velvet, and the walls hang 17th–18th-century Dutch
 * flower paintings (public domain). The monogram is drawn into a canvas
 * texture with the card's own web font.
 */
const ART = '/art/luxe';
const PAINTINGS = [1, 2, 3, 4, 5, 6].map((i) => `${ART}/painting-${i}.jpg`);
const PAINTING_ASPECT = [849, 840, 944, 815, 868, 741].map((h) => 640 / h);

export const STATION_GAP = 12;
const HALF_FOV = Math.tan(THREE.MathUtils.degToRad(25)); // fov 50
const FLOOR_Y = -2;
const GOLD = '#E3BC6E';

export type IntroPhase = 'closed' | 'opening' | 'hall';

export interface HallControl {
  /** Section the scroll asks for, as a float (2.5 = halfway from 2 to 3). */
  target: number;
  phase: IntroPhase;
  /** performance.now() / 1000 when the guest tapped open (0: never — skipped). */
  openedAt: number;
}

/** Seconds since the box was opened (wall clock, shared with the DOM side). */
export function sinceOpen(c: HallControl): number {
  return performance.now() / 1000 - c.openedAt;
}

/** Camera-to-arch distance while a section is being read: farther on a narrow phone so the arch fits. */
export function readingDistance(aspect: number): number {
  return THREE.MathUtils.clamp(2.05 / (0.92 * HALF_FOV * aspect), 5.4, 10.5);
}

const stationZ = (i: number) => -i * STATION_GAP;
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const easeInOut = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const span = (t: number, a: number, b: number) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);

/* ──────────────────────────── materials ──────────────────────────── */

function useGold() {
  return React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.2, envMapIntensity: 1.25 }),
    [],
  );
}

/** Additive glow points: candle flames, chandelier lights, dust. */
const pointVert = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uFlicker;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vAlpha = 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * (5.0 + fract(aPhase * 3.7) * 4.0) + aPhase) * sin(uTime * 1.9 + aPhase * 2.0));
    gl_PointSize = aSize * uPixelRatio * (40.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const pointFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uCore;
  varying float vAlpha;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    float a = (exp(-d * d * 16.0) + smoothstep(0.1, 0.0, d) * uCore) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

function Glows({
  positions,
  sizes,
  color,
  opacity,
  flicker,
  core,
  drift,
}: {
  positions: Float32Array;
  sizes: Float32Array;
  color: string;
  opacity: number;
  flicker: number;
  core: number;
  /** Fall speed: gold dust drifts down around the camera. */
  drift?: number;
}) {
  const dpr = useThree((s) => s.viewport.dpr);
  const ref = React.useRef<THREE.Points>(null);
  const phases = React.useMemo(() => Float32Array.from({ length: sizes.length }, () => Math.random() * 100), [sizes]);
  const mat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pointVert,
        fragmentShader: pointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: dpr },
          uFlicker: { value: flicker },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uCore: { value: core },
        },
      }),
    [dpr, color, opacity, flicker, core],
  );
  useFrame((state, delta) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    if (!drift) return;
    const attr = ref.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!attr) return;
    const cam = state.camera.position;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < sizes.length; i++) {
      const k = i * 3;
      positions[k + 1] -= drift * dt * (0.6 + (phases[i] % 1));
      positions[k] += Math.sin(state.clock.elapsedTime * 0.5 + phases[i]) * dt * 0.05;
      // Keep the dust in a box around the camera, wherever it has travelled.
      if (positions[k + 1] < FLOOR_Y) positions[k + 1] = 3.5;
      if (positions[k + 2] > cam.z + 2) positions[k + 2] -= 16;
      else if (positions[k + 2] < cam.z - 14) positions[k + 2] += 16;
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={ref} material={mat} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
    </points>
  );
}

/* ─────────────────────────────── rings ───────────────────────────── */

/** Two interlocked gold bands, a brilliant set on one. */
function Rings({ gold }: { gold: THREE.Material }) {
  const diamond = React.useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0,
        transmission: 1,
        thickness: 0.4,
        ior: 2.4,
        iridescence: 0.6,
        iridescenceIOR: 1.6,
        envMapIntensity: 3,
        clearcoat: 1,
      }),
    [],
  );
  return (
    <group>
      <mesh material={gold}>
        <torusGeometry args={[0.32, 0.038, 32, 120]} />
      </mesh>
      <group position={[0.22, -0.04, 0]} rotation={[0.25, 1.15, 0.1]}>
        <mesh material={gold}>
          <torusGeometry args={[0.3, 0.034, 32, 120]} />
        </mesh>
        {/* setting + stone */}
        <mesh material={gold} position={[0, 0.33, 0]}>
          <cylinderGeometry args={[0.045, 0.03, 0.05, 12]} />
        </mesh>
        <group position={[0, 0.39, 0]}>
          <mesh material={diamond} position={[0, 0.018, 0]}>
            <cylinderGeometry args={[0.045, 0.075, 0.035, 8]} />
          </mesh>
          <mesh material={diamond} position={[0, -0.03, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.075, 0.07, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ───────────────────────────── ring box ──────────────────────────── */

/** The couple's initials engraved in gold, drawn with the card's own font. */
function useMonogram(text: string, font: string, gold: string) {
  const [texture] = React.useState(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
  React.useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      const canvas = texture.image as HTMLCanvasElement;
      const g = canvas.getContext('2d');
      if (!g) return;
      g.clearRect(0, 0, 1024, 1024);
      g.strokeStyle = gold;
      g.fillStyle = gold;
      g.lineWidth = 10;
      g.beginPath();
      g.arc(512, 512, 430, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 3;
      g.beginPath();
      g.arc(512, 512, 395, 0, Math.PI * 2);
      g.stroke();
      // Little diamonds at the four points of the ring.
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i;
        g.save();
        g.translate(512 + Math.cos(a) * 412, 512 + Math.sin(a) * 412);
        g.rotate(Math.PI / 4);
        g.fillRect(-14, -14, 28, 28);
        g.restore();
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      let size = 300;
      g.font = `${size}px ${font}`;
      while (g.measureText(text).width > 640 && size > 90) {
        size -= 10;
        g.font = `${size}px ${font}`;
      }
      g.fillText(text, 512, 530);
      texture.needsUpdate = true;
    };
    draw();
    // Redraw once the web font is in (the first pass may use a fallback).
    document.fonts?.load(`300px ${font}`, text).then(draw, () => undefined);
    document.fonts?.ready.then(draw, () => undefined);
    return () => {
      cancelled = true;
    };
  }, [texture, text, font, gold]);
  return texture;
}

function RingBox({
  z,
  control,
  monogram,
  monogramFont,
  gold,
}: {
  z: number;
  control: React.MutableRefObject<HallControl>;
  monogram: string;
  monogramFont: string;
  gold: THREE.Material;
}) {
  const lid = React.useRef<THREE.Group>(null);
  const rings = React.useRef<THREE.Group>(null);
  const glow = React.useRef<THREE.PointLight>(null);
  const tex = useMonogram(monogram, monogramFont, GOLD);
  const [velvetMap, velvetNormal] = useTexture([`${ART}/velvet.jpg`, `${ART}/velvet-normal.jpg`]);
  const velvet = React.useMemo(
    () => {
      for (const t of [velvetMap, velvetNormal]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(2, 2);
      }
      return new THREE.MeshPhysicalMaterial({
        color: '#2a2230',
        map: velvetMap,
        normalMap: velvetNormal,
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughness: 0.9,
        sheen: 1,
        sheenRoughness: 0.45,
        sheenColor: new THREE.Color('#4a3f52'),
      });
    },
    [velvetMap, velvetNormal],
  );
  const satin = React.useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#1c060c', roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color('#5a1e2c') }),
    [],
  );

  useFrame((state) => {
    const c = control.current;
    const now = state.clock.elapsedTime;
    const T = c.phase === 'closed' ? 0 : !c.openedAt ? 10 : sinceOpen(c);
    if (lid.current) lid.current.rotation.x = -1.95 * easeInOut(span(T, 0.1, 1.4));
    if (rings.current) {
      const r = easeInOut(span(T, 0.8, 2.4));
      rings.current.position.y = THREE.MathUtils.lerp(-1.62, 0.22, r);
      rings.current.scale.setScalar(THREE.MathUtils.lerp(1, 1.85, r));
      // Spin while rising, settle facing the camera so it can fly through.
      const spin = (1 - ease(span(T, 1.6, 2.6))) * T * 2.4;
      rings.current.rotation.set(0, spin, 0);
    }
    if (glow.current) glow.current.intensity = 14 * ease(span(T, 0.3, 1.2)) * (0.9 + 0.1 * Math.sin(now * 9));
  });

  return (
    <group position={[0, 0, z]}>
      {/* pedestal */}
      <mesh position={[0, FLOOR_Y + 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[1.25, 1.35, 0.3, 64]} />
        <meshStandardMaterial color="#0d0c0f" metalness={0.4} roughness={0.25} />
      </mesh>
      <mesh position={[0, FLOOR_Y + 0.31, 0]} material={gold}>
        <torusGeometry args={[1.25, 0.018, 8, 96]} />
      </mesh>

      {/* base */}
      <RoundedBox args={[1.5, 0.7, 1.5]} radius={0.07} smoothness={4} position={[0, -1.35, 0]} material={velvet} />
      <mesh position={[0, -1.02, 0]} material={satin}>
        <boxGeometry args={[1.34, 0.05, 1.34]} />
      </mesh>
      {/* gold rim where the lid meets the base (a frame: the satin shows inside) */}
      {[
        [0, 0.755, 1.53, 0.03],
        [0, -0.755, 1.53, 0.03],
        [0.755, 0, 0.03, 1.53],
        [-0.755, 0, 0.03, 1.53],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, -1.0, z]} material={gold}>
          <boxGeometry args={[w, 0.025, d]} />
        </mesh>
      ))}

      {/* lid, hinged at the back edge */}
      <group ref={lid} position={[0, -1.0, -0.75]}>
        <RoundedBox args={[1.5, 0.4, 1.5]} radius={0.07} smoothness={4} position={[0, 0.2, 0.75]} material={velvet} />
        {/* satin lining, seen once open */}
        <mesh position={[0, 0.005, 0.75]} rotation={[Math.PI / 2, 0, 0]} material={satin}>
          <planeGeometry args={[1.34, 1.34]} />
        </mesh>
        <mesh position={[0, 0.405, 0.75]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.05, 1.05]} />
          <meshStandardMaterial
            map={tex}
            emissiveMap={tex}
            emissive={GOLD}
            emissiveIntensity={0.55}
            transparent
            metalness={0.9}
            roughness={0.25}
            color={GOLD}
            envMapIntensity={1.4}
          />
        </mesh>
      </group>

      <group ref={rings} position={[0, -1.62, 0]}>
        <Rings gold={gold} />
      </group>
      <pointLight ref={glow} position={[0, -0.6, 0.2]} color="#FFD79A" intensity={0} distance={5} decay={2} />
      <Sparkles count={40} scale={[2.6, 2.2, 2.6]} position={[0, -0.3, 0]} size={3} speed={0.35} color={GOLD} opacity={0.8} />
    </group>
  );
}

/* ─────────────────────────────── the hall ────────────────────────── */

/** One gold arch: plinths, columns, capitals, a double arc and a keystone. */
function useArchGeometry() {
  return React.useMemo(() => {
    const R = 1.95;
    const top = 1.0;
    const parts: THREE.BufferGeometry[] = [];
    const add = (g: THREE.BufferGeometry, x: number, y: number, z = 0) => {
      g.translate(x, y, z);
      parts.push(g.index ? g.toNonIndexed() : g);
    };
    for (const sx of [-1, 1]) {
      add(new THREE.BoxGeometry(0.46, 0.26, 0.46), sx * R, FLOOR_Y + 0.13);
      add(new THREE.CylinderGeometry(0.11, 0.12, top - FLOOR_Y - 0.26, 20), sx * R, (top + FLOOR_Y + 0.26) / 2);
      add(new THREE.BoxGeometry(0.36, 0.12, 0.36), sx * R, top);
    }
    add(new THREE.TorusGeometry(R, 0.1, 14, 72, Math.PI), 0, top);
    add(new THREE.TorusGeometry(R - 0.2, 0.025, 8, 72, Math.PI), 0, top);
    add(new THREE.OctahedronGeometry(0.16), 0, top + R + 0.05);
    return mergeGeometries(parts);
  }, []);
}

function Hall({ count, gold }: { count: number; gold: THREE.Material }) {
  const arch = useArchGeometry();
  const [marble, marbleRough] = useTexture([`${ART}/marble-noir.jpg`, `${ART}/marble-rough.jpg`]);
  const arches = React.useRef<THREE.InstancedMesh>(null);
  const pillars = React.useRef<THREE.InstancedMesh>(null);
  const length = count * STATION_GAP + 40;
  React.useMemo(() => {
    marble.colorSpace = THREE.SRGBColorSpace;
    for (const t of [marble, marbleRough]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      // One texture tile is a 4 m square of slabs.
      t.repeat.set(30 / 4, length / 4);
      t.anisotropy = 8;
    }
  }, [marble, marbleRough, length]);

  React.useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      m.makeTranslation(0, 0, stationZ(i));
      arches.current?.setMatrixAt(i, m);
      m.makeTranslation(-4.4, 1.5, stationZ(i) - STATION_GAP / 2);
      pillars.current?.setMatrixAt(i * 2, m);
      m.makeTranslation(4.4, 1.5, stationZ(i) - STATION_GAP / 2);
      pillars.current?.setMatrixAt(i * 2 + 1, m);
    }
    if (arches.current) arches.current.instanceMatrix.needsUpdate = true;
    if (pillars.current) pillars.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  // Candles along both sides of the aisle, chandelier lights between arches.
  const candles = React.useMemo(() => {
    const pos: number[] = [];
    const size: number[] = [];
    const sticks: Array<[number, number, number]> = [];
    for (let z = 14; z > stationZ(count - 1) - 10; z -= 2.4) {
      for (const sx of [-1, 1]) {
        const h = 0.35 + Math.random() * 0.45;
        const x = sx * (2.9 + Math.random() * 0.25);
        sticks.push([x, h, z]);
        pos.push(x, FLOOR_Y + h + 0.06, z);
        size.push(2.4 + Math.random());
      }
    }
    return { pos: new Float32Array(pos), size: new Float32Array(size), sticks };
  }, [count]);
  const candleMesh = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const d = new THREE.Object3D();
    candles.sticks.forEach(([x, h, z], i) => {
      d.position.set(x, FLOOR_Y + h / 2, z);
      d.scale.set(1, h, 1);
      d.updateMatrix();
      candleMesh.current?.setMatrixAt(i, d.matrix);
    });
    if (candleMesh.current) candleMesh.current.instanceMatrix.needsUpdate = true;
  }, [candles]);

  const lights = React.useMemo(() => {
    const pos: number[] = [];
    const size: number[] = [];
    for (let i = 0; i < count; i++) {
      const z = stationZ(i) - STATION_GAP / 2;
      // A small chandelier: a bright heart and a ring of crystals.
      pos.push(0, 3.3, z);
      size.push(16);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        pos.push(Math.cos(a) * 0.55, 3.05 + Math.sin(k * 1.7) * 0.08, z + Math.sin(a) * 0.55);
        size.push(2.6);
      }
    }
    return { pos: new Float32Array(pos), size: new Float32Array(size) };
  }, [count]);

  const dust = React.useMemo(() => {
    const n = 260;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 1] = FLOOR_Y + Math.random() * 5.5;
      pos[i * 3 + 2] = 16 - Math.random() * 16;
      size[i] = 0.25 + Math.pow(Math.random(), 3) * 0.7;
    }
    return { pos, size };
  }, []);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -length / 2 + 26]}>
        <planeGeometry args={[30, length]} />
        <MeshReflectorMaterial
          blur={[280, 90]}
          resolution={512}
          mixBlur={1}
          mixStrength={28}
          roughness={0.55}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          map={marble}
          roughnessMap={marbleRough}
          color="#6a5c4e"
          metalness={0.35}
          mirror={0}
        />
      </mesh>
      {/* gold inlay running down the aisle */}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, FLOOR_Y + 0.003, -length / 2 + 26]} material={gold}>
          <planeGeometry args={[0.03, length]} />
        </mesh>
      ))}

      <instancedMesh ref={arches} args={[arch, gold, count]} frustumCulled={false} />
      <instancedMesh ref={pillars} args={[undefined, undefined, count * 2]} frustumCulled={false}>
        <cylinderGeometry args={[0.38, 0.42, 7, 32]} />
        <meshStandardMaterial color="#121115" metalness={0.5} roughness={0.18} />
      </instancedMesh>
      <instancedMesh ref={candleMesh} args={[undefined, undefined, candles.sticks.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.055, 0.06, 1, 12]} />
        <meshStandardMaterial color="#F3E7CF" emissive="#FFCF8A" emissiveIntensity={0.35} roughness={0.6} />
      </instancedMesh>

      <Glows positions={candles.pos} sizes={candles.size} color="#FFC27A" opacity={0.9} flicker={0.25} core={1} />
      <Glows positions={lights.pos} sizes={lights.size} color="#FFE6B8" opacity={0.75} flicker={0.06} core={1} />
      <Glows positions={dust.pos} sizes={dust.size} color="#F0CF86" opacity={0.85} flicker={0.6} core={1} drift={0.12} />
    </>
  );
}

/** Flower paintings in gold frames, hung between the arches on both walls. */
function Paintings({ count, gold }: { count: number; gold: THREE.Material }) {
  const textures = useTexture(PAINTINGS);
  React.useMemo(() => {
    for (const t of textures) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    }
  }, [textures]);
  const H = 2.1;
  const hung: Array<{ x: number; z: number; side: 1 | -1; k: number }> = [];
  for (let i = 0; i < count; i++) {
    const z = stationZ(i) - STATION_GAP / 2;
    hung.push({ x: -3.7, z, side: 1, k: (i * 2) % PAINTINGS.length });
    hung.push({ x: 3.7, z, side: -1, k: (i * 2 + 1) % PAINTINGS.length });
  }
  return (
    <>
      {hung.map(({ x, z, side, k }, n) => {
        const w = H * PAINTING_ASPECT[k];
        const t = 0.09;
        return (
          // Turned partly toward the aisle so they read from the walk, not only side-on.
          <group key={n} position={[x, 0.75, z]} rotation={[0, side * 1.05, 0]}>
            <mesh>
              <planeGeometry args={[w, H]} />
              <meshStandardMaterial map={textures[k]} emissiveMap={textures[k]} emissive="#ffffff" emissiveIntensity={0.42} roughness={0.7} />
            </mesh>
            {/* frame: four mitred-looking bars and a dark backing */}
            <mesh position={[0, 0, -0.03]}>
              <boxGeometry args={[w + 0.36, H + 0.36, 0.04]} />
              <meshStandardMaterial color="#0d0b0c" />
            </mesh>
            {[
              [0, H / 2 + t, w + t * 4, t * 2],
              [0, -H / 2 - t, w + t * 4, t * 2],
              [-w / 2 - t, 0, t * 2, H],
              [w / 2 + t, 0, t * 2, H],
            ].map(([fx, fy, fw, fh], j) => (
              <mesh key={j} position={[fx, fy, 0.02]} material={gold}>
                <boxGeometry args={[fw, fh, 0.08]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
}

/** The last arch opens on the rings again, large and turning slowly. */
function FinaleRings({ z, gold }: { z: number; gold: THREE.Material }) {
  const ref = React.useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.elapsedTime * 0.25;
    ref.current.position.y = Math.sin(s.clock.elapsedTime * 0.8) * 0.08;
  });
  // Above the sign-off, so the names never sit on bright gold.
  return (
    <group position={[0, 2.5, z]}>
      <group ref={ref} scale={2.2}>
        <Rings gold={gold} />
      </group>
      <Sparkles count={90} scale={[6, 4, 3]} size={4} speed={0.3} color={GOLD} />
    </group>
  );
}

/* ───────────────────────────── camera + panels ───────────────────── */

export interface PanelSlot {
  el: HTMLDivElement | null;
  /** Shrink to fit a tall section (measured by the DOM side). */
  fit: number;
}

function Director({
  count,
  control,
  panels,
  boxZ,
  reduced,
  onIntroDone,
}: {
  count: number;
  control: React.MutableRefObject<HallControl>;
  panels: React.MutableRefObject<PanelSlot[]>;
  boxZ: number;
  reduced: boolean;
  onIntroDone: () => void;
}) {
  const s = React.useRef(control.current.target);
  const v = React.useMemo(() => new THREE.Vector3(), []);
  const look = React.useMemo(() => new THREE.Vector3(), []);
  const done = React.useRef(false);

  useFrame((state, delta) => {
    const c = control.current;
    const cam = state.camera;
    const { width, height } = state.size;
    const d0 = readingDistance(width / Math.max(1, height));
    const now = state.clock.elapsedTime;
    const px = reduced ? 0 : state.pointer.x;
    const py = reduced ? 0 : state.pointer.y;

    // Where the hall walk would put the camera.
    // Snap on the first frames: the builder remounts the preview on every
    // edit and it should open on the section being edited, not fly there.
    const snap = reduced || state.clock.elapsedTime < 0.8;
    s.current += (c.target - s.current) * (snap ? 1 : Math.min(1, delta * 3.2));
    const hallZ = stationZ(0) - s.current * STATION_GAP + d0;
    const hallPos = new THREE.Vector3(px * 0.35, 0.28 + py * 0.15, hallZ);

    // Intro: orbit the closed box, then fly up through the rings into the hall.
    // Back far enough that the whole box fits a narrow phone, looking down on it.
    const introD = THREE.MathUtils.clamp(1.6 / (HALF_FOV * (width / Math.max(1, height))), 3.4, 6.2);
    const introPos = new THREE.Vector3(Math.sin(now * 0.3) * 0.6, 0.35 + (introD - 3.4) * 0.25, boxZ + introD);
    let pos = hallPos;
    let lookY = 0.25;
    let lookZ = hallZ - 10;
    if (c.phase !== 'hall') {
      const T = c.phase === 'opening' ? sinceOpen(c) : 0;
      const f = easeInOut(span(T, 2.3, 4.9));
      if (c.phase === 'opening' && T > 4.9 && !done.current) {
        done.current = true;
        onIntroDone();
      }
      // Quadratic Bézier through the rings' centre.
      const mid = new THREE.Vector3(0, 0.22 * 1.0, boxZ);
      pos = new THREE.Vector3()
        .copy(introPos)
        .multiplyScalar((1 - f) * (1 - f))
        .add(mid.clone().multiplyScalar(2 * f * (1 - f)))
        .add(hallPos.clone().multiplyScalar(f * f));
      lookY = THREE.MathUtils.lerp(-0.9 + 0.9 * ease(span(T, 0.6, 2.3)), 0.25, f);
      lookZ = THREE.MathUtils.lerp(boxZ, hallZ - 10, f);
    }
    cam.position.copy(pos);
    look.set(pos.x * 0.4, lookY, lookZ);
    cam.lookAt(look);

    // Project each section into its arch.
    const showPanels = c.phase === 'hall' || (c.phase === 'opening' && sinceOpen(c) > 3.6);
    for (let i = 0; i < count; i++) {
      const slot = panels.current[i];
      const el = slot?.el;
      if (!el) continue;
      const az = stationZ(i) + 0.3;
      const dist = cam.position.z - az;
      let o = 0;
      let scale = 1;
      if (showPanels && dist > 0.4) {
        scale = d0 / dist;
        const fadeIn = ease(span(dist, d0 + STATION_GAP * 0.85, d0 + STATION_GAP * 0.3));
        const fadeOut = ease(span(dist, d0 * 0.4, d0 * 0.82));
        o = fadeIn * fadeOut;
      }
      if (o < 0.01) {
        if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
        continue;
      }
      v.set(0, 0.35, az).project(cam);
      const x = (v.x * 0.5 + 0.5) * width;
      const y = (-v.y * 0.5 + 0.5) * height;
      el.style.visibility = 'visible';
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${(scale * slot.fit).toFixed(4)})`;
      el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
      // A soft focus pull: sections far behind are slightly blurred.
      el.style.filter = dist > d0 * 1.4 ? `blur(${Math.min(4, (dist / d0 - 1.4) * 3).toFixed(1)}px)` : '';
    }
  });
  return null;
}

/** Mounts only once everything in its Suspense boundary has loaded. */
function Ready({ onReady }: { onReady: () => void }) {
  React.useEffect(() => onReady(), [onReady]);
  return null;
}

/* ──────────────────────────────── canvas ─────────────────────────── */

class Boundary extends React.Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export interface LuxeHallProps {
  count: number;
  control: React.MutableRefObject<HallControl>;
  panels: React.MutableRefObject<PanelSlot[]>;
  monogram: string;
  monogramFont: string;
  reduced: boolean;
  onIntroDone: () => void;
  onError: () => void;
  /** The box, hall and their textures are in: the guest may open. */
  onReady: () => void;
}

export default function LuxeHall({ count, control, panels, monogram, monogramFont, reduced, onIntroDone, onError, onReady }: LuxeHallProps) {
  const boxZ = 14.5;
  return (
    <Boundary onError={onError}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.35, boxZ + 3.4], fov: 50, near: 0.05, far: 120 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <color attach="background" args={['#060507']} />
        <fog attach="fog" args={['#060507', 9, 44]} />
        <Scene
          count={count}
          control={control}
          panels={panels}
          monogram={monogram}
          monogramFont={monogramFont}
          reduced={reduced}
          boxZ={boxZ}
          onIntroDone={onIntroDone}
          onReady={onReady}
        />
      </Canvas>
    </Boundary>
  );
}

function Scene({
  count,
  control,
  panels,
  monogram,
  monogramFont,
  reduced,
  boxZ,
  onIntroDone,
  onReady,
}: Omit<LuxeHallProps, 'onError'> & { boxZ: number }) {
  const gold = useGold();
  return (
    <>
      <ambientLight intensity={0.25} />
      <spotLight position={[0, 6, boxZ + 1]} angle={0.45} penumbra={0.8} intensity={60} distance={14} color="#FFE7C2" />
      <pointLight position={[0, 3, stationZ(0)]} intensity={8} distance={14} color="#FFD9A0" />
      {/* A photographed ballroom: what the gold, the rings and the diamond reflect. */}
      <React.Suspense fallback={null}>
        <Environment files={`${ART}/ballroom.hdr`} environmentIntensity={0.85} />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <RingBox z={boxZ} control={control} monogram={monogram} monogramFont={monogramFont} gold={gold} />
        <Hall count={count} gold={gold} />
        <Paintings count={count} gold={gold} />
        <Ready onReady={onReady} />
      </React.Suspense>
      <FinaleRings z={stationZ(count - 1) - 4} gold={gold} />
      <Director count={count} control={control} panels={panels} boxZ={boxZ} reduced={reduced} onIntroDone={onIntroDone} />
    </>
  );
}
