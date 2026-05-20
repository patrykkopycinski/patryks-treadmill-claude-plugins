# product-shaping

**Take a product from "I have an idea" to a scaffolded codebase — with structured discovery, schema-locked PRDs, an agent-friendly stack pick, and a safe bootstrap.**

A pipeline of skills that walk you through product discovery and project setup. Works for both **greenfield** (starting from scratch) and **brownfield** (adding meaningful changes to an existing system) projects. Outputs land on disk under `context/foundation/` so a human (or another agent) can review every step.

---

## Where do I start?

**If you're not sure**, just say:

```
What should I do? I want to start a new project.
```

…and the `shape-workflow-guide` skill will pick up, ask a couple of orienting questions (greenfield vs brownfield, idea vs existing codebase), and point you at the right next step.

**If you already know what you want**, jump straight in:

| Situation | First skill to run |
|---|---|
| I have an idea I want to build from scratch | `/shape-idea` |
| I have rough notes already and want a real PRD | `/shape-prd` |
| I have a PRD and need to pick a tech stack | `/shape-tech-stack` |
| I have a stack picked and want to scaffold the repo | `/shape-bootstrap` |
| I have an existing codebase and want to assess it | `/shape-stack-assess` |
| I want to write `AGENTS.md` for this repo | `/shape-agents-md` |
| I want to capture a learning or pattern | `/shape-lesson` |

---

## Is this safe to run inside my repo?

Yes — including inside a shared monorepo you don't own (e.g. `kibana`, an upstream you're contributing to) and including with git worktrees. The plugin is designed around two safety invariants that every skill enforces automatically, before it writes a single byte:

1. **Your shaping notes never reach the host repo's git history.** `context/foundation/prd.md`, `tech-stack.md`, etc. are personal working notes. They are excluded from git via `<git-common-dir>/info/exclude` — a repo-local, **untracked** exclusion file. There is no way to push that exclusion upstream, no way to accidentally `git add context/`, and no way for a teammate to see the line by inspecting `.gitignore` (because nothing is added there).
2. **One config covers every worktree of the repo, current and future.** `context/` is anchored to the **main repo's working tree** (the parent of `git rev-parse --git-common-dir`), not to your cwd. So whether you run `/shape-prd` from the main checkout or from any worktree of the same repo, you read and write the same files. You configure the plugin **once per repo**, never per worktree.

### Concretely, in a kibana-style layout

If your filesystem looks like this:

```
~/Projects/kibana                         ← main checkout
~/Projects/kibana.worktrees/feature-a     ← worktree
~/Projects/kibana.worktrees/feature-b     ← worktree
~/Projects/kibana.worktrees/hotfix        ← worktree
```

…then the first time you run any `/shape-*` from any of those four locations:

- `context/` is created at `~/Projects/kibana/context/` (the main checkout).
- One line `context/` is appended to `~/Projects/kibana/.git/info/exclude` (the shared exclude file — every worktree of the repo reads from this).

After that first run, every subsequent run from any worktree:

- Reads and writes `~/Projects/kibana/context/foundation/...` — so `/shape-idea` in `feature-a` and `/shape-prd` in `feature-b` operate on the same `shape-notes.md` and `prd.md`.
- Sees `git-exclude: already-excluded` (no second append, no duplicate line).
- Does not prompt you to re-init or re-configure anything.

A worktree you create next month — say `~/Projects/kibana.worktrees/exploration` — inherits the same configuration the moment it exists. There is nothing to copy, sync, or re-run.

### What stays worktree-local

The shared anchor only applies to **shaping notes** (`context/`). Everything that legitimately belongs to a single branch stays in the worktree it was written from:

- Source code scaffolded by `/shape-bootstrap` — written to your cwd (the worktree).
- `AGENTS.md` written by `/shape-agents-md` — written to your cwd (the worktree). Different branches can have different agent guidance.
- `package.json`, lockfiles, your branch's diff — never touched by the plugin.

### The guarantees, individually verifiable

Each one of these is a property the plugin enforces, not a promise it makes:

- **No commit-by-accident.** `git status` will not list anything under `context/` after a `/shape-*` run. Confirm: `git status` from any worktree.
- **No upstream leak.** The exclusion lives in `info/exclude`, which is in your local clone's `.git/` directory — a path git never transmits over `push`/`fetch`/`clone`. Confirm: `cat $(git rev-parse --git-common-dir)/info/exclude`.
- **Survives `git clean -fdx`.** `git clean` only removes files git considers untracked-and-not-ignored. `context/` is now ignored, so it stays. Confirm: `git clean -fdxn` (the `n` is dry-run).
- **No `.gitignore` edits.** The default path never touches `.gitignore`. Confirm: `git diff .gitignore` is empty after a `/shape-*` run. (Opt in to a `.gitignore` edit explicitly with `/shape-init mode=gitignore` if you want the exclusion shared with teammates.)
- **Idempotent.** Running the protocol again — from a new worktree, after a `git clean`, in a session a month later — never duplicates the line, never re-prompts, never re-scaffolds existing files.

