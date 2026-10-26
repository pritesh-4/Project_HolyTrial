import React, { useState, useEffect, useCallback } from 'react';
import { RoomWasNeverEmptyScene } from './RoomWasNeverEmptyScene';
import { CharterDrawer } from './CharterDrawer';
import { CaseDossier } from './CaseDossier';
import { useCinematic } from './useCinematic';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LandingPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'threshold' | 'dossier'>('threshold');
  const [isCharterOpen, setIsCharterOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);

  // ── Cinematic Engine ────────────────────────────────────────────────
  const {
    state: cinematicState,
    inspectObject,
    setMonitorScrub,
    enterCourt,
    toggleAudio,
  } = useCinematic();

  // ── Keyboard Accessibility ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Desk shortcuts belong to the threshold view only — they must never
      // open inspection panels on top of the Case Dossier view.
      if (currentView !== 'threshold') return;
      // 1: Case File · 2: CCTV Monitor · 3: Access Record · C: Compare · Escape: Close
      if (e.key === 'c' || e.key === 'C') {
        inspectObject('compare');
      } else if (e.key === '1') {
        inspectObject('case_file');
      } else if (e.key === '2') {
        inspectObject('monitor');
      } else if (e.key === '3') {
        inspectObject('access_record');
      } else if (e.key === 'Escape') {
        inspectObject('none');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentView, inspectObject]);

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
  const showGateCTA = cinematicState.ctaVisible;
  const gateCTAOpacity = showGateCTA
    ? Math.min(1, Math.max(0.25, (cinematicState.progress - 0.94) / 0.06 + 0.25))
    : 0;
  // While an evidence panel is open the hero hides completely so it never
  // overlaps or competes with physical documents or inspection overlays.
  const isInspecting = cinematicState.activeInspect !== 'none';
  const heroOpacity = isInspecting ? 0 : gateCTAOpacity;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#111315] text-[#E5DED0] select-none">
      {/* ── Main Cinematic Scene: The Room Was Never Empty ── */}
      <RoomWasNeverEmptyScene
        cinematicState={cinematicState}
        onInspectObject={inspectObject}
        onMonitorScrub={setMonitorScrub}
        onEnterCourt={handleEnterCourt}
      />

      {/* Atmospheric dark vignettes */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#111315] via-transparent to-[#111315]/60" />

      {/* ── Sound Toggle — floating, top-right (starts muted, accessible) ── */}
      <button
        type="button"
        onClick={handleToggleAudio}
        className="fixed top-5 right-5 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-[#C6A16B]/30 bg-[#111315]/60 backdrop-blur-sm transition-all duration-300 hover:border-[#C6A16B] hover:bg-[#181B1D]/80 focus-visible:border-[#C6A16B] focus-visible:ring-1 focus-visible:ring-[#C6A16B]/60 focus-visible:outline-none"
        title={isAudioActive ? 'Mute Sound' : 'Enable Sound'}
        aria-label={isAudioActive ? 'Mute Sound' : 'Enable Sound'}
      >
        {isAudioActive ? (
          <Volume2 className="h-3.5 w-3.5 text-[#C6A16B]" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-[#555859]" />
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
            {/* ── Final Gate CTA — appears at FINALE after narrative reveal ── */}
            <AnimatePresence>
              {showGateCTA && !cinematicState.isEntering && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: heroOpacity, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`fixed top-[34%] left-1/2 z-40 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 px-4 text-center sm:top-[36%] ${
                    isInspecting ? 'pointer-events-none' : 'pointer-events-auto'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3 sm:gap-4">
                    {/* Closing title signature & thesis line */}
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <h1 className="font-serif text-3xl tracking-[0.25em] text-[#E5DED0] drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] sm:text-4xl md:text-5xl">
                        HOLY TRIAL
                      </h1>
                      <p className="font-serif text-xs tracking-[0.2em] text-[#E5DED0]/70 italic sm:text-sm">
                        Every claim has a case.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleEnterCourt}
                      disabled={cinematicState.isEntering || isInspecting}
                      className="group relative cursor-pointer border border-[#C6A16B]/60 bg-[#111315]/90 px-8 py-3 font-sans text-xs font-semibold tracking-[0.25em] text-[#E5DED0] backdrop-blur-md transition-all duration-500 hover:border-[#C6A16B] hover:bg-[#181B1D] hover:shadow-[0_0_40px_rgba(198,161,107,0.35)] focus-visible:ring-1 focus-visible:ring-[#C6A16B]/60 focus-visible:outline-none sm:px-12 sm:py-3.5 sm:text-sm"
                    >
                      <div className="absolute -top-px -left-px h-2 w-2 border-t border-l border-[#C6A16B]" />
                      <div className="absolute -top-px -right-px h-2 w-2 border-t border-r border-[#C6A16B]" />
                      <div className="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-[#C6A16B]" />
                      <div className="absolute -right-px -bottom-px h-2 w-2 border-r border-b border-[#C6A16B]" />
                      ENTER THE COURT
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCharterOpen(true)}
                      className="font-sans text-[11px] tracking-[0.2em] text-[#555859] lowercase transition-colors hover:text-[#E5DED0]/80 focus-visible:text-[#E5DED0] focus-visible:underline focus-visible:underline-offset-4 focus-visible:outline-none sm:text-xs"
                    >
                      examine the charter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accessible progress navigation (visual chapter dots removed per design direction) */}
            <nav aria-label="Story Progress" className="sr-only" aria-live="polite">
              <span>Act {getActIndex(cinematicState.act) + 1} of 6</span>
            </nav>
          </motion.div>
        ) : (
          <motion.div
            key="dossier-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45 }}
            className="fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto bg-[#111315]/95 backdrop-blur-md"
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
// 6 beats: Rain Arrival · Case File · Monitor · Contradiction · Overview · Tribunal
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
