---
name: buildkite-ci-debugger
description: Debug and fix Buildkite CI failures by pulling ALL failure logs before attempting fixes. Use when CI is failing, build is red, tests are broken in Buildkite, or the user says "fix CI", "CI keeps failing", "debug build", or mentions Buildkite failures. Requires the Buildkite MCP server (user-buildkite-read-only-toolsets).
---

# Buildkite CI Debugger

Systematically debug CI failures using Buildkite MCP tools. **The cardinal rule: gather ALL failure context before writing a single line of fix code.**

## Prerequisites

- Buildkite MCP server: `user-buildkite-read-only-toolsets`
- All tool calls use `CallMcpTool` with `server: "user-buildkite-read-only-toolsets"`
- Parameters use `org_slug` (string), `pipeline_slug` (string), `build_number` (string), `job_id` (string)

## Phase 1: Identify the Build

Before touching logs, find the failing build.

### Option A: From a PR (most common)

```bash
# Get the PR number
gh pr list --repo <owner>/<repo> --head <branch-name> --json number --jq '.[0].number'

# Check CI status
gh pr checks <PR_NUMBER> --repo <owner>/<repo>
```

### Option B: From Buildkite directly

Use `list_builds` to find recent builds for the pipeline:

```json
CallMcpTool: user-buildkite-read-only-toolsets / list_builds
{ "org_slug": "<ORG>", "pipeline_slug": "<PIPELINE>", "branch": "<BRANCH>", "per_page": 5 }
```

### Option C: From a Buildkite URL

Extract org, pipeline, and build number from the URL:
`https://buildkite.com/<ORG>/<PIPELINE>/builds/<BUILD_NUMBER>`

## Phase 2: Get Build Overview

Fetch the build to see all jobs and their statuses:

```json
CallMcpTool: user-buildkite-read-only-toolsets / get_build
{ "org_slug": "<ORG>", "pipeline_slug": "<PIPELINE>", "build_number": "<BUILD>" }
```

From the response, extract:
- **All failed job IDs** — collect every job with `state: "failed"`
- **Job names** — to categorize failures (test jobs, lint jobs, type-check jobs, etc.)
- **Build commit** — to know what code is being tested

### Collect annotations (failure summaries)

```json
CallMcpTool: user-buildkite-read-only-toolsets / list_annotations
{ "org_slug": "<ORG>", "pipeline_slug": "<PIPELINE>", "build_number": "<BUILD>" }
```

Annotations often contain pre-formatted failure summaries with test names and error messages. Parse them first — they may give you all the failure info you need without reading raw logs.

## Phase 3: Pull Logs from ALL Failed Jobs

**DO NOT skip this step. DO NOT fix after reading only one job's logs.**

For each failed job, pull failure context in parallel when possible:

### Step 3a: Search for error patterns

```json
CallMcpTool: user-buildkite-read-only-toolsets / search_logs
{
  "org_slug": "<ORG>",
  "pipeline_slug": "<PIPELINE>",
  "build_number": "<BUILD>",
  "job_id": "<JOB_ID>",
  "pattern": "<PATTERN>",
  "context": 5,
  "limit": 30
}
```

**Search patterns by failure type:**

| Category | Pattern |
|----------|---------|
| Test failures | `"\\) \\[.*\\]\\|Error:.*failed\\|Locator:\\|Timeout\\|waiting for"` |
| Type errors | `"error TS\\|Type.*is not assignable\\|Cannot find"` |
| Lint errors | `"eslint\\|prettier\\|padding-line"` |
| Build errors | `"build failed\\|compilation error\\|Module not found"` |
| Permission | `"403\\|401\\|Unauthorized\\|Forbidden\\|permission denied"` |
| Infrastructure | `"ENOMEM\\|OOM\\|killed\\|signal 9\\|out of memory"` |
| General | `"Error:\\|FAILED\\|error\\|failed"` |

