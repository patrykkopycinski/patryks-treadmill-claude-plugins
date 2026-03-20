# Release Notes Generator

## Purpose
Generate comprehensive release notes from git commits and PRs between releases.

## Capabilities
- Parse commits between two releases or tags
- Categorize changes: Features, Bug Fixes, Breaking Changes, Deprecations
- Extract PR descriptions and links
- Generate markdown release notes
- Highlight breaking changes prominently
- Create upgrade guides for major versions

## Triggers
- "generate release notes"
- "changelog for this release"
- "what changed between versions"
- "create upgrade guide"

## Implementation

### 1. Identify Release Range
```bash
# List recent tags/releases
git tag --sort=-creatordate | head -10

# Or use gh CLI
gh release list --limit 10

# Get commits between two releases
from_tag="v8.0.0"
to_tag="v8.1.0"
git log --oneline $from_tag..$to_tag

# Get commits since last release
last_tag=$(git describe --tags --abbrev=0)
git log --oneline $last_tag..HEAD

# Count commits
git rev-list --count $from_tag..$to_tag
```

### 2. Parse Commits and Extract PR Numbers
```bash
# Get commits with PR numbers
git log --format="%H|%s" $from_tag..$to_tag | grep -E "#[0-9]+"

# Extract PR numbers
git log --format="%s" $from_tag..$to_tag | \
  grep -oE "#[0-9]+" | \
  tr -d '#' | \
  sort -u

# Get commit messages without PR numbers (direct commits)
git log --format="%H|%s" $from_tag..$to_tag | grep -v -E "#[0-9]+"
```

### 3. Categorize Changes
Use conventional commit format to categorize:
- `feat:` → Features
- `fix:` → Bug Fixes
- `docs:` → Documentation
- `perf:` → Performance
- `refactor:` → Refactoring
- `test:` → Testing
- `chore:` → Maintenance
- `BREAKING:` or `!` → Breaking Changes

```bash
# Extract features
git log --format="%s" $from_tag..$to_tag | grep -E "^feat(\(.*\))?:"

# Extract bug fixes
git log --format="%s" $from_tag..$to_tag | grep -E "^fix(\(.*\))?:"

# Extract breaking changes (two patterns)
git log --format="%s" $from_tag..$to_tag | grep -E "^[a-z]+(\(.*\))?!:|BREAKING"

# Extract deprecations
git log --format="%s" $from_tag..$to_tag | grep -i "deprecat"
```

### 4. Fetch PR Details
```bash
# Get PR details for each PR number
pr_numbers=$(git log --format="%s" $from_tag..$to_tag | \
  grep -oE "#[0-9]+" | tr -d '#' | sort -u)

for pr in $pr_numbers; do
  echo "=== PR #$pr ==="
  gh pr view $pr --json title,body,labels,url | \
    jq -r '"Title: " + .title,
           "URL: " + .url,
           "Labels: " + ([.labels[].name] | join(", ")),
           "---",
           .body'
done
```

### 5. Generate Release Notes Structure
```markdown
# Release Notes: v8.1.0

**Release Date:** 2024-03-20

## Overview
[High-level summary of the release]

## 🚨 Breaking Changes
[Critical changes requiring user action]

## ✨ Features
[New capabilities and enhancements]

## 🐛 Bug Fixes
[Issues resolved]

## 📚 Documentation
[Documentation updates]

## ⚡ Performance
[Performance improvements]

## 🧪 Experimental
[Features behind feature flags]

## 🗑️ Deprecations
[Deprecated APIs and migration path]

## 📦 Dependency Updates
[Major dependency version bumps]

## 🙏 Contributors
[List of contributors]
```

