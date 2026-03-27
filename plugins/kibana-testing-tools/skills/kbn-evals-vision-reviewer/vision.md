# The future of (@kbn/) evals

This document intends to clarify the next steps for evals within Kibana, including the evaluation framework itself and its adoption by the solutions. While technical milestones will be mentioned, the low level details are intentionally left out of this document for the purpose of a high-level look on the future of evals.

## 1. Executive Summary

The primary objective of this initiative is to elevate @kbn/evals from an offline evaluation runner into the foundational layer for all LLM quality assurance in Kibana. To succeed, we first need to increase adoption of the framework among Kibana engineers and make it part of the standard development process through shared utilities, continuous integration (CI) pipelines and actionable reporting and insights.

Our long-term ability to scale @kbn/evals, as an internal process, product experience or external framework, faces technical and legal ceiling by relying on a third-party evaluation backend (Arize Phoenix), hence we're proposing an Elastic-native evaluation solution that builds on top of our Observability product.
The proposed solution's premise is to establish OpenTelemetry traces within Elasticsearch as the single source of evidence for the evaluation process and align our evaluation framework with that approach. With this direction, all of the different styles of evaluation can be observed as different entry points sharing the same foundation - offline evaluation as our internal use case; in-tool evaluation as a future user-facing experience; externalized evaluation SDKs as an experiment oriented experience.

## 2. Glossary

| Term | Explanation |
| :---- | :---- |
| Evaluation framework (@kbn/evals) | Shared utilities and conventions for writing and running offline evaluation suites in Kibana (Scout/Playwright-based), including fixtures, reporting helpers, and persistence of results. |
| Evaluation suite | A solution-owned Kibana package containing evaluation tests, datasets, tasks, and evaluators (e.g., Agent Builder, Observability AI Assistant, Streams evaluation suites). |
| Evaluation dataset | A named collection of evaluation examples representing a specific capability or behavior under test. Dataset holds one or more examples. |
| (Evaluation dataset) Example | A single test case within a dataset, typically containing input, optional expected output/ground truth, and metadata. |
| Task | The code that exercises the system under evaluation for a given example (e.g., call a converse endpoint, invoke a tool flow, run a retrieval task). |
| Evaluator | Logic that scores or labels the task output. Evaluators may be deterministic or model-scored (LLM-as-a-judge) and typically produce a score, label, and explanation. |
| OpenTelemetry/OTel | The observability standard used to represent signals such as logs, metrics and traces. In the context of evaluations we're focusing on trace aspects (spans/events/attributes) for GenAI, backed by semantic conventions. |
| OTLP | The protocol used to export OpenTelemetry data. |
| Phoenix | The current external system used for evaluation dataset/experiment management and orchestration in today's evaluation workflow. |
| Connector | A Kibana inference connector configuration that points to a model/provider and is used for the "LLM interaction" component of the evaluated workflow. |
| Golden cluster | A stable Elasticsearch/Kibana environment used as the centralized system of record for evaluation results and (when enabled) ingested traces. |

## 3. Current State

### 3.1 Background

Kibana evaluation framework has the following components:

- Arize Phoenix as the current evaluation experiment and dataset backend. The framework manages evaluation and executes trials through sets of experiments. The Phoenix platform is already widely used by Kibana developers for local inference tracing and debugging.
- Scout (@kbn/scout) as the execution harness for offline evaluation suites: it manages the lifecycle, provides access to test environments (Kibana/Elasticsearch) and test fixtures. Scout uses Playwright under the hood - an end-to-end testing framework, widely used in Kibana.
- @kbn/evals as the framework layer that connects these pieces: a Scout/Playwright extension that wires model/connector projects, provides evaluation fixtures, runs evaluators, and exports evaluation results to Elasticsearch for reporting and analysis.

Each solution adopting the framework has a dedicated evaluation suite (or suites) with solution-specific environment setup, datasets, tasks, and evaluators. Today, evaluation suites exist for Agent Builder, Observability AI Assistant, Observability AI Insights and Streams with more teams solutions such as Security looking to adopt the framework.

The @kbn/evals framework is currently owned by the Appex AI Infra team. Most contributions are the outcome of joint collaboration between Agent Builder, Observability AI and Security teams. The specific evaluation suites and datasets are owned and maintained by the solution teams that run them.

