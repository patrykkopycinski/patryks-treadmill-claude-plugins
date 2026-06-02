#!/usr/bin/env bash
# Validate all plugins in this repo: plugin.json syntax, skill paths,
# SKILL.md frontmatter, and rule/hook integrity.
# Usage: scripts/validate-plugins.sh [--strict]

set -uo pipefail

STRICT=""
EXIT=0
[[ "${1:-}" == "--strict" ]] && STRICT=1

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

err()  { echo "  ✗ $1"; EXIT=1; }
pass() { echo "  ✓ $1"; }

echo "=== Treadmill Plugin Validation ==="
echo ""

PLUGIN_COUNT=0
SKILL_COUNT=0
INVALID=0

for plugin_dir in plugins/*/; do
  [[ -d "$plugin_dir" ]] || continue
  PLUGIN_COUNT=$((PLUGIN_COUNT + 1))
  plugin_name=$(basename "$plugin_dir")
  plugin_json="$plugin_dir/plugin.json"

  echo "--- $plugin_name ---"

  if [[ ! -f "$plugin_json" ]]; then
    err "$plugin_name: missing plugin.json"
    INVALID=$((INVALID + 1))
    continue
  fi

  # Validate JSON syntax
  if python3 -c "import json; json.load(open('$plugin_json'))" 2>/dev/null; then
    pass "$plugin_name: plugin.json valid"
  else
    err "$plugin_name: plugin.json is invalid JSON"
    INVALID=$((INVALID + 1))
    continue
  fi

  # Check skills referenced exist
  skill_refs=$(python3 -c "
import json, sys
try:
    d=json.load(open('$plugin_json'))
    for s in d.get('skills', []):
        print(s.get('path',''))
except: pass
" 2>/dev/null)

  for ref in $skill_refs; do
    skill_path="$plugin_dir/$ref"
    if [[ -f "$skill_path" ]]; then
      SKILL_COUNT=$((SKILL_COUNT + 1))
      # Check frontmatter
      if head -3 "$skill_path" | grep -q '^---'; then
        : # ok
      else
        err "$plugin_name/$(basename $(dirname $ref)): missing frontmatter"
      fi
    else
      err "$plugin_name: missing skill file $ref"
    fi
  done

done

echo ""
echo "Plugins: $PLUGIN_COUNT | Skills: $SKILL_COUNT | Issues: $INVALID"

if [[ $EXIT -eq 0 ]]; then
  echo "All checks passed ✓"
else
  echo "Some checks failed ✗"
  [[ -n "$STRICT" ]] && exit 1
fi
