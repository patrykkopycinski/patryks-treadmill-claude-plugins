---
name: type-healer
description: Diagnose and fix TypeScript errors at their root cause (not band-aid @ts-ignore). Runs scoped type checks, categorizes errors by root cause, suggests specific fixes, applies them, and validates in convergence loops. Never suppresses errors - always fixes the underlying issue. Use for "fix type errors", "resolve TypeScript errors", "why is this type failing", "type check failed", or after CI type failures.
---

# Type Healer

**Mission:** Diagnose and fix TypeScript errors at their root cause. Zero tolerance for `@ts-ignore` or `@ts-expect-error` suppressions. Every error gets a proper fix or escalation with context.

## When to Use This Skill

### Primary Triggers
- "fix type errors"
- "resolve TypeScript errors"
- "why is this type failing"
- "type check failed"
- "heal types"
- "diagnose type issues"

### Integration Points
- **kibana-precommit-checks** - invoked during pre-commit validation
- **ci-babysitter GUARD mode** - part of pre-push validation
- **ci-guardian** - invoked after CI type failures
- **Manual debugging** - when user encounters type errors

### When NOT to Use
- User wants to suppress errors (refuse and explain why)
- Errors are intentional for documentation (extremely rare - escalate)
- Working in external library types (suggest type augmentation instead)

**Announce:** "I'm using type-healer to diagnose and fix TypeScript errors at their root cause."

## Prerequisites

- ✅ Kibana repository with TypeScript projects
- ✅ Access to `yarn test:type_check --project <tsconfig.json>`
- ✅ Access to `node scripts/eslint --fix`
- ✅ Changed files identified (for scoped checks)

## Core Workflow

```
┌────────────────────────────────────────────┐
│  1. Identify Affected tsconfig Projects    │
│  2. Run Scoped Type Check (MUST use        │
│     --project flag)                         │
│  3. Parse TypeScript Error Output          │
│  4. Categorize Root Causes                 │
│  5. For Each Error:                        │
│     ├─ Analyze Context                     │
│     ├─ Suggest Specific Fix                │
│     └─ Apply Fix                           │
│  6. Re-run Type Check                      │
│  7. Loop Until Clean (max 5 iterations)    │
│  8. Flag Unfixable Errors with Context     │
└────────────────────────────────────────────┘
```

## Phase 1: Identify Affected Projects

### Step 1a: Get Changed TypeScript Files

```bash
# Get all changed .ts/.tsx files (staged + unstaged + untracked)
CHANGED_TS=$(comm -23 \
  <(sort -u <(git diff --name-only HEAD; git diff --cached --name-only; git ls-files --others --exclude-standard) | grep -E '\.(tsx?|jsx?)$') \
  <(echo ""))

# If no TypeScript files changed, skip type check
if [ -z "$CHANGED_TS" ]; then
  echo "No TypeScript files changed. Skipping type check."
  exit 0
fi
```

### Step 1b: Find Owning tsconfig.json Projects

```bash
# For each changed file, walk up to find nearest tsconfig.json
PROJECTS=$(echo "$CHANGED_TS" | while read -r f; do
  dir=$(dirname "$f")
  while [ "$dir" != "." ] && [ "$dir" != "/" ]; do
    if [ -f "$dir/tsconfig.json" ]; then
      echo "$dir/tsconfig.json"
      break
    fi
    dir=$(dirname "$dir")
  done
done | sort -u)

# Projects is now a list of unique tsconfig.json files
echo "Affected projects:"
echo "$PROJECTS"
```

**Critical:** Always scope type checks to the affected projects. Never run `yarn test:type_check` without `--project` — it checks all 500+ TS projects and takes 10+ minutes.

## Phase 2: Run Scoped Type Check

### For Each Affected Project

```bash
for project in $PROJECTS; do
  echo "=== Type checking: $project ==="

  # CRITICAL: Always use --project flag for scoped check
  # On first run: generates tsconfig.type_check.json cache
  yarn test:type_check --project "$project" 2>&1 | tee type_check.log

  EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ No type errors in $project"
  else
    echo "✗ Type errors found in $project"
    # Capture errors for analysis
    cat type_check.log >> all_type_errors.log
  fi
done
```

### Fast Path: Direct tsc -b (Subsequent Runs)

