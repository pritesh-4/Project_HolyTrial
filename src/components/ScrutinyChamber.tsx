import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Flame,
  HelpCircle,
  Loader2,
  Scale,
  Zap,
} from 'lucide-react';
import type { AnalysisRun, CaseDocket, EvidenceExhibit, Finding } from '../types/case';
import { getAnalysisApi, initiateAnalysisApi } from '../services/api';

interface ScrutinyChamberProps {
  docket: CaseDocket;
  evidenceList: EvidenceExhibit[];
  latestAnalysis: AnalysisRun | null;
  onAnalysisUpdated: (analysis: AnalysisRun) => void;
  onProceedToVerdict: () => void;
  onInspectEvidence: (exhibitId: string) => void;
}

export const ScrutinyChamber: React.FC<ScrutinyChamberProps> = ({
  docket,
  evidenceList,
  latestAnalysis,
  onAnalysisUpdated,
  onProceedToVerdict,
  onInspectEvidence,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [providerMode] = useState<'local_heuristic' | 'external'>('local_heuristic');

  // Trigger Adversarial Scrutiny Run
  const handleInitiateAnalysis = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const run = await initiateAnalysisApi({
        caseId: docket.id,
        provider: providerMode,
      });
      onAnalysisUpdated(run);

      // Start polling until completion or failure
      let currentStatus = run.status;
      const startTime = Date.now();
      const maxWait = 45000; // 45s max timeout

      while (currentStatus === 'queued' || currentStatus === 'running') {
        if (Date.now() - startTime > maxWait) {
          throw new Error('Analysis timeout: Reasoning operation exceeded 45 seconds.');
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const updated = await getAnalysisApi(run.id);
        currentStatus = updated.status;
        onAnalysisUpdated(updated);
        if (currentStatus === 'completed' || currentStatus === 'failed') {
          break;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Adversarial scrutiny failed.';
      setErrorMsg(msg);
    } finally {
      setIsRunning(false);
    }
  };

  // Group findings by polarity
  const findings = latestAnalysis?.findings || [];
  const supportingFindings = findings.filter((f) => f.polarity === 'supporting');
  const opposingFindings = findings.filter((f) => f.polarity === 'opposing');
  const contradictionFindings = findings.filter((f) => f.polarity === 'contradiction');
  const uncertaintyFindings = findings.filter((f) => f.polarity === 'uncertainty');

  // Helper to resolve exhibit title by ID
  const getExhibitTitle = (id: string) => {
    const found = evidenceList.find((e) => e.id === id);
    return found ? found.title : `Exhibit (${id.slice(0, 8)})`;
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 text-[#E5DED0] sm:p-6 md:p-8">
      {/* ── Scrutiny Chamber Header & Trigger ── */}
      <section
        aria-labelledby="scrutiny-banner-heading"
        className="border border-[#C6A16B]/30 bg-[#181B1D]/80 p-5 shadow-lg backdrop-blur-sm sm:p-6"
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#C6A16B] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6A16B]" />
              ADVERSARIAL EXAMINATION &bull; {docket.id}
            </div>
            <h2
              id="scrutiny-banner-heading"
              className="font-serif text-lg leading-relaxed font-normal text-[#E5DED0] sm:text-xl md:text-2xl"
            >
              &ldquo;{docket.proposition}&rdquo;
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-xs text-[#9C9B96]">
              <span>Jurisdiction: {docket.category}</span>
              <span>&bull;</span>
              <span>
                {evidenceList.length} Attached Exhibit{evidenceList.length === 1 ? '' : 's'}
              </span>
              <span>&bull;</span>
              <span className="text-[#C6A16B]">
                {latestAnalysis?.status === 'completed'
                  ? 'ADJUDICATED FINDINGS READY'
                  : latestAnalysis?.status === 'running'
                    ? 'EXAMINATION IN PROGRESS'
                    : 'AWAITING SCRUTINY'}
              </span>
            </div>
          </div>

          {/* Action cluster */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isRunning}
              onClick={handleInitiateAnalysis}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border-2 border-[#C6A16B] bg-[#111315] px-6 py-3 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] shadow-[0_0_20px_rgba(198,161,107,0.25)] transition-all hover:bg-[#292E30] hover:shadow-[0_0_28px_rgba(198,161,107,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C6A16B]" />
                  <span>CONVENING TRIBUNAL...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-[#C6A16B]" />
                  <span>
                    {latestAnalysis ? 'RE-CONVENE SCRUTINY' : 'INITIATE ADVERSARIAL SCRUTINY'}
                  </span>
                </>
              )}
            </button>

            {latestAnalysis?.status === 'completed' && (
              <button
                type="button"
                onClick={onProceedToVerdict}
                className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#C6A16B]/60 bg-[#181B1D] px-6 py-3 font-mono text-xs tracking-wider text-[#E5DED0] hover:bg-[#292E30]"
              >
                <span>REVIEW VERDICT</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#C6A16B]" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="flex items-center gap-2 border border-red-500/40 bg-red-950/30 p-4 font-mono text-xs text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── No Analysis Executed State ── */}
      {!latestAnalysis && !isRunning && (
        <div className="flex flex-col items-center justify-center border border-[#C6A16B]/20 bg-[#111315]/80 p-14 text-center">
          <Scale className="mb-4 h-12 w-12 text-[#C6A16B]/70" />
          <h3 className="font-serif text-2xl font-normal text-[#E5DED0]">
            The Tribunal Chamber Stands Ready
          </h3>
          <p className="mt-2 max-w-lg font-sans text-xs leading-relaxed text-[#9C9B96]">
            Adversarial scrutiny will cross-examine the proposition against all{' '}
            {evidenceList.length} attached exhibit(s). The engine will extract corroborating
            arguments, adversarial challenges, contradictions, and epistemic limitations.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleInitiateAnalysis}
              className="inline-flex cursor-pointer items-center gap-2 border border-[#C6A16B] bg-[#181B1D] px-8 py-3 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] hover:bg-[#292E30]"
            >
              <Zap className="h-3.5 w-3.5 text-[#C6A16B]" />
              <span>COMMENCE INVESTIGATION NOW</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Active Running Indicator ── */}
      {isRunning && (
        <div className="flex flex-col items-center justify-center border border-[#C6A16B]/40 bg-[#111315] p-12 text-center shadow-2xl">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#C6A16B]" />
          <span className="font-mono text-xs tracking-widest text-[#C6A16B] uppercase">
            JUDICIAL REASONING PIPELINE ACTIVE
          </span>
          <h3 className="mt-1 font-serif text-xl font-normal text-[#E5DED0]">
            Cross-Examining Evidence &amp; Formulating Contradictions
          </h3>
          <p className="mt-2 max-w-md font-sans text-xs text-[#9C9B96]">
            Inspecting exhibits, attributing citations, and synthesizing thesis vs antithesis...
          </p>
        </div>
      )}

      {/* ── Grounded Findings Sections ── */}
      {latestAnalysis && latestAnalysis.status === 'completed' && (
        <div className="space-y-8">
          {/* 1. Structural Contradictions (Divergent Evidence) */}
          {contradictionFindings.length > 0 && (
            <div className="border border-amber-500/40 bg-amber-950/10 p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2 border-b border-amber-500/30 pb-3">
                <Flame className="h-4 w-4 text-amber-400" />
                <h3 className="font-serif text-lg font-normal text-amber-200">
                  Structural Contradictions &amp; Evidentiary Clashes (
                  {contradictionFindings.length})
                </h3>
              </div>
              <div className="space-y-4">
                {contradictionFindings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    getExhibitTitle={getExhibitTitle}
                    onInspectEvidence={onInspectEvidence}
                    polarityColor="text-amber-400"
                    borderColor="border-amber-500/30"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2-Column Split: Supporting vs Opposing */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Supporting Arguments (Thesis) */}
            <div className="space-y-4 border border-[#C6A16B]/30 bg-[#111315] p-5 shadow-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-[#292E30] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-serif text-lg font-normal text-[#E5DED0]">
                    Corroborating Findings ({supportingFindings.length})
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">GROUNDED THESIS</span>
              </div>

              {supportingFindings.length === 0 ? (
                <p className="py-6 text-center font-mono text-xs text-[#9C9B96]">
                  No corroborating evidence detected for this proposition.
                </p>
              ) : (
                <div className="space-y-4">
                  {supportingFindings.map((finding) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                      getExhibitTitle={getExhibitTitle}
                      onInspectEvidence={onInspectEvidence}
                      polarityColor="text-emerald-400"
                      borderColor="border-emerald-500/20"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Opposing Arguments (Antithesis / Scrutiny) */}
            <div className="space-y-4 border border-[#C6A16B]/30 bg-[#111315] p-5 shadow-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-[#292E30] pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#C08289]" />
                  <h3 className="font-serif text-lg font-normal text-[#E5DED0]">
                    Adversarial Scrutiny &amp; Caveats ({opposingFindings.length})
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-[#C08289]">CHALLENGE ANTITHESIS</span>
              </div>

              {opposingFindings.length === 0 ? (
                <p className="py-6 text-center font-mono text-xs text-[#9C9B96]">
                  No direct adversarial counter-evidence observed.
                </p>
              ) : (
                <div className="space-y-4">
                  {opposingFindings.map((finding) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                      getExhibitTitle={getExhibitTitle}
                      onInspectEvidence={onInspectEvidence}
                      polarityColor="text-[#C08289]"
                      borderColor="border-[#C08289]/20"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Epistemic Uncertainty & Data Gaps */}
          {uncertaintyFindings.length > 0 && (
            <div className="border border-[#292E30] bg-[#111315]/70 p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2 border-b border-[#292E30] pb-3">
                <HelpCircle className="h-4 w-4 text-[#C6A16B]" />
                <h3 className="font-serif text-lg font-normal text-[#E5DED0]">
                  Epistemic Uncertainty &amp; Missing Record Gaps ({uncertaintyFindings.length})
                </h3>
              </div>
              <div className="space-y-4">
                {uncertaintyFindings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    getExhibitTitle={getExhibitTitle}
                    onInspectEvidence={onInspectEvidence}
                    polarityColor="text-[#C6A16B]"
                    borderColor="border-[#292E30]"
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Final Proceed to Verdict Footer ── */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onProceedToVerdict}
              className="inline-flex cursor-pointer items-center justify-center gap-3 border-2 border-[#C6A16B] bg-[#181B1D] px-8 py-3.5 font-mono text-sm font-semibold tracking-wider text-[#E5DED0] shadow-[0_0_25px_rgba(198,161,107,0.25)] transition-all hover:bg-[#292E30] hover:shadow-[0_0_35px_rgba(198,161,107,0.5)]"
            >
              <span>ADVANCE TO JUDICIAL VERDICT</span>
              <ArrowRight className="h-4 w-4 text-[#C6A16B]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Individual Finding Card with Interactive Citations ──────────────────
interface FindingCardProps {
  finding: Finding;
  getExhibitTitle: (id: string) => string;
  onInspectEvidence: (id: string) => void;
  polarityColor: string;
  borderColor: string;
}

const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  getExhibitTitle,
  onInspectEvidence,
  polarityColor,
  borderColor,
}) => {
  return (
    <div
      className={`border ${borderColor} bg-[#0C0D11]/90 p-4 transition-colors hover:border-[#C6A16B]/50`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <h4 className="font-serif text-base font-normal text-[#E5DED0]">{finding.title}</h4>
        <span className={`font-mono text-[10px] ${polarityColor} uppercase`}>
          Confidence: {Math.round(finding.confidence * 100)}%
        </span>
      </div>

      <p className="font-sans text-xs leading-relaxed text-[#9C9B96]">{finding.explanation}</p>

      {/* Cited Exhibits — clicking any tag immediately views the source */}
      {finding.evidence_citations && finding.evidence_citations.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#292E30]/60 pt-2.5 font-mono text-[10px]">
          <span className="text-[#9C9B96]">CITED EXHIBIT:</span>
          {finding.evidence_citations.map((cid) => (
            <button
              key={cid}
              type="button"
              onClick={() => onInspectEvidence(cid)}
              className="inline-flex cursor-pointer items-center gap-1 border border-[#C6A16B]/40 bg-[#181B1D] px-2 py-0.5 text-[#C6A16B] transition-colors hover:border-[#C6A16B] hover:bg-[#292E30] hover:text-[#E5DED0]"
              title="Inspect cited evidence exhibit"
            >
              <span>{getExhibitTitle(cid)}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
