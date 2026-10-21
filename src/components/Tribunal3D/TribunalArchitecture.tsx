/**
 * TribunalArchitecture — the dormant tribunal and its environment.
 *
 * Story hardware added for "The Trial Awakens":
 *  - Arrival streak: a motivated copper light descending along the colonnade
 *    during the opening (the cause the claim eventually answers to).
 *  - The Arbiter Wheel: the central mechanism of judgment — engages during
 *    evidence, recoils at the challenge, aligns during weighing, and sends a
 *    concentrated light line toward the gate during revelation.
 *  - Gate locks: copper bolts release in a fast readable sequence before the
 *    gates part; the seam flashes as they let go.
 *  - The world beyond: a genuine spatial reveal through the opened gate
 *    (distant arch, colonnade silhouettes, warm haze).
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { canonicalColors, createTribunalMaterials } from './SceneMaterials';
import { windowT, easedWindow, makeEtchedLine } from './etch';

interface TribunalArchitectureProps {
  progress: number; // 0 to 1
  isEntering?: boolean;
  gateOpen?: boolean;
  reducedMotion?: boolean;
}

// Matrix-composition scratch for instance setup (never touched per-frame)
const dummy = new THREE.Object3D();

// Generate deterministic atmospheric motes
function generateMotes(count: number): [Float32Array, Float32Array] {
  const pos = new Float32Array(count * 3);
  const scl = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const s1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    const r1 = s1 - Math.floor(s1);
    const s2 = Math.sin((i + 1) * 39.346 + 11.135) * 43758.5453;
    const r2 = s2 - Math.floor(s2);
    const s3 = Math.sin((i + 2) * 73.156 + 54.532) * 43758.5453;
    const r3 = s3 - Math.floor(s3);

    pos[i * 3] = (r1 - 0.5) * 14;
    pos[i * 3 + 1] = r2 * 12 - 2;
    pos[i * 3 + 2] = (r3 - 0.5) * 22 - 6;
    scl[i] = r1 * 0.05 + 0.02;
  }
  return [pos, scl];
}

export const TribunalArchitecture: React.FC<TribunalArchitectureProps> = ({
  progress,
  isEntering = false,
  gateOpen = false,
  reducedMotion = false,
}) => {
  const leftGateRef = useRef<THREE.Group>(null);
  const rightGateRef = useRef<THREE.Group>(null);
  const gateLightRef = useRef<THREE.PointLight>(null);
  const motesRef = useRef<THREE.Points>(null);
  const copperGlowRef = useRef<THREE.MeshStandardMaterial>(null);
  const shaftMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // ── New story hardware refs ──────────────────────────────────────────
  const wheelRef = useRef<THREE.Group>(null);
  const wheelMatARef = useRef<THREE.MeshStandardMaterial>(null);
  const wheelMatCRef = useRef<THREE.MeshStandardMaterial>(null);
  const boltRefs = useRef<Array<THREE.Mesh | null>>([null, null, null, null]);
  const streakRef = useRef<THREE.Mesh>(null);
  const streakLightRef = useRef<THREE.PointLight>(null);

  const [motePositions, moteScales] = useMemo(() => generateMotes(85), []);

  // ── Colonnade instancing (one draw call, not 30 meshes) ───────────────
  const mainColRef = useRef<THREE.InstancedMesh>(null);
  const colBandRef = useRef<THREE.InstancedMesh>(null);
  const farColRef = useRef<THREE.InstancedMesh>(null);

  // Main colonnade: 10 columns (mirrored), varying heights
  const mainColumns = useMemo(() => {
    const cols: Array<{ x: number; z: number; h: number }> = [];
    for (const side of [-1, 1]) {
      for (let idx = 0; idx < 5; idx++) {
        cols.push({
          x: side * (4.8 + idx * 0.8),
          z: 4 - idx * 4.5,
          h: 12 + idx * 1.2,
        });
      }
    }
    return cols;
  }, []);
  const farColumns = useMemo(() => [-6.2, -5.4, 5.4, 6.2], []);

  useEffect(() => {
    // Unit-height cylinder scaled per instance; the copper band sits at a
    // constant world height (group offsets were height-linear by design).
    if (mainColRef.current) {
      mainColumns.forEach((c, i) => {
        dummy.position.set(c.x, c.h / 2 - 2.1, c.z);
        dummy.scale.set(1, c.h, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mainColRef.current!.setMatrixAt(i, dummy.matrix);
      });
      mainColRef.current.instanceMatrix.needsUpdate = true;
    }
    if (colBandRef.current) {
      mainColumns.forEach((c, i) => {
        dummy.position.set(c.x, -0.9, c.z);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        colBandRef.current!.setMatrixAt(i, dummy.matrix);
      });
      colBandRef.current.instanceMatrix.needsUpdate = true;
    }
    if (farColRef.current) {
      farColumns.forEach((x, i) => {
        dummy.position.set(x, 3.4, -25);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        farColRef.current!.setMatrixAt(i, dummy.matrix);
      });
      farColRef.current.instanceMatrix.needsUpdate = true;
      farColRef.current.computeBoundingSphere();
    }
  }, [mainColumns, farColumns]);

  // Gate seam etched flash line: vertical, at the parting seam (world z -16.85)
  const seamLine = useMemo(
    () =>
      makeEtchedLine(
        [
          new THREE.Vector3(0, -2.6, -16.85),
          new THREE.Vector3(0, 0.6, -16.85),
          new THREE.Vector3(0, 3.6, -16.85),
          new THREE.Vector3(0, 6.4, -16.85),
          new THREE.Vector3(0, 10.2, -16.85),
        ],
        { color: canonicalColors.oxidizedCopper, restOpacity: 0, dashSize: 0.5, gapSize: 0.22 }
      ),
    []
  );

  // Light line: wheel → gate (drawn during revelation)
  const wheelToGateLine = useMemo(
    () =>
      makeEtchedLine(
        [
          new THREE.Vector3(0, 1.85, -4.6),
          new THREE.Vector3(0, 2.4, -7.5),
          new THREE.Vector3(0, 3.1, -11.5),
          new THREE.Vector3(0, 3.7, -15.5),
          new THREE.Vector3(0, 3.9, -17.2),
        ],
        { color: canonicalColors.ember, restOpacity: 0, dashSize: 0.3, gapSize: 0.14 }
      ),
    []
  );

  // Shared PBR Materials
  const materials = useMemo(() => {
    return createTribunalMaterials();
  }, []);

  useFrame((_, delta) => {
    const p = progress;
    // Mote drifting (frozen under reduced motion)
    if (motesRef.current && !reducedMotion) {
      const pos = motesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 85; i++) {
        pos[i * 3 + 1] += delta * 0.22;
        if (pos[i * 3 + 1] > 10) {
          pos[i * 3 + 1] = -2;
        }
      }
      motesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // ── Arrival streak: copper light descends the colonnade (0–0.7 s) ─
    if (streakRef.current) {
      const t = easedWindow(p, 0.008, 0.0933);
      const y = 9 - t * 10;
      streakRef.current.position.y = y;
      (streakRef.current.material as THREE.MeshBasicMaterial).opacity =
        Math.sin(Math.min(1, t) * Math.PI) * 0.85;
    }
    if (streakLightRef.current) {
      const t = easedWindow(p, 0.008, 0.0933);
      streakLightRef.current.position.y = 9 - t * 10;
      streakLightRef.current.intensity = Math.sin(Math.min(1, t) * Math.PI) * 3.5;
    }

    // ── The Arbiter Wheel: engage → recoil → align → send the light ───
    if (wheelRef.current) {
      const assembled = easedWindow(p, 0.24, 0.31); // engages with evidence
      const s = THREE.MathUtils.damp(
        wheelRef.current.scale.x,
        Math.max(0.001, assembled),
        3,
        delta
      );
      wheelRef.current.scale.set(s, s, s);

      const engaged = easedWindow(p, 0.24, 0.5); // spins up through the conflict
      const settled = easedWindow(p, 0.6, 0.74); // alignment during weighing
      // Deterministic engage/align: rotation winds up, then unwinds to zero
      const windUp = engaged * 2.4 * (1 - settled) + settled * 0;
      wheelRef.current.rotation.z = windUp;

      // Recoil wobble at the challenge impact
      const wobble = windowT(p, 0.565, 0.62);
      wheelRef.current.rotation.x =
        Math.sin(wobble * Math.PI * 2) * 0.05 * Math.sin(wobble * Math.PI);
    }
    if (wheelMatARef.current) {
      const target =
        (p > 0.24 ? 0.35 : 0) +
        (p >= 0.6 && p < 0.76 ? 0.55 : 0) + // processing heat while aligning
        (p >= 0.76 ? windowT(p, 0.76, 0.84) * 1.8 : 0); // revelation charge
      wheelMatARef.current.emissiveIntensity = THREE.MathUtils.damp(
        wheelMatARef.current.emissiveIntensity,
        target,
        3,
        delta
      );
    }
    if (wheelMatCRef.current) {
      const target = p >= 0.76 ? windowT(p, 0.76, 0.84) * 2.2 : 0;
      wheelMatCRef.current.emissiveIntensity = THREE.MathUtils.damp(
        wheelMatCRef.current.emissiveIntensity,
        target,
        3,
        delta
      );
    }

    // Light line wheel → gate (draws during revelation, folds after)
    const lineDraw = easedWindow(p, 0.74, 0.83);
    wheelToGateLine.setReveal(lineDraw);
    wheelToGateLine.setOpacity(lineDraw > 0 ? 0.85 * (1 - easedWindow(p, 0.86, 0.95)) : 0);

    // Gate seam flash as the locks release
    const seamT = easedWindow(p, 0.765, 0.83);
    seamLine.setReveal(seamT);
    seamLine.setOpacity(seamT > 0 && seamT < 1 ? 0.9 : seamT >= 1 ? 0.35 : 0);

    // ── Gate lock bolts: four sequential releases (0.762–0.83) ─────────
    boltRefs.current.forEach((bolt, i) => {
      if (!bolt) return;
      const release = easedWindow(p, 0.762 + i * 0.014, 0.788 + i * 0.014);
      const dir = i < 2 ? -1 : 1; // left-gate bolts sink deeper left, right-gate right
      bolt.position.x = bolt.userData.baseX + dir * release * 0.7;
      bolt.position.z = bolt.userData.baseZ + release * 0.34;
      (bolt.material as THREE.MeshStandardMaterial).emissiveIntensity =
        (1 - release) * 1.6 + release * 0.2;
    });

    // Portal Gates opening — locks release first, then the monoliths part
    let gateOpenFactor = 0;
    if (isEntering) {
      gateOpenFactor = 1.0;
    } else if (gateOpen) {
      gateOpenFactor = Math.min(1, Math.max(0, (p - 0.8) / 0.12));
    }

    const openDistance = gateOpenFactor * 3.8;

    if (leftGateRef.current) {
      leftGateRef.current.position.x = THREE.MathUtils.damp(
        leftGateRef.current.position.x,
        -1.9 - openDistance,
        2.5,
        delta
      );
    }

    if (rightGateRef.current) {
      rightGateRef.current.position.x = THREE.MathUtils.damp(
        rightGateRef.current.position.x,
        1.9 + openDistance,
        2.5,
        delta
      );
    }

    // Gate light radiance ramps as the gate parts
    if (gateLightRef.current) {
      const targetIntensity = 0.3 + gateOpenFactor * 8.0 + seamT * 1.2;
      gateLightRef.current.intensity = THREE.MathUtils.damp(
        gateLightRef.current.intensity,
        targetIntensity,
        3.0,
        delta
      );
    }

    // Progressive copper emissive glow on dais inlays (awakening ramps it in)
    if (copperGlowRef.current) {
      const glowTarget =
        p < 0.0933
          ? 0
          : p < 0.24
            ? (p - 0.0933) * 3.9
            : p < 0.76
              ? 0.55 // steady processing light — no idle pulsing (§6)
              : p < 0.92
                ? 0.4
                : 0.8 + gateOpenFactor * 0.5;
      copperGlowRef.current.emissiveIntensity = THREE.MathUtils.damp(
        copperGlowRef.current.emissiveIntensity,
        glowTarget,
        2,
        delta
      );
    }

    // Light shaft — dim during arrival, brightens with the awakening
    if (shaftMatRef.current) {
      const shaftTarget =
        p < 0.0933
          ? 0.02
          : p < 0.24
            ? 0.04 + (p - 0.0933) * 0.4
            : p < 0.76
              ? 0.1
              : 0.06 + gateOpenFactor * 0.06;
      shaftMatRef.current.opacity = THREE.MathUtils.damp(
        shaftMatRef.current.opacity,
        shaftTarget,
        2,
        delta
      );
    }
  });

  // Gate-local lock coordinates (each gate box is 3.6 × 14 × 1.2 → face at z 0.6)
  const boltDefs = {
    left: [
      { x: 1.35, y: 1.5, z: 0.78 },
      { x: 1.35, y: 4.5, z: 0.78 },
    ],
    right: [
      { x: -1.35, y: 1.5, z: 0.78 },
      { x: -1.35, y: 4.5, z: 0.78 },
    ],
  };

  return (
    <group>
      {/* Polished Obsidian Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, -4]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <primitive object={materials.obsidianPolished} attach="material" />
      </mesh>

      {/* Embedded Copper Perspective Lines on Floor */}
      {[-3, -1, 1, 3].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x * 1.5, -2.08, -6]}>
          <planeGeometry args={[0.04, 32]} />
          <primitive object={materials.oxidizedCopper} attach="material" />
        </mesh>
      ))}

      {/* Stepped Megalithic Dais */}
      <group position={[0, -1.9, -3.5]}>
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[7.2, 0.35, 7.2]} />
          <primitive object={materials.basaltRough} attach="material" />
        </mesh>
        <mesh position={[0, 0.3, 0]} receiveShadow>
          <boxGeometry args={[4.8, 0.3, 4.8]} />
          <primitive object={materials.obsidianPolished} attach="material" />
        </mesh>

        {/* Sacred Copper Inlay Ring — glows with the story */}
        <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 1.66, 48]} />
          <meshStandardMaterial
            ref={copperGlowRef}
            color={canonicalColors.oxidizedCopper}
            emissive={new THREE.Color(canonicalColors.oxidizedCopper)}
            emissiveIntensity={0}
            roughness={0.35}
            metalness={0.82}
          />
        </mesh>
        <mesh position={[0, 0.465, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 0.94, 32]} />
          <primitive object={materials.oxidizedCopper} attach="material" />
        </mesh>
      </group>

      {/* Left + Right Colonnade of Monolithic Basalt Columns (instanced) */}
      <instancedMesh
        ref={mainColRef}
        args={[undefined, undefined, mainColumns.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1.1, 1.3, 1, 6]} />
        <primitive object={materials.basaltRough} attach="material" />
      </instancedMesh>
      <instancedMesh
        ref={colBandRef}
        args={[undefined, undefined, mainColumns.length]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1.25, 1.27, 0.1, 6]} />
        <primitive object={materials.oxidizedCopper} attach="material" />
      </instancedMesh>

      {/* ── The Arbiter Wheel — central mechanism of judgment ── */}
      <group ref={wheelRef} position={[0, 2.7, -4.6]} scale={[0.001, 0.001, 0.001]}>
        <mesh>
          <torusGeometry args={[1.5, 0.05, 10, 64]} />
          <meshStandardMaterial
            ref={wheelMatARef}
            color={canonicalColors.obsidian}
            emissive={new THREE.Color(canonicalColors.oxidizedCopper)}
            emissiveIntensity={0}
            roughness={0.3}
            metalness={0.85}
            flatShading
          />
        </mesh>
        <mesh>
          <torusGeometry args={[1.14, 0.03, 8, 48]} />
          <primitive object={materials.oxidizedCopper} attach="material" />
        </mesh>
        <mesh>
          <torusGeometry args={[0.82, 0.04, 8, 48]} />
          <meshStandardMaterial
            ref={wheelMatCRef}
            color={canonicalColors.obsidian}
            emissive={new THREE.Color(canonicalColors.ember)}
            emissiveIntensity={0}
            roughness={0.3}
            metalness={0.85}
          />
        </mesh>
        {/* Spokes — the machine's read of the case */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 6) * Math.PI * 2) * 1.14,
              Math.sin((i / 6) * Math.PI * 2) * 1.14,
              0,
            ]}
            rotation={[0, 0, (i / 6) * Math.PI * 2 + Math.PI / 2]}
          >
            <boxGeometry args={[0.62, 0.07, 0.07]} />
            <meshStandardMaterial
              color={canonicalColors.warmBone}
              roughness={0.55}
              metalness={0.15}
            />
          </mesh>
        ))}
        {/* Hub */}
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.3, 6]} />
          <primitive object={materials.oxidizedCopper} attach="material" />
        </mesh>
      </group>

      {/* ── Arrival streak: copper light descending the colonnade ── */}
      <mesh ref={streakRef} position={[-4.85, 9, -6]} rotation={[0.28, 0, 0]}>
        <planeGeometry args={[0.14, 22]} />
        <meshBasicMaterial
          color={canonicalColors.oxidizedCopper}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={streakLightRef}
        position={[-4.85, 9, -4.6]}
        color={canonicalColors.oxidizedCopper}
        intensity={0}
        distance={14}
      />

      {/* Etched lines: gate seam flash + wheel→gate light */}
      <primitive object={seamLine.object} />
      <primitive object={wheelToGateLine.object} />

      {/* ── The Monumental Inner Gate ── */}
      <group position={[0, 3.8, -17.5]}>
        {/* Left Colossal Portal Monolith */}
        <group ref={leftGateRef} position={[-1.9, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.6, 14, 1.2]} />
            <primitive object={materials.basaltRough} attach="material" />
          </mesh>
          <mesh position={[1.75, 0, 0.62]}>
            <planeGeometry args={[0.06, 12]} />
            <primitive object={materials.oxidizedCopper} attach="material" />
          </mesh>
          {/* Lock bolts — left gate pair, near the seam (slide in on release) */}
          {[0, 1].map((slot, j) => (
            <mesh
              key={`bolt-${slot}`}
              ref={(m) => {
                boltRefs.current[slot] = m;
              }}
              position={[boltDefs.left[j].x, boltDefs.left[j].y, boltDefs.left[j].z]}
              userData={{ baseX: boltDefs.left[j].x, baseZ: boltDefs.left[j].z }}
            >
              <cylinderGeometry args={[0.09, 0.11, 0.9, 6]} />
              <meshStandardMaterial
                color={canonicalColors.oxidizedCopper}
                emissive={new THREE.Color(canonicalColors.oxidizedCopper)}
                emissiveIntensity={1.6}
                roughness={0.35}
                metalness={0.8}
              />
            </mesh>
          ))}
        </group>

        {/* Right Colossal Portal Monolith */}
        <group ref={rightGateRef} position={[1.9, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.6, 14, 1.2]} />
            <primitive object={materials.basaltRough} attach="material" />
          </mesh>
          <mesh position={[-1.75, 0, 0.62]}>
            <planeGeometry args={[0.06, 12]} />
            <primitive object={materials.oxidizedCopper} attach="material" />
          </mesh>
          {/* Lock bolts — right gate pair, near the seam */}
          {[2, 3].map((slot, j) => (
            <mesh
              key={`bolt-${slot}`}
              ref={(m) => {
                boltRefs.current[slot] = m;
              }}
              position={[boltDefs.right[j].x, boltDefs.right[j].y, boltDefs.right[j].z]}
              userData={{ baseX: boltDefs.right[j].x, baseZ: boltDefs.right[j].z }}
            >
              <cylinderGeometry args={[0.09, 0.11, 0.9, 6]} />
              <meshStandardMaterial
                color={canonicalColors.oxidizedCopper}
                emissive={new THREE.Color(canonicalColors.oxidizedCopper)}
                emissiveIntensity={1.6}
                roughness={0.35}
                metalness={0.8}
              />
            </mesh>
          ))}
        </group>

        {/* Gate Arch Lintel */}
        <mesh position={[0, 7.6, 0]}>
          <boxGeometry args={[11, 1.8, 1.8]} />
          <primitive object={materials.weatheredStone} attach="material" />
        </mesh>

        {/* Luminous Inner Court Light behind the Gate */}
        <pointLight
          ref={gateLightRef}
          position={[0, 1.0, -2.5]}
          color={canonicalColors.ember}
          intensity={0.8}
          distance={25}
          decay={1.8}
        />
      </group>

      {/* ── The World Beyond the Gate — the spatial reveal ── */}
      <group>
        {/* Distant luminous haze — visible only through the opened gate */}
        <mesh position={[0, 4.5, -26]} rotation={[0, 0, 0]}>
          <circleGeometry args={[9.5, 32]} />
          <meshBasicMaterial
            color={canonicalColors.ember}
            transparent
            opacity={0.055}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Distant arch silhouette */}
        <mesh position={[0, 0.4, -26]} rotation={[0, 0, 0]}>
          <torusGeometry args={[5.4, 0.16, 8, 32, Math.PI]} />
          <meshStandardMaterial
            color={canonicalColors.obsidian}
            emissive={new THREE.Color(canonicalColors.oxidizedCopper)}
            emissiveIntensity={0.22}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
        {/* Far colonnade silhouettes (instanced) */}
        <instancedMesh
          ref={farColRef}
          args={[undefined, undefined, farColumns.length]}
          castShadow={false}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.8, 0.95, 11, 6]} />
          <meshStandardMaterial
            color={canonicalColors.obsidian}
            roughness={0.9}
            metalness={0.1}
            flatShading
          />
        </instancedMesh>
        {/* Distant floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, -24]}>
          <planeGeometry args={[30, 18]} />
          <meshStandardMaterial
            color="#241D18"
            emissive={new THREE.Color(canonicalColors.ember)}
            emissiveIntensity={0.05}
            roughness={0.75}
          />
        </mesh>
      </group>

      {/* Volumetric Light Shaft — responsive to story */}
      <mesh position={[0, 4.5, -3.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.6, 3.8, 14, 24, 1, true]} />
        <meshBasicMaterial
          ref={shaftMatRef}
          color={canonicalColors.warmBone}
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric Dust & Ash Particles */}
      <points ref={motesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[motePositions, 3]} />
          <bufferAttribute attach="attributes-scale" args={[moteScales, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color={canonicalColors.warmBone}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
