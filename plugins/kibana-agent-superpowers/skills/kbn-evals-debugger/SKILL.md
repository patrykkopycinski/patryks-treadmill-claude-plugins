---
name: kbn-evals-debugger
description: End-to-end debugging and optimization for @kbn/evals framework suites. Auto-detects failures from Elasticsearch (OTEL traces) or LangSmith, pulls traces, identifies root causes (tool schema, prompt alignment, evaluator logic), reasons about evaluator choices, suggests fixes, runs adaptive audit loops (2 clean passes), auto-applies evaluator adjustments. Use when debugging @kbn/evals failures, improving pass rates, calibrating thresholds, analyzing traces, optimizing eval suites, or reviewing evaluator selection.
---

# @kbn/evals Debugger

**Mission:** Debug failing @kbn/evals suites through automated OTEL trace analysis, root cause identification, evaluator reasoning, fix generation, and adaptive optimization loops until 100% pass rate achieved.

**Framework Focus:** Specific to Kibana's @kbn/evals framework - uses OTEL traces from Elasticsearch, eval.yaml structure, and @kbn/evals evaluator patterns.

---

## When to Use This Skill

**Trigger phrases:**
- "debug evals"
- "why is this eval failing"
- "improve eval pass rate"
- "analyze eval traces"
- "calibrate eval thresholds"
- "optimize eval suite"
- "fix eval failures"

**Use when:**
- LangSmith shows failed eval runs
- CI eval job is red
- Pass rate dropped below threshold
- New evaluator added needs calibration
- Tool schema changes broke evals

**Don't use for:**
- Running evals (use eval runner directly)
- Creating new eval suites (use different workflow)
- Reviewing eval code quality (use code review)

**Announce:** "I'm using kbn-evals-debugger to analyze and fix eval failures through trace analysis and adaptive optimization."

---

## Prerequisites

- ✅ LangSmith MCP server configured
- ✅ Access to LangSmith project (e.g., "kbn-evals-agent-builder")
- ✅ Access to eval suite directory (x-pack/platform/packages/shared/kbn-evals-*/evals/)
- ✅ Optional: Buildkite MCP for CI integration

---

## Core Workflow

```
┌──────────────────────────────────────────────────────┐
│  1. Detect Failures (LangSmith or CI)                │
│  2. Pull Traces for Each Failed Example             │
│  3. Analyze Root Cause (skill, tools, schema)       │
│  4. Generate Fixes (prompt, schema, threshold)       │
│  5. Apply Fixes & Verify Locally                    │
│  6. Re-run Eval Suite                                │
│  7. Converged? (2 clean 100% passes)                │
│     ├─ YES → Generate Evidence & STOP               │
│     └─ NO → Repeat (max 5 iterations)               │
└──────────────────────────────────────────────────────┘
```

---

## Phase 1: Failure Detection

### Input Method 1: Elasticsearch (OTEL Traces) - PRIMARY

**Use Kibana evals plugin API to query scores and traces:**

```bash
# Query recent eval runs from Elasticsearch
curl -X GET "http://localhost:5601/internal/evals/runs?branch=main&limit=10"

# Get specific run details
RUN_ID="<run-id-from-scores>"
curl -X GET "http://localhost:5601/internal/evals/runs/${RUN_ID}"

# Get scores for the run
curl -X GET "http://localhost:5601/internal/evals/runs/${RUN_ID}/scores"

# Filter for failed examples (score < threshold)
failed_examples = scores.filter(s => s.evaluators.some(e => e.label === 'fail'))

# For each failed example, get OTEL trace
TRACE_ID="<trace-id-from-score>"
curl -X GET "http://localhost:5601/internal/evals/traces/${TRACE_ID}"
```

