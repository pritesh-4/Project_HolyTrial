---
status: FINALIZED
created: 2026-10-17T12:50:00+05:30
finalized: 2026-10-17T12:50:00+05:30
---

# PROJECT.md — Project HolyTrial (Hype Court)

## 1. Project Identity & Vision

- **Project Name:** HolyTrial (Hype Court)
- **Category:** Immersive AI-Powered Research, Adversarial Reasoning, and Evidence Examination Experience
- **Tagline:** *"Every claim has a case. Every argument must face scrutiny. Every judgment can be challenged."*

### Vision Statement
HolyTrial is a distinctive, cinematic, story-driven interactive courtroom in which users submit propositions, examine real-world evidence, witness structured adversarial arguments, challenge logical reasoning through objections, and reopen judgments in a retrial. Designed as a fictional institution with its own lore, aesthetic language, spatial presence, sound design, and persistent case history, HolyTrial rejects generic chatbot feeds and shallow fact-checking dashboards in favor of an interactive game world and visual novel that provides genuine analytical utility.

---

## 2. Core Pillars & Design Philosophy

1. **The Application is a World, Not a Chat Feed:**
   - Spatial composition organized around the judicial chamber, evidence artifacts, the trial floor, objection instruments, and the judgment monolith.
   - Custom geometric visual identity under the working direction **"The Obsidian Tribunal"**: monumental black-stone architecture, smoked glass, volumetric lighting, antique gold, teal, and crimson accents.
2. **Storytelling Drives Interaction (The 7 Narrative Acts):**
   - **Act I — The Threshold:** Entry into the chamber, orientation, atmosphere.
   - **Act II — The Case Dossier:** Proposition intake, semantic disambiguation, and scoping.
   - **Act III — The Summoning:** Targeted web research via Tavily; populating the evidence ledger.
   - **Act IV — The Trial:** Adversarial debate (Prosecution vs. Defense) grounded in ledger references.
   - **Act V — The Judgment:** The Judge produces a reasoned verdict across 5 standardized outcomes.
   - **Act VI — The Retrial:** User objects to claims/sources, triggering re-investigation and a side-by-side **Verdict Delta**.
   - **Act VII — The Archive:** Persistent historical record of trials, revisions, and evidence.
3. **UI/UX First, Backend Second:**
   - Rigorous sequencing: Product definition → Visual research → Narrative/UX spec → Interactive frontend prototype with mocked data → Backend trial state engine → Real API integrations.
4. **Cinematic Motion Linked to Application State:**
   - Animations reflect real state changes (chamber awakening, evidence arrival, objection interruption, verdict revelation), not superficial decoration.
5. **Truth Over Spectacle:**
   - The fictional setting never obscures factual reality. Every substantive claim requires verifiable citations against the active evidence ledger. AI judgments are fallible and challengeable.

---

## 3. Technology Architecture Overview

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **3D Spatial Layer:** Three.js + React Three Fiber (@react-three/fiber, @react-three/drei)
- **Cinematic Timelines & Orchestration:** GSAP (GreenSock) for reversible camera and scene sequences
- **Component & Micro-Interactions:** Motion for React (framer-motion)
- **Styling:** Custom Vanilla CSS Design System with CSS variables and design tokens
- **Content & Accessibility:** Semantic HTML/SVG overlays, keyboard navigation, and reduced-motion fallbacks

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **State Machine:** Deterministic, backend-authoritative trial lifecycle engine
- **Persistence:** SQLite (local prototype) with migration path to PostgreSQL
- **Data Validation:** Pydantic v2 schemas for evidence, arguments, objections, and judgments
- **External Integrations:**
  - **Tavily Search API:** Decomposed query search, URL deduplication, snippet and content extraction
  - **NVIDIA NIM API:** Structured output inference for claim decomposition, argument generation, objection classification, and judgment synthesis

---

## 4. Key Constraints & Rules

1. **Security:** API keys (Tavily, NVIDIA NIM) must strictly remain server-side. Never expose keys in client code or environment variables accessible to the browser.
2. **Authority:** The backend state machine, not client-side scripts or AI models, maintains absolute authority over the trial state, phase progression, and case records.
3. **No Hallucinated Citations:** All generated arguments and judgments must cite valid Evidence IDs from the active ledger. Any ungrounded claim is flagged by the validation engine.
4. **Non-Destructive Retrials:** Retrials never overwrite past judgments; they create versioned case states (`v1`, `v2`) with an inspectable **Verdict Delta**.
5. **Fallbacks:** The application must remain operable in low-spec environments and provide a high-contrast 2D fallback mode.
