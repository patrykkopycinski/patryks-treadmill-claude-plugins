#!/usr/bin/env bash
# Check which treadmill plugins are installed in ~/.claude/plugins.
# Usage: scripts/plugin-status.sh [--install-missing]

set -uo pipefail

INSTALL=""
[[ "${1:-}" == "--install-missing" ]] && INSTALL=1

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PLUGINS_DIR="$HOME/.claude/plugins"

echo "=== Treadmill Plugin Status ==="
echo ""

for plugin_dir in "$REPO"/plugins/*/; do
  [[ -d "$plugin_dir" ]] || continue
  name=$(basename "$plugin_dir")
  target="$PLUGINS_DIR/$name"

  if [[ -L "$target" ]] || [[ -d "$target" ]]; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name (not installed)"
    if [[ -n "$INSTALL" ]]; then
      ln -sf "$plugin_dir" "$target"
      echo "    → installed symlink"
    fi
  fi
done
