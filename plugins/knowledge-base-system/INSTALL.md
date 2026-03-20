# Installation Guide

## Quick Install (2 commands)

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/claude-knowledge-base-system
```

Then in Claude Code:
```bash
/setup-knowledge-base
/setup-promotion-tracking  # Optional
```

Done! 🎉

---

## Detailed Installation

### Prerequisites

- Claude Code installed
- Git installed
- `~/.claude/plugins/` directory exists (created automatically by Claude Code)

### Step 1: Clone Repository

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/claude-knowledge-base-system
```

This creates:
```
~/.claude/plugins/claude-knowledge-base-system/
```

### Step 2: Enable Plugin (if needed)

Most configurations auto-detect plugins. If not, add to `~/.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "claude-knowledge-base-system@builtin": true
  }
}
```

### Step 3: Verify Installation

Restart Claude Code or run:
```bash
/help
```

Look for these commands:
- `/setup-knowledge-base`
- `/setup-promotion-tracking`
- `/capture-learnings`
- `/check-cross-repo-consistency`

### Step 4: Initialize for a Project

Navigate to your project directory in Claude Code, then:

```bash
/setup-knowledge-base
```

Follow the prompts to:
- Create memory directory structure
- Configure automation hooks (recommended)
- Set up template files

### Step 5: Setup Promotion Tracking (Optional)

```bash
/setup-promotion-tracking
```

This prompts for:
- Target position (Senior, Staff, Principal, Manager, or custom)
- Position description (generated or custom)
- Evidence categories to track

Creates `~/.cursor/promotion-evidence.md` with automation.

---

## Verification

### Test Memory System

1. Make a change and commit:
   ```bash
   git commit -m "feat: add important feature"
   ```

2. Look for:
   ```
   ✅ Added to promotion evidence: [Category]
   ```

3. Check evidence file:
   ```bash
   cat ~/.cursor/promotion-evidence.md
   ```

### Test Learning Capture

1. Have a conversation with Claude Code
2. Exit the session
3. Look for:
   ```
   📝 Captured N learnings to memory
   ```

4. Check memories:
   ```bash
   ls ~/.claude/projects/$(pwd | sed 's/\//-/g' | sed 's/^-//')/memory/
   ```

---

## Updating

### Pull Latest Changes

```bash
cd ~/.claude/plugins/claude-knowledge-base-system
git pull origin main
```

### Check Version

```bash
cat ~/.claude/plugins/claude-knowledge-base-system/.claude-plugin/plugin.json | grep version
```

---

## Uninstall

### Remove Plugin

```bash
rm -rf ~/.claude/plugins/claude-knowledge-base-system
```

### Keep Your Data

Your data is stored separately:
- Memories: `~/.claude/projects/<project>/memory/`
- Promotion evidence: `~/.cursor/promotion-evidence.md`

These persist even after uninstalling the plugin.

### Clean Uninstall (Remove Data)

```bash
# Remove plugin
rm -rf ~/.claude/plugins/claude-knowledge-base-system

# Remove all project memories (careful!)
rm -rf ~/.claude/projects/*/memory/

# Remove promotion evidence
rm ~/.cursor/promotion-evidence.md
```

---

## Troubleshooting

### Plugin Not Showing Up

1. **Restart Claude Code**
2. **Check plugin directory:**
   ```bash
   ls ~/.claude/plugins/claude-knowledge-base-system
   ```
3. **Verify plugin.json exists:**
   ```bash
   cat ~/.claude/plugins/claude-knowledge-base-system/.claude-plugin/plugin.json
   ```

### Commands Not Available

1. **Check enabled plugins:**
   ```bash
   cat ~/.claude/settings.json | grep enabledPlugins
   ```

2. **Manually enable:**
   ```json
   {
     "enabledPlugins": {
       "claude-knowledge-base-system@builtin": true
     }
   }
   ```

3. **Restart Claude Code**

### Hooks Not Firing

1. **Check hooks configured:**
   ```bash
   cat ~/.claude/settings.json | jq .hooks
   ```

2. **Verify JSON syntax:**
   ```bash
   jq . ~/.claude/settings.json
   ```

3. **Check hook permissions:** Open `/hooks` menu in Claude Code

### Memory Files Not Created

1. **Check directory exists:**
   ```bash
   ls ~/.claude/projects/$(pwd | sed 's/\//-/g' | sed 's/^-//')/
   ```

2. **Check permissions:**
   ```bash
   ls -la ~/.claude/projects/
   ```

3. **Check SessionEnd hook:** Should be configured in settings.json

---

## Platform-Specific Notes

### macOS

Standard installation works as documented.

### Linux

Standard installation works as documented.

### Windows

Use Git Bash or WSL:
```bash
cd %USERPROFILE%\.claude\plugins
git clone https://github.com/patrykkopycinski/claude-knowledge-base-system
```

---

## Getting Help

- **Issues:** https://github.com/patrykkopycinski/claude-knowledge-base-system/issues
- **Discussions:** https://github.com/patrykkopycinski/claude-knowledge-base-system/discussions
- **Documentation:** Check README.md, QUICK-START.md, SHARING.md

---

## What's Next?

After installation:

1. ✅ Read [QUICK-START.md](QUICK-START.md) for usage guide
2. ✅ Run `/setup-knowledge-base` in your first project
3. ✅ Run `/setup-promotion-tracking` to track career growth
4. ✅ Work normally - system captures automatically!
5. ✅ Review captured data and customize

**Estimated setup time:** 5 minutes
**Time saved per month:** Hours of manual documentation
