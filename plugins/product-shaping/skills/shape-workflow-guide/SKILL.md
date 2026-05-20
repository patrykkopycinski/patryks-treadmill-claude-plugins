---
name: shape-workflow-guide
description: >
  Orient a user through the product-shaping pipeline. Use when the user asks
  "where do I start", "how does this work", "what should I run first", "I have
  an idea but don't know where to begin", or any variant of asking for a tour
  of the shape-* skills. Auto-detects whether the project is greenfield or
  brownfield from cwd, asks 1-2 orienting questions, then names the exact
  next slash command to run. Also use when the user invokes any /shape-*
  command without context (e.g. running /shape-bootstrap with no tech-stack.md
  on disk) — this guide redirects them to the right starting point.
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

# Shape Workflow Guide — Where do I start?

This skill is the entry point of the `product-shaping` plugin. It does not produce any artifact — its single job is to look at the user's situation, figure out where they are in the pipeline, and tell them which `/shape-*` command to run next.

The pipeline:

```
Greenfield:  /shape-idea → /shape-prd → /shape-tech-stack → /shape-bootstrap → /shape-agents-md
Brownfield:  /shape-idea → /shape-prd → /shape-stack-assess → /shape-health-check → /shape-agents-md
```

Auxiliary skills (`/shape-infra-research`, `/shape-rule-review`, `/shape-lesson`) can run anytime and don't need an upstream input.

## When to use this skill

Use when:

- The user says "where do I start", "how do I use this", "what's the workflow", "I have an idea but I don't know what to do first".
- The user describes their situation in vague terms ("I want to build a recipe app", "I'm refactoring my old dashboard") and has not picked a specific skill.
- The user runs a downstream skill (`/shape-prd`, `/shape-bootstrap`, etc.) without the required upstream artifact on disk — the downstream skill itself will redirect here.

Skip when:

- The user has already named a specific skill they want to run. Defer to that skill.
- The user is asking a question about something other than the shaping pipeline (e.g. a debugging question, a code review question). This skill is workflow-orientation only.

## Process

### Step 1 — Resolve `CONTEXT_ROOT` and detect what's already on disk

First resolve `CONTEXT_ROOT` (the directory `context/` lives in) so the disk check works correctly even from a worktree. The procedure is the same one every other shape-* skill uses, documented in `../shape-init/references/context-root-protocol.md`:

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
  GIT_COMMON_DIR="$(cd "$GIT_COMMON_DIR" && pwd)"
  if [ "$(git --git-dir="$GIT_COMMON_DIR" rev-parse --is-bare-repository 2>/dev/null)" = "true" ]; then
    CONTEXT_ROOT="$GIT_COMMON_DIR/shape-context"
  else
    CONTEXT_ROOT="$(dirname "$GIT_COMMON_DIR")"
  fi
else
  CONTEXT_ROOT="$(pwd)"
fi
```

This guide does not write any git-exclude line — it only reads. The pipeline skills will write the exclude line when the user runs them. But this guide must use `CONTEXT_ROOT` for its disk checks so it correctly reports the pipeline state when invoked from a worktree.

Check for existing pipeline artifacts:

```bash
test -d "$CONTEXT_ROOT/context/foundation" && echo "context/foundation/ exists"
test -f "$CONTEXT_ROOT/context/foundation/shape-notes.md" && echo "shape-notes.md exists"
test -f "$CONTEXT_ROOT/context/foundation/prd.md" && echo "prd.md exists"
test -f "$CONTEXT_ROOT/context/foundation/tech-stack.md" && echo "tech-stack.md exists"
test -f "$CONTEXT_ROOT/context/foundation/stack-assessment.md" && echo "stack-assessment.md exists"
test -f "$CONTEXT_ROOT/context/foundation/health-check.md" && echo "health-check.md exists"
test -f AGENTS.md && echo "AGENTS.md exists"
```

Note: `AGENTS.md` is checked in cwd (it belongs to the worktree, not the shared notes area). Everything under `context/` is checked under `$CONTEXT_ROOT` (shared across worktrees).

When `CONTEXT_ROOT` differs from cwd, surface that with a `context-root: <path>` line in your output (the same shape every other shape-* skill uses) and add a one-line note that the pipeline state is shared across worktrees of the same repo. Example:

```
context-root: /Users/you/Projects/kibana   (main checkout — shared with all worktrees)
```

This way the user understands why an artifact may "already exist" even though they're standing in a fresh worktree, and that the shared state is intentional, not a bug.

The most-advanced existing artifact tells you where in the pipeline the user is.

### Step 2 — Detect greenfield vs brownfield

Use a multi-signal scoring (same approach as `/shape-idea` Step 0.7):

```bash
# Tier 1 (strong): version control with history
git log --oneline -1 2>/dev/null && echo "T1:git-history"

