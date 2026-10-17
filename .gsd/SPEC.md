---
status: FINALIZED
created: 2026-10-17T12:50:00+05:30
finalized: 2026-10-17T12:50:00+05:30
---

# SPEC.md — Project Specification

## Vision

HolyTrial is an immersive, story-driven courtroom simulation where users submit claims, inspect real-world evidence retrieved via Tavily Search, witness adversarial prosecution and defense arguments powered by NVIDIA NIM, challenge inferences through interactive objections, and trigger retrials that produce side-by-side verdict comparisons.

---

## Goals

1. **Cinematic Spatial World ("The Obsidian Tribunal")**
   Deliver a high-aesthetic, narrative-driven 3D chamber using React Three Fiber, GSAP, and custom design tokens that immerses the user in an institutional courtroom environment while preserving crisp interface readability.
2. **Inspectable Adversarial Reasoning & Evidence Ledger**
   Deconstruct user propositions into subclaims, gather real web sources into an immutable evidence ledger, and pit AI Prosecutor and Defense roles against each other with mandatory evidence citation validation.
3. **Interactive Objection & Retrial Mechanics**
   Empower users to lodge objections against faulty inferences or questionable sources, triggering re-investigation and a non-destructive retrial with an inspectable Verdict Delta comparing old and new judgments.
4. **Resilient Backend Trial Engine**
   Implement a backend-authoritative FastAPI state machine that governs the trial lifecycle, persists case revisions, enforces strict schema validation, and safeguards API keys.

---

## Non-Goals (Out of Scope for v1)

- Autonomous multi-agent emergent debate networks with open-ended turn counts.
- Multi-user collaborative or synchronous multiplayer courtroom sessions.
- Live audio voice synthesis or real-time speech-to-text input.
- Arbitrary code execution or sandbox data science calculations.
- Automatic posting or scraping of private/social media accounts.

---

## Users

**Primary User:** Analytical thinkers, researchers, debate enthusiasts, and tech professionals
- Wants to verify controversial, nuanced, or complex real-world claims.
- Desires structured, adversarial exploration rather than bland single-answer LLM summaries.
- Demands inspectable source citations and the power to challenge AI conclusions.

**Secondary User:** Gamers and interactive visual novel enthusiasts
- Attracted by deep worldbuilding, immersive art direction, atmospheric sound, and game-like progression mechanics.

---

## Constraints

### Technical
- Frontend built on React 19, Vite, TypeScript, Three.js / React Three Fiber, GSAP, and vanilla CSS tokens.
- Backend built on Python 3.11+, FastAPI, and Pydantic v2.
- APIs: Tavily Search (web retrieval) and NVIDIA NIM (structured reasoning).
- Strict server-side storage of API credentials.
- 60 FPS target for 3D viewports on modern hardware with a seamless 2D fallback mode.

### Operational & Design
- UI/UX and mocked interactive frontend must be designed and verified before backend and live API integrations.
- All evidence citations must refer to explicit IDs in the active case ledger.

---

## Success Criteria

- [ ] Complete 7-act narrative journey operable from entry to archived case review.
- [ ] User can submit a proposition, review refined subclaims, and view at least 5 structured evidence artifacts in the ledger.
- [ ] Adversarial prosecution and defense arguments generate structured points citing verifiable Evidence IDs.
- [ ] User can submit an objection, trigger a re-investigation, and inspect a Verdict Delta comparing `v1` and `v2` judgments.
- [ ] Validated outcomes conform to the 5 judicial states: *Supported*, *Contradicted*, *Mixed Evidence*, *Insufficient Evidence*, *Not Testable*.
- [ ] 3D chamber operates smoothly, respects `prefers-reduced-motion`, and degrades gracefully on unsupported hardware.
- [ ] All external API calls (Tavily, NVIDIA NIM) execute server-side with structured error and timeout handling.

---

## Decisions

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| Execution Order | UI/UX & Mocked Frontend First | Ensures world, interaction mechanics, and spatial narrative are perfected before backend binding | 2026-10-17 |
| 3D Technology | Three.js + React Three Fiber | Declarative integration with React 19 UI overlays, performant canvas management | 2026-10-17 |
| Motion Orchestration | GSAP + Motion for React | GSAP handles cinematic camera timelines; Motion handles component micro-interactions | 2026-10-17 |
| Backend Architecture | FastAPI + Trial State Machine | Guarantees deterministic state transitions and prevents AI hallucinations from altering case truth | 2026-10-17 |
| Evidence Guardrail | Server-Side Citation Validation | Asserts that every argument citation matches an existing evidence ledger ID | 2026-10-17 |
