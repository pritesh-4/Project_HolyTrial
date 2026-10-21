import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TribunalArchitecture } from './TribunalArchitecture';
import { ClaimRelic } from './ClaimRelic';
import { EvidenceCluster } from './EvidenceCluster';
import { OppositionMonolith } from './OppositionMonolith';
import { canonicalColors } from './SceneMaterials';
import type { CinematicState, EvidenceId } from '../CinematicEngine';
import { NarrativeAct } from '../CinematicEngine';

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

// Act windows: OPENING 0–0.107 · AWAKENING 0.107–0.24 · EVIDENCE 0.24–0.427 ·
// OPPOSITION 0.427–0.613 · WEIGHING 0.613–0.773 · REVELATION 0.773–0.92 · FINALE 0.92–1
const CAMERA_TRAJECTORY: TrajectoryKey[] = [
  // OPENING (0–0.8 s): The Void — high above, quick descent into darkness
  { p: 0.0, pos: new THREE.Vector3(0, 8.5, 19), look: new THREE.Vector3(0, -2, -8) },
  { p: 0.05, pos: new THREE.Vector3(0.2, 5.5, 13.5), look: new THREE.Vector3(0, -1, -5) },
  { p: 0.107, pos: new THREE.Vector3(0, 3.2, 9.5), look: new THREE.Vector3(0, -0.3, -4) },

  // AWAKENING (0.8–1.8 s): camera finds the central structure as it rises
  { p: 0.17, pos: new THREE.Vector3(0, 2.0, 7.0), look: new THREE.Vector3(0, 0.2, -3.5) },
  { p: 0.24, pos: new THREE.Vector3(0, 1.5, 5.8), look: new THREE.Vector3(0, 0.3, -3.5) },

  // EVIDENCE (1.8–3.2 s): reframing orbit synced to fragment arrival
  { p: 0.32, pos: new THREE.Vector3(0.7, 1.3, 5.4), look: new THREE.Vector3(0, 0.35, -3.5) },
  { p: 0.42, pos: new THREE.Vector3(-0.5, 1.1, 5.0), look: new THREE.Vector3(0, 0.3, -3.5) },

  // OPPOSITION (3.2–4.6 s): tension, off-center framing into the clash
  { p: 0.5, pos: new THREE.Vector3(-0.8, 0.9, 4.5), look: new THREE.Vector3(0.3, 0.35, -3.5) },
  { p: 0.61, pos: new THREE.Vector3(0.4, 0.9, 4.2), look: new THREE.Vector3(0, 0.3, -3.5) },

  // WEIGHING (4.6–5.8 s): pull back for the full mechanism settling
  { p: 0.7, pos: new THREE.Vector3(0, 1.4, 5.6), look: new THREE.Vector3(0, 0.5, -3.5) },
  { p: 0.77, pos: new THREE.Vector3(0, 1.25, 4.9), look: new THREE.Vector3(0, 0.55, -5) },

  // REVELATION (5.8–6.9 s): advance toward the gate as it releases
  { p: 0.86, pos: new THREE.Vector3(0, 1.1, 2.6), look: new THREE.Vector3(0, 1.0, -12) },
  { p: 0.92, pos: new THREE.Vector3(0, 0.95, 0.2), look: new THREE.Vector3(0, 1.2, -18) },

  // FINALE (6.9–7.5 s): settle into the final composition through the gate
  { p: 1.0, pos: new THREE.Vector3(0, 0.9, -0.2), look: new THREE.Vector3(0, 1.2, -18) },
];

// ── Camera Rig ──────────────────────────────────────────────────────────
function CinematicCameraRig({ cinematicState }: { cinematicState: CinematicState }) {
  const impactRumbleRef = useRef(0);
  const breathRef = useRef(0);

  useFrame((state, delta) => {
    const { progress, isEntering, isInteracting, interactionTarget, act } = cinematicState;
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

    const targetPos = new THREE.Vector3().lerpVectors(seg0.pos, seg1.pos, s);
    const targetLook = new THREE.Vector3().lerpVectors(seg0.look, seg1.look, s);

    // ── Interaction camera adjustments ────────────────────────────────
    if (isInteracting && interactionTarget) {
      switch (interactionTarget) {
        case 'claim':
          // Pull slightly closer for claim inspection
          targetPos.set(0.2, 1.0, 4.0);
          targetLook.set(0, 0.35, -3.5);
          break;
        case 'supporting':
          // Focus on supporting artifact (left side)
          targetPos.set(-0.4, 1.1, 4.2);
          targetLook.set(-1.2, 0.6, -3.3);
          break;
        case 'contradictory':
          // Focus on contradictory artifact (right side)
          targetPos.set(0.6, 1.1, 4.2);
          targetLook.set(1.2, 0.6, -3.3);
          break;
        case 'incomplete':
          // Focus on incomplete artifact (above)
          targetPos.set(0, 1.5, 4.0);
          targetLook.set(0, 1.7, -3.85);
          break;
      }
    }

    // ── Subtle camera breathing ───────────────────────────────────────
    breathRef.current += delta;
    const breathX = Math.sin(breathRef.current * 0.3) * 0.03;
    const breathY = Math.cos(breathRef.current * 0.22) * 0.02;

    // ── Pointer parallax ─────────────────────────────────────────────
    const isMobile = state.size.width < 768;
    const pxFactor = isMobile ? 0.06 : 0.18;
    const pyFactor = isMobile ? 0.03 : 0.08;
    const mx = state.pointer.x * pxFactor;
    const my = state.pointer.y * pyFactor;

    // ── Opposition impact rumble ─────────────────────────────────────
    // Clash window: 4.0–4.6 s on the master timeline (progress 0.53–0.613)
    let sx = 0,
      sy = 0;
    const isClash = act === NarrativeAct.OPPOSITION && cp >= 0.53 && cp <= 0.613;
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
    // The 0.8 s descent and later CTA window need tighter tracking than the
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
    // Descent ends at 0.107; awakening ramp by 0.24; tension dip through
    // opposition/revelation (0.613–0.92); brighten for the finale.
    const tAmbient =
      progress < 0.05
        ? 0.04
        : progress < 0.24
          ? 0.04 + (progress - 0.05) * 1.45
          : progress < 0.77
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
      progress < 0.05
        ? 0.15
        : progress < 0.24
          ? 0.15 + (progress - 0.05) * 17
          : progress < 0.77
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
          : progress < 0.77
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
        camera={{ position: [0, 10, 22], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
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
        />
        <ClaimRelic
          progress={cinematicState.progress}
          isEntering={cinematicState.isEntering}
          claimInspected={cinematicState.claimInspected}
          claimHovered={cinematicState.claimHovered}
          act={cinematicState.act}
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
          onEvidenceClick={onEvidenceClick}
          onEvidenceInspectEnd={onEvidenceInspectEnd}
          onDecision={onDecision}
        />
        <OppositionMonolith
          progress={cinematicState.progress}
          crossExamChoice={cinematicState.crossExamChoice}
        />

        {/* Camera */}
        <CinematicCameraRig cinematicState={cinematicState} />
      </Canvas>
    </div>
  );
};
