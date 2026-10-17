import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ChamberProps {
  isEntering?: boolean;
}

// Deterministic particle generation function without Math.random during render
function generateMotes(count: number): [Float32Array, Float32Array] {
  const pos = new Float32Array(count * 3);
  const scl = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // Pure deterministic pseudo-random distribution based on golden ratio & sine seeds
    const s1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    const r1 = s1 - Math.floor(s1);
    const s2 = Math.sin((i + 1) * 39.346 + 11.135) * 43758.5453;
    const r2 = s2 - Math.floor(s2);
    const s3 = Math.sin((i + 2) * 73.156 + 54.532) * 43758.5453;
    const r3 = s3 - Math.floor(s3);

    pos[i * 3] = (r1 - 0.5) * 8;
    pos[i * 3 + 1] = r2 * 8 - 1;
    pos[i * 3 + 2] = (r3 - 0.5) * 14 - 3;
    scl[i] = r1 * 0.04 + 0.02;
  }
  return [pos, scl];
}

// Subtle floating dust motes within the light cone
function AtmosphericMotes({ count = 80 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, scales] = useMemo(() => {
    return generateMotes(count);
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      // Gently drift upward
      pos[i * 3 + 1] += delta * 0.25;
      if (pos[i * 3 + 1] > 8) {
        pos[i * 3 + 1] = -1;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-scale" args={[scales, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#DFCA9B"
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Single monolithic basalt pillar
function BasaltPillar({
  position,
  scale = [1, 10, 1],
}: {
  position: [number, number, number];
  scale?: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Hexagonal basalt column */}
      <mesh scale={scale} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.1, 1, 6]} />
        <meshStandardMaterial color="#13141A" roughness={0.82} metalness={0.2} flatShading />
      </mesh>
      {/* Subtle gold inlay ring */}
      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[0.92, 0.94, 0.08, 6]} />
        <meshStandardMaterial color="#B9975B" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// The central elevated judicial dais & dais seal
function JudicialDais() {
  return (
    <group position={[0, -1.8, -4]}>
      {/* Lower dais step */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[6.5, 0.35, 6.5]} />
        <meshStandardMaterial color="#161820" roughness={0.7} metalness={0.25} />
      </mesh>

      {/* Upper plinth */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.3, 4.2]} />
        <meshStandardMaterial color="#1A1C24" roughness={0.65} metalness={0.35} />
      </mesh>

      {/* Gold edge bevel trim */}
      <mesh position={[0, 0.46, 0]}>
        <ringGeometry args={[1.5, 1.54, 32]} />
        <meshBasicMaterial color="#B9975B" side={THREE.DoubleSide} />
      </mesh>

      {/* Sacred central seal ring inscribed into the stone */}
      <mesh position={[0, 0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.85, 24]} />
        <meshBasicMaterial color="#B9975B" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Monolithic Judgment Stele in the far background
function JudgmentStele() {
  return (
    <group position={[0, 2.5, -16]}>
      <mesh receiveShadow>
        <boxGeometry args={[4.5, 12, 0.8]} />
        <meshStandardMaterial color="#0C0D11" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Engraved central line */}
      <mesh position={[0, 0, 0.42]}>
        <planeGeometry args={[0.04, 10]} />
        <meshBasicMaterial color="#B9975B" opacity={0.6} transparent />
      </mesh>
    </group>
  );
}

// Camera and scene coordinator
function ChamberRig({ isEntering }: { isEntering: boolean }) {
  const targetZ = isEntering ? 0.8 : 6.0;
  const targetY = isEntering ? -0.2 : 1.2;

  useFrame((state, delta) => {
    // Smooth camera transition toward or away from the dais
    const currentZ = state.camera.position.z;
    const currentY = state.camera.position.y;
    const currentX = state.camera.position.x;

    const mouseX = state.pointer.x * 0.4;
    const mouseY = state.pointer.y * 0.15;

    state.camera.position.x = THREE.MathUtils.damp(currentX, mouseX, 2.0, delta);
    state.camera.position.y = THREE.MathUtils.damp(currentY, targetY + mouseY, 2.8, delta);
    state.camera.position.z = THREE.MathUtils.damp(currentZ, targetZ, 2.8, delta);

    // Keep camera focused on the central dais
    state.camera.lookAt(0, -0.4, -4);
  });

  return null;
}

export const ChamberScene: React.FC<ChamberProps> = ({ isEntering = false }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 1.2, 6.0], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0C0D11']} />
        <fogExp2 attach="fog" args={['#0C0D11', 0.055]} />

        {/* Ambient atmospheric fill */}
        <ambientLight intensity={0.45} color="#161822" />

        {/* Main Golden Overhead Spotlight piercing the darkness */}
        <spotLight
          position={[0, 11, -3]}
          target-position={[0, -1.8, -4]}
          angle={0.52}
          penumbra={0.7}
          intensity={4.2}
          color="#FFF2D6"
          castShadow
        />

        {/* Secondary cool rim light to pick out basalt column edges */}
        <pointLight position={[-6, 4, 1]} intensity={1.2} color="#5FBAA7" distance={16} />
        <pointLight position={[6, 4, 1]} intensity={1.2} color="#B9975B" distance={16} />

        {/* Floor: Obsidian polished stone with reflection */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, -3]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#0E0F14" roughness={0.22} metalness={0.55} />
        </mesh>

        {/* Judicial Dais in the center */}
        <JudicialDais />

        {/* Distant Judgment Stele */}
        <JudgmentStele />

        {/* Left Colonnade */}
        <BasaltPillar position={[-4.5, 2.8, 3]} scale={[1.2, 11, 1.2]} />
        <BasaltPillar position={[-5.2, 3.2, -1]} scale={[1.3, 12, 1.3]} />
        <BasaltPillar position={[-5.8, 3.6, -5]} scale={[1.4, 13, 1.4]} />
        <BasaltPillar position={[-6.4, 4.0, -9]} scale={[1.5, 14, 1.5]} />

        {/* Right Colonnade */}
        <BasaltPillar position={[4.5, 2.8, 3]} scale={[1.2, 11, 1.2]} />
        <BasaltPillar position={[5.2, 3.2, -1]} scale={[1.3, 12, 1.3]} />
        <BasaltPillar position={[5.8, 3.6, -5]} scale={[1.4, 13, 1.4]} />
        <BasaltPillar position={[6.4, 4.0, -9]} scale={[1.5, 14, 1.5]} />

        {/* Atmospheric Floating Dust Particles */}
        <AtmosphericMotes count={75} />

        {/* Camera Coordinator */}
        <ChamberRig isEntering={isEntering} />
      </Canvas>
    </div>
  );
};
