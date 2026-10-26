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
export type InspectTarget = 'none' | 'case_file' | 'monitor' | 'access_record' | 'compare';

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

  // The Room Was Never Empty: Forensic Investigation State
  activeInspect: InspectTarget;
  monitorTimeIndex: number; // 0: 21:13:50, 1: 21:14:00, 2: 21:14:03 (anomaly), 3: 21:14:15
  anomalyDiscovered: boolean;
  compareActive: boolean;

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

  // Audio triggers (consumed by useCinematic loop)
  pendingAudioEvents: string[];
  pendingAudioPans: number[];

  // Reduced motion
  reducedMotion: boolean;

  // Paused (tab hidden)
  paused: boolean;
}

// ── Master timeline budget (seconds) — total = 18.8 (18–21s range) ─────
// The Room Was Never Empty Storyboard (re-cut: ~10% idle redundancy
// removed; every beat keeps its comprehension pause):
// 0.0–2.7s Rain and Arrival · 2.7–5.9s The Case File · 5.9–9.3s The First Account (CCTV View)
// 9.3–12.7s The Contradiction & Anomaly · 12.7–15.2s Something Does Not Fit · 15.2–17.55s The Tribunal
// 17.55–18.8s The Invitation (CTA).
const CINEMATIC_TOTAL_SECONDS = 18.8;
const CTA_REVEAL_AT = 0.3; // seconds into FINALE (≈17.85s elapsed)

const ACT_DURATIONS: Partial<Record<NarrativeAct, number>> = {
  [NarrativeAct.OPENING]: 2.7, // 0.0–2.7s rain on glass, dark archive, practical lamp clicks on
  [NarrativeAct.AWAKENING]: 3.2, // 2.7–5.9s case folder opens: "THE ROOM WAS EMPTY AT 21:14"
  [NarrativeAct.EVIDENCE]: 3.4, // 5.9–9.3s authentic CCTV surveillance feed: vacant chamber at 21:14:00
  [NarrativeAct.OPPOSITION]: 3.4, // 9.3–12.7s access record 21:14:03 + silhouette anomaly revealed
  [NarrativeAct.WEIGHING]: 2.5, // 12.7–15.2s table overview: contradiction tension, shadow on glass
  [NarrativeAct.REVELATION]: 2.35, // 15.2–17.55s glide to grand tribunal chamber, doors unlock
  [NarrativeAct.FINALE]: 1.25, // 17.55–18.8s camera settles, HOLY TRIAL title, final CTA appears
};

// ── Interaction Windows ────────────────────────────────────────────────
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

