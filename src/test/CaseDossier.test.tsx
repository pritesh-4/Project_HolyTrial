import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseDossier } from '../components/CaseDossier';
import { loadCaseFromStorage, clearCaseFromStorage } from '../utils/caseStorage';

describe('CaseDossier — Entering the Court & Claim Formulation', () => {
  const mockOnBackToThreshold = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clearCaseFromStorage();
  });

  it('renders institutional header, draft identifier, and initial prompt', () => {
    render(<CaseDossier onBackToThreshold={mockOnBackToThreshold} />);

    expect(screen.getByText('CASE DOSSIER')).toBeInTheDocument();
    expect(screen.getByText(/STAGE: I. THE DOSSIER/i)).toBeInTheDocument();
    expect(screen.getByText('INTAKE')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /What claim shall be examined\?/i })
    ).toBeInTheDocument();
  });

  it('populates input when an example precedent is clicked and allows editing', () => {
    render(<CaseDossier onBackToThreshold={mockOnBackToThreshold} />);

    const textarea = screen.getByLabelText(/Claim proposition to be examined/i);
    expect(textarea).toHaveValue('');

    // Click the first example claim
    const aiExample = screen.getByText(/AI & Engineering/i);
    fireEvent.click(aiExample);

    expect(textarea).toHaveValue(
      'AI systems will displace more than half of entry-level software engineering roles by 2030.'
    );

    // Edit the text
    fireEvent.change(textarea, {
      target: { value: 'AI will augment rather than displace software engineers by 2030.' },
    });
    expect(textarea).toHaveValue(
      'AI will augment rather than displace software engineers by 2030.'
    );
  });

  it('validates proposition length and formats appropriately', () => {
    render(<CaseDossier onBackToThreshold={mockOnBackToThreshold} />);

    const textarea = screen.getByLabelText(/Claim proposition to be examined/i);
    const proceedBtn = screen.getByRole('button', { name: /PROCEED TO REVIEW/i });

    // Initially disabled
    expect(proceedBtn).toBeDisabled();
    expect(screen.getByText(/Awaiting proposition input/i)).toBeInTheDocument();

    // Too short input
    fireEvent.change(textarea, { target: { value: 'Short claim' } });
    expect(screen.getByText(/Proposition too brief \(min 15 characters\)/i)).toBeInTheDocument();
    expect(proceedBtn).toBeDisabled();

    // Valid declarative input
    fireEvent.change(textarea, {
      target: { value: 'Synthetic biology will outperform petroleum refining by 2035.' },
    });
    expect(screen.getByText(/Valid proposition format/i)).toBeInTheDocument();
    expect(proceedBtn).not.toBeDisabled();

    // Question input triggers judicial tip
    fireEvent.change(textarea, {
      target: { value: 'Will synthetic biology outperform petroleum refining by 2035?' },
    });
    expect(
      screen.getByText(/Judicial Tip: Phrase as a declarative assertion rather than a question/i)
    ).toBeInTheDocument();
  });

  it('allows category selection metadata', () => {
    render(<CaseDossier onBackToThreshold={mockOnBackToThreshold} />);

    const scienceBtn = screen.getByRole('button', { name: /Science & Energy/i });
    fireEvent.click(scienceBtn);
    expect(scienceBtn.className).toContain('border-[#B9975B]');
  });

  it('completes the full flow: Intake -> Review -> Registration -> Persistence', () => {
    render(<CaseDossier onBackToThreshold={mockOnBackToThreshold} />);

    const textarea = screen.getByLabelText(/Claim proposition to be examined/i);
    fireEvent.change(textarea, {
      target: {
        value:
          'Decentralized energy grids are more resilient to catastrophic disruption than centralized grids.',
      },
    });

    const categoryBtn = screen.getByRole('button', { name: /Science & Energy/i });
    fireEvent.click(categoryBtn);

    // Proceed to Review
    const proceedBtn = screen.getByRole('button', { name: /PROCEED TO REVIEW/i });
    fireEvent.click(proceedBtn);

    // Review stage assertions
    expect(
      screen.getByRole('heading', { level: 1, name: /Review Case Dossier/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Confirmation of Scope/i)).toBeInTheDocument();
    expect(screen.getByText(/PROPOSITION UNDER SCRUTINY/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /“Decentralized energy grids are more resilient to catastrophic disruption than centralized grids.”/i
      )
    ).toBeInTheDocument();

    // Open Case
    const openCaseBtn = screen.getByRole('button', { name: /OPEN THE CASE/i });
    fireEvent.click(openCaseBtn);

    // Registration stage assertions
    expect(
      screen.getByRole('heading', { level: 1, name: /Case Docket Registered/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/CASE INSCRIBED IN COURT REGISTERS/i)).toBeInTheDocument();
    expect(screen.getByText(/NEXT JUDICIAL ACT • THE SUMMONING/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidence collection has not yet begun/i)).toBeInTheDocument();

    // Verify localStorage persistence
    const saved = loadCaseFromStorage();
    expect(saved).not.toBeNull();
    expect(saved?.confirmedClaim).toBe(
      'Decentralized energy grids are more resilient to catastrophic disruption than centralized grids.'
    );
    expect(saved?.category).toBe('Science & Energy');
    expect(saved?.status).toBe('Awaiting evidence');
    expect(saved?.caseId).toMatch(/^CASE-\d{4}-[A-Z0-9]{4}$/);

    // Prepare another draft resets form
    const prepareAnotherBtn = screen.getByRole('button', { name: /PREPARE ANOTHER DRAFT/i });
    fireEvent.click(prepareAnotherBtn);

    expect(
      screen.getByRole('heading', { level: 1, name: /What claim shall be examined\?/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Claim proposition to be examined/i)).toHaveValue('');
  });

  it('triggers onBackToThreshold when back button is clicked', () => {
    render(<CaseDossier onBackToThreshold={mockOnBackToThreshold} />);

    const backBtn = screen.getByTitle(/Return to The Threshold/i);
    fireEvent.click(backBtn);
    expect(mockOnBackToThreshold).toHaveBeenCalledTimes(1);
  });
});