After the first `yarn test:type_check --project ...` run, a `tsconfig.type_check.json` is generated. Use it for faster subsequent checks:

```bash
# Fast path (2-5x faster)
node_modules/typescript/bin/tsc -b x-pack/solutions/security/plugins/security_solution/tsconfig.type_check.json --pretty 2>&1 | tee type_check.log
```

**When to use fast path:**
- Second+ check in tight iteration loop (fix → check → fix → check)
- `tsconfig.type_check.json` already exists

**When to use yarn wrapper:**
- First check after branch switch or rebase
- Cache is stale (weird errors)
- Need to regenerate configs

## Phase 3: Parse TypeScript Error Output

### Error Format Examples

```
src/plugins/foo/index.ts(42,5): error TS2322: Type 'string' is not assignable to type 'number'.
src/plugins/bar/utils.ts(18,10): error TS2339: Property 'baz' does not exist on type 'Foo'.
src/plugins/baz/api.ts(25,15): error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'.
```

### Parse Errors into Structured Format

```typescript
interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;  // e.g., "TS2322"
  message: string;
  severity: 'error' | 'warning';
}

function parseTypeScriptErrors(output: string): TypeScriptError[] {
  const errors: TypeScriptError[] = [];

  // Regex: file(line,col): error TSxxxx: message
  const pattern = /^(.+?)\((\d+),(\d+)\): (error|warning) (TS\d+): (.+)$/gm;

  let match;
  while ((match = pattern.exec(output)) !== null) {
    errors.push({
      file: match[1],
      line: parseInt(match[2]),
      column: parseInt(match[3]),
      severity: match[4] as 'error' | 'warning',
      code: match[5],
      message: match[6],
    });
  }

  return errors;
}
```

## Phase 4: Categorize Root Causes

### Error Categories & Detection Patterns

| Category | TS Codes | Detection Pattern | Fix Strategy |
|----------|----------|-------------------|--------------|
| **Wrong Type Import** | TS2322, TS2339 | Import exists but wrong type used | Import correct type |
| **API Transport Mismatch** | TS2345, TS2322 | esClient vs Kibana route confusion | Use correct client/service |
| **Missing Generic Parameters** | TS2314, TS7031 | Generic type missing type args | Add type parameters |
| **Type Narrowing Needed** | TS2345, TS2322 | Union type passed to specific param | Add type guard/narrow |
| **Missing Property** | TS2339, TS2741 | Property doesn't exist on type | Add to interface or fix usage |
| **Incorrect Function Signature** | TS2554, TS2555 | Wrong number/type of arguments | Fix call or signature |
| **Implicit Any** | TS7006, TS7031 | No type annotation provided | Add explicit type |
| **Null/Undefined** | TS2532, TS2345 | Value possibly null/undefined | Add null check or non-null assertion (only if safe) |
| **Import Path Issue** | TS2307 | Module not found | Fix import path |
| **Circular Dependency** | TS2456 | Types depend on each other | Refactor to break cycle |

### Categorization Function

```typescript
function categorizeError(error: TypeScriptError): ErrorCategory {
  const { code, message, file } = error;

  // Category 1: Wrong Type Import
  if (code === 'TS2339' && message.includes("Property") && message.includes("does not exist")) {
    // Read file to check if import is present but wrong type
    return 'WRONG_TYPE_IMPORT';
  }

  // Category 2: API Transport Mismatch
  if ((code === 'TS2345' || code === 'TS2322') && (
    file.includes('esClient') || file.includes('kibana_route')
  )) {
    return 'API_TRANSPORT_MISMATCH';
  }

  // Category 3: Missing Generic Parameters
  if (code === 'TS2314' || (code === 'TS7031' && message.includes('generic'))) {
    return 'MISSING_GENERIC_PARAMS';
  }

  // Category 4: Type Narrowing Needed
  if ((code === 'TS2345' || code === 'TS2322') && message.includes("is not assignable to")) {
    return 'TYPE_NARROWING_NEEDED';
  }

  // Category 5: Missing Property
  if (code === 'TS2339' || code === 'TS2741') {
    return 'MISSING_PROPERTY';
  }

  // Category 6: Incorrect Function Signature
  if (code === 'TS2554' || code === 'TS2555') {
    return 'INCORRECT_FUNCTION_SIGNATURE';
  }

  // Category 7: Implicit Any
  if (code === 'TS7006' || code === 'TS7031') {
    return 'IMPLICIT_ANY';
  }

  // Category 8: Null/Undefined
  if (code === 'TS2532' || (code === 'TS2345' && message.includes('undefined'))) {
    return 'NULL_UNDEFINED';
  }

  // Category 9: Import Path Issue
  if (code === 'TS2307') {
    return 'IMPORT_PATH_ISSUE';
  }

  // Category 10: Circular Dependency
  if (code === 'TS2456') {
    return 'CIRCULAR_DEPENDENCY';
  }

  return 'UNKNOWN';
}
```

