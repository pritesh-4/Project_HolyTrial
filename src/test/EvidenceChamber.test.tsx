import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EvidenceChamber } from '../components/EvidenceChamber';
import type { CaseDocket, EvidenceExhibit } from '../types/case';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  addTextEvidenceApi: vi.fn(),
  addUrlEvidenceApi: vi.fn(),
  uploadFileEvidenceApi: vi.fn(),
  deleteEvidenceApi: vi.fn(),
}));

describe('EvidenceChamber Component', () => {
  const mockDocket: CaseDocket = {
    id: 'CASE-2026-F98A12',
    proposition: 'Autonomous orbital drones operate with zero human intervention error.',
    category: 'Science & Energy',
    status: 'awaiting_evidence',
    evidence_count: 2,
    analysis_count: 0,
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

  const mockOnEvidenceUpdated = vi.fn().mockResolvedValue(undefined);
  const mockOnProceedToScrutiny = vi.fn();
  const mockOnInspectEvidence = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders docket proposition and evidence exhibits list', () => {
    render(
      <EvidenceChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        onEvidenceUpdated={mockOnEvidenceUpdated}
        onProceedToScrutiny={mockOnProceedToScrutiny}
        onInspectEvidence={mockOnInspectEvidence}
      />
    );

    expect(screen.getByText(/DOCKET CASE UNDER SCRUTINY/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockDocket.proposition))).toBeInTheDocument();
    expect(screen.getByText('Flight Telemetry Log #44')).toBeInTheDocument();
    expect(screen.getByText('Orbital Failure Case Study')).toBeInTheDocument();
    expect(screen.getByText(/Flight Systems Control, Station 7/i)).toBeInTheDocument();
  });

  it('submits verbatim text evidence and refreshes evidence list', async () => {
    vi.mocked(api.addTextEvidenceApi).mockResolvedValue({
      id: 'EV-003',
      case_id: mockDocket.id,
      type: 'text',
      title: 'Sensor Calibration Record',
      content: 'All lidar transducers calibrated within 0.02% nominal tolerance.',
      checksum: 'abc123',
      status: 'processed',
      created_at: new Date().toISOString(),
    });

    render(
      <EvidenceChamber
        docket={mockDocket}
        evidenceList={[]}
        onEvidenceUpdated={mockOnEvidenceUpdated}
        onProceedToScrutiny={mockOnProceedToScrutiny}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\., Benchmark Performance Report/i), {
      target: { value: 'Sensor Calibration Record' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Paste verbatim excerpt/i), {
      target: { value: 'All lidar transducers calibrated within 0.02% nominal tolerance.' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., Stanford University/i), {
      target: { value: 'Lidar Lab A' },
    });

    const submitBtn = screen.getByRole('button', { name: /INSCRIBE TEXT EXHIBIT/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.addTextEvidenceApi).toHaveBeenCalledWith({
        caseId: mockDocket.id,
        title: 'Sensor Calibration Record',
        content: 'All lidar transducers calibrated within 0.02% nominal tolerance.',
        provenance: 'Lidar Lab A',
      });
      expect(mockOnEvidenceUpdated).toHaveBeenCalledTimes(1);
    });
  });

  it('switches to remote URL tab and submits URL evidence', async () => {
    vi.mocked(api.addUrlEvidenceApi).mockResolvedValue({
      id: 'EV-004',
      case_id: mockDocket.id,
      type: 'url',
      title: 'Autonomous System Specification',
      source_url: 'https://standards.org/spec-88',
      checksum: 'def456',
      status: 'processed',
      created_at: new Date().toISOString(),
    });

    render(
      <EvidenceChamber
        docket={mockDocket}
        evidenceList={[]}
        onEvidenceUpdated={mockOnEvidenceUpdated}
        onProceedToScrutiny={mockOnProceedToScrutiny}
      />
    );

    // Switch tab
    const urlTab = screen.getByRole('button', { name: /^Web URL$/i });
    fireEvent.click(urlTab);

    expect(
      screen.getByPlaceholderText(/https:\/\/example\.com\/research-report\.html/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\., Published Analysis/i), {
      target: { value: 'Autonomous System Specification' },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/https:\/\/example\.com\/research-report\.html/i),
      {
        target: { value: 'https://standards.org/spec-88' },
      }
    );

    const fetchBtn = screen.getByRole('button', { name: /INGEST REMOTE WEB SOURCE/i });
    fireEvent.click(fetchBtn);

    await waitFor(() => {
      expect(api.addUrlEvidenceApi).toHaveBeenCalledWith({
        caseId: mockDocket.id,
        title: 'Autonomous System Specification',
        source_url: 'https://standards.org/spec-88',
        provenance: undefined,
      });
      expect(mockOnEvidenceUpdated).toHaveBeenCalledTimes(1);
    });
  });

  it('allows inspecting exhibit and opening modal', () => {
    render(
      <EvidenceChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        onEvidenceUpdated={mockOnEvidenceUpdated}
        onProceedToScrutiny={mockOnProceedToScrutiny}
        onInspectEvidence={mockOnInspectEvidence}
      />
    );

    const inspectBtn = screen.getAllByRole('button', { name: /^INSPECT$/i })[0];
    fireEvent.click(inspectBtn);

    expect(screen.getByText(/EXHIBIT IDENTIFIER/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Telemetry confirmed uninterrupted autonomous docking/i).length
    ).toBeGreaterThanOrEqual(2);
  });

  it('deletes an exhibit upon confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.deleteEvidenceApi).mockResolvedValue(undefined);

    render(
      <EvidenceChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        onEvidenceUpdated={mockOnEvidenceUpdated}
        onProceedToScrutiny={mockOnProceedToScrutiny}
      />
    );

    const deleteBtn = screen.getAllByRole('button', { name: /Delete exhibit/i })[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.deleteEvidenceApi).toHaveBeenCalledWith('EV-001');
      expect(mockOnEvidenceUpdated).toHaveBeenCalledTimes(1);
    });
  });

  it('triggers onProceedToScrutiny when button is clicked', () => {
    render(
      <EvidenceChamber
        docket={mockDocket}
        evidenceList={mockEvidenceList}
        onEvidenceUpdated={mockOnEvidenceUpdated}
        onProceedToScrutiny={mockOnProceedToScrutiny}
      />
    );

    const proceedBtn = screen.getByRole('button', { name: /PROCEED TO SCRUTINY/i });
    fireEvent.click(proceedBtn);
    expect(mockOnProceedToScrutiny).toHaveBeenCalledTimes(1);
  });
});