# Tier 2 (medium): lockfiles prove real dependency resolution happened
ls package-lock.json yarn.lock pnpm-lock.yaml Cargo.lock poetry.lock go.sum Gemfile.lock composer.lock 2>/dev/null

# Tier 3 (weak): manifest files alone — could be a fresh init
ls package.json Cargo.toml pyproject.toml go.mod Gemfile composer.json 2>/dev/null
```

- Any Tier 1 or Tier 2 hit → likely **brownfield**
- Tier 3 only → ambiguous (could be `npm init -y`)
- No signals → likely **greenfield**

### Step 3 — Pick the right starting point

Combine the disk state and the context type into one of these recommendations.

#### Case A — Brand new directory, nothing on disk, no project markers

The user is starting from scratch.

```
You're at the very beginning of the pipeline. Here's the path:

  1. /shape-idea       — turn your idea into structured shape-notes.md
  2. /shape-prd        — generate a 10-section PRD from the notes
  3. /shape-tech-stack — pick a starter and a stack
  4. /shape-bootstrap  — scaffold the project safely
  5. /shape-agents-md  — write AGENTS.md so future AI agents have context

Each step writes a file under context/foundation/ that the next step reads.
You can stop and restart between any two steps — the pipeline is file-driven,
not conversation-driven.