**Trace structure from ES (OTEL spans via Kibana API):**
```typescript
interface TraceResponse {
  trace_id: string;
  spans: TraceSpan[];
  total_spans: number;
  duration_ms: number;
}

interface TraceSpan {
  span_id: string;
  trace_id: string;
  parent_span_id?: string;
  name: string;                    // e.g., "LLM Call", "Tool: get_alerts"
  kind?: string;                   // e.g., "CLIENT", "INTERNAL"
  status?: string;                 // e.g., "OK", "ERROR"
  start_time: string;
  duration_ms: number;
  attributes: Record<string, unknown>;  // OTEL attributes (see extraction below)
}

// Extract @kbn/evals-specific data from OTEL span attributes
function extractEvalsData(spans: TraceSpan[]): EvalsTraceData {
  const llmSpans = spans.filter(s => s.name.includes('LLM') || s.attributes['gen_ai.request.model']);
  const toolSpans = spans.filter(s => s.name.startsWith('Tool:') || s.attributes['tool.name']);
  const skillSpans = spans.filter(s => s.attributes['skill.id']);

  return {
    skillActivated: skillSpans[0]?.attributes['skill.id'] as string || null,
    toolsCalled: toolSpans.map(s => s.attributes['tool.name'] as string || s.name.replace('Tool: ', '')),
    tokenUsage: {
      prompt: llmSpans.reduce((sum, s) => sum + (s.attributes['gen_ai.usage.prompt_tokens'] as number || 0), 0),
      completion: llmSpans.reduce((sum, s) => sum + (s.attributes['gen_ai.usage.completion_tokens'] as number || 0), 0),
    },
    duration: spans[0]?.duration_ms || 0,
    model: llmSpans[0]?.attributes['gen_ai.request.model'] as string,
  };
}
```

**How to query traces:**
```bash
# Method 1: Via Kibana evals API (requires Kibana running with xpack.evals.enabled: true)
curl -X GET "http://localhost:5601/internal/evals/traces/${TRACE_ID}"

# Method 2: Direct ES query (if Kibana API not available)
# Query traces-* index pattern with trace_id filter
```

### Input Method 2: LangSmith (Fallback)

```bash
# If OTEL traces not available, fall back to LangSmith
PROJECT="kbn-evals-agent-builder"
SUITE="security.alert_triage"

# Fetch recent runs
Use LangSmith MCP: fetch_runs
{
  "project_name": "$PROJECT",
  "limit": 10,
  "is_root": "true",
  "order_by": "-start_time"
}

# Filter for failed runs
runs.filter(r => r.error !== null || r.feedback_score < 1.0)
```

### Input Method 3: CI Logs

```bash
# Parse Buildkite or GitHub Actions logs
grep -E "FAILED|❌|Error" <ci-log>

# Extract failed examples
# Example format:
# ❌ security.alert_triage example 3/10 FAILED
#    Evaluator: tool_call_accuracy - Score: 0.6 (threshold: 0.8)
```

### Output: Failure Manifest

```json
{
  "suite_id": "security.alert_triage",
  "total_examples": 10,
  "failed_examples": [
    {
      "index": 3,
      "input": "Triage this alert...",
      "trace_id": "abc-123-def",
      "failed_evaluators": [
        {
          "name": "tool_call_accuracy",
          "score": 0.6,
          "threshold": 0.8,
          "label": "fail"
        }
      ]
    }
  ],
  "pass_rate": 0.70,
  "target_pass_rate": 1.0
}
```

---

## Phase 2: Trace Analysis

### For Each Failed Example

**Pull full trace from LangSmith:**

```typescript
// Use LangSmith MCP: get_thread_history
{
  "thread_id": "abc-123-def",
  "project_name": "kbn-evals-agent-builder",
  "page_number": 1
}

// Extract key data
interface TraceData {
  skillActivated: string | null;      // From run metadata
  toolsCalled: string[];              // From run steps (tool use blocks)
  tokenUsage: {
    prompt: number;
    completion: number;
  };
  duration: number;                   // milliseconds
  error: string | null;
}
```

### Root Cause Classification

