---
name: qa-browser-verification
description: Verify implemented functionality works correctly by opening the app in a browser, interacting with UI elements, and checking expected behaviors. Use after implementing features, fixing bugs, or when the user asks to verify, test, or QA something in the browser.
---

# QA Browser Verification

Systematically verify that implemented functionality works as expected by interacting with the live application in the browser.

## When to Use

- After implementing a feature or fixing a bug
- When the user says "verify", "test it", "check if it works", "QA this"
- Before claiming work is complete (pairs with verification-before-completion)

## Prerequisites

Before starting verification:
1. Ensure the dev server is running (check terminals or start it)
2. Know the URL to test (typically `localhost:PORT`)
3. Know what functionality to verify (from the task or recent changes)

## Verification Process

### Step 1: Plan Test Scenarios

Before touching the browser, create a checklist of what to verify:

```
QA Verification:
- [ ] Page loads without errors
- [ ] Target feature is visible/accessible
- [ ] Happy path works end-to-end
- [ ] Edge cases handled (empty state, error state, loading state)
- [ ] Console has no errors/warnings related to changes
- [ ] Responsiveness (if applicable)
```

Use TodoWrite to track these items.

### Step 2: Navigate and Capture Baseline

```
1. browser_navigate → target URL (with take_screenshot_afterwards: true)
2. browser_console_messages → check for pre-existing errors
3. browser_snapshot → get page structure and interactive elements
```

**Wait strategy**: After navigation, use short waits (1-3s) with snapshot checks rather than long waits. Proceed as soon as content is loaded.

### Step 3: Interact and Verify

For each test scenario:

```
1. browser_snapshot → identify target elements by ref
2. browser_click / browser_fill / browser_type → perform the action
3. Wait 1-2s for response
4. browser_snapshot (with includeDiff: true) → verify page changed as expected
5. browser_take_screenshot → capture evidence
6. browser_console_messages → check for errors
```

**Lock/unlock protocol**:
- `browser_navigate` first (creates tab)
- `browser_lock` before interactions
- `browser_unlock` when completely done with ALL verification

### Step 4: Record Results

For each scenario, record:
- **Action taken**: What you clicked/typed/submitted
- **Expected result**: What should happen
- **Actual result**: What actually happened (from snapshot/screenshot)
- **Status**: PASS / FAIL / BLOCKED
- **Evidence**: Screenshot filename or snapshot excerpt

### Step 5: Report

Present findings in a structured format:

```markdown
## QA Verification Report

**URL**: http://localhost:3007/path
**Date**: YYYY-MM-DD
**Feature**: [feature name]

| # | Scenario | Expected | Actual | Status |
|---|----------|----------|--------|--------|
| 1 | Page loads | Shows feature UI | Feature UI visible | PASS |
| 2 | Submit form | Success message | Error: 500 | FAIL |
| 3 | Empty input | Validation error | Validation shown | PASS |

### Failures
- **#2**: API returns 500 when submitting. Console shows: `POST /api/submit 500`.

### Screenshots
- `page-baseline.png` - Initial page load
- `page-after-submit.png` - After form submission
```

## Common Verification Patterns

### Form Submission
1. Navigate to form
2. Snapshot to find input refs
3. Fill each field with `browser_fill`
4. Click submit button
5. Verify success state or error handling

### Navigation/Routing
1. Click navigation links
2. Verify URL changes (check snapshot for active route indicators)
3. Verify correct content loads
4. Test back/forward navigation

### Data Display
1. Navigate to data view
2. Verify data renders (check snapshot for expected elements)
3. Test sorting/filtering if applicable
4. Test pagination

### Error Handling
1. Trigger error conditions (invalid input, network errors)
2. Verify error messages display correctly
3. Verify recovery (can user try again?)

### Loading States
1. Trigger async operations
2. Check for loading indicators (spinner, skeleton)
3. Verify content replaces loading state

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Skip console error check | Always check `browser_console_messages` |
| Take only screenshots | Use `browser_snapshot` for structure + screenshots for evidence |
| Test only happy path | Include at least one error/edge case |
| Assume page is loaded | Wait + snapshot check before interacting |
| Forget to unlock browser | Always `browser_unlock` when done |
| Run all checks without reporting | Report incrementally as you find issues |

## Integration with Other Skills

- **verification-before-completion**: QA verification IS the verification evidence
- **systematic-debugging**: If QA finds a bug, switch to debugging skill
- **design-implementation-reviewer**: For visual design checks, use that skill instead
