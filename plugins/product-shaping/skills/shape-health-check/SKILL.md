---
name: shape-health-check
description: >
  Run a health check on an existing project: dependency audit, security scan,
  test runner detection, CI/CD evaluation, and missing configuration analysis.
  Maps the three execution gates (pre/in/post) from /shape-bootstrap to an
  assessment framework for existing codebases. Reads optional
  context/foundation/stack-assessment.md from /shape-stack-assess to focus checks
  on identified gaps. Writes context/foundation/health-check.md with findings,
  prioritized fixes, and an agent-readiness verdict. Use when the user has an
  existing project and wants to verify its health before working with an agent.
  Trigger phrases: "health check", "check my project", "audit my project",
  "is my project healthy", "sprawdź projekt", "audyt projektu",
  "health-check", "project health".
  Use AFTER /shape-stack-assess (brownfield chain), BEFORE agent onboarding (m1-l4).
argument-hint: "[path-to-stack-assessment]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
  - TaskCreate
  - TaskUpdate
---

# Health Check: Audit an Existing Project for Agent-Readiness

This skill is the brownfield counterpart to `/shape-bootstrap`. Where bootstrapper scaffolds a new project and verifies the scaffold, health-check runs the same three execution gates (pre/in/post) as an assessment framework for an existing codebase. It reuses the per-language audit dispatch pattern from bootstrapper's post-scaffold verification but applies it as the opening move, not the closing check.

The skill sits in the brownfield chain: `/shape-idea → /shape-prd → /shape-stack-assess → /shape-health-check`. Its single job: audit the project's dependency health, test infrastructure, CI/CD configuration, and configuration completeness, then produce a structured report with prioritized fixes and an agent-readiness verdict.

When `context/foundation/stack-assessment.md` exists (from `/shape-stack-assess`), health-check links its findings to the quality-gate gaps identified there. The two reports are complementary: stack-assess evaluates the *stack choice* against quality gates; health-check evaluates the *project state* against operational health criteria.

## When to use, when to skip

**Use when**: the user has an existing project and wants to verify its health before starting agent-assisted development. The project directory should contain recognizable project markers (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `Gemfile`, `composer.json`, `*.csproj`, `pubspec.yaml`).

**Skip when**: the user is scaffolding a new project — `/shape-bootstrap` runs its own verification slots. Skip also when the user only wants a stack quality-gate assessment without operational health checks — that is `/shape-stack-assess` territory.

## Relationship to other skills

- `/shape-stack-assess` — upstream. Produces `context/foundation/stack-assessment.md`. Optional input — health-check can run without it, but the report is richer when gaps are linked.
- `/shape-bootstrap` — greenfield parallel. Same three execution gates, different application (scaffold verification vs existing project audit).
- `/shape-idea`, `/shape-prd` — earlier in the brownfield chain. Not direct inputs, but the PRD's scope-of-change context can inform which parts of the project matter most.

## Required inputs

1. An existing codebase in cwd with at least one recognizable project marker.

## Optional inputs

1. `context/foundation/stack-assessment.md` — if present, health-check cross-references quality-gate gaps with operational findings.
2. `context/foundation/prd.md` — if present and has `context_type: brownfield`, health-check uses the PRD's `## Scope of Change` to prioritize findings relevant to the planned work.

## Initial Response

When this skill is invoked:

1. **If a path argument was provided** (e.g. `/shape-health-check @context/foundation/stack-assessment.md`), strip a leading `@` if present and use the path as the stack-assessment location for this run. The assessment is optional context, not a precondition.
2. **If no argument was provided**, check for `context/foundation/stack-assessment.md`. If present, load it for cross-referencing. If absent, proceed without it.

## Workflow

### Pre-step — Resolve `CONTEXT_ROOT` and exclude `context/` from git

Before reading or writing anything under `context/`, apply the **context-root protocol** documented in `../shape-init/references/context-root-protocol.md` (or invoke `/shape-init` via the Skill tool, which runs the same protocol as its Step 0). The protocol does two things in one block:

1. **Resolves `CONTEXT_ROOT`** — the directory `context/` lives in. Inside a git repo, that's the parent of `git rev-parse --git-common-dir` (the **main** working tree of the repo, even when invoked from a worktree). Outside a git repo, it's the cwd. Anywhere this skill's instructions say `context/foo/bar.md`, treat it as `$CONTEXT_ROOT/context/foo/bar.md`.
2. **Excludes `context/` from git** — appends one line to `<git-common-dir>/info/exclude` (repo-local, untracked, never committed, **shared by every worktree of the same repo**). Idempotent: skipped if `context/` is already excluded.

