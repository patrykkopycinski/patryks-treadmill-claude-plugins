---
name: cursor-chat-browser
description: >
  Search and retrieve past Cursor AI conversations across all workspaces. Use when the user asks to
  find a previous discussion, recall a past decision, check what was discussed before, look up prior
  implementations, or references "we talked about", "last time", "remember when", "previous conversation",
  "what did we decide". Also activates on "search conversations", "find chat", "past discussions",
  "conversation history".
---

# Cursor Chat Browser

Search and retrieve past Cursor AI conversations across all workspaces using the `cursor-chat-browser` MCP server.

## Prerequisites

The `cursor-chat-browser` MCP server must be configured in `~/.cursor/mcp.json`. It indexes conversations from
`~/.cursor/projects/*/agent-transcripts/` into a SQLite FTS5 search index at `~/.cursor/chat-browser/search-index.db`.

## Operations

### Search for past conversations

Use the `search_conversations` MCP tool to find conversations by keyword, function name, or concept:

```
MCP tool: cursor-chat-browser -> search_conversations
Arguments:
  query: "detection rules migration"     # keywords, function names, concepts
  workspace: "kibana"                     # optional: filter by project (partial match)
  limit: 10                               # optional: max results (default: 10)
```

The search uses full-text search with Porter stemming, so "migrating" matches "migration", "detect" matches "detection", etc.

### Retrieve a full conversation

After finding a relevant conversation via search, retrieve its full content:

```
MCP tool: cursor-chat-browser -> get_conversation
Arguments:
  id: "uuid-from-search-results"          # conversation UUID
  max_length: 10000                        # optional: truncate long conversations (default: 10000)
```

### Browse recent conversations

Get the most recent conversations, optionally filtered by workspace:

```
MCP tool: cursor-chat-browser -> recent_conversations
Arguments:
  workspace: "elastic-cursor-plugin"       # optional: filter by project
  limit: 10                                # optional: number of results (default: 10)
```

### List all workspaces

Discover which projects have indexed conversations:

```
MCP tool: cursor-chat-browser -> list_workspaces
```

### Reindex new conversations

If new conversations were created since the server started:

```
MCP tool: cursor-chat-browser -> reindex
```

## When to Use

| Scenario | What to Do |
|---|---|
| Starting a complex feature | Search for prior discussions about the same area |
| User says "we discussed this before" | Search for the referenced topic |
| Debugging a recurring issue | Search for past debugging sessions |
| Making an architectural decision | Search for previous architecture conversations |
| Working in unfamiliar codebase area | Browse recent conversations for that workspace |
| Onboarding to a project | List workspaces, then browse recent conversations |

## Guidelines

- **Search first, then retrieve**: Use `search_conversations` to find candidates, then `get_conversation` only for the most relevant 1-2 results. This avoids context bloat.
- **Be specific with queries**: "elasticsearch authentication API key rotation" is better than "auth".
- **Use workspace filters**: When you know the project, filter by workspace name to reduce noise.
- **Respect context limits**: Set `max_length` appropriately -- 10,000 chars is usually enough to understand the discussion without overwhelming the context window.
- **Skip for trivial tasks**: Don't search for past conversations when doing typo fixes, config changes, or single-file edits.
- **Combine with other context**: Past conversations complement -- don't replace -- reading the actual code, git history, and documentation.

## Examples

### "What approach did we use for the Cypress to Scout migration?"

```
search_conversations(query: "cypress scout migration approach", workspace: "kibana")
```

Then retrieve the top result:

```
get_conversation(id: "<result-id>", max_length: 15000)
```

### "What have I been working on recently?"

```
recent_conversations(workspace: "kibana", limit: 10)
```

### "Find where we discussed the skill authoring workflow"

```
search_conversations(query: "skill authoring workflow")
```

### "How many projects have conversation history?"

```
list_workspaces()
```