## Phase 5: Analyze Context & Suggest Fixes

### For Each Error: Deep Context Analysis

```typescript
async function analyzeErrorContext(error: TypeScriptError): Promise<FixSuggestion> {
  // 1. Read the file and surrounding lines
  const fileContent = await readFile(error.file);
  const lines = fileContent.split('\n');
  const errorLine = lines[error.line - 1];
  const context = lines.slice(
    Math.max(0, error.line - 5),
    Math.min(lines.length, error.line + 5)
  );

  // 2. Categorize the error
  const category = categorizeError(error);

  // 3. Generate fix based on category
  return suggestFix(error, category, context, fileContent);
}
```

### Fix Suggestion Strategies by Category

#### 1. Wrong Type Import

**Example Error:**
```
Property 'foo' does not exist on type 'Bar'.
```

**Analysis:**
```typescript
// Check if Bar is imported
const hasImport = fileContent.includes(`import { Bar }`);

// Check if correct type exists
const correctTypePattern = /interface Bar \{[\s\S]*?foo:/;

// Suggest fix
if (!hasImport) {
  return { fix: 'ADD_IMPORT', details: { type: 'Bar', from: '...' } };
} else {
  return { fix: 'USE_CORRECT_TYPE', details: { current: 'Bar', correct: 'BarWithFoo' } };
}
```

#### 2. API Transport Mismatch

**Example Error:**
```
Argument of type 'KibanaRequest' is not assignable to parameter of type 'TransportRequestOptions'.
```

**Analysis:**
```typescript
// Detect esClient usage with Kibana route
if (fileContent.includes('esClient.transport.request') && errorLine.includes('/api/') || errorLine.includes('/internal/')) {
  return {
    fix: 'WRONG_CLIENT',
    details: {
      issue: 'esClient cannot call Kibana HTTP routes',
      suggestion: 'Use coreStart.http.fetch() or a service client instead',
    }
  };
}
```

#### 3. Missing Generic Parameters

**Example Error:**
```
Generic type 'Promise' requires 1 type argument(s).
```

**Analysis:**
```typescript
// Extract generic type name
const genericTypeMatch = error.message.match(/Generic type '(\w+)'/);
const genericType = genericTypeMatch?.[1];

return {
  fix: 'ADD_GENERIC_PARAMS',
  details: {
    type: genericType,
    suggestion: `${genericType}<YourReturnType>`,
  }
};
```

#### 4. Type Narrowing Needed

**Example Error:**
```
Type 'string | number' is not assignable to type 'string'.
```

**Analysis:**
```typescript
// Extract source and target types
const typeMatch = error.message.match(/Type '(.+?)' is not assignable to type '(.+?)'/);
const sourceType = typeMatch?.[1];
const targetType = typeMatch?.[2];

return {
  fix: 'ADD_TYPE_GUARD',
  details: {
    sourceType,
    targetType,
    suggestion: `
// Add type guard before usage:
if (typeof value === 'string') {
  // Now value is narrowed to string
  useString(value);
}
    `.trim(),
  }
};
```

#### 5. Missing Property

**Example Error:**
```
Property 'baz' does not exist on type 'Foo'.
```