If any of those properties fails for you, that's a bug — open an issue with the output of the failing skill.

For the full mechanism (bash, edge cases like bare repos and non-git directories, the `mode=gitignore` opt-in, and what the protocol explicitly does **not** do), see [Safety reference: the context-root protocol](#safety-reference-the-context-root-protocol) below, or `skills/shape-init/references/context-root-protocol.md`.

---

## The pipeline

Two flows, same starting point. Each skill writes a small artifact under `context/foundation/` that the next skill consumes — nothing is held in conversation memory.

### Greenfield (starting from scratch)

```
/shape-idea          →  context/foundation/shape-notes.md
       ↓
/shape-prd           →  context/foundation/prd.md
       ↓
/shape-tech-stack    →  context/foundation/tech-stack.md
       ↓
/shape-bootstrap     →  scaffolded project + verification log
       ↓
/shape-agents-md     →  AGENTS.md  (onboarding doc for AI agents)
```

### Brownfield (existing project)

```
/shape-idea          →  shape-notes.md  (auto-detects existing project)
       ↓
/shape-prd           →  prd.md  (delta-framed, 11 sections)
       ↓
/shape-stack-assess  →  stack-assessment.md
       ↓
/shape-health-check  →  health-check.md
       ↓
/shape-agents-md     →  AGENTS.md
```

At any point you can also run `/shape-infra-research` to pick a deployment platform, `/shape-rule-review` to audit existing AI rules, or `/shape-lesson` to capture a learning.

---

## What about OpenSpec? (the change-level companion)

The product-shaping pipeline answers a **product-level** question: *what are we building, for whom, on what kind of stack?* It produces stable, upstream artifacts (`prd.md`, `tech-stack.md`) — written once per product, then read by everything downstream.

OpenSpec answers a **change-level** question: *what's the next concrete delta, with what spec deltas and tasks?* It produces per-change artifacts (`proposal/specs/design/tasks`) — one folder per change, in `openspec/changes/<change-name>/`.

These are complementary, not redundant. The recommended workflow:

```
/shape-idea → /shape-prd → /shape-tech-stack → /shape-bootstrap → /shape-agents-md
                                                                   ↓
                                                              openspec init
                                                                   ↓
                              For each concrete change you make against the PRD:
                              /openspec-advisor → openspec change create → implement → archive
```

The hand-off happens at exactly two points, and the relevant `/shape-*` skills surface OpenSpec for you:

- **After `/shape-prd`** — the closing message tells you OpenSpec is the right tool for implementation chunks downstream, but you're still routed to the next product-level step (`/shape-tech-stack` greenfield, `/shape-stack-assess` brownfield) first. The PRD comes before any change.
- **After `/shape-bootstrap`** — the closing message recommends running `openspec init` in the freshly scaffolded project alongside `/shape-agents-md`. This is the natural attach point because OpenSpec needs a real codebase to bind to.

### The altitude boundary

| | Product-shaping | OpenSpec |
|---|---|---|
| Question answered | What are we building? | What's the next change? |
| Granularity | One per product | One per change (delta) |
| Lives in | `context/foundation/` (shared across worktrees of this repo) | `openspec/changes/<name>/` (independent per worktree by design) |
| Source of truth for | The product itself: PRD, scope, success criteria, tech-stack choice | This specific change: proposal, spec deltas, design, task list |
| Lifecycle | Stable; updated by re-running `/shape-prd` brownfield-mode | Created → implemented → archived per change |

PRD-level shaping never goes inside `openspec/`. OpenSpec changes always reference the existing `context/foundation/prd.md` as their stable upstream input. The two systems anchor at different levels — and they anchor at different levels in worktrees too: shaping `context/` is shared across worktrees of one repo (one PRD), but `openspec/changes/` is intentionally independent per worktree (so two branches can have two pending changes without bleed). That property is preserved by both this plugin's worktree handling and `/openspec-advisor`'s.

### Without OpenSpec

OpenSpec is recommended, not required. If you don't want to use it, set the `no openspec` hint in your shape-notes (or just ignore the OpenSpec line in the closing summaries) — the pipeline works the same way either way. `/shape-bootstrap`'s closing summary will still flag it; you decide.

For everything OpenSpec-specific (CLI install, `change create` modes, archival, worktree handling for `openspec/`), see the `openspec-advisor` skill in the `kibana-dev-workflow-tools` plugin.

---

## Install

### Via marketplace (recommended)

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install product-shaping@patryks-treadmill
```

### Manual

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Restart Claude Code. The `/shape-*` slash commands will be discovered automatically.

---

## Skills

### Pipeline skills (run in order)

| Skill | Slash command | What it produces | Input |
|---|---|---|---|
| **`shape-workflow-guide`** | `/shape-workflow-guide` | Guidance — picks the right next skill for you | Your situation |
| **`shape-init`** | `/shape-init` | `context/{changes,archive,foundation}/` skeleton + READMEs | Nothing |
| **`shape-idea`** | `/shape-idea [idea]` | `context/foundation/shape-notes.md` | A rough idea |
| **`shape-prd`** | `/shape-prd [path]` | `context/foundation/prd.md` (10 sections greenfield, 11 brownfield) | `shape-notes.md` |
| **`shape-tech-stack`** | `/shape-tech-stack [path]` | `context/foundation/tech-stack.md` | `prd.md` (greenfield) |
| **`shape-bootstrap`** | `/shape-bootstrap [path]` | Scaffolded project + `verification.md` | `tech-stack.md` |
| **`shape-stack-assess`** | `/shape-stack-assess` | `context/foundation/stack-assessment.md` | Existing project |
| **`shape-health-check`** | `/shape-health-check` | `context/foundation/health-check.md` | Existing project |

### Auxiliary skills (run anytime)

| Skill | Slash command | What it produces |
|---|---|---|
| **`shape-infra-research`** | `/shape-infra-research` | `context/foundation/infrastructure.md` — researched deployment platform pick |
| **`shape-agents-md`** | `/shape-agents-md` | `AGENTS.md` — concise onboarding doc for AI coding agents |
| **`shape-rule-review`** | `/shape-rule-review <path>` | 5-point scorecard with fixes for any AI rules file |
| **`shape-lesson`** | `/shape-lesson` | Adds an entry to `context/foundation/lessons.md` |

---

## Safety reference: the context-root protocol

The "[Is this safe to run inside my repo?](#is-this-safe-to-run-inside-my-repo)" section above describes **what** the plugin guarantees. This section is the **mechanism** — useful if you want to audit it, debug an unexpected `git-exclude:` state, or extend it.

Every skill applies the same idempotent protocol before any read or write under `context/`. It does two things in one block:

### 1. Resolve `CONTEXT_ROOT`

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
  GIT_COMMON_DIR="$(cd "$GIT_COMMON_DIR" && pwd)"
  if [ "$(git --git-dir="$GIT_COMMON_DIR" rev-parse --is-bare-repository 2>/dev/null)" = "true" ]; then
    CONTEXT_ROOT="$GIT_COMMON_DIR/shape-context"   # bare-repo edge case
  else
    CONTEXT_ROOT="$(dirname "$GIT_COMMON_DIR")"    # the main working tree
  fi
else
  CONTEXT_ROOT="$(pwd)"                            # not in a git repo
fi
```

Every `context/foo/bar.md` reference in any skill's instructions is shorthand for `$CONTEXT_ROOT/context/foo/bar.md`. From any worktree of the same repo, `CONTEXT_ROOT` resolves to the same directory.

### 2. Append `context/` to `<git-common-dir>/info/exclude`

Default (untracked, repo-local, shared by every worktree):

```bash
EXCLUDE_FILE="$GIT_COMMON_DIR/info/exclude"
if ! grep -qxF 'context/' "$EXCLUDE_FILE"; then
  printf '\n# Added by the product-shaping plugin\ncontext/\n' >> "$EXCLUDE_FILE"
fi
```

`info/exclude` is the right home (instead of `.gitignore`) for two reasons: it lives entirely in your local `.git/` directory and is never transmitted by `git push`, and it's shared by every worktree of the repo (all worktrees of a non-bare repo read the same `<git-common-dir>/info/exclude`). One write applies forever to current and future worktrees of the same repo.

### Opt in: write to tracked `.gitignore` instead

If you want the exclusion shared with teammates (everyone working on this repo gets `context/` ignored automatically):

```
/shape-init mode=gitignore
```

This appends `context/` to `<main-working-tree>/.gitignore` instead. The protocol never edits `.gitignore` without this explicit signal.

### Possible `git-exclude:` states

Every skill prints a one-line `git-exclude: <state>` summary:

| State | Meaning |
|---|---|
| `not-a-git-repo` | Cwd is not inside a git working tree. `CONTEXT_ROOT = $(pwd)`. No exclude written. |
| `appended-to-info-exclude` | Wrote a new `context/` line to `<git-common-dir>/info/exclude`. (First run for this repo.) |
| `already-in-info-exclude` | The line was already present in `info/exclude`. No-op. |
| `appended-to-gitignore` | Wrote a new `context/` line to `<main-working-tree>/.gitignore`. (Only when `mode=gitignore`.) |
| `already-in-gitignore` | The line was already present in `.gitignore`. No-op. |
| `already-excluded` | `git check-ignore` already considers `context/` ignored (could be `info/exclude`, `.gitignore`, or a parent directory rule). No-op. |

### Where to read further

- `skills/shape-init/references/context-root-protocol.md` — the full spec, including bare-repo handling, `git check-ignore` semantics, the caller responsibilities every skill must follow, and the explicit list of things the protocol does **not** do (no `git rm --cached`, no migration of pre-existing `context/`, no multi-repo writes).
- `skills/shape-init/SKILL.md` — Step 0 of `/shape-init` runs the protocol with status reporting and is the canonical place to invoke it explicitly.

---

## What you get

Every artifact lands on disk. Nothing is held in conversation. This means:

- **Each step is reviewable.** Open `shape-notes.md`, `prd.md`, `tech-stack.md` in your editor before moving on.
- **Each step is resumable.** If the conversation drops or you switch sessions, the next skill picks up from the file on disk.
- **Each step is overridable.** Don't like the PRD? Edit it by hand and re-run the next step. The pipeline never silently regenerates upstream artifacts.
- **The pipeline never invents.** If you didn't say it, it lands in `## Open Questions` — never papered over with placeholder content.

The skills are **facilitators and document generators**, not idea-generators. They ask better questions and enforce schemas; they don't make product decisions for you.

---

## Philosophy

**Schema-locked artifacts.** PRDs, shape notes, and tech-stack hand-offs each conform to a frozen schema. Drift between skills and schemas is a CI failure, not a silent regression.

**Stack-open until the stack step.** The PRD never names a framework, library, vendor, or deployment platform. Stack-shaped concerns are routed forward to `/shape-tech-stack`. This keeps the product description portable and prevents premature commitment.

**Soft gates, not hard gates.** Quality cross-checks WARN about missing pieces but always allow the user to override. Every override is recorded in the artifact's `## Open Questions` section so a downstream step can pick it up.

**Greenfield and brownfield are first-class.** The same skills auto-detect which mode you're in (via cwd markers — git history, lockfiles, manifest files) and adapt their question shape, section structure, and downstream chain accordingly.

---

## Examples

### Starting a new product

```
You: I want to build a recipe app that suggests meals based on what's in my fridge.

→ Run /shape-idea — walks you through 6 discovery phases (vision, persona,
  MVP, FRs + user stories, business logic, framing) and produces shape-notes.md
→ Run /shape-prd — turns shape-notes.md into a 10-section PRD
→ Run /shape-tech-stack — picks a starter from a curated registry
→ Run /shape-bootstrap — scaffolds your project with safe conflict handling
→ Run /shape-agents-md — writes AGENTS.md for future AI agents working here
```

### Adding a feature to an existing system

```
You: I want to add a recommendation engine to my recipe app.

→ Run /shape-idea — auto-detects brownfield mode, focuses on what exists,
  what's changing, and what must be preserved
→ Run /shape-prd — produces an 11-section brownfield PRD with delta framing
→ Run /shape-stack-assess — evaluates your existing stack against quality gates
→ Run /shape-health-check — audits dependencies, tests, CI/CD
```

### Capturing institutional knowledge

```
You: We just hit a tricky bug — I want to write it up so it doesn't happen again.

→ Run /shape-lesson — adds a structured entry to context/foundation/lessons.md
```

---

## File layout this plugin creates

```
your-project/
├── context/
│   ├── changes/          # In-flight work (one folder per change)
│   ├── archive/          # Completed work
│   └── foundation/       # Cross-change living docs
│       ├── shape-notes.md     # ← /shape-idea
│       ├── prd.md             # ← /shape-prd
│       ├── tech-stack.md      # ← /shape-tech-stack
│       ├── stack-assessment.md   # ← /shape-stack-assess
│       ├── health-check.md       # ← /shape-health-check
│       ├── infrastructure.md     # ← /shape-infra-research
│       └── lessons.md            # ← /shape-lesson
└── AGENTS.md             # ← /shape-agents-md
```

---

## Acknowledgements

The methodology behind these skills (BMAD facilitator stance, GSD gray-area discovery, mattpocock-style recommended-answer fatigue mitigation, Socratic FR challenge rounds, four-gate agent-friendliness criteria) was assembled and refined inside a private workflow. This plugin extracts the universal mechanics — none of the cohort or organization branding ships here.

## License

MIT
