import React, { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { canonicalColors } from './SceneMaterials';
import { NarrativeAct } from '../CinematicEngine';

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
  const emberRef = useRef<THREE.Mesh>(null);
  const emberMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const copperRing1Ref = useRef<THREE.Mesh>(null);
  const copperRing2Ref = useRef<THREE.Mesh>(null);
  const innerGlyphRef = useRef<THREE.Mesh>(null);
  const innerGlyphMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const [localHovered, setLocalHovered] = useState(false);
  const inspectAnimRef = useRef(0);
  const [isInspectAnimating, setIsInspectAnimating] = useState(false);

  const hovered = localHovered || claimHovered;

  // Claim reacts from AWAKENING onward — including after the cinematic
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

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();

    // ── Position & Scale ─────────────────────────────────────────────
    const hoverOffset = hovered ? 0.2 : 0;
    const idleY = Math.sin(time * 1.5) * 0.08 + hoverOffset;
    let targetY = 0.3 + idleY;
    let targetScale = 1.0;

    // Windows remapped to the 7.5 s master timeline (see CinematicEngine):
    // awakening 0.107–0.24 · opposition clash 0.53–0.613 · ascent from 0.773
    if (progress < 0.24) {
      // Awakening: emerge from below as the copper light reaches it
      const introRatio = Math.max(0, Math.min(1, (progress - 0.09) / 0.15));
      const eased = introRatio * introRatio * (3 - 2 * introRatio);
      targetScale = 0.2 + eased * 0.8;
      targetY = -1 + eased * 1.3 + idleY;
    } else if (progress >= 0.5 && progress < 0.613) {
      // Under opposition: stress vibration
      const stressRatio = (progress - 0.5) / 0.113;
      const vibration = Math.sin(time * 35) * 0.03 * Math.sin(stressRatio * Math.PI);
      targetY += vibration;
    } else if (progress >= 0.773) {
      // Reasoned outcome: subtle ascension into the final composition
      targetY += (progress - 0.773) * 1.8;
    }

    if (isEntering) {
      targetScale = 1.3;
      targetY += 0.6;
    }

    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetY,
      3.5,
      delta
    );

    const currentScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.damp(currentScale, targetScale, 3.0, delta);
    groupRef.current.scale.set(nextScale, nextScale, nextScale);

    // ── Rotations ────────────────────────────────────────────────────
    if (coreRef.current) {
      if (isInspectAnimating) {
        // Smooth 360° inspection rotation
        inspectAnimRef.current += delta * 2.5;
        coreRef.current.rotation.y += delta * 3.0;
        if (inspectAnimRef.current >= Math.PI * 2) {
          inspectAnimRef.current = 0;
          setIsInspectAnimating(false);
          onInspectEnd?.();
        }
      } else {
        const rotSpeed = hovered ? 0.8 : 0.3;
        coreRef.current.rotation.y += delta * rotSpeed;
      }
      coreRef.current.rotation.x = Math.sin(time * 0.8) * 0.12;
    }

    if (copperRing1Ref.current) {
      copperRing1Ref.current.rotation.x += delta * 0.45;
      copperRing1Ref.current.rotation.z += delta * 0.25;
    }

    if (copperRing2Ref.current) {
      copperRing2Ref.current.rotation.y -= delta * 0.35;
      copperRing2Ref.current.rotation.x += delta * 0.18;
    }

    // ── Ember pulsation ──────────────────────────────────────────────
    if (emberMatRef.current) {
      const pulse = Math.sin(time * 3.0) * 0.5 + 2.4;
      const hoverBoost = hovered ? 2.0 : 0;
      const inspectedBoost = claimInspected ? 1.2 : 0;
      const inspectAnim = isInspectAnimating ? 2.0 : 0;
      emberMatRef.current.emissiveIntensity = pulse + hoverBoost + inspectedBoost + inspectAnim;
    }

    // ── Inner glyph visibility (revealed after inspection) ───────────
    if (innerGlyphMatRef.current) {
      const glyphTarget = claimInspected ? 0.9 : 0;
      innerGlyphMatRef.current.opacity = THREE.MathUtils.damp(
        innerGlyphMatRef.current.opacity,
        glyphTarget,
        3,
        delta
      );
    }
  });

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!isInteractable) return;
      setLocalHovered(true);
      onHoverChange?.(true);
      document.body.style.cursor = 'pointer';
    },
    [isInteractable, onHoverChange]
  );

  const handlePointerOut = useCallback(() => {
    setLocalHovered(false);
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
        onClick?.();
      }
    },
    [isInteractable, isInspectAnimating, onClick]
  );

  return (
    <group
      ref={groupRef}
      position={[0, -1, -3.5]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Central Pulsing Ember Singularity */}
      <mesh ref={emberRef}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial
          ref={emberMatRef}
          color={canonicalColors.ember}
          emissive={canonicalColors.ember}
          emissiveIntensity={2.8}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Faceted Volcanic Obsidian Dodecahedron Core */}
      <mesh ref={coreRef} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial
          color={canonicalColors.obsidian}
          roughness={0.15}
          metalness={0.85}
          flatShading
        />
      </mesh>

      {/* Inner Glyph — revealed after inspection */}
      <mesh ref={innerGlyphRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.35, 6]} />
        <meshStandardMaterial
          ref={innerGlyphMatRef}
          color={canonicalColors.oxidizedCopper}
          emissive={new THREE.Color(canonicalColors.oxidizedCopper)}
          emissiveIntensity={1.5}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Oxidized Copper Orbital Armatures */}
      <mesh ref={copperRing1Ref}>
        <torusGeometry args={[1.05, 0.035, 12, 48]} />
        <meshStandardMaterial
          color={canonicalColors.oxidizedCopper}
          roughness={0.38}
          metalness={0.82}
        />
      </mesh>

      <mesh ref={copperRing2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.18, 0.028, 12, 48]} />
        <meshStandardMaterial
          color={canonicalColors.oxidizedCopper}
          roughness={0.38}
          metalness={0.82}
        />
      </mesh>

      {/* Fine Copper Node Points */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} scale={[0.07, 0.07, 0.07]}>
          <octahedronGeometry />
          <meshStandardMaterial
            color={canonicalColors.oxidizedCopper}
            roughness={0.38}
            metalness={0.82}
          />
        </mesh>
      ))}

      {/* Interaction hint — subtle pulsing ring visible during interactive acts */}
      {isInteractable && !claimInspected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[1.4, 1.45, 32]} />
          <meshBasicMaterial
            color={canonicalColors.oxidizedCopper}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Point Light emitted from within the claim */}
      <pointLight
        color={canonicalColors.ember}
        intensity={hovered ? 3.5 : claimInspected ? 2.8 : 2.0}
        distance={7}
        decay={2}
      />
    </group>
  );
};
