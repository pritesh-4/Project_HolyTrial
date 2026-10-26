import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, FolderOpen, Wifi, WifiOff } from 'lucide-react';
import { CourtSeal } from './CourtSeal';
import type { CaseDocket, ProductStage } from '../types/case';

interface TribunalHeaderProps {
  activeDocket: CaseDocket | null;
  activeStage: ProductStage;
  onSelectStage: (stage: ProductStage) => void;
  onBackToThreshold: () => void;
  onOpenCaseSwitcher: () => void;
  evidenceCount: number;
  findingsCount: number;
  isBackendConnected: boolean;
}

export const TribunalHeader: React.FC<TribunalHeaderProps> = ({
  activeDocket,
  activeStage,
  onSelectStage,
  onBackToThreshold,
  onOpenCaseSwitcher,
  evidenceCount,
  findingsCount,
  isBackendConnected,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyDocketId = () => {
    if (!activeDocket) return;
    navigator.clipboard.writeText(activeDocket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stages: { id: ProductStage; label: string; badge?: string | number }[] = [
    { id: 'dossier', label: '1. Docket' },
    { id: 'evidence', label: '2. Evidence', badge: evidenceCount > 0 ? evidenceCount : undefined },
    {
      id: 'scrutiny',
      label: '3. Scrutiny',
      badge: findingsCount > 0 ? findingsCount : undefined,
    },
    {
      id: 'verdict',
      label: '4. Verdict',
      badge: activeDocket?.latest_verdict ? 'Verdict' : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#C6A16B]/20 bg-[#111315]/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Left: Threshold button & Docket identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToThreshold}
            className="group inline-flex items-center gap-1.5 border border-[#C6A16B]/30 bg-[#181B1D] px-2.5 py-1.5 font-mono text-[11px] text-[#9C9B96] transition-colors hover:border-[#C6A16B] hover:bg-[#292E30] hover:text-[#E5DED0] focus-visible:ring-1 focus-visible:ring-[#C6A16B] focus-visible:outline-none"
            title="Return to The Threshold"
          >
            <ArrowLeft className="h-3 w-3 text-[#C6A16B] transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">THRESHOLD</span>
          </button>

          <div className="hidden h-4 w-px bg-[#C6A16B]/20 sm:block" />

          <CourtSeal size={26} pulsing={false} />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-medium tracking-wider text-[#E5DED0]">
                THE OBSIDIAN TRIBUNAL
              </span>

              {activeDocket ? (
                <div className="inline-flex items-center gap-1 border border-[#C6A16B]/40 bg-[#181B1D] px-2 py-0.5 font-mono text-[10px] tracking-wider text-[#C6A16B]">
                  <span>{activeDocket.id}</span>
                  <button
                    type="button"
                    onClick={handleCopyDocketId}
                    className="cursor-pointer text-[#9C9B96] transition-colors hover:text-[#E5DED0]"
                    title="Copy docket identifier"
                    aria-label="Copy docket ID"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="border border-[#555859]/30 bg-[#181B1D] px-2 py-0.5 font-mono text-[10px] text-[#9C9B96]">
                  UNREGISTERED DOCKET
                </span>
              )}
            </div>
            <span className="hidden font-mono text-[9px] tracking-wider text-[#9C9B96] sm:block">
              {activeDocket ? activeDocket.category : 'JUDICIAL INVESTIGATION ENVIRONMENT'}
            </span>
          </div>
        </div>

        {/* Center / Right: Stage Navigator & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav aria-label="Trial Stages" className="flex items-center gap-1 bg-[#0C0D11]/70 p-1">
            {stages.map((st) => {
              const isActive = activeStage === st.id;
              // Disable later stages if no docket has been filed yet
              const isDisabled = !activeDocket && st.id !== 'dossier';

              return (
                <button
                  key={st.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelectStage(st.id)}
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-xs transition-all ${
                    isActive
                      ? 'border-[#C6A16B] bg-[#181B1D] font-semibold text-[#E5DED0] shadow-[0_0_12px_rgba(198,161,107,0.2)]'
                      : isDisabled
                        ? 'cursor-not-allowed border-transparent text-[#555859]/40'
                        : 'border-transparent text-[#9C9B96] hover:border-[#C6A16B]/30 hover:bg-[#181B1D]/60 hover:text-[#E5DED0]'
                  }`}
                >
                  <span>{st.label}</span>
                  {st.badge !== undefined && (
                    <span
                      className={`py-0.2 rounded-full px-1.5 text-[9px] ${
                        isActive
                          ? 'bg-[#C6A16B] font-bold text-[#111315]'
                          : 'bg-[#292E30] text-[#E5DED0]'
                      }`}
                    >
                      {st.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Recent cases drawer button */}
          <button
            type="button"
            onClick={onOpenCaseSwitcher}
            className="inline-flex items-center gap-1.5 border border-[#C6A16B]/30 bg-[#181B1D] px-2.5 py-1.5 font-mono text-[11px] text-[#9C9B96] transition-colors hover:border-[#C6A16B] hover:text-[#E5DED0]"
            title="Open recent court registers"
            aria-label="Recent cases"
          >
            <FolderOpen className="h-3.5 w-3.5 text-[#C6A16B]" />
            <span className="hidden md:inline">REGISTERS</span>
          </button>

          {/* Backend Connection Indicator */}
          <div
            className="flex items-center gap-1.5 border border-[#292E30] bg-[#0C0D11] px-2 py-1 font-mono text-[10px]"
            title={
              isBackendConnected
                ? 'Connected to live FastAPI reasoning engine on port 8000'
                : 'Offline / local fallback storage active'
            }
          >
            {isBackendConnected ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <Wifi className="h-3 w-3 text-emerald-400" />
                <span className="hidden text-emerald-400 lg:inline">ENGINE LIVE</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <WifiOff className="h-3 w-3 text-amber-500" />
                <span className="hidden text-amber-500 lg:inline">OFFLINE MODE</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
