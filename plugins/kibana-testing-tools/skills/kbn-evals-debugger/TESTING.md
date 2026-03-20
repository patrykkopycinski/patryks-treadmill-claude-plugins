# Testing @kbn-evals-debugger

## Prerequisites

### 1. Start Kibana with evals plugin enabled

Add to `config/kibana.dev.yml`:
```yaml
xpack.evals.enabled: true

telemetry.enabled: true
telemetry.tracing.enabled: true
telemetry.tracing.sample_rate: 1
telemetry.tracing.exporters:
  - http:
      url: "http://localhost:4318/v1/traces"
```

### 2. Start EDOT collector

```bash
node scripts/edot_collector
```

### 3. Run an eval suite

```bash
cd x-pack/platform/packages/shared/agent-builder/kbn-evals-suite-agent-builder
node scripts/run_eval.js --suite <suite-name> --evaluation-connector-id <connector-id>
```

---

## Test Scenarios

### Scenario 1: Debug Failing Eval from Elasticsearch

```
User: "Debug the alert_triage eval - it's at 70% pass rate"

Expected behavior:
1. Skill queries Kibana evals API for recent runs
2. Fetches OTEL traces from Elasticsearch
3. Analyzes root causes from span attributes
4. Generates fixes
5. Re-runs and converges to 100%
```

### Scenario 2: Evaluator Reasoning

```
User: "The kb eval is failing - can you check if we're using the right evaluators?"

Expected behavior:
1. Skill analyzes eval.yaml evaluators
2. Infers task type from dataset examples
3. Reasons about evaluator appropriateness
4. Auto-swaps evaluator if mismatch detected
5. Re-runs with new evaluator
```

### Scenario 3: Threshold Calibration

```
User: "Calibrate thresholds for the product_documentation eval"

Expected behavior:
1. Skill fetches recent scores from Elasticsearch
2. Calculates mean and standard deviation
3. Applies conservative threshold (mean - 1σ)
4. Logs calibration to ~/.agents/threshold-calibrations.log
5. Suggests review when framework stabilizes
```

---

## Manual Testing Checklist

- [ ] Skill activates on "debug evals" trigger
- [ ] Successfully queries Kibana evals API
- [ ] Extracts skill.id from OTEL span attributes
- [ ] Extracts tool.name from tool call spans
- [ ] Correctly classifies root causes
- [ ] Generates appropriate fixes for each root cause type
- [ ] Applies fixes and verifies locally
- [ ] Converges after 2 clean 100% passes
- [ ] Logs conservative thresholds for future review
- [ ] Auto-swaps evaluators when task type mismatch detected

---

## Expected Outputs

### Success Case
```
✅ CONVERGED!

Initial pass rate: 70%
Final pass rate: 100%
Improvement: +30%
Iterations: 3

Threshold calibrations logged to ~/.agents/threshold-calibrations.log
```

### Escalation Case
```
⚠️ MAX ITERATIONS: Stopping after 5 passes

Final pass rate: 85%
Remaining issues:
- Example 7: EVALUATOR_LOGIC_ERROR (evaluator has bug, manual fix needed)

Manual intervention required.
```

---

## Integration with Other Skills

- **perform-agent-builder-eval** - Can trigger this skill after eval run completes
- **promotion-tracker** - Use after successful optimization to log evidence
- **ci-babysitter** - Can invoke this skill when CI eval job fails
