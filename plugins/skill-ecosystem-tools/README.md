# skill-ecosystem-tools

Meta-tools for the Claude Code skill ecosystem: discover community skills, import from the SkillsMP marketplace, and validate plugin structure before publishing.

## Skills

| Skill | Description | When to Use |
|-------|-------------|-------------|
| `find-skills` | Search for and install skills from the open agent skills ecosystem via the `npx skills` CLI | When a user asks "is there a skill for X?" or wants to extend agent capabilities |
| `skillsmp-importer` | Search the SkillsMP marketplace (261k+ community skills) and import/adapt skills locally | When no installed skill covers the current task and a community skill would meaningfully help |
| `validate-claude-marketplace` | Validate Claude Code marketplace structure and schema before publishing | Before pushing marketplace changes to GitHub or submitting a plugin |

## Installation

### Via Claude Code Marketplace

```
/plugin marketplace
```

Search for `skill-ecosystem-tools` and install.

### Manual Installation

```bash
npx skills add patrykkopycinski/patryks-treadmill-claude-plugins@skill-ecosystem-tools
```

Or clone and install locally:

```bash
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins
cd patryks-treadmill-claude-plugins
# Follow local installation instructions for your Claude Code setup
```

## Skill Workflows

### find-skills

Triggers when you ask questions like "how do I do X", "find a skill for X", or express interest in extending capabilities. The skill searches the open agent skills ecosystem using `npx skills find [query]`, presents matching skills with install commands and links to skills.sh, and can install the chosen skill for you with `npx skills add <package> -g -y`.

### skillsmp-importer

Activates proactively when you encounter a task where no installed skill provides the needed domain expertise, or explicitly when you ask to find, search, or import a skill. It searches the SkillsMP marketplace using the `skillsmp` MCP server (keyword search or AI semantic search), evaluates candidates against relevance/quality/safety/compatibility gates, fetches the SKILL.md from GitHub, adapts it for local use, and writes it to `~/.cursor/skills/`.

### validate-claude-marketplace

Runs a structured validation of your Claude Code marketplace repository before publishing. It checks that `marketplace.json` is at the repo root with correct schema (kebab-case names, owner/author as objects, source fields), verifies each `plugin.json` is at the plugin root with relative paths that point to existing files, and generates a report with exact fix commands for any issues found. Offers to auto-fix detected problems.
