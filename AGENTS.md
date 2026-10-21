# AGENTS.md

## Project

HolyTrial ("Hype Court") — immersive courtroom-simulation SPA. **Frontend-only today**: React 19 + Vite 8 + TS, React Three Fiber/Three, GSAP (camera timelines) + Motion (micro-interactions), Tailwind v4. Product spec lives in `.gsd/SPEC.md` (status: FINALIZED).

Rules of engagement: `PROJECT_RULES.md` is the canonical GSD ruleset; `.gsd/STATE.md` is cross-session memory (read it first — it records current phase, next steps, and scope limits). `.gsd/ARCHITECTURE.md` is **stale** (pre-implementation snapshot); don't trust it.

## Scope freeze

Per `.gsd/STATE.md` (2026-10-17): do **not** implement Tavily Search, NVIDIA NIM, or the trial/courtroom interfaces until explicitly authorized. Current milestone is the mocked UI flow (Landing → Case Dossier).

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

## Commits

- Format `type(scope): description` (feat/fix/docs/refactor/test/chore). One task = one commit; scope is the phase number for phase work (e.g. `feat(phase-2): ...`).
- Never `--allow-empty`; confirm the commit landed (`git log -1 --oneline`) before the next task.
- Windows host: no `&&`/`||` chaining of shell commands — run each command separately (a chained command may parse-fail and never run).