Why this skill cares about the worktree case: if the user has a layout like `~/Projects/kibana` (main) plus `~/Projects/kibana.worktrees/feature-a`, etc., they don't want to re-init each worktree. The protocol resolves `CONTEXT_ROOT` to `~/Projects/kibana` from any of those locations — so this skill's reads/writes hit the same `context/foundation/` regardless of which worktree it ran from, and the git-exclude line is set once for the whole repo.

Why this skill cares about the exclude case: when the user is running this command from inside a shared repository they don't own (`kibana`, an upstream monorepo), the artifact this skill writes under `context/` is a personal working note. It must never be staged, committed, or pushed by accident. The exclusion lives only in the user's clone (in `info/exclude`, never in `.gitignore`) and cannot leak upstream.

The protocol is idempotent and safe — if `context/` is already excluded, this is a no-op. If you are not inside a git repo at all, `CONTEXT_ROOT` is just the cwd and there is no exclude to write. Surface a one-line `git-exclude: <state>` in this skill's final summary, plus a `context-root: <path>` line when `CONTEXT_ROOT` differs from cwd (so the user knows their notes are in the shared, worktree-spanning location).

Do not edit `.gitignore`. `/shape-init mode=gitignore` is the only path that touches the tracked `.gitignore`, and only when the user explicitly opted in.

### Step 0 — Cwd precondition

Detect project markers:

```bash
find . -maxdepth 1 \( -name "package.json" -o -name "Cargo.toml" -o -name "pyproject.toml" -o -name "go.mod" -o -name "Gemfile" -o -name "composer.json" -o -name "*.csproj" -o -name "pubspec.yaml" \) 2>/dev/null
```

If **no markers found**, print:

```
No project markers found in the current directory. /shape-health-check requires an existing codebase.
If you're starting from scratch, use /shape-bootstrap after /shape-tech-stack instead.
```

Then STOP.

If markers are found, detect the language family from the marker (same detection logic as `/shape-stack-assess` Step 1) and proceed to Step 1.

### Step 1 — Pre-check (dependency audit + lockfile + security)

**Execution gate: pre-check.** Before reading or changing anything in the project, audit the dependency tree. This maps to the bootstrapper's pre-execution gate: "what is the state of the hand-off before we act on it?"

#### 1a. Lockfile presence

Check for a lockfile matching the detected language family:

| Language family | Expected lockfiles |
|---|---|
| JS/TS | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb` |
| Python | `poetry.lock`, `uv.lock`, `Pipfile.lock`, `requirements.txt` (weak — not a true lock) |
| Rust | `Cargo.lock` |
| Go | `go.sum` |
| Ruby | `Gemfile.lock` |
| PHP | `composer.lock` |
| .NET | `packages.lock.json` (NuGet) |
| Dart | `pubspec.lock` |

If no lockfile is found, flag as a finding:

```
⚠ No lockfile detected. Dependency versions are not pinned — builds are non-reproducible
  and the agent cannot reason about exact dependency state.
  Fix: run <package-manager lock command> to generate a lockfile.