**Analysis:**
```typescript
// Check if property should exist or if wrong type is used
const propertyName = error.message.match(/Property '(\w+)'/)?.[1];
const typeName = error.message.match(/on type '(\w+)'/)?.[1];

// Read type definition
const typeDefMatch = fileContent.match(new RegExp(`interface ${typeName} \\{[\\s\\S]*?\\}`));

if (typeDefMatch) {
  return {
    fix: 'ADD_PROPERTY_TO_INTERFACE',
    details: {
      interface: typeName,
      property: propertyName,
      suggestion: `Add '${propertyName}' to interface '${typeName}'`,
    }
  };
} else {
  return {
    fix: 'USE_CORRECT_TYPE',
    details: {
      suggestion: `Type '${typeName}' may not be the correct type. Check if another interface has '${propertyName}'.`,
    }
  };
}
```

#### 6. Incorrect Function Signature

**Example Error:**
```
Expected 2 arguments, but got 3.
```

**Analysis:**
```typescript
// Extract function name and argument count
const functionMatch = errorLine.match(/(\w+)\(/);
const functionName = functionMatch?.[1];

return {
  fix: 'FIX_FUNCTION_CALL',
  details: {
    function: functionName,
    suggestion: 'Read the function signature to verify parameter order and types',
    action: 'READ_FUNCTION_DEFINITION',
  }
};
```

#### 7. Implicit Any

**Example Error:**
```
Parameter 'x' implicitly has an 'any' type.
```

**Analysis:**
```typescript
const paramName = error.message.match(/Parameter '(\w+)'/)?.[1];

return {
  fix: 'ADD_TYPE_ANNOTATION',
  details: {
    parameter: paramName,
    suggestion: `Add explicit type annotation: (${paramName}: YourType)`,
  }
};
```

#### 8. Null/Undefined

**Example Error:**
```
Object is possibly 'undefined'.
```

**Analysis:**
```typescript
// Check if value is from optional chain or nullable API
const valueMatch = errorLine.match(/(\w+)\??\./);
const valueName = valueMatch?.[1];

return {
  fix: 'ADD_NULL_CHECK',
  details: {
    value: valueName,
    suggestion: `
// Option 1: Add null check
if (${valueName} !== undefined) {
  // Safe to use ${valueName}
}

// Option 2: Use optional chaining
${valueName}?.property

// Option 3: Non-null assertion (ONLY if you're 100% sure)
${valueName}!.property
    `.trim(),
  }
};
```

#### 9. Import Path Issue

**Example Error:**
```
Cannot find module '../foo' or its corresponding type declarations.
```

**Analysis:**
```typescript
const modulePath = error.message.match(/Cannot find module '(.+?)'/)?.[1];

return {
  fix: 'FIX_IMPORT_PATH',
  details: {
    currentPath: modulePath,
    suggestion: 'Verify the module path and ensure the file exists',
    action: 'CHECK_FILE_EXISTS',
  }
};
```

#### 10. Circular Dependency

**Example Error:**
```
'Foo' is referenced directly or indirectly in its own type annotation.
```

**Analysis:**
```typescript
const typeName = error.message.match(/'(\w+)'/)?.[1];

return {
  fix: 'REFACTOR_TO_BREAK_CYCLE',
  details: {
    type: typeName,
    suggestion: `
Circular dependency detected. Options:
1. Extract shared types to a separate file
2. Use type aliases instead of interfaces
3. Use declaration merging
4. Forward-reference with type parameter
    `.trim(),
  }
};
```

## Phase 6: Apply Fixes

### Fix Execution Loop

```typescript
async function applyFixes(errors: TypeScriptError[]): Promise<FixResult[]> {
  const results: FixResult[] = [];

  for (const error of errors) {
    // 1. Analyze context
    const suggestion = await analyzeErrorContext(error);

    // 2. Apply fix based on category
    const result = await executeFix(error, suggestion);

    results.push(result);
  }

  return results;
}

async function executeFix(error: TypeScriptError, suggestion: FixSuggestion): Promise<FixResult> {
  const { file, line } = error;

  switch (suggestion.fix) {
    case 'ADD_IMPORT':
      return addImport(file, suggestion.details);

    case 'USE_CORRECT_TYPE':
      return replaceType(file, line, suggestion.details);

    case 'WRONG_CLIENT':
      return refactorClientUsage(file, line, suggestion.details);

    case 'ADD_GENERIC_PARAMS':
      return addGenericParams(file, line, suggestion.details);

    case 'ADD_TYPE_GUARD':
      return addTypeGuard(file, line, suggestion.details);

    case 'ADD_PROPERTY_TO_INTERFACE':
      return addPropertyToInterface(file, suggestion.details);

    case 'FIX_FUNCTION_CALL':
      // First, read function definition
      const functionDef = await readFunctionDefinition(suggestion.details.function);
      return fixFunctionCall(file, line, functionDef);

    case 'ADD_TYPE_ANNOTATION':
      return addTypeAnnotation(file, line, suggestion.details);

    case 'ADD_NULL_CHECK':
      return addNullCheck(file, line, suggestion.details);

    case 'FIX_IMPORT_PATH':
      return fixImportPath(file, line, suggestion.details);

    case 'REFACTOR_TO_BREAK_CYCLE':
      // Complex - may require manual intervention
      return { success: false, reason: 'Circular dependency requires manual refactoring', suggestion: suggestion.details.suggestion };

    default:
      return { success: false, reason: 'Unknown fix type' };
  }
}
```

