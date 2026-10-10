# Repository Guidelines

## Project Structure & Module Organization

Pecuária Inteligente is a Brazilian livestock market intelligence MVP covering breeding, rearing, finishing, slaughter, and dairy production. The repository has started implementation with shared contracts; the application remains under development.

- `README.md`: product scope, planned features, roadmap, and quality criteria.
- `ABOUT.md`: academic context, contribution preferences, and delivery checklist.
- `data/demonstrativa/v0.1/`: fixed CSV/JSON demonstration data, provenance, generation recipe, expected scenarios, and SHA-256 checksums.
- `packages/contracts/`: TypeBox contracts, types, server validators, pure browser validators, semantic checks, canonical JSON, and colocated tests.
- `packages/domain/`: pure filters, calendar, decimal indicators, localized presentation, and colocated tests.
- `tools/quality/check-data.mjs`: fixed data integrity, recipe, calendar, territory, and scenario verification.
- Root manifests and quality configuration cover contracts and domain; application modules and CI configuration are still pending.

Define requirements and architecture before selecting technologies. Document new module locations in `README.md`. Keep initial work focused on market monitoring; individual herd management is outside the initial scope. Do not version `PROMPTS.md`.

## Build, Test, and Development Commands

Use Node.js `24.21.0` and npm `11.19.0`. From the repository root, `npm ci` installs the lockfile, `npm run build` generates contracts and compiles contracts/domain, `npm run check` verifies types/style/lint, and `npm test` runs the active contracts and domain projects. See `README.md` for the verified commands and incremental scope.

Useful repository checks:

- `git status --short`: inspect pending changes.
- `git diff`: review tracked changes; inspect untracked files separately.
- `git diff --check`: detect whitespace errors in tracked changes.

Do not assume commands such as `npm test` work before their configuration exists.

## Coding Style & Naming Conventions

Write this contributor guide in English. Existing product documentation uses Brazilian Portuguese; follow its language when updating those files. Use hierarchical Markdown headings, short paragraphs, descriptive names, and fenced blocks for command examples.

TypeScript uses strict checking, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. Prettier uses two spaces, semicolons, single quotes, LF, and preserved Markdown prose wrapping. ESLint applies type-aware rules; browser contract code must remain pure.

## Testing Guidelines

Follow the Red–Green–Refactor TDD cycle specified in `ABOUT.md`. Add unit or integration tests for implemented behavior, especially ingestion, normalization, and critical calculations. Verify formulas, units, and input assumptions.

Vitest contracts and domain tests use colocated `.test.ts` files with explicit imports and no retries. Add the remaining projects as their modules arrive; never pass an empty suite. Coverage V8 reports the implemented scope without an arbitrary threshold. Academic delivery requires executable, passing automated tests.

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
