---
name: validate-claude-marketplace
description: Validate Claude Code marketplace plugin structure and schema before publishing. Checks marketplace.json, plugin.json files, and path references.
---

# Validate Claude Marketplace Plugin

Validate Claude Code marketplace structure and schema before publishing.

## When to Use
- Before pushing marketplace changes to GitHub
- After creating/modifying marketplace.json or plugin.json
- When adding new plugins to marketplace
- Before submitting marketplace to Claude

## What This Skill Does

1. **Validates marketplace.json** at repository root
   - Checks location (must be at root, not subdirectory)
   - Validates schema (kebab-case names, owner object, author objects, source fields)
   - Verifies all required fields present

2. **Validates plugin.json** files
   - Checks each plugin has plugin.json at its root
   - Validates paths are relative from plugin root (not ../)
   - Verifies referenced files exist (skills, commands)

3. **Reports all issues** with clear fix instructions

## Validation Checklist

### ✅ marketplace.json
- [ ] Located at repository root (not `.claude-plugin/`)
- [ ] `name` is kebab-case (no spaces)
- [ ] `owner` is object with `name` and `url`
- [ ] Each plugin entry has:
  - [ ] `name` in kebab-case (no spaces)
  - [ ] `author` as object with `name` and `url`
  - [ ] `source` field with `type` and `path`
  - [ ] `path` points to existing directory

### ✅ plugin.json (for each plugin)
- [ ] Located at plugin root (e.g., `plugins/my-plugin/plugin.json`)
- [ ] Paths use relative paths from plugin root (no `../`)
- [ ] All referenced skill files exist
- [ ] All referenced command files exist

## Instructions

You are a validation expert for Claude Code marketplace plugins.

### Step 1: Locate Repository
Ask the user for the marketplace repository path, or detect it if already in a marketplace repo.

### Step 2: Validate marketplace.json

Check the root `marketplace.json`:

```bash
# Check if exists at root
if [ ! -f "marketplace.json" ]; then
  echo "❌ marketplace.json not found at repository root"
  echo "   Check: Is it in .claude-plugin/ subdirectory? (must be at root)"
fi

# Validate with jq
cat marketplace.json | jq '
  # Check name is kebab-case
  if .name | test("[A-Z ]") then
    "❌ name must be kebab-case, no spaces or capitals: " + .name
  else empty end,

  # Check owner is object
  if .owner | type != "object" then
    "❌ owner must be object with name and url, got: " + (.owner | type)
  else empty end,

  # Check each plugin
  .plugins[] |
    if .name | test("[A-Z ]") then
      "❌ plugin name must be kebab-case: " + .name
    else empty end,
    if .author | type != "object" then
      "❌ plugin author must be object, got string: " + .name
    else empty end,
    if .source == null then
      "❌ plugin missing source field: " + .name
    else empty end
'
```

### Step 3: Validate Plugin Structure

For each plugin in `plugins/`:

```bash
for plugin_dir in plugins/*/; do
  plugin_name=$(basename "$plugin_dir")

  # Check plugin.json at root
  if [ ! -f "$plugin_dir/plugin.json" ]; then
    echo "❌ $plugin_name: plugin.json not found at plugin root"
    echo "   Expected: $plugin_dir/plugin.json"
    continue
  fi

  # Check paths don't use ../
  if grep -q '"path": "\.\.' "$plugin_dir/plugin.json"; then
    echo "❌ $plugin_name: paths use ../ (must be relative from plugin root)"
    grep '"path"' "$plugin_dir/plugin.json"
  fi

  # Check referenced files exist
  cd "$plugin_dir"

  for skill_path in $(jq -r '.skills[]?.path // empty' plugin.json); do
    if [ ! -f "$skill_path" ]; then
      echo "❌ $plugin_name: skill file not found: $skill_path"
    fi
  done

  for cmd_path in $(jq -r '.commands[]?.path // empty' plugin.json); do
    if [ ! -f "$cmd_path" ]; then
      echo "❌ $plugin_name: command file not found: $cmd_path"
    fi
  done

  cd - > /dev/null
done
```

### Step 4: Generate Report

Output a structured report:

```
📦 Claude Marketplace Validation Report

Repository: /path/to/repo
Plugins: 2

✅ marketplace.json
  ✓ Located at root
  ✓ Name is kebab-case
  ✓ Owner is object
  ✓ All plugins have source field

✅ ci-babysitter
  ✓ plugin.json at root
  ✓ Paths relative from root
  ✓ 2 skills found
  ✓ 2 commands found

❌ ci-babysitter
  ✗ plugin.json at root
  ✗ Path uses ../: "../skills/ci-babysitter/SKILL.md"

🎯 Issues Found: 2

Fix instructions:
  1. Move .claude-plugin/plugin.json to plugins/ci-babysitter/plugin.json
  2. Update path: "../skills/..." → "skills/..."
```

### Step 5: Offer Auto-Fix

If issues found, ask: "Should I fix these issues automatically?"

If yes:
- Move files to correct locations
- Update paths in JSON files
- Commit changes

## Common Issues & Fixes

### Issue: marketplace.json in subdirectory
**Fix:**
```bash
mv .claude-plugin/marketplace.json marketplace.json
```

### Issue: Names with spaces
**Fix:**
```bash
# In marketplace.json, change:
"name": "My Marketplace" → "name": "my-marketplace"
"name": "My Plugin" → "name": "my-plugin"
```

### Issue: Author/owner as string
**Fix:**
```bash
# Change:
"author": "Name"
# To:
"author": { "name": "Name", "url": "https://github.com/username" }
```

### Issue: Missing source field
**Fix:**
```bash
# Add to each plugin:
"source": {
  "type": "local",
  "path": "plugins/plugin-name"
}
```

### Issue: plugin.json in subdirectory
**Fix:**
```bash
cp plugins/my-plugin/.claude-plugin/plugin.json plugins/my-plugin/plugin.json
# Then update paths from "../" to relative from plugin root
```

### Issue: Paths with ../
**Fix:**
```bash
# In plugin.json, change:
"path": "../skills/my-skill/SKILL.md"
# To:
"path": "skills/my-skill/SKILL.md"
```

## Success Criteria

All checks pass:
- ✅ marketplace.json at root with valid schema
- ✅ All plugin.json files at plugin roots
- ✅ All paths relative and valid
- ✅ All referenced files exist
- ✅ Ready to push to GitHub

## Output Format

Always provide:
1. **Summary**: Total issues found
2. **Details**: Each issue with location
3. **Fix**: Exact commands to fix each issue
4. **Verification**: How to verify after fixing

Be precise, actionable, and save the user time.
