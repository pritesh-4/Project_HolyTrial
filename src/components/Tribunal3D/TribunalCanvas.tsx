import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TribunalArchitecture } from './TribunalArchitecture';
import { ClaimRelic } from './ClaimRelic';
import { EvidenceCluster } from './EvidenceCluster';
import { OppositionMonolith } from './OppositionMonolith';
import { canonicalColors } from './SceneMaterials';
import { NarrativeAct } from '../CinematicEngine';
import type { CinematicState, EvidenceId } from '../CinematicEngine';

interface TribunalCanvasProps {
  cinematicState: CinematicState;
  onClaimClick: () => void;
  onClaimHover: (hovered: boolean) => void;
  onClaimInspectEnd: () => void;
  onEvidenceClick: (id: EvidenceId) => void;
  onEvidenceInspectEnd: () => void;
  onDecision: (choice: 'align_support' | 'expose_contradiction') => void;
}

// ── Cinematic camera trajectory keyframes ───────────────────────────────
// Keys are master-timeline progress (0–1 over 7.5 s, linear in elapsed time).
// The windows overlap on purpose: the camera is already reframing toward the
// next composition while the previous act resolves.
interface TrajectoryKey {
  p: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

// Act windows: OPENING 0–0.0933 · AWAKENING 0.0933–0.24 · EVIDENCE 0.24–0.4133 ·
// OPPOSITION 0.4133–0.6 · WEIGHING 0.6–0.76 · REVELATION 0.76–0.92 · FINALE 0.92–1
const CAMERA_TRAJECTORY: TrajectoryKey[] = [
  // OPENING (0–0.7 s): the arrival — monumental gate and colonnade silence,
  // framed above the dais so the chamber itself stays concealed; the camera
  // is already descending while a copper light streak solves the mystery.
  { p: 0.0, pos: new THREE.Vector3(2.7, 7.3, 18.4), look: new THREE.Vector3(0, 3.4, -15) },
  { p: 0.0466, pos: new THREE.Vector3(1.7, 5.9, 14.8), look: new THREE.Vector3(0, 2.2, -13) },
  { p: 0.0933, pos: new THREE.Vector3(0.5, 3.9, 10.4), look: new THREE.Vector3(0, 0.7, -8) },

  // AWAKENING (0.7–1.8 s): descend to the claim rising on the dais
  { p: 0.17, pos: new THREE.Vector3(0, 2.0, 7.0), look: new THREE.Vector3(0, 0.2, -3.5) },
  { p: 0.24, pos: new THREE.Vector3(0, 1.5, 5.8), look: new THREE.Vector3(0, 0.3, -3.5) },

  // EVIDENCE (1.8–3.1 s): reframing orbit synced to fragment arrival
  { p: 0.32, pos: new THREE.Vector3(0.7, 1.3, 5.4), look: new THREE.Vector3(0, 0.35, -3.5) },
  { p: 0.4133, pos: new THREE.Vector3(-0.5, 1.1, 5.0), look: new THREE.Vector3(0, 0.3, -3.5) },

  // OPPOSITION (3.1–4.5 s): tension, off-center framing into the clash
  { p: 0.5, pos: new THREE.Vector3(-0.8, 0.9, 4.5), look: new THREE.Vector3(0.35, 0.4, -3.5) },
  { p: 0.6, pos: new THREE.Vector3(0.4, 0.9, 4.2), look: new THREE.Vector3(0, 0.3, -3.5) },

  // WEIGHING (4.5–5.7 s): pull back for the full mechanism settling
  { p: 0.7, pos: new THREE.Vector3(0, 1.4, 5.6), look: new THREE.Vector3(0, 0.5, -3.5) },
  { p: 0.755, pos: new THREE.Vector3(0, 1.25, 4.9), look: new THREE.Vector3(0, 0.55, -5) },

  // REVELATION (5.7–6.9 s): advance toward the gate as it releases
  { p: 0.86, pos: new THREE.Vector3(0, 1.1, 2.6), look: new THREE.Vector3(0, 1.0, -12) },
  { p: 0.92, pos: new THREE.Vector3(0, 0.95, 0.2), look: new THREE.Vector3(0, 1.2, -18) },

  // FINALE (6.9–7.5 s): settle into the final composition through the gate
  { p: 1.0, pos: new THREE.Vector3(0, 0.9, -0.2), look: new THREE.Vector3(0, 1.2, -18) },
];

// Per-frame scratch (hoisted — never allocated inside useFrame)
const scratchPos = new THREE.Vector3();
const scratchLook = new THREE.Vector3();

// ── Camera Rig ──────────────────────────────────────────────────────────
function CinematicCameraRig({ cinematicState }: { cinematicState: CinematicState }) {
  const impactRumbleRef = useRef(0);
  const breathRef = useRef(0);

  useFrame((state, delta) => {
    const { progress, isEntering, isInteracting, interactionTarget, reducedMotion } =
      cinematicState;
    const cp = Math.max(0, Math.min(1, progress));

    // ── Find trajectory segment ──────────────────────────────────────
    let seg0 = CAMERA_TRAJECTORY[0];
    let seg1 = CAMERA_TRAJECTORY[CAMERA_TRAJECTORY.length - 1];

    for (let i = 0; i < CAMERA_TRAJECTORY.length - 1; i++) {
      if (cp >= CAMERA_TRAJECTORY[i].p && cp <= CAMERA_TRAJECTORY[i + 1].p) {
        seg0 = CAMERA_TRAJECTORY[i];
        seg1 = CAMERA_TRAJECTORY[i + 1];
        break;
      }
    }

    const span = seg1.p - seg0.p;
    const t = span > 0 ? (cp - seg0.p) / span : 0;
    const s = t * t * (3 - 2 * t); // smooth-step

    const targetPos = scratchPos.lerpVectors(seg0.pos, seg1.pos, s);
    const targetLook = scratchLook.lerpVectors(seg0.look, seg1.look, s);

    // ── Interaction camera adjustments ────────────────────────────────
    if (isInteracting && interactionTarget) {
      switch (interactionTarget) {
        case 'claim':
          // Pull slightly closer for claim inspection
          targetPos.set(0.2, 1.0, 4.0);
          targetLook.set(0, 0.35, -3.5);
          break;
        case 'supporting':
          // Corroborant struts dock left of the claim
          targetPos.set(-0.35, 1.05, 4.15);
          targetLook.set(-1.0, 0.55, -3.4);
          break;
        case 'contradictory':
          // Dissent shard holds apart to the upper right
          targetPos.set(0.7, 1.35, 4.15);
          targetLook.set(1.4, 1.1, -3.3);
          break;
        case 'incomplete':
          // Veiled record floats above-left, unresolved
          targetPos.set(-0.35, 1.7, 4.2);
          targetLook.set(-1.05, 1.65, -3.4);
          break;
      }
    }

    // ── Subtle camera breathing (skipped under reduced motion) ────────
    breathRef.current += delta;
    const breathX = reducedMotion ? 0 : Math.sin(breathRef.current * 0.3) * 0.03;
    const breathY = reducedMotion ? 0 : Math.cos(breathRef.current * 0.22) * 0.02;

    // ── Pointer parallax (skipped under reduced motion) ──────────────
    const isMobile = state.size.width < 768;
    const pxFactor = reducedMotion ? 0 : isMobile ? 0.06 : 0.18;
    const pyFactor = reducedMotion ? 0 : isMobile ? 0.03 : 0.08;
    const mx = state.pointer.x * pxFactor;
    const my = state.pointer.y * pyFactor;

    // ── Opposition impact rumble ─────────────────────────────────────
    // Contact window: 4.24–4.61 s on the master timeline (progress 0.53–0.615)
    let sx = 0,
      sy = 0;
    const isClash = !reducedMotion && cp >= 0.53 && cp <= 0.615;
    if (isClash) {
      impactRumbleRef.current = THREE.MathUtils.damp(impactRumbleRef.current, 0.04, 10, delta);
      sx = Math.sin(state.clock.elapsedTime * 55) * 0.5 * impactRumbleRef.current;
      sy = Math.cos(state.clock.elapsedTime * 40) * 0.5 * impactRumbleRef.current;
    } else {
      impactRumbleRef.current = THREE.MathUtils.damp(impactRumbleRef.current, 0, 4, delta);
    }

    // ── Entering court transition ────────────────────────────────────
    if (isEntering) {
      targetPos.z -= 6;
      targetPos.y += 0.2;
    }

    // ── Mobile pull-back ─────────────────────────────────────────────
    if (isMobile) {
      targetPos.z += 3;
      targetPos.y += 0.5;
    }

    // ── Damping speed ────────────────────────────────────────────────
    // The 0.7 s arrival and later CTA window need tighter tracking than the
    // old 12 s opening; higher damping gain keeps the camera glued to the
    // trajectory while still smoothing micro-jitter.
    const speed = isInteracting ? 2.4 : 3.2;

    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      targetPos.x + mx + sx + breathX,
      speed,
      delta
    );
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      targetPos.y + my + sy + breathY,
      speed,
      delta
    );
    state.camera.position.z = THREE.MathUtils.damp(
      state.camera.position.z,
      targetPos.z,
      speed,
      delta
    );

    state.camera.lookAt(targetLook.x, targetLook.y, targetLook.z);
  });

  return null;
}

