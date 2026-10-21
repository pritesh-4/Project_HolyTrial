/**
 * OppositionMonolith — "The Challenge"
 *
 * An adversarial wedge leans in, thrusts against the claim's frame at the
 * impact moment (3.9–4.5 s), recoils, then retreats — with the branch-aware
 * resolution chosen during the cross-examination window.
 *
 * The claim records the strike (procedural fracture, same timeline window
 * in ClaimRelic). Here we render the physical contact: one expanding impact
 * ring and a brief ember flash — no particle bursts, no combat noise.
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { canonicalColors } from './SceneMaterials';
import { type CrossExamChoice } from '../CinematicEngine';
import { windowT, easedWindow } from './etch';

interface OppositionMonolithProps {
  progress: number;
  crossExamChoice: CrossExamChoice;
  reducedMotion?: boolean;
}

// Master-timeline windows (progress fractions; wall-clock s = progress × 7.5 at act boundaries)
const CHALLENGE_WIN = {
  approach: [0.4133, 0.53] as const, // 3.1–4.0 s
  thrust: [0.53, 0.572] as const, // fast advance
  contact: [0.565, 0.615] as const, // impact ring / flash
  recoil: [0.572, 0.64] as const, // pushes back
  tension: [0.64, 0.7] as const, // holds, alive
  retreat: [0.7, 0.82] as const, // 5.25–6.15 s
};

// Per-frame scratch (hoisted — never allocated inside useFrame)
const scratchTarget = new THREE.Vector3();

export const OppositionMonolith: React.FC<OppositionMonolithProps> = ({
  progress,
  crossExamChoice,
  reducedMotion = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bladeRef = useRef<THREE.Mesh>(null);
  const impactRingRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const contactLightRef = useRef<THREE.PointLight>(null);
  const fractureLightRef = useRef<THREE.PointLight>(null);

  // Static positions (built once)
  const pos = useMemo(
    () => ({
      dormant: new THREE.Vector3(7.5, 6.0, 1.0),
      approach: new THREE.Vector3(1.7, 0.9, -3.1),
      clash: new THREE.Vector3(1.02, 0.42, -3.24),
      recoil: new THREE.Vector3(1.35, 0.65, -3.05),
      branchRetreat: {
        default: new THREE.Vector3(4.8, 3.5, -6.0),
        expose: new THREE.Vector3(3.5, 2.0, -5.0), // pulled back further
        align: new THREE.Vector3(5.5, 4.0, -4.0), // retreats higher
      },
    }),
    []
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const p = progress;

    // Branch-aware resolved position
    const retreatTarget =
      crossExamChoice === 'expose_contradiction'
        ? pos.branchRetreat.expose
        : crossExamChoice === 'align_support'
          ? pos.branchRetreat.align
          : pos.branchRetreat.default;

    let currentTarget = pos.dormant;
    let contact = 0;

    if (p < 0.4133) {
      currentTarget = pos.dormant;
    } else if (p < 0.53) {
      // Lean in — deliberate advance
      const t = easedWindow(p, CHALLENGE_WIN.approach[0], CHALLENGE_WIN.approach[1]);
      currentTarget = scratchTarget.lerpVectors(pos.dormant, pos.approach, t);
    } else if (p < 0.572) {
      // Thrust — short, committed
      const t = easedWindow(p, CHALLENGE_WIN.thrust[0], CHALLENGE_WIN.thrust[1]);
      currentTarget = scratchTarget.lerpVectors(pos.approach, pos.clash, t);
    } else if (p < 0.64) {
      // Contact & recoil — the claim takes the strike, the wedge pushes off
      const t = easedWindow(p, CHALLENGE_WIN.recoil[0], CHALLENGE_WIN.recoil[1]);
      currentTarget = scratchTarget.lerpVectors(pos.clash, pos.recoil, t);
      contact = windowT(p, CHALLENGE_WIN.contact[0], CHALLENGE_WIN.contact[1]);
    } else if (p < 0.7) {
      // Controlled tension — still a presence, not an exit.
      // Tension oscillation is suppressed under reduced motion.
      currentTarget = scratchTarget.copy(pos.recoil);
      if (!reducedMotion) {
        currentTarget.x += Math.sin(time * 1.8) * 0.04;
        currentTarget.y += Math.cos(time * 1.4) * 0.025;
      }
    } else {
      // Retreat to branch-aware resolution
      const t = easedWindow(p, CHALLENGE_WIN.retreat[0], CHALLENGE_WIN.retreat[1]);
      currentTarget = scratchTarget.lerpVectors(pos.recoil, retreatTarget, t);
    }

    groupRef.current.position.lerp(currentTarget, delta * 3.8);

    // Orientation: aggressive lean only while engaged
    const engaged = p >= 0.4133 && p < 0.7;
    const targetRotZ = engaged ? -0.26 : -0.14;
    groupRef.current.rotation.z = THREE.MathUtils.damp(
      groupRef.current.rotation.z,
      targetRotZ,
      3.0,
      delta
    );

    // Impact ring — expands from the contact point once, then dies
    if (impactRingRef.current) {
      const s = 0.15 + contact * 1.5;
      impactRingRef.current.scale.set(s, s, s);
      (impactRingRef.current.material as THREE.MeshBasicMaterial).opacity =
        Math.sin(Math.min(1, contact) * Math.PI) * 0.55;
    }

    // Contact flash — one ember beat
    if (flashRef.current) {
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity =
        Math.sin(Math.min(1, contact) * Math.PI) * 0.4;
    }

    // Contact light
    if (contactLightRef.current) {
      contactLightRef.current.intensity = contact * 5.0;
    }

    // Fracture light — branch consequence (expose_contradiction reveals it)
    if (fractureLightRef.current) {
      const shown = crossExamChoice === 'expose_contradiction' ? 1 : 0;
      const target = shown * (2.4 + Math.sin(time * 3) * 0.4);
      fractureLightRef.current.intensity = THREE.MathUtils.damp(
        fractureLightRef.current.intensity,
        target,
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

      {/* Fracture Line — only when the contradiction is chosen to be exposed */}
      {crossExamChoice === 'expose_contradiction' && (
        <mesh position={[0, -0.5, 0.48]} rotation={[0, 0, Math.PI / 6]}>
          <planeGeometry args={[0.035, 2.5]} />
          <meshStandardMaterial
            color={canonicalColors.oxidizedCopper}
            emissive={new THREE.Color(canonicalColors.ember)}
            emissiveIntensity={2.0}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Contact ring at the strike point */}
      <mesh ref={impactRingRef} position={[-0.42, -1.5, -0.35]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <ringGeometry args={[0.34, 0.42, 32]} />
        <meshBasicMaterial
          color={canonicalColors.oxidizedCopper}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Contact flash */}
      <mesh ref={flashRef} position={[-0.45, -1.55, -0.3]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial
          color={canonicalColors.ember}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

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
