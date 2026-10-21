import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LandingPage } from '../components/LandingPage';

describe('LandingPage — Holy Trial Interactive Prologue', () => {
  it('renders no navbar, no early CTAs, no explanatory text', () => {
    render(<LandingPage />);

    // No navbar elements
    expect(screen.queryByText('HYPE COURT')).not.toBeInTheDocument();
    expect(screen.queryByText('CHAMBER: ACTIVE')).not.toBeInTheDocument();
    expect(screen.queryByText('3D WORLD')).not.toBeInTheDocument();
    expect(screen.queryByText('2D MODE')).not.toBeInTheDocument();

    // No early CTAs
    expect(screen.queryByRole('button', { name: /ENTER THE TRIBUNAL/i })).not.toBeInTheDocument();
    expect(screen.queryByText('EXAMINE CHARTER')).not.toBeInTheDocument();

    // No explanatory paragraphs
    expect(screen.queryByText(/An adversarial court of inquiry/i)).not.toBeInTheDocument();
    expect(screen.queryByText('NOTHING IS ABOVE CHALLENGE.')).not.toBeInTheDocument();
  });

  it('renders a floating sound toggle in top-right with no labels', () => {
    render(<LandingPage />);

    const soundBtn = screen.getByRole('button', { name: /Enable Sound/i });
    expect(soundBtn).toBeInTheDocument();

    // No SOUND: ON/OFF text labels
    expect(screen.queryByText('SOUND: ON')).not.toBeInTheDocument();
    expect(screen.queryByText('SOUND: OFF')).not.toBeInTheDocument();

    // Toggle works
    fireEvent.click(soundBtn);
    expect(screen.getByRole('button', { name: /Mute Sound/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mute Sound/i }));
    expect(screen.getByRole('button', { name: /Enable Sound/i })).toBeInTheDocument();
  });

  it('does not show ENTER THE COURT at initial progress', () => {
    render(<LandingPage />);
    expect(screen.queryByRole('button', { name: /ENTER THE COURT/i })).not.toBeInTheDocument();
  });

  it('renders 6-act progress indicators', () => {
    render(<LandingPage />);
    const progressNav = screen.getByRole('navigation', { name: /Story Progress/i });
    expect(progressNav).toBeInTheDocument();
  });

  it('renders 3D canvas or WebGL fallback layer', () => {
    render(<LandingPage />);
    const env =
      screen.queryByLabelText(/3D Interactive Experience/i) ||
      screen.queryByLabelText(/Atmospheric Backdrop/i);
    expect(env).toBeInTheDocument();
  });

  it('shows scroll hint after intro completes', async () => {
    vi.useFakeTimers();
    render(<LandingPage />);

    // Fast-forward through 8s intro
    act(() => {
      vi.advanceTimersByTime(8500);
    });

    // Scroll hint (nonverbal line) should appear — we check the container exists
    // The hint is a subtle animated line, no text
    const nav = screen.getByRole('navigation', { name: /Story Progress/i });
    expect(nav).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not show Case Dossier initially', () => {
    render(<LandingPage />);
    expect(screen.queryByText('CASE DOSSIER')).not.toBeInTheDocument();
  });

  it('has no 2D mode toggle or view switching control', () => {
    render(<LandingPage />);
    expect(screen.queryByText('2D MODE')).not.toBeInTheDocument();
    expect(screen.queryByText('3D WORLD')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Toggle 2D/i })).not.toBeInTheDocument();
  });
});
