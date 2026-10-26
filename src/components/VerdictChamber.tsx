import React from 'react';
import { Download, Flame, HelpCircle, RotateCcw, Scale } from 'lucide-react';
import { CourtSeal } from './CourtSeal';
import type { AnalysisRun, CaseDocket, EvidenceExhibit, VerdictAssessment } from '../types/case';

interface VerdictChamberProps {
  docket: CaseDocket;
  evidenceList: EvidenceExhibit[];
  latestAnalysis: AnalysisRun | null;
  onRequestRetrial: () => void;
  onReturnToDossier: () => void;
}

export const VerdictChamber: React.FC<VerdictChamberProps> = ({
  docket,
  evidenceList,
  latestAnalysis,
  onRequestRetrial,
  onReturnToDossier,
}) => {
  const verdict = latestAnalysis?.verdict;

  // Visual styling mapped to assessment
  const getAssessmentBadge = (assessment?: VerdictAssessment) => {
    switch (assessment) {
      case 'SUBSTANTIATED':
        return {
          label: 'CLAIM SUBSTANTIATED',
          color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/20',
          desc: 'Empirical records provide compelling corroboration for the proposition.',
        };
      case 'REFUTED':
        return {
          label: 'CLAIM REFUTED',
          color: 'text-[#C08289] border-[#C08289]/50 bg-[#782F37]/20',
          desc: 'Adversarial counter-evidence demonstrates severe operational or factual flaws.',
        };
      case 'PLAUSIBLE_WITH_RESERVATIONS':
        return {
          label: 'PLAUSIBLE WITH RESERVATIONS',
          color: 'text-[#C6A16B] border-[#C6A16B]/50 bg-[#181B1D]',
          desc: 'Competing evidence exhibits leave the ultimate claim subject to substantial tension.',
        };
      case 'INCONCLUSIVE':
      default:
        return {
          label: 'INSUFFICIENT EMPIRICAL RECORD',
          color: 'text-[#9C9B96] border-[#555859]/50 bg-[#111315]',
          desc: 'The docket lacks sufficient empirical exhibits to make a definitive determination.',
        };
    }
  };

  const badge = getAssessmentBadge(verdict?.assessment);

  const handleExportSummary = () => {
    if (!verdict) return;
    const text = [
      `=======================================================`,
      `THE OBSIDIAN TRIBUNAL • JUDICIAL RECORD OF ADJUDICATION`,
      `=======================================================`,
      `DOCKET: ${docket.id}`,
      `DATE: ${new Date(verdict.created_at).toISOString()}`,
      `JURISDICTION: ${docket.category}`,
      `\nPROPOSITION UNDER EXAMINATION:`,
      `"${docket.proposition}"`,
      `\nJUDICIAL ASSESSMENT: ${verdict.assessment}`,
      `CONFIDENCE SCORE: ${Math.round(verdict.confidence_score * 100)}%`,
      `\nREASONING SUMMARY:`,
      verdict.reasoning_summary,
      `\nSUPPORTING SYNTHESIS:`,
      verdict.supporting_synthesis,
      `\nOPPOSING SYNTHESIS:`,
      verdict.opposing_synthesis,
      `\nCONTRADICTIONS IDENTIFIED:`,
      verdict.identified_contradictions || 'None registered.',
      `\nLIMITATIONS & CAVEATS:`,
      verdict.limitations,
      `\nRECORDED EVIDENCE EXHIBITS: ${evidenceList.length}`,
      ...evidenceList.map(
        (e, i) => `  [${i + 1}] ${e.title} (Type: ${e.type}, SHA-256: ${e.checksum || 'N/A'})`
      ),
      `=======================================================`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docket.id}-ADJUDICATION-REPORT.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!verdict) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center p-12 text-center text-[#E5DED0]">
        <Scale className="mb-4 h-12 w-12 text-[#C6A16B]/60" />
        <h3 className="font-serif text-2xl font-normal">No Adjudication Recorded Yet</h3>
        <p className="mt-2 max-w-md font-sans text-xs text-[#9C9B96]">
          A verdict can only be produced by conducting an adversarial examination of the case docket
          against empirical evidence.
        </p>
        <button
          type="button"
          onClick={onRequestRetrial}
          className="mt-6 border border-[#C6A16B] bg-[#181B1D] px-6 py-2.5 font-mono text-xs text-[#E5DED0] hover:bg-[#292E30]"
        >
          OPEN EVIDENCE &amp; SCRUTINY CHAMBER
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 text-[#E5DED0] sm:p-6 md:p-8">
      {/* ── Institutional Header Seal & Docket Banner ── */}
      <section aria-labelledby="verdict-banner-heading" className="space-y-4 text-center">
        <div className="flex justify-center">
          <CourtSeal size={64} pulsing={false} />
        </div>

        <div className="inline-flex items-center gap-2 border border-[#C6A16B]/30 bg-[#181B1D] px-3 py-1 font-mono text-xs tracking-widest text-[#C6A16B] uppercase">
          <Scale className="h-3.5 w-3.5" />
          JUDICIAL RECORD OF FINAL ADJUDICATION
        </div>

        <h2
          id="verdict-banner-heading"
          className="font-serif text-2xl font-normal tracking-tight text-[#E5DED0] sm:text-3xl md:text-4xl"
        >
          Tribunal Determination &amp; Uncertainty Calculus
        </h2>

        <p className="font-mono text-xs text-[#9C9B96]">
          DOCKET: {docket.id} &bull; CATEGORY: {docket.category}
        </p>
      </section>

      {/* ── Proposition Inscribed Quote ── */}
      <div className="border-l-2 border-[#C6A16B] bg-[#111315]/90 p-5 shadow-xl sm:p-6">
        <span className="mb-1 block font-mono text-[10px] tracking-widest text-[#C6A16B] uppercase">
          PROPOSITION SUBMITTED TO THE COURT
        </span>
        <blockquote className="font-serif text-lg leading-relaxed text-[#E5DED0] sm:text-xl">
          &ldquo;{docket.proposition}&rdquo;
        </blockquote>
      </div>

      {/* ── Main Judicial Verdict Plinth ── */}
      <div className="relative border border-[#C6A16B]/40 bg-[#111315] p-6 shadow-2xl md:p-8">
        {/* Brass corner brackets */}
        <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-[#C6A16B]" />
        <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-[#C6A16B]" />
        <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-[#C6A16B]" />
        <div className="absolute -right-1 -bottom-1 h-3 w-3 border-r-2 border-b-2 border-[#C6A16B]" />

        {/* Verdict Banner & Confidence Gauge */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#292E30] pb-6 sm:flex-row sm:items-center">
          <div>
            <span className="block font-mono text-[10px] tracking-widest text-[#9C9B96] uppercase">
              TRIBUNAL DETERMINATION
            </span>
            <div
              className={`mt-1 inline-block border px-4 py-2 font-mono text-base font-semibold tracking-wider ${badge.color}`}
            >
              {badge.label}
            </div>
            <p className="mt-1.5 font-sans text-xs text-[#9C9B96]">{badge.desc}</p>
          </div>

          {/* Calibrated Confidence Gauge */}
          <div className="border border-[#292E30] bg-[#0C0D11] p-4 text-center sm:min-w-[180px]">
            <span className="block font-mono text-[9px] tracking-widest text-[#9C9B96] uppercase">
              CALIBRATED CONFIDENCE
            </span>
            <span className="font-mono text-3xl font-bold text-[#C6A16B]">
              {Math.round(verdict.confidence_score * 100)}%
            </span>
            <div className="mt-1 h-1.5 w-full bg-[#181B1D]">
              <div
                className="h-full bg-[#C6A16B] transition-all duration-700"
                style={{ width: `${Math.round(verdict.confidence_score * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Judicial Reasoning Summary */}
        <div className="mb-6 space-y-2">
          <span className="font-mono text-[10px] tracking-widest text-[#C6A16B] uppercase">
            JUDICIAL REASONING SUMMARY
          </span>
          <p className="font-serif text-base leading-relaxed text-[#E5DED0]">
            {verdict.reasoning_summary}
          </p>
        </div>

        {/* 2-Column Comparative Synthesis: Supporting vs Opposing */}
        <div className="my-6 grid grid-cols-1 gap-6 border-t border-b border-[#292E30] py-6 md:grid-cols-2">
          <div className="space-y-2 border-l border-emerald-500/40 pl-4">
            <span className="font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
              CORROBORATING SYNTHESIS
            </span>
            <p className="font-sans text-xs leading-relaxed text-[#9C9B96]">
              {verdict.supporting_synthesis}
            </p>
          </div>

          <div className="space-y-2 border-l border-[#C08289]/40 pl-4">
            <span className="font-mono text-[10px] tracking-widest text-[#C08289] uppercase">
              SCRUTINY &amp; ADVERSARIAL CAVEATS
            </span>
            <p className="font-sans text-xs leading-relaxed text-[#9C9B96]">
              {verdict.opposing_synthesis}
            </p>
          </div>
        </div>

        {/* Contradictions & Caveats Breakdown */}
        {verdict.identified_contradictions && (
          <div className="mb-6 space-y-2 bg-[#0C0D11]/60 p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono text-[10px] tracking-widest text-amber-300 uppercase">
                IDENTIFIED STRUCTURAL CONTRADICTIONS
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-[#9C9B96]">
              {verdict.identified_contradictions}
            </p>
          </div>
        )}

        {/* Epistemic Limitations & Retrial Caveat */}
        <div className="space-y-2 border-t border-[#292E30] pt-4 font-mono text-xs text-[#9C9B96]">
          <div className="flex items-center gap-2 text-[#E5DED0]">
            <HelpCircle className="h-3.5 w-3.5 text-[#C6A16B]" />
            <span className="font-semibold text-[#C6A16B] uppercase">
              EPISTEMIC BOUNDS &amp; LIMITATIONS
            </span>
          </div>
          <p className="font-sans text-xs leading-relaxed text-[#9C9B96]">{verdict.limitations}</p>
        </div>
      </div>

      {/* ── Actions Cluster ── */}
      <div className="flex flex-col flex-wrap items-center justify-between gap-4 pt-4 sm:flex-row">
        <button
          type="button"
          onClick={onRequestRetrial}
          className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#C6A16B] bg-[#181B1D] px-6 py-3 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] transition-colors hover:bg-[#292E30] sm:w-auto"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#C6A16B]" />
          <span>REQUEST RETRIAL WITH MORE EVIDENCE</span>
        </button>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button
            type="button"
            onClick={handleExportSummary}
            className="inline-flex flex-1 items-center justify-center gap-2 border border-[#C6A16B]/40 bg-[#111315] px-5 py-3 font-mono text-xs tracking-wider text-[#9C9B96] transition-colors hover:border-[#C6A16B] hover:text-[#E5DED0] sm:flex-initial"
            title="Download complete adjudication record"
          >
            <Download className="h-3.5 w-3.5" />
            <span>EXPORT RECORD</span>
          </button>

          <button
            type="button"
            onClick={onReturnToDossier}
            className="inline-flex flex-1 items-center justify-center gap-2 border border-[#292E30] bg-[#111315] px-5 py-3 font-mono text-xs tracking-wider text-[#9C9B96] transition-colors hover:border-[#C6A16B] hover:text-[#E5DED0] sm:flex-initial"
          >
            <span>NEW PROPOSITION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