```typescript
enum RootCause {
  SKILL_NOT_ACTIVATED = 'skill_not_activated',    // Expected skill didn't trigger
  WRONG_TOOLS_CALLED = 'wrong_tools',             // Different tools than expected
  TOOL_SCHEMA_TOO_COMPLEX = 'tool_schema',        // Schema validation failed
  THRESHOLD_TOO_STRICT = 'threshold',             // Score close to threshold (borderline)
  EVALUATOR_LOGIC_ERROR = 'evaluator',            // Evaluator itself has bug
  WRONG_EVALUATOR_CHOICE = 'evaluator_choice',    // Evaluator doesn't match task requirements
}

function diagnoseRootCause(trace: TraceData, expected: ExpectedBehavior, evaluators: Evaluator[]): RootCause {
  // Decision tree
  if (trace.skillActivated !== expected.skillId) {
    return RootCause.SKILL_NOT_ACTIVATED;
  }

  if (!arraysEqual(trace.toolsCalled, expected.tools)) {
    return RootCause.WRONG_TOOLS_CALLED;
  }

  // Check if evaluator makes sense for this task type
  if (!evaluatorMatchesTask(evaluators, trace.input)) {
    return RootCause.WRONG_EVALUATOR_CHOICE;
  }

  // Check if tool schema is complex
  if (hasComplexToolSchema(expected.tools)) {
    return RootCause.TOOL_SCHEMA_TOO_COMPLEX;
  }

  // Check if score is borderline (within 5% of threshold)
  if (Math.abs(trace.score - expected.threshold) < 0.05) {
    return RootCause.THRESHOLD_TOO_STRICT;
  }

  // Default: evaluator logic error
  return RootCause.EVALUATOR_LOGIC_ERROR;
}
```

### Expected Behavior Extraction

```typescript
// Parse eval suite YAML to get expected behavior
interface ExpectedBehavior {
  skillId: string;           // From dataset example metadata
  tools: string[];           // Expected tools to call
  threshold: number;         // From evaluator config
  adapter: 'plain-llm' | 'cursor-cli';
}

function parseExpectedBehavior(suiteYaml: string, exampleIndex: number): ExpectedBehavior {
  // Read evals/<suite>/eval.yaml
  // Extract dataset examples
  // Get expected skill and tools from example metadata
  // Get threshold from evaluator config
}
```

---

## Phase 3: Fix Generation

### Fix Strategy by Root Cause

| Root Cause | Fix Type | Target File | Action |
|------------|----------|-------------|--------|
| `skill_not_activated` | Prompt enhancement | SKILL.md | Strengthen description, add trigger examples |
| `wrong_tools` | Skill definition | SKILL.md | Add tool references, clarify usage |
| `tool_schema` | Schema simplification | tool definition | Reduce nesting, remove discriminated unions |
| `evaluator_choice` | Evaluator swap | eval.yaml | Replace with more appropriate evaluator |
| `threshold` | Threshold adjustment | eval.yaml | Conservative relaxation (track for future tightening) |
| `evaluator` | Evaluator fix | evaluator code | Fix logic bug in evaluator |

### Fix Implementation

#### Fix 1: Skill Prompt Enhancement

```typescript
// If skill_not_activated
function enhanceSkillPrompt(skillFile: string, failedInput: string): Edit {
  // Read SKILL.md
  // Analyze why input didn't trigger skill
  // Extract keywords from failed input
  // Add to description or trigger examples

  return {
    file: skillFile,
    section: 'description',
    addition: `Triggers on: "${extractKeywords(failedInput).join('", "')}"`
  };
}
```

#### Fix 2: Tool Schema Simplification

```typescript
// If tool_schema_too_complex
function simplifyToolSchema(toolFile: string): Edit {
  // Read tool schema
  // Identify complexity issues:
  //   - Discriminated unions with >4 variants
  //   - Nesting depth >3
  //   - Required parameters >6

  // Simplification strategies:
  //   - Split discriminated union into separate tools
  //   - Flatten nested objects
  //   - Make parameters optional with defaults
  //   - Use simpler types (string instead of enum)

  return { file: toolFile, changes: [...] };
}
```

#### Fix 3: Evaluator Reasoning & Auto-Adjustment

