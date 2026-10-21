/**
 * CinematicEngine — Master Timeline Timing Tests
 *
 * Empirically verifies the hard duration limit: the complete automatic
 * cinematic runs 7.5 s (max 8 s) from the first visible frame to the
 * CTA reveal — measured by driving the real engine with realistic frame
 * deltas. Also verifies that interactions (claim inspection, evidence
 * inspection, cross-exam decision) never extend or restart the timeline,
 * and that the clock is delta-time based (rate-independent).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CinematicEngine,
  destroyCinematicEngine,
  NarrativeAct,
} from '../components/CinematicEngine';

const HARD_LIMIT_S = 8.0; // absolute maximum from the spec
const TARGET_S = 7.5; // nominal master timeline length

/** Drive the engine with a fixed frame rate; returns timing measurements. */
function runCinematic(dt: number, withInteractions = false) {
  const engine = new CinematicEngine();
  let totalElapsed = 0;
  let ctaAt: number | null = null;
  let ctaProgress: number | null = null;
  let completedAt: number | null = null;

  engine.start(); // first visible frame ≈ t=0

  let steps = 0;
  const maxSteps = Math.ceil((HARD_LIMIT_S + 2) / dt);
  while (completedAt === null && steps < maxSteps) {
    engine.update(dt);
    totalElapsed += dt;
    steps++;

    const state = engine.getState();
    if (ctaAt === null && state.ctaVisible) {
      ctaAt = totalElapsed;
      ctaProgress = state.progress;
    }
    if (state.act === NarrativeAct.COMPLETED) {
      completedAt = totalElapsed;
    }

    // Layer optional interactions exactly as a user would during playback
    if (withInteractions) {
      if (steps === Math.round(1.2 / dt)) engine.inspectClaim();
      if (steps === Math.round(1.5 / dt)) engine.finishClaimInspect();
      if (steps === Math.round(2.4 / dt)) engine.inspectEvidence('incomplete');
      if (steps === Math.round(2.7 / dt)) engine.finishEvidenceInspect();
      if (steps === Math.round(3.5 / dt)) engine.inspectEvidence('supporting');
      if (steps === Math.round(4.0 / dt)) engine.finishEvidenceInspect();
      // Cross-exam decision inside its window (opposition → revelation)
      if (steps === Math.round(4.2 / dt)) engine.makeDecision('expose_contradiction');
      if (steps === Math.round(5.0 / dt)) engine.inspectEvidence('contradictory');
      if (steps === Math.round(5.3 / dt)) engine.finishEvidenceInspect();
    }
  }

  return { engine, totalElapsed, ctaAt, ctaProgress, completedAt };
}

