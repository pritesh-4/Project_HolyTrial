# The Trial Awakens — Landing Cinematic Rebuild

Status: implemented (7.5 s master timeline, single authoritative `CinematicEngine`).
This document covers the concept, the research that shaped it, the technique
selection, and the complete asset manifest.

---

## 1. Concept

**One visual idea:** *A claim enters a dormant tribunal; the tribunal awakens,
weighs it, and opens a gate into the wider world of inquiry.*

Seven beats, each caused by the previous one (elapsed time = progress × 7.5 s):

| Beat | Window (s) | Progress | Story event | Causal consequence |
| --- | --- | --- | --- | --- |
| OPENING | 0.0–0.7 | 0–0.0933 | Monumental gate and colonnade in darkness; a motivated copper light streak descends the colonnade | The streak is the claim's herald — nothing happens without its arrival |
| AWAKENING | 0.7–1.8 | 0.0933–0.24 | The Sigil of the Claim rises onto the dais; its engraved sigil is *traced* open; copper seams and dais inlays ignite in sequence | The etched sigil records the awakening; the Arbiter Wheel is on standby |
| EVIDENCE | 1.8–3.1 | 0.24–0.4133 | Three artifacts fly in and dock: corroborant struts lock into the claim frame (support), the dissent shard traces a fine incompatibility line that folds back into the surface (contradiction), the veiled record docks with a dashed ghost marking its missing wedge (incomplete) | The claim physically changes shape; the wheel engages |
| OPPOSITION | 3.1–4.5 | 0.4133–0.6 | The adversarial wedge leans in, thrusts, strikes; the claim records a procedural fracture at the exact impact window; the wheel recoils | The fracture visible afterwards *is* the challenge's record |
| WEIGHING | 4.5–5.7 | 0.6–0.76 | The claim rights itself, the wheel unwinds to alignment, unresolved evidence recedes; the scene clarifies (fog thins less than it brightens) | The mechanism's verdict is legible as alignment, not victory |
| REVELATION | 5.7–6.9 | 0.76–0.92 | Wheel charges; a light line travels to the gate; four copper bolts release in sequence; the seam flashes; the monolith gates part; the camera advancing reveals the warm world beyond | The gate opening is earned by the wheel's verdict, not a fade |
| FINALE | 6.9–7.5 | 0.92–1.0 | Stable interactive idle; `ENTER THE COURT` at ≈7.05 s | The invitation, nothing more |

Interface rules preserved: title `HOLY TRIAL` only (window 0.45–1.5 s), no
navbar, no explanatory text, no 2D/3D toggle, sound off by default, single
floating sound toggle, one `ENTER THE COURT` CTA at the end wired to the
existing product route.

## 2. Research (verified, current at time of writing)

Primary technical case studies (both fetched and read in full):

- **Ponpon Mania — Codrops (2025-10-07)**:
  <https://tympanus.net/codrops/2025/10/07/ponpon-mania-how-webgl-and-gsap-bring-a-comic-sheeps-dream-to-life/>
  → Adopted: **color identifies story moments** (our ember/copper accents fire
  only on narrative events, never loop); illustration read as world, not
  overlay; interactions change state rather than decorate.
- **Trionn — Codrops (2026-07-15)**:
  <https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/>
  → Adopted: **one shared story-state value drives every layer** (their
  `explodeAmt` pattern ≈ our single `progress` mapping consumed by camera,
  lighting, objects, audio, 2D fallback); per-frame procedural updates with
  zero allocations; **scene warm-up** (`gl.compile` before first frame).

Directory-level references approached through their accessible pages
(Aether 1 marketing site and Lusion case-study pages are closed-source):
authored camera movement with a clear focal point (Aether), hybrid
2D-lineage-in-3D environments (My Little Storybook), environment-as-interface
(KODE Immersive), narrative via silhouette/sound pacing (The Boat).

## 3. Technique selection (what we rejected and why)

| Candidate | Narrative value | Verdict |
| --- | --- | --- |
| Single authoritative progress timeline (existing `CinematicEngine`) | High — every layer reads the same beat | **Kept** (matches Trionn architecture) |
| GSAP/Theatre.js second timeline | Duplicate authority, sync drift risk | **Rejected** — one library already owns 2D micro-interactions (Motion); one authority owns story time |
| LineDashedMaterial + `drawRange` traced etched lines | High — "the tribunal reveals information" | **Adopted as signature** (`etch.ts`) |
| Stock CC0 models (Poly Haven/Sketchfab) | Medium — integration risk, style drift | **Rejected** for focal objects: procedural generation keeps identity coherent; documented below |
| Custom shaders / post-processing stack | Low for this scope, high GPU cost | **Rejected** for this phase; fog, emissives, tone mapping suffice |
| Particle bursts on impact | Conflicts with "no random particles" | **Rejected** — replaced by one expanding impact ring + one brief flash |

