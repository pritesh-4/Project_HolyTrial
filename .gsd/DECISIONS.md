# DECISIONS.md — Architecture Decision Records

> **Purpose**: Log significant technical and product decisions and their rationale for HolyTrial.

## Decisions

### [DECISION-001] UI/UX-First Implementation Strategy
**Date**: 2026-10-17
**Status**: Accepted

**Context:**
HolyTrial relies heavily on worldbuilding, spatial composition, storytelling acts, and distinct interaction mechanics (the chamber, evidence ledger, adversarial debate, objections, retrial diff). Building backend endpoints before the user experience is locked risks building generic APIs that don't serve the cinematic flow.

**Decision:**
Follow a strict UI/UX-first order: Experience Bible → Narrative Flow & UX Spec → 3D Blockout & Asset Pipeline → Complete Interactive Frontend with Mock Data → Backend State Machine & Persistence → Tavily & NVIDIA NIM Integration.

**Rationale:**
Allows rapid iteration on game feel, camera choreography, visual tone, and user comprehension without API latency or backend overhead.

**Consequences:**
Backend development is deferred to Phase 5. Mock datasets must be meticulously structured to match the eventual Pydantic schemas.

---

### [DECISION-002] 3D & Animation Technology Selection
**Date**: 2026-10-17
**Status**: Accepted

**Context:**
The chamber must feel like a monumental sci-fi institution ("The Obsidian Tribunal") with camera movements responding to narrative acts, while interface text and cards remain crisp and readable.

**Decision:**
Use React Three Fiber (`@react-three/fiber`, `@react-three/drei`) for the 3D scene, combined with GSAP for camera timelines and Motion for React (`framer-motion`) for UI panels.

**Rationale:**
R3F integrates directly into the React 19 tree. GSAP provides deterministic, scrubbable camera choreography between acts. Motion provides fluid panel transitions.

**Consequences:**
Must enforce strict polygon and draw call budgets (<50k polys, <40 draw calls) and provide a seamless 2D fallback mode.

---

### [DECISION-003] Server-Side Authority & Evidence Validation Guardrails
**Date**: 2026-10-17
**Status**: Accepted

**Context:**
AI models may hallucinate citations or generate inaccurate claims if left unconstrained. Furthermore, client-side exposure of API keys is a major security hazard.

**Decision:**
The trial lifecycle is strictly controlled by a backend FastAPI state machine. All Tavily and NVIDIA NIM calls execute server-side. Every generated argument citation is validated against the active evidence ledger before being accepted.

**Rationale:**
Guarantees evidence integrity, protects API credentials, and ensures that neither client code nor model outputs can bypass the court's evidentiary rules.

---

*Last updated: 2026-10-17*
