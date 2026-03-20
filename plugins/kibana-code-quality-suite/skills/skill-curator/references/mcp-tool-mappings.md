# MCP Tool Domain Mappings

Reference guide for suggesting MCP tools based on skill domain keywords.

## Available MCP Servers

### agent-builder-skill-dev
**Purpose:** Agent Builder skill development, similarity detection, eval generation

**Tools:**
- `list_all_skills` — List all Agent Builder skills (builtin + user-created)
- `analyze_skill_similarity` — Compute similarity between proposed skill and existing skills
- `audit_skill_ecosystem` — Run full pairwise similarity audit
- `fetch_user_skill` — Fetch user-created skill definition
- `test_user_skill` — Test skill via Agent Builder converse API
- `generate_eval_suite` — Generate @kbn/evals eval suite scaffold
- `run_evals` — Run eval suite via Kibana evals CLI
- `get_eval_results` — Fetch latest eval experiment results
- `analyze_traces` — Analyze LangGraph execution traces
- `get_improvement_suggestions` — Categorize eval failures, suggest fixes
- `get_model_threshold` — Get quality threshold for a model
- `validate_schema_complexity` — Validate tool schema for OSS compatibility
- `check_convergence` — Check if self-improving loop converged

**Use when skill mentions:**
- "Agent Builder", "skill", "eval", "trace", "LangGraph"
- "pass rate", "convergence", "tool schema"
- "similarity", "duplicate", "overlap"

---

### context7
**Purpose:** Query library/framework documentation

**Tools:**
- `resolve-library-id` — Resolve package name to Context7 library ID
- `query-docs` — Query documentation for a library

**Use when skill mentions:**
- "documentation", "library", "API reference"
- "framework", "package", "SDK"
- Language/framework names: "React", "TypeScript", "Python"

---

### docs-langchain
**Purpose:** Search LangChain documentation

**Tools:**
- `search_docs_by_lang_chain` — Search LangChain docs

**Use when skill mentions:**
- "LangChain", "LCEL", "agent", "chain"
- "RAG", "vector store", "embeddings"

---

### hugging-face
**Purpose:** Search HF repos, papers, spaces, models, datasets

**Tools:**
- `space_search` — Semantic search for Spaces
- `hub_repo_search` — Search repos (models, datasets, spaces)
- `paper_search` — Search ML research papers
- `hub_repo_details` — Get repo details
- `hf_doc_search` — Search HF product/library docs
- `dynamic_space` — Perform tasks with HF Spaces

**Use when skill mentions:**
- "machine learning", "ML model", "dataset"
- "Hugging Face", "transformers", "diffusion"
- "research paper", "benchmark"

---

### langsmith
**Purpose:** LangSmith tracing, datasets, evals, runs

**Tools:**
- `fetch_runs` — Fetch runs with filters
- `get_thread_history` — Retrieve conversation thread
- `list_prompts` — Fetch prompts
- `get_prompt_by_name` — Get prompt by name
- `list_projects` — List projects
- `list_experiments` — List experiment projects
- `list_datasets` — Fetch datasets
- `list_examples` — Fetch dataset examples
- `read_dataset` — Read dataset by ID/name
- `get_billing_usage` — Fetch billing usage

**Use when skill mentions:**
- "LangSmith", "trace", "observability"
- "dataset", "eval", "experiment"
- "prompt", "thread", "conversation"

---

### playwright
**Purpose:** Browser automation

**Tools:**
- `browser_navigate` — Navigate to URL
- `browser_snapshot` — Capture accessibility snapshot
- `browser_take_screenshot` — Take screenshot
- `browser_click` — Click element
- `browser_type` — Type text
- `browser_fill_form` — Fill form fields
- `browser_evaluate` — Run JavaScript
- ... (40+ tools)

**Use when skill mentions:**
- "browser", "Playwright", "Scout"
- "UI test", "E2E test", "screenshot"
- "web automation", "Cypress migration"

---

### elastic
**Purpose:** Elastic Cloud/Stack deployment, APM, logs

**Tools:**
- `cloud_api` — Execute Elastic Cloud REST API
- `get_deployment_guide` — Get deployment guide
- `get_connection_config` — Get Elasticsearch client code
- `setup_apm` — Get APM instrumentation code
- `setup_log_shipping` — Generate log shipping config
- `create_dashboard` — Generate dashboard setup
- `create_alert_rule` — Create alert rule
- `list_workflows` — List observability workflows
- `run_workflow` — Execute workflow
- `save_workflow` — Save workflow definition

**Use when skill mentions:**
- "Elastic", "Elasticsearch", "Kibana"
- "APM", "logs", "observability"
- "deployment", "infrastructure"

---

### skillsmp
**Purpose:** Search and discover skills from SkillsMP marketplace

**Tools:**
- `skillsmp_search_skills` — Search skills by keywords
- `skillsmp_ai_search_skills` — AI semantic search for skills
- `skillsmp_read_skill` — Read skill content from GitHub

**Use when skill mentions:**
- "skill search", "find skills", "discover skills"
- "marketplace", "community skills"

---

### cursor-chat-browser
**Purpose:** Search conversation history

**Tools:**
- `search_messages` — Search messages across conversations
- `search_conversations` — Search conversations by title
- `get_conversation` — Retrieve conversation by ID
- `list_workspaces` — List workspaces
- `recent_conversations` — Get recent conversations
- `reindex` — Re-scan and index conversations

**Use when skill mentions:**
- "conversation history", "past discussions"
- "search chat", "find message"
- "usage analytics", "invocation tracking"

---

## Heuristic Mapping Table

| Skill Domain Keywords | Suggested MCP Servers |
|----------------------|----------------------|
| "Agent Builder", "skill", "eval" | `agent-builder-skill-dev`, `langsmith` |
| "test", "Scout", "Playwright", "Cypress" | `playwright`, `langsmith` |
| "documentation", "library", "API" | `context7`, `docs-langchain` |
| "ML", "model", "dataset", "benchmark" | `hugging-face` |
| "LangSmith", "trace", "observability" | `langsmith` |
| "Elastic", "Kibana", "Elasticsearch" | `elastic` |
| "skill search", "discover skills" | `skillsmp` |
| "conversation history", "usage analytics" | `cursor-chat-browser` |
| "LangChain", "LCEL", "RAG" | `docs-langchain` |
| "browser", "UI", "E2E" | `playwright` |

---

## Usage Example

**Input skill:**
```yaml
name: kbn-evals-debugger
description: Debug Agent Builder eval failures via OTEL trace analysis. Auto-categorizes root causes, applies fixes, converges via adaptive loop.
```

**Domain keywords detected:** "Agent Builder", "eval", "trace"

**Suggested MCP tools:**
1. **agent-builder-skill-dev**
   - `analyze_traces` — Analyze LangGraph traces for efficiency
   - `get_improvement_suggestions` — Categorize failures, suggest fixes

2. **langsmith**
   - `fetch_runs` — Fetch LangSmith runs for trace data
   - `get_thread_history` — Retrieve conversation traces

**Integration snippet:**
```typescript
// Add to Step 3: Trace Analysis
const traceAnalysis = await agent-builder-skill-dev.analyze_traces({
  trace_id: extractedTraceId,
  expected_skill_id: "alert-triage",
  expected_tools: ["alert.get", "alert.update"]
});
```