### Example Fix Implementations

#### Add Import

```typescript
async function addImport(file: string, details: { type: string, from: string }): Promise<FixResult> {
  const content = await readFile(file);

  // Check if import already exists
  if (content.includes(`import { ${details.type} }`)) {
    return { success: false, reason: 'Import already exists' };
  }

  // Find import section (top of file, after initial comments)
  const lines = content.split('\n');
  let insertIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      insertIndex = i + 1;
    } else if (insertIndex > 0 && !lines[i].startsWith('import ')) {
      break;
    }
  }

  // Insert import
  lines.splice(insertIndex, 0, `import type { ${details.type} } from '${details.from}';`);

  await writeFile(file, lines.join('\n'));

  return { success: true, change: `Added import: ${details.type}` };
}
```

#### Replace Type

```typescript
async function replaceType(file: string, line: number, details: { current: string, correct: string }): Promise<FixResult> {
  const content = await readFile(file);
  const lines = content.split('\n');

  // Replace type on error line
  const errorLine = lines[line - 1];
  const updatedLine = errorLine.replace(
    new RegExp(`\\b${details.current}\\b`, 'g'),
    details.correct
  );

  if (errorLine === updatedLine) {
    return { success: false, reason: 'Type not found on line' };
  }

  lines[line - 1] = updatedLine;

  await writeFile(file, lines.join('\n'));

  return { success: true, change: `Replaced type: ${details.current} → ${details.correct}` };
}
```

#### Add Type Guard

```typescript
async function addTypeGuard(file: string, line: number, details: { sourceType: string, targetType: string, suggestion: string }): Promise<FixResult> {
  const content = await readFile(file);
  const lines = content.split('\n');

  // Extract variable name from error line
  const errorLine = lines[line - 1];
  const varMatch = errorLine.match(/(\w+)\./);
  if (!varMatch) {
    return { success: false, reason: 'Could not identify variable' };
  }

  const varName = varMatch[1];
  const indent = errorLine.match(/^(\s*)/)?.[1] || '';

  // Insert type guard before error line
  const typeGuard = [
    `${indent}if (typeof ${varName} === '${details.targetType}') {`,
    `${indent}  ${errorLine.trim()}`,
    `${indent}}`
  ];

  lines.splice(line - 1, 1, ...typeGuard);

  await writeFile(file, lines.join('\n'));

  return { success: true, change: `Added type guard for ${varName}` };
}
```

## Phase 7: Re-run Type Check & Loop

### Convergence Loop

```typescript
async function healTypes(projects: string[]): Promise<HealResult> {
  const MAX_ITERATIONS = 5;
  let iteration = 0;
  let allErrors: TypeScriptError[] = [];

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    console.log(`\n=== Type Healer: Iteration ${iteration}/${MAX_ITERATIONS} ===`);

    // Run type check on all affected projects
    const errors = await runTypeCheck(projects);

    if (errors.length === 0) {
      console.log('✅ All type errors resolved!');
      return {
        success: true,
        iterations: iteration,
        fixedErrors: allErrors.length,
      };
    }

    console.log(`Found ${errors.length} type error(s)`);
    allErrors = errors;

    // Analyze and fix errors
    const fixes = await applyFixes(errors);

    // Check if we made progress
    const successfulFixes = fixes.filter(f => f.success).length;

    if (successfulFixes === 0) {
      console.log('⚠️  No fixes could be applied automatically');
      break;
    }

    console.log(`Applied ${successfulFixes} fix(es)`);

    // Run ESLint to fix any formatting issues introduced by fixes
    await runEslint(projects);
  }

  // Max iterations reached or no progress
  return {
    success: false,
    iterations: iteration,
    remainingErrors: allErrors,
    reason: iteration >= MAX_ITERATIONS ? 'Max iterations reached' : 'No fixes could be applied',
  };
}
```

