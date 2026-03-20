# OpenSpec Advisor

Intelligent decision-making agent that automatically evaluates task complexity and routes to the optimal workflow (OpenSpec or direct implementation).

## Quick Start

Just describe what you want to do:

```
User: Implement dark mode toggle
User: Fix typo in error message
User: Plan a new feature
User: Should I use OpenSpec?
```

The advisor will:
1. Analyze complexity (file count, architectural scope, cross-package impact, trade-offs)
2. Decide: OPENSPEC / DIRECT / ASK (borderline)
3. Show reasoning
4. Route to appropriate workflow

## Decision Criteria

### Auto-YES to OpenSpec
- ≥3 files affected
- Architectural changes (new abstractions, API design, pattern changes)
- Cross-package impact (multiple `@kbn/*` packages)
- Trade-offs present (multiple valid approaches)

### Auto-NO to OpenSpec
- 1-2 files max
- Simple fix (typo, config tweak, parameter change)
- Clear, obvious implementation
- Single-package, localized change

### Borderline (Ask User)
- 2-3 files with simple changes
- Minor refactor touching multiple files
- Clear implementation but moderate scope

## Workflows

### OpenSpec Path (5 phases)
1. **Initiate**: Fast-forward or step-by-step artifact creation
2. **Explore**: Clarify requirements, compare approaches (if needed)
3. **Implement**: Execute tasks systematically
4. **Verify**: Validate completeness, correctness, coherence
5. **Archive**: Sync specs, move to archive

### Direct Path
1. Confirm scope
2. Make changes
3. Validate (type check, lint, tests)
4. Report completion

## Worktree Integration

For isolated OpenSpec work, the advisor suggests sparse worktrees:

```bash
# Creates worktree with minimal checkout
# Sets up independent openspec/ directory
# Preserves shared .cursor/ access
```

After merge:
1. Archive in main repo
2. Clean up worktree

## Triggers

Automatically activates on:
- "implement X"
- "build Y"
- "add feature Z"
- "should I use OpenSpec?"
- "plan this change"

## Integration

Works with:
- **OpenSpec skills**: new-change, ff-change, explore, apply-change, verify-change, archive-change
- **Kibana validation**: Scoped type checks, lint, jest, check_changes
- **Worktrees**: Sparse checkout with proper OpenSpec setup
- **TDD workflow**: Combines OpenSpec planning with test-first implementation

## File

Location: `~/.agents/skills/openspec-advisor/SKILL.md` (743 lines)

## Examples

### Example 1: Clear OPENSPEC
```
User: Implement real-time collaboration

Analysis:
- Files: 15+ (WebSocket, state, UI, conflict resolution)
- Architectural: Yes (new real-time system)
- Cross-package: Yes (networking, state, UI)
- Trade-offs: Yes (WebSocket vs polling, CRDT vs OT)

→ OPENSPEC (fast-forward)
→ Creates all artifacts → implements → verifies → archives
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
→ Edits file → validates → done
```

### Example 3: Borderline → ASK
```
User: Refactor error handling in 3 utility functions

Analysis:
- Files: 3 (at threshold)
- Architectural: No
- Cross-package: No
- Trade-offs: Minimal

→ ASK USER
Presents: "OpenSpec (systematic) OR Direct (quick)?"
User chooses → routes accordingly
```

## Guardrails

- Always analyze complexity before deciding
- Never commit `openspec/` files (local-only artifacts)
- Never implement before artifacts ready (in OpenSpec mode)
- Always verify before archiving
- Adapt when implementation reveals hidden complexity

## Success Metrics

- Decision accuracy (% completed successfully)
- Time saved (reduced scope definition back-and-forth)
- Artifact quality (completeness)
- User satisfaction (feedback on auto-decisions)