Safety: the first skill to write under context/ will also append context/ to
<git-common-dir>/info/exclude (if you're inside a git repo), so these working
notes never get accidentally committed to the host repository or wiped by
`git clean`. Worktree note: that exclude file is shared by every worktree of
the repo, so the configuration applies once and forever — no per-worktree
re-init.

► Next: /shape-idea
   (run it with your idea inline, e.g. /shape-idea a recipe app that suggests
    meals from what's in your fridge)
```

#### Case B — Existing project (brownfield signals detected)

The user is changing an existing system.

```
This looks like an existing project (detected: <list signals — git history,
lockfile, src/ directory>). Here's the brownfield path:

  1. /shape-idea         — focuses on what exists, what's changing, what must be preserved
  2. /shape-prd          — generates an 11-section brownfield PRD with delta framing
  3. /shape-stack-assess — evaluates your existing stack against four quality gates
  4. /shape-health-check — audits dependencies, tests, CI/CD
  5. /shape-agents-md    — writes AGENTS.md for AI agents working in this repo

The brownfield mode is auto-detected — you don't need to flag it.

Safety: because you're inside an existing repo, the first skill to write under
context/ will also append context/ to <git-common-dir>/info/exclude. This is
repo-local (not in .gitignore), shared by every worktree of this repo, and
cannot be accidentally staged, committed, or pushed to the upstream. If you
work from worktrees (e.g. ~/Projects/kibana.worktrees/<branch>), context/ is
also automatically anchored to the main repo so all your worktrees see the
same prd.md, tech-stack.md, etc. — no re-init per worktree.

► Next: /shape-idea
   (run it with your change inline, e.g.
    /shape-idea add a recommendation engine to my recipe app)
```

#### Case C — `shape-notes.md` exists but no `prd.md`

The user has run discovery; the next step is the PRD.

```
You've already run /shape-idea — context/foundation/shape-notes.md is on disk.
The next step turns those notes into a real PRD.

► Next: /shape-prd
   (it will read shape-notes.md automatically; you can also pass a different
    path with /shape-prd path/to/notes.md)
```

#### Case D — `prd.md` exists but no `tech-stack.md` (greenfield) or `stack-assessment.md` (brownfield)

The user has a PRD; pick the right downstream branch based on the PRD's `context_type` frontmatter (read it):

```bash
grep -E "^context_type:" context/foundation/prd.md
```

Greenfield branch:

```
You have a PRD on disk (greenfield). The next step picks a tech stack.

► Next: /shape-tech-stack
   (it reads prd.md as priors, asks at most ~6 residual questions, and picks
    a starter from a curated registry of agent-friendly stacks)
```

Brownfield branch:

```
You have a PRD on disk (brownfield). The next step assesses your existing stack.

► Next: /shape-stack-assess
   (it scores each stack component against four agent-friendly quality gates
    and produces compensation strategies for the gaps)
```

#### Case E — `tech-stack.md` exists, project not yet scaffolded

```
You've picked a stack. Time to scaffold.

► Next: /shape-bootstrap
   (it reads tech-stack.md, runs the starter's CLI through one of three safe
    cwd strategies, and writes a verification log for review)
```

#### Case F — Project is scaffolded but no AGENTS.md

```
Your project is scaffolded. Two things you can do next, in either order:

  1. /shape-agents-md   — write AGENTS.md / CLAUDE.md so future AI agents
                          have a concise onboarding doc (inspects your repo
                          and writes a small contributor guide ordered with
                          critical rules at the top).

  2. openspec init      — set up spec-driven change tracking. From here on,
                          each concrete change against the PRD (a feature,
                          a refactor, a delta) goes through OpenSpec
                          (proposal → specs → design → tasks per change).
                          The /openspec-advisor skill walks you through it.

PRD-level shaping (context/foundation/prd.md) stays as your stable, upstream
source of truth — OpenSpec changes reference it, they don't replace it.

► Next: /shape-agents-md   (run this first if you'll be working with AI
                            agents on this codebase)
```

#### Case G — Everything on disk, pipeline complete

```
The product-shaping pipeline is complete. From here, the day-to-day pattern is:

  Each concrete change → /openspec-advisor → openspec change create
                       → proposal/specs/design/tasks → implement → archive

  /openspec-advisor will decide whether each new task warrants the full
  OpenSpec flow or is small enough for direct implementation.

Optional product-shaping follow-ups any time:

  /shape-infra-research — pick a deployment platform with researched scoring
  /shape-rule-review     — audit AGENTS.md or any AI rules file
  /shape-lesson          — capture a learning when you hit something tricky

For shaping a brand-new feature on top of this product, re-run /shape-idea —
it will auto-detect brownfield mode based on your project state, and the
result becomes a PRD update that the next OpenSpec change references.
```

### Step 4 — When the situation is ambiguous, ask once

If Step 1 detection is mixed (e.g. `shape-notes.md` exists but is older than the project's last commit) or the user described their situation in a way the disk state doesn't match, ask one orienting question:

AskUserQuestion:
- question: "I detected [summary of disk state]. What do you want to do?"
  header: "Where to?"
  options:
  - label: "Continue from where I left off — recommended"
    description: "Pick up at the next step in the pipeline based on what's already on disk."
  - label: "Start over from /shape-idea"
    description: "Archive the existing artifacts and begin a fresh discovery session."
  - label: "Run a specific skill"
    description: "Tell me which /shape-* skill you want to invoke; I'll redirect."
  multiSelect: false

Map the answer to the appropriate Case above.

## Output

This skill writes nothing to disk. It only prints orientation and names the next slash command. It always announces with a `► Next:` line carrying the literal command, so the user can copy-paste.

## Critical guardrails

1. **Never invoke another skill automatically.** This guide names the next command and stops. The user runs the named command when they're ready. Auto-chaining hides which skill ran.

2. **The artifacts on disk are the source of truth for "where you are in the pipeline".** Don't guess from conversation context. Run the disk checks at Step 1 every invocation.

3. **Never make stack or product decisions here.** This skill orients only. If the user asks "should I use React or Vue?", redirect them to `/shape-tech-stack` (after they have a PRD) — don't answer the stack question here.

4. **Keep the recommended next step to ONE command.** If the next step has alternatives, mention them but pick a single recommendation. Decision fatigue is the failure mode this skill is fighting.
