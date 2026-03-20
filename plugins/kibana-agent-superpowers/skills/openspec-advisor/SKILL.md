---
name: openspec-advisor
description: Intelligently decide if a task requires OpenSpec and orchestrate the workflow. Auto-evaluates complexity signals and seamlessly guides through OpenSpec or direct implementation.
license: MIT
compatibility: Requires openspec CLI and access to OpenSpec skills (openspec-new-change, openspec-ff-change, openspec-apply-change, openspec-verify-change, openspec-archive-change, openspec-explore).
metadata:
  author: patryk
  version: "1.0"
  triggers:
    - "implement X"
    - "should I use OpenSpec?"
    - "plan this feature"
    - "add feature X"
    - "build Y"
---

Automatically decide if a task requires OpenSpec, then orchestrate the appropriate workflow.

**Purpose**: Be the intelligent gateway that evaluates task complexity and seamlessly routes to OpenSpec workflow or direct implementation.

---

## Decision Logic

### When to Use OpenSpec (Auto-YES)

Run complexity analysis to detect these signals:

1. **File count estimate ≥3**
   - Glob for related files in the target area
   - Count unique files that would be touched
   - If ≥3 files → OpenSpec

2. **Architectural scope**
   - New abstraction or API design
   - Pattern change affecting multiple modules
   - Introducing new capability or system
   - If architectural → OpenSpec

3. **Cross-package impact**
   - Changes span multiple `@kbn/*` packages
   - Modifications to shared interfaces or contracts
   - Plugin-to-plugin interaction changes
   - If cross-package → OpenSpec

4. **Trade-offs present**
   - Multiple valid approaches exist
   - Design decisions needed
   - Performance vs simplicity choices
   - Security/UX balance
   - If trade-offs → OpenSpec

### When to Skip OpenSpec (Auto-NO)

- 1-2 files max
- Simple fix (typo, config tweak, parameter change)
- Clear, obvious implementation
- No architectural decisions
- Single-package, localized change

### Borderline Cases (Ask User)

When signals are mixed:
- 2-3 files with simple changes
- Minor refactor touching multiple files
- Clear implementation but moderate scope
- Single package but introduces new pattern

→ **Use AskUserQuestion tool** to present analysis and ask user to decide.

---

## Complexity Analysis Steps

### 1. Parse User Request

Extract:
- Intent: What are they trying to accomplish?
- Scope: Which areas of codebase affected?
- Constraints: Performance, security, UX requirements mentioned?
- Unknowns: What's unclear or requires investigation?

### 2. Estimate File Count

```bash
# Search for related files in target area
# Example for a feature in security plugin:
find x-pack/solutions/security -name "*.ts*" -o -name "*.tsx" | wc -l

# Grep for existing patterns that would need updating:
grep -r "pattern_to_change" x-pack/solutions/security --include="*.ts" --include="*.tsx" | wc -l
```

Count:
- Files that need direct modification
- Files that import/depend on changed interfaces
- Test files requiring updates
- Documentation files

### 3. Assess Architectural Impact

Check if any apply:
- Creating new public API surface?
- Changing existing contracts/interfaces?
- Introducing new abstraction (class, hook, utility)?
- Modifying core patterns used across codebase?
- Affecting plugin lifecycle or startup?

If ANY → architectural scope detected.

### 4. Check Cross-Package Dependencies

```bash
# List package dependencies
grep -r "from '@kbn/" path/to/target --include="*.ts" | cut -d"'" -f2 | sort -u

# Check if change affects multiple packages
# Look for shared types, utilities, or interfaces
```

If changes require modifications in 2+ distinct `@kbn/*` packages → cross-package.

### 5. Identify Trade-offs

Look for keywords in request:
- "better performance but..."
- "should we use X or Y?"
- "might need to balance..."
- "considering alternatives..."
- "evaluate options..."

If present → trade-offs exist.

### 6. Make Decision

```
Signals detected:
- File count: X files (threshold: 3)
- Architectural: Yes/No
- Cross-package: Yes/No
- Trade-offs: Yes/No

Decision: OPENSPEC / DIRECT / ASK
```

---

## Orchestration Workflows

### A. OpenSpec Workflow (if YES)

**Phase 1: Initiate Change**

Decide between fast-forward and step-by-step:

- **Use fast-forward** (`/openspec-ff-change`) if:
  - User knows what they want
  - Requirements are clear
  - They say "just get me started" or "create everything"

