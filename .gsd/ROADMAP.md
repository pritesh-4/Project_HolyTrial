---
milestone: v1.0
version: 0.1.0
updated: 2026-10-17T12:50:00+05:30
---

# Roadmap — HolyTrial (Hype Court)

> **Current Phase:** 0 - Discovery and Project Foundation
> **Status:** executing

## Must-Haves (from SPEC)

- [ ] Distinctive 3D judicial chamber ("The Obsidian Tribunal") with custom design tokens and seamless 2D fallback.
- [ ] 7-act narrative journey (Threshold, Dossier, Summoning, Trial, Judgment, Retrial, Archive).
- [ ] Evidence ledger featuring persistent IDs, publication metadata, snippets, and verified source citations.
- [ ] Adversarial prosecution and defense argument stages grounded strictly in retrieved evidence.
- [ ] Interactive objection mechanism allowing users to challenge assertions, inferences, or sources.
- [ ] Signature Retrial workflow generating an inspectable Verdict Delta comparing `v1` and `v2`.
- [ ] Backend-authoritative FastAPI trial state machine with server-side Tavily Search and NVIDIA NIM integration.

---

## Phases

### Phase 0: Discovery and Project Foundation
**Status:** 🔄 In Progress
**Objective:** Conduct domain research, inspect environment, establish project constraints, and create foundational GSD planning artifacts.
**Requirements:** CON-01, CON-02, CON-04

**Plans:**
- [x] Plan 0.1: Codebase mapping, stack analysis, and template initialization.
- [x] Plan 0.2: Synthesize Project Identity, Vision, and Requirements (PROJECT.md, SPEC.md, REQUIREMENTS.md).
- [x] Plan 0.3: Research domain, 3D graphics, animation, and AI pipelines (RESEARCH.md, ROADMAP.md).
- [ ] Plan 0.4: Present project discovery and obtain formal Product Owner roadmap approval.

---

### Phase 1: Experience Bible and Art Direction
**Status:** ✅ Complete (Proposal Delivered in docs/design/phase-1-art-direction.md)
**Objective:** Formulate the fictional institution's lore, visual grammar, token system, materials, lighting, typography, and sound design principles.
**Depends on:** Phase 0

**Plans:**
- [x] Plan 1.1: Author the Experience Bible & Art Direction Proposal (docs/design/phase-1-art-direction.md).
- [x] Plan 1.2: Establish Visual Direction Board & Design Tokens (color system, typography, geometric glyphs, artifact designs).
- [x] Plan 1.3: Define Sound Direction, Motion Grammar & Performance Guardrails.

---

### Phase 2: Narrative Flow and UX Specification
**Status:** ⬜ Not Started
**Objective:** Map every screen, act transition, and user interaction contract (dossier, summoning, trial, objections, judgment, retrial, archive).
**Depends on:** Phase 1

**Plans:**
- [ ] Plan 2.1: Author Screen Storyboard & Act Flow Specification (The 7 Acts).
- [ ] Plan 2.2: Specify Interactive Mechanics (Objection drawer, evidence ledger card modal, retrial diff engine).
- [ ] Plan 2.3: Design Edge States (low evidence, contradictions, error recovery, mobile responsive, reduced motion).

---

### Phase 3: Visual Prototype and Asset Pipeline
**Status:** ⬜ Not Started
**Objective:** Build the 3D chamber blockout in React Three Fiber, implement shaders/lighting, setup GSAP camera timelines, and establish asset licensing pipeline.
**Depends on:** Phase 2
**Requirements:** REQ-01, NFR-01, NFR-02

**Plans:**
- [ ] Plan 3.1: Construct R3F Chamber Blockout (central dais, monolithic pillars, pedestal, dramatic lighting).
- [ ] Plan 3.2: Implement GSAP Camera Timelines & Act Transitions.
- [ ] Plan 3.3: Implement 2D High-Fidelity Fallback View & Performance Monitor.

---

### Phase 4: Complete Frontend with Mocked Data
**Status:** ⬜ Not Started
**Objective:** Deliver the complete end-to-end interactive frontend experience using a rich local fixture dataset without requiring a live backend.
**Depends on:** Phase 3
**Requirements:** REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10, REQ-11, NFR-03, NFR-06