// ── Progress-responsive lighting ────────────────────────────────────────
function SceneLighting({ progress, act }: { progress: number; act: NarrativeAct }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const copperRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    // Windows remapped to the 7.5 s master timeline (see CinematicEngine).
    // Arrival ends at 0.0933; awakening ramp by 0.24; clarity dip in the
    // gate act (0.76–0.92); brighten for the finale.
    const tAmbient =
      progress < 0.0466
        ? 0.04
        : progress < 0.24
          ? 0.04 + (progress - 0.0466) * 1.56
          : progress < 0.76
            ? 0.35
            : progress < 0.92
              ? 0.28
              : 0.42;

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.damp(
        ambientRef.current.intensity,
        tAmbient,
        2,
        delta
      );
    }

    const tSpot =
      progress < 0.0466
        ? 0.15
        : progress < 0.24
          ? 0.15 + (progress - 0.0466) * 18.2
          : progress < 0.76
            ? 4.0
            : progress < 0.92
              ? 5.0
              : 2.6;

    if (spotRef.current) {
      spotRef.current.intensity = THREE.MathUtils.damp(spotRef.current.intensity, tSpot, 2, delta);
    }

    // Copper rim: intensifies while the cross-exam window is open
    const tCopper =
      act === NarrativeAct.OPPOSITION ||
      act === NarrativeAct.WEIGHING ||
      act === NarrativeAct.REVELATION
        ? 3.0
        : progress < 0.24
          ? 1.0
          : progress < 0.76
            ? 2.5
            : 1.5;

    if (copperRef.current) {
      copperRef.current.intensity = THREE.MathUtils.damp(
        copperRef.current.intensity,
        tCopper,
        2,
        delta
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.04} color={canonicalColors.weatheredStone} />
      <spotLight
        ref={spotRef}
        position={[0, 13, -3]}
        target-position={[0, 0, -3.5]}
        angle={0.55}
        penumbra={0.75}
        intensity={0.15}
        color={canonicalColors.warmBone}
        castShadow
        shadow-bias={-0.0001}
      />
      <pointLight
        ref={copperRef}
        position={[-6.5, 4.5, 1.0]}
        intensity={1.0}
        color={canonicalColors.oxidizedCopper}
        distance={18}
      />
      <pointLight
        position={[6.5, 4.5, 1.0]}
        intensity={1.4}
        color={canonicalColors.warmBone}
        distance={18}
      />
    </>
  );
}

