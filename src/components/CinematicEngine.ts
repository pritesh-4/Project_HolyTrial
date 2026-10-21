/**
 * CinematicEngine — Autonomous Narrative State Machine
 *
 * Replaces scroll-driven story progression with a real-time cinematic controller.
 * Manages narrative acts, camera targets, interaction overlays, player choices
 * and timing — all independent of scroll position and frame rate.
 *
 * ⏱ Master timeline budget: the complete automatic cinematic runs
 * 7.5 s (max 8 s), from the first visible frame to the final CTA reveal.
 * Interactions are OVERLAYS on the timeline — they never pause, extend,
 * or restart the automatic sequence (see "Interaction Windows").
 *
 * The engine owns:
 *   - Current narrative act
 *   - Elapsed time within the act (delta-time based, clamped)
 *   - Camera position / target intent
 *   - Interaction state (inspection overlays, cross-exam decision window)
 *   - Player choices and inspection states
 *   - Audio event triggers
 *   - Final completion state
 */

// ── Narrative Acts ──────────────────────────────────────────────────────
export const NarrativeAct = {
  INITIALIZING: 'INITIALIZING',
  OPENING: 'OPENING', // 0.0–0.8 s — The Void: monumental environment revealed
  AWAKENING: 'AWAKENING', // 0.8–1.8 s — claim object awakens
  EVIDENCE: 'EVIDENCE', // 1.8–3.2 s — evidence artifacts arrive & align
  OPPOSITION: 'OPPOSITION', // 3.2–4.6 s — adversarial structure enters & clashes
  WEIGHING: 'WEIGHING', // 4.6–5.8 s — mechanism settles into readable arrangement
  REVELATION: 'REVELATION', // 5.8–6.9 s — gate releases and opens
  FINALE: 'FINALE', // 6.9–7.5 s — camera settles, CTA fades in
  COMPLETED: 'COMPLETED', // stable idle state (no replay)

  // Interaction-mode labels (overlays; never part of the automatic timeline)
  CLAIM: 'CLAIM',
  INSPECTING_EVIDENCE: 'INSPECTING_EVIDENCE',
  CROSS_EXAMINATION: 'CROSS_EXAMINATION',
  DECISION_WINDOW: 'DECISION_WINDOW',
} as const;
export type NarrativeAct = (typeof NarrativeAct)[keyof typeof NarrativeAct];

// ── Evidence Artifact Types ─────────────────────────────────────────────
export type EvidenceId = 'supporting' | 'contradictory' | 'incomplete';

export interface EvidenceState {
  inspected: boolean;
  inspectOrder: number; // 0 = not inspected, 1/2/3 = order
  aligned: boolean; // specifically for cross-exam alignment
}

// ── Player Choice ───────────────────────────────────────────────────────
export type CrossExamChoice = 'align_support' | 'expose_contradiction' | null;

// ── Full Cinematic State ────────────────────────────────────────────────
export interface CinematicState {
  act: NarrativeAct;
  actElapsed: number; // seconds since entering this act
  totalElapsed: number; // seconds since cinematic began
  progress: number; // 0.0 to 1.0, for backward compat with 3D components

  // Interaction (overlay state — does not gate the timeline)
  isInteracting: boolean;
  interactionTarget: EvidenceId | 'claim' | null;
  claimInspected: boolean;
  claimHovered: boolean;

  // Evidence
  evidence: Record<EvidenceId, EvidenceState>;
  nextInspectOrder: number;
  activeEvidenceInspect: EvidenceId | null;

  // Cross-examination
  crossExamChoice: CrossExamChoice;
  decisionWindowActive: boolean;

  // Completion
  gateOpen: boolean;
  ctaVisible: boolean;
  isEntering: boolean;

  // Title
  titleOpacity: number;

  // Audio triggers (consumed by useCinematic loop) — `pendingAudioPans` runs
  // parallel to `pendingAudioEvents` (stereo position, -1 left … +1 right; 0
  // omitted = cue's default center).
  pendingAudioEvents: string[];
  pendingAudioPans: number[];

  // Reduced motion
  reducedMotion: boolean;

  // Paused (tab hidden)
  paused: boolean;
}