```

#### 1b. Dependency audit

Dispatch to the ecosystem's audit tool by language family. The dispatch table matches the bootstrapper's `audit_commands` pattern:

| Language family | Audit command | Notes |
|---|---|---|
| JS/TS | `npm audit --json` | Exits non-zero when vulnerabilities exist — not a halt condition |
| Python | `pip-audit --format json` | Falls back to skip if pip-audit not installed |
| Rust | `cargo audit --json` | Falls back to skip if cargo-audit not installed |
| Go | `govulncheck -json ./...` | Falls back to skip if govulncheck not installed |
| Ruby | `bundle audit check --update` | Human-readable output, parse line-by-line |
| PHP | `composer audit --format json` | Requires Composer 2.4+ |
| .NET | `dotnet list package --vulnerable --include-transitive` | Human-readable, parse for severity markers |
| Java, Dart | (skip) | No built-in audit tool; note the skip and recommend external tools |

Run the resolved command from cwd. Capture stdout, stderr, and exit code. The audit tool's exit code is informational — health-check does NOT halt on a non-zero audit exit.

**Severity tiering** (same as bootstrapper's post-scaffold verification):

- CRITICAL (CVSS >= 9.0) — surface inline
- HIGH (CVSS 7.0–8.9) — surface inline
- MODERATE (CVSS 4.0–6.9) — log only
- LOW (CVSS < 4.0) — log only

For tools with native severity (npm-audit, cargo-audit, govulncheck), use the tool's label. For tools without native severity, default to MODERATE unless the advisory explicitly names CRITICAL or HIGH.

When the tool distinguishes direct from transitive dependencies, surface the breakdown. Direct findings are immediately actionable; transitive findings are advisory.

#### 1c. Outdated dependencies check

If the language family supports it, run a quick staleness check:

| Language family | Command | What it shows |
|---|---|---|
| JS/TS | `npm outdated --json` | Current vs wanted vs latest for each package |
| Python | `pip list --outdated --format json` | Current vs latest |
| Rust | `cargo outdated --root-deps-only` (if installed) | Outdated direct deps |
| Ruby | `bundle outdated --only-explicit` | Outdated direct gems |

This check is informational — surface major version gaps and packages more than 2 major versions behind. Do not report every minor version bump.

**Failure mode for all 1a–1c steps**: WARN-AND-CONTINUE. If a tool is not installed, log the skip and proceed. If a network call fails, log the partial output and proceed. Never halt on a pre-check finding.

Echo one summary line after pre-check completes:

```
Pre-check: <lockfile status>. Audit: <C> CRITICAL, <H> HIGH, <M> MODERATE, <L> LOW.
Outdated: <N> packages with major version gaps.
```

### Step 2 — In-check (test runner, CI/CD, configuration)

**Execution gate: in-check.** Read-only analysis of the project's test infrastructure, CI/CD pipeline, and configuration completeness. This maps to the bootstrapper's in-execution gate: "what does the execution environment look like?"

#### 2a. Test runner detection and health

Detect the test runner from configuration files:

| Language family | Detection sources | Test runners |
|---|---|---|
| JS/TS | `package.json` scripts/devDeps, `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `cypress.config.*` | Vitest, Jest, Playwright, Cypress, Mocha |
| Python | `pyproject.toml [tool.pytest]`, `setup.cfg [tool:pytest]`, `tox.ini`, `pytest.ini` | pytest, unittest, tox |
| Rust | `Cargo.toml` (built-in `cargo test`) | cargo test |
| Go | (built-in `go test`) | go test |
| Ruby | `Gemfile` deps, `.rspec`, `Rakefile` | RSpec, Minitest |
| PHP | `phpunit.xml*`, `composer.json` deps | PHPUnit, Pest |
| .NET | `*.csproj` references | xUnit, NUnit, MSTest |

If a test runner is detected, attempt a dry run to verify tests can execute:

```bash
# JS/TS examples:
npx vitest run --reporter=json 2>&1 | head -50  # Vitest
npx jest --listTests 2>&1 | head -20             # Jest

# Python:
python -m pytest --collect-only 2>&1 | tail -5   # pytest

# Rust:
cargo test --no-run 2>&1 | tail -10              # cargo test

# Go:
go test -list '.*' ./... 2>&1 | head -20         # go test
```

Surface findings:

- **Test runner detected + tests run**: report test count if available, note runner name
- **Test runner detected + tests fail to run**: flag as a finding with the error
- **No test runner detected**: flag as a significant finding — the agent cannot verify its own changes

#### 2b. CI/CD configuration evaluation

Check for CI/CD configuration files:

```bash
find . -maxdepth 2 \( -name ".github" -o -name ".gitlab-ci.yml" -o -name "Jenkinsfile" -o -name ".circleci" -o -name "cloudbuild.yaml" -o -name "bitbucket-pipelines.yml" -o -name ".travis.yml" \) 2>/dev/null
```

If a CI configuration is found, read it and evaluate coverage:

| Stage | What to check |
|---|---|
| Lint | Is there a lint step? (eslint, ruff, clippy, rubocop, phpstan, etc.) |
| Test | Is there a test step? Does it match the detected test runner? |
| Build | Is there a build/compile step? |
| Type check | Is there a type-check step? (tsc, mypy, pyright, etc.) |
| Security | Is there a security scan step? (npm audit, Snyk, CodeQL, Dependabot, etc.) |

