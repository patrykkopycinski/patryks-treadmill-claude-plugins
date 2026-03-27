---
name: kbn-evals-vision-reviewer
description: >-
  Review @kbn/evals code changes for alignment with the "Future of @kbn/evals" vision document.
  Checks that changes follow the trace-first, Elastic-native direction, use correct ownership
  boundaries, respect the data model and evaluation entry points, and avoid deepening Phoenix
  coupling. Use when reviewing PRs, commits, or planned work touching @kbn/evals, evaluation
  suites, evaluators, the evaluation data model, CI eval pipelines, or the golden cluster.
  Also triggers on "review evals", "check evals alignment", "evals vision review".
---

# @kbn/evals Vision Alignment Reviewer

Review any `@kbn/evals` work against the strategic vision to ensure changes move the
framework toward its intended future rather than away from it.

## How to Use

1. Read the full vision reference at [vision.md](vision.md)
2. Identify all changed files related to `@kbn/evals` (grep for `kbn-evals`, `kbn/evals`,
   evaluation suite paths, evaluator files, executor clients, dataset definitions)
3. Apply the review checklist below to each change
4. Produce a structured report

## Review Checklist

### 1. Strategic Direction (Section 5 of the vision)

- [ ] **Trace-first alignment**: Does the change treat OTel traces in Elasticsearch as
  the primary evidence of agent/LLM behavior? New evaluators should derive signals from
  traces (prompts, tool calls, latency, tokens) rather than bespoke API response parsing.
- [ ] **Elastic-native path**: Does the change build on ES/Kibana/OTel capabilities rather
  than deepening reliance on external tooling (especially Phoenix)?
- [ ] **No new Phoenix coupling**: Does the change introduce new dependencies on Phoenix
  SDK, Phoenix GraphQL, or Phoenix data schemas? Flag any new Phoenix imports, API calls,
  or schema references. Existing Phoenix usage is acceptable if behind the `KBN_EVALS_EXECUTOR=phoenix`
  toggle, but new features should target the in-Kibana executor path.
- [ ] **Shared evaluation layer**: Does the change respect the boundary between the shared
  evaluation engine (`@kbn/evals`) and solution-owned suites? The framework should provide
  primitives; solutions should own their evaluators, datasets, and reporting.

### 2. Evaluation Data Model (Section 5.2.2)

- [ ] **Trace linkage**: Do new evaluation records reference the evaluated interaction
  trace(s) and (when applicable) the judge trace? Check for `trace_id` fields in task
  and evaluator output.
- [ ] **Metadata completeness**: Do evaluation records include run_id, experiment_id,
  suite, dataset, example, model/connector, environment, and git metadata?
- [ ] **Queryable structure**: Are results stored in the `kibana-evaluations` datastream
  with the documented schema? New fields should follow the established naming conventions.
- [ ] **No parallel schemas**: Does the change avoid creating alternative/parallel
  persistence formats that duplicate the canonical data model?

### 3. Evaluator Contract (Section 5.2.1)

- [ ] **Trace-first evaluator contract**: New evaluators should produce standardized
  outputs (score/label/explanation) and derive signals from OTel trace spans/events/attributes.
- [ ] **Functional + non-functional signals**: Evaluators should be capable of extracting
  both functional signals (correctness, tool selection, groundedness) and non-functional
  signals (latency, token usage, tool call counts) from traces.
- [ ] **Reusable primitives**: General-purpose evaluators should be contributed to the
  framework; solution-specific evaluators stay in solution suites.

### 4. Dataset Management (Section 4.1)

- [ ] **Code-defined datasets by default**: Evaluation datasets should be defined in code,
  versioned, and reviewed alongside the suite for transparency and repeatability.
- [ ] **Ad-hoc datasets decoupled from CI**: Experimental/ad-hoc datasets (for research
  iteration) must be explicitly decoupled from CI-contributing datasets. Check that ad-hoc
  datasets don't leak into CI reporting.
