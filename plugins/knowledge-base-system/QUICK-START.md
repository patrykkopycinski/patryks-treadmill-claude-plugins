# Quick Start Guide

Get up and running with Knowledge Base System in 5 minutes.

## Installation

### For You (First Time)

```bash
# Plugin already exists at:
~/.claude/plugins/knowledge-base-system/
```

### For Others

**Option 1: Direct Copy**
```bash
# Copy entire plugin directory
cp -r /path/to/knowledge-base-system ~/.claude/plugins/
```

**Option 2: Git Clone** (if you publish it)
```bash
cd ~/.claude/plugins
git clone https://github.com/your-username/knowledge-base-system
```

## Setup (2 steps)

### 1. Initialize Knowledge Base

```bash
/setup-knowledge-base
```

This creates:
- Memory directory structure
- Template memory files
- Automated hooks (optional)

### 2. Setup Promotion Tracking (Optional)

```bash
/setup-promotion-tracking
```

This prompts for:
- **Target position** (Senior Engineer, Staff Engineer, Principal, Manager, or custom)
- **Position description** (generated or custom)
- **Evidence categories** to track

Creates `~/.cursor/promotion-evidence.md` with automation.

## What You Get

### 🤖 Automated Knowledge Capture

**Zero effort, maximum value:**
- Learnings auto-saved at session end
- Promotion evidence auto-captured on commits
- No manual work required

### 📁 Structured Memory

```
~/.claude/projects/<project>/memory/
├── MEMORY.md                          # Index
├── user_role.md                       # Your role/expertise
├── feedback_*.md                      # Corrections, gotchas
├── project_*.md                       # Current work context
└── reference_*.md                     # External resources
```

### 🎯 Promotion Evidence

```
~/.cursor/promotion-evidence.md

Automatically captures:
- What you accomplished
- Business/technical impact
- Competencies demonstrated
- Categorized by skill area
```

### 🛠 Manual Tools (if automation disabled)

- `/capture-learnings` - Manual memory capture
- `/check-cross-repo-consistency` - Version drift detector

## How It Works

### Automated Flow

```
You work normally
       ↓
   git commit
       ↓
┌──────────────────┐
│ PostToolUse Hook │ → Analyzes work
│ (agent runs)     │ → Writes to ~/.cursor/promotion-evidence.md
└──────────────────┘ → Shows: "✅ Added to promotion evidence"


You exit Claude Code
       ↓
┌──────────────────┐
│ SessionEnd Hook  │ → Scans conversation
│ (agent runs)     │ → Creates memory files
└──────────────────┘ → Shows: "📝 Captured N learnings"
```

### What Gets Captured

**Session Learnings:**
✅ Mistakes you corrected
✅ Non-obvious gotchas discovered
✅ Validated approaches
✅ Project context (deadlines, initiatives)
✅ External resource locations

**Promotion Evidence:**
✅ Architectural decisions
✅ Complex problem solving
✅ Infrastructure improvements
✅ Process enhancements
✅ Mentoring/knowledge sharing

**What Doesn't Get Captured:**
❌ Trivial commits (typos, formatting)
❌ Code patterns (read the code)
❌ Debug solutions (fix is in code)
❌ Already documented in CLAUDE.md

## First Use Example

### Scenario: You fix a complex bug

1. **Work normally:**
   ```bash
   # You debug and fix an issue
   git commit -m "fix: resolve race condition in agent convergence detection"
   ```

2. **Hook auto-runs (~5 sec):**
   ```
   ✅ Added to promotion evidence: Problem Solving & Impact
   ```

3. **Check evidence:**
   ```bash
   tail ~/.cursor/promotion-evidence.md

   ## 2026-03-20 - Problem Solving & Impact
   **What:** Fixed race condition in agent convergence causing infinite loops
   **Why it matters:** Prevented 30% of autonomous agent runs from hanging
   **Competency demonstrated:** Complex debugging, system thinking, impact
   ```

4. **Exit session:**
   ```
   📝 Captured 1 learning to memory
   ```

5. **Check memory:**
   ```bash
   cat ~/.claude/projects/.../memory/feedback_convergence_race_condition.md

   ---
   name: feedback_convergence_race_condition
   description: Agent convergence requires thread-safe state management
   type: feedback
   ---

   # Convergence Race Condition

   Multi-threaded evaluation requires proper locking...
   ```

## Customization

### Position Descriptions

Edit `~/.cursor/promotion-evidence.md` header:
```markdown
**Target Position:** [Your target position]

**Position Description:**
Sets technical direction for observability platform, drives innovation
in AI-assisted development, mentors staff engineers, influences company
strategy through technical excellence.
```

### Evidence Categories

Add/remove/rename categories in evidence file:
```markdown
### Technical Leadership
Architecture, complex systems, technical decisions

### AI Innovation
Novel applications of LLM technology, agent systems

### Developer Experience
Tools, frameworks, productivity improvements
```

### Memory Types

Create custom memory types by editing templates.

## Sharing with Team

### Method 1: Direct Copy
```bash
# Send them the plugin directory
tar -czf knowledge-base-system.tar.gz ~/.claude/plugins/knowledge-base-system
# Share the .tar.gz file
```

### Method 2: Git Repository
```bash
cd ~/.claude/plugins/knowledge-base-system
git init
git add .
git commit -m "Initial commit"
git remote add origin <repo-url>
git push
```

Team members clone and run setup commands.

### Method 3: Project Plugin
```bash
# In your project repo
mkdir -p .claude/plugins
cp -r ~/.claude/plugins/knowledge-base-system .claude/plugins/
git add .claude/plugins/knowledge-base-system
git commit -m "Add knowledge base plugin"
```

Team gets it automatically when they clone.

## Privacy Notes

**When sharing, the plugin includes:**
✅ Code (skills, commands, hooks)
✅ Templates (memory structure, evidence format)
✅ Documentation

**When sharing, you should exclude:**
❌ Your actual memory files (in `~/.claude/projects/`)
❌ Your promotion evidence file (`~/.cursor/promotion-evidence.md`)
❌ Personal settings (`~/.claude/settings.json`)

**The plugin asks each user to:**
- Configure their target position
- Set up their evidence categories
- Create their own memories

So everyone gets a personalized system!

## Troubleshooting

**Hooks not firing?**
1. Check `/hooks` menu in Claude Code
2. Verify JSON syntax: `jq . ~/.claude/settings.json`
3. Restart Claude Code

**No promotion evidence created?**
1. Commit must be significant (not typo/formatting)
2. Check `~/.cursor/promotion-evidence.md` exists
3. Look for hook errors in output

**Memories not created?**
1. SessionEnd hook configured?
2. Conversation must have learnings (corrections, discoveries)
3. Check permissions on memory directory

## Next Steps

1. ✅ Run `/setup-knowledge-base`
2. ✅ Run `/setup-promotion-tracking` (optional)
3. ✅ Make a commit → See promotion evidence auto-capture
4. ✅ Exit session → See learning auto-capture
5. ✅ Review and customize captured data
6. ✅ Share with team!

## Questions?

- **README.md** - Full documentation
- **SHARING.md** - Distribution methods
- **GitHub Issues** - Bug reports (if published)

---

**Estimated setup time:** 5 minutes
**Time savings:** Hours per month in manual documentation
**ROI:** Priceless career advancement evidence 🚀
