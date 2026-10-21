/**
 * EvidenceCluster — three artifacts, three meanings, one choreography.
 *
 * 1. THE CORROBORANT (supporting) — a pair of warm-bone struts that fly in
 *    and LOCK into the claim's frame: the relationship "this holds" is made
 *    physical, then confirmed with a short etched link line.
 * 2. THE DISSENT (contradictory) — a sharp copper-tinged obsidian shard that
 *    hovers apart; at the dock moment it traces a fine incompatibility line
 *    to the claim, which folds back into the material after a beat.
 * 3. THE VEILED RECORD (incomplete) — an open arc whose missing segment is
 *    marked by a dashed ghost; it cannot resolve and recedes on settling.
 *
 * Each inspection reveals DISTINCT information (see inspect targets below).
 * Inspection is an overlay: it changes camera framing and local state but
 * never the authoritative master timeline.
 */
import React, { useRef, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { canonicalColors } from './SceneMaterials';
import { type EvidenceId, type EvidenceState, type CrossExamChoice } from '../CinematicEngine';
import { NarrativeAct } from '../CinematicEngine';
import { makeEtchedLine, makeEtchedSegments, makeGlyphRing, windowT, easedWindow } from './etch';

interface EvidenceClusterProps {
  progress: number;
  act: NarrativeAct;
  evidenceState: Record<EvidenceId, EvidenceState>;
  activeInspect: EvidenceId | null;
  crossExamChoice: CrossExamChoice;
  decisionWindowActive: boolean;
  reducedMotion?: boolean;
  onEvidenceClick: (id: EvidenceId) => void;
  onEvidenceInspectEnd: () => void;
  onDecision: (choice: 'align_support' | 'expose_contradiction') => void;
}

// ── Local layout (group sits at the claim: [0, 0.3, -3.5]) ─────────────
const DOCK = {
  strutL: new THREE.Vector3(-1.04, 0.06, 0.3),
  strutR: new THREE.Vector3(1.04, 0.06, 0.3),
  dissent: new THREE.Vector3(1.38, 0.78, 0.38),
  veiled: new THREE.Vector3(-1.08, 1.32, 0.15),
};
const DISPERSED = {
  strutL: new THREE.Vector3(-6, 3.4, 4.6),
  strutR: new THREE.Vector3(6.2, 4.2, 4.8),
  dissent: new THREE.Vector3(6.8, 4.6, 3.8),
  veiled: new THREE.Vector3(0.2, 7, -7),
};
const CENTER_MECHANISM = new THREE.Vector3(0.02, 0.5, 0.45); // decision target

const INSPECT_OFFSET = {
  supporting: new THREE.Vector3(-1.0, 0.3, 1.15),
  contradictory: new THREE.Vector3(1.35, 1.0, 1.05),
  incomplete: new THREE.Vector3(-1.05, 1.55, 0.8),
};

const WIN = {
  assemble: [0.26, 0.4] as const, // arrival choreography (1.8–3.0 s)
  dockFlash: [0.4, 0.4333] as const, // lock confirmation
  dissentLink: [0.375, 0.42] as const, // incompatibility line draws
  dissentLinkFade: [0.43, 0.55] as const, // folds back into the surface
  stress: [0.5, 0.6] as const, // challenge vibration
  settle: [0.68, 0.8] as const, // veiled record recedes on settling
};

// Per-frame scratch (hoisted — never allocated inside useFrame)
const scratchTarget = new THREE.Vector3();

export const EvidenceCluster: React.FC<EvidenceClusterProps> = ({
  progress,
  act,
  evidenceState,
  activeInspect,
  crossExamChoice,
  decisionWindowActive,
  reducedMotion = false,
  onEvidenceClick,
  onEvidenceInspectEnd,
  onDecision,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const strutLRef = useRef<THREE.Mesh>(null);
  const strutRRef = useRef<THREE.Mesh>(null);
  const strutLMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const strutRMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const dissentRef = useRef<THREE.Mesh>(null);
  const dissentMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const dissentEdgeRef = useRef<THREE.Mesh>(null);
  const veiledRef = useRef<THREE.Group>(null);
  const veiledMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const veiledEmberRef = useRef<THREE.Mesh>(null);
  const veiledEmberMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Inspect rotation accumulators
  const inspectRotRef = useRef<Record<EvidenceId, number>>({
    supporting: 0,
    contradictory: 0,
    incomplete: 0,
  });
  const inspectFlashRef = useRef(0);

  // ── Etched relation lines (built once, traced via drawRange) ────────
  const relations = useMemo(() => {
    // Corroborant confirmation: strut joints to the claim frame
    const supportLink = makeEtchedSegments(
      [
        [new THREE.Vector3(-1.04, 0.06, 0.31), new THREE.Vector3(-0.5, 0.16, 0.1)],
        [new THREE.Vector3(1.04, 0.06, 0.31), new THREE.Vector3(0.5, 0.16, 0.1)],
      ],
      { color: canonicalColors.warmBone, restOpacity: 0.4, dashSize: 0.05, gapSize: 0.05 }
    );
    // Incompatibility trace: dissent shard → claim upper edge (draws, then folds)
    const dissentLink = makeEtchedLine(
      [
        new THREE.Vector3(1.38, 0.78, 0.38),
        new THREE.Vector3(0.95, 0.62, 0.14),
        new THREE.Vector3(0.52, 0.55, -0.02),
      ],
      {
        color: canonicalColors.ember,
        restOpacity: 0,
        dashSize: 0.04,
        gapSize: 0.05,
      }
    );
    // Ghost of the missing wedge on the veiled record
    const veiledGhost = makeGlyphRing(new THREE.Vector3(0, 0, 0), 0.4, 'xy', {
      color: canonicalColors.ash,
      restOpacity: 0.3,
      dashSize: 0.05,
      gapSize: 0.09,
    });
    return { supportLink, dissentLink, veiledGhost };
  }, []);

  // ── Interactability (overlay windows — never gate the timeline) ─────
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
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const p = progress;
    const t = easedWindow(p, WIN.assemble[0], WIN.assemble[1]);

    inspectFlashRef.current = THREE.MathUtils.damp(inspectFlashRef.current, 0, 1.2, delta);
    const inspecting = Boolean(activeInspect) || inspectFlashRef.current > 0.1;

    // ── Relation lines: draw, hold, or fold back by story beat ───────
    const supportT = easedWindow(p, 0.36, 0.43);
    relations.supportLink.setReveal(supportT);
    relations.supportLink.setOpacity(
      inspectFlashRef.current > 0.1 && activeInspect === 'supporting' ? 0.9 : 0.4 * supportT
    );

    // Dissent line draws during the evidence tie-in, then folds away
    const dissentDraw = easedWindow(p, WIN.dissentLink[0], WIN.dissentLink[1]);
    const dissentFade = 1 - easedWindow(p, WIN.dissentLinkFade[0], WIN.dissentLinkFade[1]);
    relations.dissentLink.setReveal(dissentDraw);
    relations.dissentLink.setOpacity(
      inspecting && activeInspect === 'contradictory' ? 0.85 : 0.6 * dissentDraw * dissentFade
    );

    // Ghost of the missing wedge (information, not decoration)
    const ghostT = easedWindow(p, 0.28, 0.36);
    relations.veiledGhost.setReveal(ghostT);
    relations.veiledGhost.setOpacity(activeInspect === 'incomplete' ? 0.8 : 0.3 * ghostT);

    // ── Idle micro-motion (restrained, no competing choreography; frozen
    // under reduced motion) ────────────────────────────────────────────
    const idleY = reducedMotion ? 0 : Math.sin(time * 1.6) * 0.03;
    const idleRot = reducedMotion ? 0 : Math.cos(time * 1.1) * 0.02;

    // ── THE CORROBORANT — struts fly in and lock into the frame ──────
    if (strutLRef.current) {
      const target = scratchTarget.lerpVectors(DISPERSED.strutL, DOCK.strutL, t);
      target.y += idleY;
      strutLRef.current.position.lerp(target, delta * 3.4);
      strutLRef.current.rotation.z = THREE.MathUtils.damp(
        strutLRef.current.rotation.z,
        t * Math.PI * 0.5, // settle horizontal
        3,
        delta
      );
      if (strutLMatRef.current) {
        const glow =
          0.15 +
          easedWindow(p, 0.34, 0.42) * 0.6 +
          (evidenceState.supporting.inspected ? 0.35 : 0) +
          (activeInspect === 'supporting' ? 1.4 : 0);
        strutLMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          strutLMatRef.current.emissiveIntensity,
          glow,
          3,
          delta
        );
      }
    }
    if (strutRRef.current) {
      const target = scratchTarget.lerpVectors(DISPERSED.strutR, DOCK.strutR, t);
      target.y += idleY * 0.9;
      strutRRef.current.position.lerp(target, delta * 3.4);
      strutRRef.current.rotation.z = THREE.MathUtils.damp(
        strutRRef.current.rotation.z,
        -t * Math.PI * 0.5,
        3,
        delta
      );
      if (strutRMatRef.current) {
        const glow =
          0.15 +
          easedWindow(p, 0.34, 0.42) * 0.6 +
          (evidenceState.supporting.inspected ? 0.35 : 0) +
          (activeInspect === 'supporting' ? 1.4 : 0);
        strutRMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          strutRMatRef.current.emissiveIntensity,
          glow,
          3,
          delta
        );
      }
    }

    // ── THE DISSENT — shard arrives, flares once, traces the conflict ─
    if (dissentRef.current) {
      let target: THREE.Vector3;
      if (crossExamChoice === 'expose_contradiction') {
        // Chosen: move into the central mechanism (physical response)
        target = scratchTarget.copy(CENTER_MECHANISM);
      } else if (activeInspect === 'contradictory') {
        target = scratchTarget.copy(INSPECT_OFFSET.contradictory);
        inspectRotRef.current.contradictory += delta * 1.6;
        dissentRef.current.rotation.y = inspectRotRef.current.contradictory;
      } else {
        target = scratchTarget.lerpVectors(DISPERSED.dissent, DOCK.dissent, t);
        // Stress during the challenge (mapped, brief)
        if (p >= WIN.stress[0] && p < WIN.stress[1] && !reducedMotion) {
          const stressT = (p - WIN.stress[0]) / (WIN.stress[1] - WIN.stress[0]);
          const vibration = Math.sin(time * 24) * 0.03 * Math.sin(stressT * Math.PI);
          target.x += vibration;
          target.y += vibration * 0.5;
        }
      }
      target.y += idleY * 0.6;
      dissentRef.current.position.lerp(target, delta * 3.4);

      if (dissentMatRef.current) {
        const glow =
          0.12 +
          windowT(p, WIN.dockFlash[0], WIN.dockFlash[1]) * 2.2 +
          (evidenceState.contradictory.inspected ? 0.4 : 0) +
          (activeInspect === 'contradictory' ? 1.5 : 0) +
          (crossExamChoice === 'expose_contradiction' ? 1.0 : 0);
        dissentMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          dissentMatRef.current.emissiveIntensity,
          glow,
          3,
          delta
        );
      }
      // Copper edge spark — one flare at dock, restrained afterglow
      if (dissentEdgeRef.current) {
        (dissentEdgeRef.current.material as THREE.MeshBasicMaterial).opacity =
          windowT(p, WIN.dockFlash[0], WIN.dockFlash[1]) * 0.5;
      }
    }

    // ── THE VEILED RECORD — arc with a missing wedge; recedes on settle ─
    if (veiledRef.current) {
      let target: THREE.Vector3;
      if (activeInspect === 'incomplete') {
        target = scratchTarget.copy(INSPECT_OFFSET.incomplete);
        inspectRotRef.current.incomplete += delta * 1.1;
        veiledRef.current.rotation.y = inspectRotRef.current.incomplete;
      } else {
        const settled = easedWindow(p, WIN.settle[0], WIN.settle[1]);
        target = scratchTarget.lerpVectors(DISPERSED.veiled, DOCK.veiled, t * (1 - settled * 0.55));
        target.y += settled * 0.5 + idleRot * 0.4; // recedes and dims away
      }
      target.y += reducedMotion ? 0 : Math.sin(time * 1.25) * 0.045;
      veiledRef.current.position.lerp(target, delta * 2.8);
      if (veiledMatRef.current) {
        const resolved = easedWindow(p, WIN.settle[0], WIN.settle[1]);
        const glow =
          (evidenceState.incomplete.inspected ? 0.3 : 0) +
          (activeInspect === 'incomplete' ? 1.2 : 0);
        veiledMatRef.current.opacity = THREE.MathUtils.damp(
          veiledMatRef.current.opacity,
          Math.max(0.25, 0.72 - resolved * 0.35 + glow * 0.2),
          3,
          delta
        );
      }
      if (veiledEmberMatRef.current) {
        // The unresolved core appears only under inspection
        const targetGlow = activeInspect === 'incomplete' ? 2.1 : 0;
        veiledEmberMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          veiledEmberMatRef.current.emissiveIntensity,
          targetGlow,
          4,
          delta
        );
      }
    }
  });

  // ── Interaction handlers (overlay — no timeline coupling) ────────────
  const handleFragClick = useCallback(
    (id: EvidenceId) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!isInteractable) return;

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

      if (activeInspect === id) {
        onEvidenceInspectEnd();
      } else {
        onEvidenceClick(id);
        inspectFlashRef.current = 1;
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
      {/* Relational etched lines (behind the artifacts) */}
      <primitive object={relations.supportLink.object} />
      <primitive object={relations.dissentLink.object} />
      <primitive object={relations.veiledGhost.object} />

      {/* ── THE CORROBORANT: warm-bone struts — six-sided long beams ── */}
      <mesh
        ref={strutLRef}
        position={DISPERSED.strutL.toArray()}
        rotation={[0, 0, Math.PI / 3]}
        castShadow
        receiveShadow
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={handleFragClick('supporting')}
      >
        <cylinderGeometry args={[0.09, 0.12, 1.5, 6]} />
        <meshStandardMaterial
          ref={strutLMatRef}
          color={canonicalColors.warmBone}
          emissive={new THREE.Color(canonicalColors.warmBone)}
          emissiveIntensity={0.15}
          roughness={0.45}
          metalness={0.25}
          flatShading
        />
      </mesh>
      <mesh
        ref={strutRRef}
        position={DISPERSED.strutR.toArray()}
        rotation={[0, 0, -Math.PI / 3]}
        castShadow
        receiveShadow
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={handleFragClick('supporting')}
      >
        <cylinderGeometry args={[0.09, 0.12, 1.5, 6]} />
        <meshStandardMaterial
          ref={strutRMatRef}
          color={canonicalColors.warmBone}
          emissive={new THREE.Color(canonicalColors.warmBone)}
          emissiveIntensity={0.15}
          roughness={0.45}
          metalness={0.25}
          flatShading
        />
      </mesh>

      {/* ── THE DISSENT: sharp obsidian octahedron with copper edge ── */}
      <mesh
        ref={dissentRef}
        position={DISPERSED.dissent.toArray()}
        castShadow
        receiveShadow
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={handleFragClick('contradictory')}
      >
        <octahedronGeometry args={[0.44, 0]} />
        <meshStandardMaterial
          ref={dissentMatRef}
          color={canonicalColors.obsidian}
          emissive={new THREE.Color(canonicalColors.oxidizedCopper)}
          emissiveIntensity={0.12}
          roughness={0.3}
          metalness={0.65}
          flatShading
        />
      </mesh>
      <mesh ref={dissentEdgeRef} position={DISPERSED.dissent.toArray()}>
        <octahedronGeometry args={[0.46, 0]} />
        <meshBasicMaterial
          color={canonicalColors.oxidizedCopper}
          transparent
          opacity={0}
          wireframe
          depthWrite={false}
        />
      </mesh>

      {/* ── THE VEILED RECORD: open arc with a missing wedge ── */}
      <group ref={veiledRef} position={DISPERSED.veiled.toArray()}>
        <mesh castShadow receiveShadow rotation={[0.12, 0, -0.35]}>
          <torusGeometry args={[0.42, 0.09, 8, 32, Math.PI * 1.62]} />
          <meshStandardMaterial
            ref={veiledMatRef}
            color={canonicalColors.ash}
            emissive={new THREE.Color(canonicalColors.warmBone)}
            emissiveIntensity={0.2}
            roughness={0.62}
            metalness={0.15}
            transparent
            opacity={0.72}
            flatShading
          />
        </mesh>
        {/* The unresolved ember — visible only under inspection */}
        <mesh ref={veiledEmberRef} position={[-0.05, 0.05, 0.02]}>
          <sphereGeometry args={[0.07, 14, 14]} />
          <meshStandardMaterial
            ref={veiledEmberMatRef}
            color={canonicalColors.ember}
            emissive={canonicalColors.ember}
            emissiveIntensity={0}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* Cross-exam affordance — only while the choice is genuinely open */}
      {decisionWindowActive && !crossExamChoice && (
        <>
          <mesh position={[DOCK.strutL.x, DOCK.strutL.y - 0.35, DOCK.strutL.z]}>
            <ringGeometry args={[0.3, 0.33, 24]} />
            <meshBasicMaterial
              color={canonicalColors.warmBone}
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[DOCK.dissent.x, DOCK.dissent.y - 0.55, DOCK.dissent.z]}>
            <ringGeometry args={[0.42, 0.45, 24]} />
            <meshBasicMaterial
              color={canonicalColors.oxidizedCopper}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
};
