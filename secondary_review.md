# Secondary Agent Review — Holy Trial

**Date:** 2026-10-21 · **Role:** independent quality/complementary pass alongside the primary agent's active WIP ("The Room Was Never Empty").
**Concurrency note:** the primary agent edited files _during_ this review (engine/test/scene saves observed at 16:10–16:16). Items below are attributed accordingly; nothing was reverted, overwritten, or reset.

---

## 1. Evidence-based findings (browser-verified)

All browser evidence taken from Playwright (Chromium) against the running dev server, DOM-only assertions (no module introspection — dev-graph import() is unreliable, per prior sessions). Screenshots: `C:\Users\HP\AppData\Local\Temp\opencode\holytrial-shots-secondary\` (`s1`–`s12`, `smoke-21s.png`).

| #   | Pri  | Finding                                                                                                                                                                                   | Evidence                                                          | Status                                                                                                                              |
| --- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| F1  | P1   | **Mid-film keyboard opened modals over the autoplay** — pressing `3` at ~1.5 s opened the Access Record modal during the directed sequence (desk bar isn't even rendered until post-film) | `kbDuringFilmOpensModal: true` (probe, s11)                       | **Fixed** — engine gate in `inspectObject` (see C2); post-CinematicEngine rewrite the gate survives (engine L444–448)               |
| F2  | P1   | **Rain canvas animated under `prefers-reduced-motion: reduce`** — global CSS kill-block cannot stop a JS rAF loop                                                                         | `reducedRain.changedPixels: 3614` over 1.2 s with reduce emulated | **Fixed** — scene now honors `prefersReducedMotion` (static pass, no loop); primary refined the transform approach in their rewrite |
| F3  | P1   | **Finale layout collision** — evidence desk bar overlapped the ENTER THE COURT block at 760 px viewport height                                                                            | screenshot `s7`                                                   | Primary restructured the desk bar (`bottom-4 sm:bottom-6`); **needs fresh verification under the new timeline** (their active work) |
| F4  | P2   | **Stale loading-veil / body palette in `index.html`** — `#090909` bg + old oxblood gradient boot-flash against the new `#111315` world; plus old-copper `#B76548` on compare CTA          | code inspection; compare-modal screenshot s9-family               | **Fixed** — see C1/C5                                                                                                               |
| F5  | P2   | **Keyboard focus invisibility** — `focus:outline-none` with no visible replacement on sound toggle, CTA, charter link                                                                     | code inspection                                                   | **Fixed** — see C3                                                                                                                  |
| F6  | P2   | **Dangling favicon reference** — `index.html` linked `/favicon.svg` while `public/favicon.svg` was deleted (primary, unstaged) → guaranteed 404 in every build                            | `git status` (` D public/favicon.svg`)                            | **Fixed** — icon `<link>` removed from `index.html` to match the deletion                                                           |
| F7  | Info | jsdom test crash: `window.matchMedia is not a function` in the scene's reduced-motion memo (my introduced code)                                                                           | vitest run 16:16                                                  | **Resolved** — primary hardened the guard in their rewrite (scene L40–41: `typeof window.matchMedia === 'function' &&`)             |

Full flows verified working at the 7.5 s-era build: desk bar → case-file modal (kbd `1` + pointer), Escape close, monitor modal → scrub `21:14:03` → `ANOMALY: SILHOUETTE` caption, compare modal → dossier. **Zero console errors** in both walkthrough and smoke passes.

⚠️ **Timeline change mid-review:** the primary rewrote the master timeline (tests now describe a ~21 s master timeline, 18–24 s window). The approved product spec said the autoplay completes in **7–8 s**; a 21 s autoplay is a spec-level decision the primary appears to be making deliberately. Flagged for human review — not challenged on creative grounds, but it re-invalidates all wall-time browser probes (re-verify flows after the pivot settles).

## 2. Improvements implemented (state as of this writing)

### Committed (clean-slate, no entanglement with primary WIP)

