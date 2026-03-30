---
name: code-archaeology
description: Understand code history and context through git archaeology to answer "why", "who", and "when" questions about code.
---

# Code Archaeology

## Purpose
Understand code history and context through git archaeology to answer "why", "who", and "when" questions about code.

## Capabilities
- git blame analysis (who wrote this, when, why)
- git log --follow (track file renames and moves)
- Find related PRs/issues via commit messages
- Identify original author for questions
- Find test coverage for legacy code
- Understand evolution of APIs and patterns
- Detect dead code and deprecated patterns

## Triggers
- "why was this written"
- "who owns this code"
- "when was this added"
- "history of this function"
- "find related PRs"
- "track this file's history"

## Implementation

### 1. Git Blame Analysis
```bash
# Basic blame for a file
git blame <file>

# Blame with commit messages (more context)
git blame -s --date=short <file>

# Blame a specific line range
git blame -L <start>,<end> <file>

# Blame ignoring whitespace changes
git blame -w <file>

# Blame with full commit hash and author email
git blame -e <file>

# Example: Find who wrote a specific function
git blame -L $(grep -n "function myFunction" file.ts | cut -d: -f1),+20 file.ts
```

**Output format:**
```
a1b2c3d4 (John Doe 2024-03-15) export function myFunction() {
e5f6g7h8 (Jane Smith 2024-06-20)   // Updated to support new API
a1b2c3d4 (John Doe 2024-03-15)   return doSomething();
i9j0k1l2 (John Doe 2024-08-10) }
```

**Interpretation:**
- Original author: John Doe (2024-03-15)
- Modified by: Jane Smith (2024-06-20) - comment update
- Last touch: John Doe (2024-08-10) - closing brace (probably refactor)

### 2. Commit History Deep Dive
```bash
# Get commit details
git show <commit-hash>

# Get commit message and diff
git log -p <commit-hash> -1

# Find commit that introduced a line
git log -S "specific code string" --source --all

# Find commits that modified a function
git log -L :<function-name>:<file>

# Show evolution of a function
git log -p -L :<function-name>:<file>
```

### 3. Track File Renames and Moves
```bash
# Follow file history through renames
git log --follow --name-status -- <file>

# Show all renames
git log --follow --stat -- <file>

# Find when file was renamed
git log --follow --diff-filter=R -- <file>

# Example: Track a file that moved packages
git log --follow --oneline \
  x-pack/platform/packages/shared/kbn-agent-builder/src/core.ts
```

**Output:**
```
abc1234 refactor: move agent-builder to shared packages
def5678 feat: add agent-builder core functionality
ghi9012 initial commit
```

### 4. Find Related PRs and Issues
```bash
# Get commit message with PR/issue references
git log --grep="PR" --grep="#[0-9]" --oneline

# Find PR number from commit
git log --format="%H %s" | grep -E "#[0-9]+"

# Get PR details via gh CLI
commit_hash="abc1234"
pr_number=$(git log --format="%s" $commit_hash -1 | grep -oE "#[0-9]+" | head -1 | tr -d '#')
gh pr view $pr_number

# Find all PRs by an author
gh pr list --author john.doe --state all --limit 100

# Search PRs by keyword
gh pr list --search "agent builder" --state all
```

### 5. Identify Code Ownership
```bash
# Get primary contributors to a file
git log --format="%an" -- <file> | sort | uniq -c | sort -rn | head -5

# Get recent contributors (last 6 months)
git log --since="6 months ago" --format="%an" -- <file> | sort | uniq -c | sort -rn

# Check CODEOWNERS
grep -r "path/to/file" .github/CODEOWNERS

# Find team ownership in Kibana
# CODEOWNERS format: path/pattern @elastic/team-name
grep "x-pack/platform/packages/shared/kbn-agent-builder" .github/CODEOWNERS
```

**Example output:**
```
  45 John Doe
  23 Jane Smith
   8 Bob Johnson
```
Result: John Doe is primary owner (45 commits), Jane Smith is secondary (23 commits)

### 6. Find Test Coverage for Legacy Code
```bash
# Find test files for a source file
source_file="src/core/server/http_server.ts"
test_file="${source_file%.ts}.test.ts"

# Check if test exists
if [ -f "$test_file" ]; then
  echo "Unit test found: $test_file"
else
  echo "No unit test found"
fi

# Find integration tests (search for imports)
grep -r "$(basename $source_file .ts)" --include="*.integration.test.ts" .

# Find FTR tests (search for test descriptions)
grep -r "http server" x-pack/test/api_integration/

# Find Scout tests (search for test descriptions)
find . -name "*.scout.ts" -exec grep -l "http server" {} \;

# Check test coverage report (if exists)
cat target/kibana-coverage/jest/coverage-summary.json | \
  jq ".\"$(pwd)/$source_file\""
```

### 7. Detect Dead Code and Deprecations
```bash
# Find deprecated markers
grep -r "@deprecated" --include="*.ts" <path>

# Find TODO/FIXME markers with dates
grep -r "TODO\|FIXME" --include="*.ts" <path> | grep -E "[0-9]{4}"

# Find unused exports (requires ripgrep)
# 1. Extract all exports from a file
exports=$(grep -E "^export (const|function|class|interface|type)" <file> | \
  sed -E 's/export (const|function|class|interface|type) ([a-zA-Z0-9_]+).*/\2/')

# 2. Search for usage of each export
for export in $exports; do
  count=$(rg -l "import.*$export.*from" | wc -l)
  if [ $count -eq 0 ]; then
    echo "Unused export: $export"
  fi
done

# Find when code was marked deprecated
git log --all -S "@deprecated" -- <file>
```