- **Use step-by-step** (`/openspec-new-change`) if:
  - Requirements unclear
  - Multiple unknowns
  - User wants to proceed carefully
  - They say "help me think through this"

**Invoke the skill**:
```
[Call openspec-ff-change OR openspec-new-change skill with user request]
```

**Phase 2: Exploration (if needed)**

If requirements become unclear during artifact creation:
```
[Call openspec-explore skill to investigate]
```

Exploration helps:
- Clarify vague requirements
- Compare alternative approaches
- Map existing architecture
- Identify risks and unknowns

**Phase 3: Implementation**

After artifacts ready:
```
[Call openspec-apply-change skill to implement tasks]
```

Monitor for:
- Implementation blockers → pause and revisit design
- Discovered complexity → update artifacts
- Missing requirements → add to specs

**Phase 4: Verification**

Before archiving:
```
[Call openspec-verify-change skill to validate]
```

Check:
- All tasks completed
- Requirements implemented
- Design followed
- Tests passing

**Phase 5: Archive**

After verification passes:
```
[Call openspec-archive-change skill to finalize]
```

This:
- Syncs delta specs to main specs
- Moves change to archive
- Preserves artifacts for reference

### B. Direct Implementation (if NO)

For simple changes:

1. **Confirm scope**
   - Show what files will be changed
   - Ask user to confirm approach

2. **Implement directly**
   - Make focused changes
   - Follow existing patterns
   - Update tests
   - Run validation

3. **Verify**
   - Type check scoped to affected package
   - Lint changed files
   - Run affected tests
   - Validate with `node scripts/check_changes.ts`

---

## Worktree Integration

### When to Suggest Worktree

For OpenSpec work, suggest worktree if:
- Change is isolated feature work
- Want faster git operations
- Multiple changes being juggled
- Don't need full codebase access

**Worktree Setup Pattern**:

```bash
# 1. Create worktree with sparse-checkout
git worktree add ~/Projects/kibana.worktrees/<change-name> -b <change-name>
cd ~/Projects/kibana.worktrees/<change-name>

# 2. Enable sparse-checkout
git sparse-checkout init --cone
git sparse-checkout set \
  x-pack/platform/packages/shared/<target-package> \
  scripts \
  .github

# 3. Set up OpenSpec access
MAIN_REPO="$HOME/Projects/kibana"
WT_ROOT="$(pwd)"

# Only if this is a git worktree (has .git file)
if [ -f "$WT_ROOT/.git" ]; then
  # Symlink .cursor (shared skills/rules)
  [ -e "$WT_ROOT/.cursor" ] || ln -s "$MAIN_REPO/.cursor" "$WT_ROOT/.cursor"

  # Create independent openspec directory
  if [ ! -d "$WT_ROOT/openspec" ]; then
    mkdir -p "$WT_ROOT/openspec/changes"
    cp "$MAIN_REPO/openspec/config.yaml" "$WT_ROOT/openspec/config.yaml"
    # Symlink specs/ to main repo
    ln -s "$MAIN_REPO/openspec/specs" "$WT_ROOT/openspec/specs"
  fi
fi

# 4. Bootstrap
yarn kbn bootstrap
```

**CRITICAL**: Never commit `openspec/` files. They are local-only artifacts.

### After Merge: Cleanup

When PR is merged and change archived:

```bash
# 1. Archive in main repo first
cd ~/Projects/kibana
[Use openspec-archive-change skill]

# 2. Clean up worktree (prompt user first)
git worktree remove ~/Projects/kibana.worktrees/<name>
git branch -d <branch-name>
```

---

## User Interaction Patterns

### Pattern 1: "Implement X" (ambiguous)

```
User: Implement dark mode toggle in settings

Agent: Let me analyze the complexity of this task...

[Run complexity analysis:]
- File count estimate: Search for settings UI components, theme files, state management → ~8-12 files
- Architectural: Yes (new theme system, state management)
- Cross-package: Possibly (theme utilities, UI components)
- Trade-offs: Theme persistence (localStorage vs server), SSR considerations

Decision: OPENSPEC - Multiple signals detected (files, architectural, trade-offs)

I recommend using OpenSpec for this. This involves:
- Multiple files (UI, state, theme config)
- Architectural decisions (theme system design)
- Trade-offs (storage, SSR, performance)

Would you like me to:
1. Start OpenSpec fast-forward (create all artifacts)
2. Start OpenSpec step-by-step (explore first)
3. Just implement directly (skip planning)
```

### Pattern 2: "Should I use OpenSpec?"

