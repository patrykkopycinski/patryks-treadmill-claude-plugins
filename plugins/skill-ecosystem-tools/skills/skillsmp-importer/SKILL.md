---
name: skillsmp-importer
description: Automatically search and import community skills from skillsmp.com when the current skill set cannot accomplish the task. Use proactively when facing a task that no existing skill covers, when the user asks to find or import a skill, or when a specialized workflow (e.g., SEO, PDF processing, database migration, Kubernetes, Terraform) would benefit from community expertise. Also triggers on "find a skill", "import skill", "skillsmp", "marketplace skill".
---

# SkillsMP Skill Importer

Search the SkillsMP marketplace (261k+ community skills) and import/recreate skills locally when the current skill set is insufficient for the task at hand.

## When to Activate

1. **Proactive**: You encounter a task where no installed skill provides domain expertise, AND a community skill would meaningfully improve quality (not just marginally)
2. **Explicit**: User asks you to find, search, or import a skill
3. **Skip if**: Base knowledge + existing skills already handle the task well

## Search Strategy

Use the methods below in priority order. Stop at the first one that works.

### Method 1: SkillsMP MCP Server (skillsmp-mcp-lite)

The `skillsmp` MCP server is configured in `~/.cursor/mcp.json`. Use its tools directly:

**Keyword search** (1–3 words, fast):
```
CallMcpTool: skillsmp / skillsmp_search_skills
{ "query": "playwright testing", "limit": 10 }
```

**AI semantic search** (natural language, powered by Cloudflare AI):
```
CallMcpTool: skillsmp / skillsmp_ai_search_skills
{ "query": "how to debug flaky Playwright tests in CI" }
```

**Read a skill** (fetches SKILL.md + runs security scan):
```
CallMcpTool: skillsmp / skillsmp_read_skill
{ "repo": "<owner>/<repo>", "skillName": "<skill-name>", "enableScan": true }
```

Parameters for `skillsmp_search_skills`:
- `query` (string, required) — search keywords (max 200 chars)
- `page` (number, optional) — page number (default: 1)
- `limit` (number, optional) — items per page (default: 20, max: 100)
- `sortBy` (string, optional) — "stars" or "recent"

Parameters for `skillsmp_ai_search_skills`:
- `query` (string, required) — natural language description (max 500 chars)

Parameters for `skillsmp_read_skill`:
- `repo` (string, required) — GitHub repository as `owner/repo`
- `skillName` (string, required) — skill name (alphanumeric, hyphens, underscores, max 100 chars)
- `enableScan` (boolean, optional) — run Cisco Skill Scanner security analysis (default: true)

### Method 2: Web Search + GitHub Raw Fetch

Search the web for skills on SkillsMP:

```
WebSearch: "site:skillsmp.com <task-keywords> skill"
```

Each skill on SkillsMP links to a GitHub repo. The URL pattern is:
`skillsmp.com/skills/<owner>-<repo>-<path-segments>-skill-md`

Once you identify the GitHub repo and path, fetch the raw SKILL.md:

```
WebFetch: https://raw.githubusercontent.com/<owner>/<repo>/main/<path>/SKILL.md
```

Common paths to try:
- `skills/<skill-name>/SKILL.md`
- `.claude/skills/<skill-name>/SKILL.md`
- `.cursor/skills/<skill-name>/SKILL.md`
- `SKILL.md` (root)

If the exact path is unknown, fetch the repo page and look for the skills directory:

```
WebFetch: https://github.com/<owner>/<repo>
```

### Method 3: Direct GitHub Search

```
WebSearch: "<task-keywords> SKILL.md github"
```

## Evaluation Criteria

Before importing, evaluate the skill against these gates:

| Gate | Check |
|------|-------|
| **Relevance** | Does it solve a problem my current skills cannot? |
| **Quality** | Does it have meaningful content (not a stub)? Repo has 2+ stars? |
| **Safety** | No suspicious scripts, no credential harvesting, no destructive commands? |
| **Compatibility** | Uses standard SKILL.md format? Works with Cursor? |
| **Size** | SKILL.md under 500 lines? (Trim if larger) |

If a skill fails any gate, skip it and try the next result.

## Import Process

### Step 1: Fetch the SKILL.md content

Use WebFetch on the raw GitHub URL.

### Step 2: Adapt for local use

Before writing the file:

- **Rewrite the frontmatter** `name` and `description` to match the local convention
- **Remove Claude Code-specific instructions** (e.g., `~/.claude/` paths, Bash tool references) and adapt for Cursor
- **Strip references to tools not available locally** unless they can be installed
- **Keep the core domain knowledge intact** — that's the valuable part
- **If the skill references companion files** (scripts, templates, references), fetch and include those too

### Step 3: Write to the global skills directory

```
Write: ~/.cursor/skills/<skill-name>/SKILL.md
```

Always use `~/.cursor/skills/` (global), never workspace-level, so the skill is available across all projects.

### Step 4: Acknowledge and apply

Tell the user what skill was imported, from which repo, and why. Then immediately read and follow the newly installed skill if it's relevant to the current task.

## Search Query Tips

- Be specific: "playwright test debugging flaky" not just "testing"
- Include the technology: "kubernetes helm chart deployment"
- Describe the workflow: "code review with security focus"
- Use natural language for AI search: "How to optimize PostgreSQL queries"

## Anti-Patterns

- **Don't import skills you already have** — check existing skills first
- **Don't import for trivial tasks** — base knowledge is sufficient for simple operations
- **Don't import without reading** — always review content before writing to disk
- **Don't import massive skills blindly** — trim to essentials if over 500 lines
- **Don't import skills that only wrap a CLI tool** — just use the tool directly
