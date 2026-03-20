# Accessibility Auditor

## Purpose
Audit UI components and pages for accessibility (a11y) issues and suggest fixes to ensure Kibana is usable by everyone.

## Capabilities
- Run Scout a11y checks (page.checkA11y)
- Scan for common a11y issues: missing labels, low contrast, keyboard navigation
- Suggest fixes: add aria-label, increase contrast, add keyboard handlers
- Generate accessibility test suite
- Check WCAG 2.1 Level AA compliance
- Validate screen reader compatibility

## Triggers
- "accessibility audit"
- "check a11y"
- "is this accessible"
- "add accessibility tests"
- Auto-trigger from spike-builder QA phase

## Implementation

### 1. Scout Accessibility Checks
Scout provides built-in a11y checks via axe-core integration:

```typescript
// In Scout test file (*.scout.ts)
import { expect, test } from '@kbn/scout';

test.describe('Accessibility', () => {
  test('should have no a11y violations on main page', async ({ page }) => {
    await page.goto('/app/my-feature');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Run axe accessibility check
    const violations = await page.checkA11y();

    // Assert no violations
    expect(violations).toHaveLength(0);
  });

  test('should have no violations in modal', async ({ page }) => {
    await page.goto('/app/my-feature');

    // Open modal
    await page.getByRole('button', { name: 'Open Settings' }).click();

    // Check modal specifically
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Run a11y check on modal only
    const violations = await page.checkA11y({ include: [['[role="dialog"]']] });
    expect(violations).toHaveLength(0);
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/app/my-feature');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'First Button' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Second Button' })).toBeFocused();

    // Enter should activate focused button
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
```

### 2. Common A11y Issues Checklist

#### Missing Labels
```typescript
// ❌ BAD: Button without accessible name
<EuiButton onClick={handleClick}>
  <EuiIcon type="trash" />
</EuiButton>

// ✅ GOOD: Button with aria-label
<EuiButton onClick={handleClick} aria-label="Delete item">
  <EuiIcon type="trash" />
</EuiButton>

// ✅ BETTER: Button with visible text
<EuiButton onClick={handleClick} iconType="trash">
  Delete
</EuiButton>
```

**Detection:**
```bash
# Search for buttons with only icons
grep -rn "EuiButton.*iconType" --include="*.tsx" | \
  grep -v "aria-label" | \
  grep -v "children"
```

#### Low Color Contrast
```typescript
// ❌ BAD: Insufficient contrast (< 4.5:1 for normal text)
<EuiText color="#999999">Important message</EuiText>

// ✅ GOOD: Use EUI color tokens (already WCAG compliant)
<EuiText color="danger">Important message</EuiText>
<EuiText color="subdued">Secondary text</EuiText>
```

**Detection:**
Scout's checkA11y will flag contrast issues automatically.

#### Missing Form Labels
```typescript
// ❌ BAD: Input without label
<EuiFieldText
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// ✅ GOOD: Use EuiFormRow for labels
<EuiFormRow label="Email address">
  <EuiFieldText
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</EuiFormRow>

// ✅ ALTERNATIVE: aria-label if visual label not desired
<EuiFieldText
  aria-label="Email address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Detection:**
```bash
# Find form inputs without labels
grep -rn "EuiFieldText\|EuiFieldNumber\|EuiFieldPassword" --include="*.tsx" | \
  while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    linenum=$(echo "$line" | cut -d: -f2)

    # Check if wrapped in EuiFormRow or has aria-label
    context=$(sed -n "$((linenum-5)),$((linenum+2))p" "$file")
    if ! echo "$context" | grep -q "EuiFormRow\|aria-label"; then
      echo "Missing label: $line"
    fi
  done
```

#### Missing Heading Hierarchy
```typescript
// ❌ BAD: Skip heading levels
<h1>Page Title</h1>
<h3>Section</h3>  // Skipped h2

// ✅ GOOD: Proper hierarchy
<h1>Page Title</h1>
<h2>Main Section</h2>
<h3>Subsection</h3>

// ✅ Use EUI heading components
<EuiTitle size="l"><h1>Page Title</h1></EuiTitle>
<EuiTitle size="m"><h2>Main Section</h2></EuiTitle>
<EuiTitle size="s"><h3>Subsection</h3></EuiTitle>
```

#### Keyboard Navigation
```typescript
// ✅ Ensure interactive elements are focusable
<div
  role="button"
  tabIndex={0}  // Make focusable
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom button
</div>

// ✅ BETTER: Use native button or EUI component
<EuiButton onClick={handleClick}>
  Native button (handles keyboard automatically)
