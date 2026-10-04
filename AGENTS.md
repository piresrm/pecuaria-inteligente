# Repository Guidelines

## Project Structure & Module Organization

Pecuária Inteligente is a Brazilian livestock market intelligence MVP covering breeding, rearing, finishing, slaughter, and dairy production. The repository is currently in the conception and documentation phase.

- `README.md`: product scope, planned features, roadmap, and quality criteria.
- `ABOUT.md`: academic context, contribution preferences, and delivery checklist.
- No source directories, tests, assets, dependency manifests, or CI configuration exist yet.

Define requirements and architecture before selecting technologies. Document new module locations in `README.md`. Keep initial work focused on market monitoring; individual herd management is outside the initial scope. Do not version `PROMPTS.md`.

## Build, Test, and Development Commands

There are currently no installation, build, test, or local execution commands. Add reproducible commands to `README.md` when introducing the technology stack.

Useful repository checks:

- `git status --short`: inspect pending changes.
- `git diff`: review tracked changes; inspect untracked files separately.
- `git diff --check`: detect whitespace errors in tracked changes.

Do not assume commands such as `npm test` work before their configuration exists.

## Coding Style & Naming Conventions

Write this contributor guide in English. Existing product documentation uses Brazilian Portuguese; follow its language when updating those files. Use hierarchical Markdown headings, short paragraphs, descriptive names, and fenced blocks for command examples.

No language-specific indentation rules, formatter, or linter are established. Choose and configure these with the first implementation, then document the conventions and commands.

## Testing Guidelines

Follow the Red–Green–Refactor TDD cycle specified in `ABOUT.md`. Add unit or integration tests for implemented behavior, especially ingestion, normalization, and critical calculations. Verify formulas, units, and input assumptions.

No test framework, naming convention, runner, or coverage threshold is configured yet. Establish these with the stack. Academic delivery requires executable, passing automated tests.

## Commit & Pull Request Guidelines

History contains only `Initial commit`; no recurring convention is established. Follow `ABOUT.md`: make granular Conventional Commits with Brazilian Portuguese descriptions. Use the structure `<type>: <description>`. Include the mandatory footer `LLM-Model: model-name (Provider)`, identifying the actual model used.

Use feature branches and pull requests targeting `main`. Update `README.md` to reflect the delivered state. PR descriptions should explain purpose, changes, and validation; link relevant issues and include screenshots for UI changes when applicable.

## Security & Data Configuration

Add a stack-appropriate `.gitignore` before implementation commits. Never commit credentials. Preserve data provenance, reference dates, units, and commercial conditions; distinguish observations, estimates, and demonstration data. Before public release, add `LICENSE.txt` using the terms in `ABOUT.md` and complete its submission checklist.
