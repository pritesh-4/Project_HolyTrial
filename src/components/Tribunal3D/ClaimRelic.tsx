/**
 * ClaimRelic — "The Sigil of the Claim"
 *
 * A purposefully designed judicial artifact: an upright five-sided obsidian
 * medallion set in an oxidized-copper frame, carrying an etched sigil that
 * is TRACED open when the claim awakens the tribunal — and that records the
 * story on its surface: a procedural fracture from the opposition's strike,
 * locking struts during the tribunal's response, and hidden amendment
 * strokes that only appear under inspection.
 *
 * Visual rules honored here:
 *  - No perpetual rotation; idle is a restrained breathing scale.
 *  - Ember is a signature moment color (inspection), not a looping glow.
 *  - Every line drawn is information: sigil, fracture, amendment.
 */
import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { canonicalColors } from './SceneMaterials';
import { NarrativeAct } from '../CinematicEngine';
import {
  makeGlyphRing,
  makeRadialMarks,
  makeCrack,
  makeEtchedSegments,
  windowT,
  easedWindow,
} from './etch';

interface ClaimRelicProps {
  progress: number;
  isEntering?: boolean;
  claimInspected: boolean;
  claimHovered: boolean;
  act: NarrativeAct;
  onHoverChange?: (hovered: boolean) => void;
  onClick?: () => void;
  onInspectEnd?: () => void;
}

/** Master-timeline windows (elapsed s = progress × 7.5). */
const WIN = {
  riseStart: 0.0933, // awakening begins (0.7 s)
  sigilTrace: [0.1, 0.235] as const, // engraving traced as copper light arrives
  sigilFlash: [0.235, 0.27] as const, // one-shot ring flash when seal completes
  impact: [0.53, 0.6] as const, // opposition strike
  crackTrace: [0.555, 0.6] as const, // fracture recorded at impact
  settle: [0.6, 0.76] as const, // tribunal rights the claim
  ascent: 0.76, // revelation onward: gentle rise into the composition
  strutLock: [0.34, 0.4133] as const, // supporting evidence locks in
};

