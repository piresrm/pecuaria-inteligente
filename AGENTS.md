# Repository Guidelines

## Project Structure & Module Organization

Pecuária Inteligente is a Brazilian livestock market intelligence MVP covering breeding, rearing, finishing, slaughter, and dairy production. The repository has started implementation with shared contracts, domain logic, PostgreSQL publication, and versioned HTTP queries; the application remains under development.

- `README.md`: product scope, planned features, roadmap, and quality criteria.
- `ABOUT.md`: academic context, contribution preferences, and delivery checklist.
- `data/demonstrativa/v0.1/`: fixed CSV/JSON demonstration data, provenance, generation recipe, expected scenarios, and SHA-256 checksums.
- `packages/contracts/`: TypeBox contracts, types, server validators, pure browser validators, semantic checks, canonical JSON, and colocated tests.
- `packages/domain/`: pure filters, calendar, decimal indicators, localized presentation, and colocated tests.
- `tools/quality/check-data.mjs`: fixed data integrity, recipe, calendar, territory, and scenario verification.
- `apps/api/src/demo/`, `apps/api/src/operations/`: demonstration validation, recipe generation, initial preparation, explicit publication, and migration commands.
- `apps/api/src/db/`, `apps/api/drizzle/`: PostgreSQL schema, connections, reviewed SQL migrations, and integration tests in `apps/api/tests/integration/`.
- `infra/postgres/init-roles.sh`: provision three independent database roles using explicit secret files.
- `apps/api/src/http/`, `apps/api/src/app.ts`: versioned GET routes, raw query validation, public errors, canonical JSON, conditional HTTP, and internal readiness.
- `apps/api/src/control/`, `apps/api/src/server.ts`: versioned resource cache, mandatory concrete IP/database controls, aggregate metrics, explicit proxy configuration, and executable lifecycle wiring.
- `apps/web/src/query/`: pure browser HTTP client, consistent progressive query state, foreground admission, and verification scheduler.
- `apps/web/src/storage/`: IndexedDB stores, UTF-8 budget, revision/generation confirmation, validated recovery, and browser persistence adapter.
- `apps/web/src/{App,main}.tsx`: minimal React surface, initialization, and recovery/storage notices; full dashboard, chart, and HTTPS integration remain pending.
- `apps/web/tests/storage-*`, `apps/web/storage-test.vite.config.ts`, and `tests/e2e/storage.spec.ts`: isolated storage browser-test artifact and real transaction scenarios; execution awaits trusted HTTPS T10.
- `DESIGN.md`, `premium-ui.json`: implemented minimal visual tokens, canonical owners, and static/runtime command map.
- Root quality configuration covers contracts, domain, API, and web; CI is still pending.

Define requirements and architecture before selecting technologies. Document new module locations in `README.md`. Keep initial work focused on market monitoring; individual herd management is outside the initial scope. Do not version `PROMPTS.md`.

## Build, Test, and Development Commands

Use Node.js `24.21.0` and npm `11.19.0`. From the repository root, `npm ci` installs the lockfile, `npm run build` generates contracts and compiles contracts/domain/API and demonstration operations before building web, `npm run check` verifies types/style/lint, and `npm test` runs the active contracts, domain, API, and components projects. `npm run test:integration` requires Docker and exercises isolated PostgreSQL instances. `npm run db:generate` generates reviewed migrations; `npm run db:migrate` applies history using explicit environment configuration documented in the README. `npm run api:start` runs the compiled API with the explicit database and proxy environment configuration documented in the README. `npm run web:dev` runs the development-only Vite surface; same-origin API/HTTPS integration is pending. See `README.md` for the verified commands and incremental scope.

Useful repository checks:

- `git status --short`: inspect pending changes.
- `git diff`: review tracked changes; inspect untracked files separately.
- `git diff --check`: detect whitespace errors in tracked changes.

Do not assume commands such as `npm test` work before their configuration exists.

## Coding Style & Naming Conventions

Write this contributor guide in English. Existing product documentation uses Brazilian Portuguese; follow its language when updating those files. Use hierarchical Markdown headings, short paragraphs, descriptive names, and fenced blocks for command examples.

TypeScript uses strict checking, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. Prettier uses two spaces, semicolons, single quotes, LF, and preserved Markdown prose wrapping. ESLint applies type-aware rules; browser contract code must remain pure. Only the API enables `skipLibCheck` for upstream Drizzle declaration incompatibilities; all project TypeScript retains the strict checks.

## Testing Guidelines

Follow the Red–Green–Refactor TDD cycle specified in `ABOUT.md`. Add unit or integration tests for implemented behavior, especially ingestion, normalization, and critical calculations. Verify formulas, units, and input assumptions.

Vitest contracts, domain, API, and components tests use colocated `.test.ts`/`.test.tsx` files with explicit imports and no runner retries. Web interactions use jsdom, while pure coordination tests may select Node for real demonstration fixtures. Add the remaining projects as their modules arrive; never pass an empty suite. Coverage V8 reports the implemented scope without an arbitrary threshold. Academic delivery requires executable, passing automated tests.

## Commit & Pull Request Guidelines

Follow `ABOUT.md`: make granular Conventional Commits with Brazilian Portuguese descriptions. Use the structure `<type>: <description>`.

Every commit message must include the footer `LLM-Model: model-name (Provider)`, separated from the description by a blank line. Identify the full model actually used in the current session, including its version and variant, and preserve the model and provider capitalization. Do not automatically convert model names to lowercase or use only a generic model family.

Examples:

- `LLM-Model: GPT-6.1-Sol (OpenAI)`
- `LLM-Model: GPT-4.1 (OpenAI)`
- `LLM-Model: Claude-Opus-4 (Anthropic)`
- `LLM-Model: Gemini-2.5-Pro (Google)`
- `LLM-Model: Nova-Pro (Amazon)`

The repository history uses `LLM-Model: GPT-6.1-Sol (OpenAI)` for that model. Before each commit, verify the actual model used in the current session and the applicable footer format. Do not assume a previous session's model is still in use or invent an identifier if it is unavailable.

Use feature branches and pull requests targeting `main`. Update `README.md` to reflect the delivered state. PR descriptions should explain purpose, changes, and validation; link relevant issues and include screenshots for UI changes when applicable.

## Security & Data Configuration

Add a stack-appropriate `.gitignore` before implementation commits. Never commit credentials. Preserve data provenance, reference dates, units, and commercial conditions; distinguish observations, estimates, and demonstration data. Before public release, add `LICENSE.txt` using the terms in `ABOUT.md` and complete its submission checklist.
