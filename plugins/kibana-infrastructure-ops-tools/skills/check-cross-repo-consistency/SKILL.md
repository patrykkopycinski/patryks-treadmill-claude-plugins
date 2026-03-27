---
name: check-cross-repo-consistency
description: Check elastic-cursor-plugin and cursor-plugin-evals for Docker versions, npm dependencies, and YAML convention drift
---

# Cross-Repo Consistency Checker

Ensures elastic-cursor-plugin and cursor-plugin-evals stay in sync for shared dependencies and conventions.

## What to Check

### 1. Docker Image Versions
Docker images should use identical versions across both repos.

**Check locations:**
- `Dockerfile`
- `.github/workflows/*.yml` (service containers)
- `docker-compose.yml` / `docker-compose.yaml`
- CI configuration files

**Common images to verify:**
- `node:*`
- `elasticsearch:*`
- `kibana:*`
- `postgres:*`
- `redis:*`

### 2. NPM Dependencies
Core dependencies should be aligned (not necessarily identical, but major versions should match).

**Check locations:**
- `package.json` (dependencies, devDependencies)
- `package-lock.json` (resolved versions)

**Critical dependencies:**
- `typescript`
- Testing frameworks (`jest`, `playwright`, `vitest`)
- Build tools (`@swc/core`, `esbuild`, `vite`)
- Linters/formatters (`eslint`, `prettier`)

### 3. YAML Conventions
Consistent formatting and structure for CI/CD configs.

**Check locations:**
- `.github/workflows/*.yml`
- GitHub Actions versions (`actions/checkout@v*`, `actions/setup-node@v*`)

### 4. Configuration Files
- `.nvmrc` / `.node-version` (Node.js versions)
- `.prettierrc` / `prettier.config.js`
- `tsconfig.json` (compiler options, especially `strict`, `target`, `module`)

## Execution Steps

### Step 1: Locate Repositories
```bash
# Find repos (common locations)
REPO1="/Users/patrykkopycinski/Projects/elastic-cursor-plugin"
REPO2="/Users/patrykkopycinski/Projects/cursor-plugin-evals"

# Verify they exist
if [ ! -d "$REPO1" ]; then
  echo "❌ elastic-cursor-plugin not found at expected location"
  echo "Please provide the correct path."
  exit 1
fi

if [ ! -d "$REPO2" ]; then
  echo "❌ cursor-plugin-evals not found at expected location"
  echo "Please provide the correct path."
  exit 1
fi
```

### Step 2: Docker Version Check
```bash
echo "=== Docker Image Versions ==="

# Extract Docker image versions from Dockerfiles and workflows
echo "## elastic-cursor-plugin:"
grep -rh "FROM.*:" "$REPO1" --include="Dockerfile*" --include="*.yml" --include="*.yaml" 2>/dev/null | sort -u

echo ""
echo "## cursor-plugin-evals:"
grep -rh "FROM.*:" "$REPO2" --include="Dockerfile*" --include="*.yml" --include="*.yaml" 2>/dev/null | sort -u
```

### Step 3: NPM Dependency Check
```bash
echo ""
echo "=== Node & NPM Versions ==="

# Node version
echo "## elastic-cursor-plugin:"
[ -f "$REPO1/.nvmrc" ] && echo "Node: $(cat "$REPO1/.nvmrc")"
[ -f "$REPO1/.node-version" ] && echo "Node: $(cat "$REPO1/.node-version")"

echo ""
echo "## cursor-plugin-evals:"
[ -f "$REPO2/.nvmrc" ] && echo "Node: $(cat "$REPO2/.nvmrc")"
[ -f "$REPO2/.node-version" ] && echo "Node: $(cat "$REPO2/.node-version")"

echo ""
echo "=== Critical NPM Dependencies ==="

# Check key dependencies
DEPS=("typescript" "jest" "playwright" "eslint" "prettier" "@swc/core")

for dep in "${DEPS[@]}"; do
  echo ""
  echo "## $dep:"
  echo "elastic-cursor-plugin: $(jq -r ".dependencies[\"$dep\"] // .devDependencies[\"$dep\"] // \"not found\"" "$REPO1/package.json" 2>/dev/null)"
  echo "cursor-plugin-evals: $(jq -r ".dependencies[\"$dep\"] // .devDependencies[\"$dep\"] // \"not found\"" "$REPO2/package.json" 2>/dev/null)"
done
```

### Step 4: GitHub Actions Versions
```bash
echo ""
echo "=== GitHub Actions Versions ==="

echo "## elastic-cursor-plugin:"
grep -rh "uses:.*@v" "$REPO1/.github/workflows" 2>/dev/null | sed 's/.*uses: *//' | sort -u

echo ""
echo "## cursor-plugin-evals:"
grep -rh "uses:.*@v" "$REPO2/.github/workflows" 2>/dev/null | sed 's/.*uses: *//' | sort -u
```

### Step 5: Report Drift
After collecting data, analyze for drift:

```markdown
# Drift Report

## 🔴 Critical Drift (Major version mismatch)
- [List any major version differences that break compatibility]

## 🟡 Minor Drift (Patch/minor version differences)
- [List non-breaking version differences that should be aligned]

## ✅ In Sync
- [List what's properly aligned]

## 📋 Action Items
1. [Specific update commands for each drift item]
2. [PRs to create]
```

## Output Format

Present findings as a structured report with:
1. **Summary** - Quick overview of drift severity
2. **Details** - Line-by-line comparison for each category
3. **Action Items** - Specific commands to fix drift
4. **Risk Assessment** - Impact if drift is left unaddressed

## When to Run

- **Before making version changes** - Check current state
- **After updating deps in one repo** - Verify other repo
- **Weekly (automated)** - Catch drift early

## Automation

Add to weekly routine:
```bash
/loop 7d /check-cross-repo-consistency
```

Or create a hook:
```yaml
event: PostToolUse
tool: Bash
condition: |
  ${TOOL_ARGS} contains "package.json" OR
  ${TOOL_ARGS} contains "Dockerfile" OR
  ${TOOL_ARGS} contains ".github/workflows"
prompt: |
  A dependency file was modified. Run /check-cross-repo-consistency
  to check if the same change should be applied to the other repo.
```
