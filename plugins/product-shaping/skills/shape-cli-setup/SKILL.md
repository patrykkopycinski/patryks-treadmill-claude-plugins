---
name: shape-cli-setup
description: >
  Invoke this skill when the user asks how to INSTALL or SET UP the product-shaping
  plugin for the first time — adding skills to Claude Code, Cursor, GitHub Copilot,
  Codex CLI, or another AI tool. Covers first-time installation, updating skills,
  verifying the setup, and configuring for the user's specific tool. Excludes: daily
  usage questions (use shape-cli-guide instead), writing product artifacts, and
  general programming help.
---

# Shape CLI Setup — First-Time Installation

This skill installs the `product-shaping` plugin on the user's machine. The core principle is simple: **the README is the single source of truth**. The plugin evolves — skills get added, directory conventions change, new AI tools get supported. Rather than hardcoding any of that here, this skill tells you *how to work*, and the README tells you *what to do*.

## Step 1: Check if the plugin is already installed

Before anything else, check the current state silently. Do not print raw command output to the user.

```bash
ls -d ~/.claude/skills/shape-idea 2>/dev/null && echo "CLADE_CODE_INSTALLED" || echo "NOT_INSTALLED"
ls -d ~/.cursor/skills/shape-idea 2>/dev/null && echo "CURSOR_INSTALLED" || echo "NOT_INSTALLED"
ls -d ~/.github/skills/shape-idea 2>/dev/null && echo "COPILOT_INSTALLED" || echo "NOT_INSTALLED"
ls -d ~/.agents/skills/shape-idea 2>/dev/null && echo "CODEX_INSTALLED" || echo "NOT_INSTALLED"
```

If any of those directories exist, the plugin is already installed for that tool. Ask the user if they want to update, add support for another tool, or troubleshoot.

If none are found, proceed to Step 2.

## Step 2: Detect the user's AI tool

```bash
echo "$OSTYPE" 2>/dev/null || echo "win32"
```

Use the result to tailor path separators, shell syntax, and directory paths throughout your answers:

| OS | Shell | Home var | Skills path | Config path |
|----|-------|----------|-------------|-------------|
| macOS (`darwin*`) | zsh / bash | `$HOME` | `~/.claude/skills/` | `~/.claude/` |
| Linux (`linux-gnu*`) | bash / zsh | `$HOME` | `~/.claude/skills/` | `~/.claude/` |
| Windows (`win32` / MSYS / Git Bash) | PowerShell / cmd | `%USERPROFILE%` | `%USERPROFILE%\.claude\skills\` | `%USERPROFILE%\.claude\` |

Also ask the user which AI tool they use if unclear:
- **Claude Code** → `~/.claude/skills/`
- **Cursor** → `~/.cursor/skills/` (or `.cursor/rules/` for rule files)
- **GitHub Copilot** → `~/.github/skills/`
- **Codex CLI / Generic OpenAI agent** → `~/.agents/skills/`
- **Other / unsure** → `~/.ai/skills/`

## Step 3: Fetch the latest README

Retrieve the current README from GitHub — this is the authoritative source for install steps, prerequisites, supported tools, and any recent changes:

```
URL: https://raw.githubusercontent.com/patrykkopycinski/patryks-treadmill-claude-plugins/refs/heads/main/plugins/product-shaping/README.md
```

Use WebFetch or `curl -sL` to get it. If the fetch fails, tell the user and stop — don't guess at install steps from memory, because they may be outdated.

## Step 4: Build a plan from the README and execute it

Read the fetched README and construct a step-by-step setup plan from it. The README contains everything needed: prerequisites, install methods, tool-specific configuration, and verification steps. Your job is to translate the README into actionable steps for the user's specific situation.

The general flow is:

1. **Prerequisites** — whatever the README says is required (Git, a supported AI tool, etc.). Check each one and stop if something is missing.
2. **Install** — copy or symlink the `plugins/product-shaping/skills/` directory into the user's tool-specific skills directory. Verify it worked by listing the installed skills.
3. **Verify** — the README lists a diagnostic command or expected artifact. Run it and review the output with the user.
4. **Explore** — show the user how to run the first skill (`/shape-workflow-guide` or `/shape-idea`).

Do not hardcode specific version numbers, directory paths, or tool names — read them from the README. This way the skill stays correct even when the plugin changes.

## Important principles

- **README over memory.** If you think you know a path or requirement, but the fetched README says something different, follow the README. Always.
- **Check before installing.** Step 1 exists for a reason — don't reinstall what's already there.
- **Be interactive.** Confirm with the user before creating directories or copying files. Ask before modifying their home directory.
- **Diagnose before fixing.** If something fails, read the error and the README's guidance before suggesting a fix. Don't just retry blindly.
- **Stay focused on end-user setup.** This skill is about installing and configuring the published plugin, not about developing or contributing to the plugin source code.