**Plans:**
- [ ] Plan 4.1: Implement Case Dossier & Claim Refinement UI.
- [ ] Plan 4.2: Implement Evidence Ledger & Summoning Animation.
- [ ] Plan 4.3: Implement Adversarial Trial Floor (Prosecution & Defense stages with interactive citation links).
- [ ] Plan 4.4: Implement Objection Modal & Retrial Verdict Delta View.
- [ ] Plan 4.5: Implement Case Archive Drawer & Session Navigation.

---

### Phase 5: Court Engine and Persistence
**Status:** ⬜ Not Started
**Objective:** Build the backend-authoritative FastAPI trial state machine, Pydantic domain models, and SQLite persistence engine.
**Depends on:** Phase 4
**Requirements:** REQ-12, REQ-13, NFR-04

**Plans:**
- [ ] Plan 5.1: Build FastAPI Trial State Machine & Lifecycle Transitions.
- [ ] Plan 5.2: Create SQLite Database Schema & Repository Layer (Cases, Evidence, Arguments, Objections, Judgments).
- [ ] Plan 5.3: Build REST API endpoints and verify against frontend state contracts.

---

### Phase 6: Tavily and NVIDIA NIM Integration
**Status:** ⬜ Not Started
**Objective:** Integrate live search retrieval via Tavily and structured adversarial reasoning via NVIDIA NIM with strict citation guardrails.
**Depends on:** Phase 5
**Requirements:** REQ-14, REQ-15, REQ-16, REQ-17

**Plans:**
- [ ] Plan 6.1: Integrate Tavily Search client (query decomposition, source deduplication, content extraction).
- [ ] Plan 6.2: Integrate NVIDIA NIM client (claim decomposition, prosecution, defense, and judge prompt pipelines).
- [ ] Plan 6.3: Implement Server-Side Citation Integrity Validator & Retrial Re-investigator.

---

### Phase 7: Full-System Verification
**Status:** ⬜ Not Started
**Objective:** Conduct empirical end-to-end validation across multiple real-world claims, test error modes, verify performance, and check accessibility.
**Depends on:** Phase 6

**Plans:**
- [ ] Plan 7.1: Multi-Claim End-to-End Verification (supported, contradicted, and insufficient evidence cases).
- [ ] Plan 7.2: Resilience & Error Mode Testing (API rate limits, timeouts, missing sources, malformed objections).
- [ ] Plan 7.3: Performance, Accessibility, and Asset Licensing Audit.

---

### Phase 8: Demo Readiness and Release
**Status:** ⬜ Not Started
**Objective:** Polish the signature demonstration claim, assemble offline mock fallbacks, finalize documentation, and prepare production deployment.
**Depends on:** Phase 7
**Requirements:** NFR-05

**Plans:**
- [ ] Plan 8.1: Rehearse Signature Showcase Claim (cinematic flow, objection, and retrial demonstration).
- [ ] Plan 8.2: Implement Resilient Offline / Demo Mode.
- [ ] Plan 8.3: Deployment Build, Security Audit, and Final Release Checklist.

---

## Progress Summary

| Phase | Name | Status | Plans | Complete |
|-------|------|--------|-------|----------|
| 0 | Discovery & Foundation | 🔄 In Progress | 3/4 | 75% |
| 1 | Experience Bible & Art Direction | ⬜ Not Started | 0/3 | 0% |
| 2 | Narrative Flow & UX Spec | ⬜ Not Started | 0/3 | 0% |
| 3 | Visual Prototype & Asset Pipeline | ⬜ Not Started | 0/3 | 0% |
| 4 | Complete Frontend (Mocked Data) | ⬜ Not Started | 0/5 | 0% |
| 5 | Court Engine & Persistence | ⬜ Not Started | 0/3 | 0% |
| 6 | Tavily & NVIDIA NIM Integration | ⬜ Not Started | 0/3 | 0% |
| 7 | Full-System Verification | ⬜ Not Started | 0/3 | 0% |
| 8 | Demo Readiness & Release | ⬜ Not Started | 0/3 | 0% |
