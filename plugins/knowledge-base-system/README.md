# Knowledge Base System Plugin

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-claude--knowledge--base--system-181717?logo=github)](https://github.com/patrykkopycinski/claude-knowledge-base-system)

Automated knowledge capture system for Claude Code that prevents repeating mistakes and builds organizational memory over time.

## 🚀 Quick Start

**Via Marketplace (recommended):**
```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install knowledge-base-system@patryks-treadmill
```

**Or manual install:**
```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

**Then in Claude Code:**
```bash
/knowledge-base-system:setup-knowledge-base
/knowledge-base-system:setup-promotion-tracking  # Optional
```

**[Full Installation Guide →](INSTALL.md)**

## Features

### 🤖 Automated Memory Capture
- **Promotion Evidence**: Auto-captured on every git commit or PR creation
- **Session Learnings**: Auto-captured when you exit Claude Code
- **No Manual Work**: Operates invisibly in the background

### 📁 Structured Memory System
- **Feedback Memories**: Corrections, validated approaches, gotchas
- **Project Memories**: Current work, deadlines, initiatives
- **Reference Memories**: Where to find external resources
- **User Memories**: Your role, expertise, preferences

### 🛠 Included Tools
- `/setup-knowledge-base` - Initialize system for a project
- `/capture-learnings` - Manual learning capture (if automation disabled)
- `/check-cross-repo-consistency` - Detect version drift across repos

## Installation

### Option 1: Local Plugin (Recommended for Testing)

```bash
# Copy plugin to your plugins directory
cp -r knowledge-base-system ~/.claude/plugins/

# Enable in settings
claude config set enabledPlugins.knowledge-base-system@builtin true
```

### Option 2: Publish to Marketplace

1. Create GitHub repo with plugin
2. Add to marketplace.json
3. Others install via marketplace

## Quick Start

1. **Install plugin** (see above)

2. **Run setup command:**
   ```bash
   /setup-knowledge-base
   ```

3. **Work normally** - The system captures learnings automatically:
   - Commit code → Promotion evidence auto-captured
   - Exit session → Learnings auto-saved to memory
   - Correct mistakes → Feedback memories created

4. **Review your memories:**
   ```bash
   ls ~/.claude/projects/$(pwd | sed 's/\//-/g' | sed 's/^-//')/memory/
   ```

## How It Works

```
┌─────────────────────────────────────────────────┐
│ You work normally (code, commit, discuss)      │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌──────────┐    ┌─────────────┐
│git commit│    │You correct  │
│gh pr     │    │Claude       │
└────┬─────┘    └──────┬──────┘
     │                 │
     ▼                 ▼
┌─────────────┐  ┌──────────────┐
│PostToolUse  │  │SessionEnd    │
│Hook (agent) │  │Hook (agent)  │
└──────┬──────┘  └──────┬───────┘
       │                │
       ├─ Analyze       ├─ Scan conversation
       ├─ Write file    ├─ Create memories
       └─ Notify        └─ Update index
```

## Memory File Format

Each memory uses YAML frontmatter + markdown:

```markdown
---
name: feedback_topic
description: One-line description
type: feedback|project|reference|user
---

# Topic Name

Content with clear explanation.

**Why:** Reason for this pattern/rule

**How to apply:** When to use this guidance

**Never:** Anti-patterns to avoid

**Confirmed approach:** Note that this was validated
```

## Automation Hooks

### PostToolUse Hook (Promotion Evidence)
- **Triggers:** Every `git commit` or `gh pr create`
- **Action:** Analyzes work, appends to `~/.cursor/promotion-evidence.md`
- **Categories:** Technical Leadership, Problem Solving, Influence, People Development, Strategic Delivery

### SessionEnd Hook (Learning Capture)
- **Triggers:** When you exit Claude Code
- **Action:** Scans conversation, creates memory files for:
  - Mistakes corrected → feedback memory
  - Non-obvious discoveries → feedback memory
  - Validated approaches → feedback memory
  - Project context → project memory
  - External resources → reference memory

## Configuration

### Project-Level (Team-Wide)
Add to `.claude/settings.json` (checked into git):
```json
{
  "hooks": {
    "PostToolUse": [...],
    "SessionEnd": [...]
  }
}
```

### User-Level (Personal)
Add to `~/.claude/settings.json` (your machine only):
```json
{
  "hooks": {
    "PostToolUse": [...],
    "SessionEnd": [...]
  }
}
```

## Customization

### Disable Automation
Remove hooks from settings.json and use manual capture:
```bash
/capture-learnings
```

### Adjust Memory Types
Edit memory files to match your needs:
- Add custom categories
- Change frontmatter schema
- Adjust "Why" and "How to apply" sections

### Cross-Repo Consistency
For teams managing multiple repos:
1. Edit `/check-cross-repo-consistency` skill
2. Update repo paths
3. Add custom version checks

## Best Practices

### What to Capture
✅ Non-obvious gotchas
✅ Mistakes you/Claude made
✅ Validated approaches
✅ Temporary project context
✅ External resource locations

### What NOT to Capture
❌ Code patterns (read the code)
❌ Git history (use `git log`)
❌ Debug solutions (fix is in code)
❌ Already in CLAUDE.md
❌ Trivial/obvious information

### Memory Maintenance
- **Weekly:** Review project memories, archive stale items
- **Monthly:** Consolidate related learnings
- **Quarterly:** Escalate repeated feedback → rules → skills

## Architecture

```
knowledge-base-system/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── commands/
│   └── setup-knowledge-base.md  # Setup command
├── skills/
│   ├── capture-learnings/    # Manual capture skill
│   └── check-cross-repo-consistency/  # Version drift checker
└── README.md                 # This file
```

## Sharing with Your Team

### Option 1: Project Plugin
1. Copy plugin to project: `.claude/plugins/knowledge-base-system/`
2. Team members auto-load when working in project
3. Shared hooks in `.claude/settings.json`

### Option 2: Marketplace
1. Publish plugin to GitHub
2. Add to marketplace
3. Team installs via `/plugins install`

### Option 3: Documentation
Share this README with setup instructions for manual configuration.

## Troubleshooting

**Hooks not firing:**
- Check `/hooks` menu in Claude Code
- Verify JSON syntax in settings.json
- Check hook matcher (e.g., "Bash" for git commands)

**Memories not created:**
- Check permissions on memory directory
- Verify SessionEnd hook is configured
- Look for hook errors in Claude Code output

**Duplicate memories:**
- SessionEnd hook checks for duplicates automatically
- Manually dedup by reading existing files first

## Examples

### Feedback Memory (Automated)
```markdown
---
name: feedback_test_isolation
description: Tests must run in isolation to prevent flakiness
type: feedback
---

# Test Isolation Pattern

Always use separate test fixtures per test to avoid state leakage.

**Why:** Spent 3 hours debugging flaky tests caused by shared state.

**How to apply:** Use `beforeEach` to create fresh fixtures, never share mutable state across tests.

**Confirmed approach:** Reduced test flakiness from 15% to <1%.
```

### Project Memory (Automated)
```markdown
---
name: project_q1_launch
description: Q1 product launch deadline and constraints
type: project
---

# Q1 Product Launch

Feature freeze: 2026-03-31 for launch on 2026-04-15.

**Why:** Marketing campaign locked in, cannot slip dates.

**How to apply:** Flag any non-critical work for post-launch. Focus on P0 bugs only.
```

## Contributing

1. Fork the plugin
2. Add features or fix bugs
3. Test with `/setup-knowledge-base`
4. Submit PR with examples

## License

MIT - Share freely, customize as needed

## Author

Patryk Kopycinski
Software Engineer
Building automated agents for career growth

---

**Questions?** Open an issue or reach out on the Claude Code community forums.
