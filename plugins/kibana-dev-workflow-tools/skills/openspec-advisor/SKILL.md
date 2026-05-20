---
name: openspec-advisor
description: >
  Intelligently decide if a task requires OpenSpec and orchestrate the full spec-driven workflow.
  OpenSpec is MANDATORY for all change-level specs, planning, and design work -- no exceptions
  EXCEPT product-level shaping (PRD, tech-stack selection, initial bootstrap), which is upstream
  of OpenSpec and lives in the product-shaping plugin (/shape-idea, /shape-prd, /shape-tech-stack,
  /shape-bootstrap). When no context/foundation/prd.md exists yet and the user is shaping a new
  product, defer to product-shaping. Once a PRD exists and the user is implementing changes
  against it, OpenSpec takes over. Auto-evaluates complexity signals and seamlessly guides
  through OpenSpec or direct implementation. Also handles installation guidance when OpenSpec
  CLI is missing. Triggers on "implement X", "plan this feature", "add feature X", "build Y",
  "should I use OpenSpec?", "design X", "spec this out".
---

# OpenSpec Advisor

Automatically decide if a task requires OpenSpec, then orchestrate the appropriate workflow. OpenSpec is the single source of truth for all spec-driven development.

## Hard Rules

1. **Specs, planning, and design work ALWAYS use OpenSpec** -- regardless of file count or complexity. No exceptions, except the product-shaping carve-out below.
2. **"Implement X" triggers mandatory OpenSpec first** -- complete ALL artifacts (proposal -> specs -> design -> tasks) before writing any code.
3. **Never commit `openspec/` files** -- they are local-only planning artifacts and must never appear in PRs or git history.
4. **Never skip straight to code on complex tasks** -- the artifacts ARE the deliverable for tracking decisions.
5. **Product-level shaping is upstream of OpenSpec.** When the user is shaping the *product itself* (the PRD, the initial tech stack, the first scaffold) and a `context/foundation/prd.md` does not yet exist, defer to the `product-shaping` plugin (`/shape-idea`, `/shape-prd`, `/shape-tech-stack`, `/shape-bootstrap`). OpenSpec attaches at the *change* level — once the product is shaped and scaffolded, every concrete delta against the PRD goes through OpenSpec. PRD shaping never goes inside `openspec/`.

---

## Altitude carve-out: product-shaping vs OpenSpec

This is the single, narrow exception to "spec work always uses OpenSpec":

| Question | Answer | Tool |
|---|---|---|
| What are we building, for whom, on what kind of stack? | Product-level. One file per product. Lives in `context/foundation/`. | `product-shaping` plugin (`/shape-idea`, `/shape-prd`, `/shape-tech-stack`) |
| What's the next concrete change against the product, with spec deltas and tasks? | Change-level. One folder per change. Lives in `openspec/changes/`. | OpenSpec (this skill) |

**Decision rule the advisor must apply at the very top, before any complexity analysis:**

```
If the request is to shape a NEW product or write a PRD AND
  context/foundation/prd.md does NOT exist
→ Defer: redirect the user to /shape-idea (or /shape-prd if shape-notes.md exists).
  Do NOT invoke OpenSpec. The PRD comes first; OpenSpec changes reference it later.

If context/foundation/prd.md exists AND
  the request is for an implementation change against that product
→ This is OpenSpec's territory. Continue with the standard advisor flow below.

If the request is product-shaping work for an EXISTING product
  (the user already has a prd.md and is amending / re-shaping it)
→ Defer to /shape-prd or /shape-idea (brownfield mode). PRD revisions are
  product-level and don't go through OpenSpec; OpenSpec then references the
  updated PRD on the next change.
```

The triggers `/shape-prd`, `/shape-tech-stack`, `/shape-idea` are **never** OpenSpec entry points — they are upstream of it. Once the user is past `/shape-bootstrap` (a scaffolded project exists), every subsequent "implement X" / "design Y" / "spec out Z" against that product is OpenSpec's job.

---

## Prerequisites & Installation

### Check if OpenSpec is installed

```bash
which openspec && openspec --version
```

### Install OpenSpec CLI

If not installed, guide the user:

```bash
npm install -g openspec
```

Then initialize in the project:

```bash
cd <project-root>
openspec init
```

This creates:
- `openspec/config.yaml` -- project configuration
- `openspec/specs/` -- finalized specifications
- `openspec/changes/` -- active change proposals

### Verify installation

```bash
openspec list
```

If the user gets errors, check:
- Node.js >= 18 required
- npm global bin directory is on PATH (`npm config get prefix` + `/bin`)
- If using nvm: `nvm use 22 && npm install -g openspec`

