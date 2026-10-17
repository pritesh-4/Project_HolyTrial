import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LandingPage } from '../components/LandingPage';

describe('LandingPage — The Obsidian Tribunal', () => {
  it('renders the sacred motto and monumental heading', () => {
    render(<LandingPage />);

    expect(screen.getByText('EVERY CLAIM HAS A CASE.')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /The Obsidian Tribunal/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/An adversarial court of inquiry/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ENTER THE COURT/i })).toBeInTheDocument();
  });

  it('renders the Court Seal and telemetry metadata', () => {
    render(<LandingPage />);

    expect(screen.getByRole('img', { name: /Seal of the Obsidian Tribunal/i })).toBeInTheDocument();
    expect(screen.getByText(/HYPE COURT/i)).toBeInTheDocument();
    expect(screen.getByText(/TAVILY EVIDENCE LEDGER/i)).toBeInTheDocument();
    expect(screen.getByText(/ACT I: THE THRESHOLD/i)).toBeInTheDocument();
  });

  it('triggers the entrance interaction and transitions into the Case Dossier', async () => {
    vi.useFakeTimers();
    render(<LandingPage />);

    const enterButton = screen.getByRole('button', { name: /ENTER THE COURT/i });
    fireEvent.click(enterButton);

    // Fast-forward through the camera glide delay (650ms)
    act(() => {
      vi.advanceTimersByTime(750);
    });

    // Verify Case Dossier screen is visible
    expect(screen.getByText('CASE DOSSIER')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /What claim shall be examined\?/i })
    ).toBeInTheDocument();

    // Click Return to Threshold button
    const returnButton = screen.getByTitle(/Return to The Threshold/i);
    fireEvent.click(returnButton);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Verify back on Threshold landing page
    expect(
      screen.getByRole('heading', { level: 1, name: /The Obsidian Tribunal/i })
    ).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('opens and dismisses the Court Charter drawer', () => {
    render(<LandingPage />);

    const charterButton = screen.getByRole('button', { name: /EXAMINE CHARTER/i });
    fireEvent.click(charterButton);

    expect(screen.getByText(/The Doctrine of Scrutiny/i)).toBeInTheDocument();
    expect(screen.getByText(/The Seven Acts of Court/i)).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: /DISMISS CHARTER/i });
    fireEvent.click(dismissButton);
  });
});
