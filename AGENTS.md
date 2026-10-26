# AGENTS.md

## Project

HolyTrial ("Hype Court") — immersive courtroom-simulation SPA. **Frontend-only today**: React 19 + Vite 8 + TS, React Three Fiber/Three, GSAP (camera timelines) + Motion (micro-interactions), Tailwind v4. Cross-session status lives in `pending.md`.

Rules of engagement: `PROJECT_RULES.md` is the canonical ruleset; `pending.md` is the audit/status ledger (read it first — it records what landed, open residuals, and verification status). GSD scaffolding (`.gsd/`, `.agents/`, `.agent/`, `.gemini/`, `GSD-STYLE.md`) was intentionally removed on 2026-10-21 — do not restore it.

## Scope freeze

Standing scope limit (set 2026-10-17): do **not** implement Tavily Search, NVIDIA NIM, or the trial/courtroom interfaces until explicitly authorized. Current milestone is the mocked UI flow (Landing → Case Dossier).

## Commands

- `npm run check` — full gate: `typecheck && lint && format:check && test`. Run before declaring any work done.
- CI (`.github/workflows/frontend-ci.yml`) runs: `format:check`, `lint`, `typecheck`, `test`, `build` — in that order, on Node 24 from `.nvmrc` (`npm ci`).
- Single test file: `npm test -- src/test/CaseDossier.test.tsx`
- Dev server: `npm run dev`. Build: `npm run build` (= `tsc -b && vite build`, so it also type-checks).

## Gotchas

- Tests use Vitest with `globals: true`, jsdom, setup at `src/test/setup.ts`. Config sets `passWithNoTests: true` — a typo'd test path exits 0 with "no tests found". Confirm the runner actually matched your file.
- Tailwind v4 is CSS-first: `@import 'tailwindcss'` + theme tokens in `src/index.css`, via `@tailwindcss/vite`. There is **no** tailwind.config.js — add tokens in CSS.
- No router despite `react-router-dom` being installed. View switching is `useState` in `src/components/LandingPage.tsx` (`threshold` / `dossier`). Don't sprinkle in routes without a decision.
- The 3D view (`src/components/Tribunal3D/`) has a full 2D text fallback (`WebGlFallback`, chosen by WebGL availability in `LandingPage.tsx`) and `prefers-reduced-motion` handling in **both** `CinematicEngine.ts` and `index.css`. When touching views or animations, keep the fallback and reduced-motion branches working — it's a spec success criterion.
- Prettier and ESLint both run post-commit (`husky` → `lint-staged`: eslint --fix then prettier on staged files).

## Secondary review (2026-10-21 → 2026-10-26)

- `secondary_review.md` (root) is the secondary agent's coordination ledger: browser-verified findings (mid-film keyboard modals → fixed via engine `inspectObject` gate; reduced-motion rain → fixed; stale veil palette → fixed; focus-visible a11y → fixed), uncommitted-vs-committed attribution, and open items (`role="dialog"`/`autoFocus` on inspection panels; staged plate loader; `WebGlFallback`/`Tribunal3D` dead code; orphan plates `shot1_rain_arrival.jpg` + `shot3_monitor_empty.jpg`; translated-zoom paint desync).
- ✅ Resolved 2026-10-26 (secondary, uncommitted — inside primary WIP): timeline re-cut **21.0 → 18.8 s** (−10.5 %, 18–21 s mandate) with `ACT_PROGRESS_RANGES` + scene shot fractions remapped; post-cinematic inspection redesigned to dissolve to the dedicated evidence macro plates (`case_file` → `shot2_case_file.jpg`, `access_record` → `shot4_contradiction_record.jpg`) with a modest lean; `monitor` = centered `scale(1.3)` push-in; hero title/CTA dims to 0.25 while a panel is open. New test spec: `HARD_LIMIT_S = 21.0`, `TARGET_S = 18.8`. Verified: `npm run check` green (**33 tests, 3 files**), Chromium beat pass zero errors, CTA at **≈17.6 s** wall.
- ⚠️ The earlier "approved spec said 7–8 s" conflict is closed: the current approved direction is 18–21 s. The 21 s rewrite flagged here is what this pass re-cut.
- Next session: read `AGENTS.md` + `pending.md` + `secondary_review.md` first; continue recorded open items; before context runs out, update all three truthfully (closed handoff loop).

## Current status (2026-10-26, Phase 1 delivery)

- Master cinematic is **18.8 s** with genuine dual-format CCTV video assets (`cctv_surveillance_archive.mp4` / `.webm`) playing on the CRT monitor, with authentic scanlines, sensor noise, timecode roll, and the 21:14:03 silhouette anomaly reveal.
- Post-cinematic in-world inspection is complete and interactive: tape scrubber with play/pause and timestamp jumps, zero overlap with hero CTA/title (`heroOpacity: 0`), clean keyboard navigation (`1`, `2`, `3`, `C`, `Esc`), and seamless product entry flow to `CaseDossier`.
- Design system foundation established in `src/index.css`: Canonical 6-token palette (`graphite`, `smoked-slate`, `aged-metal`, `archival-ivory`, `oxblood`, `tungsten`) + strict typography hierarchy (`Cormorant Garamond` serif display, `IBM Plex Sans` UI, `IBM Plex Mono` technical timestamps).
- Full gate passes cleanly: `npm run check` (typecheck 0 errors, eslint 0 errors/warnings, prettier 100% formatted, **33 tests / 3 files** green), `npm run build` (production bundle built in ~750ms).
- Real browser evidence captured via Playwright in `public/evidence/01_shot1_surveillance.png` through `09_case_dossier_flow.png` with 0 console errors.

## Context-exhaustion handoff loop (mandatory)

- When your context window is **about to run out of tokens** (low remaining budget — before your final message is lost), you **must** update this `AGENTS.md` and `pending.md` **accurately** with the current state: what was completed, exact open items (with file paths and next actions), verification/commit status, and any evidence that must not be re-derived.
- Then, in your final visible response, **explicitly tell the next instance/session to do the same** — instruct it to read `AGENTS.md` + `pending.md` first, continue the recorded open items, and repeat this update-before-death step. This creates a **closed loop**: every dying session hands off a truthful snapshot, and every incoming session maintains it.
- Rules: update _before_ the final answer, not after; keep both files consistent with each other; cite commit hashes/`git log -1 --oneline` for what's actually landed; never leave the handoff claim unverified if a fresh check is cheap (`npm run check`).

## Commits

- Format `type(scope): description` (feat/fix/docs/refactor/test/chore). One task = one commit; scope is the phase number for phase work (e.g. `feat(phase-2): ...`).
- Never `--allow-empty`; confirm the commit landed (`git log -1 --oneline`) before the next task.
- Windows host: no `&&`/`||` chaining of shell commands — run each command separately (a chained command may parse-fail and never run).
