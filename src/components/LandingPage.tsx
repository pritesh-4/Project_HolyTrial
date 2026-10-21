import React, { useState, useEffect, useCallback } from 'react';
import { TribunalCanvas } from './Tribunal3D/TribunalCanvas';
import { WebGlFallback } from './WebGlFallback';
import { CharterDrawer } from './CharterDrawer';
import { CaseDossier } from './CaseDossier';
import { useCinematic } from './useCinematic';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function checkWebGlSupport(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export const LandingPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'threshold' | 'dossier'>('threshold');
  const [isCharterOpen, setIsCharterOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [webGlAvailable] = useState(() => checkWebGlSupport());

  // ── Cinematic Engine ────────────────────────────────────────────────
  const {
    state: cinematicState,
    engine,
    inspectClaim,
    finishClaimInspect,
    hoverClaim,
    inspectEvidence,
    finishEvidenceInspect,
    releaseDecisionHold,
    makeDecision,
    enterCourt,
    toggleAudio,
  } = useCinematic();

  // ── Keyboard Accessibility ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Tab / Enter / Space for interaction with focused elements is
      // handled natively. Cinematic shortcuts:
      //  c — inspect the claim
      //  1/q — corroborant (or, while the cross-exam window is open, choose it)
      //  2/w — dissent shard (same decision-window promotion)
      //  3/e — veiled record
      //  Escape — release whichever interaction hold is active
      const s = engine.getState();
      const decisionReady = s.decisionWindowActive && s.crossExamChoice === null;

      if (e.key === 'c') {
        inspectClaim();
      } else if (e.key === '1' || e.key === 'q') {
        if (decisionReady) makeDecision('align_support');
        else inspectEvidence('supporting');
      } else if (e.key === '2' || e.key === 'w') {
        if (decisionReady) makeDecision('expose_contradiction');
        else inspectEvidence('contradictory');
      } else if (e.key === '3' || e.key === 'e') {
        inspectEvidence('incomplete');
      } else if (e.key === 'Escape') {
        finishClaimInspect();
        finishEvidenceInspect();
        releaseDecisionHold();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    engine,
    inspectClaim,
    inspectEvidence,
    makeDecision,
    finishClaimInspect,
    finishEvidenceInspect,
    releaseDecisionHold,
  ]);

  // ── Enter Court Transition ──────────────────────────────────────────
  const handleEnterCourt = useCallback(() => {
    enterCourt();
    setTimeout(() => setCurrentView('dossier'), 700);
  }, [enterCourt]);

  const handleReturnToThreshold = useCallback(() => {
    setCurrentView('threshold');
  }, []);

  const handleToggleAudio = useCallback(() => {
    const active = toggleAudio();
    setIsAudioActive(active);
  }, [toggleAudio]);

  // ── Derived Visual State ────────────────────────────────────────────
  const titleOpacity = cinematicState.titleOpacity;
  const showGateCTA = cinematicState.ctaVisible;
  // CTA ramps across the finale (progress 0.92–1.0 ≈ 6.9–7.5 s):
  // begins ≈7.05 s, fully visible by ≈7.5 s.
  const gateCTAOpacity = showGateCTA
    ? Math.min(1, Math.max(0.25, (cinematicState.progress - 0.94) / 0.06 + 0.25))
    : 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#090909] text-[#E8E0D1] select-none">
      {/* ── 3D World (primary) or WebGL-failure fallback ── */}
      {webGlAvailable ? (
        <TribunalCanvas
          cinematicState={cinematicState}
          onClaimClick={inspectClaim}
          onClaimHover={hoverClaim}
          onClaimInspectEnd={finishClaimInspect}
          onEvidenceClick={inspectEvidence}
          onEvidenceInspectEnd={finishEvidenceInspect}
          onDecision={makeDecision}
        />
      ) : (
        <WebGlFallback
          progress={cinematicState.progress}
          isEntering={cinematicState.isEntering || currentView === 'dossier'}
        />
      )}

      {/* Atmospheric vignettes */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#090909] via-transparent to-[#090909]/50" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-radial from-transparent via-[#090909]/15 to-[#090909]/60" />

      {/* ── Sound Toggle — floating, top-right ── */}
      <button
        type="button"
        onClick={handleToggleAudio}
        className="fixed top-5 right-5 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-[#B76548]/20 bg-[#090909]/40 backdrop-blur-sm transition-all duration-300 hover:border-[#B76548]/50 hover:bg-[#151413]/70 focus:outline-none"
        title={isAudioActive ? 'Mute Sound' : 'Enable Sound'}
        aria-label={isAudioActive ? 'Mute Sound' : 'Enable Sound'}
      >
        {isAudioActive ? (
          <Volume2 className="h-3.5 w-3.5 text-[#B76548]" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-[#9C948A]/50" />
        )}
      </button>

      {/* ── Main View ── */}
      <AnimatePresence>
        {currentView === 'threshold' ? (
          <motion.div
            key="threshold-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-1 flex-col overflow-hidden"
          >
            {/* ── HOLY TRIAL — emerges from the world, then recedes ── */}
            {titleOpacity > 0.01 && (
              <div
                className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
                style={{ opacity: titleOpacity }}
              >
                <h1
                  className="font-serif text-5xl leading-none font-normal tracking-[0.15em] text-[#E8E0D1] sm:text-7xl md:text-8xl lg:text-[7rem]"
                  style={{
                    textShadow: '0 0 80px rgba(9,9,9,0.9), 0 0 160px rgba(9,9,9,0.7)',
                    transform: `scale(${0.96 + titleOpacity * 0.04})`,
                  }}
                >
                  HOLY TRIAL
                </h1>
              </div>
            )}

            {/* ── Final Gate CTA — only when story completes ── */}
            <AnimatePresence>
              {showGateCTA && !cinematicState.isEntering && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: gateCTAOpacity, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="pointer-events-auto fixed bottom-14 left-1/2 z-40 -translate-x-1/2 sm:bottom-20"
                >
                  <div className="flex flex-col items-center gap-5">
                    {/* Closing title signature */}
                    <span className="font-serif text-lg tracking-[0.2em] text-[#E8E0D1]/30 sm:text-xl">
                      HOLY TRIAL
                    </span>

                    <button
                      type="button"
                      onClick={handleEnterCourt}
                      disabled={cinematicState.isEntering}
                      className="group relative cursor-pointer border border-[#B76548]/50 bg-[#090909]/60 px-10 py-4 font-mono text-sm font-medium tracking-[0.25em] text-[#E8E0D1] backdrop-blur-sm transition-all duration-500 hover:border-[#B76548] hover:bg-[#151413]/80 hover:shadow-[0_0_50px_rgba(183,101,72,0.35)] focus:ring-1 focus:ring-[#B76548]/40 focus:outline-none"
                    >
                      <div className="absolute -top-px -left-px h-2 w-2 border-t border-l border-[#B76548]/60" />
                      <div className="absolute -top-px -right-px h-2 w-2 border-t border-r border-[#B76548]/60" />
                      <div className="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-[#B76548]/60" />
                      <div className="absolute -right-px -bottom-px h-2 w-2 border-r border-b border-[#B76548]/60" />
                      ENTER THE COURT
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCharterOpen(true)}
                      className="font-mono text-[9px] tracking-[0.25em] text-[#9C948A]/30 uppercase transition-colors hover:text-[#9C948A]/60 focus:outline-none"
                    >
                      examine the charter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Minimal act indicators — right edge, no labels */}
            <nav
              aria-label="Story Progress"
              className="pointer-events-none fixed top-1/2 right-4 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex"
            >
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                // Map act enum to index for indicator
                const actIndex = getActIndex(cinematicState.act);
                return (
                  <div
                    key={idx}
                    className={`transition-all duration-700 ${
                      actIndex === idx
                        ? 'h-4 w-0.5 bg-[#B76548]'
                        : actIndex > idx
                          ? 'h-1 w-1 rounded-full bg-[#B76548]/35'
                          : 'h-1 w-1 rounded-full bg-[#9C948A]/15'
                    }`}
                  />
                );
              })}
            </nav>
          </motion.div>
        ) : (
          <motion.div
            key="dossier-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45 }}
            className="flex flex-1 flex-col justify-between"
          >
            <CaseDossier onBackToThreshold={handleReturnToThreshold} />
          </motion.div>
        )}
      </AnimatePresence>

      <CharterDrawer isOpen={isCharterOpen} onClose={() => setIsCharterOpen(false)} />
    </div>
  );
};

// ── Helper: Map NarrativeAct to progress indicator index ────────────────
// 6 beats: Opening · Awakening · Evidence · Opposition · Weighing · Revelation→Final
function getActIndex(act: string): number {
  switch (act) {
    case 'INITIALIZING':
    case 'OPENING':
      return 0;
    case 'AWAKENING':
    case 'CLAIM':
      return 1;
    case 'EVIDENCE':
    case 'INSPECTING_EVIDENCE':
      return 2;
    case 'OPPOSITION':
    case 'CROSS_EXAMINATION':
    case 'DECISION_WINDOW':
      return 3;
    case 'WEIGHING':
      return 4;
    case 'REVELATION':
    case 'FINALE':
    case 'COMPLETED':
      return 5;
    default:
      return 0;
  }
}
