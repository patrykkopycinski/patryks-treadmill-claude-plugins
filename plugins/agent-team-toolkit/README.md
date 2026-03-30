# agent-team-toolkit

Complete agent team coordination system for Claude Code. Includes 6 specialized agents, 4 quality gate hooks, and a battle-tested team orchestration methodology skill.

Use this plugin when you need to parallelize work across multiple AI teammates — cross-layer feature development, parallel code review, root-cause investigation, or large-scale migrations.

---

## Agents

Six agents are included. The first two are general-purpose. The four Kibana agents serve as **reference patterns** you can adapt to your own stack.

| Agent | Model | Description | Use Case |
|-------|-------|-------------|----------|
| `archaeologist` | sonnet | Code history investigator | Answers "why was this written this way?" via git blame, log, and PR history |
| `yak-shave-detector` | haiku | Scope creep detector | Cheapest, fastest sanity check — catches when you've drifted from the original goal |
| `kibana-backend-dev` | sonnet | Kibana server-side specialist | Implements API routes, services, saved objects; owns `server/` only |
| `kibana-frontend-dev` | sonnet | Kibana UI specialist | Implements React components with EUI + Emotion; owns `public/` only |
| `kibana-code-reviewer` | sonnet | Read-only code reviewer | Multi-pass review covering security, performance, correctness; never modifies files |
| `kibana-test-specialist` | sonnet | Test engineer | Jest unit tests + Scout E2E tests; owns test files only, never modifies source |

### Adapting the Kibana Agents

The `kibana-*` agents are fully functional for Kibana development and serve as concrete examples of how to build layer-specific teammate agents for any codebase. Fork them and replace the Kibana-specific instructions (routes, EUI, Scout, i18n) with your own stack's conventions.

---

## Quality Gate Hooks

Four hooks enforce team discipline automatically.

| Hook Script | Event | What It Enforces |
|-------------|-------|-----------------|
| `team-file-reservation.sh` | `PreToolUse` (Write\|Edit) | Blocks a teammate from editing files reserved by another teammate. Reads `~/.claude/teams/<name>/reservations.json`. |
| `team-task-created.sh` | `TaskCreated` | Rejects tasks that are too vague (<10 chars) or have kitchen-sink scope (>4 action verbs). |
| `team-task-completed.sh` | `TaskCompleted` | Blocks task completion if merge conflict markers exist in changed files or new `FIXME`/`HACK`/`XXX` markers were introduced. |
| `team-teammate-idle.sh` | `TeammateIdle` | Blocks a teammate from idling if merge conflict markers exist in changed files. |

---

## Team Coordination Skill

The `team-coordination` skill packages the full orchestration methodology as a reference the lead can invoke at any time.

**Covers:**
- Auto-creation decision signals (when to spawn a team vs. subagents vs. worktrees)
- The auto-creation flow: `TeamCreate` → file reservations → task graph → spawn → monitor → lint → cleanup
- Team patterns: Cross-Layer Feature, Parallel Review, Investigation, Migration
- File reservation system (`~/.claude/teams/<name>/reservations.json`)
- Task dependency graph patterns (fan-out, fan-in, pipeline)
- Teammate model selection rule (always `model: "sonnet"` — never Opus for teammates)
- Escalation protocol for stuck teammates
- Post-team lint coordination workflow
- Anti-patterns catalogue

---

## How Teams Work

```
1. AUTO-CREATE SIGNAL DETECTED
   Lead identifies ≥3 independent subtasks matching a team signal.

2. ANNOUNCE + CREATE
   Lead calls TeamCreate with a descriptive team name.

3. FILE RESERVATIONS
   Lead writes ~/.claude/teams/<name>/reservations.json before spawning.
   Example: { "backend": "src/**/server/**", "frontend": "src/**/client/**" }
   The team-file-reservation.sh hook enforces these on every Write/Edit.

4. TASK GRAPH
   Lead pre-creates the full task graph with dependencies:
   Task 1 (backend types) → Task 2 (API routes), Task 3 (UI, no deps)
   Task 4 (tests, depends on 2+3)

5. SPAWN TEAMMATES
   Each teammate gets: model: "sonnet", subagent_type: <agent-name>,
   file boundaries, and the escalation protocol in their prompt.

6. MONITOR + REDIRECT
   Lead checks in on teammates not messaging for >5 minutes.
   Reassigns stuck tasks. Quality gates fire automatically via hooks.

7. CENTRALIZED LINT PASS
   After all teammates idle:
   node scripts/eslint --no-cache --fix $(git diff --name-only HEAD)
   Commit: "chore: centralized lint pass after team completion"

8. CLEANUP
   Lead calls TeamDelete. Done.
```

---

## Installation

```
/plugin install agent-team-toolkit@patryks-treadmill
```

Or via the marketplace:

```
/plugin marketplace
```

Search for `agent-team-toolkit`.

---

## Prerequisites

Agent teams require the experimental teams feature to be enabled. Add this to your `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Without this env var, the hooks will install but `TeamCreate` will not be available and the agents will only work as standalone subagents.
