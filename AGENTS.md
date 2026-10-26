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

## Current status (2026-10-26, working tree — after `e2dd4d3`)

- Master cinematic is **18.8 s** (re-cut this session, uncommitted in primary WIP); `npm run check` green: **33 tests / 3 files**, typecheck + eslint + prettier clean. Beat screenshots prove the story order (inside-CCTV → bezel pull-back → case file → access slip + silhouette → anomaly re-entry → tribunal).
- Effective camera rule learned the hard way: large translated zooms on the chamber plate desync in paint (right edge can fall to black at e.g. `scale(1.8) translate(-44.3%)`); keep `translate-x: 0` for in-world inspection moves. Evidence-macro dissolves are the reliable way to make evidence readable.
- `playwright` is installed as a **devDependency** (Chromium browser downloaded) for real-browser verification; probe scripts were temporary root-level `*.tmp.mjs` files (must be deleted before `npm run check` — prettier fails on them) — evidence lives in `C:\Users\HP\AppData\Local\Temp\opencode\holytrial-shots\` and `…\holytrial-shots-secondary\`.
- Gotcha: stale Vite dev servers may hold ports 5173–5175; always use the port the _current_ `npm run dev` prints. Killing stray `node` processes also kills dev servers — restart afterwards. In-page `import()` of engine modules from `page.evaluate` is unreliable in this dev graph (can read a detached module copy); assert via jsdom or the DOM, not module introspection.

## Context-exhaustion handoff loop (mandatory)

- When your context window is **about to run out of tokens** (low remaining budget — before your final message is lost), you **must** update this `AGENTS.md` and `pending.md` **accurately** with the current state: what was completed, exact open items (with file paths and next actions), verification/commit status, and any evidence that must not be re-derived.
- Then, in your final visible response, **explicitly tell the next instance/session to do the same** — instruct it to read `AGENTS.md` + `pending.md` first, continue the recorded open items, and repeat this update-before-death step. This creates a **closed loop**: every dying session hands off a truthful snapshot, and every incoming session maintains it.
- Rules: update _before_ the final answer, not after; keep both files consistent with each other; cite commit hashes/`git log -1 --oneline` for what's actually landed; never leave the handoff claim unverified if a fresh check is cheap (`npm run check`).

## Commits

- Format `type(scope): description` (feat/fix/docs/refactor/test/chore). One task = one commit; scope is the phase number for phase work (e.g. `feat(phase-2): ...`).
- Never `--allow-empty`; confirm the commit landed (`git log -1 --oneline`) before the next task.
- Windows host: no `&&`/`||` chaining of shell commands — run each command separately (a chained command may parse-fail and never run).