// ── Progress Mapping ────────────────────────────────────────────────────
const ACT_PROGRESS_RANGES: Record<NarrativeAct, [number, number]> = {
  [NarrativeAct.INITIALIZING]: [0.0, 0.0],
  [NarrativeAct.OPENING]: [0.0, 0.1436], // 0.0–2.7s
  [NarrativeAct.AWAKENING]: [0.1436, 0.3138], // 2.7–5.9s
  [NarrativeAct.EVIDENCE]: [0.3138, 0.4947], // 5.9–9.3s
  [NarrativeAct.OPPOSITION]: [0.4947, 0.6755], // 9.3–12.7s
  [NarrativeAct.WEIGHING]: [0.6755, 0.8085], // 12.7–15.2s
  [NarrativeAct.REVELATION]: [0.8085, 0.9333], // 15.2–17.55s
  [NarrativeAct.FINALE]: [0.9333, 1.0], // 17.55–18.8s
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

    activeInspect: 'none',
    monitorTimeIndex: 1, // 21:14:00 default
    anomalyDiscovered: false,
    compareActive: false,

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

  // ── Title Opacity — HOLY TRIAL appears with the final tribunal invitation ──
  // Window: progress >= 0.9333 (FINALE, ≈17.55s–18.8s elapsed)
  private updateTitle(): void {
    const p = this.state.progress;
    if (p >= 0.93) {
      this.state.titleOpacity = Math.min(1, (p - 0.93) / 0.05);
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
      case NarrativeAct.OPENING:
        this.queueAudioEvent('lampSwitch', 0);
        break;
      case NarrativeAct.AWAKENING:
        this.queueAudioEvent('fileSlideOpen', -0.2);
        this.queueAudioEvent('claimEstablished', 0);
        break;
      case NarrativeAct.EVIDENCE:
        this.queueAudioEvent('monitorCrt', 0.25);
        this.queueAudioEvent('evidenceDock', 0.15);
        break;
      case NarrativeAct.OPPOSITION:
        this.queueAudioEvent('timestampClick', 0.3);
        this.queueAudioEvent('anomalyChime', 0);
        this.queueAudioEvent('oppositionImpact', 0.5);
        break;
      case NarrativeAct.WEIGHING:
        this.queueAudioEvent('resolutionResonance', 0);
        break;
      case NarrativeAct.REVELATION:
        this.queueAudioEvent('doorLatchRelease', 0);
        this.queueAudioEvent('gateSwell', 0);
        break;
    }

    this.lastActForAudio = act;
  }

  // ── Realistic Forensic Investigation Methods ────────────────────────

  /**
   * Inspect a specific object on the desk (case_file, monitor,
   * access_record, compare). The forensic desk only exists once the autoplay
   * has settled, so mid-film keystrokes are ignored — a stray key must never
   * obscure the directed 18.8 s sequence. Escape ('none') always resets.
   */
  inspectObject(target: InspectTarget): void {
    const postCinematic =
      this.state.ctaVisible ||
      this.state.act === NarrativeAct.FINALE ||
      this.state.act === NarrativeAct.COMPLETED;
    if (target !== 'none' && !postCinematic) return;
    if (this.state.activeInspect === target && target !== 'none') return;

    this.state.activeInspect = target;
    this.state.isInteracting = target !== 'none';

    if (target === 'case_file') {
      this.state.interactionTarget = 'claim';
      this.state.claimInspected = true;
      this.queueAudioEvent('fileSlideOpen', -0.2);
    } else if (target === 'monitor') {
      this.state.interactionTarget = 'supporting';
      this.state.evidence.supporting.inspected = true;
      this.queueAudioEvent('monitorCrt', 0.25);
    } else if (target === 'access_record') {
      this.state.interactionTarget = 'contradictory';
      this.state.evidence.contradictory.inspected = true;
      this.queueAudioEvent('timestampClick', 0.3);
    } else if (target === 'compare') {
      this.state.compareActive = true;
      this.state.interactionTarget = 'contradictory';
      this.queueAudioEvent('anomalyChime', 0);
    } else {
      this.state.interactionTarget = null;
      this.state.compareActive = false;
      this.state.activeEvidenceInspect = null;
    }

    this.notify();
  }

  /** Scrub surveillance monitor timeline (0 = 21:13:50, 1 = 21:14:00, 2 = 21:14:03 anomaly, 3 = 21:14:15) */
  setMonitorScrub(timeIndex: number): void {
    const clamped = Math.max(0, Math.min(3, timeIndex));
    this.state.monitorTimeIndex = clamped;
    this.queueAudioEvent('scrubClick', 0);

    if (clamped === 2 && !this.state.anomalyDiscovered) {
      this.state.anomalyDiscovered = true;
      this.queueAudioEvent('anomalyChime', 0);
    }

    this.notify();
  }

  // ── Player Interactions (timeline overlays & backward compat) ───────

  /** Interaction I: Inspect the claim / case file */
  inspectClaim(): void {
    if (!INTERACTION_WINDOWS.claimInspect.includes(this.state.act)) return;

    this.state.isInteracting = true;
    this.state.interactionTarget = 'claim';
    this.state.activeInspect = 'case_file';
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
    this.state.activeInspect = 'none';
    this.notify();
  }

  /** Interaction II: Inspect evidence artifact */
  inspectEvidence(id: EvidenceId): void {
    if (!INTERACTION_WINDOWS.evidenceInspect.includes(this.state.act)) return;
    if (this.state.activeEvidenceInspect === id) return;

    this.state.isInteracting = true;
    this.state.interactionTarget = id;
    this.state.activeEvidenceInspect = id;

    if (id === 'supporting') {
      this.state.activeInspect = 'monitor';
    } else if (id === 'contradictory') {
      this.state.activeInspect = 'access_record';
    } else {
      this.state.activeInspect = 'case_file';
    }

    if (!this.state.evidence[id].inspected) {
      this.state.evidence[id].inspected = true;
      this.state.evidence[id].inspectOrder = this.state.nextInspectOrder++;
    }

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
    this.state.activeInspect = 'none';
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