### 3.2 Overview

**What's good today:**

* **Suite authoring is lightweight.** Teams can write evaluation suites as Playwright/Scout tests with minimal boilerplate. Framework comes with built-in primitives such as common evaluators, utilities for analyzing traces and output reporters, but all are optional and can be customized by the suite authors.
* **Multi-model evaluation built in and default.** The same suite runs across multiple connectors/models and makes comparative testing straightforward.
* **Results are persisted in Elasticsearch**. Evaluation outputs are stored and used for in-terminal summaries and for ad-hoc queries. Persisting results provide the foundations for future reporting work.

**Key challenges and gaps:**

To address both our immediate development needs and our long-term goals for customer-facing features, we must navigate the following challenges:

**Internal Development Experience (Short-term):**

* **Incomplete feedback loops.** We lack consistent reporting and CI workflows that establish regular feedback loops (PR checks, scheduled runs, baseline comparisons, alerts). Consequently, evaluations are difficult to operationalize as a standard quality signal across relevant teams.
* **Fractured execution workflow.** Our current reliance on Arize Phoenix for orchestration and dataset management creates a disconnect from our natural "next-step" capabilities, which are Elastic-native (OTel traces in Elasticsearch, ES|QL analysis, dashboards). For example, we currently work around Phoenix's lack of API support for non-functional metrics by exporting traces to Elasticsearch directly and generating stats via ES|QL queries.
* **Stability overhead.** We face ongoing stability and configuration issues while working with the Phoenix environment, which adds friction to the development process. While we're able to resolve/work around most of the issues, we're finding that Phoenix as a tool has not been built for the scale of evaluations we're needing/anticipating.

**Future Scalability & User Readiness (Long-term):**

* **Coupling with the Kibana development environment.** The framework is currently tightly coupled to the Kibana repository and development environment. While acceptable for current Kibana developers, this coupling restricts non-Kibana engineers (including our data/ML science colleagues) from easily running experiments or using the framework outside of the specific Kibana constraints.
* **Legal and architectural limits of Phoenix.** While Phoenix serves our internal offline/debugging needs, its dependencies cannot be bundled into a Kibana distribution due to Elastic License 2.0 constraints of Phoenix. This prevents us from simply "shipping" our current internal tooling to customers. Furthermore, reliance on the Phoenix SDK prevents us from creating a lightweight, shared evaluation layer that can support both offline dogfooding and future online, customer-facing capabilities.
* **Product readiness gap.** The current version of @kbn/evals is not designed to be invoked through a user-facing Kibana API. To transition evaluations from an offline tool to a user-facing product, the framework requires a contract and persistence model that is not tied to the Phoenix data schema.

## 4. Immediate Focus: Framework Adoption

The evaluation framework is only valuable if it becomes routine, low-friction and trusted enough to assess capabilities/detect regressions before releases. The goal is to make evaluations behave like other quality signals: consistent environments, repeatable experiments and actionable reporting.

### 4.1 Standardized dataset management

Evaluation outcomes are only meaningful if the underlying data and inputs are consistent and reproducible. In practice, this means we need to manage two different dataset categories:

* **Knowledge-base/signal datasets**: data that must be seeded in the system-under-evaluation (an Elastic deployment) for a scenario to be valid (e.g. customer support ticket index, documentation indices, logs, metrics and traces from OpenTelemetry demo application, etc.).
* **Evaluation datasets**: the evaluation inputs themselves (examples with inputs, reference and metadata information) that define what's being assessed.

#### 4.1.1 Knowledge-base/signal datasets

Seeding the data into the Elasticsearch instance under evaluation **is not a responsibility of the evaluation framework**: the best ingestion mechanism depends on the scenario, data size, privacy constraints, and how frequently the dataset changes. However, to make evaluation adoption scalable across teams and environments (dev machines, CI), we outline a small set of ingestion patterns and recommend them by use case.

While internal utilities exist, the approach ultimately falls onto the evaluation suite authors. In the possible future scenario where evaluation solution is externalized, this decoupling becomes amplified, given the system-under-evaluation may be an external environment (not an Elastic deployment) that only ingests LLM traces into Elasticsearch.

#### 4.1.2 Evaluation datasets