```
User: Should I use OpenSpec for fixing a typo in a comment?

Agent: Let me evaluate...

[Quick analysis:]
- File count: 1 file
- Architectural: No
- Cross-package: No
- Trade-offs: No

Decision: DIRECT - This is a simple change.

No need for OpenSpec. This is a single-file typo fix. Just make the change directly.

[Proceed with direct implementation]
```

### Pattern 3: "Plan this feature"

```
User: Plan a new user authentication system

Agent: This requires thorough planning. Let me analyze...

[Analysis:]
- File count: 20+ files (auth service, UI, middleware, tests)
- Architectural: Yes (new auth system, security layer)
- Cross-package: Yes (auth utilities, session management, UI components)
- Trade-offs: Yes (OAuth vs local, token storage, session duration)

Decision: OPENSPEC - High complexity, needs exploration.

This is a significant feature that benefits from OpenSpec's structured approach.

I recommend starting with exploration mode to:
- Map out authentication flows
- Compare OAuth providers
- Design session management
- Identify security requirements

Shall I start `/openspec-explore` to think through the architecture?
```

### Pattern 4: Borderline case

```
User: Refactor error handling in 3 utility functions

Agent: Let me analyze...

[Analysis:]
- File count: 3 files
- Architectural: No (same pattern, different locations)
- Cross-package: No (all in same package)
- Trade-offs: Minimal (standardize error format)

Decision: BORDERLINE - Mixed signals.

This is a borderline case:
- 3 files (at threshold)
- Simple refactor (clear approach)
- But affects multiple utilities (could benefit from planning)

Two approaches:
1. **OpenSpec**: Create tasks, track changes systematically
2. **Direct**: Make changes directly (should take ~15 min)

Which would you prefer?
```

---

## Skill Invocation Patterns

### Invoke OpenSpec Skills

```
[When decision is OPENSPEC]

Step 1: Start change
- If fast: Use Skill tool with skill="openspec-ff-change"
- If step-by-step: Use Skill tool with skill="openspec-new-change"

Step 2: Explore if needed
- Use Skill tool with skill="openspec-explore" args="<change-name>"

Step 3: Implement
- Use Skill tool with skill="openspec-apply-change" args="<change-name>"

Step 4: Verify
- Use Skill tool with skill="openspec-verify-change" args="<change-name>"

Step 5: Archive
- Use Skill tool with skill="openspec-archive-change" args="<change-name>"
```

### Direct Implementation

```
[When decision is DIRECT]

1. Confirm scope with user (show files)
2. Make changes using Edit/Write tools
3. Run validation:
   - Type check: yarn test:type_check --project <tsconfig.json>
   - Lint: node scripts/eslint --fix $(git diff --name-only)
   - Tests: yarn test:jest <path>
   - Check: node scripts/check_changes.ts
4. Report completion
```

---

## Decision Tree Visualization

```
User Request
     │
     ▼
Analyze Complexity
     │
     ├─── File count ≥3 OR
     ├─── Architectural OR
     ├─── Cross-package OR
     └─── Trade-offs present
          │
          ├─── All signals NO ────────► DIRECT
          │                             Implementation
          │
          ├─── ≥1 signal YES ────────► OPENSPEC
          │                             Workflow
          │
          └─── Mixed signals ─────────► ASK USER
                                        Present analysis
                                        Let them decide
```

---

## Guardrails

### Always

- Analyze before deciding (never guess)
- Show reasoning to user
- For borderline, present options and let user choose
- Track progress through workflow phases
- Verify before archiving
- Never commit `openspec/` files

### Never

- Skip complexity analysis
- Auto-select without showing reasoning
- Implement before artifacts ready (in OpenSpec mode)
- Archive without verification
- Commit OpenSpec artifacts to main branch
- Use OpenSpec for trivial changes (1-2 files, obvious approach)

### Adapt

- If implementation reveals complexity → suggest migrating to OpenSpec
- If OpenSpec artifacts become stale → offer to update
- If user blocked → suggest exploration
- If requirements change → update artifacts before continuing

---

## Integration with Existing Workflows

### With Feature Development

```
User: Add a new dashboard widget

Advisor: [Analyzes] → OPENSPEC
├─ Start: /openspec-ff-change
├─ Artifacts: proposal → specs → design → tasks
├─ Implement: /openspec-apply-change
└─ Archive: /openspec-archive-change
```

### With TDD Workflow