// ── Adaptive fog ────────────────────────────────────────────────────────
function AdaptiveFog({ progress }: { progress: number }) {
  const fogRef = useRef<THREE.FogExp2>(null);

  useFrame((_, delta) => {
    if (!fogRef.current) return;
    // Fog lifts through the opening descent, thins again as the gate opens
    const target =
      progress < 0.08
        ? 0.07
        : progress < 0.24
          ? 0.07 - (progress - 0.08) * 0.25
          : progress < 0.9
            ? 0.035
            : 0.02;
    fogRef.current.density = THREE.MathUtils.damp(fogRef.current.density, target, 2, delta);
  });

  return <fogExp2 ref={fogRef} attach="fog" args={[canonicalColors.basaltVoid, 0.07]} />;
}

// ── Main Canvas ─────────────────────────────────────────────────────────
export const TribunalCanvas: React.FC<TribunalCanvasProps> = ({
  cinematicState,
  onClaimClick,
  onClaimHover,
  onClaimInspectEnd,
  onEvidenceClick,
  onEvidenceInspectEnd,
  onDecision,
}) => {
  return (
    <div
      className="pointer-events-auto absolute inset-0 z-0 h-full w-full overflow-hidden select-none"
      aria-label="3D Interactive Experience of Holy Trial"
    >
      <Canvas
        camera={{ position: [2.7, 7.3, 18.4], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        // Warm-up: compile all materials/programs before the first visible
        // frame so the opening intent is not compromised by shader stutter
        // (Technique: Trionn case study, Codrops 2026-07).
        onCreated={({ gl, scene, camera }) => {
          gl.compile(scene, camera);
        }}
      >
        <color attach="background" args={[canonicalColors.basaltVoid]} />
        <AdaptiveFog progress={cinematicState.progress} />
        <SceneLighting progress={cinematicState.progress} act={cinematicState.act} />

        {/* World */}
        <TribunalArchitecture
          progress={cinematicState.progress}
          isEntering={cinematicState.isEntering}
          gateOpen={cinematicState.gateOpen}
          reducedMotion={cinematicState.reducedMotion}
        />
        <ClaimRelic
          progress={cinematicState.progress}
          isEntering={cinematicState.isEntering}
          claimInspected={cinematicState.claimInspected}
          claimHovered={cinematicState.claimHovered}
          act={cinematicState.act}
          reducedMotion={cinematicState.reducedMotion}
          onHoverChange={onClaimHover}
          onClick={onClaimClick}
          onInspectEnd={onClaimInspectEnd}
        />
        <EvidenceCluster
          progress={cinematicState.progress}
          act={cinematicState.act}
          evidenceState={cinematicState.evidence}
          activeInspect={cinematicState.activeEvidenceInspect}
          crossExamChoice={cinematicState.crossExamChoice}
          decisionWindowActive={cinematicState.decisionWindowActive}
          reducedMotion={cinematicState.reducedMotion}
          onEvidenceClick={onEvidenceClick}
          onEvidenceInspectEnd={onEvidenceInspectEnd}
          onDecision={onDecision}
        />
        <OppositionMonolith
          progress={cinematicState.progress}
          crossExamChoice={cinematicState.crossExamChoice}
          reducedMotion={cinematicState.reducedMotion}
        />

        {/* Camera */}
        <CinematicCameraRig cinematicState={cinematicState} />
      </Canvas>
    </div>
  );
};
