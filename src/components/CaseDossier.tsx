import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CourtSeal } from './CourtSeal';
import type { CaseCategory, CaseDocket, DraftCase, ExampleClaim } from '../types/case';
import {
  generateCaseId,
  generateDraftId,
  saveCaseToStorage,
  saveDocketToStorage,
} from '../utils/caseStorage';
import { createCaseApi } from '../services/api';
import { obsidianAudio } from './AudioSynthesizer';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  RotateCcw,
  Layers,
  Loader2,
} from 'lucide-react';

interface CaseDossierProps {
  onBackToThreshold: () => void;
  onCaseCreated?: (docket: CaseDocket) => void;
  initialDocket?: CaseDocket | null;
}

const CATEGORIES: CaseCategory[] = [
  'Technology & AI',
  'Science & Energy',
  'Products & Business',
  'History & Governance',
  'Predictions & Opinions',
  'Other / Unspecified',
];

const EXAMPLE_CLAIMS: ExampleClaim[] = [
  {
    id: 'ex-1',
    tag: 'AI & Engineering',
    category: 'Technology & AI',
    text: 'AI systems will displace more than half of entry-level software engineering roles by 2030.',
  },
  {
    id: 'ex-2',
    tag: 'Higher Education',
    category: 'Predictions & Opinions',
    text: 'Traditional 4-year university degrees deliver negative net financial ROI compared to technical apprenticeships in 2026.',
  },
  {
    id: 'ex-3',
    tag: 'Clean Energy',
    category: 'Science & Energy',
    text: 'Advanced nuclear fission is technologically indispensable for achieving zero-carbon electrical grids by 2040.',
  },
];

type DossierStage = 'edit' | 'review' | 'registered';