// ── Master timeline budget (seconds) — total = 7.5 ─────────────────────
// Choreography: 0.0–0.7 The Impact of Arrival · 0.7–1.8 The Claim ·
// 1.8–3.1 Evidence Emerges · 3.1–4.5 The Challenge · 4.5–5.7 The Tribunal
// Responds · 5.7–6.9 The Gate · 6.9–7.5 The Invitation (CTA).
const CINEMATIC_TOTAL_SECONDS = 7.5;
const CTA_REVEAL_AT = 0.15; // seconds into FINALE (≈7.05 s elapsed)

const ACT_DURATIONS: Partial<Record<NarrativeAct, number>> = {
  [NarrativeAct.OPENING]: 0.7, // 0.0–0.7  arrival impact
  [NarrativeAct.AWAKENING]: 1.1, // 0.7–1.8 claim awakens the machine
  [NarrativeAct.EVIDENCE]: 1.3, // 1.8–3.1 evidence emerges & relates
  [NarrativeAct.OPPOSITION]: 1.4, // 3.1–4.5 the challenge strikes
  [NarrativeAct.WEIGHING]: 1.2, // 4.5–5.7 tribunal responds
  [NarrativeAct.REVELATION]: 1.2, // 5.7–6.9 gate releases & opens
  [NarrativeAct.FINALE]: 0.6, // 6.9–7.5 invitation / stable idle
};

// ── Interaction Windows (acts during which an interaction is available) ─
// Interactions never advance or pause the timeline; they only layer
// camera framing and local object responses on top of the master clock.
interface InteractionWindows {
  claimInspect: readonly NarrativeAct[];
  evidenceInspect: readonly NarrativeAct[];
  decision: readonly NarrativeAct[];
}

const INTERACTION_WINDOWS: InteractionWindows = {
  claimInspect: [
    NarrativeAct.OPENING,
    NarrativeAct.AWAKENING,
    NarrativeAct.EVIDENCE,
    NarrativeAct.OPPOSITION,
    NarrativeAct.WEIGHING,
    NarrativeAct.REVELATION,
    NarrativeAct.FINALE,
    NarrativeAct.COMPLETED,
  ],
  evidenceInspect: [
    NarrativeAct.EVIDENCE,
    NarrativeAct.OPPOSITION,
    NarrativeAct.WEIGHING,
    NarrativeAct.REVELATION,
    NarrativeAct.FINALE,
    NarrativeAct.COMPLETED,
  ],
  decision: [NarrativeAct.OPPOSITION, NarrativeAct.WEIGHING, NarrativeAct.REVELATION],
};

/** True while the cross-exam choice is still open (visual cue state). */
function isDecisionWindowOpen(act: NarrativeAct, chosen: CrossExamChoice): boolean {
  return crossExamWindow.includes(act) && chosen === null;
}

const crossExamWindow = INTERACTION_WINDOWS.decision;

// ── Progress Mapping (for 3D compatibility) ─────────────────────────────
// Act boundaries are exact wall-clock fractions (elapsed s = boundary × 7.5);
// WITHIN each act progress is smoothstepped for cinematic easing. Scene
// windows stay monotonic across act edges and are never frame- or
// scroll-coupled.
const ACT_PROGRESS_RANGES: Record<NarrativeAct, [number, number]> = {
  [NarrativeAct.INITIALIZING]: [0.0, 0.0],
  [NarrativeAct.OPENING]: [0.0, 0.0933], // 0–0.7 s
  [NarrativeAct.AWAKENING]: [0.0933, 0.24], // 0.7–1.8
  [NarrativeAct.EVIDENCE]: [0.24, 0.4133], // 1.8–3.1
  [NarrativeAct.OPPOSITION]: [0.4133, 0.6], // 3.1–4.5
  [NarrativeAct.WEIGHING]: [0.6, 0.76], // 4.5–5.7
  [NarrativeAct.REVELATION]: [0.76, 0.92], // 5.7–6.9
  [NarrativeAct.FINALE]: [0.92, 1.0], // 6.9–7.5
  [NarrativeAct.COMPLETED]: [1.0, 1.0],
  // Interaction-mode labels (not reached by the timeline)
  [NarrativeAct.CLAIM]: [0.0, 0.0],
  [NarrativeAct.INSPECTING_EVIDENCE]: [0.0, 0.0],
  [NarrativeAct.CROSS_EXAMINATION]: [0.0, 0.0],
  [NarrativeAct.DECISION_WINDOW]: [0.0, 0.0],
};

