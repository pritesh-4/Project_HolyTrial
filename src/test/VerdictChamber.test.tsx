import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VerdictChamber } from '../components/VerdictChamber';
import type { AnalysisRun, CaseDocket, EvidenceExhibit } from '../types/case';

describe('VerdictChamber Component', () => {
  const mockDocket: CaseDocket = {
    id: 'CASE-2026-F98A12',
    proposition: 'Autonomous orbital drones operate with zero human intervention error.',
    category: 'Science & Energy',
    status: 'adjudicated',
    evidence_count: 1,
    analysis_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockEvidenceList: EvidenceExhibit[] = [
    {
      id: 'EV-001',
      case_id: 'CASE-2026-F98A12',
      type: 'text',
      title: 'Flight Telemetry Log #44',
      content: 'Telemetry confirmed uninterrupted autonomous docking across 200 cycles.',
      provenance: 'Flight Systems Control, Station 7',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'processed',
      created_at: new Date().toISOString(),
    },
  ];

  const mockAnalysisWithVerdict: AnalysisRun = {
    id: 'RUN-999',
    case_id: 'CASE-2026-F98A12',
    provider_used: 'local_heuristic',
    status: 'completed',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    findings: [],
    verdict: {
      id: 'VERD-101',
      analysis_run_id: 'RUN-999',
      case_id: 'CASE-2026-F98A12',
      assessment: 'REFUTED',
      confidence_score: 0.88,
      reasoning_summary:
        'The universal proposition of zero human intervention error is refuted by recorded guidance failure under solar activity.',
      supporting_synthesis: 'Nominal docking operations exhibit reliable autonomous capabilities.',
      opposing_synthesis:
        'External radiation phenomena trigger catastrophic guidance failures without human correction.',
      identified_contradictions:
        'Claim asserts zero error, but empirical records demonstrate documented desynchronization events.',
      limitations: 'Limited sample size during geomagnetic storm events.',
      created_at: new Date().toISOString(),
    },
  };

  const mockOnRequestRetrial = vi.fn();
  const mockOnReturnToDossier = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unadjudicated empty state when verdict is missing', () => {
    render(
      <VerdictChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        latestAnalysis={null}
        onRequestRetrial={mockOnRequestRetrial}
        onReturnToDossier={mockOnReturnToDossier}
      />
    );

    expect(screen.getByText(/No Adjudication Recorded Yet/i)).toBeInTheDocument();
    const retrialBtn = screen.getByRole('button', {
      name: /OPEN EVIDENCE & SCRUTINY CHAMBER/i,
    });
    fireEvent.click(retrialBtn);
    expect(mockOnRequestRetrial).toHaveBeenCalledTimes(1);
  });

  it('renders complete judicial verdict with calibrated confidence, syntheses, and contradictions', () => {
    render(
      <VerdictChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        latestAnalysis={mockAnalysisWithVerdict}
        onRequestRetrial={mockOnRequestRetrial}
        onReturnToDossier={mockOnReturnToDossier}
      />
    );

    expect(screen.getByText(/JUDICIAL RECORD OF FINAL ADJUDICATION/i)).toBeInTheDocument();
    expect(screen.getByText(/CLAIM REFUTED/i)).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockDocket.proposition))).toBeInTheDocument();

    // Summaries
    expect(
      screen.getByText(
        /The universal proposition of zero human intervention error is refuted by recorded guidance failure/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nominal docking operations exhibit reliable autonomous capabilities/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/External radiation phenomena trigger catastrophic guidance failures/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Claim asserts zero error, but empirical records demonstrate documented desynchronization events/i
      )
    ).toBeInTheDocument();
  });

  it('triggers retrial when user requests more evidence', () => {
    render(
      <VerdictChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        latestAnalysis={mockAnalysisWithVerdict}
        onRequestRetrial={mockOnRequestRetrial}
        onReturnToDossier={mockOnReturnToDossier}
      />
    );

    const retrialBtn = screen.getByRole('button', {
      name: /REQUEST RETRIAL WITH MORE EVIDENCE/i,
    });
    fireEvent.click(retrialBtn);
    expect(mockOnRequestRetrial).toHaveBeenCalledTimes(1);
  });

  it('triggers onReturnToDossier when user selects NEW PROPOSITION', () => {
    render(
      <VerdictChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        latestAnalysis={mockAnalysisWithVerdict}
        onRequestRetrial={mockOnRequestRetrial}
        onReturnToDossier={mockOnReturnToDossier}
      />
    );

    const newPropBtn = screen.getByRole('button', { name: /NEW PROPOSITION/i });
    fireEvent.click(newPropBtn);
    expect(mockOnReturnToDossier).toHaveBeenCalledTimes(1);
  });

  it('exports judgment summary file on click', () => {
    const originalCreateObjectUrl = window.URL.createObjectURL;
    const originalRevokeObjectUrl = window.URL.revokeObjectURL;
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    render(
      <VerdictChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        latestAnalysis={mockAnalysisWithVerdict}
        onRequestRetrial={mockOnRequestRetrial}
        onReturnToDossier={mockOnReturnToDossier}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /EXPORT RECORD/i });
    fireEvent.click(exportBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();

    window.URL.createObjectURL = originalCreateObjectUrl;
    window.URL.revokeObjectURL = originalRevokeObjectUrl;
  });
});