---

## Decision Logic

### Auto-YES: Always Use OpenSpec

Use OpenSpec when ANY of these signals are present:

1. **Spec, planning, or design work** -- user says "plan", "design", "spec", "think through", "propose", "architect". Always OpenSpec, no complexity check needed.

2. **Implementation triggers** -- user says "implement X", "build X", "add X feature", "create X system", "develop X". Mandatory OpenSpec phase before coding.

3. **File count >= 3** -- glob for related files, count unique files that would be touched.

4. **Architectural scope** -- new abstraction/API, pattern change across modules, new capability or system.

5. **Cross-package impact** -- changes span multiple `@kbn/*` packages, shared interfaces/contracts modified.

6. **Trade-offs present** -- multiple valid approaches, design decisions needed, performance vs simplicity.

### Auto-NO: Skip OpenSpec

- Single file fix, typo, config tweak
- 1-2 file change with obvious approach
- Debugging existing code
- Questions or research tasks
- Minor configuration updates

### Borderline: Ask User

When signals are mixed AND the task is pure implementation (not planning/spec/design):
- 2-3 files with simple changes
- Minor refactor touching multiple files
- Clear implementation but moderate scope

Use **AskUserQuestion** to present analysis and let user decide.

**Exception**: If the user asks for a plan, spec, or design -> always OpenSpec, no asking.

---

## Complexity Analysis Steps

### 1. Parse User Request

Extract: intent, scope, constraints, unknowns.

### 2. Estimate File Count

```bash
# Search for related files in target area
find x-pack/solutions/security -name "*.ts*" -o -name "*.tsx" | wc -l

# Grep for existing patterns that would need updating
grep -r "pattern_to_change" x-pack/solutions/security --include="*.ts" --include="*.tsx" | wc -l
```

Count: files needing modification + dependents + tests + docs.

### 3. Assess Architectural Impact

Check: new public API? Changed contracts? New abstraction? Core pattern modification? Plugin lifecycle impact?

### 4. Check Cross-Package Dependencies

```bash
grep -r "from '@kbn/" path/to/target --include="*.ts" | cut -d"'" -f2 | sort -u
```

If 2+ distinct `@kbn/*` packages affected -> cross-package.

### 5. Make Decision

```
Signals detected:
- File count: X files (threshold: 3)
- Architectural: Yes/No
- Cross-package: Yes/No
- Trade-offs: Yes/No

Decision: OPENSPEC / DIRECT / ASK
```

---

## OpenSpec Workflow

### Phase 1: Initiate Change

Choose the mode:

- **Fast-forward** (`openspec change create --fast-forward`) -- user knows what they want, requirements are clear
- **Step-by-step** (`openspec change create`) -- requirements unclear, multiple unknowns, user wants to explore first

### Phase 2: Create Artifacts

Complete ALL artifacts before writing code:

```
proposal -> specs -> design -> tasks
```

Use `openspec change continue` to progress through artifacts one at a time.

### Phase 3: Exploration (if needed)

If requirements become unclear during artifact creation, use exploration mode to:
- Clarify vague requirements
- Compare alternative approaches
- Map existing architecture
- Identify risks and unknowns

### Phase 4: Implementation

After all artifacts are ready, implement using the tasks as a checklist:
- Work through task groups in order (Infrastructure -> Core -> Testing -> etc.)
- Update task progress as you complete each item
- If implementation reveals new complexity -> pause and update artifacts

### Phase 5: Verification

Before archiving, verify:
- All tasks completed
- Requirements implemented
- Design followed
- Tests passing

### Phase 6: Archive

After verification:

```bash
openspec archive <change-name>
```

This syncs delta specs to main specs and moves the change to archive.

---

## Direct Implementation Workflow (when OpenSpec skipped)

1. **Confirm scope** -- show files that will change, get user agreement
2. **Implement** -- focused changes following existing patterns
3. **Verify**:
   - Type check: `yarn test:type_check --project <tsconfig.json>`
   - Lint: `node scripts/eslint --fix $(git diff --name-only)`
   - Tests: `yarn test:jest <path>`

---

## Worktree Integration

### When to Suggest Worktree

For OpenSpec work, suggest a worktree if:
- Change is isolated feature work
- Multiple changes being juggled
- Want faster git operations

### Worktree Setup