### 8. Understand API Evolution
```bash
# Show all changes to a function signature
function_name="myFunction"
file="src/core.ts"

# Show line-by-line evolution
git log -L :$function_name:$file --oneline

# Show detailed evolution with diffs
git log -p -L :$function_name:$file

# Find when parameters were added
git log -p -S "function $function_name" -- $file

# Example output interpretation:
# commit abc123 (2024-01-15) - Initial implementation
# commit def456 (2024-03-20) - Added optional 'options' parameter
# commit ghi789 (2024-06-10) - Changed return type from string to Result<string>
```

## Example Workflow

### User: "why was this function written this way?"

**Context:** User is looking at a complex function with unusual implementation

**Step 1: Get function location**
```bash
file="x-pack/platform/packages/shared/kbn-agent-builder/src/core.ts"
func="executeAgentWorkflow"
line_num=$(grep -n "executeAgentWorkflow" $file | head -1 | cut -d: -f1)
```

**Step 2: Blame the function**
```bash
git blame -L $line_num,+50 $file
# Output shows commit abc123 (John Doe, 2024-03-15)
```

**Step 3: Get commit details**
```bash
git show abc123
# Output:
# commit abc123
# Author: John Doe <john@elastic.co>
# Date: 2024-03-15
#
# fix: handle async workflow execution race condition
#
# Previous implementation used Promise.all which caused race conditions
# when multiple workflows modified shared state. This change serializes
# execution while maintaining parallelism for independent workflows.
#
# Fixes #12345
```

**Step 4: Find related PR**
```bash
pr_num=$(git log --format="%s" abc123 -1 | grep -oE "#[0-9]+" | tr -d '#')
gh pr view $pr_num
# Output shows PR discussion with context
```

**Step 5: Show evolution**
```bash
git log -p -L :executeAgentWorkflow:$file
# Shows 3 previous versions:
# - v1 (2024-01-10): Simple Promise.all implementation
# - v2 (2024-02-15): Added error handling
# - v3 (2024-03-15): Current serialization approach (fixes race condition)
```

**Step 6: Find ownership**
```bash
git log --format="%an" -- $file | sort | uniq -c | sort -rn | head -3
# Output:
#   15 John Doe
#    5 Jane Smith
#    2 Bob Johnson

grep "kbn-agent-builder" .github/CODEOWNERS
# Output: x-pack/platform/packages/shared/kbn-agent-builder @elastic/platform-core
```

**Final Answer:**
```
Code Archaeology Report for executeAgentWorkflow()
====================================================

Original Author: John Doe (john@elastic.co)
Date: 2024-03-15
Commit: abc123

Why Written This Way:
The function uses sequential execution (not Promise.all) to avoid race
conditions when multiple workflows modify shared state. This was changed
from a simpler parallel implementation after discovering a bug in
production (issue #12345).

Evolution:
- v1 (2024-01-10): Simple Promise.all for parallelism
- v2 (2024-02-15): Added error handling
- v3 (2024-03-15): Serialized execution to fix race condition

Related PR: #12346
Discussion highlights:
- Trade-off: Serialization reduces throughput but ensures correctness
- Alternative approaches were considered (locking, immutable state)
- Current approach chosen for simplicity and safety

Code Ownership:
- Primary: @elastic/platform-core
- Contact: John Doe (15 commits), Jane Smith (5 commits)

Recommendation:
If questioning this approach, read PR #12346 first. Consider consulting
John Doe or @elastic/platform-core before refactoring.
```

## Advanced Techniques

### Find When a Bug Was Introduced
```bash
# Use git bisect to find the commit that introduced a bug
git bisect start
git bisect bad HEAD  # Current version has the bug
git bisect good v7.0.0  # Version 7.0.0 was good

# Git will checkout commits for you to test
# After each test, run:
git bisect good  # if bug not present
# or
git bisect bad   # if bug present

# Git will narrow down to the exact commit
git bisect reset  # when done
```

### Find All Places a Pattern Was Changed
```bash
# Find all commits that touched a specific pattern
git log -p -G "pattern|regex" -- <path>

# Example: Find all changes to error handling
git log -p -G "try.*catch" -- src/

# Example: Find all changes to a specific API call
git log -p -G "client\.search\(" -- x-pack/
```

### Visualize File History
```bash
# Generate a visual timeline (requires gitk or tig)
gitk --follow <file>

# Or use tig (terminal UI)
tig --follow <file>

# Or generate markdown timeline
git log --follow --format="%h|%ad|%an|%s" --date=short -- <file> | \
  awk -F'|' '{print "- **" $2 "** " $3 ": " $4 " (commit: " $1 ")"}'
```

## Integration with Other Skills
- **spike-builder**: Research existing patterns before implementing new features
- **buildkite-ci-debugger**: Find when CI config was last changed
- **pr-optimizer**: Identify reviewers based on code ownership

## Quality Principles
- Always provide context, not just facts (why, not just who/when)
- Link to PRs/issues for deeper discussion
- Identify current code owners for follow-up questions
- Respect git history as documentation of intent

## References
- Git blame docs: https://git-scm.com/docs/git-blame
- Git log filtering: https://git-scm.com/docs/git-log
- Kibana CODEOWNERS: .github/CODEOWNERS
