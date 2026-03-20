#!/bin/bash
# Install all Kibana Agent Superpowers to ~/.agents/skills

set -e

INSTALL_DIR="${HOME}/.agents/skills"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📦 Installing Kibana Agent Superpowers..."
echo "Source: $REPO_DIR"
echo "Target: $INSTALL_DIR"
echo ""

# Create directory if doesn't exist
mkdir -p "$INSTALL_DIR"

# Copy each skill
cd "$REPO_DIR/skills"
skill_count=0
for skill_dir in */; do
  skill_name="${skill_dir%/}"
  echo "📥 Installing $skill_name..."
  cp -r "$skill_dir" "$INSTALL_DIR/"
  ((skill_count++))
done

echo ""
echo "✅ Installation complete! Installed $skill_count agents."
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: $REPO_DIR/docs/QUICK_START.md"
echo "  - Master Guide: $REPO_DIR/docs/MASTER_USAGE_GUIDE.md"
echo "  - Integration Workflows: $REPO_DIR/docs/INTEGRATION_WORKFLOWS.md"
echo ""
echo "🎯 Try your first agent:"
echo '  Just say: "Fix type errors" → @type-healer activates!'
echo ""
echo "📖 Available agents:"
ls -1 "$REPO_DIR/skills" | sed 's/^/  - /'
echo ""
echo "🎉 Happy automating!"
