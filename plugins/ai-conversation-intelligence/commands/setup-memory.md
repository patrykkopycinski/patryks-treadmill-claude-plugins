---
name: setup-memory
description: Scaffold or migrate the memory directory structure from 6-tier (L1-L6) to simplified 3-directory layout (knowledge, nominations, audit)
---

# Setup Memory

Migrate or create the simplified memory directory structure.

## Steps

### 1. Detect current state

Check the project memory directory at `~/.claude/projects/<current-project>/memory/`:

- If `L3-knowledge/` exists → **migration needed** (6-tier → simplified)
- If `knowledge/` exists → **already migrated** (verify integrity)
- If no memory directory → **fresh setup**

### 2. Migration (from 6-tier)

**IMPORTANT: Create a backup first.**

```bash
# Backup
cp -r ~/.claude/projects/<project>/memory/ ~/.claude/projects/<project>/memory.backup-$(date +%Y%m%d)/

# Move knowledge files
mkdir -p ~/.claude/projects/<project>/memory/knowledge/
mv ~/.claude/projects/<project>/memory/L3-knowledge/* ~/.claude/projects/<project>/memory/knowledge/ 2>/dev/null

# Move audit files
mkdir -p ~/.claude/projects/<project>/memory/audit/
mv ~/.claude/projects/<project>/memory/L6-audit/* ~/.claude/projects/<project>/memory/audit/ 2>/dev/null

# Create nominations directory
mkdir -p ~/.claude/projects/<project>/memory/nominations/

# Remove empty tier directories
rm -rf ~/.claude/projects/<project>/memory/L1-session/
rm -rf ~/.claude/projects/<project>/memory/L2-agent/
rm -rf ~/.claude/projects/<project>/memory/L3-knowledge/
rm -rf ~/.claude/projects/<project>/memory/L4-nominate/
rm -rf ~/.claude/projects/<project>/memory/L5-daily/
rm -rf ~/.claude/projects/<project>/memory/L6-audit/

# Move any root-level memory files into knowledge/
# (e.g., feedback_no_fetch_between_plugins.md that was at root)
```

### 3. Update MEMORY.md

After moving files, update all path references in MEMORY.md:
- `L3-knowledge/` → `knowledge/`
- `L6-audit/` → `audit/`
- Remove references to L1, L2, L4, L5
- Update the Architecture section to reflect 3-dir structure

### 4. Fresh setup

If no memory directory exists:

```bash
mkdir -p ~/.claude/projects/<project>/memory/{knowledge,nominations,audit}
```

Create a MEMORY.md template:

```markdown
# Memory Index

## Knowledge (Validated Learnings)

## Audit
- [promotion-evidence.md](audit/promotion-evidence.md) - Auto-extracted achievements
```

### 5. Verify

After migration or setup, verify:
- `knowledge/` contains all feedback/reference files
- `audit/` contains promotion-evidence.md and quality-scores.jsonl
- `nominations/` exists (can be empty)
- MEMORY.md references are correct
- No orphaned files in the memory root (except MEMORY.md)
- Backup exists if migration was performed