Evaluation datasets define what we are explicitly measuring. For transparency and repeatability, the default should be that datasets are defined in code, versioned and reviewed in the repository alongside the suite.

This provides transparency (everyone can inspect exactly what is being evaluated), repeatability (the same dataset definition produces comparable runs across environments) and makes any changes to the evaluation scope or expectations go through normal code review.

**Ad-hoc/experimental datasets**

Some suites (e.g. Agent Builder evals) support running evaluations against a dataset that exists in the evaluation backend, but not in the code, to allow research/science colleagues to iterate faster and test hypotheses without the friction of formal code reviews or full CI cycles.

The evaluation framework doesn't prevent the suite authors from incorporating this "discovery" phase in the evaluations, but we recommend this setup to be explicitly decoupled from the evaluation datasets executing in CI and contributing to the reporting. Once a dataset demonstrates value in catching regressions or assessing a critical product capability, it should be "promoted" and contributed to the code-defined evaluation datasets.

Longer term, (Section 5 of this document) we plan to migrate evaluation dataset definition and persistence to an Elasticsearch-backed registry. This effort needs to bring the code-defined and ad-hoc evaluation datasets to the same representation, where only the source differs (code, file or an Elasticsearch index).

### 4.2 Evaluation in CI

We're already moving @kbn/evals toward a CI workflow so evaluations become a routine, low-friction signal rather than an occasional local workflow. The core pieces are in place (suites, multi-model evals, persistence or results) and we're standardizing the remaining plumbing so teams can run consistent eval jobs in CI with minimal setup. Solutions will be able to run evaluations on changes that require them prior to merge and/or on regular schedules to catch regressions.

As this rolls out, CI runs will produce evaluation runs with metadata (unique evaluation run identifiers, git SHA, suite, model/connector, dataset version, environment and relevant traces), persist results for dashboards/comparisons, and evolve from soft gates (report + visibility) to hard gates once suites are stable and thresholds are tuned.

### 4.3 Golden Cluster

Golden cluster for evaluations is our shared environment for persisting evaluation telemetry and results. It provides a single place to store and analyze evaluation traces (ingested via a managed OTLP endpoint) and evaluation outputs over time, so teams can track trends, compare runs, and detect regressions.

The immediate adoption work is solution-specific: creating dedicated Kibana spaces, dashboards, and alerts tailored to each solution's evaluation needs (quality scores, latency, token usage, tool behavior, etc.).

### 4.4 Reporting and alerting

Reporting and alerting turns evaluation runs into an actionable quality signal: teams should be able to quickly understand whether changes improved or degraded behavior, and where regressions are coming from. We'll standardize how evaluation results are summarized and trended over time so that solution teams can use evaluation results stored in the golden cluster in day-to-day development and release readiness.

We will partner with our data science colleagues to define the right **visuals**, **metrics of interest, and alert thresholds**. The goal is to establish a consistent reporting and alerting approach that supports both high-level health tracking and targeted investigation when evaluation performance changes.

### 4.5 Ownership

As part of the future efforts on the evaluations, we are proposing the following split of ownership:

- Framework owner: **Observability AI** team. Obs AI team will own the @kbn/evals orchestration/runtime, data model, trace-first evaluator primitives and (optionally) the eval APIs.
- Each solution team owns their respective evaluation suites controlling the evaluators, parameters and reporting. They will delegate/contribute reusable components (such as general-purpose evaluators) and/or raise feature requests/bugs to the framework owners.
- Both solution teams and framework owners should consult relevant teams regarding other parts of the process (e.g. appex-qa team for the test framework/infrastructure, appex-ai-infra for the inference in Kibana; apm team for inference tracing and semantic conventions).

## 5. Future Focus: Kibana Evaluation Solution

### 5.1 Overview

Strategic objective: Treat **OpenTelemetry traces in Elasticsearch as the primary evidence** of agent/LLM behavior, and build evaluation orchestration, dataset management and reporting as part of workflows **within the Elastic Stack**.

This aligns with how we ship observability for external users, builds on top of it for the arising evaluation needs and reduces our dependencies on the external tooling.

### 5.2 Solution Components

#### 5.2.1 Trace-first evaluators (contract)