export const CaseDossier: React.FC<CaseDossierProps> = ({
  onBackToThreshold,
  onCaseCreated,
  initialDocket,
}) => {
  const [draftId] = useState<string>(() => generateDraftId());
  const [stage, setStage] = useState<DossierStage>('edit');
  const [claimText, setClaimText] = useState<string>(() => initialDocket?.proposition || '');
  const [selectedCategory, setSelectedCategory] = useState<CaseCategory>(
    () => initialDocket?.category || 'Technology & AI'
  );
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);
  const [registeredCase, setRegisteredCase] = useState<DraftCase | null>(null);
  const [createdDocket, setCreatedDocket] = useState<CaseDocket | null>(
    () => initialDocket || null
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Validation rules
  const trimmed = claimText.trim();
  const isTooShort = trimmed.length > 0 && trimmed.length < 15;
  const isQuestion = trimmed.endsWith('?');
  const isValid = trimmed.length >= 15;

  const handleSelectExample = (example: ExampleClaim) => {
    setClaimText(example.text);
    setSelectedCategory(example.category);
    setActiveExampleId(example.id);
  };

  const handleClaimChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setClaimText(e.target.value);
    if (activeExampleId) {
      setActiveExampleId(null);
    }
  };

  const handleProceedToReview = () => {
    if (!isValid) return;
    setStage('review');
  };

  const handleOpenCase = async () => {
    // Re-entrancy guard: a double click must not register two cases.
    if (stage !== 'review' || registeredCase || isSubmitting) return;

    setIsSubmitting(true);
    obsidianAudio.playGavelChime();

    try {
      let docket: CaseDocket;
      try {
        docket = await createCaseApi({
          proposition: trimmed,
          category: selectedCategory,
        });
      } catch {
        // Graceful offline fallback
        const fallbackId = generateCaseId();
        docket = {
          id: fallbackId,
          proposition: trimmed,
          category: selectedCategory,
          status: 'awaiting_evidence',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          evidence_count: 0,
          analysis_count: 0,
        };
      }

      saveDocketToStorage(docket);
      const newCase: DraftCase = {
        caseId: docket.id,
        originalClaim: trimmed,
        confirmedClaim: trimmed,
        category: selectedCategory,
        createdAt: docket.created_at,
        status: 'Awaiting evidence',
      };

      if (!saveCaseToStorage(newCase)) {
        setStorageError(
          'This browser refused to store the case (storage unavailable or full). Allow site data or free space, then try again.'
        );
        return;
      }

      setStorageError(null);
      setCreatedDocket(docket);
      setRegisteredCase(newCase);
      setStage('registered');
    } catch {
      setStorageError(
        'This browser refused to store the case (storage unavailable or full). Allow site data or free space, then try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrepareAnotherDraft = () => {
    setClaimText('');
    setActiveExampleId(null);
    setSelectedCategory('Technology & AI');
    setRegisteredCase(null);
    setCreatedDocket(null);
    setStage('edit');
  };

  return (
    <div className="relative z-20 flex min-h-screen w-full flex-col justify-between overflow-x-hidden p-4 text-[#E5DED0] sm:p-6 md:p-10">
      {/* Dossier Institutional Header */}
      <header className="flex w-full items-center justify-between border-b border-[#C6A16B]/20 pb-4 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToThreshold}
            className="group flex items-center gap-1.5 border border-[#C6A16B]/30 bg-[#111315] px-3 py-1.5 font-mono text-xs text-[#9C9B96] transition-colors hover:bg-[#292E30] hover:text-[#E5DED0] focus:ring-1 focus:ring-[#C6A16B] focus:outline-none"
            title="Return to The Threshold"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#C6A16B] transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">THRESHOLD</span>
          </button>
          <div className="hidden h-4 w-px bg-[#C6A16B]/20 sm:block" />
          <CourtSeal size={28} pulsing={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-semibold tracking-wider text-[#E5DED0] md:text-base">
                CASE DOSSIER
              </span>
              <span className="border border-[#C6A16B]/40 bg-[#181B1D] px-2 py-0.5 font-mono text-[10px] tracking-widest text-[#C6A16B] uppercase">
                {stage === 'registered' && registeredCase ? registeredCase.caseId : draftId}
              </span>
            </div>
            <span className="block font-mono text-[9px] tracking-wider text-[#9C9B96]">
              STAGE: I. THE DOSSIER // JURISDICTION: UNRESTRICTED
            </span>
          </div>
        </div>

        {/* Stage Badge */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-[#9C9B96]">STATUS:</span>
          {stage === 'edit' && (
            <span className="border border-[#C6A16B]/30 bg-[#292E30] px-2.5 py-0.5 text-[#C6A16B]">
              INTAKE
            </span>
          )}
          {stage === 'review' && (
            <span className="border border-[#C6A16B]/40 bg-[#181B1D] px-2.5 py-0.5 text-[#C6A16B]">
              REVIEW
            </span>
          )}
          {stage === 'registered' && (
            <span className="animate-pulse border border-[#C6A16B]/50 bg-[#181B1D] px-2.5 py-0.5 text-[#C6A16B]">
              REGISTERED
            </span>
          )}
        </div>
      </header>

      {/* Main Dossier Workspace */}
      <main className="mx-auto my-6 flex w-full max-w-3xl flex-1 flex-col justify-center">
        <AnimatePresence>
          {/* STAGE 1: CLAIM ENTRY & SPECIFICATION */}
          {stage === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div>
                <div className="mb-2 inline-flex items-center gap-2 font-mono text-xs tracking-widest text-[#C6A16B] uppercase">
                  <FileText className="h-3.5 w-3.5" />
                  Proposition Formulation
                </div>
                <h1 className="font-serif text-3xl font-normal tracking-tight text-[#E5DED0] sm:text-4xl md:text-5xl">
                  What claim shall be examined?
                </h1>
                <p className="mt-2 font-sans text-xs leading-relaxed text-[#9C9B96] sm:text-sm">
                  Lay your proposition before the court. Formulate an empirical assertion, forecast,
                  or contested thesis to be weighed against verified evidence and adversarial
                  debate.
                </p>
              </div>

              {/* Proposition Textarea Card */}
              <div className="relative border border-[#C6A16B]/30 bg-[#111315]/90 p-4 shadow-xl backdrop-blur-md md:p-6">
                {/* Brass Corner Accents */}
                <div className="absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-[#C6A16B]" />
                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-[#C6A16B]" />
                <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-[#C6A16B]" />
                <div className="absolute -right-1 -bottom-1 h-2.5 w-2.5 border-r-2 border-b-2 border-[#C6A16B]" />

                <label htmlFor="claim-input" className="sr-only">
                  Claim proposition to be examined
                </label>
                <textarea
                  id="claim-input"
                  rows={4}
                  value={claimText}
                  onChange={handleClaimChange}
                  maxLength={400}
                  placeholder="Enter a testable proposition (e.g., 'Autonomous electric vehicles will account for over 30% of global fleet miles by 2035.')"
                  className="w-full resize-none bg-transparent font-sans text-sm text-[#E5DED0] placeholder-[#9C9B96]/50 focus:outline-none sm:text-base"
                />

                {/* Textarea Bottom Toolbar */}
                <div className="mt-3 flex items-center justify-between border-t border-[#292E30] pt-3 font-mono text-xs">
                  {/* Validation Indicators */}
                  <div>
                    {trimmed.length === 0 && (
                      <span className="flex items-center gap-1.5 text-[#9C9B96]">
                        <AlertCircle className="h-3.5 w-3.5 text-[#9C9B96]" />
                        Awaiting proposition input
                      </span>
                    )}
                    {isTooShort && (
                      <span className="flex items-center gap-1.5 text-[#C08289]">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Proposition too brief (min 15 characters)
                      </span>
                    )}
                    {isQuestion && (
                      <span className="flex items-center gap-1.5 text-[#C6A16B]">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Judicial Tip: Phrase as a declarative assertion rather than a question
                      </span>
                    )}
                    {isValid && !isQuestion && (
                      <span className="flex items-center gap-1.5 text-[#C6A16B]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Valid proposition format
                      </span>
                    )}
                  </div>

                  <span className="text-[#9C9B96]">{trimmed.length} / 400</span>
                </div>
              </div>

              {/* Demonstration Example Claims */}
              <div>
                <span className="mb-2 block font-mono text-[11px] tracking-wider text-[#C6A16B] uppercase">
                  Or load demonstration precedent:
                </span>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {EXAMPLE_CLAIMS.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleSelectExample(ex)}
                      aria-pressed={activeExampleId === ex.id}
                      className={`group flex flex-col justify-between border p-3 text-left transition-all ${
                        activeExampleId === ex.id
                          ? 'border-[#C6A16B] bg-[#292E30]'
                          : 'border-[#292E30] bg-[#111315]/70 hover:border-[#C6A16B]/50 hover:bg-[#181B1D]'
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-[#C6A16B]">
                        <span className="uppercase">{ex.tag}</span>
                        <Sparkles className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="line-clamp-2 font-sans text-xs leading-relaxed text-[#9C9B96] group-hover:text-[#E5DED0]">
                        &ldquo;{ex.text}&rdquo;
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Case Scope / Category Selection */}
              <div>
                <span className="mb-2 block font-mono text-[11px] tracking-wider text-[#C6A16B] uppercase">
                  Jurisdictional Category (Optional Metadata):
                </span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      aria-pressed={selectedCategory === cat}
                      className={`border px-3 py-1.5 font-mono text-xs transition-all ${
                        selectedCategory === cat
                          ? 'border-[#C6A16B] bg-[#C6A16B]/20 text-[#E5DED0]'
                          : 'border-[#292E30] bg-[#111315] text-[#9C9B96] hover:border-[#C6A16B]/40 hover:text-[#E5DED0]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action: Proceed to Review */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleProceedToReview}
                  disabled={!isValid}
                  className={`inline-flex items-center gap-2 border-2 px-8 py-3 font-mono text-sm font-semibold tracking-wider transition-all ${
                    isValid
                      ? 'cursor-pointer border-[#C6A16B] bg-[#181B1D] text-[#E5DED0] shadow-[0_0_20px_rgba(198,161,107,0.2)] hover:border-[#DFCA9B] hover:bg-[#292E30] hover:shadow-[0_0_30px_rgba(198,161,107,0.4)]'
                      : 'cursor-not-allowed border-[#292E30] bg-[#12131A] text-[#9C9B96]/40'
                  }`}
                >
                  <span>PROCEED TO REVIEW</span>
                  <ArrowRight className="h-4 w-4 text-[#C6A16B]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: REVIEW BEFORE OPENING */}
          {stage === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div>
                <div className="mb-2 inline-flex items-center gap-2 font-mono text-xs tracking-widest text-[#C6A16B] uppercase">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#C6A16B]" />
                  Confirmation of Scope
                </div>
                <h1 className="font-serif text-3xl font-normal tracking-tight text-[#E5DED0] sm:text-4xl md:text-5xl">
                  Review Case Dossier
                </h1>
                <p className="mt-2 font-sans text-xs leading-relaxed text-[#9C9B96] sm:text-sm">
                  Confirm the precise proposition to be inscribed in the court registers. Once
                  opened, the claim will face adversarial examination.
                </p>
              </div>

              {/* Formal Case Folio Card */}
              <div className="relative border border-[#C6A16B]/40 bg-[#111315] p-6 shadow-2xl backdrop-blur-md md:p-8">
                {/* Brass Corner Accents */}
                <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-[#C6A16B]" />
                <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-[#C6A16B]" />
                <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-[#C6A16B]" />
                <div className="absolute -right-1 -bottom-1 h-3 w-3 border-r-2 border-b-2 border-[#C6A16B]" />

                <div className="mb-6 flex items-center justify-between border-b border-[#C6A16B]/20 pb-4">
                  <div className="flex items-center gap-2 font-mono text-xs text-[#9C9B96]">
                    <span>PROVISIONAL DOCKET:</span>
                    <span className="font-semibold text-[#C6A16B]">{draftId}</span>
                  </div>
                  <div className="flex items-center gap-1.5 border border-[#C6A16B]/30 bg-[#292E30] px-2.5 py-1 font-mono text-xs text-[#C6A16B]">
                    <Layers className="h-3.5 w-3.5 text-[#C6A16B]" />
                    {selectedCategory}
                  </div>
                </div>

                {/* Confirmed Proposition Quote */}
                <div className="my-6 border-l-2 border-[#C6A16B] py-2 pl-5">
                  <span className="mb-1 block font-mono text-[10px] tracking-widest text-[#C6A16B] uppercase">
                    PROPOSITION UNDER SCRUTINY
                  </span>
                  <blockquote className="font-serif text-xl leading-relaxed text-[#E5DED0] sm:text-2xl">
                    &ldquo;{trimmed}&rdquo;
                  </blockquote>
                </div>

                {/* Protocol Disclosure */}
                <div className="space-y-2 border-t border-[#292E30] pt-4 font-mono text-xs text-[#9C9B96]">
                  <div className="flex items-center gap-2 text-[#E5DED0]/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C6A16B]" />
                    <span>
                      Hype Court will summon real-world evidence sources via Tavily Search.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#E5DED0]/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C08289]" />
                    <span>
                      Prosecution will challenge the claim; Defense will seek corroboration via
                      NVIDIA NIM.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#E5DED0]/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C6A16B]" />
                    <span>Every conclusion can be challenged and reopened via a Retrial.</span>
                  </div>
                </div>
              </div>

              {/* Actions: Edit or Open Case */}
              <div className="flex flex-col-reverse items-center justify-between gap-4 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStage('edit')}
                  className="inline-flex w-full items-center justify-center gap-2 border border-[#C6A16B]/30 bg-[#111315] px-6 py-3 font-mono text-xs tracking-wider text-[#9C9B96] transition-colors hover:border-[#C6A16B] hover:text-[#E5DED0] sm:w-auto"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  EDIT WORDING
                </button>

                <button
                  type="button"
                  onClick={handleOpenCase}
                  disabled={isSubmitting}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-3 border-2 border-[#C6A16B] bg-[#181B1D] px-8 py-3.5 font-mono text-sm font-semibold tracking-widest text-[#E5DED0] shadow-[0_0_25px_rgba(198,161,107,0.25)] transition-all hover:bg-[#292E30] hover:shadow-[0_0_35px_rgba(198,161,107,0.5)] disabled:opacity-50 sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#C6A16B]" />
                      <span>INSCRIBING DOCKET...</span>
                    </>
                  ) : (
                    <>
                      <span>OPEN THE CASE</span>
                      <ArrowRight className="h-4 w-4 text-[#C6A16B]" />
                    </>
                  )}
                </button>
              </div>
              {storageError && (
                <p
                  role="alert"
                  className="mt-3 border border-[#782F37]/60 bg-[#782F37]/10 px-3 py-2 font-sans text-xs leading-relaxed text-[#E5DED0]"
                >
                  {storageError}
                </p>
              )}
            </motion.div>
          )}

          {/* STAGE 3: CASE REGISTRATION STATE */}
          {stage === 'registered' && registeredCase && (
            <motion.div
              key="registered"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 text-center"
            >
              <div className="flex justify-center">
                <CourtSeal size={68} pulsing={true} />
              </div>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 border border-[#C6A16B]/40 bg-[#181B1D] px-3 py-1 font-mono text-xs tracking-widest text-[#C6A16B] uppercase">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  CASE INSCRIBED IN COURT REGISTERS
                </div>
                <h1 className="font-serif text-3xl font-normal tracking-tight text-[#E5DED0] sm:text-4xl md:text-5xl">
                  Case Docket Registered
                </h1>
                <p className="mt-2 font-mono text-sm text-[#C6A16B]">
                  IDENTIFIER: {registeredCase.caseId}
                </p>
              </div>

              {/* Registered Docket Card */}
              <div className="relative mx-auto max-w-xl border border-[#C6A16B]/30 bg-[#111315]/95 p-6 text-left shadow-2xl backdrop-blur-md">
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[#292E30] pb-2">
                    <span className="text-[#9C9B96]">DOCKET ID:</span>
                    <span className="font-semibold text-[#C6A16B]">{registeredCase.caseId}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#292E30] pb-2">
                    <span className="text-[#9C9B96]">STATUS:</span>
                    <span className="text-[#C6A16B]">{registeredCase.status}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#292E30] pb-2">
                    <span className="text-[#9C9B96]">CATEGORY:</span>
                    <span className="text-[#E5DED0]">{registeredCase.category}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#292E30] pb-2">
                    <span className="text-[#9C9B96]">TIMESTAMP:</span>
                    <span className="text-[#9C9B96]">{registeredCase.createdAt}</span>
                  </div>
                  <div className="pt-2">
                    <span className="mb-1 block text-[#9C9B96]">PROPOSITION:</span>
                    <div className="border-l-2 border-[#C6A16B] bg-[#0C0D11]/60 p-3 font-serif text-sm text-[#E5DED0] italic">
                      &ldquo;{registeredCase.confirmedClaim}&rdquo;
                    </div>
                  </div>
                </div>

                {/* Milestone Notice */}
                <div className="mt-5 border border-[#C6A16B]/20 bg-[#0C0D11]/40 p-3.5 font-sans text-xs leading-relaxed text-[#9C9B96]">
                  <span className="mb-1 block font-mono font-semibold text-[#C6A16B]">
                    NEXT JUDICIAL ACT &bull; THE SUMMONING
                  </span>
                  Evidence collection has not yet begun. In the upcoming phase, Tavily Search will
                  scour web sources to populate the evidence ledger, followed by adversarial debate
                  via NVIDIA NIM.
                </div>
              </div>

              {/* Actions: Proceed to Evidence Ledger, Return to Threshold, or Prepare Another Draft */}
              <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                {onCaseCreated && createdDocket && (
                  <button
                    type="button"
                    onClick={() => onCaseCreated(createdDocket)}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-[#C6A16B] bg-[#181B1D] px-8 py-3 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] shadow-[0_0_20px_rgba(198,161,107,0.25)] transition-all hover:bg-[#292E30] hover:shadow-[0_0_30px_rgba(198,161,107,0.45)] sm:w-auto"
                  >
                    <span>ASSEMBLE EVIDENCE IN LEDGER</span>
                    <ArrowRight className="h-4 w-4 text-[#C6A16B]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onBackToThreshold}
                  className="inline-flex w-full items-center justify-center gap-2 border border-[#C6A16B]/40 bg-[#111315] px-7 py-3 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] transition-colors hover:bg-[#292E30] sm:w-auto"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-[#C6A16B]" />
                  RETURN TO THRESHOLD
                </button>

                <button
                  type="button"
                  onClick={handlePrepareAnotherDraft}
                  className="inline-flex w-full items-center justify-center gap-2 border border-[#C6A16B]/30 bg-[#111315] px-7 py-3 font-mono text-xs tracking-wider text-[#9C9B96] transition-colors hover:border-[#C6A16B] hover:text-[#E5DED0] sm:w-auto"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  PREPARE ANOTHER DRAFT
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Telemetry */}
      <footer className="w-full border-t border-[#C6A16B]/15 pt-3 text-center font-mono text-[10px] text-[#9C9B96]">
        THE OBSIDIAN TRIBUNAL &bull; ACT II: THE CASE DOSSIER &bull; LOCAL STATE PERSISTENCE
      </footer>
    </div>
  );
};
