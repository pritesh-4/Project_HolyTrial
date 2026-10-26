import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LandingPage } from '../components/LandingPage';
import { getCinematicEngine, destroyCinematicEngine } from '../components/CinematicEngine';

describe('LandingPage — Holy Trial Interactive Prologue', () => {
  afterEach(() => {
    // Keep the per-file singleton isolated between tests
    destroyCinematicEngine();
  });

  it('renders no navbar, no early CTAs, no explanatory text', () => {
    render(<LandingPage />);

    // No navbar elements
    expect(screen.queryByText('HYPE COURT')).not.toBeInTheDocument();
    expect(screen.queryByText('CHAMBER: ACTIVE')).not.toBeInTheDocument();
    expect(screen.queryByText('3D WORLD')).not.toBeInTheDocument();
    expect(screen.queryByText('2D MODE')).not.toBeInTheDocument();

    // No early CTAs
    expect(screen.queryByRole('button', { name: /ENTER THE TRIBUNAL/i })).not.toBeInTheDocument();
    expect(screen.queryByText('examine the charter')).not.toBeInTheDocument();

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

  it('reveals ENTER THE COURT and the charter link once the timeline completes', async () => {
    render(<LandingPage />);

    // Phase-gated: neither control exists before the finale
    expect(screen.queryByRole('button', { name: /ENTER THE COURT/i })).not.toBeInTheDocument();
    expect(screen.queryByText('examine the charter')).not.toBeInTheDocument();

    // Drive the real engine — vs. waiting on the rAF loop (~7.5 s), the
    // engine's clock is delta-based, so feeding it wholesale is honest and
    // fast; the throttled React snapshot (≈15 fps rAF) catches up on its own.
    const engine = getCinematicEngine();
    act(() => {
      for (let i = 0; i < 1350; i++) engine.update(1 / 60);
    });

    const cta = await screen.findByRole('button', { name: /ENTER THE COURT/i });
    expect(cta).toBeInTheDocument();
    // The charter link is the single subordinate information control, and it
    // appears only alongside the final CTA (never during the cinematic)
    expect(await screen.findByText('examine the charter')).toBeInTheDocument();
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
