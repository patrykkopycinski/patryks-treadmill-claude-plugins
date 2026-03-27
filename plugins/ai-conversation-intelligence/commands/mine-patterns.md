---
name: mine-patterns
description: Analyze AI conversation history for patterns that should become skills, agents, hooks, or memory entries
arguments:
  - name: scope
    description: "Scope of analysis: 'queued' (pending sessions), 'all' (full sweep), 'recent' (last 7 days)"
    required: false
    default: "queued"
  - name: source
    description: "Filter by source: 'claude', 'cursor', or 'all'"
    required: false
    default: "all"
---

Invoke the `mine-patterns` skill with the provided scope and source filters.

If scope is "queued", check `~/.claude/chat-browser/analysis-queue.jsonl` for pending sessions first.
If scope is "all", run a full bulk sweep across all indexed conversations.
If scope is "recent", filter to sessions from the last 7 days.
