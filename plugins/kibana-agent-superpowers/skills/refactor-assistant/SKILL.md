# Refactor Assistant

**Purpose:** Guide systematic refactoring with safety checks, metrics, and test-driven validation.

**Trigger phrases:**
- "refactor this code"
- "improve code quality"
- "simplify this function"
- "extract this logic"
- "reduce duplication"
- "improve naming"
- Auto-trigger when function >100 LOC

---

## Core Protocol

### 1. Identify Refactoring Opportunities

Run static analysis to detect:
- **Code duplication:** Same logic in 2+ places (>10 lines)
- **Long functions:** >100 LOC
- **High complexity:** Cyclomatic complexity >10
- **Poor naming:** Unclear variable/function names (e.g., `data`, `temp`, `x`)
- **Large files:** >500 LOC with multiple responsibilities
- **Deep nesting:** >3 levels of indentation
- **God objects:** Classes/modules with >10 public methods

**Tools to use:**
```bash
# TypeScript complexity analysis
npx ts-complex path/to/file.ts

# ESLint complexity rules
node scripts/eslint --rule 'complexity: ["error", 10]' path/to/file.ts

# Duplication detection (jscpd)
npx jscpd path/to/directory --min-lines 10

# LOC counting
cloc path/to/file.ts
```

### 2. Suggest Refactoring Strategies

Based on findings, recommend:

| Issue | Refactoring | When to Apply |
|-------|-------------|---------------|
| Duplication | Extract function/utility | Same logic in 2+ places |
| Long function | Split into smaller functions | >100 LOC |
| Large component | Extract child components | React component >200 LOC |
| Poor naming | Rename for clarity | Names like `data`, `temp`, `handle` |
| Deep nesting | Early returns, guard clauses | >3 levels of indentation |
| High complexity | Split logic, extract conditions | Cyclomatic >10 |
| Large file | Split by responsibility | >500 LOC, multiple concerns |
| Magic numbers | Extract constants | Hardcoded values (not 0,1) |

**Prioritize:**
1. **Critical:** Duplication, high complexity (bugs hide here)
2. **High:** Long functions, poor naming (maintainability)
3. **Medium:** Large files, deep nesting (readability)
4. **Low:** Magic numbers, minor style issues

### 3. Safety Protocol (MANDATORY)

Never refactor without this sequence:

```bash
# STEP 1: Establish baseline
cd /Users/patrykkopycinski/Projects/kibana

# Run tests BEFORE refactoring
yarn test:jest path/to/file.test.ts
# Record output: "Baseline: X tests passed"

# Type check BEFORE refactoring
yarn test:type_check --project path/to/tsconfig.json
# Record output: "Baseline: 0 type errors"

# STEP 2: Create safety branch
git checkout -b refactor/description-of-change

# STEP 3: Apply refactoring
# ... make changes ...

# STEP 4: Verify no regression
yarn test:jest path/to/file.test.ts
# Must match baseline

yarn test:type_check --project path/to/tsconfig.json
# Must have 0 errors

node scripts/eslint --fix $(git diff --name-only)
# Fix any lint errors

# STEP 5: Run affected tests
node scripts/check_changes.ts
# Validates all affected code

# STEP 6: If tests fail
git bisect start
git bisect bad HEAD
git bisect good <commit-before-refactor>
# Find exact breaking commit, then fix or rollback

# STEP 7: Commit with metrics
git add .
git commit -m "refactor: <description>

Before:
- LOC: X
- Complexity: Y
- Duplication: Z%

After:
- LOC: A
- Complexity: B
- Duplication: C%

Tests: X passed (no regression)
"
```

**Rollback criteria:**
- Tests fail and can't be fixed in 30 minutes
- Type errors introduced
- Behavioral changes detected
- Coverage drops >5%

### 4. Refactoring Patterns

#### 4.1 Extract Function

**Before:**
```typescript
function processUserData(user: User) {
  // 50 lines of validation logic
  if (!user.email) throw new Error('Email required');
  if (!user.email.includes('@')) throw new Error('Invalid email');
  // ... more validation ...

  // 50 lines of transformation logic
  const normalized = {
    email: user.email.toLowerCase(),
    name: user.name.trim(),
    // ... more transforms ...
  };

  return normalized;
}
```

**After:**
```typescript
function processUserData(user: User) {
  validateUser(user);
  return normalizeUser(user);
}

function validateUser(user: User): void {
  if (!user.email) throw new Error('Email required');
  if (!user.email.includes('@')) throw new Error('Invalid email');
  // ... validation ...
}

function normalizeUser(user: User): NormalizedUser {
  return {
    email: user.email.toLowerCase(),
    name: user.name.trim(),
    // ... transforms ...
  };
}
```

