---
name: plugin-self-eval-loop
description: >-
  Self-evaluation loop for the treadmill Claude plugins pack. Runs cursor-plugin-evals
  against bundled skills, tracks quality over time, and escalates recurring failures
  via PAMS. Use periodically or before publishing plugin updates.
---

# Plugin Self-Eval Loop

## When to Use

- Before publishing any plugin update
- Periodic quality check (monthly recommended)
- After adding or modifying skills in the pack
- When PAMS detects recurring correction patterns in skills from this pack

## Process

1. **Run evals** — execute `cursor-plugin-evals skill-eval` against each skill in the pack
2. **Parse results** — identify failing skills and evaluators
3. **Fix** — for each failing skill, apply targeted fix (one category per iteration)
4. **Re-run** — re-evaluate only the failing skills
5. **Iterate** — max 3 iterations per skill
6. **PAMS escalation** — if a skill fails repeatedly (3+ sessions), escalate:
   - 2x → create a rule documenting the anti-pattern
   - 3x → create a new skill + eval to address the gap

## Convergence

- All skills pass at >= 85% (OSS-equivalent threshold for plugin skills)
- No regressions in previously passing skills
- PAMS escalation triggers acted on
