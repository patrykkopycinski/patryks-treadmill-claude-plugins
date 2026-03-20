# Selective Agent Installation

You don't need to install all 20 agents. Pick what you need!

## 🎯 Installation Methods

### Method 1: Interactive Installer (Recommended)

**Best for:** Most users who want control

```bash
curl -fsSL https://raw.githubusercontent.com/patrykkopycinski/patryks-treadmill-claude-plugins/main/install-select.sh | bash
```

**What it does:**
1. Shows list of available agents
2. You pick which ones you want (e.g., "1 3 5")
3. Creates symlinks only for selected agents
4. Lightweight - no full clone needed

**Example:**
```
📚 Available Agents:

  [1] knowledge-base-system
  [2] kibana-dev-tools
  [3] elastic-utils
  [4] agent-builder-tools
  ...

Select agents to install: 1 4

✅ Installed: knowledge-base-system
✅ Installed: agent-builder-tools
```

---

### Method 2: Manual Symlinks

**Best for:** Advanced users who want full control

```bash
# 1. Clone marketplace
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill

# 2. Symlink only agents you want
ln -s treadmill/plugins/knowledge-base-system knowledge-base-system
ln -s treadmill/plugins/agent-builder-tools agent-builder-tools

# 3. Done! Only those 2 agents are active
```

**Benefits:**
- Full control over what's installed
- Easy to add/remove agents later
- All agents stay up-to-date with `cd treadmill && git pull`

---

### Method 3: Git Sparse-Checkout

**Best for:** Bandwidth-conscious users or large marketplaces

```bash
cd ~/.claude/plugins

# Initialize sparse-checkout
git clone --filter=blob:none --sparse \
  https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins \
  treadmill

cd treadmill

# Check out only the agents you want
git sparse-checkout set \
  .claude-plugin \
  plugins/knowledge-base-system \
  plugins/agent-builder-tools

# Done! Only those agents are downloaded
```

**Benefits:**
- Minimal download (only selected agents)
- Good for slow connections
- Keeps disk usage low

**Add more agents later:**
```bash
cd ~/.claude/plugins/treadmill
git sparse-checkout add plugins/another-agent
```

---

### Method 4: Install All, Disable Some

**Best for:** Users who want everything available but not active

```bash
# Install full marketplace
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill

# Disable agents you don't want
# Add to ~/.claude/settings.json:
{
  "enabledPlugins": {
    "knowledge-base-system@treadmill": true,
    "agent-builder-tools@treadmill": true,
    "kibana-dev-tools@treadmill": false,  // Disabled
    "elastic-utils@treadmill": false       // Disabled
  }
}
```

**Benefits:**
- All agents present (can enable anytime)
- Fine-grained control
- Easy to toggle on/off

---

## 📊 Method Comparison

| Method | Disk Usage | Setup | Updates | Control |
|--------|------------|-------|---------|---------|
| **Interactive Installer** | Low (symlinks) | Easy | Simple | High |
| **Manual Symlinks** | Low (symlinks) | Medium | Simple | Full |
| **Sparse-Checkout** | Minimal | Advanced | Simple | Full |
| **Install All + Disable** | High (full) | Easy | Simple | Medium |

---

## 🎯 Recommendations by Use Case

### "I want just 1-2 agents"
→ **Method 1: Interactive Installer**
```bash
curl -fsSL https://raw.githubusercontent.com/patrykkopycinski/patryks-treadmill-claude-plugins/main/install-select.sh | bash
```

### "I want flexibility to enable/disable"
→ **Method 2: Manual Symlinks**
```bash
git clone <repo> treadmill
ln -s treadmill/plugins/X X
```

### "I'm on slow internet"
→ **Method 3: Sparse-Checkout**
```bash
git clone --sparse <repo>
git sparse-checkout set plugins/X
```

### "I want everything available"
→ **Method 4: Install All + Disable**
```bash
git clone <repo> treadmill
# Configure enabledPlugins
```

---

## 🔄 Managing Your Installation

### Add More Agents Later

**Interactive Installer:**
```bash
bash ~/.claude/plugins/treadmill/install-select.sh
```

**Manual Symlinks:**
```bash
ln -s ~/.claude/plugins/treadmill/plugins/new-agent ~/.claude/plugins/new-agent
```

**Sparse-Checkout:**
```bash
cd ~/.claude/plugins/treadmill
git sparse-checkout add plugins/new-agent
```

### Remove Agents

**Symlinks:**
```bash
rm ~/.claude/plugins/agent-name  # Just removes symlink, not source
```

**Disable in Settings:**
```json
{
  "enabledPlugins": {
    "agent-name@treadmill": false
  }
}
```

### Update All Installed Agents

```bash
cd ~/.claude/plugins/treadmill
git pull origin main
```

All symlinked agents update automatically!

---

## 💡 Pro Tips

### Tip 1: Start Small
Install 1-2 agents, use them for a week, then add more.

### Tip 2: Use Symlinks
They're lightweight and easy to manage:
```bash
# Add agent
ln -s treadmill/plugins/X X

# Remove agent
rm X

# No disk space wasted, source stays in treadmill/
```

### Tip 3: Group by Use Case
Create groups for different workflows:

```bash
# Productivity agents
ln -s treadmill/plugins/knowledge-base-system knowledge-base-system
ln -s treadmill/plugins/promotion-tracker promotion-tracker

# Development agents
ln -s treadmill/plugins/kibana-dev-tools kibana-dev-tools
ln -s treadmill/plugins/elastic-utils elastic-utils
```

### Tip 4: Check What's Installed
```bash
ls -la ~/.claude/plugins/ | grep treadmill
```

Shows all agents symlinked from treadmill.

---

## 🆘 Troubleshooting

### "Agent not showing up in Claude Code"
1. Check symlink exists: `ls -la ~/.claude/plugins/agent-name`
2. Restart Claude Code
3. Check `/help` for agent commands

### "Want to uninstall everything"
```bash
# Remove symlinks
rm ~/.claude/plugins/agent-*

# Remove marketplace
rm -rf ~/.claude/plugins/treadmill
```

### "Accidentally cloned full repo, want sparse"
```bash
cd ~/.claude/plugins/treadmill

# Enable sparse-checkout
git sparse-checkout init --cone

# Set what you want
git sparse-checkout set plugins/agent1 plugins/agent2

# Git will remove other files
```

---

## 📈 Disk Usage Comparison

**For 20 agents (each ~5MB):**

| Method | Disk Usage |
|--------|------------|
| Install all 20 | ~100 MB |
| Sparse-checkout (5 agents) | ~25 MB |
| Symlinks (5 agents) | ~100 MB marketplace + ~0 MB links |
| Individual repos (5 agents) | ~25 MB |

**Symlinks:** Marketplace stays in one place, multiple symlinks point to it (no duplication).

---

## 🎯 Quick Reference

```bash
# Interactive install (easiest)
curl -fsSL <install-select.sh> | bash

# Manual symlinks (most flexible)
git clone <repo> treadmill
ln -s treadmill/plugins/X X

# Sparse-checkout (minimal disk)
git clone --sparse <repo>
git sparse-checkout set plugins/X

# Disable unwanted agents
# Edit ~/.claude/settings.json

# Update everything
cd treadmill && git pull
```

---

**Choose your method and start running!** 🏃💨
