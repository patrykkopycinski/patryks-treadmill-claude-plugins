---
name: setup-knowledge-base
description: Initialize automated knowledge base system for this project
args: []
---

# Setup Knowledge Base System

Initialize the automated knowledge base system with memory structure, hooks, and skills.

## What This Does

1. **Creates memory directory structure**
   - `~/.claude/projects/<project>/memory/`
   - MEMORY.md index
   - Template memory files

2. **Configures automation hooks** (optional, asks user)
   - PostToolUse: Auto-capture promotion evidence on git commit/PR
   - SessionEnd: Auto-capture learnings at session end

3. **Sets up skills**
   - `/capture-learnings` - Manual learning capture
   - `/check-cross-repo-consistency` - Version drift detection

## Execution Steps

### Step 1: Determine Project Path

```bash
PROJECT_MEMORY_DIR="$HOME/.claude/projects/$(pwd | sed 's/\//-/g' | sed 's/^-//')/memory"
echo "Memory directory: $PROJECT_MEMORY_DIR"
```

### Step 2: Create Memory Structure

```bash
mkdir -p "$PROJECT_MEMORY_DIR"

cat > "$PROJECT_MEMORY_DIR/MEMORY.md" <<'EOF'
# Project Memory Index

Learnings and context that aren't derivable from code or git history.

## User Memories
- [user_role.md](user_role.md) - Role, expertise, preferences

## Feedback Memories
Corrections and validated approaches - what to avoid and what to keep doing.

## Project Memories
Ongoing work, initiatives, temporary context.

## Reference Memories
Pointers to external information sources.
EOF

echo "✓ Created memory structure at $PROJECT_MEMORY_DIR"
```

### Step 3: Create Template Files

```bash
# User role template
cat > "$PROJECT_MEMORY_DIR/user_role.md" <<'EOF'
---
name: user_role
description: Your role, responsibilities, and how you work
type: user
---

# User Role Context

[Add your role, team, and work focus areas]

## How to Apply
[How Claude should tailor responses to you]
EOF

# Reference resources template
cat > "$PROJECT_MEMORY_DIR/reference_resources.md" <<'EOF'
---
name: reference_resources
description: Where to find project documentation and external resources
type: reference
---

# Project Resources

## Documentation
[Where docs live]

## Tools & Scripts
[Common commands, scripts, utilities]

## External Resources
[Dashboards, wikis, Slack channels]
EOF

echo "✓ Created template memory files"
```

### Step 4: Ask About Hook Configuration

Use AskUserQuestion to confirm hook setup:

**Question:** "Do you want to enable automated memory capture?"

**Options:**
1. **Yes, full automation (Recommended)** - Auto-capture promotion evidence + session learnings
2. **Promotion evidence only** - Only auto-capture on git commit/PR
3. **No automation** - Manual capture only via `/capture-learnings`

**If Option 1 (Full Automation):**

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "agent",
        "prompt": "Analyze git commit/PR for promotion evidence. If significant: Read/append to ~/.cursor/promotion-evidence.md with date, category, description, impact. Return {\"systemMessage\": \"✅ Added to promotion evidence\"}. Else return {}.",
        "timeout": 30
      }]
    }],
    "SessionEnd": [{
      "hooks": [{
        "type": "agent",
        "prompt": "Scan conversation for learnings (corrections, gotchas, validated patterns). Create memory files in ~/.claude/projects/<project>/memory/ with frontmatter. Return {\"systemMessage\": \"📝 Captured N learnings\"}. Skip if nothing memory-worthy.",
        "timeout": 60
      }]
    }]
  }
}
```

**If Option 2 (Promotion Only):**
Only add PostToolUse hook (omit SessionEnd).

**If Option 3 (No Automation):**
Skip hook configuration entirely.

### Step 5: Merge Hooks into Settings

If user chose automation:

1. Read project settings: `.claude/settings.json` (or create if missing)
2. Merge hooks configuration (preserve existing hooks)
3. Write back to file
4. Confirm: "✓ Hooks configured in .claude/settings.json"

### Step 6: Summary

Show completion summary:

```
✅ Knowledge Base System Setup Complete!

📁 Memory directory: ~/.claude/projects/<project>/memory/
📝 Template files created - customize for your project

Automation enabled:
• Promotion evidence: Auto-captured on git commit/PR
• Session learnings: Auto-captured at session end

Available commands:
• /capture-learnings - Manual learning capture
• /check-cross-repo-consistency - Check version drift (if applicable)

Edit memory files to add project-specific context:
- user_role.md - Your role and work style
- reference_resources.md - Where to find docs/tools

Your knowledge base will grow automatically as you work!
```

## Important Notes

- **Project vs User Settings:** This creates project-level memory (in project's .claude/). Hooks can be in project settings (team-wide) or user settings (personal only).
- **Git Ignore:** Add `.claude/settings.local.json` to `.gitignore` for personal overrides.
- **Customization:** Edit template files with project-specific context after setup.
