#!/bin/bash
set -e

echo "📦 Installing Knowledge Base System for Claude Code..."
echo ""

# Check if Claude plugins directory exists
if [ ! -d "$HOME/.claude/plugins" ]; then
    echo "Creating ~/.claude/plugins directory..."
    mkdir -p "$HOME/.claude/plugins"
fi

# Clone repository
echo "Cloning repository..."
cd "$HOME/.claude/plugins"

if [ -d "claude-knowledge-base-system" ]; then
    echo "⚠️  Plugin already exists. Updating..."
    cd claude-knowledge-base-system
    git pull origin main
else
    git clone https://github.com/patrykkopycinski/claude-knowledge-base-system
    cd claude-knowledge-base-system
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Open Claude Code"
echo "2. Run: /setup-knowledge-base"
echo "3. Run: /setup-promotion-tracking (optional)"
echo ""
echo "Documentation:"
echo "- Quick Start: $HOME/.claude/plugins/claude-knowledge-base-system/QUICK-START.md"
echo "- Full Guide: $HOME/.claude/plugins/claude-knowledge-base-system/README.md"
echo ""
echo "🚀 Happy knowledge building!"