```typescript
// If evaluator_choice is wrong
interface EvaluatorReasoning {
  currentEvaluator: string;
  taskType: 'tool_calling' | 'text_generation' | 'classification' | 'retrieval';
  isAppropriate: boolean;
  recommendedEvaluator?: string;
  reason: string;
}

function reasonAboutEvaluator(evalYaml: string, example: Example): EvaluatorReasoning {
  const taskType = inferTaskType(example.input, example.expected_output);
  const currentEvaluators = parseEvaluators(evalYaml);

  // Evaluator matching logic for @kbn/evals
  const evaluatorRules = {
    tool_calling: ['tool_call_accuracy', 'tool_selection', 'parameter_accuracy'],
    text_generation: ['answer_relevance', 'answer_correctness', 'answer_similarity'],
    classification: ['label_accuracy', 'multi_label_f1'],
    retrieval: ['context_recall', 'context_precision', 'context_relevance'],
  };

  const appropriate = currentEvaluators.some(e =>
    evaluatorRules[taskType].includes(e.name)
  );

  if (!appropriate) {
    return {
      currentEvaluator: currentEvaluators[0].name,
      taskType,
      isAppropriate: false,
      recommendedEvaluator: evaluatorRules[taskType][0],
      reason: `Task is ${taskType} but evaluator ${currentEvaluators[0].name} is for different task type`,
    };
  }

  return { currentEvaluator: currentEvaluators[0].name, taskType, isAppropriate: true, reason: 'Evaluator matches task type' };
}

// Auto-apply evaluator change
function applyEvaluatorChange(evalYaml: string, reasoning: EvaluatorReasoning): Edit {
  // Read eval.yaml
  // Replace evaluator in evaluators list
  // Update threshold to default for new evaluator

  return {
    file: evalYaml,
    section: 'evaluators',
    oldValue: reasoning.currentEvaluator,
    newValue: reasoning.recommendedEvaluator,
    reason: reasoning.reason,
  };
}
```

#### Fix 4: Threshold Calibration (Conservative)

```typescript
// If threshold_too_strict
function calibrateThreshold(evalYaml: string, evaluatorName: string, scores: number[]): Edit {
  // Calculate statistics from scores
  const mean = scores.reduce((a, b) => a + b) / scores.length;
  const stdDev = Math.sqrt(scores.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / scores.length);

  // CONSERVATIVE calibration (early @kbn/evals maturity)
  // Set threshold at mean - 1.0*stdDev (allows significant variance)
  // This prevents false positives while framework is maturing
  const newThreshold = Math.max(0.6, mean - 1.0 * stdDev);

  // Track calibration for future tightening
  const calibrationNote = `
⚠️  CONSERVATIVE CALIBRATION APPLIED

This threshold has been set conservatively (mean - 1σ) during early @kbn/evals maturity.

Mean: ${mean.toFixed(3)}
StdDev: ${stdDev.toFixed(3)}
Threshold: ${newThreshold.toFixed(3)}

TODO: After @kbn/evals framework stabilizes:
- Tighten to mean - 0.5σ to catch regressions earlier
- Monitor for 30 days at current threshold first
- Review score distribution before tightening

Track this calibration in: ~/.agents/threshold-calibrations.log
  `.trim();

  // Log calibration for future review
  appendToFile('~/.agents/threshold-calibrations.log', `
${new Date().toISOString()} - ${evaluatorName}
Suite: ${extractSuiteId(evalYaml)}
Mean: ${mean.toFixed(3)}, StdDev: ${stdDev.toFixed(3)}
Threshold: ${getCurrentThreshold(evalYaml, evaluatorName)} → ${newThreshold.toFixed(3)}
Strategy: Conservative (mean - 1σ)
Review: When framework stabilizes
  `.trim());

  return {
    file: evalYaml,
    evaluator: evaluatorName,
    field: 'threshold',
    oldValue: getCurrentThreshold(evalYaml, evaluatorName),
    newValue: newThreshold,
    reason: calibrationNote,
  };
}
```

---

## Phase 4: Fix Application & Local Verification

### Apply All Fixes

