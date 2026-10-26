import React from 'react';
import { Check, FolderOpen, Plus, X } from 'lucide-react';
import type { CaseDocket } from '../types/case';

interface CaseSwitcherDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recentCases: CaseDocket[];
  activeCaseId?: string;
  onSelectCase: (docket: CaseDocket) => void;
  onNewCase: () => void;
}

export const CaseSwitcherDrawer: React.FC<CaseSwitcherDrawerProps> = ({
  isOpen,
  onClose,
  recentCases,
  activeCaseId,
  onSelectCase,
  onNewCase,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/70 backdrop-blur-xs">
      <div className="relative flex h-full w-full max-w-md flex-col justify-between border-l border-[#C6A16B]/30 bg-[#111315] p-6 text-[#E5DED0] shadow-2xl">
        <div>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-[#292E30] pb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[#C6A16B]" />
              <h3 className="font-serif text-lg font-normal tracking-wide text-[#E5DED0]">
                Court Registers
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#9C9B96] hover:text-[#E5DED0]"
              aria-label="Close registers"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* New Case Button */}
          <button
            type="button"
            onClick={() => {
              onNewCase();
              onClose();
            }}
            className="mb-6 flex w-full items-center justify-center gap-2 border border-[#C6A16B]/60 bg-[#181B1D] py-3 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] transition-colors hover:bg-[#292E30]"
          >
            <Plus className="h-3.5 w-3.5 text-[#C6A16B]" />
            <span>INSCRIBE NEW PROPOSITION</span>
          </button>

          {/* Recent Dockets List */}
          <div className="space-y-3">
            <span className="block font-mono text-[10px] tracking-widest text-[#C6A16B] uppercase">
              RECENTLY INSCRIBED DOCKETS
            </span>

            {recentCases.length === 0 ? (
              <p className="py-6 text-center font-mono text-xs text-[#9C9B96]">
                No previous cases found in this browser register.
              </p>
            ) : (
              <div className="max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
                {recentCases.map((c) => {
                  const isCurrent = c.id === activeCaseId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCase(c);
                        onClose();
                      }}
                      className={`w-full cursor-pointer border p-3 text-left transition-colors ${
                        isCurrent
                          ? 'border-[#C6A16B] bg-[#181B1D]'
                          : 'border-[#292E30] bg-[#0C0D11]/70 hover:border-[#C6A16B]/40 hover:bg-[#181B1D]/60'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between font-mono text-[10px]">
                        <span className="font-semibold text-[#C6A16B]">{c.id}</span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Check className="h-3 w-3" />
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 font-serif text-xs leading-relaxed text-[#E5DED0]">
                        &ldquo;{c.proposition}&rdquo;
                      </p>
                      <div className="mt-2 flex items-center justify-between font-mono text-[9px] text-[#9C9B96]">
                        <span>{c.category}</span>
                        <span>{c.status.toUpperCase()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#292E30] pt-4 text-center font-mono text-[10px] text-[#9C9B96]">
          THE OBSIDIAN TRIBUNAL &bull; JUDICIAL ARCHIVE
        </div>
      </div>
    </div>
  );
};