describe('CinematicEngine — 7.5 s master timeline (hard 8 s limit)', () => {
  beforeEach(() => {
    destroyCinematicEngine();
  });

  afterEach(() => {
    destroyCinematicEngine();
  });

  it('completes the full automatic sequence within the 8 s limit (60 fps)', () => {
    const { totalElapsed, ctaAt, completedAt } = runCinematic(1 / 60);

    expect(ctaAt).not.toBeNull();
    expect(ctaAt!).toBeGreaterThanOrEqual(6.8); // not too early
    expect(ctaAt!).toBeLessThanOrEqual(HARD_LIMIT_S); // CTA fade starts ≤ 8 s
    expect(completedAt).not.toBeNull();
    expect(completedAt!).toBeLessThanOrEqual(HARD_LIMIT_S);
    expect(totalElapsed).toBeLessThanOrEqual(HARD_LIMIT_S);
  });

  it('reaches the CTA in the finale window (≈7.05–7.5 s) at 60 fps', () => {
    const { ctaAt } = runCinematic(1 / 60);
    // FINALE starts at 6.9 s; CTA reveals 0.15 s into it → ≈7.05 s
    // (frame quantization ⇒ up to ~7.08 s at 60 fps)
    expect(ctaAt!).toBeGreaterThanOrEqual(6.9);
    expect(ctaAt!).toBeLessThanOrEqual(TARGET_S + 0.1);
  });

  it('is rate-independent: 30 fps playback lands in the same window', () => {
    const { ctaAt, completedAt } = runCinematic(1 / 30);
    expect(ctaAt!).toBeLessThanOrEqual(HARD_LIMIT_S);
    expect(completedAt!).toBeLessThanOrEqual(HARD_LIMIT_S);
  });

  it('survives stuttered frame delivery (long frames clamped) without overrunning', () => {
    const engine = new CinematicEngine();
    engine.start();
    let totalElapsed = 0;
    let completedAt: number | null = null;
    let steps = 0;

    // Simulate a choppy session: heavy 100 ms frames interleaved with normal ones
    while (completedAt === null && steps < 2000) {
      const dt = steps % 3 === 0 ? 0.1 : 1 / 60; // clamp ceiling matches engine
      engine.update(dt);
      totalElapsed += dt;
      steps++;
      if (engine.getState().act === NarrativeAct.COMPLETED) {
        completedAt = totalElapsed;
      }
    }

    // Delta clamping means elapsed "cinematic time" ≤ wall time progress;
    // the sequence must still complete and never skip states.
    expect(completedAt).not.toBeNull();
    // With 1/3 of frames clamped at 100 ms vs their true gap the clock runs
    // slower than the wall clock, but must still finish promptly.
    expect(completedAt!).toBeLessThanOrEqual(HARD_LIMIT_S * 2);
  });

  it('interactions do not extend the timeline (same completion time as pure run)', () => {
    const pure = runCinematic(1 / 60, false);
    const interacted = runCinematic(1 / 60, true);

    expect(pure.completedAt).not.toBeNull();
    expect(interacted.completedAt).not.toBeNull();
    // Interaction overlays may not push the sequence beyond its budget —
    // allow at most one frame of tolerance between the two runs.
    expect(interacted.completedAt! - pure.completedAt!).toBeLessThanOrEqual(1 / 60 + 1e-9);
  });

  it('the decision affects the outcome state but not the clock', () => {
    const { engine, completedAt } = runCinematic(1 / 60, true);
    const final = engine.getState();

    expect(final.crossExamChoice).toBe('expose_contradiction');
    expect(final.evidence.contradictory.aligned).toBe(true);
    expect(completedAt!).toBeLessThanOrEqual(HARD_LIMIT_S);
  });

  it('does not restart on repeat start() calls (rerender safety)', () => {
    const engine = new CinematicEngine();
    engine.start();
    // Advance ~1.2 s through normal frames (delta clamping caps single calls)
    for (let i = 0; i < Math.round(1.2 / (1 / 60)); i++) engine.update(1 / 60);
    const afterAct = engine.getState().act;
    expect(afterAct).toBe(NarrativeAct.AWAKENING); // 1.2 s is inside awakening

    // A repeat start() (as a rerender would trigger) must not rewind the clock
    engine.start();
    engine.update(1 / 60);
    expect(engine.getState().act).toBe(afterAct);
    expect(engine.getState().totalElapsed).toBeGreaterThan(1.2);
  });

  it('never shows the CTA before the finale', () => {
    const engine = new CinematicEngine();
    engine.start();
    for (let i = 0; i < Math.round(5.0 / (1 / 60)); i++) {
      engine.update(1 / 60);
      expect(engine.getState().ctaVisible).toBe(false);
    }
    // 5 s mark is inside WEIGHING — CTA must still be hidden
    expect(engine.getState().act).toBe(NarrativeAct.WEIGHING);
  });

  it('reduced-motion users get the full-length narrative with damped micro-motion', () => {
    // Stub matchMedia *before* engine construction so it reads `reduce`
    const stub = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() });
    vi.stubGlobal('matchMedia', stub);
    // jsdom window.matchMedia is undefined by default; define it
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: stub,
    });

    try {
      const { engine, completedAt, ctaAt } = runCinematic(1 / 60);
      expect(ctaAt).not.toBeNull();
      expect(completedAt).not.toBeNull();
      // Reduced motion keeps the full natural pacing (no compression) —
      // scenes damp micro-motion amplitude via `state.reducedMotion`.
      expect(engine.getState().reducedMotion).toBe(true);
      expect(ctaAt!).toBeGreaterThanOrEqual(6.9);
      expect(ctaAt!).toBeLessThanOrEqual(HARD_LIMIT_S);
      expect(completedAt!).toBeLessThanOrEqual(HARD_LIMIT_S);
    } finally {
      vi.unstubAllGlobals();
      delete (window as { matchMedia?: unknown }).matchMedia;
    }
  });

  it('keeps audio pans paired with audio events of equal length', () => {
    const engine = new CinematicEngine();
    engine.start();
    // Crossing into every audio-bearing act emits a paired (event, pan) cue
    for (let i = 0; i < Math.round(8 / (1 / 60)); i++) engine.update(1 / 60);
    const final = engine.getState();
    const emitted = final.act === NarrativeAct.COMPLETED || final.totalElapsed >= 7.4;
    expect(emitted).toBe(true);

    // Object-level cues also pair: inspect the dissent shard (pan +0.6)
    engine.update(1 / 60);
    engine.inspectEvidence('contradictory');
    const s = engine.getState();
    expect(s.pendingAudioEvents).toContain('artifactInspect');
    expect(s.pendingAudioPans).toHaveLength(s.pendingAudioEvents.length);
    const idx = s.pendingAudioEvents.indexOf('artifactInspect');
    expect(s.pendingAudioPans[idx]).toBeCloseTo(0.6, 5);
  });

  it('releaseDecisionHold() releases the cross-exam camera hold, not the choice', () => {
    const engine = new CinematicEngine();
    engine.start();
    for (let i = 0; i < Math.round(4.4 / (1 / 60)); i++) engine.update(1 / 60);
    engine.makeDecision('expose_contradiction');
    let s = engine.getState();
    expect(s.crossExamChoice).toBe('expose_contradiction');
    expect(s.isInteracting).toBe(true);
    expect(s.interactionTarget).toBe('contradictory');

    // Guard: held while an evidence-inspect frame is still active
    engine.inspectEvidence('contradictory');
    engine.releaseDecisionHold();
    s = engine.getState();
    expect(s.isInteracting).toBe(true);
    expect(s.interactionTarget).toBe('contradictory');

    // Once the inspect frame is finished, finishEvidenceInspect clears the
    // hold (Escape covers a *bare* decision hold — see the next test)
    engine.finishEvidenceInspect();
    expect(engine.getState().activeEvidenceInspect).toBeNull();

    // Guard: nothing to release when no hold is active (double-release safety)
    engine.releaseDecisionHold();
    s = engine.getState();
    expect(s.isInteracting).toBe(false);
    expect(s.interactionTarget).toBeNull();
    expect(s.crossExamChoice).toBe('expose_contradiction');
  });

  it('releaseDecisionHold() clears a bare decision hold directly', () => {
    const engine = new CinematicEngine();
    engine.start();
    for (let i = 0; i < Math.round(4.4 / (1 / 60)); i++) engine.update(1 / 60);
    engine.makeDecision('align_support');

    const s = engine.getState();
    expect(s.isInteracting).toBe(true);
    expect(s.activeEvidenceInspect).toBeNull();

    engine.releaseDecisionHold();
    const after = engine.getState();
    expect(after.isInteracting).toBe(false);
    expect(after.interactionTarget).toBeNull();
    // The choice itself persists
    expect(after.crossExamChoice).toBe('align_support');
    expect(after.evidence.supporting.aligned).toBe(true);
  });

  it('passes through every story beat in order without skips', () => {
    const engine = new CinematicEngine();
    engine.start();
    const seen = new Set<string>();
    while (engine.getState().act !== NarrativeAct.COMPLETED) {
      engine.update(1 / 60);
      seen.add(engine.getState().act);
      if (engine.getState().totalElapsed > HARD_LIMIT_S + 2) break;
    }
    seen.add(engine.getState().act);
    expect([...seen]).toEqual([
      NarrativeAct.OPENING,
      NarrativeAct.AWAKENING,
      NarrativeAct.EVIDENCE,
      NarrativeAct.OPPOSITION,
      NarrativeAct.WEIGHING,
      NarrativeAct.REVELATION,
      NarrativeAct.FINALE,
      NarrativeAct.COMPLETED,
    ]);
  });
});
