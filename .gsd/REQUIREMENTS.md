---
milestone: v1.0
updated: 2026-10-17T12:50:00+05:30
---

# Requirements — HolyTrial (Hype Court)

## Overview

Requirements derived from PROJECT.md and SPEC.md providing full traceability across the 9 implementation phases.

---

## Functional Requirements

| ID | Requirement | Source | Phase | Status |
|----|-------------|--------|-------|--------|
| **REQ-01** | **Chamber Spatial Scene**: 3D court environment ("The Obsidian Tribunal") with monolithic geometry, lighting, materials, and camera angles. | SPEC Goal 1 | Phase 3 | Pending |
| **REQ-02** | **Narrative Act Transitions**: Orchestrated cinematic transitions across all 7 acts (Threshold, Dossier, Summoning, Trial, Judgment, Retrial, Archive). | SPEC Goal 1 | Phase 4 | Pending |
| **REQ-03** | **Claim Intake & Refinement**: Submission interface that analyzes ambiguity and refines raw claims into testable propositions and subclaims. | SPEC Goal 2 | Phase 4 | Pending |
| **REQ-04** | **Evidence Ledger System**: Data structure and UI card/modal view for sources, featuring Evidence IDs, publication metadata, snippets, and subclaim links. | SPEC Goal 2 | Phase 4 | Pending |
| **REQ-05** | **Adversarial Arguments**: Split-view / staged presentation of Prosecution (skeptical/opposing) and Defense (supporting) arguments. | SPEC Goal 2 | Phase 4 | Pending |
| **REQ-06** | **Evidence Citations**: Interactive citation badges in arguments that highlight and open the corresponding evidence item in the ledger. | SPEC Goal 2 | Phase 4 | Pending |
| **REQ-07** | **Interactive Objections**: Modal/drawer allowing user to challenge factual assertions, relevance, missing evidence, or faulty inferences. | SPEC Goal 3 | Phase 4 | Pending |
| **REQ-08** | **Judicial Verdict**: Display of Judge's ruling classified into Supported, Contradicted, Mixed, Insufficient, or Not Testable, with reasoned synthesis. | SPEC Goal 2 | Phase 4 | Pending |
| **REQ-09** | **Retrial Execution**: Signature workflow that suspends prior judgment, accepts new evidence/objections, and re-evaluates the case. | SPEC Goal 3 | Phase 4 | Pending |
| **REQ-10** | **Verdict Delta Comparison**: Side-by-side diff showing changes in evidence pool, argument weight, and verdict between trial versions (`v1` vs `v2`). | SPEC Goal 3 | Phase 4 | Pending |
| **REQ-11** | **Case Archive & History**: Persistent case drawer/browser allowing users to inspect previous completed cases and past trial versions. | SPEC Goal 1 | Phase 4 | Pending |
| **REQ-12** | **Trial State Machine**: Backend lifecycle engine enforcing valid transitions (Created → Researched → Debating → Judged → Retrying). | SPEC Goal 4 | Phase 5 | Pending |
| **REQ-13** | **Case Persistence API**: RESTful endpoints and database schema storing cases, evidence, arguments, objections, and judgments. | SPEC Goal 4 | Phase 5 | Pending |
| **REQ-14** | **Tavily Search Integration**: Server-side client performing query expansion, search retrieval, deduplication, and snippet extraction. | SPEC Goal 2 | Phase 6 | Pending |
| **REQ-15** | **NVIDIA NIM Reasoning**: Model inference calls for claim decomposition, prosecution argument, defense argument, and judicial verdict. | SPEC Goal 2 | Phase 6 | Pending |
| **REQ-16** | **Citation Integrity Guardrail**: Server-side validation rejecting any LLM argument that cites an Evidence ID not present in the active ledger. | SPEC Goal 4 | Phase 6 | Pending |
| **REQ-17** | **Targeted Re-investigation**: Triggering specialized Tavily queries based on accepted user objections during a retrial. | SPEC Goal 3 | Phase 6 | Pending |

---

## Non-Functional Requirements

| ID | Requirement | Category | Phase | Status |
|----|-------------|----------|-------|--------|
| **NFR-01** | **Rendering Performance**: Maintain 60 FPS in 3D viewport on standard laptop GPUs; render canvas memory disposed properly on unmount. | Performance | Phase 3 | Pending |
| **NFR-02** | **Graceful 2D Fallback**: Automatic or user-toggled high-contrast static/2D cinematic mode when WebGL is unavailable or struggling (<25 FPS). | Reliability | Phase 3 | Pending |
| **NFR-03** | **Motion Accessibility**: Full support for `prefers-reduced-motion` media query, replacing heavy 3D camera sweeps with immediate subtle fades. | Accessibility | Phase 4 | Pending |
| **NFR-04** | **API Security**: Tavily and NVIDIA NIM keys stored exclusively in backend `.env`; zero leakage into client bundles or browser logs. | Security | Phase 5 | Pending |
| **NFR-05** | **Offline/Mock Demo Resilience**: Complete functional mode operating off deterministic local fixtures in case of API failure or demo offline need. | Reliability | Phase 8 | Pending |
| **NFR-06** | **Responsive Ergonomics**: Cohesive layout usable on desktop viewports down to tablet and mobile screens without breaking evidence reading. | UX | Phase 4 | Pending |

---

## Constraints

| ID | Constraint | Source | Impact |
|----|------------|--------|--------|
| **CON-01** | **UI/UX First Sequencing**: No backend code before complete mocked interactive frontend is validated. | Brief §3.4 | Enforces strict phase gate at Phase 4. |
| **CON-02** | **Backend Trial Authority**: AI models cannot mutate case state directly; state machine transitions are strictly server-side. | Brief §4.3 | Dictates architecture of court engine in Phase 5. |
| **CON-03** | **Evidence Grounding**: No hallucinated or ungrounded evidence permitted in arguments. | Brief §4.2 | Mandates citation validator in Phase 6. |
| **CON-04** | **Asset Provenance & Licensing**: All 3D assets, textures, fonts, and audio must have recorded licenses. | Brief §6 | Asset provenance log maintained in Phase 1 & 3. |

---

## Traceability Matrix

| Requirement | Phases | Primary Deliverable |
|-------------|--------|---------------------|
| REQ-01, NFR-01, NFR-02 | Phase 3 | 3D Chamber scene & asset pipeline |
| REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10, REQ-11, NFR-03, NFR-06 | Phase 4 | Interactive frontend with mock case |
| REQ-12, REQ-13, NFR-04 | Phase 5 | FastAPI state machine & SQLite persistence |
| REQ-14, REQ-15, REQ-16, REQ-17 | Phase 6 | Live Tavily & NVIDIA NIM pipelines |
| NFR-05 | Phase 8 | Showcase demo mode & offline fallback |
