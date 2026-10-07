# Repository Guidelines

## Project Structure & Module Organization

Pecuária Inteligente is a Brazilian livestock market intelligence MVP covering breeding, rearing, finishing, slaughter, and dairy production. The repository is currently in the conception and documentation phase.

- `README.md`: product scope, planned features, roadmap, and quality criteria.
- `ABOUT.md`: academic context, contribution preferences, and delivery checklist.
- `data/demonstrativa/v0.1/`: fixed CSV/JSON demonstration data, provenance, generation recipe, expected scenarios, and SHA-256 checksums.
- No application source directories, test suites, dependency manifests, or CI configuration exist yet.

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
