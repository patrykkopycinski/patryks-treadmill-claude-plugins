# Selective Plugin Installation

You don't need all 13 plugins. Pick what you need.

---

## 🎯 Method 0: Marketplace (Recommended)

**Best for:** Most users. No cloning required.

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
```

Then install individual plugins:

```
/plugin install ai-conversation-intelligence@patryks-treadmill
/plugin install session-safety-hooks@patryks-treadmill
/plugin install developer-craft-toolkit@patryks-treadmill
/plugin install agent-team-toolkit@patryks-treadmill
/plugin install ci-babysitter@patryks-treadmill
/plugin install kibana-testing-tools@patryks-treadmill
```

Or browse interactively: open `/plugin` and go to the **Discover** tab.

**Benefits:**
- No manual cloning
- Claude Code manages updates
- Install/uninstall in one command

---

## 🔧 Method 1: Manual Symlinks

**Best for:** Advanced users who want full control over what's active.

```bash
# 1. Clone the marketplace
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill

# 2. Symlink only the plugins you want
ln -s treadmill/plugins/session-safety-hooks session-safety-hooks
ln -s treadmill/plugins/ai-conversation-intelligence ai-conversation-intelligence
ln -s treadmill/plugins/developer-craft-toolkit developer-craft-toolkit

# 3. Restart Claude Code — done
```

**Add more later:**
```bash
ln -s ~/.claude/plugins/treadmill/plugins/kibana-testing-tools \
      ~/.claude/plugins/kibana-testing-tools
```

**Remove a plugin:**
```bash
rm ~/.claude/plugins/session-safety-hooks  # removes symlink, not source
```

**Update everything:**
```bash
cd ~/.claude/plugins/treadmill && git pull
```

---

## 📦 Method 2: Git Sparse-Checkout

**Best for:** Bandwidth-conscious users or minimal disk footprint.

```bash
cd ~/.claude/plugins

git clone --filter=blob:none --sparse \
  https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins \
  treadmill

cd treadmill

git sparse-checkout set \
  .claude-plugin \
  plugins/session-safety-hooks \
  plugins/ai-conversation-intelligence \
  plugins/developer-craft-toolkit
```

**Add more plugins later:**
```bash
cd ~/.claude/plugins/treadmill
git sparse-checkout add plugins/agent-team-toolkit
git sparse-checkout add plugins/kibana-testing-tools
```

---

## ⚙️ Method 3: Install All, Disable Selectively

**Best for:** Users who want everything available but not all active.

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Then disable specific plugins in `~/.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "session-safety-hooks@treadmill": true,
    "ai-conversation-intelligence@treadmill": true,
    "developer-craft-toolkit@treadmill": true,
    "agent-team-toolkit@treadmill": true,
    "skill-ecosystem-tools@treadmill": true,
    "kibana-testing-tools@treadmill": true,
    "kibana-code-quality-suite@treadmill": true,
    "kibana-dev-workflow-tools@treadmill": true,
    "kibana-build-performance-tools@treadmill": false,
    "kibana-docs-release-tools@treadmill": false,
    "kibana-infrastructure-ops-tools@treadmill": false,
    "kibana-career-development@treadmill": false,
    "ci-babysitter@treadmill": false
  }
}
```

---

## 📊 Method Comparison

| Method | Disk Usage | Setup | Updates | Control |
|--------|------------|-------|---------|---------|
| **Marketplace** | Managed | Easiest | Automatic | High |
| **Manual Symlinks** | Low (symlinks) | Medium | `git pull` | Full |
| **Sparse-Checkout** | Minimal | Advanced | `git pull` | Full |
| **Install All + Disable** | Full clone | Easy | `git pull` | Medium |

---

## 🎯 Recommendations by Use Case

### "I'm new to this, just install it"
→ **Method 0: Marketplace**
```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install ai-conversation-intelligence@patryks-treadmill
/plugin install session-safety-hooks@patryks-treadmill
```

### "I only work outside Kibana"
→ Start with 4 generic plugins:
```
/plugin install developer-craft-toolkit@patryks-treadmill
/plugin install session-safety-hooks@patryks-treadmill
/plugin install agent-team-toolkit@patryks-treadmill
/plugin install skill-ecosystem-tools@patryks-treadmill
```

### "I want flexibility to toggle plugins"
→ **Method 1: Manual Symlinks**
```bash
git clone <repo> treadmill
ln -s treadmill/plugins/X X
```

### "I'm on slow internet"
→ **Method 2: Sparse-Checkout**
```bash
git clone --sparse <repo>
git sparse-checkout set plugins/X plugins/Y
```

### "I want everything available"
→ **Method 3: Install All + Disable**
```bash
git clone <repo> treadmill
# Configure enabledPlugins in settings.json
```

---

## 🔄 Managing Your Installation

### Check what's installed
```bash
ls -la ~/.claude/plugins/ | grep treadmill
```

### Update all plugins
```bash
cd ~/.claude/plugins/treadmill
git pull origin main
```
All symlinked plugins update automatically.

### Remove everything
```bash
rm ~/.claude/plugins/*treadmill* 2>/dev/null
rm -rf ~/.claude/plugins/treadmill
```

---

## 💡 Pro Tips

**Start small.** Install 2-3 plugins for a week before adding more.

**Generic first.** If you're unsure, start with the 4 generic plugins — they work everywhere.

**Symlinks are free.** The full marketplace clone costs disk space once; each additional symlink costs nothing.

**Group by workflow:**
```bash
# Safety + intelligence (works anywhere)
ln -s treadmill/plugins/session-safety-hooks session-safety-hooks
ln -s treadmill/plugins/ai-conversation-intelligence ai-conversation-intelligence

# Kibana dev stack
ln -s treadmill/plugins/kibana-testing-tools kibana-testing-tools
ln -s treadmill/plugins/kibana-code-quality-suite kibana-code-quality-suite
ln -s treadmill/plugins/kibana-dev-workflow-tools kibana-dev-workflow-tools
ln -s treadmill/plugins/ci-babysitter ci-babysitter
```

---

## 🆘 Troubleshooting

### "Plugin not showing up in Claude Code"
1. Check symlink: `ls -la ~/.claude/plugins/plugin-name`
2. Restart Claude Code
3. Verify `plugin.json` exists in the plugin directory

### "Want to disable one plugin temporarily"
```json
// ~/.claude/settings.json
{
  "enabledPlugins": {
    "ci-babysitter@treadmill": false
  }
}
```

### "Accidentally cloned full repo, want sparse"
```bash
cd ~/.claude/plugins/treadmill
git sparse-checkout init --cone
git sparse-checkout set plugins/session-safety-hooks plugins/ai-conversation-intelligence
```

---

## 📈 Disk Usage

**13 plugins (estimated ~3MB each):**

| Method | Disk Usage |
|--------|------------|
| All 13 via marketplace | ~40 MB managed |
| Full clone (all 13) | ~40 MB |
| Sparse-checkout (4 plugins) | ~12 MB |
| Symlinks (any count) | ~40 MB clone + ~0 MB per link |

---

## 🎯 Quick Reference

```bash
# Marketplace (recommended)
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install <name>@patryks-treadmill

# Manual symlinks
git clone <repo> treadmill
ln -s treadmill/plugins/<name> <name>

# Sparse-checkout
git clone --sparse <repo> treadmill
git sparse-checkout set plugins/<name>

# Disable a plugin
# Set "plugin-name@treadmill": false in ~/.claude/settings.json

# Update everything
cd treadmill && git pull
```

---

**Choose your method and start running!** 🏃💨
