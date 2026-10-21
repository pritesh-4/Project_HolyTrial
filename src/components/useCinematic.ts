/**
 * useCinematic — React hook bridging CinematicEngine with components
 *
 * The engine updates at 60fps via rAF internally.
 * React state is updated at a throttled rate (~15fps) for UI elements.
 * The 3D components receive the engine's live state object directly
 * for high-frequency reads inside useFrame.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCinematicEngine,
  destroyCinematicEngine,
  type CinematicState,
  type EvidenceId,
  NarrativeAct,
} from './CinematicEngine';
import { obsidianAudio } from './AudioSynthesizer';

// Throttled state snapshot interval (ms)
const REACT_UPDATE_INTERVAL = 66; // ~15fps for React UI

// ── Main Hook ───────────────────────────────────────────────────────────
export function useCinematic() {
  const [engine] = useState(() => getCinematicEngine());

  const [reactState, setReactState] = useState<CinematicState>(() => engine.getState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastReactUpdateRef = useRef<number>(0);
  const audioProcessedRef = useRef<Set<string>>(new Set());
  const prevActRef = useRef<NarrativeAct>(NarrativeAct.INITIALIZING);

  // ── Main animation loop ─────────────────────────────────────────────
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Update engine (high-frequency, no React involved)
      engine.update(delta);

      // Process audio events immediately (they're cleared each frame)
      const currentState = engine.getState();
      if (currentState.pendingAudioEvents.length > 0) {
        for (const event of currentState.pendingAudioEvents) {
          const key = `${event}-${currentState.act}`;
          if (audioProcessedRef.current.has(key)) continue;
          audioProcessedRef.current.add(key);
          playAudioEvent(event);
        }
      }

      // Throttled React state update for UI elements
      const shouldForceUpdate =
        currentState.act !== prevActRef.current ||
        currentState.ctaVisible !== reactState.ctaVisible ||
        currentState.isEntering !== reactState.isEntering;

      if (shouldForceUpdate || timestamp - lastReactUpdateRef.current >= REACT_UPDATE_INTERVAL) {
        lastReactUpdateRef.current = timestamp;
        prevActRef.current = currentState.act;
        setReactState(currentState);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    engine.start();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // ── Visibility handling ─────────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        engine.pause();
        lastTimeRef.current = 0;
      } else {
        lastTimeRef.current = 0;
        engine.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [engine]);

  // ── Cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      destroyCinematicEngine();
    };
  }, []);

  // ── Interaction Handlers ────────────────────────────────────────────
  const inspectClaim = useCallback(() => {
    engine.inspectClaim();
    setReactState(engine.getState());
  }, [engine]);

  const finishClaimInspect = useCallback(() => {
    engine.finishClaimInspect();
    setReactState(engine.getState());
  }, [engine]);

  const hoverClaim = useCallback(
    (hovered: boolean) => {
      engine.hoverClaim(hovered);
    },
    [engine]
  );

  const inspectEvidence = useCallback(
    (id: EvidenceId) => {
      engine.inspectEvidence(id);
      setReactState(engine.getState());
    },
    [engine]
  );

  const finishEvidenceInspect = useCallback(() => {
    engine.finishEvidenceInspect();
    setReactState(engine.getState());
  }, [engine]);

  const makeDecision = useCallback(
    (choice: 'align_support' | 'expose_contradiction') => {
      engine.makeDecision(choice);
      setReactState(engine.getState());
    },
    [engine]
  );

  const enterCourt = useCallback(() => {
    engine.enterCourt();
    setReactState(engine.getState());
  }, [engine]);

  const toggleAudio = useCallback(() => {
    return obsidianAudio.toggleMute();
  }, []);

  return {
    state: reactState,
    engine,

    // Interaction handlers
    inspectClaim,
    finishClaimInspect,
    hoverClaim,
    inspectEvidence,
    finishEvidenceInspect,
    makeDecision,
    enterCourt,
    toggleAudio,

    // Derived helpers
    isInteractionAct: (
      [
        NarrativeAct.CLAIM,
        NarrativeAct.EVIDENCE,
        NarrativeAct.INSPECTING_EVIDENCE,
        NarrativeAct.CROSS_EXAMINATION,
        NarrativeAct.DECISION_WINDOW,
      ] as readonly NarrativeAct[]
    ).includes(reactState.act),
  };
}

// ── Audio Dispatcher ──────────────────────────────────────────────────
function playAudioEvent(event: string): void {
  switch (event) {
    case 'revealTexture':
      obsidianAudio.playRevealTexture();
      break;
    case 'claimEstablished':
      obsidianAudio.playClaimEstablished();
      break;
    case 'evidenceDock':
      obsidianAudio.playEvidenceDock();
      break;
    case 'oppositionImpact':
      obsidianAudio.playOppositionImpact();
      break;
    case 'resolutionResonance':
      obsidianAudio.playResolutionResonance();
      break;
    case 'gateSwell':
      obsidianAudio.playGateSwell();
      break;
    case 'gavelChime':
      obsidianAudio.playGavelChime();
      break;
    case 'artifactInspect':
      obsidianAudio.playArtifactInspect();
      break;
    case 'mechanismShift':
      obsidianAudio.playMechanismShift();
      break;
  }
}