#### 4.2 Extract React Component

**Before:**
```typescript
function Dashboard() {
  return (
    <div>
      {/* 100 lines of header JSX */}
      {/* 100 lines of sidebar JSX */}
      {/* 100 lines of content JSX */}
    </div>
  );
}
```

**After:**
```typescript
function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardSidebar />
      <DashboardContent />
    </div>
  );
}

function DashboardHeader() { /* ... */ }
function DashboardSidebar() { /* ... */ }
function DashboardContent() { /* ... */ }
```

#### 4.3 Simplify with Early Returns

**Before:**
```typescript
function calculateDiscount(user: User, amount: number): number {
  let discount = 0;
  if (user.isPremium) {
    if (amount > 100) {
      if (user.loyaltyYears > 5) {
        discount = 0.3;
      } else {
        discount = 0.2;
      }
    } else {
      discount = 0.1;
    }
  }
  return discount;
}
```

**After:**
```typescript
function calculateDiscount(user: User, amount: number): number {
  if (!user.isPremium) return 0;
  if (amount <= 100) return 0.1;
  if (user.loyaltyYears > 5) return 0.3;
  return 0.2;
}
```

#### 4.4 Rename for Clarity

**Before:**
```typescript
function handle(data: any) {
  const temp = data.x;
  const result = temp * 2;
  return result;
}
```

**After:**
```typescript
function calculateDoubledPrice(product: Product): number {
  const basePrice = product.price;
  const doubledPrice = basePrice * 2;
  return doubledPrice;
}
```

### 5. Metrics Collection

**Before refactoring, collect:**
```bash
# Lines of Code
cloc path/to/file.ts
# Record: "Before LOC: X"

# Cyclomatic complexity
npx ts-complex path/to/file.ts
# Record: "Before complexity: Y"

# Duplication percentage
npx jscpd path/to/directory
# Record: "Before duplication: Z%"

# Test coverage
yarn test:jest --coverage path/to/file.test.ts
# Record: "Before coverage: N%"
```

**After refactoring, collect same metrics:**
```bash
# Lines of Code
cloc path/to/file.ts
# Record: "After LOC: A"

# Cyclomatic complexity
npx ts-complex path/to/file.ts
# Record: "After complexity: B"

# Duplication percentage
npx jscpd path/to/directory
# Record: "After duplication: C%"

# Test coverage
yarn test:jest --coverage path/to/file.test.ts
# Record: "After coverage: M%"
```

**Success criteria:**
- ✅ LOC reduced by >10% (unless adding tests)
- ✅ Complexity reduced by >20%
- ✅ Duplication reduced by >50%
- ✅ Coverage maintained or improved
- ✅ All tests pass
- ✅ 0 type errors

### 6. Generate Refactoring PR

**PR Title:**
```
refactor: [scope] improve code quality - reduce complexity/duplication
```

**PR Description Template:**
```markdown
## Summary
Refactored [file/module] to improve maintainability and reduce complexity.

## Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines of Code | 456 | 312 | -31.6% ✅ |
| Cyclomatic Complexity | 18 | 8 | -55.6% ✅ |
| Duplication | 15.2% | 3.1% | -79.6% ✅ |
| Test Coverage | 87% | 89% | +2.3% ✅ |

## Changes Made

### Duplication Elimination
- Extracted `validateUser()` from 3 locations into shared utility
- Extracted `normalizeUser()` from 2 locations

### Complexity Reduction
- Split `processUserData()` (120 LOC) into 4 focused functions (<30 LOC each)
- Replaced nested conditionals with early returns
- Extracted complex conditions into named predicates

### Naming Improvements
- `data` → `userData`
- `handle()` → `processUserData()`
- `temp` → `basePrice`

## Safety Verification

✅ All tests pass (47/47)
✅ No type errors
✅ No behavioral changes
✅ Coverage maintained

**Test results:**
```
PASS src/core/user/process_user_data.test.ts
  ✓ validates required fields (12ms)
  ✓ normalizes email (8ms)
  ...
  47 passed, 0 failed
```

## Rollback Plan
If issues arise: `git revert <commit-sha>`

## Checklist
- [x] Baseline tests passed before refactoring
- [x] Metrics collected before/after
- [x] All tests pass after refactoring
- [x] Type check passes
- [x] Lint passes
- [x] `node scripts/check_changes.ts` passes
- [x] No behavioral changes
- [x] Coverage maintained or improved
```

### 7. Auto-Trigger Rules

When analyzing code, automatically suggest refactoring if:

1. **Function length >100 LOC:**
   > "⚠️ Function `processData()` is 156 LOC. Consider extracting logic into smaller functions. Run refactor-assistant?"

2. **Cyclomatic complexity >10:**
   > "⚠️ Function `calculatePrice()` has complexity 14. Consider simplifying with early returns. Run refactor-assistant?"

3. **Duplication detected:**
   > "⚠️ Found 3 instances of similar validation logic. Consider extracting shared utility. Run refactor-assistant?"

4. **Poor naming detected:**
   > "⚠️ Variables `data`, `temp`, `result` lack clarity. Consider renaming. Run refactor-assistant?"

5. **File >500 LOC:**
   > "⚠️ File is 687 LOC with 5 responsibilities. Consider splitting by concern. Run refactor-assistant?"

### 8. Safety Guardrails

**Never refactor:**
- Without baseline tests passing
- During incident response
- With uncommitted changes
- Generated code (e.g., Protobuf, GraphQL schemas)
- Third-party code (node_modules)
- Code without test coverage (<50%)

**Always ask before:**
- Changing public APIs (breaking changes)
- Refactoring critical path code (auth, payments)
- Large refactors (>10 files changed)
- Refactoring code you don't understand

**Rollback immediately if:**
- Tests fail after refactoring
- Type errors introduced
- Performance regression >10%
- Coverage drops >5%
- Can't explain behavioral equivalence

---

## Usage Examples

### Example 1: Simplify Complex Function
```
User: "This function is too complex, refactor it"
Agent:
1. Analyze complexity: 18 (threshold: 10) ❌
2. Identify issues: deep nesting, multiple responsibilities
3. Run baseline tests ✅
4. Apply refactoring: extract 3 functions, add early returns
5. Run tests again ✅
6. Collect metrics: complexity 18 → 6 (-67%) ✅
7. Generate PR with before/after metrics
```

### Example 2: Eliminate Duplication
```
User: "Remove duplication in these files"
Agent:
1. Detect duplication: 23% across 4 files
2. Run baseline tests ✅
3. Extract shared logic into `@kbn/user-utils`
4. Update imports in 4 files
5. Run tests ✅
6. Verify duplication: 23% → 2% (-91%) ✅
7. Generate PR showing duplication reduction
```

### Example 3: Extract React Components
```
User: "This component is too large"
Agent:
1. Analyze LOC: 387 (threshold: 200) ❌
2. Identify sections: Header (80 LOC), Sidebar (120 LOC), Content (187 LOC)
3. Run baseline tests ✅
4. Extract 3 child components
5. Run tests + Playwright snapshots ✅
6. Verify props typed correctly ✅
7. Generate PR with component tree diagram
```

---

## Integration with Other Skills

- **Pre-commit checks:** Use `kibana-precommit-checks` after refactoring
- **Test coverage:** Use `test-coverage-analyzer` to verify coverage maintained
- **CI babysitter:** Monitor CI after refactoring PR merged
- **Frontend design review:** For React component refactors

---

## Output Format

When refactoring is complete, provide:

```markdown
## Refactoring Complete ✅

**File:** `/Users/patrykkopycinski/Projects/kibana/src/core/user/process_user_data.ts`

### Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LOC | 156 | 98 | -37.2% |
| Complexity | 18 | 6 | -66.7% |
| Duplication | 15% | 0% | -100% |
| Coverage | 85% | 87% | +2.4% |

### Changes Applied
1. ✅ Extracted `validateUser()` (18 LOC)
2. ✅ Extracted `normalizeUser()` (22 LOC)
3. ✅ Simplified with early returns
4. ✅ Renamed `data` → `userData`, `temp` → `basePrice`

### Safety Verification
- ✅ Baseline tests: 47 passed
- ✅ After refactoring: 47 passed (0 regression)
- ✅ Type check: 0 errors
- ✅ Lint: 0 issues

### Next Steps
1. Review changes: `git diff`
2. Create PR: `gh pr create --title "refactor: improve user data processing" --body "..."`
3. Monitor CI: `/ci` after pushing

**PR description copied to clipboard** (paste when creating PR)
```

---

## References

- **TypeScript complexity:** [ts-complex](https://github.com/AlbertoFdzM/ts-complex)
- **Duplication detection:** [jscpd](https://github.com/kucherenko/jscpd)
- **ESLint complexity rules:** [complexity](https://eslint.org/docs/latest/rules/complexity)
- **Refactoring catalog:** [Refactoring Guru](https://refactoring.guru/refactoring/catalog)
- **Kibana validation:** `/Users/patrykkopycinski/Projects/kibana/.claude/CLAUDE.md`
