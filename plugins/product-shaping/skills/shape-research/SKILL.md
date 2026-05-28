---
name: shape-research
description: Research codebase comprehensively using parallel sub-agents
argument-hint: "[change-id or research question]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---

# Research Codebase

You are tasked with conducting comprehensive research across the codebase to answer user questions by spawning parallel sub-agents and synthesizing their findings.

## Initial Setup

When this command is invoked, respond with:

```
I'm ready to research the codebase. Please provide your research question or area of interest, and I'll analyze it thoroughly by exploring relevant components and connections.
```

Then wait for the user's research query.

## Steps to follow after receiving the research query:

1. **Read any directly mentioned files first:**
   - If the user mentions specific files, read them FULLY first
   - Read `context/foundation/lessons.md` if present and treat its entries as known-pattern priors

2. **Analyze and decompose the research question:**
   - Break down the user's query into composable research areas
   - Identify specific components, patterns, or concepts to investigate
   - **Signal for external research**: if the question involves choosing between libraries, algorithms, or protocols with non-obvious trade-offs (e.g. SRS algorithm choice, payment provider schema, routing model), flag that external research via AI-native search + live docs is needed before internal codebase analysis

3. **External research (when needed):**

   If the question involves domain decisions that propagate to contracts (schema shapes, API boundaries, algorithm parameters), do NOT rely on model training-data recall alone. Ground in current sources:

   - **AI-native search** (Cursor uses Exa.ai; Claude Code uses WebSearch tool) — not plain ChatGPT from memory, which hits training cutoffs and hallucinations
   - **Live docs via WebFetch** — fetch the actual README, CHANGELOG, or technical spec from the source URL; get grounded in current source, not training data
   - **Synthesize findings into the research doc** with explicit source citations

   The signal that external research is mandatory: the agent starts asking domain questions you can't answer yet ("what shape should ReviewState be?", "which rating scale?", "which normalization algorithm?"). Stop, research, decide, then plan — never let the agent pick domain contracts arbitrarily.

4. **Clarify research scope using AskUserQuestion**:
   After decomposing the research question, use AskUserQuestion to align on scope and focus before spawning sub-agents. Skip if the query is unambiguous.

5. **Spawn parallel sub-agent tasks for comprehensive research:**
   - Create multiple Task agents to research different aspects concurrently
   - Spawn 2-4 agents in parallel in a single message for concurrent execution
   - Each focused on a specific research dimension
   - Request specific file:line references in responses

6. **Wait for all sub-agents to complete and synthesize findings:**
   - Compile results with specific file:line references
   - Connect findings across components
   - Answer the user's questions with concrete evidence

7. **Resolve change folder and gather metadata:**
   - If invoked as `/shape-research <change-id>` and `context/changes/<change-id>/` exists, use it.
   - Otherwise derive a kebab-case change-id and create the folder + `change.md` (mirroring `/shape-new` semantics).
   - Refuse if the resolved path starts with `context/archive/`.
   - Update `change.md`: set `updated: <today>` and advance `status` to `preparing` if currently `new`.

8. **Generate research document** at `context/changes/<change-id>/research.md`:

   ```markdown
   ---
   date: [Current date and time with timezone in ISO format]
   researcher: [Researcher name]
   git_commit: [Current commit hash]
   branch: [Current branch name]
   repository: [Repository name]
   topic: "[User's Question/Topic]"
   tags: [research, codebase, relevant-component-names]
   status: complete
   last_updated: [Current date in YYYY-MM-DD format]
   ---

   # Research: [User's Question/Topic]

   ## Research Question

   [Original user query]

   ## Summary

   [High-level findings answering the user's question]

   ## Detailed Findings

   ### [Component/Area 1]

   - Finding with reference ([file.ext:line](link))
   - Connection to other components

   ### [Component/Area 2]

   ...

   ## Code References

   - `path/to/file.py:123` - Description
   - `another/file.ts:45-67` - Description

   ## Architecture Insights

   [Patterns, conventions, and design decisions discovered]

   ## Open Questions

   [Any areas that need further investigation]
   ```

8. **Present findings and handle follow-ups:**
   - Present a concise summary
   - Include key file references
   - Ask if they have follow-up questions

## Important notes:

- Use parallel Task agents for efficiency
- Sub-agent prompts should be specific, read-only, requesting file:line references
- Research documents should be self-contained with file paths, line numbers, and cross-component patterns
