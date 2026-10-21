import React, { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { canonicalColors } from './SceneMaterials';
import {
  NarrativeAct,
  type EvidenceId,
  type EvidenceState,
  type CrossExamChoice,
} from '../CinematicEngine';

interface EvidenceClusterProps {
  progress: number;
  act: NarrativeAct;
  evidenceState: Record<EvidenceId, EvidenceState>;
  activeInspect: EvidenceId | null;
  crossExamChoice: CrossExamChoice;
  decisionWindowActive: boolean;
  onEvidenceClick: (id: EvidenceId) => void;
  onEvidenceInspectEnd: () => void;
  onDecision: (choice: 'align_support' | 'expose_contradiction') => void;
}

// ── Docked positions (relative to claim at [0, 0.3, -3.5]) ─────────────
const DOCK = {
  supporting: new THREE.Vector3(-1.4, 0.3, 0.3),
  contradictory: new THREE.Vector3(1.4, 0.3, 0.3),
  incomplete: new THREE.Vector3(0, 1.5, -0.4),
};

// ── Dispersed starting positions ────────────────────────────────────────
const DISPERSED = {
  supporting: new THREE.Vector3(-6, 4, 5),
  contradictory: new THREE.Vector3(6.5, 3, 4),
  incomplete: new THREE.Vector3(0, 7, -7),
};

// ── Inspection focus offsets (camera-facing positions) ───────────────────
const INSPECT_OFFSET = {
  supporting: new THREE.Vector3(-1.2, 0.5, 1.2),
  contradictory: new THREE.Vector3(1.2, 0.5, 1.2),
  incomplete: new THREE.Vector3(0, 1.8, 0.5),
};

export const EvidenceCluster: React.FC<EvidenceClusterProps> = ({
  progress,
  act,
  evidenceState,
  activeInspect,
  crossExamChoice,
  decisionWindowActive,
  onEvidenceClick,
  onEvidenceInspectEnd,
  onDecision,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const frag1Ref = useRef<THREE.Mesh>(null);
  const frag2Ref = useRef<THREE.Mesh>(null);
  const frag3Ref = useRef<THREE.Mesh>(null);
  const frag1MatRef = useRef<THREE.MeshStandardMaterial>(null);
  const frag2MatRef = useRef<THREE.MeshStandardMaterial>(null);
  const frag3MatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Inspect rotation accumulator
  const inspectRotRef = useRef<Record<EvidenceId, number>>({
    supporting: 0,
    contradictory: 0,
    incomplete: 0,
  });

  // Fragments react from the evidence act onward — including after the cinematic
  const isInteractable = (
    [
      NarrativeAct.EVIDENCE,
      NarrativeAct.OPPOSITION,
      NarrativeAct.WEIGHING,
      NarrativeAct.REVELATION,
      NarrativeAct.FINALE,
      NarrativeAct.COMPLETED,
    ] as readonly NarrativeAct[]
  ).includes(act);

  // Cross-exam choice is available while the unchosen window is open
  const isDecisionAvailable =
    decisionWindowActive &&
    (
      [
        NarrativeAct.OPPOSITION,
        NarrativeAct.WEIGHING,
        NarrativeAct.REVELATION,
      ] as readonly NarrativeAct[]
    ).includes(act);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // ── Assembly interpolation (evidence act: 1.8–3.2 s → p 0.24–0.427) ─
    let assembleT = 0;
    if (progress > 0.26) {
      assembleT = Math.min(1, (progress - 0.26) / 0.17);
      assembleT = assembleT * assembleT * (3 - 2 * assembleT);
    }

    const idleY = Math.sin(time * 1.8) * 0.04;
    const idleRot = Math.cos(time * 1.2) * 0.03;

    // ── Fragment 1 — SUPPORTING CRYSTAL ─────────────────────────────
    if (frag1Ref.current) {
      let target: THREE.Vector3;

      if (activeInspect === 'supporting') {
        target = INSPECT_OFFSET.supporting.clone();
        inspectRotRef.current.supporting += delta * 1.8;
        frag1Ref.current.rotation.y = inspectRotRef.current.supporting;
      } else if (crossExamChoice === 'align_support') {
        // Chosen: move to center alignment position
        target = new THREE.Vector3(0, 0.5, 0.5);
      } else {
        target = new THREE.Vector3().lerpVectors(DISPERSED.supporting, DOCK.supporting, assembleT);
        frag1Ref.current.rotation.y = assembleT * Math.PI * 0.25 + idleRot;
      }

      target.y += idleY;
      frag1Ref.current.position.lerp(target, delta * 3.5);
      frag1Ref.current.rotation.z = Math.sin(time * 0.9) * 0.06;

      // Glow when inspected
      if (frag1MatRef.current) {
        const inspectedGlow = evidenceState.supporting.inspected ? 0.6 : 0;
        const activeGlow = activeInspect === 'supporting' ? 1.5 : 0;
        const decisionGlow = isDecisionAvailable ? 0.4 + Math.sin(time * 2) * 0.3 : 0;
        frag1MatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          frag1MatRef.current.emissiveIntensity,
          inspectedGlow + activeGlow + decisionGlow,
          3,
          delta
        );
      }
    }

    // ── Fragment 2 — CONTRADICTORY SHARD ────────────────────────────
    if (frag2Ref.current) {
      let target: THREE.Vector3;

      if (activeInspect === 'contradictory') {
        target = INSPECT_OFFSET.contradictory.clone();
        inspectRotRef.current.contradictory += delta * 1.8;
        frag2Ref.current.rotation.y = inspectRotRef.current.contradictory;
      } else if (crossExamChoice === 'expose_contradiction') {
        // Chosen: move to center examination position
        target = new THREE.Vector3(0, 0.5, 0.5);
      } else {
        target = new THREE.Vector3().lerpVectors(
          DISPERSED.contradictory,
          DOCK.contradictory,
          assembleT
        );
        frag2Ref.current.rotation.y = -assembleT * Math.PI * 0.2 - idleRot;
      }

      target.y += idleY * 0.8;

      // Stress vibration during the opposition clash (≈3.75–4.6 s)
      if (progress >= 0.5 && progress < 0.613 && !activeInspect) {
        const stressT = (progress - 0.5) / 0.113;
        const vibration = Math.sin(time * 25) * 0.025 * Math.sin(stressT * Math.PI);
        target.x += vibration;
        target.y += vibration * 0.5;
      }

      frag2Ref.current.position.lerp(target, delta * 3.2);
      frag2Ref.current.rotation.x = Math.cos(time * 0.7) * 0.08;

      if (frag2MatRef.current) {
        const stressGlow = assembleT > 0.7 && progress < 0.85 ? 0.8 + Math.sin(time * 4) * 0.3 : 0;
        const inspectedGlow = evidenceState.contradictory.inspected ? 0.4 : 0;
        const activeGlow = activeInspect === 'contradictory' ? 1.5 : 0;
        const decisionGlow = isDecisionAvailable ? 0.4 + Math.sin(time * 2.5) * 0.3 : 0;
        frag2MatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          frag2MatRef.current.emissiveIntensity,
          stressGlow + inspectedGlow + activeGlow + decisionGlow,
          3,
          delta
        );
      }
    }

    // ── Fragment 3 — INCOMPLETE RECORD ──────────────────────────────
    if (frag3Ref.current) {
      let target: THREE.Vector3;

      if (activeInspect === 'incomplete') {
        target = INSPECT_OFFSET.incomplete.clone();
        inspectRotRef.current.incomplete += delta * 1.2;
        frag3Ref.current.rotation.x = inspectRotRef.current.incomplete;
      } else {
        const adjustedDock = DOCK.incomplete.clone();
        adjustedDock.y += 0.2;
        adjustedDock.z -= 0.15;
        target = new THREE.Vector3().lerpVectors(
          DISPERSED.incomplete,
          adjustedDock,
          assembleT * 0.85
        );
      }

      target.y += Math.sin(time * 1.3) * 0.06;

      // During settling (weighing, 4.6–5.8 s), incomplete fragment recedes
      if (progress >= 0.7) {
        const fadeT = (progress - 0.7) / 0.15;
        target.y += fadeT * 0.8;
        if (frag3MatRef.current) {
          frag3MatRef.current.opacity = THREE.MathUtils.damp(
            frag3MatRef.current.opacity,
            Math.max(0.2, 0.7 - fadeT * 0.4),
            3,
            delta
          );
        }
      }

      frag3Ref.current.position.lerp(target, delta * 2.8);
      if (activeInspect !== 'incomplete') {
        frag3Ref.current.rotation.x += delta * 0.15;
        frag3Ref.current.rotation.z = Math.sin(time * 0.6) * 0.12;
      }
    }
  });

  // ── Interaction Handlers ──────────────────────────────────────────
  const handleFragClick = useCallback(
    (id: EvidenceId) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!isInteractable) return;

      // While the cross-exam window is open, choosing supporting or
      // contradictory registers the decision
      if (isDecisionAvailable && !crossExamChoice) {
        if (id === 'supporting') {
          onDecision('align_support');
          return;
        }
        if (id === 'contradictory') {
          onDecision('expose_contradiction');
          return;
        }
      }

      // Normal evidence inspection
      if (activeInspect === id) {
        onEvidenceInspectEnd();
      } else {
        onEvidenceClick(id);
      }
    },
    [
      isInteractable,
      isDecisionAvailable,
      crossExamChoice,
      activeInspect,
      onDecision,
      onEvidenceClick,
      onEvidenceInspectEnd,
    ]
  );

  const onOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (isInteractable) {
        document.body.style.cursor = 'pointer';
      }
    },
    [isInteractable]
  );

  const onOut = useCallback(() => {
    document.body.style.cursor = 'default';
  }, []);

  return (
    <group ref={groupRef} position={[0, 0.3, -3.5]}>
      {/* ── Fragment 1: SUPPORTING CRYSTAL — 5-sided prism ── */}
      <mesh
        ref={frag1Ref}
        position={DISPERSED.supporting.toArray()}
        castShadow
        receiveShadow
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={handleFragClick('supporting')}
      >
        <cylinderGeometry args={[0.22, 0.35, 1.1, 5]} />
        <meshStandardMaterial
          ref={frag1MatRef}
          color={canonicalColors.warmBone}
          emissive={new THREE.Color(canonicalColors.warmBone)}
          emissiveIntensity={0}
          roughness={0.22}
          metalness={0.35}
          transparent
          opacity={0.92}
          flatShading
        />
      </mesh>

      {/* ── Fragment 2: CONTRADICTORY SHARD — angular octahedron ── */}
      <mesh
        ref={frag2Ref}
        position={DISPERSED.contradictory.toArray()}
        castShadow
        receiveShadow
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={handleFragClick('contradictory')}
      >
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          ref={frag2MatRef}
          color={canonicalColors.weatheredStone}
          emissive={new THREE.Color(canonicalColors.oxidizedCopper)}
          emissiveIntensity={0}
          roughness={0.82}
          metalness={0.2}
          flatShading
        />
      </mesh>

      {/* ── Fragment 3: INCOMPLETE RECORD — translucent tablet ── */}
      <mesh
        ref={frag3Ref}
        position={DISPERSED.incomplete.toArray()}
        castShadow
        receiveShadow
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={handleFragClick('incomplete')}
      >
        <boxGeometry args={[0.6, 0.8, 0.12]} />
        <meshStandardMaterial
          ref={frag3MatRef}
          color={canonicalColors.ash}
          roughness={0.6}
          metalness={0.15}
          transparent
          opacity={0.7}
          flatShading
        />
      </mesh>

      {/* ── Cross-Exam Visual Cues — while choice is open ── */}
      {decisionWindowActive && !crossExamChoice && (
        <>
          {/* Supporting choice hint — pulsing ring */}
          <mesh
            position={[DOCK.supporting.x, DOCK.supporting.y - 0.3, DOCK.supporting.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.5, 0.55, 16]} />
            <meshBasicMaterial
              color={canonicalColors.warmBone}
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Contradictory choice hint — pulsing ring */}
          <mesh
            position={[DOCK.contradictory.x, DOCK.contradictory.y - 0.3, DOCK.contradictory.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.5, 0.55, 16]} />
            <meshBasicMaterial
              color={canonicalColors.oxidizedCopper}
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
};
