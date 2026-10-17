import React, { useState } from 'react';
import { CourtSeal } from './CourtSeal';
import { ChamberScene } from './ChamberScene';
import { WebGlFallback } from './WebGlFallback';
import { CharterDrawer } from './CharterDrawer';
import { CaseDossier } from './CaseDossier';
import { obsidianAudio } from './AudioSynthesizer';
import { Volume2, VolumeX, Eye, Layers, Compass, ArrowRight } from 'lucide-react';
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
  const [isEntering, setIsEntering] = useState(false);
  const [isCharterOpen, setIsCharterOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);

  // Lazy initialization avoids setState within effects
  const [webGlSupported] = useState<boolean>(() => checkWebGlSupport());
  const [use2DMode, setUse2DMode] = useState<boolean>(() => !checkWebGlSupport());

  const handleEnterCourt = () => {
    // Play resonant gavel chime
    obsidianAudio.playGavelChime();

    // Trigger visual camera glide forward toward dais
    setIsEntering(true);

    // After camera glide completes, transition to Case Dossier
    setTimeout(() => {
      setCurrentView('dossier');
    }, 650);
  };

  const handleReturnToThreshold = () => {
    setCurrentView('threshold');
    // Smoothly restore camera position back to the wide threshold
    setTimeout(() => {
      setIsEntering(false);
    }, 150);
  };

  const handleToggleAudio = () => {
    const active = obsidianAudio.toggleMute();
    setIsAudioActive(active);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#0C0D11] text-[#E8E0D2] select-none">
      {/* 3D or 2D Atmospheric Chamber Layer */}
      {!use2DMode && webGlSupported ? (
        <ChamberScene isEntering={isEntering || currentView === 'dossier'} />
      ) : (
        <WebGlFallback isEntering={isEntering || currentView === 'dossier'} />
      )}

      {/* Atmospheric dark gradient overlays to ensure absolute text contrast */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0C0D11] via-[#0C0D11]/35 to-[#0C0D11]/75" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 flex w-full items-center justify-between border-b border-[#B9975B]/15 px-6 py-4 backdrop-blur-xs md:px-12">
        {/* Brand & Seal */}
        <div className="flex items-center gap-3">
          <CourtSeal size={34} pulsing={currentView === 'threshold' && !isEntering} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-semibold tracking-wider text-[#E8E0D2] md:text-lg">
                HYPE COURT
              </span>
              <span className="hidden border border-[#B9975B]/30 bg-[#22242B] px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-[#B9975B] uppercase sm:inline-block">
                TRIBUNAL
              </span>
            </div>
            <span className="block font-mono text-[10px] tracking-wider text-[#8990A5]">
              ADVERSARIAL REASONING PROTOCOL
            </span>
          </div>
        </div>

        {/* System Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* 2D / 3D Toggle */}
          {webGlSupported && (
            <button
              type="button"
              onClick={() => setUse2DMode(!use2DMode)}
              className="flex items-center gap-1.5 border border-[#B9975B]/30 bg-[#161822]/80 px-2.5 py-1.5 font-mono text-xs text-[#8990A5] transition-colors hover:bg-[#22242B] hover:text-[#E8E0D2] focus:outline-none"
              title="Toggle 2D / 3D Mode"
              aria-label="Toggle 2D or 3D Environment"
            >
              {use2DMode ? (
                <Layers className="h-3.5 w-3.5 text-[#B9975B]" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-[#5FBAA7]" />
              )}
              <span className="hidden sm:inline">{use2DMode ? '2D MODE' : '3D WORLD'}</span>
            </button>
          )}

          {/* Audio Synthesizer Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className="flex items-center gap-1.5 border border-[#B9975B]/30 bg-[#161822]/80 px-2.5 py-1.5 font-mono text-xs text-[#8990A5] transition-colors hover:bg-[#22242B] hover:text-[#E8E0D2] focus:outline-none"
            title="Toggle Ambient Chamber Audio"
            aria-label="Toggle Sound"
          >
            {isAudioActive ? (
              <>
                <Volume2 className="h-3.5 w-3.5 animate-pulse text-[#B9975B]" />
                <span className="hidden text-[#B9975B] sm:inline">SOUND: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-[#8990A5]" />
                <span className="hidden sm:inline">SOUND: OFF</span>
              </>
            )}
          </button>

          {/* Chamber Status Indicator */}
          <div className="hidden items-center gap-1.5 border border-[#B9975B]/20 bg-[#161822]/90 px-3 py-1 font-mono text-[11px] text-[#8990A5] lg:flex">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#5FBAA7]" />
            <span className="text-[#E8E0D2]">
              {currentView === 'threshold' ? 'GATE: OPEN' : 'SESSION: DOSSIER'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Dynamic View: Threshold or Case Dossier */}
      <AnimatePresence>
        {currentView === 'threshold' ? (
          <motion.div
            key="threshold-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-1 flex-col justify-between"
          >
            {/* Main Hero & Narrative Threshold */}
            <main className="relative z-20 mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 py-12 text-center md:py-16">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                {/* Sacred Motto */}
                <div className="mb-5 inline-flex items-center gap-2.5 border border-[#B9975B]/35 bg-[#161822]/70 px-3.5 py-1 backdrop-blur-xs">
                  <span className="h-1.5 w-1.5 bg-[#B9975B]" />
                  <span className="font-mono text-xs tracking-[0.28em] text-[#B9975B] uppercase md:text-sm">
                    EVERY CLAIM HAS A CASE.
                  </span>
                  <span className="h-1.5 w-1.5 bg-[#B9975B]" />
                </div>

                {/* Monumental Headline */}
                <h1 className="max-w-4xl font-serif text-4xl leading-[1.08] font-normal tracking-tight text-balance text-[#E8E0D2] sm:text-6xl md:text-7xl lg:text-8xl">
                  The Obsidian Tribunal
                </h1>

                {/* Concise Institutional Statement */}
                <p className="mt-6 mb-10 max-w-2xl font-sans text-sm leading-relaxed text-balance text-[#8990A5] sm:text-base md:text-lg">
                  An adversarial court of inquiry. Enter an institution where claims face empirical
                  research, arguments clash under structured scrutiny, and every judgment can be
                  challenged through retrial.
                </p>

                {/* Primary Action Controls */}
                <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
                  {/* The Primary Entrance Control */}
                  <button
                    type="button"
                    onClick={handleEnterCourt}
                    disabled={isEntering}
                    className="group relative w-full cursor-pointer border-2 border-[#B9975B] bg-[#181B26] px-8 py-3.5 font-mono text-sm font-semibold tracking-widest text-[#E8E0D2] shadow-[0_0_20px_rgba(185,151,91,0.2)] transition-all duration-300 hover:bg-[#202330] hover:shadow-[0_0_35px_rgba(185,151,91,0.45)] focus:ring-2 focus:ring-[#B9975B] focus:ring-offset-2 focus:ring-offset-[#0C0D11] focus:outline-none sm:w-auto md:text-base"
                  >
                    {/* Corner Chamfer Accents */}
                    <div className="absolute -top-1 -left-1 h-2.5 w-2.5 bg-[#B9975B]" />
                    <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-[#B9975B]" />
                    <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 bg-[#B9975B]" />
                    <div className="absolute -right-1 -bottom-1 h-2.5 w-2.5 bg-[#B9975B]" />

                    <span className="flex items-center justify-center gap-3">
                      <span>ENTER THE COURT</span>
                      <ArrowRight className="h-4 w-4 text-[#B9975B] transition-transform group-hover:translate-x-1.5" />
                    </span>
                  </button>

                  {/* Secondary Action: Examine the Charter */}
                  <button
                    type="button"
                    onClick={() => setIsCharterOpen(true)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 border border-[#B9975B]/30 bg-transparent px-6 py-3.5 font-mono text-xs tracking-wider text-[#8990A5] transition-colors hover:border-[#B9975B]/70 hover:bg-[#161822]/80 hover:text-[#E8E0D2] focus:outline-none sm:w-auto md:text-sm"
                  >
                    <Compass className="h-4 w-4 text-[#B9975B]" />
                    EXAMINE CHARTER
                  </button>
                </div>
              </motion.div>
            </main>

            {/* Subterranean Environment Footer */}
            <footer className="relative z-20 flex w-full flex-col items-center justify-between gap-2 border-t border-[#B9975B]/15 px-6 py-4 font-mono text-[11px] text-[#8990A5] backdrop-blur-xs md:flex-row md:px-12">
              <div className="flex items-center gap-3">
                <span className="text-[#B9975B]">PROVIDENCE:</span>
                <span>TAVILY EVIDENCE LEDGER &bull; NVIDIA NIM REASONING</span>
              </div>
              <div className="flex items-center gap-4">
                <span>THE OBSIDIAN TRIBUNAL</span>
                <span className="text-[#B9975B]">&bull;</span>
                <span>ACT I: THE THRESHOLD</span>
              </div>
            </footer>
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

      {/* Slide-over Court Charter Drawer */}
      <CharterDrawer isOpen={isCharterOpen} onClose={() => setIsCharterOpen(false)} />
    </div>
  );
};
