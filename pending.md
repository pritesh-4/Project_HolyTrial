# pending.md — Holy Trial Audit (2026-10-21)

Audit scope: the full "Trial Awakens" landing implementation prompt (§1–§14).
Method: `npm run check` (typecheck + lint + format + 24 tests), `npm run build`,
dev-server HTTP probes, code review of every scene/engine/UI file, asset-URL
sweep. **No real browser automation is available in this environment — every
item marked UNVERIFIED needs a human browser pass.** No items below have been
"fixed" — recording only.

Legend: ☐ open · priority P0 (acceptance-critical) / P1 (spec deviation) / P2 (quality debt)

---

## P0 — Acceptance-critical

- [ ] **P0-1. Real-browser visual verification of the 7.5 s cinematic** — **UNVERIFIED**
  - Requirement: §13 Phase 7 / §14 "run the application and review the opening as a real user would experience it" (desktop: opening journey, composition, causality legibility, no broken objects or console errors).
  - Evidence gap: engine timing is test-verified (10 timing tests pass), but every visual claim (framing at p=0 arrival, sigil trace, strut docking, strike recoil, bolt sequence, gate vista, occlusion, fog balance) was never rendered in a browser this session.
  - Files: all `src/components/Tribunal3D/*`, `src/components/LandingPage.tsx`.
  - Next action: human pass on `npm run dev` (Chromium + Firefox, 60 fps), check DevTools console is clean through p=0→1 and through each interaction.

- [ ] **P0-2. Browser check: mobile presentation** — **UNVERIFIED**
  - Requirement: §14 "a usable mobile experience"; §12 graceful degradation.
  - Evidence: code exists (rig pull-back `isMobile → z+3, y+0.5`, px-parallax reduced), no device emulation run.
  - Files: `TribunalCanvas.tsx` (CinematicCameraRig), `WebGlFallback.tsx`.
  - Next action: DevTools mobile emulation run; verify dais/gate framing and the CTA are not obscured on small screens; check tap targets on the artifacts.