Surface a coverage summary:

```
CI/CD: <provider> detected. Stages: lint <✓/✗>, test <✓/✗>, build <✓/✗>,
type-check <✓/✗>, security <✓/✗>.
```

If no CI configuration is found, note it as a Category B item — the learner will set up CI in a later infrastructure lesson. Do not flag it as an urgent finding.

#### 2c. Missing configuration files

Check for common development configuration:

| File | Purpose | Severity if missing |
|---|---|---|
| `.editorconfig` | Consistent formatting across editors | low |
| `.prettierrc*` / `biome.json` (JS/TS) | Code formatting | medium (if no formatter configured) |
| `.eslintrc*` / `eslint.config.*` (JS/TS) | Linting | medium |
| `tsconfig.json` with `strict: true` (TS) | Type strictness | high (if TS project without strict) |
| `.gitignore` | Tracked file exclusions | high |
| `.env.example` / `.env.template` | Environment variable documentation | low |
| `CLAUDE.md` / `AGENTS.md` | Agent instruction files | Category B — covered in agent onboarding |

Surface missing files grouped by severity.

**Failure mode for all 2a–2c steps**: WARN-AND-CONTINUE. Read-only analysis should not fail, but if a file read errors or a dry-run hangs, capture what you can and move on.

Echo one summary line after in-check completes:

```
In-check: test runner <detected/not detected>, CI <provider/not detected>,
<N> configuration gaps (<H> high, <M> medium, <L> low).
```

### Step 3 — Post-check (assessment + recommendations)

**Execution gate: post-check.** Synthesize findings from pre-check and in-check into an agent-readiness verdict and prioritized fix list. This maps to the bootstrapper's post-execution gate: "what is the state after we've assessed everything?"

#### 3a. Cross-reference with stack-assessment

If `context/foundation/stack-assessment.md` exists, read it and link findings:

- If stack-assess identified a quality-gate failure (e.g., "typed: fail"), and health-check found no type-checking in CI → reinforce: "the stack lacks type safety AND CI doesn't enforce types — compensation is doubly important"
- If stack-assess identified compensation strategies → check whether the recommended instruction-file entries exist (are `CLAUDE.md` / `AGENTS.md` present? Do they contain the recommended rules?)
- If stack-assess gave a `ready-with-compensation` verdict but the compensation entries are missing → flag as a gap

#### 3b. Determine overall health status

Based on all findings:

- **healthy**: no CRITICAL/HIGH audit findings, test runner detected and working, no high-severity configuration gaps in Category A.
- **needs-attention**: some Category A findings but all addressable. Typical: a few HIGH audit advisories, missing formatter, or missing type strictness.
- **critical-issues**: CRITICAL audit findings, no test runner, or multiple high-severity Category A gaps compounding. The agent will struggle without preparation.

Category B findings (missing CI, missing AGENTS.md, missing deployment config) do **not** affect the verdict — they are expected at this stage and will be addressed in later lessons. A project can be `healthy` with no CI pipeline if it has a working test runner, clean dependencies, and good local configuration.

The verdict is informational, not blocking. Even `critical-issues` means "invest time in Category A fixes before expecting smooth agent collaboration," not "abandon the project."

#### 3c. Prioritized fix list

Split findings into two categories:

**Category A — Fix before agent work** (actionable now):

1. **Critical security vulnerabilities** — fix before any agent-assisted work touches affected code paths
2. **No test runner** — the agent cannot verify its own changes; install and configure one
3. **Missing lockfile** — non-reproducible builds undermine agent reliability
4. **High audit findings** — review and patch or accept the risk
5. **Missing type strictness** (TS without strict, Python without mypy) — agent generates less reliable code
6. **Missing formatter/linter** — agent's output style will be inconsistent
7. **Outdated dependencies with major gaps** — potential breaking changes when updating
8. **Missing .editorconfig / .env.example** — convenience, not blocking

