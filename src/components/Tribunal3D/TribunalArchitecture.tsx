import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { canonicalColors } from './SceneMaterials';

interface TribunalArchitectureProps {
  progress: number; // 0 to 1
  isEntering?: boolean;
  gateOpen?: boolean;
}

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
}) => {
  const leftGateRef = useRef<THREE.Group>(null);
  const rightGateRef = useRef<THREE.Group>(null);
  const gateLightRef = useRef<THREE.PointLight>(null);
  const motesRef = useRef<THREE.Points>(null);

  const [motePositions, moteScales] = useMemo(() => generateMotes(85), []);
  const copperGlowRef = useRef<THREE.MeshStandardMaterial>(null);
  const shaftMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Shared PBR Materials
  const materials = useMemo(() => {
    // Polished obsidian floor with restrained reflectivity
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(canonicalColors.obsidian),
      roughness: 0.2,
      metalness: 0.8,
    });

    // Basalt Colonnades
    const basaltColMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#100F0E'),
      roughness: 0.86,
      metalness: 0.15,
      flatShading: true,
    });

    // Weathered Stone Dais steps
    const daisMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(canonicalColors.weatheredStone),
      roughness: 0.72,
      metalness: 0.22,
    });

    // Copper Inlay Channels
    const copperInlayMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(canonicalColors.oxidizedCopper),
      roughness: 0.35,
      metalness: 0.82,
    });

    // Colossal Gates (Monumental Weathered Blackstone)
    const gateMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0D0D0C'),
      roughness: 0.68,
      metalness: 0.3,
      flatShading: true,
    });

    // Volumetric Light Cone — responds to story
    const lightShaftMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(canonicalColors.warmBone),
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    return {
      floorMat,
      basaltColMat,
      daisMat,
      copperInlayMat,
      gateMat,
      lightShaftMat,
    };
  }, []);

  useFrame((state, delta) => {
    // Mote drifting
    if (motesRef.current) {
      const pos = motesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 85; i++) {
        pos[i * 3 + 1] += delta * 0.22;
        if (pos[i * 3 + 1] > 10) {
          pos[i * 3 + 1] = -2;
        }
      }
      motesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Portal Gates opening — driven by cinematic state.
    // gateOpen is set at REVELATION entry (≈5.8 s → p 0.773); the gates part
    // over the revelation act and are fully open inside the finale (by p 0.92 ≈ 6.9 s).
    let gateOpenFactor = 0;
    if (isEntering) {
      gateOpenFactor = 1.0;
    } else if (gateOpen) {
      gateOpenFactor = Math.min(1, (progress - 0.8) / 0.12);
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

    // Gate light radiance — ramps up dramatically as gate opens
    if (gateLightRef.current) {
      const targetIntensity = 0.3 + gateOpenFactor * 8.0;
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
        progress < 0.1
          ? 0
          : progress < 0.24
            ? (progress - 0.1) * 4.3
            : progress < 0.77
              ? 0.6 + Math.sin(state.clock.getElapsedTime() * 2) * 0.15
              : progress < 0.92
                ? 0.4
                : 0.8 + gateOpenFactor * 0.5;
      copperGlowRef.current.emissiveIntensity = THREE.MathUtils.damp(
        copperGlowRef.current.emissiveIntensity,
        glowTarget,
        2,
        delta
      );
    }

    // Light shaft opacity — dim during descent, brightens through awakening
    if (shaftMatRef.current) {
      const shaftTarget =
        progress < 0.1
          ? 0.02
          : progress < 0.24
            ? 0.04 + (progress - 0.1) * 0.43
            : progress < 0.75
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

  return (
    <group>
      {/* Polished Obsidian Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, -4]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <primitive object={materials.floorMat} attach="material" />
      </mesh>

      {/* Embedded Copper Perspective Lines on Floor */}
      {[-3, -1, 1, 3].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x * 1.5, -2.08, -6]}>
          <planeGeometry args={[0.04, 32]} />
          <primitive object={materials.copperInlayMat} attach="material" />
        </mesh>
      ))}

      {/* Stepped Megalithic Dais */}
      <group position={[0, -1.9, -3.5]}>
        {/* Tier 1 - Wide Basalt Platform */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[7.2, 0.35, 7.2]} />
          <primitive object={materials.daisMat} attach="material" />
        </mesh>

        {/* Tier 2 - Upper Obsidian Plinth */}
        <mesh position={[0, 0.3, 0]} receiveShadow>
          <boxGeometry args={[4.8, 0.3, 4.8]} />
          <primitive object={materials.floorMat} attach="material" />
        </mesh>

        {/* Sacred Copper Inlay Ring — glows progressively */}
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
          <primitive object={materials.copperInlayMat} attach="material" />
        </mesh>
      </group>

      {/* Left Colonnade of Monolithic Basalt Columns */}
      {[-4.8, -5.6, -6.4, -7.2, -8.0].map((x, idx) => {
        const z = 4 - idx * 4.5;
        const h = 12 + idx * 1.2;
        return (
          <group key={`left-col-${idx}`} position={[x, h / 2 - 2.1, z]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[1.1, 1.3, h, 6]} />
              <primitive object={materials.basaltColMat} attach="material" />
            </mesh>
            {/* Weathered copper band near column base */}
            <mesh position={[0, -h / 2 + 1.2, 0]}>
              <cylinderGeometry args={[1.25, 1.27, 0.1, 6]} />
              <primitive object={materials.copperInlayMat} attach="material" />
            </mesh>
          </group>
        );
      })}

      {/* Right Colonnade of Monolithic Basalt Columns */}
      {[4.8, 5.6, 6.4, 7.2, 8.0].map((x, idx) => {
        const z = 4 - idx * 4.5;
        const h = 12 + idx * 1.2;
        return (
          <group key={`right-col-${idx}`} position={[x, h / 2 - 2.1, z]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[1.1, 1.3, h, 6]} />
              <primitive object={materials.basaltColMat} attach="material" />
            </mesh>
            <mesh position={[0, -h / 2 + 1.2, 0]}>
              <cylinderGeometry args={[1.25, 1.27, 0.1, 6]} />
              <primitive object={materials.copperInlayMat} attach="material" />
            </mesh>
          </group>
        );
      })}

      {/* The Monumental Inner Gate (slides open in Chapter IV) */}
      <group position={[0, 3.8, -17.5]}>
        {/* Left Colossal Portal Monolith */}
        <group ref={leftGateRef} position={[-1.9, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.6, 14, 1.2]} />
            <primitive object={materials.gateMat} attach="material" />
          </mesh>
          {/* Vertical copper glyph seam */}
          <mesh position={[1.75, 0, 0.62]}>
            <planeGeometry args={[0.06, 12]} />
            <primitive object={materials.copperInlayMat} attach="material" />
          </mesh>
        </group>

        {/* Right Colossal Portal Monolith */}
        <group ref={rightGateRef} position={[1.9, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.6, 14, 1.2]} />
            <primitive object={materials.gateMat} attach="material" />
          </mesh>
          {/* Vertical copper glyph seam */}
          <mesh position={[-1.75, 0, 0.62]}>
            <planeGeometry args={[0.06, 12]} />
            <primitive object={materials.copperInlayMat} attach="material" />
          </mesh>
        </group>

        {/* Gate Arch Lintel */}
        <mesh position={[0, 7.6, 0]}>
          <boxGeometry args={[11, 1.8, 1.8]} />
          <primitive object={materials.daisMat} attach="material" />
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