```bash
# Apply each fix using Edit tool
for fix in fixes:
  Edit(file=fix.file, old_string=fix.old, new_string=fix.new)

# Commit fixes
git add .
git commit -m "fix(evals): apply root cause fixes from trace analysis

Root causes addressed:
- ${list root causes}

Fixes applied:
- ${list fixes}

Applied by kbn-evals-debugger

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

### Local Verification

```bash
# Re-run eval suite locally (if possible)
cd x-pack/platform/packages/shared/kbn-evals-suite-agent-builder

# Run specific suite
node scripts/run_eval.js --suite security.alert_triage

# Parse output for new pass rate
# If improved: continue
# If worse: rollback and try different fix
```

---

## Phase 5: Adaptive Audit Loop

### Convergence Protocol

Based on `smart-audit-loops.md`:

```typescript
interface AuditState {
  iteration: number;
  maxIterations: number;      // = 5
  passRateHistory: number[];  // [0.70, 0.85, 1.0, 1.0]
  cleanStreak: number;         // consecutive 100% passes
  converged: boolean;
}

function checkConvergence(state: AuditState, newPassRate: number): AuditState {
  state.iteration++;
  state.passRateHistory.push(newPassRate);

  // Update clean streak
  if (newPassRate === 1.0) {
    state.cleanStreak++;
  } else {
    state.cleanStreak = 0;
  }

  // Convergence conditions
  if (state.cleanStreak >= 2) {
    state.converged = true;
    console.log('✅ CONVERGED: 2 consecutive 100% pass rates');
  } else if (state.iteration >= state.maxIterations) {
    console.log('⚠️  MAX ITERATIONS: Stopping after 5 passes');
  }

  return state;
}
```

### Loop Execution

```bash
# Initialize
ITERATION=0
MAX_ITERATIONS=5
CLEAN_STREAK=0
PASS_RATE_HISTORY=()

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))

  echo "=== Iteration $ITERATION/$MAX_ITERATIONS ==="

  # Re-run eval suite
  PASS_RATE=$(run_eval_and_get_pass_rate)
  PASS_RATE_HISTORY+=($PASS_RATE)

  # Check if 100%
  if [ "$PASS_RATE" = "1.0" ]; then
    CLEAN_STREAK=$((CLEAN_STREAK + 1))
    echo "✓ Pass rate: 100% (clean streak: $CLEAN_STREAK/2)"
  else
    CLEAN_STREAK=0
    echo "⚠️  Pass rate: $(echo "$PASS_RATE * 100" | bc)% (not clean yet)"
  fi

  # Check convergence
  if [ $CLEAN_STREAK -ge 2 ]; then
    echo "✅ CONVERGED: 2 consecutive 100% passes"
    break
  fi

  # If not converged and not 100%, analyze and fix again
  if [ "$PASS_RATE" != "1.0" ]; then
    echo "Analyzing remaining failures..."
    # Pull traces for still-failing examples
    # Generate fixes
    # Apply fixes
  fi
done

