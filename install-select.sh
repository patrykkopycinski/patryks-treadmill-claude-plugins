#!/bin/bash
# Selective agent installer for Patryk's Treadmill

set -e

MARKETPLACE_DIR="$HOME/.claude/plugins/treadmill"
PLUGINS_DIR="$HOME/.claude/plugins"

echo "🏃 Patryk's Treadmill - Selective Agent Installer"
echo ""

# Clone marketplace if not exists
if [ ! -d "$MARKETPLACE_DIR" ]; then
    echo "📦 Cloning marketplace..."
    git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins "$MARKETPLACE_DIR"
    echo ""
fi

# List available agents
echo "📚 Available Agents:"
echo ""
AGENT_NUM=1
AGENTS=()

for agent_dir in "$MARKETPLACE_DIR"/plugins/*/; do
    if [ -d "$agent_dir" ]; then
        agent_name=$(basename "$agent_dir")
        AGENTS+=("$agent_name")

        # Check if already installed
        if [ -L "$PLUGINS_DIR/$agent_name" ] || [ -d "$PLUGINS_DIR/$agent_name" ]; then
            echo "  [$AGENT_NUM] $agent_name ✅ (installed)"
        else
            echo "  [$AGENT_NUM] $agent_name"
        fi
        AGENT_NUM=$((AGENT_NUM + 1))
    fi
done

echo ""
echo "💡 Installation Options:"
echo "  - Enter numbers (e.g., '1 3 5') to install specific agents"
echo "  - Enter 'all' to install all agents"
echo "  - Enter 'none' to skip installation"
echo ""
read -p "Select agents to install: " selection

if [ "$selection" = "none" ]; then
    echo "👋 No agents installed. You can run this script again later."
    exit 0
fi

if [ "$selection" = "all" ]; then
    # Install all agents
    for agent_name in "${AGENTS[@]}"; do
        if [ ! -L "$PLUGINS_DIR/$agent_name" ] && [ ! -d "$PLUGINS_DIR/$agent_name" ]; then
            ln -s "$MARKETPLACE_DIR/plugins/$agent_name" "$PLUGINS_DIR/$agent_name"
            echo "✅ Installed: $agent_name"
        fi
    done
else
    # Install selected agents
    for num in $selection; do
        if [ "$num" -gt 0 ] && [ "$num" -le "${#AGENTS[@]}" ]; then
            agent_name="${AGENTS[$((num - 1))]}"

            if [ ! -L "$PLUGINS_DIR/$agent_name" ] && [ ! -d "$PLUGINS_DIR/$agent_name" ]; then
                ln -s "$MARKETPLACE_DIR/plugins/$agent_name" "$PLUGINS_DIR/$agent_name"
                echo "✅ Installed: $agent_name"
            else
                echo "⚠️  Already installed: $agent_name"
            fi
        fi
    done
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Restart Claude Code (or reload plugins)"
echo "  2. Run /help to see available commands"
echo ""
echo "🔄 To install more agents later:"
echo "  bash $MARKETPLACE_DIR/install-select.sh"
