---
name: shape-cli-guide
description: >
  Invoke this skill when the user asks how to USE the product-shaping plugin
  day-to-day — which /shape-* command to run next, where artifacts land, how to
  switch between greenfield and brownfield workflows, troubleshooting errors, or
  working on a specific OS (Windows, Linux, macOS). Covers all /shape-* slash
  commands, artifact locations, pipeline stages, common errors, and platform-specific
  tips. Excludes: first-time installation (use shape-cli-setup instead), developing
  or contributing to the plugin source code, and general programming help.
---

# Shape CLI Daily Usage Guide

This skill helps users work with the `product-shaping` plugin after it is already installed. If the user has not installed the plugin yet, hand off to the **shape-cli-setup** skill instead.

## Step 1: Detect the user's environment

Before giving any guidance, gather context silently — run these checks and remember the results. Do not print raw output to the user.

### Operating system

```bash
echo "$OSTYPE" 2>/dev/null || echo "win32"
```

Use the result to tailor path separators, shell syntax, and clipboard commands throughout your answers:

| OS | Shell | Home var | Clipboard | Temp dir |
|----|-------|----------|-----------|----------|
| macOS (`darwin*`) | zsh / bash | `$HOME` | `pbcopy` | `$TMPDIR` |
| Linux (`linux-gnu*`) | bash / zsh | `$HOME` | `xclip -selection clipboard` or `xsel --clipboard` | `/tmp` |
| Windows (`win32` / MSYS / Git Bash) | PowerShell / cmd | `%USERPROFILE%` | `clip.exe` | `%TEMP%` |

### Active AI tool

Check which skills directory exists to infer the active AI tool:

```bash
ls -d ~/.claude/skills/shape-idea 2>/dev/null && echo "claude-code"
ls -d ~/.cursor/skills/shape-idea 2>/dev/null && echo "cursor"
ls -d ~/.github/skills/shape-idea 2>/dev/null && echo "copilot"
ls -d ~/.agents/skills/shape-idea 2>/dev/null && echo "codex"
ls -d ~/.ai/skills/shape-idea 2>/dev/null && echo "generic"
```

### Plugin presence

```bash
ls -d ~/.claude/skills/shape-idea 2>/dev/null || ls -d ~/.cursor/skills/shape-idea 2>/dev/null || echo "NOT_FOUND"
```

If the plugin is not found, redirect to **shape-cli-setup**.

## Step 2: Answer the user's question using the reference below

Use the environment context from Step 1 to personalize every answer. Always use the OS-appropriate shell syntax, paths, and commands. Never show macOS-specific commands to a Windows user or vice versa.

---

## Command Reference

### `/shape-workflow-guide` — Where do I start?

The recommended first command. It asks 1-2 orienting questions (greenfield vs brownfield, idea vs existing codebase) and names the exact next `/shape-*` command to run.

### Greenfield pipeline (starting from scratch)

```
/shape-idea          →  context/foundation/shape-notes.md
      ↓
/shape-prd           →  context/foundation/prd.md
      ↓
/shape-tech-stack    →  context/foundation/tech-stack.md
      ↓
/shape-bootstrap     →  scaffolded project in cwd
      ↓
/shape-agents-md     →  AGENTS.md in cwd
```

### Brownfield pipeline (existing project)

```
/shape-idea          →  context/foundation/shape-notes.md
      ↓
/shape-prd           →  context/foundation/prd.md
      ↓
/shape-stack-assess  →  context/foundation/stack-assessment.md
      ↓
/shape-health-check  →  context/foundation/health-check.md
      ↓
/shape-agents-md     →  AGENTS.md in cwd
```

### Lifecycle pipeline (per-change execution)

```
/shape-roadmap       →  context/foundation/roadmap.md
      ↓
/shape-new <id>      →  context/changes/<change-id>/
      ↓
/shape-frame         →  context/changes/<change-id>/design/frame.md
      ↓
/shape-research      →  context/changes/<change-id>/research/
      ↓
/shape-plan          →  context/changes/<change-id>/plan.md
      ↓
/shape-plan-review   →  review report
      ↓
/shape-implement     →  implemented code + updated plan.md Progress
      ↓
/shape-impl-review   →  review report
      ↓
/shape-archive       →  context/archive/<date>-<change-id>/
```

### Auxiliary commands (can run anytime)

```
/shape-infra-research    →  deployment platform research
/shape-rule-review       →  audit existing AI rules
/shape-lesson            →  capture a learning or pattern
/shape-init              →  scaffold context/ directory explicitly
```

---

## Artifact Locations

All `product-shaping` artifacts are written under `context/` in the project's main repo root (worktree-aware). The exact paths:

| Skill | Output path | Type |
|-------|-------------|------|
| `/shape-idea` | `context/foundation/shape-notes.md` | Markdown notes |
| `/shape-prd` | `context/foundation/prd.md` | Markdown PRD |
| `/shape-tech-stack` | `context/foundation/tech-stack.md` | Markdown spec |
| `/shape-stack-assess` | `context/foundation/stack-assessment.md` | Markdown report |
| `/shape-health-check` | `context/foundation/health-check.md` | Markdown report |
| `/shape-agents-md` | `AGENTS.md` (in cwd) | Markdown instructions |
| `/shape-roadmap` | `context/foundation/roadmap.md` | Markdown plan |
| `/shape-new` | `context/changes/<change-id>/change.md` | Markdown tracking |
| `/shape-frame` | `context/changes/<change-id>/design/frame.md` | Markdown brief |
| `/shape-research` | `context/changes/<change-id>/research/` | Markdown + data |
| `/shape-plan` | `context/changes/<change-id>/plan.md` | Markdown plan |
| `/shape-plan-review` | conversation output only | Review report |
| `/shape-implement` | code in cwd + updated `plan.md` | Source files |
| `/shape-impl-review` | conversation output only | Review report |
| `/shape-archive` | `context/archive/<date>-<change-id>/` | Archived folder |

None of these are committed to git by default. `context/` is excluded via `git info/exclude` automatically.

---

## Switching Workflows

To switch from greenfield to brownfield (or vice versa), simply run `/shape-workflow-guide` and answer the orienting questions differently. The pipeline adapts automatically — there is no config file to edit.

To switch AI tools (e.g., from Claude Code to Cursor):

1. Copy or symlink the `product-shaping/skills/` directory into the new tool's skills folder.
2. Verify the skills appear in the new tool's command palette.
3. `context/` stays in the same repo root regardless of tool — no migration needed.

---

## Platform-Specific Tips

### Windows

- **Use PowerShell** (not cmd.exe). ANSI colors and Unicode symbols render correctly in Windows Terminal + PowerShell but may garble in legacy cmd.
- **Clipboard**: Skills that copy to clipboard use `clip.exe` on Windows. If a skill outputs a clipboard command, it will fall back silently if `clip.exe` is unavailable.
- **Path separators**: Forward slashes in command output (like `context/changes/my-change/`) work fine on Windows in most modern shells.

### Linux

- **Clipboard**: Skills use `xclip -selection clipboard` or `xsel --clipboard`. If neither is installed, clipboard operations fail silently. Install with `sudo apt install xclip` (Debian/Ubuntu) or `sudo dnf install xclip` (Fedora).
- **Config location**: `~/.config/` or `$XDG_CONFIG_HOME` if set.

### macOS

- **Clipboard**: Skills use `pbcopy` — works out of the box.
- **Config location**: `~/.claude/` (or tool-specific equivalent).

---

## Troubleshooting

When the user reports a problem, follow this sequence:

### 1. Run context diagnostics first

```bash
# Check if context/ exists and where it is anchored
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
  CONTEXT_ROOT="$(dirname "$(cd "$GIT_COMMON_DIR" && pwd)")"
  echo "Context root: $CONTEXT_ROOT"
  ls -la "$CONTEXT_ROOT/context/" 2>/dev/null || echo "context/ not found"
else
  echo "Not inside a git repo — context/ would be at $(pwd)/context/"
fi
```

This catches the most common issues: wrong directory, missing context/, or plugin not installed.

### 2. Common problems and fixes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| "context/ not found" | First run — context not initialized | Run `/shape-init` or any `/shape-*` command; it self-bootstraps |
| `git status` shows `context/` files | Git exclude not applied | Check `$(git rev-parse --git-common-dir)/info/exclude` for `context/` line |
| `context/` missing from worktree B but present in A | Context anchored to wrong repo | Ensure both worktrees belong to the same repo; run diagnostics above |
| `/shape-*` command not found | Plugin not installed for this AI tool | Run `/shape-cli-setup` or copy skills to the correct directory |
| `permission denied` writing files | Directory not writable | Check directory permissions; on POSIX: `chmod u+w <dir>` |

### 3. Nuclear reset

If the context directory is corrupted or you want a clean slate:

On macOS/Linux:
```bash
rm -rf "$(git rev-parse --show-toplevel)/context"
# Then run /shape-init to re-scaffold
```

On Windows (PowerShell):
```powershell
Remove-Item -Recurse -Force "$(git rev-parse --show-toplevel)\context"
# Then run /shape-init to re-scaffold
```

This clears all shaping notes but leaves source code untouched. The next `/shape-init` recreates the skeleton.

---

## Important Principles

- **Answer with the user's OS and tool in mind.** Never show `pbcopy` to a Windows user. Never show `%APPDATA%` to a macOS user.
- **Run diagnostics before speculating.** The context-root check catches 80% of path-related issues.
- **Don't guess command behavior from memory.** If unsure about a skill's output or artifact location, fetch the latest README: `https://raw.githubusercontent.com/patrykkopycinski/patryks-treadmill-claude-plugins/refs/heads/main/plugins/product-shaping/README.md`
- **Distinguish plugin issues from project issues.** If a `/shape-*` command writes to the wrong place, it is a plugin setup question. If the user's code doesn't compile after `/shape-bootstrap`, it is a project question.