# Final report
echo "=== Final Results ==="
echo "Iterations: $ITERATION"
echo "Pass rate history: ${PASS_RATE_HISTORY[@]}"
echo "Final pass rate: ${PASS_RATE_HISTORY[-1]}"
```

---

## Implementation Details

### Tool Schema Complexity Analyzer

Based on `eval-adapter-strategy.md`:

```typescript
interface SchemaComplexity {
  discriminatedUnionVariants: number;  // >4 is complex
  nestingDepth: number;                // >3 is complex
  requiredParams: number;              // >6 is complex
  totalParams: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

function analyzeSchemaComplexity(toolSchema: object): SchemaComplexity {
  let variants = 0;
  let depth = 0;
  let requiredParams = 0;

  function traverse(obj: any, currentDepth: number) {
    depth = Math.max(depth, currentDepth);

    if (obj.oneOf || obj.anyOf) {
      variants = Math.max(variants, (obj.oneOf || obj.anyOf).length);
    }

    if (obj.properties) {
      Object.values(obj.properties).forEach(prop =>
        traverse(prop, currentDepth + 1)
      );
    }

    if (obj.required) {
      requiredParams += obj.required.length;
    }
  }

  traverse(toolSchema, 0);

  // Complexity determination
  const isComplex = variants > 4 || depth > 3 || requiredParams > 6;
  const complexity = isComplex ? 'complex' : (variants > 2 || depth > 2 ? 'moderate' : 'simple');

  return { discriminatedUnionVariants: variants, nestingDepth: depth, requiredParams, totalParams: countParams(toolSchema), complexity };
}
```

### Evaluator Reasoning Engine

```typescript
/**
 * Reasons about whether evaluators in eval.yaml make sense for the task
 * Based on @kbn/evals evaluator catalog and task type inference
 */

interface TaskTypeInference {
  type: 'tool_calling' | 'text_generation' | 'classification' | 'retrieval' | 'mixed';
  confidence: number;
  indicators: string[];  // What in the input/output indicates this type
}

function inferTaskType(input: string, expectedOutput: any): TaskTypeInference {
  const indicators = [];
  let type: TaskTypeInference['type'] = 'text_generation';

  // Check for tool calling indicators
  if (expectedOutput.tools || expectedOutput.tool_calls) {
    indicators.push('Expected output specifies tools');
    type = 'tool_calling';
  }

  // Check input for tool-requiring phrases
  const toolPhrases = ['analyze', 'fetch', 'search', 'get data', 'query', 'retrieve'];
  if (toolPhrases.some(phrase => input.toLowerCase().includes(phrase))) {
    indicators.push(`Input contains tool-requiring phrase: ${toolPhrases.find(p => input.toLowerCase().includes(p))}`);
    if (type !== 'tool_calling') type = 'mixed';
  }

  // Check for classification indicators
  if (expectedOutput.category || expectedOutput.label || expectedOutput.class) {
    indicators.push('Expected output is a label/category');
    type = 'classification';
  }

  // Check for retrieval indicators
  if (expectedOutput.documents || expectedOutput.retrieved) {
    indicators.push('Expected output is retrieved documents');
    type = 'retrieval';
  }

  const confidence = indicators.length >= 2 ? 0.9 : (indicators.length === 1 ? 0.7 : 0.5);

  return { type, confidence, indicators };
}

function evaluatorMatchesTask(evaluators: Evaluator[], taskType: TaskTypeInference): boolean {
  // @kbn/evals evaluator catalog
  const evaluatorTypeMap = {
    tool_calling: [
      'tool_call_accuracy',        // Did it call the right tools?
      'tool_selection',            // Did it select appropriate tools?
      'parameter_accuracy',        // Were parameters correct?
      'tool_sequence',             // Were tools called in right order?
    ],
    text_generation: [
      'answer_relevance',          // Is answer relevant to question?
      'answer_correctness',        // Is answer factually correct?
      'answer_similarity',         // Does it match expected output?
      'hallucination_detection',   // Did it hallucinate?
    ],
    classification: [
      'label_accuracy',            // Correct label assigned?
      'multi_label_f1',            // F1 score for multi-label
      'precision_recall',          // Precision/recall metrics
    ],
    retrieval: [
      'context_recall',            // Retrieved all relevant docs?
      'context_precision',         // No irrelevant docs retrieved?
      'context_relevance',         // Docs are relevant?
    ],
  };

  const appropriateEvaluators = evaluatorTypeMap[taskType.type] || [];

  return evaluators.some(e => appropriateEvaluators.includes(e.name));
}

function recommendEvaluatorReplacement(current: Evaluator[], taskType: TaskTypeInference): string {
  const evaluatorTypeMap = { /* same as above */ };
  const appropriate = evaluatorTypeMap[taskType.type] || [];

  // Return most specific evaluator for task type
  return appropriate[0];
}

// Auto-apply evaluator change to eval.yaml
function swapEvaluator(evalYaml: string, oldEvaluator: string, newEvaluator: string): Edit {
  // Read eval.yaml
  // Find evaluator in evaluators list
  // Replace with new evaluator
  // Set default threshold for new evaluator (conservative)

  const defaultThresholds = {
    tool_call_accuracy: 0.85,     // Conservative for early maturity
    answer_relevance: 0.75,
    label_accuracy: 0.80,
    context_recall: 0.70,
  };

  return {
    file: evalYaml,
    changes: [
      { field: 'evaluators[0].name', oldValue: oldEvaluator, newValue: newEvaluator },
      { field: 'evaluators[0].threshold', newValue: defaultThresholds[newEvaluator] || 0.75 },
    ],
    reason: `Swapped evaluator to match task type: ${taskType.type}`,
  };
}
```

#### Fix 4: Threshold Calibration (Conservative with Tracking)

## Example Session

### User Request

```
User: "My alert_triage eval is at 70% pass rate, can you debug and fix it?"
```

### Agent Response

```
Using kbn-evals-debugger to analyze and optimize alert_triage eval suite...

=== Phase 1: Failure Detection ===
Querying Elasticsearch for recent eval runs via Kibana evals API...
GET http://localhost:5601/internal/evals/runs?suite=security.alert_triage&limit=5

Found recent run:
- Run ID: run_abc123
- Suite: security.alert_triage
- Examples: 10 total, 3 failed
- Pass rate: 70% (target: 100%)
- Failed examples: 3, 5, 8

Getting scores for failed examples...
GET http://localhost:5601/internal/evals/runs/run_abc123/scores

=== Phase 2: OTEL Trace Analysis ===
Pulling OTEL traces from Elasticsearch for failed examples...

Example 3 (trace abc-123):
  GET /internal/evals/traces/abc-123
  Analyzing 47 OTEL spans...

