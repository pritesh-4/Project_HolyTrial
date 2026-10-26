import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JudicialWorkspace } from '../components/JudicialWorkspace';
import type { CaseDocket } from '../types/case';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  checkBackendLive: vi.fn(),
  getCaseApi: vi.fn(),
  listCaseEvidenceApi: vi.fn(),
  listCaseAnalysesApi: vi.fn(),
  createCaseApi: vi.fn(),
}));

describe('JudicialWorkspace Component', () => {
  const mockOnBackToThreshold = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(api.checkBackendLive).mockResolvedValue(true);
    vi.mocked(api.listCaseEvidenceApi).mockResolvedValue({ items: [], total: 0 });
    vi.mocked(api.listCaseAnalysesApi).mockResolvedValue({ items: [], total: 0 });
  });

  it('renders CaseDossier draft form on initial empty state', () => {
    render(<JudicialWorkspace onBackToThreshold={mockOnBackToThreshold} />);

    expect(screen.getAllByText(/THE OBSIDIAN TRIBUNAL/i).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole('heading', { level: 1, name: /What claim shall be examined\?/i })
    ).toBeInTheDocument();
  });

  it('detects live backend engine status and shows indicator badge', async () => {
    vi.mocked(api.checkBackendLive).mockResolvedValue(true);

    render(<JudicialWorkspace onBackToThreshold={mockOnBackToThreshold} />);

    await waitFor(() => {
      expect(screen.getByText(/ENGINE LIVE/i)).toBeInTheDocument();
    });
  });

  it('loads active docket from storage and allows navigation between stages', async () => {
    const savedDocket: CaseDocket = {
      id: 'CASE-2026-F98A12',
      proposition:
        'Decentralized energy grids are more resilient to catastrophic disruption than centralized grids.',
      category: 'Science & Energy',
      status: 'awaiting_evidence',
      evidence_count: 2,
      analysis_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('holy_trial_active_docket', JSON.stringify(savedDocket));
    localStorage.setItem('holy_trial_active_stage', 'evidence');
    vi.mocked(api.getCaseApi).mockResolvedValue(savedDocket);

    render(<JudicialWorkspace onBackToThreshold={mockOnBackToThreshold} />);

    await waitFor(() => {
      expect(screen.getByText(/DOCKET CASE UNDER SCRUTINY/i)).toBeInTheDocument();
      expect(screen.getAllByText('CASE-2026-F98A12').length).toBeGreaterThan(0);
    });

    // Navigate to Scrutiny stage via header tab
    const scrutinyTab = screen.getByRole('button', { name: /3\. Scrutiny/i });
    fireEvent.click(scrutinyTab);

    await waitFor(() => {
      expect(screen.getByText(/The Tribunal Chamber Stands Ready/i)).toBeInTheDocument();
    });

    // Navigate to Verdict stage via header tab
    const verdictTab = screen.getByRole('button', { name: /4\. Verdict/i });
    fireEvent.click(verdictTab);

    await waitFor(() => {
      expect(screen.getByText(/No Adjudication Recorded Yet/i)).toBeInTheDocument();
    });
  });

  it('opens case switcher drawer and allows inscribe new proposition', async () => {
    render(<JudicialWorkspace onBackToThreshold={mockOnBackToThreshold} />);

    const registersBtn = screen.getByTitle(/Open recent court registers/i);
    fireEvent.click(registersBtn);

    expect(screen.getByText(/Court Registers/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /INSCRIBE NEW PROPOSITION/i })).toBeInTheDocument();

    // Close registers drawer
    const closeBtn = screen.getByRole('button', { name: /Close registers/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Court Registers/i)).not.toBeInTheDocument();
    });
  });

  it('triggers onBackToThreshold when Threshold button is clicked in header', () => {
    render(<JudicialWorkspace onBackToThreshold={mockOnBackToThreshold} />);

    const thresholdBtn = screen.getAllByTitle(/Return to The Threshold/i)[0];
    fireEvent.click(thresholdBtn);

    expect(mockOnBackToThreshold).toHaveBeenCalledTimes(1);
  });
});