// ── Initial State ───────────────────────────────────────────────────────
function createInitialState(): CinematicState {
  return {
    act: NarrativeAct.INITIALIZING,
    actElapsed: 0,
    totalElapsed: 0,
    progress: 0,

    isInteracting: false,
    interactionTarget: null,
    claimInspected: false,
    claimHovered: false,

    evidence: {
      supporting: { inspected: false, inspectOrder: 0, aligned: false },
      contradictory: { inspected: false, inspectOrder: 0, aligned: false },
      incomplete: { inspected: false, inspectOrder: 0, aligned: false },
    },
    nextInspectOrder: 1,
    activeEvidenceInspect: null,

    crossExamChoice: null,
    decisionWindowActive: false,

    gateOpen: false,
    ctaVisible: false,
    isEntering: false,

    titleOpacity: 0,
    pendingAudioEvents: [],
    pendingAudioPans: [],
    reducedMotion: false,
    paused: false,
  };
}

// ── Cinematic Engine Class ──────────────────────────────────────────────
type StateChangeCallback = (state: CinematicState) => void;

export class CinematicEngine {
  private state: CinematicState;
  private listeners: Set<StateChangeCallback> = new Set();
  private lastActForAudio: NarrativeAct = NarrativeAct.INITIALIZING;

  constructor() {
    this.state = createInitialState();

    // Detect reduced motion preference
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.state.reducedMotion = Boolean(mq?.matches);
        mq?.addEventListener?.('change', (e) => {
          this.state.reducedMotion = e.matches;
        });
      } catch {
        // Fallback for environments with partial matchMedia support
      }
    }
  }

  // ── Subscription ────────────────────────────────────────────────────
  subscribe(callback: StateChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    const snapshot = { ...this.state } as CinematicState;
    snapshot.evidence = {
      supporting: { ...this.state.evidence.supporting },
      contradictory: { ...this.state.evidence.contradictory },
      incomplete: { ...this.state.evidence.incomplete },
    };
    snapshot.pendingAudioEvents = [...this.state.pendingAudioEvents];
    snapshot.pendingAudioPans = [...this.state.pendingAudioPans];
    for (const cb of this.listeners) cb(snapshot);
  }

  getState(): CinematicState {
    return { ...this.state };
  }

  // ── Core Update Loop (called from useFrame or rAF) ──────────────────
  // delta-time based: a dropped/slow frame can never stretch the cinematic —
  // elapsed time is derived from real seconds, and delta is clamped so tab
  // restoration cannot skip story states (events still fire in order).
  update(delta: number): void {
    if (this.state.paused) return;

    const dt = Math.min(delta, 0.1);

    this.state.totalElapsed += dt;
    this.state.pendingAudioEvents = [];
    this.state.pendingAudioPans = [];
    this.state.actElapsed += dt;

    this.processActTransition();
    this.updateProgress();
    this.updateTitle();
    this.updateCompletionFlags();
    this.triggerActAudio();

    this.notify();
  }

  // ── Act Transition Logic (the authoritative master clock) ───────────
  private processActTransition(): void {
    const { act, actElapsed } = this.state;

    if (act === NarrativeAct.INITIALIZING) {
      this.transitionTo(NarrativeAct.OPENING);
      return;
    }

    const duration = ACT_DURATIONS[act];
    if (duration === undefined) return; // interaction labels never hit this

    // Reduced motion: the narrative keeps its full natural pacing (calmer,
    // not sprinted); micro-motion amplitude is damped scene-side via
    // `state.reducedMotion`.
    const effectiveDuration = duration;

    if (actElapsed >= effectiveDuration) {
      const nextAct = this.getNextAct(act);
      if (nextAct) this.transitionTo(nextAct);
    }
  }

  private getNextAct(current: NarrativeAct): NarrativeAct | null {
    switch (current) {
      case NarrativeAct.OPENING:
        return NarrativeAct.AWAKENING;
      case NarrativeAct.AWAKENING:
        return NarrativeAct.EVIDENCE;
      case NarrativeAct.EVIDENCE:
        return NarrativeAct.OPPOSITION;
      case NarrativeAct.OPPOSITION:
        return NarrativeAct.WEIGHING;
      case NarrativeAct.WEIGHING:
        return NarrativeAct.REVELATION;
      case NarrativeAct.REVELATION:
        return NarrativeAct.FINALE;
      case NarrativeAct.FINALE:
        return NarrativeAct.COMPLETED;
      default:
        return null;
    }
  }

  private transitionTo(act: NarrativeAct): void {
    this.state.act = act;
    this.state.actElapsed = 0;

    switch (act) {
      case NarrativeAct.OPPOSITION:
        // Cross-exam choice opens automatically — never blocks the clock
        this.state.decisionWindowActive = this.state.crossExamChoice === null;
        break;
      case NarrativeAct.FINALE:
        // Camera settles here; lingering inspection layouts release
        this.state.isInteracting = false;
        this.state.interactionTarget = null;
        this.state.activeEvidenceInspect = null;
        break;
      case NarrativeAct.REVELATION:
        this.state.gateOpen = true;
        break;
      case NarrativeAct.COMPLETED:
        this.state.ctaVisible = true;
        break;
    }
  }

  // ── Progress Mapping ────────────────────────────────────────────────
  private updateProgress(): void {
    const { act, actElapsed } = this.state;
    const range = ACT_PROGRESS_RANGES[act];
    const duration = ACT_DURATIONS[act] ?? 1;

    const t = Math.min(1, actElapsed / duration);
    // Smoothstep for cinematic feel within each act
    const s = t * t * (3 - 2 * t);

    this.state.progress = range[0] + (range[1] - range[0]) * s;
  }

  // ── Title Opacity — HOLY TRIAL appears with the arrival impact ──────
  // Window: progress 0.06–0.20 → ≈0.45 s–1.5 s elapsed (arrival → claim)
  private updateTitle(): void {
    const p = this.state.progress;
    const T_IN = 0.06,
      T_PEAK = 0.1,
      T_OUT = 0.2;
    if (p >= T_IN && p <= T_OUT) {
      this.state.titleOpacity =
        p < T_PEAK ? (p - T_IN) / (T_PEAK - T_IN) : 1 - (p - T_PEAK) / (T_OUT - T_PEAK);
      this.state.titleOpacity = Math.max(0, Math.min(1, this.state.titleOpacity));
    } else {
      this.state.titleOpacity = 0;
    }
  }

  // ── Completion Flags ────────────────────────────────────────────────
  // CTA begins fading ≈7.05 s into the run and is fully visible by ≈7.5 s.
  // Never planed earlier than the FINALE act; sound state cannot delay it.
  private updateCompletionFlags(): void {
    const { act } = this.state;

    if (act === NarrativeAct.FINALE && this.state.actElapsed >= CTA_REVEAL_AT) {
      this.state.ctaVisible = true;
    }

    // Decision window closes when the choice window leaves its acts
    this.state.decisionWindowActive = isDecisionWindowOpen(act, this.state.crossExamChoice);
  }

  // ── Audio Event Triggers (opt-in; consumed by useCinematic) ─────────
  // Stereo positions approximate each cue's apparent source in the chamber:
  // arrival streak descends on the colonnade (left), the wedge strikes from
  // the right, the gate is centered. Object-level cues (inspection, the
  // cross-exam shift) carry the source artifact's pan override.
  private queueAudioEvent(event: string, pan: number): void {
    this.state.pendingAudioEvents.push(event);
    this.state.pendingAudioPans.push(pan);
  }

  private triggerActAudio(): void {
    const { act } = this.state;
    if (act === this.lastActForAudio) return;

    switch (act) {
      case NarrativeAct.AWAKENING:
        this.queueAudioEvent('revealTexture', -0.35); // colonnade, left
        this.queueAudioEvent('claimEstablished', 0);
        break;
      case NarrativeAct.EVIDENCE:
        this.queueAudioEvent('evidenceDock', 0.15);
        break;
      case NarrativeAct.OPPOSITION:
        this.queueAudioEvent('oppositionImpact', 0.5); // wedge enters right
        break;
      case NarrativeAct.WEIGHING:
        this.queueAudioEvent('resolutionResonance', 0);
        break;
      case NarrativeAct.REVELATION:
        this.queueAudioEvent('gateSwell', 0);
        break;
    }

    this.lastActForAudio = act;
  }

  // ── Player Interactions (timeline overlays) ─────────────────────────

  /** Interaction I: Inspect the claim — never pauses the cinematic */
  inspectClaim(): void {
    if (!INTERACTION_WINDOWS.claimInspect.includes(this.state.act)) return;

    this.state.isInteracting = true;
    this.state.interactionTarget = 'claim';
    this.state.claimInspected = true;
    this.queueAudioEvent('artifactInspect', 0);
    this.notify();
  }

  hoverClaim(hovered: boolean): void {
    this.state.claimHovered = hovered;
  }

  /** End claim inspection */
  finishClaimInspect(): void {
    if (this.state.interactionTarget !== 'claim') return;
    this.state.isInteracting = false;
    this.state.interactionTarget = null;
    this.notify();
  }

  /** Interaction II: Inspect evidence artifact — overlay only */
  inspectEvidence(id: EvidenceId): void {
    if (!INTERACTION_WINDOWS.evidenceInspect.includes(this.state.act)) return;
    if (this.state.activeEvidenceInspect === id) return;

    this.state.isInteracting = true;
    this.state.interactionTarget = id;
    this.state.activeEvidenceInspect = id;

    if (!this.state.evidence[id].inspected) {
      this.state.evidence[id].inspected = true;
      this.state.evidence[id].inspectOrder = this.state.nextInspectOrder++;
    }

    // Pan follows the artifact's dock position in the chamber
    const pan = id === 'supporting' ? -0.6 : id === 'incomplete' ? -0.5 : 0.6;
    this.queueAudioEvent('artifactInspect', pan);
    this.notify();
  }

  /** End evidence inspection */
  finishEvidenceInspect(): void {
    if (!this.state.activeEvidenceInspect) return;
    this.state.activeEvidenceInspect = null;
    this.state.isInteracting = false;
    this.state.interactionTarget = null;
    this.notify();
  }

  /**
   * Interaction III: Cross-examination decision.
   * Affects the physical resolution of the mechanism — never the clock.
   * The automatic sequence proceeds on schedule either way; the chosen
   * path changes how the monolith retreats and how fragments settle.
   */
  makeDecision(choice: 'align_support' | 'expose_contradiction'): void {
    if (this.state.crossExamChoice !== null) return;
    if (!INTERACTION_WINDOWS.decision.includes(this.state.act)) return;

    this.state.crossExamChoice = choice;
    this.state.decisionWindowActive = false;
    this.state.isInteracting = true;
    this.state.interactionTarget = choice === 'align_support' ? 'supporting' : 'contradictory';

    this.queueAudioEvent('mechanismShift', choice === 'align_support' ? -0.4 : 0.4);

    // Mark the chosen evidence as aligned
    if (choice === 'align_support') {
      this.state.evidence.supporting.aligned = true;
    } else {
      this.state.evidence.contradictory.aligned = true;
    }

    this.notify();
  }

  /**
   * Release the cross-exam camera hold (e.g. via Escape). The choice itself
   * persists — only the camera interaction framing is released so the story
   * trajectory can proceed before the finale naturally clears it.
   */
  releaseDecisionHold(): void {
    if (this.state.crossExamChoice === null) return;
    if (!this.state.isInteracting || this.state.activeEvidenceInspect !== null) return;

    this.state.isInteracting = false;
    this.state.interactionTarget = null;
    this.notify();
  }

  /** Enter court after completing the cinematic */
  enterCourt(): void {
    if (!this.state.ctaVisible) return;
    this.state.isEntering = true;
    this.queueAudioEvent('gavelChime', 0);
    this.notify();
  }

  // ── Lifecycle ───────────────────────────────────────────────────────

  start(): void {
    if (this.state.act === NarrativeAct.INITIALIZING) {
      this.transitionTo(NarrativeAct.OPENING);
      this.notify();
    }
  }

  pause(): void {
    this.state.paused = true;
    this.notify();
  }

  resume(): void {
    this.state.paused = false;
    this.notify();
  }

  reset(): void {
    this.state = createInitialState();
    this.lastActForAudio = NarrativeAct.INITIALIZING;
    this.notify();
  }

  destroy(): void {
    this.listeners.clear();
  }
}

// ── Singleton for the landing page ──────────────────────────────────────
let engineInstance: CinematicEngine | null = null;

export function getCinematicEngine(): CinematicEngine {
  if (!engineInstance) {
    engineInstance = new CinematicEngine();
  }
  return engineInstance;
}

export function destroyCinematicEngine(): void {
  if (engineInstance) {
    engineInstance.destroy();
    engineInstance = null;
  }
}

export { CINEMATIC_TOTAL_SECONDS };