## 4. Asset manifest (100% procedural, zero external assets)

No downloaded models, textures, HDRIs, or audio files were integrated. Every
asset is generated at runtime:

| Asset | Source | License | Location |
| --- | --- | --- | --- |
| Stone noise / copper bump textures | Runtime `<canvas>` generation | Project-owned (procedural) | `SceneMaterials.ts` |
| Sigil of the Claim (5-sided medallion, copper frame, etched sigil, fracture, amendment strokes) | Procedural geometry + `makeGlyphRing` / `makeRadialMarks` / `makeCrack` / `makeEtchedSegments` | Project-owned | `ClaimRelic.tsx`, `etch.ts` |
| Corroborant struts, dissent shard, veiled arc record | Procedural primitives (hex beams, octahedron, open torus arc + dashed missing-wedge ghost) | Project-owned | `EvidenceCluster.tsx` |
| Opposition wedge, impact ring/flash | Procedural primitives | Project-owned | `OppositionMonolith.tsx` |
| Tribunal architecture (floor, dais, colonnades, gate, lintel) | Procedural JXS geometry | Project-owned | `TribunalArchitecture.tsx` |
| Arbiter Wheel, gate bolts, arrival streak | Procedural | Project-owned | `TribunalArchitecture.tsx` |
| Beyond-gate vista (arch, far colonnade, haze) | Procedural | Project-owned | `TribunalArchitecture.tsx` |
| Soundscape | Web Audio synthesis (oscillator/filtered-noise design; no samples) | Project-owned | `ProceduralAudio.tsx` |
| 2D fallback chamber | Authored inline SVG | Project-owned | `WebGlFallback.tsx` |
| Typography | Existing design tokens (system/serif families via CSS) | Per-project tokens | `index.css` |

Attribution obligations: none (no third-party assets shipped).

## 5. Animation architecture

- **One authority:** `CinematicEngine` owns story time. Act boundaries are
  exact wall-clock fractions of the 7.5 s master timeline; WITHIN each act
  progress is smoothstepped for cinematic easing. Act windows are pure data
  (`ACT_PROGRESS_RANGES`); delta is never used to advance story time.
- **One pattern:** every scene object computes a windowed value from
  `progress` via `etch.ts` helpers (`windowT`, `easedWindow`) and sets
  properties in place — per-frame work is allocation-free (scratch vectors
  are hoisted to module scope; colonnades are `InstancedMesh`), there are no
  competing timers and no restarts on re-render.
- **Interactions are overlays:** claim inspection, per-artifact evidence
  inspection, and the cross-exam choice flip state flags the scene reads
  opportunistically. They never pause, extend, or restart the master
  timeline; both cross-exam paths converge on the gate reveal.
- **Accessibility:** pointer + touch + keyboard (1/q and 2/w target the
  corroborant / dissent shard — promoted to the cross-exam decision when the
  decision window is open, 3/e targets the veiled record, `c` inspects the
  claim, Escape/back) — routed through the same engine flags as pointer
  clicks. Escape also releases the post-decision camera hold
  (`releaseDecisionHold`); the choice itself persists.
- **Spatial audio:** cues carry an engine-estimated stereo position
  (`pendingAudioPans` parallel to `pendingAudioEvents`), routed through
  `StereoPannerNode` when available — arrival streak left, the wedge's
  strike from the right, artifacts at their dock positions. Strictly opt-in
  and muting-safe; full teardown on unmount (context close, listener and
  timer removal).
- **Reduced motion:** the narrative keeps its full natural pacing (no time
  compression); micro-motion amplitude — idle breathing, impact vibration,
  sway, motes drift, parallax, camera rumble — is damped or frozen scene-side
  via `state.reducedMotion`.
- **Fallbacks:** WebGL-unavailable path (authored SVG, static light and
  glow — no looping pulses), `prefers-reduced-motion` branches in both the
  engine and CSS.

## 6. Verification

- `npm run check` (typecheck + lint + format + 27 tests incl. 13 master-timeline
  engine tests) — passing.
- `npm run build` — passing; bundle unchanged (three vendor 240.8 kB gzip;
  no new dependencies).
- Dev server boots with HTTP 200 on root and module URLs.
- **Honest limitation:** no browser automation tooling was available in this
  environment; the *visual* polish of the new choreography (framing, occlusion,
  fog balance, 2D/3D line legibility) has not been watched by an automated eye.
  A human pass at `npm run dev` is still the closing acceptance step.