**Category B — Addressed in upcoming lessons** (acknowledge, don't alarm):

These findings are real but the learner will set them up in upcoming steps. Frame them as "coming up next," not as problems:

- **No CI pipeline** → covered in the infrastructure/deployment lesson. Note the gap, point forward: "You'll set up CI in an upcoming lesson. For now, local test runner coverage is what matters for agent collaboration."
- **Missing agent instruction files** (CLAUDE.md / AGENTS.md) → covered in the agent onboarding lesson. Do not recommend creating them now: "Agent onboarding walks you through building these with the right content. Generating a stub now would be premature."
- **Missing deployment configuration** → covered in the infrastructure lesson. Acknowledge, don't prioritize.

When the health-check runs standalone, all findings go into a single ranked list. Forward-references to upcoming work (agent onboarding, infrastructure & CI/CD) should point at the relevant skill in this plugin: `/shape-agents-md` for agent onboarding, `/shape-infra-research` for deployment platform selection.

Each fix entry (in both categories) must include:

- What is wrong (the finding)
- Why it matters for agent workflows (the impact)
- What to do about it (the concrete fix command or action, or the lesson that covers it)
- Effort estimate: quick (< 5 min), moderate (15–30 min), significant (> 1 hour), or **upcoming lesson** for Category B items

### Step 4 — Write health-check.md

Check for collision:

```bash
test -f "$CONTEXT_ROOT/context/foundation/health-check.md"
```

If the file exists, ask:

AskUserQuestion:
- question: "context/foundation/health-check.md already exists. How would you like to proceed?"
  header: "Collision"
  options:
  - label: "Overwrite (Recommended)"
    description: "Replace the existing health check. The prior version is lost unless committed."
  - label: "Save as health-check-v2.md"
    description: "Preserve history. New report lands at the next available version slot."
  - label: "Abort"
    description: "Exit without writing. The conversation findings are preserved in chat only."
  multiSelect: false

Build the output file per `references/health-check-schema.md`.

Write to `context/foundation/health-check.md` (creating `context/foundation/` if it doesn't exist).

After the write, print the closing summary:

```
═══════════════════════════════════════════════════════════
  HEALTH CHECK COMPLETE
═══════════════════════════════════════════════════════════

  Project:        <project name>
  Health:         <healthy | needs-attention | critical-issues>
  Audit findings: <C> CRITICAL, <H> HIGH
  Test runner:    <detected (runner name) | not detected>
  CI/CD:          <provider | not detected>
  Fixes:          <N> recommended (<Q> quick, <M> moderate, <S> significant)

  ► Report:       context/foundation/health-check.md
  ► Next:         Agent onboarding — both greenfield and brownfield
                  paths converge with equivalent context artifacts.
═══════════════════════════════════════════════════════════
```

STOP. Do not chain into any next skill automatically.

## Output

Single file written: `context/foundation/health-check.md` (or `health-check-vN.md` if a versioned save was picked).

## References

- `references/health-check-schema.md` — the shape of `context/foundation/health-check.md`.

## Critical guardrails

1. **Cwd is a precondition.** The skill requires an existing codebase with recognizable project markers. No assessment from conversation context alone.

2. **Read-only analysis.** Health-check never modifies the project. No `npm audit fix`, no `pip install --upgrade`, no auto-patch. Suggesting fixes in the report is fine; running them is out of scope.

3. **WARN-AND-CONTINUE on every branch.** No finding halts the skill. CRITICAL security vulnerabilities, missing test runners, absent CI — all surface as findings with recommendations, never as blockers. The user decides what to fix and when.

4. **Prioritize by agent impact.** The fix list is ordered by impact on agent workflows, not by generic severity. A missing test runner matters more to an agent than a LOW audit advisory, because the agent cannot verify its own changes without tests.

5. **Concrete fixes, not generic advice.** Every recommendation must include the specific command or action. "Add tests" is not a fix; "Run `npm init vitest@latest` to set up Vitest, then add a test script to package.json" is a fix.

6. **Cross-reference stack-assessment when available.** If the user ran `/shape-stack-assess` first, health-check must link findings to quality-gate gaps. The two reports are complementary — don't duplicate the gate analysis, reference it.

7. **Skill-internal labels stay internal.** When speaking to the user, never reference step numbers, gate names as technical terms, or internal field names. Use plain language: "dependency audit", "test infrastructure check", "overall health."

8. **Frame missing pieces as forward-references.** Missing CI/CD, missing `AGENTS.md`, and missing deployment config are common gaps in a brownfield assessment — frame them as "covered by `/shape-agents-md` or `/shape-infra-research`," not as failures. The verdict must not penalize the user for things they haven't gotten to yet.

9. **Universal language only.** No private vault paths or organization-specific branding in shipped content.