</EuiButton>
```

#### ARIA Roles and States
```typescript
// ✅ Use ARIA roles for custom widgets
<div role="tablist">
  <button role="tab" aria-selected={activeTab === 0} aria-controls="panel-0">
    Tab 1
  </button>
  <button role="tab" aria-selected={activeTab === 1} aria-controls="panel-1">
    Tab 2
  </button>
</div>

<div role="tabpanel" id="panel-0" hidden={activeTab !== 0}>
  Panel 1 content
</div>

// ✅ Use aria-live for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### 3. Generate Accessibility Test Suite
```typescript
// Generated test file: my_feature.a11y.scout.ts
import { expect, test } from '@kbn/scout';

test.describe('My Feature - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/my-feature');
    await page.waitForLoadState('networkidle');
  });

  test('main page should have no a11y violations', async ({ page }) => {
    const violations = await page.checkA11y();
    expect(violations).toHaveLength(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Exactly one h1

    // Verify heading levels don't skip
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const levels = await Promise.all(
      headings.map(async (h) => {
        const tagName = await h.evaluate((el) => el.tagName);
        return parseInt(tagName[1]);
      })
    );

    // Check no level skips (e.g., h1 -> h3)
    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('all interactive elements should be keyboard accessible', async ({ page }) => {
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);

      // Check if focusable (tabIndex >= 0 or naturally focusable)
      const tabIndex = await button.getAttribute('tabindex');
      const tagName = await button.evaluate((el) => el.tagName);

      if (tagName !== 'BUTTON' && (!tabIndex || parseInt(tabIndex) < 0)) {
        const text = await button.textContent();
        throw new Error(`Button "${text}" is not keyboard accessible`);
      }
    }
  });

  test('all images should have alt text', async ({ page }) => {
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();

      // Decorative images should have empty alt
      const role = await img.getAttribute('role');
      if (role === 'presentation') {
        expect(alt).toBe('');
      }
    }
  });

  test('form inputs should have labels', async ({ page }) => {
    const inputs = await page.locator('input, textarea, select').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Check for label (via for attribute, aria-label, or aria-labelledby)
      const hasLabel =
        ariaLabel ||
        ariaLabelledBy ||
        (id && (await page.locator(`label[for="${id}"]`).count()) > 0);

      expect(hasLabel).toBeTruthy();
    }
  });

  test('modals should trap focus', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: 'Open Settings' }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Find first and last focusable elements
    const focusable = modal.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusable.first();
    const lastFocusable = focusable.last();

    // Tab from last should go to first (focus trap)
    await lastFocusable.focus();
    await page.keyboard.press('Tab');
    await expect(firstFocusable).toBeFocused();

    // Shift+Tab from first should go to last
    await page.keyboard.press('Shift+Tab');
    await expect(lastFocusable).toBeFocused();
  });

  test('should support screen reader announcements', async ({ page }) => {
    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live]');
    expect(await liveRegions.count()).toBeGreaterThan(0);

    // Verify toast notifications have role="status"
    const toasts = page.locator('.euiToast');
    for (let i = 0; i < (await toasts.count()); i++) {
      const role = await toasts.nth(i).getAttribute('role');
      expect(['status', 'alert']).toContain(role);
    }
  });
});
```

### 4. Run Accessibility Audit
```bash
# Run Scout a11y tests
node scripts/scout run-tests \
  --arch stateful \
  --domain classic \
  --testFiles "x-pack/test/scout/features/my_feature/my_feature.a11y.scout.ts"

# Run on multiple pages
node scripts/scout run-tests \
  --arch stateful \
  --domain classic \
  --config "x-pack/test/scout/config/stateful/accessibility.config.ts"
```

### 5. Manual Testing Checklist
Beyond automated tests, perform manual checks:

```markdown
## Manual Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab works in reverse
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in custom widgets (tabs, menus)
- [ ] Focus indicator is visible
- [ ] Focus order is logical (left-to-right, top-to-bottom)
- [ ] Modal/dialog traps focus

### Screen Reader (VoiceOver/NVDA/JAWS)
- [ ] All content is announced
- [ ] Form labels are read correctly
- [ ] Button purposes are clear
- [ ] Error messages are announced
- [ ] Status updates are announced (aria-live)
- [ ] Images have meaningful alt text
- [ ] Headings provide page structure

### Visual
- [ ] Text meets contrast requirements (4.5:1 for normal, 3:1 for large)
- [ ] Focus indicator is visible
- [ ] Color is not the only indicator (use icons + color)
- [ ] UI is usable at 200% zoom
- [ ] Text can be resized without breaking layout

### Cognitive
- [ ] Error messages are clear and actionable
- [ ] Instructions are easy to understand
- [ ] Timeout warnings are provided
- [ ] Consistent navigation patterns
```