```
User: Build feature X with TDD

Advisor: [Analyzes] → OPENSPEC + TDD
├─ Start: /openspec-ff-change (includes test strategy)
├─ Implement: /openspec-apply-change + TDD pattern
│   - Write test first
│   - Implement to pass
│   - Refactor
│   - Repeat per task
└─ Archive: /openspec-archive-change
```

### With Bug Fixes

```
User: Fix authentication bug

Advisor: [Analyzes] → Likely DIRECT
├─ If simple: Direct fix
└─ If reveals design issue: Suggest OpenSpec
    "This looks like a deeper problem. Want to use
     OpenSpec to document the root cause and fix properly?"
```

---

## Output Patterns

### Analysis Output

```
## Complexity Analysis: <task-name>

**Scope**: <brief description>

**Signals Detected**:
- File count: X files (threshold: 3)
- Architectural: Yes/No - <reason>
- Cross-package: Yes/No - <packages affected>
- Trade-offs: Yes/No - <specific trade-offs>

**Decision**: OPENSPEC / DIRECT / BORDERLINE

**Reasoning**: <1-2 sentence explanation>

**Recommendation**: <next steps>
```

### Decision Output (Auto-YES)

```
This requires OpenSpec workflow:
- <primary reason>
- <secondary reason>

Starting OpenSpec...
[Invoke appropriate skill]
```

### Decision Output (Auto-NO)

```
This is a simple change - no OpenSpec needed:
- <reason>

Proceeding with direct implementation...
[Implement directly]
```

### Decision Output (Borderline)

```
This is a borderline case:
- <pro OpenSpec signals>
- <pro Direct signals>

Two options:
1. **OpenSpec** (<benefits>)
2. **Direct** (<benefits>)

Which approach do you prefer?
```

---

## Error Handling

### OpenSpec CLI Not Available

```
Error: OpenSpec CLI not found.

This task requires OpenSpec but the CLI isn't available.

Options:
1. Install OpenSpec CLI
2. Proceed with direct implementation (manual planning)

What would you like to do?
```

### Active Change Exists

```
Found active change: <existing-change-name>

This task relates to the existing change.

Options:
1. Continue existing change
2. Create new change
3. Explore existing change first

What would you like to do?
```

### Implementation Reveals Complexity

```
Implementation discovered additional complexity:
- <new finding>

This is more complex than initially analyzed.

Recommendation:
1. Migrate to OpenSpec workflow
2. Document findings in artifacts
3. Continue with proper planning

Shall I start OpenSpec for this?
```

---

## Success Metrics

Track these to validate advisor effectiveness:

- **Decision accuracy**: % of OpenSpec decisions that complete successfully
- **Time saved**: Reduced back-and-forth on scope definition
- **Artifact quality**: Completeness of generated artifacts
- **User satisfaction**: Feedback on auto-decision correctness

---

## Examples in Practice

### Example 1: Clear OPENSPEC

```
User: Implement real-time collaboration feature

Analysis:
- Files: 15+ (WebSocket, state, UI, conflict resolution)
- Architectural: Yes (new real-time system)
- Cross-package: Yes (networking, state management, UI)
- Trade-offs: Yes (WebSocket vs polling, CRDT vs OT)

→ OPENSPEC (fast-forward)
```

### Example 2: Clear DIRECT

```
User: Fix typo in error message

Analysis:
- Files: 1
- Architectural: No
- Cross-package: No
- Trade-offs: No

→ DIRECT (immediate fix)
```

### Example 3: Borderline → ASK

```
User: Update validation logic in 3 form components

Analysis:
- Files: 3 (at threshold)
- Architectural: No (same pattern repeated)
- Cross-package: No
- Trade-offs: Minimal (standardize vs customize)

→ ASK USER
Present: "OpenSpec for systematic approach OR Direct for quick fix?"
```

---

## Skill Metadata

**Triggers**: Automatically activate when user says:
- "implement X"
- "build Y"
- "add feature Z"
- "should I use OpenSpec?"
- "plan this change"

**Dependencies**:
- OpenSpec CLI (`openspec`)
- OpenSpec skills: new-change, ff-change, apply-change, verify-change, archive-change, explore
- Kibana validation tools (for direct implementation)

**Compatibility**: Works in both main repo and worktrees (with proper OpenSpec setup)

---

## Future Enhancements

Potential improvements:
- ML-based complexity prediction from historical data
- Auto-detection of similar past changes for reference
- Integration with promotion evidence tracking
- Complexity trend reporting (are changes getting simpler over time?)

---

Ready to intelligently route your next task through the optimal workflow.