---
phase: 0
researched_at: 2026-10-17
discovery_level: 3
---

# RESEARCH.md — HolyTrial Technology & Domain Synthesis

## 1. Executive Summary & Architecture Decisions

This research synthesizes the technical, visual, and architectural requirements for **HolyTrial** (Hype Court) across graphics rendering, animation pipelines, AI reasoning, search discovery, and backend trial state machines.

---

## 2. Graphics, 3D & Animation Pipeline

### 2.1 3D Spatial Chamber: Three.js vs. React Three Fiber (R3F) vs. Spline
- **Options Considered:**
  1. *Vanilla Three.js in raw `<canvas>`:* Maximizes raw control, but requires manual React lifecycle synchronization, event propagation, and DOM overlay binding.
  2. *React Three Fiber (R3F) + Drei:* Declarative scene graph inside React 19. Automatically ties into React state, supports Drei helpers (cameras, orbit controls, procedural geometries, post-processing), cleanly mounts HTML overlays with `<Html>` or native z-index layering.
  3. *Spline WebGL Export:* Fast for initial 3D prototypes, but poor custom shader flexibility, larger bundle overhead, and proprietary runtime lock-in.
- **Decision:** **React Three Fiber (@react-three/fiber + @react-three/drei)**
- **Confidence:** High. R3F provides the best synergy with React 19, allowing chamber objects (the dais, the pillars, the ledger pedestals) to react directly to application state changes.
- **Performance Strategy:**
  - Procedural low-to-mid poly geometry for the Obsidian Tribunal monoliths.
  - Baked ambient occlusion textures and lightmaps instead of expensive multi-light real-time shadows.
  - Target: < 40 Draw Calls, < 50,000 polygons, 60 FPS on integrated GPUs.
  - Automatic fallback to high-fidelity 2D static scene if WebGL context creation fails or FPS drops below 25.

### 2.2 Animation & Motion Choreography
- **Options Considered:**
  1. *Pure CSS Keyframes:* Lightweight, but nearly impossible to reverse, coordinate across 3D camera sweeps, or synchronize with discrete state machine steps.
  2. *GSAP (GreenSock) alone:* Industry gold-standard for complex cinematic timelines and camera sweeps, but heavier boilerplate for simple React component mount/unmount.
  3. *GSAP + Motion for React (framer-motion):* Dual-tier strategy. GSAP orchestrates the multi-act camera shifts and 3D chamber reveals; Motion handles UI panels, card flips, modals, and evidence drawer transitions.
- **Decision:** **GSAP + Motion for React**
- **Confidence:** High. Enables deterministic, scrubbable/reversible cinematic transitions between the 7 narrative acts while retaining fluid React UI micro-interactions.

---

## 3. Art Direction & Visual Identity Research

### 3.1 Visual Direction Comparison
We explored three distinct aesthetic concepts for the fictional institution:

| Direction | Concept | Palette | Strengths | Risks | Verdict |
|-----------|---------|---------|-----------|-------|---------|
| **Direction A: The Obsidian Tribunal** (Selected) | Brutalist monolithic sci-fi architecture, ritualistic black basalt, smoked glass, geometric glyphs, brass/gold inlay. | Basalt black (#0a0a0c), Antique Gold (#d4af37), Void Teal (#00e5ff), Crimson seal (#dc2626). | Imposing, distinct, authoritative; elevates claims into solemn high-stakes trials. | Can become too dark if contrast isn't strictly maintained. | **PRIMARY (Recommended)** |
| **Direction B: Neon Panopticon** | Cyberpunk investigative terminal, holographic wireframes, amber monochromatic CRT vectors, biometric readouts. | Deep navy (#050b14), Amber phosphor (#ffb000), Cyan grid (#00ffff). | Fast technical feel, easily recognizable hacker aesthetic. | Cliche, fatigue-inducing, lacks solemn judicial weight. | Rejected |
| **Direction C: The Celestial Synod** | Ethereal ivory marble, floating classical colonnades, luminous white light, gossamer parchment. | Alabaster (#f8f9fa), Lapis lazuli (#1e3a8a), Polished brass (#b45309). | Grand and timeless, high contrast readability. | Can feel sterile or religious rather than judicial/evidence-focused. | Alternative Reference |

---

## 4. Search & Evidence Discovery: Tavily Search API

### 4.1 Integration Pattern
- **Purpose:** Reliable web information retrieval tailored for LLM reasoning and factual grounding.
- **Key Capabilities Utilized:**
  - Search query expansion based on decomposed subclaims.
  - Search depth: `basic` for fast initial pass, `advanced` for disputed points in retrials.
  - Domain filtering & source deduplication.
  - Direct snippet and raw content retrieval for evidence ledger cards.
- **Failure Modes & Defenses:**
  - *Rate limits / Quota:* Backend caching layer using SQLite; deduplicate identical queries across sessions.
  - *Low source credibility / Spam:* Filter low-authority domains; expose domain metadata directly to users for scrutiny.
  - *No results found:* Explicit court status: `Insufficient Evidence` or `Not Testable`.

---

## 5. Model Inference: NVIDIA NIM API

### 5.1 Model Selection & Inference Patterns
- **Selected Models:** `meta/llama-3.3-70b-instruct` or `mistralai/mixtral-8x22b-instruct` hosted on NVIDIA NIM.
- **Capabilities Required:**
  - High reasoning throughput and low latency.
  - Native structured output / JSON schema support.
  - Rigorous adherence to provided context (anti-hallucination).
- **Execution Roles (Single Model, Specialized System Prompts):**
  1. *Deconstructor:* Decomposes user proposition into 2–4 testable factual hypotheses.
  2. *Prosecution Advocate:* Adopts a rigorous, skeptical stance; challenges assumptions using ledger evidence.
  3. *Defense Advocate:* Adopts a corroborating stance; marshals supporting evidence and contextual qualifications.
  4. *Judge / Synthesizer:* Evaluates adversarial clash against evidence ledger; produces reasoned verdict.
- **Citation Guardrail Protocol:**
  - Backend schema enforces `cited_evidence_ids: list[str]`.
  - Backend verifies that all cited IDs exist in the active case ledger before accepting the LLM output.
  - If a hallucinated ID appears, the output is rejected and regenerated with a stricter prompt constraint.

---

## 6. Backend & State Machine Architecture

### 6.1 Deterministic Court Engine
- **Framework:** FastAPI (Python 3.11+) + Pydantic v2.
- **State Machine States:**
  1. `DRAFT`: Claim submitted, pending refinement.
  2. `SUMMONING`: Tavily executing searches, populating evidence ledger.
  3. `TRIAL_IN_SESSION`: Prosecution and Defense arguments generated and staged.
  4. `JUDGED`: Judicial ruling rendered, available for review.
  5. `RETRIAL_REQUESTED`: User objection accepted, re-investigation triggered.
  6. `RETRIAL_COMPLETE`: Verdict Delta generated, case updated to new version.
- **Persistence:** SQLite for local prototyping with SQLAlchemy / SQLModel, easily swappable to PostgreSQL.

---

## 7. Key Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| WebGL / 3D lag on budget laptops | High | Strict polygon budget (<50k), procedural shaders, and instantaneous 2D fallback mode. |
| Hallucinated citations by AI roles | Critical | Server-side validation layer rejects outputs referencing non-existent Evidence IDs. |
| Network latency in 3D transitions | Medium | Preload mock datasets; show ritualistic in-world summoning animations during live fetches. |
| Overly complex state synchronization | High | Centralized trial state machine in backend; frontend simply renders incoming state events. |
