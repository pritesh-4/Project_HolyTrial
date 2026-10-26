import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScrutinyChamber } from '../components/ScrutinyChamber';
import type { AnalysisRun, CaseDocket, EvidenceExhibit } from '../types/case';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  initiateAnalysisApi: vi.fn(),
  getAnalysisApi: vi.fn(),
  listCaseAnalysesApi: vi.fn(),
}));

describe('ScrutinyChamber Component', () => {
  const mockDocket: CaseDocket = {
    id: 'CASE-2026-F98A12',
    proposition: 'Autonomous orbital drones operate with zero human intervention error.',
    category: 'Science & Energy',
    status: 'awaiting_evidence',
    evidence_count: 2,
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
    {
      id: 'EV-002',
      case_id: 'CASE-2026-F98A12',
      type: 'url',
      title: 'Orbital Failure Case Study',
      source_url: 'https://example.org/incident-report',
      content: 'Investigation revealed autonomous guidance desynchronization during solar flare.',
      provenance: 'Orbital Safety Board',
      checksum: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      status: 'processed',
      created_at: new Date().toISOString(),
    },
  ];

  const mockCompletedAnalysis: AnalysisRun = {
    id: 'RUN-999',
    case_id: 'CASE-2026-F98A12',
    provider_used: 'local_heuristic',
    status: 'completed',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    findings: [
      {
        id: 'FIND-1',
        analysis_run_id: 'RUN-999',
        case_id: 'CASE-2026-F98A12',
        polarity: 'supporting',
        title: 'High autonomous cycle success in controlled conditions',
        explanation: 'Telemetry confirms 200 continuous successful autonomous docking runs.',
        evidence_citations: ['EV-001'],
        confidence: 0.92,
        created_at: new Date().toISOString(),
      },
      {
        id: 'FIND-2',
        analysis_run_id: 'RUN-999',
        case_id: 'CASE-2026-F98A12',
        polarity: 'opposing',
        title: 'Solar flare environmental disruption causes guidance loss',
        explanation:
          'Independent investigation proves zero-error claim is invalid under high radiation.',
        evidence_citations: ['EV-002'],
        confidence: 0.88,
        created_at: new Date().toISOString(),
      },
      {
        id: 'FIND-3',
        analysis_run_id: 'RUN-999',
        case_id: 'CASE-2026-F98A12',
        polarity: 'contradiction',
        title: 'Direct clash between absolute reliability and proven desynchronization',
        explanation:
          'The claim of absolute zero error cannot coexist with recorded solar flare failure.',
        evidence_citations: ['EV-002'],
        confidence: 0.95,
        created_at: new Date().toISOString(),
      },
    ],
    verdict: {
      id: 'VERD-101',
      analysis_run_id: 'RUN-999',
      case_id: 'CASE-2026-F98A12',
      assessment: 'REFUTED',
      confidence_score: 0.85,
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

  const mockOnAnalysisUpdated = vi.fn();
  const mockOnProceedToVerdict = vi.fn();
  const mockOnInspectEvidence = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial unanalyzed tribunal chamber ready state', () => {
    render(
      <ScrutinyChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        latestAnalysis={null}
        onAnalysisUpdated={mockOnAnalysisUpdated}
        onProceedToVerdict={mockOnProceedToVerdict}
        onInspectEvidence={mockOnInspectEvidence}
      />
    );

    expect(screen.getByText(/ADVERSARIAL EXAMINATION/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockDocket.proposition))).toBeInTheDocument();
    expect(screen.getByText(/The Tribunal Chamber Stands Ready/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /INITIATE ADVERSARIAL SCRUTINY/i })
    ).toBeInTheDocument();
  });

  it('initiates analysis run and polls until completed', async () => {
    const runningRun: AnalysisRun = {
      id: 'RUN-001',
      case_id: mockDocket.id,
      provider_used: 'local_heuristic',
      status: 'running',
      created_at: new Date().toISOString(),
      findings: [],
    };

    const completedRun: AnalysisRun = {
      ...runningRun,
      status: 'completed',
      findings: mockCompletedAnalysis.findings,
      verdict: mockCompletedAnalysis.verdict,
    };

    vi.mocked(api.initiateAnalysisApi).mockResolvedValue(runningRun);
    vi.mocked(api.getAnalysisApi).mockResolvedValue(completedRun);

    render(
      <ScrutinyChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        latestAnalysis={null}
        onAnalysisUpdated={mockOnAnalysisUpdated}
        onProceedToVerdict={mockOnProceedToVerdict}
        onInspectEvidence={mockOnInspectEvidence}
      />
    );

    const initiateBtn = screen.getByRole('button', { name: /INITIATE ADVERSARIAL SCRUTINY/i });
    fireEvent.click(initiateBtn);

    await waitFor(
      () => {
        expect(api.initiateAnalysisApi).toHaveBeenCalledWith({
          caseId: mockDocket.id,
          provider: 'local_heuristic',
        });
        expect(api.getAnalysisApi).toHaveBeenCalledWith('RUN-001');
        expect(mockOnAnalysisUpdated).toHaveBeenCalledWith(completedRun);
      },
      { timeout: 3000 }
    );
  });

  it('displays grounded findings categorized by polarity with citations', () => {
    render(
      <ScrutinyChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        latestAnalysis={mockCompletedAnalysis}
        onAnalysisUpdated={mockOnAnalysisUpdated}
        onProceedToVerdict={mockOnProceedToVerdict}
        onInspectEvidence={mockOnInspectEvidence}
      />
    );

    expect(screen.getByText(/Corroborating Findings \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Adversarial Scrutiny & Caveats \(1\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Structural Contradictions & Evidentiary Clashes \(1\)/i)
    ).toBeInTheDocument();

    // Verify finding statements
    expect(
      screen.getByText(/High autonomous cycle success in controlled conditions/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Solar flare environmental disruption causes guidance loss/i)
    ).toBeInTheDocument();

    // Verify citation interaction
    const citedExhibitBtn = screen.getByRole('button', {
      name: /Flight Telemetry Log #44/i,
    });
    expect(citedExhibitBtn).toBeInTheDocument();
    fireEvent.click(citedExhibitBtn);
    expect(mockOnInspectEvidence).toHaveBeenCalledWith('EV-001');
  });

  it('allows proceeding to review verdict when analysis has completed', () => {
    render(
      <ScrutinyChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        latestAnalysis={mockCompletedAnalysis}
        onAnalysisUpdated={mockOnAnalysisUpdated}
        onProceedToVerdict={mockOnProceedToVerdict}
        onInspectEvidence={mockOnInspectEvidence}
      />
    );

    const reviewVerdictBtn = screen.getByRole('button', { name: /REVIEW VERDICT/i });
    fireEvent.click(reviewVerdictBtn);
    expect(mockOnProceedToVerdict).toHaveBeenCalledTimes(1);
  });
});
