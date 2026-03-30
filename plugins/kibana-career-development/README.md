# Kibana Career Development

**1 skill for automated promotion evidence tracking**

Captures promotion-worthy achievements after every non-trivial task, maps them to your competency framework, and appends structured entries with quantified impact metrics to your promotion log.

---

## Skills

### @promotion-evidence-tracker
**Auto-capture and structure promotion evidence aligned to your competency framework**

Activates proactively after completing significant work, or on demand when you want to log an achievement.

#### When it triggers

- Automatically after any non-trivial task (>1 file changed, cross-package impact)
- After eval pass rate improvements (keywords: "pass rate", "100%", "eval results")
- After CI/CD optimizations (keywords: "CI fixed", "Buildkite", "flake eliminated")
- After test migrations (keywords: "Cypress", "Scout", "migrated")
- After framework or architecture work (keywords: "framework", "RFC", "proposal")
- Manually: "log this for promotion" | "track promotion evidence"

#### What it produces

For each achievement, the skill generates a structured evidence entry:

```
Challenge    — What problem was being solved and why it was hard
Approach     — Technical decisions and methods used
Impact       — Quantified before/after metrics (execution time, pass rate, scope)
Artifacts    — PR links, docs, RFCs
Competency   — Explicit mapping to 1–3 competency categories
```

The entry is shown for review before being appended to `~/.cursor/promotion-evidence.md`.

#### Competency categories tracked

1. **Technical Leadership** — frameworks, architectures, reusable systems
2. **Problem Solving & Impact** — metric improvements, root cause fixes, reliability gains
3. **Influence & Communication** — proposals, docs, best practices guides
4. **People Development** — mentoring, pair programming, code review with teaching
5. **Strategic Delivery** — cross-team projects, migrations, coordinated rollouts

#### Example entry

```
### 2026-03-20 — Strategic Test Suite Optimization

Category: Technical Leadership, Strategic Delivery

Impact:
- Execution time: 9.5min → 3.2min (66% reduction)
- Setup overhead: 360s → 60s (83% reduction)
- Test count: 47 → 28 (-40% via consolidation)
- Coverage: +14 blind spot scenarios (RBAC, error paths)
```

#### Where evidence is stored

```
~/.cursor/promotion-evidence.md
```

Organized with recent achievements at the top and a running competency scorecard.

---

## Installation

### Via Marketplace

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install kibana-career-development@patryks-treadmill
```

### Manual

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Restart Claude Code or run `/reload-plugins`.

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