### 6. Generate Markdown
```bash
#!/bin/bash

from_tag="v8.0.0"
to_tag="v8.1.0"
output_file="RELEASE_NOTES_${to_tag}.md"

cat > "$output_file" <<EOF
# Release Notes: $to_tag

**Release Date:** $(date +%Y-%m-%d)
**Previous Version:** $from_tag
**Commits:** $(git rev-list --count $from_tag..$to_tag)

## Overview
This release includes $(git rev-list --count $from_tag..$to_tag) commits from $(git shortlog -s $from_tag..$to_tag | wc -l) contributors.

EOF

# Breaking Changes
echo "## 🚨 Breaking Changes" >> "$output_file"
git log --format="- %s (%h)" $from_tag..$to_tag | \
  grep -E "^- [a-z]+(\(.*\))?!:|BREAKING" >> "$output_file" || \
  echo "No breaking changes." >> "$output_file"
echo "" >> "$output_file"

# Features
echo "## ✨ Features" >> "$output_file"
git log --format="- %s ([#%h](https://github.com/elastic/kibana/commit/%H))" \
  $from_tag..$to_tag | \
  grep -E "^- feat(\(.*\))?:" | \
  sed 's/^- feat[^:]*: /- /' >> "$output_file" || \
  echo "No new features." >> "$output_file"
echo "" >> "$output_file"

# Bug Fixes
echo "## 🐛 Bug Fixes" >> "$output_file"
git log --format="- %s ([#%h](https://github.com/elastic/kibana/commit/%H))" \
  $from_tag..$to_tag | \
  grep -E "^- fix(\(.*\))?:" | \
  sed 's/^- fix[^:]*: /- /' >> "$output_file" || \
  echo "No bug fixes." >> "$output_file"
echo "" >> "$output_file"

# Documentation
echo "## 📚 Documentation" >> "$output_file"
git log --format="- %s ([#%h](https://github.com/elastic/kibana/commit/%H))" \
  $from_tag..$to_tag | \
  grep -E "^- docs(\(.*\))?:" | \
  sed 's/^- docs[^:]*: /- /' >> "$output_file" || \
  echo "No documentation updates." >> "$output_file"
echo "" >> "$output_file"

# Contributors
echo "## 🙏 Contributors" >> "$output_file"
git shortlog -sn $from_tag..$to_tag | \
  sed 's/^[[:space:]]*[0-9]*[[:space:]]*/- /' >> "$output_file"
echo "" >> "$output_file"

echo "Release notes generated: $output_file"
```

### 7. Enhanced PR-Based Release Notes
```bash
#!/bin/bash
# Generate richer release notes by fetching PR details

from_tag="v8.0.0"
to_tag="v8.1.0"
output_file="RELEASE_NOTES_${to_tag}.md"

# Get PR numbers
pr_numbers=$(git log --format="%s" $from_tag..$to_tag | \
  grep -oE "#[0-9]+" | tr -d '#' | sort -u)

# Create associative arrays to group PRs by category
declare -A features=()
declare -A fixes=()
declare -A breaking=()
declare -A docs=()

# Fetch PR details and categorize
for pr in $pr_numbers; do
  pr_data=$(gh pr view $pr --json title,labels,url 2>/dev/null)
  if [ $? -eq 0 ]; then
    title=$(echo "$pr_data" | jq -r '.title')
    url=$(echo "$pr_data" | jq -r '.url')
    labels=$(echo "$pr_data" | jq -r '[.labels[].name] | join(",")')

    # Categorize based on title and labels
    if echo "$title" | grep -qi "breaking" || echo "$labels" | grep -qi "breaking"; then
      breaking[$pr]="$title|$url"
    elif echo "$title" | grep -qiE "^feat"; then
      features[$pr]="$title|$url"
    elif echo "$title" | grep -qiE "^fix"; then
      fixes[$pr]="$title|$url"
    elif echo "$title" | grep -qiE "^docs"; then
      docs[$pr]="$title|$url"
    fi
  fi
done

# Generate markdown
cat > "$output_file" <<EOF
# Release Notes: $to_tag

## 🚨 Breaking Changes

EOF

for pr in "${!breaking[@]}"; do
  IFS='|' read -r title url <<< "${breaking[$pr]}"
  echo "### $title" >> "$output_file"
  echo "PR: [#$pr]($url)" >> "$output_file"

  # Get PR body for migration guide
  body=$(gh pr view $pr --json body -q .body 2>/dev/null)
  if echo "$body" | grep -qi "migration"; then
    echo "" >> "$output_file"
    echo "$body" | sed -n '/[Mm]igration/,/^##/p' | head -20 >> "$output_file"
  fi
  echo "" >> "$output_file"
done

# Continue for other categories...
```