  Extracted data:
    - Skill activated: security.alert_triage ✓
    - Tools called: [get_alerts, analyze_alert] (from span attributes)
    - Expected tools: [get_alerts, analyze_alert, update_alert_status]
    - Missing: update_alert_status ❌

  Root cause: WRONG_TOOLS_CALLED (skill didn't call all required tools)

Example 5 (trace def-456):
  GET /internal/evals/traces/def-456
  Analyzing 32 OTEL spans...

  Extracted data:
    - Skill activated: null ❌
    - LLM spans: 3 (no skill attribute found)
    - Expected skill: security.alert_triage

  Root cause: SKILL_NOT_ACTIVATED (description didn't trigger skill)

Example 8 (trace ghi-789):
  GET /internal/evals/traces/ghi-789
  Analyzing 51 OTEL spans...

  Extracted data:
    - Skill activated: security.alert_triage ✓
    - Tools called: [get_alerts, analyze_alert, update_alert_status] ✓
    - Evaluator score: 0.78 (threshold: 0.8)
    - Delta: -0.02 (borderline)

  Reasoning about evaluator choice...
    - Task type: tool_calling (high confidence, tools expected in output)
    - Current evaluator: answer_similarity
    - Appropriate for tool_calling? NO ❌
    - Recommended: tool_call_accuracy

  Root cause: WRONG_EVALUATOR_CHOICE (using text evaluator for tool task)

=== Phase 3: Fix Generation ===
Generated 3 fixes:

1. Example 3 - Add tool call guidance to SKILL.md
   Root cause: WRONG_TOOLS_CALLED
   Target: .agents/skills/security/alert_triage/SKILL.md
   Change: Add explicit instruction to call update_alert_status after analysis

2. Example 5 - Enhance skill description
   Root cause: SKILL_NOT_ACTIVATED
   Target: .agents/skills/security/alert_triage/SKILL.md
   Change: Add trigger phrase "triage this alert" to description

3. Example 8 - Swap evaluator (AUTO-APPLY)
   Root cause: WRONG_EVALUATOR_CHOICE
   Target: evals/security.alert_triage/eval.yaml
   Change: Replace evaluator answer_similarity → tool_call_accuracy
   Reason: Task is tool_calling but using text generation evaluator
   New threshold: 0.85 (conservative default for tool_call_accuracy)

=== Phase 4: Applying Fixes ===
✓ Updated SKILL.md with tool call guidance
✓ Enhanced skill description with trigger phrase
✓ Swapped evaluator: answer_similarity → tool_call_accuracy (threshold: 0.85)
✓ Committed fixes
✓ Logged threshold calibration to ~/.agents/threshold-calibrations.log

=== Phase 5: Re-running Eval (Iteration 1) ===
Running: node scripts/run_eval.js --suite security.alert_triage

Results:
- Pass rate: 90% (9/10 passed)
- Improvement: +20%
- Still failing: Example 3 (different issue)

Analyzing example 3 again...
Root cause: Tool schema too complex (discriminated union with 6 variants)
Fix: Simplify update_alert_status schema, reduce to 3 variants
Applying fix and re-running...

=== Phase 6: Re-running Eval (Iteration 2) ===
Results:
- Pass rate: 100% ✓
- Clean streak: 1/2

=== Phase 7: Re-running Eval (Iteration 3) ===
Results:
- Pass rate: 100% ✓
- Clean streak: 2/2

✅ CONVERGED!

=== Final Summary ===
Initial pass rate: 70%
Final pass rate: 100%
Improvement: +30%
Iterations: 3

Root causes fixed:
  - SKILL_NOT_ACTIVATED (1) - Enhanced skill description
  - WRONG_TOOLS_CALLED (1) - Added tool call guidance to SKILL.md
  - WRONG_EVALUATOR_CHOICE (1) - Swapped to appropriate evaluator
  - TOOL_SCHEMA_TOO_COMPLEX (1) - Simplified schema

Threshold calibrations applied:
  - tool_call_accuracy: 0.85 (conservative, logged for future review when framework stabilizes)

✅ security.alert_triage eval suite is now at 100% pass rate with 2 consecutive clean runs.

Note: Use promotion-tracker skill to generate evidence entry from this work.
```

---

## Anti-Patterns (Don't Do This)

❌ **Fix without analyzing OTEL traces** → Guessing wastes iterations
❌ **Use @ts-ignore or suppressions** → Masks root causes
❌ **Adjust threshold without reasoning about evaluator** → Wrong evaluator is worse than wrong threshold
❌ **Make threshold too aggressive early** → Framework is maturing, be conservative (track for future tightening)
❌ **Continue past 5 iterations** → Escalate to user if not converging
❌ **Skip local verification** → Fixes might work in isolation but break in CI
❌ **Ignore task type when choosing evaluators** → Tool tasks need tool evaluators, text tasks need text evaluators

---

## Success Criteria

### Per-Session Metrics
- Pass rate improvement: ≥10%
- Time to 100%: <60 minutes
- Iterations needed: ≤5
- Root cause accuracy: ≥90%

### Long-Term Metrics
- Eval suite reliability: Maintained at 95%+ for 30 days
- Framework dogfooding: Evals catch 100% of breaking changes
- Team adoption: Downstream teams use evals confidently

---

## Dependencies & Integration

### Required Infrastructure
- **Kibana evals plugin** - GET /internal/evals/runs, /traces/{traceId}
- **Elasticsearch** - OTEL traces stored with @kbn/evals framework
- **LangSmith MCP** (fallback) - fetch_runs, get_thread_history, list_projects

### Required Skills
- None (self-contained)

### Required Rules
- `eval-conventions.md` - @kbn/evals suite structure and evaluator catalog
- `smart-audit-loops.md` - Convergence protocol (2 clean passes)
- `eval-terminology.md` - @kbn/evals-specific terminology

### Output Files
- Modified SKILL.md files
- Modified eval.yaml files
- Modified tool schema files
- Promotion evidence entry

---

## Future Enhancements

1. **Parallel trace analysis** - Analyze all failures concurrently
2. **Fix confidence scoring** - Predict fix success probability
3. **Historical learning** - Remember successful fix patterns
4. **Batch threshold calibration** - Calibrate all evaluators at once
5. **Integration with eval runner** - Auto-trigger debug after failed run
6. **Visualization** - Pass rate trend charts, root cause distribution
7. **Threshold tightening (future)** - After framework matures, tighten thresholds from conservative (mean - 1σ) to aggressive (mean - 0.5σ) to catch regressions earlier
8. **Evaluator performance tracking** - Track which evaluators have highest false positive/negative rates