### Step 3b: Get tail of logs (for summary/exit info)

```json
CallMcpTool: user-buildkite-read-only-toolsets / tail_logs
{ "org_slug": "<ORG>", "pipeline_slug": "<PIPELINE>", "build_number": "<BUILD>", "job_id": "<JOB_ID>", "tail": 80 }
```

### Step 3c: Deep-dive specific sections

When search results point to an interesting row number, read the surrounding context:

```json
CallMcpTool: user-buildkite-read-only-toolsets / read_logs
{ "org_slug": "<ORG>", "pipeline_slug": "<PIPELINE>", "build_number": "<BUILD>", "job_id": "<JOB_ID>", "seek": <ROW - 20>, "limit": 60 }
```

### Parsing log content

Log entries contain ANSI escape codes. Strip them for analysis:

```python
import re
clean = re.sub(r'\x1b\[[0-9;]*m', '', content).strip().replace('\r', '')
```

When logs are returned as large JSON, use `Shell` + `python3` to parse and extract the relevant lines efficiently. Filter for lines containing `proc [playwright]`, `Error`, `Timeout`, `Locator`, etc.

## Phase 4: Categorize Failures

After collecting ALL logs, create a root-cause analysis table:

```markdown
| RC# | Root Cause | Error Pattern | Tests Affected | Fix Strategy |
|-----|-----------|---------------|----------------|--------------|
| 1   | ...       | ...           | ~N tests       | ...          |
| 2   | ...       | ...           | ~N tests       | ...          |
```

Group failures by root cause, not by job. Many jobs may fail for the same reason.

**Priority order:**
1. Fixes that unblock the most tests (highest impact)
2. Type/lint errors (fast to verify locally)
3. Flaky/timing issues (increase timeouts, add retries)
4. Infrastructure issues (may not be fixable in code)

## Phase 5: Fix All Root Causes

Fix ALL identified root causes in a single commit when possible. Do not fix one, push, wait for CI, then fix the next — that wastes CI cycles.

### Before committing:
1. Run local type-check on changed files
2. Run local lint on changed files
3. Review the diff to ensure no unintended changes

### After committing:
1. Push to remote
2. Trigger CI (for draft PRs: `gh pr comment <PR> --repo <owner>/<repo> --body "/ci"`)
3. Monitor the new build

## Phase 6: Monitor New Build

Use `wait_for_build` or poll with `get_build` to check the new build status:

```json
CallMcpTool: user-buildkite-read-only-toolsets / get_build
{ "org_slug": "<ORG>", "pipeline_slug": "<PIPELINE>", "build_number": "<NEW_BUILD>" }
```

If the build fails again, go back to Phase 2 with the new build number.

## Anti-Patterns

- **Fixing one failure at a time** — Always gather ALL failures first. A single commit addressing 7 root causes is better than 7 round-trips through CI.
- **Guessing at fixes** — If you can't determine the root cause from logs, read the failing test code before proposing fixes.
- **Ignoring passing shards** — Compare passing vs failing shards to understand if failures are deterministic or environmental.
- **Reading only the first error** — Later errors often reveal the actual root cause (e.g., a setup failure causes cascading test failures).
- **Assuming previous fixes are still applied** — Always check if CI auto-pushed an eslint fix commit that needs a `/ci` retrigger.

## Kibana-Specific Patterns

For `elastic/kibana` and `kibana-pull-request` pipeline:

- **Org**: `elastic`, **Pipeline**: `kibana-pull-request`
- Draft PRs require `/ci` comment to trigger builds
- CI may auto-push eslint fix commits that need `/ci` retrigger
- Scout/Playwright test failures show `proc [playwright]` in logs
- FTR test failures show `proc [ftr]` in logs
- Type-check failures appear in "Check Types" job
- Builds typically take 45-90 minutes
- Sharded test jobs have `BUILDKITE_PARALLEL_JOB` suffix — pull logs from ALL failing shards
