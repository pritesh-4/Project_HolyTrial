import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { canonicalColors } from './SceneMaterials';
import { type CrossExamChoice } from '../CinematicEngine';

interface OppositionMonolithProps {
  progress: number;
  crossExamChoice: CrossExamChoice;
}

// Deterministic spark generator
function generateSparkPositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const s1 = Math.sin(i * 19.34 + 43.12) * 43758.5453;
    const r1 = s1 - Math.floor(s1);
    const s2 = Math.sin((i + 1) * 29.87 + 17.54) * 43758.5453;
    const r2 = s2 - Math.floor(s2);
    const s3 = Math.sin((i + 2) * 37.65 + 81.23) * 43758.5453;
    const r3 = s3 - Math.floor(s3);

    positions[i * 3] = (r1 - 0.5) * 0.8;
    positions[i * 3 + 1] = (r2 - 0.5) * 0.8;
    positions[i * 3 + 2] = (r3 - 0.5) * 0.8;
  }
  return positions;
}

export const OppositionMonolith: React.FC<OppositionMonolithProps> = ({
  progress,
  crossExamChoice,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bladeRef = useRef<THREE.Mesh>(null);
  const sparkMatRef = useRef<THREE.PointsMaterial>(null);
  const contactLightRef = useRef<THREE.PointLight>(null);
  const fractureLightRef = useRef<THREE.PointLight>(null);

  const sparkData = useMemo(() => generateSparkPositions(35), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();
    const dormantPos = new THREE.Vector3(7.5, 6.0, 1.0);
    const clashPos = new THREE.Vector3(1.15, 0.45, -3.3);
    const resolvedPos = new THREE.Vector3(4.8, 3.5, -6.0);

    // Branch-aware resolved position
    const branchResolvedPos =
      crossExamChoice === 'expose_contradiction'
        ? new THREE.Vector3(3.5, 2.0, -5.0) // Pulls back further — contradiction exposed
        : crossExamChoice === 'align_support'
          ? new THREE.Vector3(5.5, 4.0, -4.0) // Retreats higher — support aligned first
          : resolvedPos;

    let currentTarget = dormantPos;
    let sparkOpacity = 0.0;

    // Master-timeline windows: approach 0.427–0.50 (≈3.2–3.8 s), clash sparks
    // 0.50–0.613 (≈3.75–4.6 s), controlled tension 0.613–0.70, then the
    // branch-aware retreat during weighing (0.70–0.82, ≈5.25–6.15 s).
    const approachT = Math.max(0, Math.min(1, (progress - 0.427) / 0.073));
    const isApproaching = approachT > 0 && progress < 0.613;
    const isPastOpposition = progress >= 0.613;

    if (progress < 0.427) {
      currentTarget = dormantPos;
    } else if (progress < 0.5) {
      // Approaching
      const eased = approachT * approachT * (3 - 2 * approachT);
      currentTarget = new THREE.Vector3().lerpVectors(dormantPos, clashPos, eased);
    } else if (progress < 0.613) {
      // At clash — sparks across the impact window
      currentTarget = clashPos.clone();
      const clashT = (progress - 0.5) / 0.113;
      sparkOpacity = Math.sin(clashT * Math.PI) * 0.95;
    } else if (progress < 0.7) {
      // Post-clash tension — holds position but with controlled displacement
      currentTarget = clashPos.clone();
      currentTarget.x += Math.sin(time * 2) * 0.04;
      currentTarget.y += Math.cos(time * 1.5) * 0.03;
    } else if (isPastOpposition) {
      // Retreat to branch-aware position
      const resolveT = Math.min(1, (progress - 0.7) / 0.12);
      const eased = resolveT * resolveT * (3 - 2 * resolveT);
      currentTarget = new THREE.Vector3().lerpVectors(clashPos, branchResolvedPos, eased);
    }

    // `isApproaching` keeps blade orientation logic meaningful
    const isOppositionPhase = isApproaching || (progress >= 0.5 && progress < 0.7);

    groupRef.current.position.lerp(currentTarget, delta * 3.8);

    // Orientation
    const targetRotZ = isOppositionPhase ? -0.28 : -0.15;
    groupRef.current.rotation.z = THREE.MathUtils.damp(
      groupRef.current.rotation.z,
      targetRotZ,
      3.0,
      delta
    );

    // Subtle blade rotation during clash
    if (bladeRef.current && progress >= 0.5 && progress < 0.7) {
      bladeRef.current.rotation.y = Math.sin(time * 1.5) * 0.08;
    }

    // Sparks
    if (sparkMatRef.current) {
      sparkMatRef.current.opacity = THREE.MathUtils.damp(
        sparkMatRef.current.opacity,
        sparkOpacity,
        5.0,
        delta
      );
    }

    if (contactLightRef.current) {
      contactLightRef.current.intensity = sparkOpacity * 4.0;
    }

    // Fracture light — visible when contradiction is exposed
    if (fractureLightRef.current) {
      const fractureTarget =
        crossExamChoice === 'expose_contradiction' ? 2.5 + Math.sin(time * 3) * 0.5 : 0;
      fractureLightRef.current.intensity = THREE.MathUtils.damp(
        fractureLightRef.current.intensity,
        fractureTarget,
        3,
        delta
      );
    }
  });

  return (
    <group ref={groupRef} position={[7.5, 6.0, 1.0]}>
      {/* Primary Adversarial Wedge */}
      <mesh ref={bladeRef} castShadow receiveShadow>
        <coneGeometry args={[0.9, 3.8, 4]} />
        <meshStandardMaterial
          color={canonicalColors.warmBone}
          roughness={0.55}
          metalness={0.12}
          flatShading
        />
      </mesh>

      {/* Weathered Stone Backing */}
      <mesh position={[0.2, 0.4, 0]} scale={[1.05, 0.85, 1.05]}>
        <coneGeometry args={[0.92, 3.2, 4]} />
        <meshStandardMaterial
          color={canonicalColors.weatheredStone}
          roughness={0.85}
          metalness={0.25}
          flatShading
        />
      </mesh>

      {/* Fracture Line — visible after decision */}
      {crossExamChoice !== null && (
        <mesh position={[0, -0.5, 0.48]} rotation={[0, 0, Math.PI / 6]}>
          <planeGeometry args={[0.03, 2.5]} />
          <meshStandardMaterial
            color={canonicalColors.oxidizedCopper}
            emissive={new THREE.Color(canonicalColors.ember)}
            emissiveIntensity={crossExamChoice === 'expose_contradiction' ? 2.0 : 0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Stress Fracture Sparks */}
      <points position={[-0.45, -1.8, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkData, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={sparkMatRef}
          size={0.1}
          color={canonicalColors.ember}
          transparent
          opacity={0.0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Contact Point Glow */}
      <pointLight
        ref={contactLightRef}
        position={[-0.45, -1.8, 0]}
        color={canonicalColors.ember}
        intensity={0}
        distance={4.0}
      />

      {/* Fracture Light — branch consequence */}
      <pointLight
        ref={fractureLightRef}
        position={[0, -0.5, 0.5]}
        color={canonicalColors.oxidizedCopper}
        intensity={0}
        distance={5.0}
      />
    </group>
  );
};
