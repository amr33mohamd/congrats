'use client';

import * as React from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { AdaptiveDpr, Float, Preload } from '@react-three/drei';
import * as THREE from 'three';

/**
 * The landing-page hero, rendered in WebGL.
 *
 * A small deck of greeting cards floating in a lit volume, with confetti drifting
 * through it. Everything is drawn from primitives + a handful of remote photos —
 * no HDRI and no GLTF, so the scene has nothing to download beyond the textures
 * and still works behind a slow connection.
 *
 * Mounted through next/dynamic with `ssr: false` (Three touches browser APIs at
 * import time). See `MarketingHero`.
 */

/* ─────────────────────────────── palette ─────────────────────────────── */

const BRAND = '#F0436E';
const BRAND_DEEP = '#AE1F44';
const GOLD = '#D6A435';
const CONFETTI = ['#F0436E', '#FF8FA8', '#D6A435', '#E9C667', '#FFFFFF', '#7C3AED'];

/* ──────────────────────────────── cards ──────────────────────────────── */

/** Rounded-rectangle card geometry (a 9:16 plate with bevelled corners). */
function useCardGeometry(w = 1.5, h = 2.6, r = 0.18) {
  return React.useMemo(() => {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 16,
    });
    geo.center();
    // ExtrudeGeometry has no usable UVs for a photo — project them flat on XY.
    const pos = geo.attributes.position;
    const uv: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      uv.push((pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
    }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return geo;
  }, [w, h, r]);
}

function PhotoCard({
  url,
  position,
  rotation,
  scale = 1,
  tint,
}: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  tint?: string;
}) {
  const geo = useCardGeometry();
  const texture = useLoader(THREE.TextureLoader, url);

  React.useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.7}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh geometry={geo} castShadow receiveShadow>
          <meshPhysicalMaterial
            map={texture}
            color={tint ?? '#ffffff'}
            roughness={0.32}
            metalness={0.05}
            clearcoat={0.85}
            clearcoatRoughness={0.25}
            reflectivity={0.5}
          />
        </mesh>
        {/* warm rim so the card edge reads against the background */}
        <mesh geometry={geo} scale={1.035} position={[0, 0, -0.04]}>
          <meshBasicMaterial color={GOLD} transparent opacity={0.16} />
        </mesh>
      </group>
    </Float>
  );
}

/* ────────────────────────────── confetti ─────────────────────────────── */

const COUNT = 220;

function Confetti({ reduced }: { reduced: boolean }) {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);

  const seeds = React.useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: (Math.random() - 0.5) * 11,
        y: Math.random() * 9 - 4,
        z: (Math.random() - 0.5) * 6 - 1,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 1.6,
        fall: 0.35 + Math.random() * 0.7,
        sway: 0.3 + Math.random() * 0.8,
        size: 0.5 + Math.random() * 0.9,
      })),
    [],
  );

  // Per-instance colour, uploaded once.
  React.useEffect(() => {
    if (!ref.current) return;
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      c.set(CONFETTI[i % CONFETTI.length]);
      ref.current.setColorAt(i, c);
    }
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const step = reduced ? 0 : Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      s.y -= s.fall * step;
      if (s.y < -4.5) s.y = 4.8;
      dummy.position.set(s.x + Math.sin(t * s.sway + i) * 0.35, s.y, s.z);
      dummy.rotation.set(s.rx + t * s.spin, s.ry + t * s.spin * 0.6, 0);
      dummy.scale.setScalar(s.size);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[0.075, 0.115]} />
      <meshStandardMaterial
        side={THREE.DoubleSide}
        roughness={0.45}
        metalness={0.1}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ─────────────────────────── scene + parallax ────────────────────────── */

function Rig({
  children,
  reduced,
  shift,
}: {
  children: React.ReactNode;
  reduced: boolean;
  shift: number;
}) {
  const group = React.useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current || reduced) return;
    // Ease the whole deck toward the pointer — subtle, never more than ~7°.
    const px = state.pointer.x * 0.22;
    const py = state.pointer.y * 0.14;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, px, 3, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -py, 3, delta);
  });
  // `shift` slides the whole deck away from the copy column — negative in RTL,
  // positive in LTR — so the cards never sit under the headline.
  return (
    <group position={[shift, 0, 0]}>
      <group ref={group}>{children}</group>
    </group>
  );
}

function Scene({
  photos,
  reduced,
  shift,
}: {
  photos: string[];
  reduced: boolean;
  shift: number;
}) {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} castShadow />
      <pointLight position={[-5, 2, 3]} intensity={38} distance={16} color={BRAND} />
      <pointLight position={[5, -2, 2]} intensity={26} distance={14} color={GOLD} />
      <pointLight position={[0, 3, -4]} intensity={18} distance={14} color={BRAND_DEEP} />

      <Rig reduced={reduced} shift={shift}>
        <React.Suspense fallback={null}>
          {photos[1] ? (
            <PhotoCard
              url={photos[1]}
              position={[-1.85, 0.35, -1.5]}
              rotation={[0.06, 0.42, 0.14]}
              scale={0.82}
            />
          ) : null}
          {photos[2] ? (
            <PhotoCard
              url={photos[2]}
              position={[1.85, -0.2, -1.2]}
              rotation={[-0.04, -0.4, -0.12]}
              scale={0.78}
            />
          ) : null}
          {photos[0] ? (
            <PhotoCard url={photos[0]} position={[0, 0, 0]} rotation={[0, 0, -0.03]} scale={1.05} />
          ) : null}
        </React.Suspense>
      </Rig>

      <Confetti reduced={reduced} />
    </>
  );
}

/* ──────────────────────────────── canvas ─────────────────────────────── */

export default function HeroScene({ photos, shift = 0 }: { photos: string[]; shift?: number }) {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <Canvas
      // Cap the pixel ratio: retina phones otherwise render 3× for no visible gain.
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      // Pause the loop when the hero scrolls out of view.
      frameloop={reduced ? 'demand' : 'always'}
      style={{ touchAction: 'pan-y' }}
    >
      <Scene photos={photos} reduced={reduced} shift={shift} />
      <AdaptiveDpr pixelated />
      <Preload all />
    </Canvas>
  );
}