Trace-first evaluators define the contract for what we evaluate and what evidence we rely on. Instead of treating evaluation as something that primarily depends on external tooling or bespoke parsing of API responses, the evaluator contract is centered around OpenTelemetry traces stored in Elasticsearch. This aligns evaluation with how we already observe production behavior "online".

At a high level, evaluators derive both functional and non-functional signals from traces (for example: prompts/messages, tool availability and tool selection, tool invocations, latency, and token usage) and produce standardized outputs (score/label/explanation). This contract moves evaluator development focus on extracting the right signals rather than rebuilding instrumentation.

#### 5.2.2 Evaluation data model

The evaluation data model is the durable, queryable representation of evaluation outcomes. It represents the record for what was evaluated, what the results were, and how those results relate back to the source evidence. The primary goal is to make evaluation results easy to aggregate and compare (per suite, dataset, example, evaluator, model/connector, and environment) and to support long-term trend analysis and regression detection.

**A key requirement is trace linkage**: each evaluation record should be able to reference the **evaluated interaction trace(s)** and (when applicable) **the judge trace**. Besides trace linkage, the model needs to capture metadata related to the evaluation experiment that was used for the LLM/agent interactions (e.g. evaluation dataset, example and experiment metadata)

The goal of the data model enables explainability ("why did this change?"), reproducibility ("what was evaluated?"), and confidence in comparisons across runs, without requiring each team to build custom analysis pipelines.

#### 5.2.3 Shared evaluation layer (the framework)

The shared evaluation layer is the reusable "evaluation engine" that ties the contract and the data model together. This is what effectively becomes @kbn/evals as a framework: it provides the common primitives, defaults and workflows for executing evaluators, and persisting results. Importantly, this layer should be independent of how an evaluation is triggered (CI/offline vs in-tool), so that evaluator behavior and stored results remain consistent across all use cases.

This component is where we centralize the hard parts: consistent run identity and metadata, trace-aware evaluation context, evaluator selection, and persistence. It is also the natural boundary for governance (naming conventions, and shared reporting hooks) without constraining solution teams from owning their suites and evaluation criteria.

#### 5.2.4 Evaluation entry points

Evaluation entry points are "ways to invoke" the shared evaluation layer. They are intentionally thin: their job is to translate an execution context into a request to the evaluation engine and to ensure the right metadata, trace pointers, and lifecycle behavior are provided.

**Orchestrator**

The orchestrator is the entrypoint for offline evaluations using existing mechanisms (Playwright/Scout suites). Its primary responsibility is to execute the evaluated tasks in a controlled environment, collect the trace pointers and required metadata, and hand the resulting evidence to the shared evaluation layer for scoring and persistence. This preserves current evaluation suite definitions while allowing us to replace Phoenix as the orchestrator backend.

**API**

The API entrypoint is the future-facing path to in-tool evaluation experiences. Instead of running a full offline suite, an API-driven workflow allows a user or system to evaluate based on trace information, using the same evaluator contract and persisting results using the same means as the above. This makes in-tool and offline evaluation outcomes directly comparable, because they are produced by the same shared evaluation layer.

This entrypoint should be treated as an incremental extension, not a parallel implementation: leveraging the same building blocks, and focusing on enabling interactive evaluation workflows within Kibana.

## Appendix 3. Knowledge-base/signal dataset management recommendations

| Dataset type / constraint | Recommendation | Explanation |
| :---- | :---- | :---- |
| Large, stable corpus (large text indices, long-lived data or noisy data streams) | Elasticsearch snapshot restore/replay (@kbn/es-snapshot-loader) | Recommended long-term option: fast, easy to use via CLI or in test hooks. |
| Experimental datasets (small, fast evolving content) | HuggingFace dataset loader or suite-owned ingestion scripts | Best for changing datasets and early-stage exploration. It becomes difficult to maintain once the environment needs many indices with larger volumes of data (especially data containing embeddings). |
| Synthetic observability signals (logs/traces/metrics) | Synthtrace/Scenario generators | Best when "ground truth" is the scenario definition itself. Supports repeated runs with consistent semantics and controlled variation. |
| Environment-constrained datasets (restricted data access, regulated content) | Pre-approved snapshot sources + access controls. | Prefer moving the data via controlled snapshot repositories over ad-hoc ingestion tooling. This is not yet a use case in existing evaluation suites, just an early consideration. |