- [ ] **Knowledge-base vs evaluation datasets**: Data seeding (knowledge-base/signal
  datasets) is NOT a framework responsibility. Check that the framework doesn't absorb
  ingestion logic that belongs to suite authors.
- [ ] **Promotion path**: Ad-hoc datasets that prove valuable should have a clear path
  to promotion into code-defined datasets.

### 5. Evaluation Entry Points (Section 5.2.4)

- [ ] **Orchestrator entry point**: Offline evaluations via Playwright/Scout suites should
  execute tasks in a controlled environment, collect trace pointers and metadata, and hand
  evidence to the shared evaluation layer for scoring and persistence.
- [ ] **API entry point readiness**: Changes should not prevent the future API entry point
  for in-tool evaluation. The shared evaluation layer should remain invocable without the
  Playwright/Scout harness.
- [ ] **Consistent results**: Both entry points (orchestrator and future API) must produce
  results through the same shared evaluation layer, ensuring comparability.

### 6. CI Integration (Section 4.2)

- [ ] **Metadata in CI runs**: CI evaluation runs must include run identifiers, git SHA,
  suite, model/connector, dataset version, environment, and trace references.
- [ ] **Soft-to-hard gate progression**: New CI gates should start as soft gates
  (report + visibility) and only become hard gates once suites are stable and thresholds tuned.
- [ ] **Golden cluster persistence**: CI results should persist to the golden cluster for
  trend analysis, not just local/ephemeral storage.

### 7. Ownership Boundaries (Section 4.5)

- [ ] **Framework vs suite**: Framework changes (`@kbn/evals` package) should provide
  orchestration/runtime, data model, trace-first evaluator primitives. Solution-specific
  logic belongs in solution evaluation suites.
- [ ] **Framework owner**: Observability AI team owns the framework. Cross-cutting changes
  should be coordinated with them.
- [ ] **Reusable contributions**: General-purpose evaluators, utilities, or patterns
  discovered in solution suites should be proposed upstream to the framework.

### 8. Decoupling & Portability (Sections 3.2, 5)

- [ ] **No tight Kibana coupling for core logic**: Core evaluation logic (evaluator
  contracts, data model, persistence) should be separable from the Kibana dev environment
  to enable future use by non-Kibana engineers (data/ML science colleagues).
- [ ] **No Elastic License 2.0 conflicts**: Ensure no new dependencies are introduced
  that conflict with Elastic's licensing requirements for eventual distribution.

## Report Format

Produce a structured review with:

```
## @kbn/evals Vision Alignment Review

### Summary
[1-2 sentence overall assessment: aligned / partially aligned / misaligned]

### Aligned With Vision
- [List specific aspects that correctly follow the strategic direction]

### Concerns
- **[Category from checklist]**: [Description of the concern and which
  vision principle it conflicts with]
  - **Recommendation**: [Specific suggestion to realign]

### Opportunities
- [Optional: ways the change could go further in supporting the vision]
```

## Key Quotes from the Vision (for reference during review)

> "The primary objective is to elevate @kbn/evals from an offline evaluation runner
> into the foundational layer for all LLM quality assurance in Kibana."

> "Strategic objective: Treat OpenTelemetry traces in Elasticsearch as the primary
> evidence of agent/LLM behavior, and build evaluation orchestration, dataset
> management and reporting as part of workflows within the Elastic Stack."

> "The evaluator contract is centered around OpenTelemetry traces stored in
> Elasticsearch. This aligns evaluation with how we already observe production
> behavior 'online'."

> "Evaluation datasets define what we are explicitly measuring. For transparency
> and repeatability, the default should be that datasets are defined in code,
> versioned and reviewed in the repository alongside the suite."

> "This layer should be independent of how an evaluation is triggered (CI/offline
> vs in-tool), so that evaluator behavior and stored results remain consistent
> across all use cases."

> "We're proposing an Elastic-native evaluation solution that builds on top of
> our Observability product."
