import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CourtSeal } from './CourtSeal';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface EntranceNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EntranceNoticeModal: React.FC<EntranceNoticeModalProps> = ({ isOpen, onClose }) => {
  // Support Esc key to dismiss
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-[#0C0D11]/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Stone Tablet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-full max-w-xl rounded-none border border-[#B9975B]/30 bg-[#161822]/95 p-6 text-[#E8E0D2] shadow-[0_20px_50px_rgba(0,0,0,0.85)] md:p-8"
          >
            {/* Corner Decorative Brass Accents */}
            <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-[#B9975B]" />
            <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-[#B9975B]" />
            <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-[#B9975B]" />
            <div className="absolute -right-1 -bottom-1 h-3 w-3 border-r-2 border-b-2 border-[#B9975B]" />

            {/* Emblem & Top Status */}
            <div className="mb-6 flex items-center justify-between border-b border-[#B9975B]/20 pb-4">
              <div className="flex items-center gap-3">
                <CourtSeal size={32} pulsing={false} />
                <div>
                  <span className="block font-mono text-[10px] tracking-[0.25em] text-[#B9975B] uppercase">
                    Procedural Notice
                  </span>
                  <span className="font-mono text-xs text-[#8990A5]">
                    CHAMBER GATE // PROTOCOL 0.1
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 border border-[#B9975B]/20 bg-[#22242B] px-2.5 py-1 font-mono text-[11px] text-[#B9975B]">
                <ShieldAlert className="h-3.5 w-3.5 text-[#B85C6C]" />
                RECESS
              </div>
            </div>

            {/* Notice Body */}
            <div className="space-y-4">
              <h2
                id="modal-headline"
                className="font-serif text-2xl leading-tight tracking-wide text-[#E8E0D2] md:text-3xl"
              >
                The Tribunal is in Recess
              </h2>

              <p className="font-sans text-sm leading-relaxed text-[#8990A5] md:text-base">
                You have approached the sacred dais of{' '}
                <span className="font-medium text-[#E8E0D2]">The Obsidian Tribunal</span>. The
                courtroom registers are currently preparing for session.
              </p>

              <div className="border-l-2 border-[#B9975B] bg-[#0C0D11]/60 py-2 pl-4 font-sans text-xs leading-relaxed text-[#E8E0D2]/90 italic md:text-sm">
                &ldquo;When proceedings commence, you will submit propositions before this chamber.
                The court will summon real-world evidence, marshal adversarial arguments, and allow
                every conclusion to be challenged.&rdquo;
              </div>

              <div className="space-y-1 border border-[#22242B] bg-[#0C0D11]/40 p-3 font-mono text-xs text-[#8990A5]">
                <div>
                  <span className="text-[#B9975B]">INTEGRATIONS:</span> Tavily Search &bull; NVIDIA
                  NIM Inference
                </div>
                <div>
                  <span className="text-[#B9975B]">NEXT STAGE:</span> Case Dossier Intake &amp;
                  Evidence Ledger
                </div>
              </div>
            </div>

            {/* Action Control: Return to Threshold */}
            <div className="mt-8 flex justify-end border-t border-[#B9975B]/20 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="group relative inline-flex items-center gap-2 border border-[#B9975B]/50 bg-[#22242B] px-6 py-2.5 font-mono text-xs tracking-wider text-[#E8E0D2] transition-colors hover:border-[#B9975B] focus:ring-1 focus:ring-[#B9975B] focus:outline-none md:text-sm"
              >
                <ArrowLeft className="h-4 w-4 text-[#B9975B] transition-transform group-hover:-translate-x-1" />
                RETURN TO THRESHOLD
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