- **C1 — `index.html`** (one commit with this review doc):
  - `<link rel="preload" as="image" fetchpriority="high">` for `shot1_rain_arrival.jpg` + `shot2_case_file.jpg` — boot resolves into the arrival plate, not a dark rectangle.
  - Loading veil migrated to the new palette (`#111315` bg, ivory/tungsten gradient), body classes updated.
  - Favicon `<link>` removed (F6).

### In the shared tree (uncommitted; entangled with the primary's WIP by file, not by hunk)

- **C2 — `src/components/CinematicEngine.ts`**: `inspectObject()` gates non-`'none'` targets behind post-cinematic (`ctaVisible || act === FINALE || COMPLETED`) + an idempotency guard so re-inspecting the same target doesn't stack audio cues. ✔ Survives in the primary's rewritten engine.
- **C3 — `src/components/LandingPage.tsx`**: `focus-visible` rings/indicators for sound toggle, ENTER THE COURT CTA, and charter link. ✔ Survives in the primary's current file.
- **C4 — `src/components/RoomWasNeverEmptyScene.tsx`**: `prefersReducedMotion` (rain static pass + frozen plate drift). Primary integrated and re-expressed parts in their rewrite; crossfades remain CSS-driven (global CSS reduce-block handles them).
- **C5 — compare-modal stray `#B76548` → `#782F37`** (palette leak). Re-applied after a rewrite restored the old color (evidence line 889 → grep pre/post).
- **C6 — `src/test/CinematicEngine.test.ts`**: 6 new engine tests for the forensic-desk API — `inspectObject` mid-film no-op / post-CTA works / `'none'` always allowed / idempotent audio / `setMonitorScrub` clamping (−5→0, 10→3) / anomaly-chime single-fire. All pass (33/33 total). Mid-film assertion made timeline-agnostic (`!ctaVisible`) after the primary's 21 s rewrite invalidated act-position assumptions.

## 3. Deliberately left to the primary (ownership / mid-flight caution)

1. **Modal dialog semantics** (`role="dialog"`, `aria-modal="true"`, `autoFocus` on close buttons): I added these; the primary's rewrite restructured the modals and they are currently absent. Recommend re-adding in the primary's final markup (labels for close buttons did survive).
2. **Desk-bar / CTA collision (F3)**: primary owns the finale layout now; verify at 1280×760 and mobile 390×844 once the timeline lands.
3. **Asset payload**: six ~700 KB JPEGs (~4 MB) all eagerly load at mount. My preloads cover the first two plates; a staged loader (mount later layers only near their windows) is a larger, primary-owned change.
4. **Dead code**: `WebGlFallback.tsx` + `src/components/Tribunal3D/*` are no longer imported by `LandingPage` (the 2.5D scene needs no WebGL). Flagged, not deleted.
5. **21 s vs 7–8 s autoplay**: spec-level call — needs explicit human sign-off.

## 4. Verification log

- `npm run check` → **typecheck ✔ · eslint ✔ · prettier ✔ · vitest 33/33 ✔** (27 pre-existing + 6 new).
- Browser walkthrough (7.5 s-era build, before the primary's timeline rewrite): all flows green, `errors: []` — probe JSON recorded in report §1.
- Smoke probe on the 21 s build (3 s in): `consoleErrors: []`.
- Known stale-pointer: `kbDuringFilmOpensModal` / reduced-rain / CTA-collision probes need a **re-run once the 21 s timeline settles** (probe script `secondary-probe1.tmp.mjs` was temporary and removed; timewindows in it assume 7.5 s).

## 5. Handoff to primary

Sequenced recommendations:

1. Finish the timeline rewrite, then re-run a full-browser pass (keyboard gating F1, F2 rain-freeze, F3 collision, mobile-stacked desk).
2. Decide the 21 s autoplay question with the product spec (7–8 s) explicitly in the loop.
3. Re-add `role="dialog"` / `aria-modal` / initial close-button focus in your final modal markup (§3.1).
4. Consider the staged plate loader (§3.3) if first-paint budget matters for deploy.
5. When absorbing these uncommitted deltas, note which `index.html` lines are already committed — don't re-apply them.