- [ ] **P0-3. Browser check: reduced-motion presentation** — **PARTIAL**
  - Requirement: §12 "Respect reduced-motion preferences"; §14 reduced-motion case checked.
  - Evidence: engine _compresses_ the timeline ×0.3 (test asserts completion <4 s) — same motions, sprinted; CSS block (`index.css` L122) kills only CSS animations, not framer-motion CTA/title transitions. Sprinting through identical movement may not honor the preference's intent (reduce movement).
  - Files: `CinematicEngine.ts` (L287), `index.css` (L122), `LandingPage.tsx` (motion components).
  - Next action: decide intended presentation for reduce users (e.g., let cinematic durations stand but damp amplitude: skip streak/vibration/breathing, static camera pans→cuts), wire `state.reducedMotion` into scene files (it is currently only read by the engine's act-duration path), test in browser with emulated reduce.

- [ ] **P0-4. Browser check: audio on/off behavior** — **PARTIAL** (code-verified only)
  - Requirement: §10 sound OFF, opt-in, mute-immediate; §14 audio-disabled case checked.
  - Evidence: `AudioSynthesizer.ts` `isMuted=true` init, guards in every cue, `stopAmbient()` on mute, resume-on-gesture path — code-verified with tests rendering the toggle (LandingPage.test L24–40). No actual Web Audio playback was heard/verified.
  - Files: `AudioSynthesizer.ts`, `useCinematic.ts`.
  - Next action: browser pass — enable sound mid-cinematic (late opt-in must still hear gateSwell), toggle off during a cue (verify immediate silence), verify autoplay-block path (no console error when ctx is denied).

- [ ] **P0-5. Browser check: WebGL-failure fallback** — **PARTIAL** (jsdom-verified only)
  - Requirement: §14 "[WebGL] failure cases checked"; 2D fallback must stay operative.
  - Evidence: `LandingPage.test` renders `WebGlFallback` when `getContext` fails (passes); windows retimed to the new act map. Real-GPU-failure behavior (context lost mid-run) never tested.
  - Files: `WebGlFallback.tsx`, `LandingPage.tsx` (`checkWebGlSupport`).
  - Next action: force-disable WebGL in browser devtools; confirm fallback choreography and CTA still complete; consider handling `webglcontextlost`.

- [ ] **P0-6. Browser check: rendering performance (FPS)** — **UNVERIFIED**
  - Requirement: §12 "Measure the actual payload and GPU cost rather than assuming"; "stable motion on capable desktop [and] graceful degradation".
  - Evidence: payload measured (three vendor 240.8 kB gzip, unchanged; build clean). No FPS/GPU measurement exists.
  - Files: whole 3D scene.
  - Next action: browser FPS read (e.g., performance tab or stats helper) across the full run + idle; if <~45 fps on mid hardware, cut bloom-free additive surfaces / lower `dpr` cap first.

- [ ] **P0-7. Keyboard cannot start claim inspection or make the cross-exam decision** — **FAIL**
  - Requirement: §7 "Provide pointer, touch, and keyboard-accessible interaction"; §14 "Interactions work across mouse, touch and keyboard".
  - Evidence: `LandingPage.tsx` L40–57 binds keys 1/2/3 to `engine.inspectEvidence(id)` and Escape to finishing. There is **no key for `inspectClaim`** (Escape only finishes it), and **no key routes to `engine.makeDecision`** — during the decision window keys 1/2/3 inspect-support/contradict instead of choosing, so the cross-exam choice is pointer/touch-only. The in-3D component routes clicks to decisions (`EvidenceCluster.handleFragClick`), but the keyboard path bypasses it.
  - Files: `src/components/LandingPage.tsx` (keyboard effect), `CinematicEngine.ts` (`inspectEvidence` vs `makeDecision`).
  - Next action: bind e.g. `c`→`inspectClaim`/`E→click claim`, and route keys 1/2 through a decision-aware dispatcher (if `decisionWindowActive && crossExamChoice === null` → `makeDecision('align_support'|'expose_contradiction')`, else `inspectEvidence`). Add engine-level tests for both paths.

- [ ] **P0-8. Post-decision camera hold is inescapable until the finale** — **PARTIAL**
  - Requirement: §7 "Preserve the camera and object states... Do not reset the scene"; interactions "immediate and satisfying"; §14 "no dead interactions".
  - Evidence: `engine.makeDecision()` sets `isInteracting=true; interactionTarget='supporting'|'contradictory'` and only `transitionTo(FINALE)` clears it (engine L325–330). `finishClaimInspect` requires target==='claim'; `finishEvidenceInspect` requires `activeEvidenceInspect` — neither clears a post-decision hold, so Escape cannot release the camera between decision (≥3.1 s) and finale. Deliberate framing or bug is unproven visually.
  - Files: `CinematicEngine.ts` (makeDecision / finish*), `TribunalCanvas.tsx` (rig override), `EvidenceCluster.tsx`.
  - Next action: add `releaseDecisionHold()` (or reuse `finishEvidenceInspect`) and bind it to Escape; verify visibly that the camera returns to the story trajectory immediately after choosing.

---

## P1 — Spec deviations

- [ ] **P1-1. Per-frame allocations contradict the "no allocation" rule and the docs claim** — **FAIL**
  - Requirement: §6 discipline; Trionn-adopted pattern documented as "no per-frame allocation" (`docs/design/trial-awakens.md` §5 says "no per-frame allocation, no competing timers").
  - Evidence: 8 sites inside `useFrame` bodies allocate every frame at 60 fps: `EvidenceCluster.tsx` L190, L214, L249, L291 (`new THREE.Vector3().lerpVectors(...)`) and `OppositionMonolith.tsx` L82, L86, L90, L100 (+ per-frame `CENTER_MECHANISM.clone()` and `pos.recoil.clone()`). ~10–20 short-lived Vector3/frame → steady GC churn.
  - Files: `EvidenceCluster.tsx`, `OppositionMonolith.tsx`, `docs/design/trial-awakens.md`.
  - Next action: hoist `scratchTarget` module-level temps (`.copy(temp).lerpVectors(...)`) or preallocate per-artifact target vectors; fix both the file header comments and the docs claim.

- [ ] **P1-2. Looping pulses violate the "no repeated glowing pulses" rule** — **PARTIAL**
  - Requirement: §6 "Avoid ... repeated glowing pulses"; the AGENTS-locked requirement "no perpetual rotation/pulses".
  - Evidence: CTA button carries `animate-gate-pulse` (4 s ease-in-out infinite, `index.css` L103–105); fallback shaft `animate-shaft-drift` (12 s infinite); dais inlay glow breathes via `Math.sin(clock*2)*0.12` continuously during WEIGHING arc (`TribunalArchitecture.tsx` copperGlow target). CTA affordance pulse may be defensible; the act-long sine breathing is a literal violation.
  - Files: `index.css`, `TribunalArchitecture.tsx`, `LandingPage.tsx` (CTA class), `WebGlFallback.tsx`.
  - Next action: replace the inlay sine with a one-shot brighten at each story transition; re-class the CTA to a static border emphasis (or keep and justify explicitly as an affordance exception after browser review).

- [ ] **P1-3. "Progress maps 1:1 to elapsed time" comment is inaccurate** — **PARTIAL**
  - Requirement: honest docs/comments (implied by §14 honesty and CI'd code standards).
  - Evidence: `CinematicEngine.updateProgress()` L341–351 applies a smoothstep **within** each act, so progress ≠ linear elapsed inside acts (act boundaries and durations are exact; the CTA test is actElapsed-based, so tests are unaffected). The header comment (L150–153) and `docs/design/trial-awakens.md` §5 both claim 1:1 linearity.
  - Files: `CinematicEngine.ts`, `docs/design/trial-awakens.md`, and every scene component that claims windows in "elapsed s = progress × 7.5" (all comment headers).
  - Next action: either make progress strictly linear (drop the smoothstep) — safer for window math already tuned — or update all comments/docs to "eased-in-act progress". Verify scene windows still land correctly after the change.

- [ ] **P1-4. Repeated environmental meshes are not instanced** — **PARTIAL**
  - Requirement: §12 "instancing for repeated environmental details".
  - Evidence: left/right colonnades = 10 separate `<mesh>` cylinders + `far-col` 4 more (`TribunalArchitecture.tsx`), each with own draw call.
  - Files: `TribunalArchitecture.tsx`.
  - Next action: convert colonnades + far colonnade to `InstancedMesh`; verify silhouette passes unchanged in browser.

- [ ] **P1-5. Audio lacks spatialization ("emerge from their apparent sources")** — **PARTIAL**
  - Requirement: §10 "Allow sounds to emerge from their apparent sources"; spatially coherent.
  - Evidence: all cues render straight to `ctx.destination` (mono bed); no `PannerNode`/HRTF anywhere (`AudioSynthesizer.ts`).
  - Files: `AudioSynthesizer.ts`.
  - Next action: for the predictable act cues, add a two-channel pan per event (e.g., evidence docks L/R per artifact, opposition impact R, gate swell C) via `PannerNode` or `StereoPannerNode` with a documented fallback.

- [ ] **P1-6. Excess landing-surface text control ("examine the charter")** — **PARTIAL**
  - Requirement: §11 "The only persistent visible UI control is the small sound toggle"; "No redundant labels"; CTA block minimal.
  - Evidence: a secondary visible text button sits directly under `ENTER THE COURT` (`LandingPage.tsx` L180–186). The landing test asserts absence of uppercase `'EXAMINE CHARTER'` — the actual string is lowercase `'examine the charter'`, so the check passes while the control exists (false confidence).
  - Files: `LandingPage.tsx`, `src/test/LandingPage.test.tsx`.
  - Next action: decide with product whether the charter cue stays (then justify as a "genuinely necessary" discoverability cue), else move it into the post-CTA only after completion or remove; fix the test to match the factual string either way.

- [ ] **P1-7. No designed loading state** — **PARTIAL**
  - Requirement: §12 "Use a coherent loading state".
  - Evidence: app boots from a ~1.1 KB index.html + small chunks with no loader; since every asset is procedural this is currently near-instant, but nothing handles slow first-paint or defers the three bundle (`vendor-three` 240 kB) — the first visible frame can be blank on slow networks.
  - Files: `index.html`, `src/App` or equivalent entry, `TribunalCanvas.tsx`.
  - Next action: add a palette-correct minimal loading veil that yields to the canvas on mount (and to `WebGlFallback` on failure); verify perceived time-to-first-frame.

- [ ] **P1-8. Audio engine listeners/apologies never torn down on unmount** — **PARTIAL**
  - Requirement: §12 "appropriate cleanup of ... observers, event listeners, and animation loops".
  - Evidence: `AudioSynthesizer` constructor registers a module-scope `visibilitychange` listener at import time with no removal path (singleton persists across route view switches); the deferred ambient `setTimeout(650)` in `stopAmbient()` is not cancelled if the component unmounts in that window (engine rAF teardown is clean in `useCinematic`).
  - Files: `AudioSynthesizer.ts`.
  - Next action: expose `dispose()` on the synth, call it from `useCinematic` teardown, and cancel the pending stop-timeout.

---

## P2 — Quality debt

- [ ] **P2-1. Stale window constant in ClaimRelic** — **PARTIAL**
  - Requirement: comment/code coherence for story windows.
  - Evidence: `ClaimRelic.tsx` lean window `easedWindow(p, 0.24, 0.6133)` still encodes the pre-rebuild OPPOSITION end (0.6133 → old 4.6 s); current OPPOSITION ends at 0.6. Visual effect is a 0.073-overlap lean into WEIGHING.
  - Files: `ClaimRelic.tsx`.
  - Next action: set to 0.6 (or justify the overlap), re-run timing-sensitive tests.

- [ ] **P2-2. Weak/bypassed test assertions** — **PARTIAL**
  - Requirement: meaningful regression nets.
  - Evidence: `LandingPage.test` L17 checks `'EXAMINE CHARTER'` (uppercase) — misses the real lowercase button (see P1-6); L61–76 "shows scroll hint after intro completes" uses fake timers the engine's rAF clock ignores and only asserts the progress nav exists (placeholder-strength). CaseDossier/cache of 24 tests passes at 100%.
  - Files: `src/test/LandingPage.test.tsx`.
  - Next action: align selectors with actual strings; replace the rAF-blind test with an engine-driven assertion (drive `engine.update(dt)` directly as the CinematicEngine tests do).

---

## Verified clean during this audit (no action)

These were re-executed with fresh evidence on commit `e417a8f`: `npm run check`
(typecheck 0 errors, eslint clean, prettier clean, **24/24 tests** incl. 10
master-timeline timing tests, 8 landing-UI tests, 6 CaseDossier preservation
tests), `npm run build` (905 ms; three vendor 240.84 kB gzip — unchanged, zero
new dependencies), dev server boot + HTTP 200 on `/`,
`/src/components/Tribunal3D/ClaimRelic.tsx`, `/src/components/Tribunal3D/etch.ts`,
remote-asset sweep (only SVG `xmlns` namespace strings — no external asset
URLs), CaseDossier/CharterDrawer/CourtSeal/CI-workflow diff-free across the
rebuild commits, sound-off-by-default + toggle tests, no-navbar/no-2D-toggle/
no-early-CTA tests, WebGL-fallback render test, delta-clamped/rate-independent
timing tests, interaction-overlay-does-not-extend-timeline tests, decision
affects state not the clock test, and the pass-through-all-acts test.