export const ClaimRelic: React.FC<ClaimRelicProps> = ({
  progress,
  isEntering = false,
  claimInspected,
  claimHovered,
  act,
  onHoverChange,
  onClick,
  onInspectEnd,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const flashRingRef = useRef<THREE.Mesh>(null);
  const copperFrameRef = useRef<THREE.MeshStandardMaterial>(null);
  const inspectFlashRef = useRef(0);

  // ── Etched geometry (built once; traced via drawRange) ─────────────
  const etched = useMemo(() => {
    const sigilRing = makeGlyphRing(new THREE.Vector3(0, 0, 0.086), 0.44, 'xy', {
      color: canonicalColors.oxidizedCopper,
      notches: 5,
      restOpacity: 0.85,
      dashSize: 0.09,
      gapSize: 0.06,
    });
    const innerRing = makeGlyphRing(new THREE.Vector3(0, 0, 0.086), 0.24, 'xy', {
      color: canonicalColors.warmBone,
      notches: 3,
      restOpacity: 0.55,
      dashSize: 0.05,
      gapSize: 0.05,
    });
    const radial = makeRadialMarks(new THREE.Vector3(0, 0, 0.086), 0.5, 0.66, 10, 'xy', {
      color: canonicalColors.oxidizedCopper,
      restOpacity: 0.7,
      dashSize: 0.05,
      gapSize: 0.04,
    });
    const fracture = makeCrack(new THREE.Vector3(0.05, 0.52, 0.088), -2.2, 1.05, 16, 11, {
      color: canonicalColors.ember,
      restOpacity: 0.5,
      dashSize: 0.045,
      gapSize: 0.035,
    });
    // Hidden amendment strokes on the reverse face — inspection only
    const amendments = makeEtchedSegments(
      [
        [new THREE.Vector3(-0.32, 0.18, -0.088), new THREE.Vector3(0.05, 0.26, -0.088)],
        [new THREE.Vector3(0.05, 0.26, -0.088), new THREE.Vector3(0.3, 0.12, -0.088)],
        [new THREE.Vector3(-0.24, -0.06, -0.088), new THREE.Vector3(0.18, -0.02, -0.088)],
        [new THREE.Vector3(-0.14, -0.3, -0.088), new THREE.Vector3(0.22, -0.34, -0.088)],
      ],
      { color: canonicalColors.warmBone, restOpacity: 0.9, dashSize: 0.06, gapSize: 0.05 }
    );
    return { sigilRing, innerRing, radial, fracture, amendments };
  }, []);

  // ── Interactability (overlay windows — never gate the timeline) ─────
  const isInteractable = (
    [
      NarrativeAct.OPENING,
      NarrativeAct.AWAKENING,
      NarrativeAct.EVIDENCE,
      NarrativeAct.OPPOSITION,
      NarrativeAct.WEIGHING,
      NarrativeAct.REVELATION,
      NarrativeAct.FINALE,
      NarrativeAct.COMPLETED,
    ] as readonly NarrativeAct[]
  ).includes(act);

  const inspectAnimRef = useRef(0);
  const [isInspectAnimating, setIsInspectAnimating] = useState(false);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const p = progress;

    // Inspection afterglow decays smoothly (no timers, no restarts)
    inspectFlashRef.current = THREE.MathUtils.damp(inspectFlashRef.current, 0, 1.1, delta);

    // ── Traced engraving & fracture (no allocation) ─────────────────
    const sigilT = easedWindow(p, WIN.sigilTrace[0], WIN.sigilTrace[1]);
    etched.sigilRing.setReveal(sigilT);
    etched.innerRing.setReveal(easedWindow(p, 0.16, 0.28));
    etched.radial.forEach((l, i) => {
      const stagger = 0.12 * i;
      l.setReveal(easedWindow(p, 0.18 + stagger * 0.06, 0.26 + stagger * 0.06));
      l.setOpacity(0.7 * Math.min(1, sigilT * 1.2));
    });
    const crackT = easedWindow(p, WIN.crackTrace[0], WIN.crackTrace[1]);
    etched.fracture.setReveal(crackT);
    etched.fracture.setOpacity(crackT > 0 ? 0.55 * crackT + 0.2 : 0);

    // Amendment strokes appear only while inspected
    const inspecting = isInspectAnimating || inspectFlashRef.current > 0.1;
    const amendOpacity = inspecting ? 0.9 : claimInspected ? 0.28 : 0;
    etched.amendments.setReveal(inspecting ? 1 : Math.max(0, amendOpacity));
    etched.amendments.setOpacity(
      THREE.MathUtils.damp(etched.amendments.material.opacity, amendOpacity, 6, delta)
    );

    // ── One-shot seal flash (sigil completion) ──────────────────────
    if (flashRingRef.current) {
      const flashT = windowT(p, WIN.sigilFlash[0], WIN.sigilFlash[1]);
      const s = 0.66 + flashT * 0.5;
      flashRingRef.current.scale.set(s, s, s);
      (flashRingRef.current.material as THREE.MeshBasicMaterial).opacity =
        Math.sin(Math.min(1, flashT) * Math.PI) * 0.5;
    }

    // ── Copper frame responds (brightens as the story validates) ────
    if (copperFrameRef.current) {
      const lockT = easedWindow(p, WIN.strutLock[0], WIN.strutLock[1]);
      const settleT = easedWindow(p, WIN.settle[0], WIN.settle[1]);
      const target = 0.35 + lockT * 0.55 + settleT * 0.3 + (claimInspected ? 0.4 : 0);
      copperFrameRef.current.emissiveIntensity = THREE.MathUtils.damp(
        copperFrameRef.current.emissiveIntensity,
        target,
        3,
        delta
      );
    }

    // ── Ember core: restrained, inspect-significant ─────────────────
    if (coreMatRef.current) {
      const inspectBoost = inspecting ? 2.0 : claimInspected ? 1.0 : 0;
      const stormBoost = p >= WIN.impact[0] && p < WIN.impact[1] ? 1.4 : 0; // impact heat, once
      const target = 0.45 + inspectBoost * 0.8 + stormBoost;
      coreMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        coreMatRef.current.emissiveIntensity,
        target,
        4,
        delta
      );
    }

    // ── Position & scale: awakening rise → settle → ascent ──────────
    const breath = Math.sin(time * 1.1) * 0.015;
    let targetScale = 0.001;
    let targetY = -1.35;

    if (p >= WIN.riseStart) {
      const riseT = easedWindow(p, WIN.riseStart, 0.24);
      targetScale = 0.6 + riseT * 0.4;
      targetY = -1.35 + riseT * 1.65;
      if (p >= 0.24) {
        targetY = 0.3 + breath;
        targetScale = 1.0;
      }
    }

    // Impact vibration (windows-driven, brief)
    if (p >= WIN.impact[0] && p < WIN.impact[1]) {
      const stressT = (p - WIN.impact[0]) / (WIN.impact[1] - WIN.impact[0]);
      const vibration = Math.sin(time * 34) * 0.035 * Math.sin(stressT * Math.PI);
      targetY += vibration;
    }

    // ── Settle: medallion rights itself after the challenge ──────────
    if (coreRef.current) {
      const settleT = easedWindow(p, WIN.settle[0], WIN.settle[1]);
      // Inspection spins the medallion 360°; idle rotation is forbidden.
      if (isInspectAnimating) {
        inspectAnimRef.current += delta * 3.4;
        coreRef.current.rotation.y = inspectAnimRef.current;
        if (inspectAnimRef.current >= Math.PI * 2) {
          inspectAnimRef.current = 0;
          setIsInspectAnimating(false);
          onInspectEnd?.();
        }
      } else {
        // Story tilt: lean during evidence/conflict, right itself on settle
        const leanT = easedWindow(p, 0.24, 0.6133);
        coreRef.current.rotation.y = THREE.MathUtils.damp(
          coreRef.current.rotation.y,
          leanT * 0.35 * (1 - settleT * 0.9),
          3,
          delta
        );
      }
      coreRef.current.rotation.z = Math.sin(time * 0.6) * 0.008 * (1 - settleT);
    }

    // Revelation onward: gentle rise into the final composition
    if (p >= WIN.ascent) targetY += (p - WIN.ascent) * 1.4;
    if (isEntering) {
      targetScale *= 1.25;
      targetY += 0.55;
    }

    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetY,
      3.5,
      delta
    );
    const s = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 3.0, delta);
    groupRef.current.scale.set(s, s, s);
  });

  // ── Interaction handlers ─────────────────────────────────────────────
  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!isInteractable) return;
      onHoverChange?.(true);
      document.body.style.cursor = 'pointer';
    },
    [isInteractable, onHoverChange]
  );

  const handlePointerOut = useCallback(() => {
    onHoverChange?.(false);
    document.body.style.cursor = 'default';
  }, [onHoverChange]);

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!isInteractable) return;
      if (!isInspectAnimating) {
        setIsInspectAnimating(true);
        inspectAnimRef.current = 0;
        inspectFlashRef.current = 1;
        onClick?.();
      }
    },
    [isInteractable, isInspectAnimating, onClick]
  );

  return (
    <group
      ref={groupRef}
      position={[0, -1.35, -3.5]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* The Medallion — five-sided obsidian seal (claim form identity) */}
      <mesh ref={coreRef} castShadow receiveShadow rotation={[Math.PI / 2, 0, Math.PI / 5]}>
        <cylinderGeometry args={[0.55, 0.55, 0.15, 5]} />
        <meshStandardMaterial
          color={canonicalColors.obsidian}
          roughness={0.14}
          metalness={0.86}
          flatShading
        />
      </mesh>

      {/* Copper frame ring (meaning: the claim is framed by the court) */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.035, 10, 64]} />
        <meshStandardMaterial
          ref={copperFrameRef}
          color={canonicalColors.oxidizedCopper}
          emissive={new THREE.Color(canonicalColors.oxidizedCopper)}
          emissiveIntensity={0.35}
          roughness={0.34}
          metalness={0.85}
        />
      </mesh>

      {/* Inner bone ring — restraints / binding of testimony */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.012, 8, 48]} />
        <meshStandardMaterial color={canonicalColors.warmBone} roughness={0.6} metalness={0.12} />
      </mesh>

      {/* Verdict core: embers restrained behind the sigil */}
      <mesh position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color={canonicalColors.ember}
          emissive={canonicalColors.ember}
          emissiveIntensity={0.45}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* Etched sigil — traced by the awakening copper light */}
      <primitive object={etched.sigilRing.object} />
      <primitive object={etched.innerRing.object} />
      {etched.radial.map((l, i) => (
        <primitive key={i} object={l.object} />
      ))}
      <primitive object={etched.fracture.object} />
      <primitive object={etched.amendments.object} />

      {/* One-shot seal flash when the sigil completes (coplanar with the medallion face) */}
      <mesh ref={flashRingRef}>
        <ringGeometry args={[0.72, 0.76, 48]} />
        <meshBasicMaterial
          color={canonicalColors.oxidizedCopper}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Interaction affordance — a single restrained ring, hidden after use */}
      {isInteractable && !claimInspected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, 0]}>
          <ringGeometry args={[0.95, 0.98, 40]} />
          <meshBasicMaterial
            color={canonicalColors.oxidizedCopper}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Focal point light — the claim is what the chamber attends to */}
      <pointLight
        color={canonicalColors.ember}
        intensity={claimHovered ? 3.2 : claimInspected ? 2.4 : 1.6}
        distance={6.5}
        decay={2}
      />
    </group>
  );
};