### Run Type Check

```bash
async function runTypeCheck(projects: string[]): Promise<TypeScriptError[]> {
  const allErrors: TypeScriptError[] = [];

  for (const project of projects) {
    const result = await execCommand(
      `yarn test:type_check --project ${project}`,
      { captureOutput: true }
    );

    if (result.exitCode !== 0) {
      const errors = parseTypeScriptErrors(result.stderr);
      allErrors.push(...errors);
    }
  }

  return allErrors;
}
```

### Run ESLint After Fixes

```bash
async function runEslint(projects: string[]): Promise<void> {
  // Get all files in affected projects
  const files: string[] = [];

  for (const project of projects) {
    const projectDir = path.dirname(project);
    const result = await execCommand(
      `git diff --name-only HEAD ${projectDir}`,
      { captureOutput: true }
    );

    files.push(...result.stdout.split('\n').filter(f => f));
  }

  if (files.length > 0) {
    await execCommand(
      `node scripts/eslint --fix ${files.join(' ')}`,
      { captureOutput: true }
    );
  }
}
```

## Phase 8: Escalation & Reporting

### Success Report

```
✅ Type Healer: SUCCESS!

Fixed all type errors in ${iterations} iteration(s)

Projects checked: ${projects.length}
Errors fixed: ${fixedErrors}
Changes made:
${changes.map(c => `  - ${c}`).join('\n')}

Type check: PASSING ✓
```

### Partial Success Report

```
⚠️  Type Healer: Partial Success

Fixed ${fixedErrors} errors, but ${remainingErrors.length} remain after ${iterations} iterations.

Remaining errors require manual intervention:
${remainingErrors.map(e => `
  ${e.file}:${e.line}:${e.column}
  ${e.code}: ${e.message}
  Category: ${categorizeError(e)}
  Suggestion: ${suggestFix(e).details.suggestion}
`).join('\n')}

Recommendation: Review these errors manually or escalate to a domain expert.
```

### Unfixable Error Report

```
❌ Type Healer: Manual Intervention Required

The following errors could not be fixed automatically:

${unfixableErrors.map(e => `
  File: ${e.file}:${e.line}
  Error: ${e.message}
  Category: ${categorizeError(e)}

  Why unfixable:
  ${e.reason}

  Suggested approach:
  ${e.suggestion}
`).join('\n')}

Next steps:
1. Review each error manually
2. Consult type definitions
3. Consider refactoring approach
4. Ask domain expert if needed
```

## Anti-Patterns (Never Do This)

❌ **Add @ts-ignore or @ts-expect-error** → Always fix the root cause

❌ **Cast to `any` or `unknown` without justification** → Narrow the type properly

❌ **Run unscoped type check** → Always use `--project` flag for speed

❌ **Skip ESLint after fixes** → Formatting issues will cause CI failures

❌ **Fix errors one at a time** → Batch fixes for efficiency

❌ **Keep going after 5 iterations** → If not fixed by then, escalate

❌ **Guess at types** → Read type definitions and understand context

❌ **Add non-null assertions liberally** → Only use when 100% certain

## Integration with Other Skills

### With kibana-precommit-checks

```typescript
// In kibana-precommit-checks workflow:

// Step 3: Run type check (delegated to type-healer)
const typeCheckResult = await invokeSkill('type-healer', {
  mode: 'pre-commit',
  projects: affectedProjects,
});

if (!typeCheckResult.success) {
  console.log('Type check failed. See errors above.');
  process.exit(1);
}
```

### With ci-babysitter GUARD Mode

```typescript
// In ci-babysitter GUARD mode:

// Priority 2: Fix type errors
if (hasTypeErrors) {
  const result = await invokeSkill('type-healer', {
    mode: 'guard',
    projects: affectedProjects,
  });

  if (result.success) {
    fixes.push('Type errors: resolved');
  } else {
    escalate('Could not fix type errors', result.remainingErrors);
  }
}
```

