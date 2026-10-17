import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Scale, Search, ShieldCheck } from 'lucide-react';

interface CharterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharterDrawer: React.FC<CharterDrawerProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0C0D11]/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="flex w-screen max-w-md flex-col justify-between overflow-y-auto border-l border-[#B9975B]/30 bg-[#12141C] p-6 text-[#E8E0D2] shadow-2xl md:p-8"
            >
              <div>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b border-[#B9975B]/20 pb-4">
                  <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-[#B9975B] uppercase">
                    <BookOpen className="h-4 w-4" />
                    The Court Charter
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-[#8990A5] hover:text-[#E8E0D2] focus:outline-none"
                    aria-label="Close Charter"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-1 font-serif text-2xl text-[#E8E0D2]">
                      The Doctrine of Scrutiny
                    </h3>
                    <p className="font-sans text-xs leading-relaxed text-[#8990A5]">
                      Hype Court exists to dissolve ambiguity and subject claims to adversarial
                      evidence.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-[#22242B] bg-[#181B26] p-3.5">
                      <div className="mb-1 flex items-center gap-2 font-mono text-xs text-[#B9975B]">
                        <Search className="h-3.5 w-3.5" />
                        I. The Evidence Ledger
                      </div>
                      <p className="font-sans text-xs leading-relaxed text-[#8990A5]">
                        No argument may stand without grounding. Every factual assertion must cite
                        an immutable source ID retrieved from the living web.
                      </p>
                    </div>

                    <div className="border border-[#22242B] bg-[#181B26] p-3.5">
                      <div className="mb-1 flex items-center gap-2 font-mono text-xs text-[#B85C6C]">
                        <Scale className="h-3.5 w-3.5" />
                        II. Adversarial Equilibrium
                      </div>
                      <p className="font-sans text-xs leading-relaxed text-[#8990A5]">
                        Prosecution attacks the proposition with maximum skepticism. Defense
                        marshals corroborating proofs. The Judge synthesizes truth without bias.
                      </p>
                    </div>

                    <div className="border border-[#22242B] bg-[#181B26] p-3.5">
                      <div className="mb-1 flex items-center gap-2 font-mono text-xs text-[#5FBAA7]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        III. The Right of Retrial
                      </div>
                      <p className="font-sans text-xs leading-relaxed text-[#8990A5]">
                        Judgments are not final proclamations. When flawed inferences or missing
                        sources are objected to, the tribunal re-examines the record and computes a
                        Verdict Delta.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#22242B] pt-4">
                    <h4 className="mb-2 font-mono text-[11px] tracking-wider text-[#B9975B] uppercase">
                      The Seven Acts of Court
                    </h4>
                    <ol className="list-inside list-decimal space-y-1.5 font-mono text-xs text-[#8990A5]">
                      <li>The Threshold (Chamber Gate)</li>
                      <li>The Case Dossier (Claim Refinement)</li>
                      <li>The Summoning (Web Evidence via Tavily)</li>
                      <li>The Trial (Adversarial Clash via NIM)</li>
                      <li>The Judgment (Reasoned Finding)</li>
                      <li>The Retrial (Objection &amp; Delta)</li>
                      <li>The Archive (Persistent History)</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-8 border-t border-[#22242B] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full border border-[#B9975B]/30 bg-[#22242B] py-2 font-mono text-xs tracking-wider text-[#E8E0D2] transition-colors hover:bg-[#2A2D37]"
                >
                  DISMISS CHARTER
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