```bash
# 1. Create worktree
git worktree add ~/Projects/kibana.worktrees/<change-name> -b <change-name>
cd ~/Projects/kibana.worktrees/<change-name>

# 2. Sparse checkout (optional, for speed)
git sparse-checkout init --cone
git sparse-checkout set x-pack/platform/packages/shared/<target-package> scripts .github

# 3. Set up OpenSpec access
MAIN_REPO="$HOME/Projects/kibana"
WT_ROOT="$(pwd)"

if [ -f "$WT_ROOT/.git" ]; then
  # Symlink .cursor (shared skills/rules)
  [ -e "$WT_ROOT/.cursor" ] || ln -s "$MAIN_REPO/.cursor" "$WT_ROOT/.cursor"

  # Create INDEPENDENT openspec directory (NOT a symlink)
  # Each worktree gets its own changes/ so work doesn't bleed across worktrees
  if [ ! -d "$WT_ROOT/openspec" ]; then
    mkdir -p "$WT_ROOT/openspec/changes"
    cp "$MAIN_REPO/openspec/config.yaml" "$WT_ROOT/openspec/config.yaml"
    # Symlink specs/ to main repo so all finalized specs accumulate in one place
    ln -s "$MAIN_REPO/openspec/specs" "$WT_ROOT/openspec/specs"
  fi
fi

# 4. Bootstrap
yarn kbn bootstrap
```

### Migrating Existing Worktree Symlinks

If a worktree already has `openspec/` as a full symlink to the main repo, replace it:

```bash
WT_ROOT="<worktree-path>"
MAIN_REPO="$HOME/Projects/kibana"

if [ -L "$WT_ROOT/openspec" ]; then
  rm "$WT_ROOT/openspec"
  mkdir -p "$WT_ROOT/openspec/changes"
  cp "$MAIN_REPO/openspec/config.yaml" "$WT_ROOT/openspec/config.yaml"
  ln -s "$MAIN_REPO/openspec/specs" "$WT_ROOT/openspec/specs"
fi
```

### After Merge: Cleanup

1. Archive the change in the main repo first:
   ```bash
   cd ~/Projects/kibana
   openspec archive <change-name>
   ```
2. Clean up worktree (ask user first):
   ```bash
   git worktree remove ~/Projects/kibana.worktrees/<name>
   git branch -d <branch-name>
   ```

---

## Guardrails

### CRITICAL: Never Commit OpenSpec Files

**NEVER** stage or commit any files under `openspec/` (config, changes, specs, archives). If accidentally staged:

```bash
git rm -r --cached openspec/
```

Ensure `.gitignore` includes `openspec/`.

### Always

- Analyze before deciding (never guess)
- Show reasoning to user
- Complete all artifacts before implementation (in OpenSpec mode)
- Verify before archiving
- For borderline cases, present options and let user choose

### Never

- Skip complexity analysis
- Implement before artifacts are ready (in OpenSpec mode)
- Archive without verification
- Use OpenSpec for trivial changes (1-2 files, obvious approach)
- Skip OpenSpec for any spec, planning, or design work

### Adapt

- If implementation reveals complexity -> suggest migrating to OpenSpec
- If OpenSpec artifacts become stale -> offer to update
- If user is blocked -> suggest exploration mode
- If requirements change -> update artifacts before continuing

---

## Key Paths

| Item | Path |
|------|------|
| OpenSpec CLI | `openspec` (globally installed via npm) |
| Changes | `openspec/changes/<name>/` |
| Finalized specs | `openspec/specs/` |
| Config | `openspec/config.yaml` |
| OpenSpec repo | https://github.com/openspecio/openspec |

---

## Error Handling

### OpenSpec CLI Not Found

```
OpenSpec CLI is not installed. To get started:

  npm install -g openspec

Then initialize in your project:

  cd <project-root>
  openspec init

Requirements:
- Node.js >= 18
- npm global bin on PATH

If using nvm:
  nvm use 22 && npm install -g openspec
```

### Active Change Already Exists

```
Found active change: <existing-change-name>

Options:
1. Continue existing change (openspec change continue)
2. Create new change
3. Explore existing change first
```

### Implementation Reveals Unexpected Complexity

```
This is more complex than initially analyzed.

Recommendation:
1. Migrate to OpenSpec workflow
2. Document findings in artifacts
3. Continue with proper planning
```

---

## Decision Tree

```
User Request
     |
     v
Is it spec/planning/design work?
     |
     +--- YES -----------------> OPENSPEC (always)
     |
     +--- NO: Analyze complexity
              |
              +--- File count >= 3 OR
              +--- Architectural OR
              +--- Cross-package OR
              +--- Trade-offs present
                   |
                   +--- All NO ----------> DIRECT implementation
                   |
                   +--- >= 1 YES --------> OPENSPEC workflow
                   |
                   +--- Mixed ------------> ASK USER
```