### With ci-guardian (Post-CI Failure)

```typescript
// In ci-guardian workflow:

// If CI failed due to type errors
if (ciFailure.category === 'TYPE_CHECK') {
  const result = await invokeSkill('type-healer', {
    mode: 'ci-recovery',
    projects: extractProjectsFromLogs(ciFailure.logs),
  });

  if (result.success) {
    // Commit and push fix
    commitAndPush(`fix(ci): resolve type errors\n\n${result.summary}`);
  } else {
    escalate('Type errors require manual intervention', result);
  }
}
```

## Usage Examples

### Example 1: Pre-Commit Check

```
User: "check types before commit"

Claude: "I'm using type-healer to check types in affected projects..."

[Runs type check]

✓ Type check passed for 2 projects
- x-pack/platform/plugins/shared/fleet/tsconfig.json
- src/platform/plugins/shared/dashboard/tsconfig.json

No type errors found.
```

### Example 2: Fix Type Errors

```
User: "fix type errors"

Claude: "I'm using type-healer to diagnose and fix TypeScript errors..."

=== Type Healer: Iteration 1/5 ===
Found 3 type error(s)

Error 1: src/plugins/foo/index.ts:42
  Property 'bar' does not exist on type 'Foo'
  Category: MISSING_PROPERTY
  Fix: Adding 'bar' to interface 'Foo'

Error 2: src/plugins/baz/api.ts:25
  Argument of type 'string' is not assignable to parameter of type 'number'
  Category: TYPE_NARROWING_NEEDED
  Fix: Adding type guard before function call

Error 3: src/plugins/qux/utils.ts:18
  Parameter 'x' implicitly has an 'any' type
  Category: IMPLICIT_ANY
  Fix: Adding type annotation

Applied 3 fix(es)
Running ESLint to fix formatting...

=== Type Healer: Iteration 2/5 ===
Found 0 type error(s)

✅ All type errors resolved!

Fixed 3 errors in 2 iterations
Type check: PASSING ✓
```

### Example 3: Escalation Needed

```
User: "fix type errors"

Claude: "I'm using type-healer to diagnose and fix TypeScript errors..."

=== Type Healer: Iteration 1/5 ===
Found 5 type error(s)
Applied 3 fix(es)

=== Type Healer: Iteration 2/5 ===
Found 2 type error(s)
Applied 0 fix(es)

⚠️  Type Healer: Manual Intervention Required

The following errors could not be fixed automatically:

File: src/plugins/foo/circular.ts:15
Error: 'Foo' is referenced directly or indirectly in its own type annotation
Category: CIRCULAR_DEPENDENCY

Why unfixable:
  Circular dependencies require architectural refactoring

Suggested approach:
  1. Extract shared types to a separate file
  2. Use type aliases instead of interfaces
  3. Use declaration merging
  4. Forward-reference with type parameter

File: src/plugins/bar/complex.ts:42
Error: Type 'ComplexUnion' is not assignable to type 'SpecificType'
Category: TYPE_NARROWING_NEEDED

Why unfixable:
  Complex union type requires domain knowledge to narrow correctly

Suggested approach:
  Review the type definition and add appropriate type guards based on business logic

Recommendation: Review these errors manually or escalate to a domain expert.
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `yarn test:type_check --project <tsconfig.json>` | Scoped type check (fast) |
| `node_modules/typescript/bin/tsc -b <tsconfig.type_check.json> --pretty` | Fast path after first run |
| `yarn test:type_check --clean-cache` | Clear cache and re-run |
| `node scripts/eslint --fix $(git diff --name-only)` | Fix formatting after type fixes |

## Success Metrics

- ✅ 100% type check pass rate after max 5 iterations
- ✅ Zero `@ts-ignore` or `@ts-expect-error` suppressions added
- ✅ All fixes are root cause fixes (not band-aids)
- ✅ Clear escalation reports with actionable suggestions
- ✅ Integration with pre-commit and CI workflows

## Future Enhancements

- Machine learning from past fixes (remember successful patterns)
- Auto-detect common Kibana-specific patterns
- Suggest interface refactoring when many properties are missing
- Detect and fix common migration issues (e.g., API changes)
- Generate type definitions for untyped external libraries
