# session-safety-hooks

Production-grade safety hooks for Claude Code sessions. Blocks dangerous commands before they run, detects secrets before they land in source files, creates automatic backups before every write, maintains a full audit trail, and manages session lifecycle cleanly across compactions and restarts.

All hooks use `$HOME`-based paths — no hardcoded user directories.

## Hooks

| Hook Script | Event | Matcher | What It Does |
|---|---|---|---|
| `guard-bash.sh` | `PreToolUse` | `Bash` | **Hard-blocks** catastrophic commands (`rm -rf /`, `git push --force`, `git reset --hard`, `git clean -f`, `chmod 777`, `dd` to devices, fork bombs). **Soft-blocks** risky patterns (`curl \| bash`, `eval $VAR`, `wget --post-file`). Logs all `rm` usage. Reads `~/.claude/memory/knowledge/safety_rules.md` for learned patterns. |
| `secret-guard.sh` | `PreToolUse` | `Write\|Edit\|NotebookEdit` | Scans content being written for API keys, tokens, and secrets (Stripe, GitHub, AWS, Slack, JWT). Blocks writes to non-`.env` files. |
| `backup-before-write.sh` | `PreToolUse` (async) | `Write\|Edit\|NotebookEdit` | Creates a timestamped backup of the target file in `~/.claude/backups/YYYY-MM-DD/` before every write. Auto-prunes backups older than 7 days. |
| `log-changes.sh` | `PostToolUse` (async) | `Write\|Edit\|NotebookEdit` | Appends every file write/edit to `~/.claude/logs/audit-trail.md` with timestamp and tool name. |
| `log-failures.sh` | `PostToolUseFailure` (async) | `*` | Categorizes tool failures (BUILD, API, FILESYSTEM, NETWORK, PERMISSION) and logs to `~/.claude/logs/failure-log.md` and `incident-log.md`. |
| `log-stop-verdict.sh` | `Stop` | — | Receives the haiku quality verdict JSON, writes it to `verdicts.jsonl`, logs to the daily work log, and nominates learnings for the memory system. |
| `track-usage.sh` | `Stop` (async) | — | Records session stats to `usage.jsonl`: duration (minutes), tool count, files changed. Appends a summary line to the daily log. Writes weekly/monthly aggregate totals on Sundays and end-of-month. |
| `backup-settings.sh` | `SessionEnd` (async) | — | Backs up `settings.json` (with md5 change detection, skips if unchanged) and `agents/` to `~/.claude/backups/settings/`. Rotates to keep max 30 daily backups. Logs the backup event to `audit-trail.md`. |
| `session-reset.sh` | `SessionStart` | `user` | On fresh session start: clears stale gate files, resets session-volatile JSONL files, validates hook executability, and prunes oversized logs (audit trail >5000 lines, failure log >1000 lines, daily logs older than 14 days). |
| `pre-compact-handoff.sh` | `PreCompact` | `auto` | Writes a compaction marker file before auto-compaction so the resume hook can detect it. |
| `post-compact-resume.sh` | `SessionStart` | `compact` | Detects the compaction marker, cleans up stale state, and injects resumption instructions into Claude's context so it reloads memory and continues seamlessly. |

## Installation

```
/plugin install session-safety-hooks@patryks-treadmill
```

Or via the marketplace advisor:

```
/marketplace-advisor
```

## What Gets Logged

All logs are written to `~/.claude/logs/`:

- `audit-trail.md` — every Write/Edit operation with timestamp
- `failure-log.md` — categorized tool failures
- `incident-log.md` — security blocks, critical failures, compaction events
- `verdicts.jsonl` — per-session quality scores (JSONL for trend analysis)
- `usage.jsonl` — per-session usage stats: duration, tool count, files changed (JSONL for trend analysis)
- `daily-YYYY-MM-DD.md` — daily work summary (includes usage stats and periodic aggregates)

Backups land in `~/.claude/backups/YYYY-MM-DD/` with `filename.HHMMSS.bak` naming.

## Requirements

- `jq` — used by guard-bash, secret-guard, log-stop-verdict, track-usage
- `rsync` — used by backup-settings (agents/ directory sync)
- Standard Unix tools: `bash`, `grep`, `find`, `cp`, `chmod`, `wc`, `sed`, `date`, `shasum`

No external dependencies, no network calls, no LLM usage (except the haiku Stop prompt which is part of the Stop event flow).

## Portability

All paths are constructed from `$HOME` at runtime. The hooks work on any machine where Claude Code is installed regardless of username or home directory location.