### 6. Quick Fix Script
```bash
#!/bin/bash
# quick_a11y_fix.sh - Fix common a11y issues

file="$1"

if [ ! -f "$file" ]; then
  echo "Usage: $0 <file.tsx>"
  exit 1
fi

echo "Scanning $file for common a11y issues..."

# Check 1: Buttons with only icons (missing labels)
if grep -q "EuiButton.*iconType" "$file"; then
  echo ""
  echo "⚠️  Found buttons with only icons (may need aria-label):"
  grep -n "EuiButton.*iconType" "$file" | grep -v "aria-label" | grep -v "children"
  echo ""
  echo "Fix: Add aria-label or visible text"
  echo "  <EuiButton iconType=\"trash\" aria-label=\"Delete item\" />"
fi

# Check 2: Form inputs without labels
if grep -E -q "EuiFieldText|EuiFieldNumber|EuiFieldPassword" "$file"; then
  echo ""
  echo "⚠️  Found form inputs (verify they have labels):"
  grep -n -E "EuiFieldText|EuiFieldNumber|EuiFieldPassword" "$file"
  echo ""
  echo "Fix: Wrap in EuiFormRow or add aria-label"
fi

# Check 3: Custom onClick handlers (may need keyboard support)
if grep -q "onClick.*<div\|onClick.*<span" "$file"; then
  echo ""
  echo "⚠️  Found onClick on non-button elements (may need keyboard support):"
  grep -n "onClick.*<div\|onClick.*<span" "$file"
  echo ""
  echo "Fix: Add role, tabIndex, and onKeyDown"
  echo "  <div role=\"button\" tabIndex={0} onKeyDown={handleKeyDown} onClick={handleClick} />"
fi

echo ""
echo "Run Scout a11y test to verify:"
echo "  node scripts/scout run-tests --testFiles path/to/test.a11y.scout.ts"
```

## Example Workflow

### User: "check accessibility of my feature"

**Step 1: Generate a11y test suite**
```bash
cat > x-pack/test/scout/features/my_feature/my_feature.a11y.scout.ts <<'EOF'
[Generated test content from template above]
EOF
```

**Step 2: Run Scout a11y tests**
```bash
node scripts/scout run-tests \
  --arch stateful \
  --domain classic \
  --testFiles "x-pack/test/scout/features/my_feature/my_feature.a11y.scout.ts"
```

**Step 3: Parse violations**
```
Found 3 accessibility violations:

1. Missing aria-label on icon button (line 45)
   - Element: <EuiButton iconType="trash" />
   - Fix: Add aria-label="Delete item"

2. Insufficient color contrast (line 78)
   - Element: <EuiText color="#999999">
   - Contrast: 3.2:1 (needs 4.5:1)
   - Fix: Use color="subdued" or darker color

3. Missing form label (line 102)
   - Element: <EuiFieldText />
   - Fix: Wrap in <EuiFormRow label="Email address">
```

**Step 4: Apply fixes**
```typescript
// Fix 1: Add aria-label
- <EuiButton iconType="trash" onClick={handleDelete} />
+ <EuiButton iconType="trash" onClick={handleDelete} aria-label="Delete item" />

// Fix 2: Use EUI color token
- <EuiText color="#999999">Secondary text</EuiText>
+ <EuiText color="subdued">Secondary text</EuiText>

// Fix 3: Add form label
- <EuiFieldText value={email} onChange={handleChange} />
+ <EuiFormRow label="Email address">
+   <EuiFieldText value={email} onChange={handleChange} />
+ </EuiFormRow>
```

**Step 5: Re-run tests**
```bash
node scripts/scout run-tests --testFiles my_feature.a11y.scout.ts
# Output: All tests passed ✓
```

## Integration with Other Skills
- **spike-builder**: Auto-run a11y audit in QA phase
- **frontend-design-review**: Include a11y checklist
- **pr-optimizer**: Suggest a11y tests for UI PRs

## Quality Principles
- Accessibility is not optional (WCAG 2.1 Level AA required)
- Test with real assistive technologies (screen readers, keyboard only)
- Use semantic HTML and ARIA where needed
- Automated tests catch 30-40% of issues; manual testing required
- Consider cognitive accessibility (clear language, error messages)

## References
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- EUI Accessibility: https://eui.elastic.co/#/guidelines/accessibility
- Kibana a11y guidelines: https://www.elastic.co/guide/en/kibana/current/accessibility.html
- axe DevTools: https://www.deque.com/axe/devtools/
- Scout testing: x-pack/test/scout/README.md