### 8. Generate Upgrade Guide (Breaking Changes)
```bash
#!/bin/bash
# Generate upgrade guide for major version changes

from_version="8.0"
to_version="9.0"

cat > "UPGRADE_GUIDE_v${to_version}.md" <<EOF
# Upgrade Guide: v${from_version} → v${to_version}

## Overview
This guide helps you migrate from Kibana ${from_version} to ${to_version}.

## Breaking Changes

EOF

# Find PRs with "breaking" label
gh pr list --label "breaking" --state merged --search "merged:>=$(git log -1 --format=%ai v${from_version}.0)" | \
  while read -r line; do
    pr_number=$(echo "$line" | awk '{print $1}')
    gh pr view "$pr_number" --json title,body,url | \
      jq -r '"### " + .title,
             "",
             "**PR:** " + .url,
             "",
             .body,
             "",
             "---",
             ""'
  done >> "UPGRADE_GUIDE_v${to_version}.md"

cat >> "UPGRADE_GUIDE_v${to_version}.md" <<EOF

## Deprecations
[APIs marked as deprecated in this release]

## New Requirements
[New system requirements, dependencies, etc.]

## Migration Checklist
- [ ] Review breaking changes above
- [ ] Update API calls to new signatures
- [ ] Test application with new version
- [ ] Update dependencies
- [ ] Review deprecation warnings

## Support
For questions or issues, contact:
- Slack: #kibana
- GitHub Issues: https://github.com/elastic/kibana/issues
EOF

echo "Upgrade guide generated: UPGRADE_GUIDE_v${to_version}.md"
```

### 9. Kibana-Specific Categorization
```bash
# Categorize by Kibana area/team
git log --format="%s" $from_tag..$to_tag | \
  grep -oE "\[([A-Za-z ]+)\]" | \
  sort | uniq -c | sort -rn

# Example output:
#   45 [Security Solution]
#   32 [Observability]
#   28 [Fleet]
#   15 [Platform]

# Group by area
areas=("Security Solution" "Observability" "Fleet" "Platform")

for area in "${areas[@]}"; do
  echo "## $area"
  git log --format="- %s" $from_tag..$to_tag | \
    grep "\[$area\]" | \
    sed "s/\[$area\] //"
  echo ""
done
```

## Example Workflow

### User: "generate release notes for v8.1.0"

**Step 1: Identify range**
```bash
from_tag="v8.0.0"
to_tag="v8.1.0"
commits=$(git rev-list --count $from_tag..$to_tag)
echo "Generating release notes for $commits commits"
```

**Step 2: Categorize commits**
```bash
features=$(git log --format="%s" $from_tag..$to_tag | grep -c "^feat")
fixes=$(git log --format="%s" $from_tag..$to_tag | grep -c "^fix")
breaking=$(git log --format="%s" $from_tag..$to_tag | grep -cE "!:|BREAKING")

echo "Found: $features features, $fixes fixes, $breaking breaking changes"
```

**Step 3: Extract PR numbers and fetch details**
```bash
pr_numbers=$(git log --format="%s" $from_tag..$to_tag | \
  grep -oE "#[0-9]+" | tr -d '#' | sort -u)
echo "Found $(echo $pr_numbers | wc -w) PRs"
```

**Step 4: Generate release notes**
```bash
bash generate_release_notes.sh v8.0.0 v8.1.0
# Output: RELEASE_NOTES_v8.1.0.md
```

**Step 5: Review and edit**
```
Generated release notes at RELEASE_NOTES_v8.1.0.md

Summary:
- 247 commits
- 42 features
- 31 bug fixes
- 3 breaking changes
- 28 contributors

Next steps:
1. Review RELEASE_NOTES_v8.1.0.md for accuracy
2. Add high-level overview section
3. Highlight key features
4. Review breaking changes for completeness
5. Publish to GitHub releases: gh release create v8.1.0 -F RELEASE_NOTES_v8.1.0.md
```

## Integration with Other Skills
- **pr-optimizer**: Ensure PRs have good descriptions for release notes
- **code-archaeology**: Understand context of significant changes
- **spike-builder**: Document new features in release notes

## Quality Principles
- Prioritize breaking changes (users need to act)
- Use user-facing language (not technical jargon)
- Link to PRs for detailed context
- Highlight upgrade impact (minor vs major)
- Include migration guides for breaking changes

## References
- Semantic Versioning: https://semver.org/
- Conventional Commits: https://www.conventionalcommits.org/
- Keep a Changelog: https://keepachangelog.com/
- Kibana releases: https://github.com/elastic/kibana/releases
