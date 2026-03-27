---
name: test-selector-healer
description: Fix failing Cypress/Scout/Playwright tests by adding missing data-test-subj attributes to UI source components when no reliable selector exists. Use when tests fail due to brittle selectors, strict mode violations from ambiguous locators, elements not found, or when debugging tests that rely on CSS classes, DOM structure, or text content that changes. Triggers on "no selector", "strict mode violation", "element not found", "brittle selector", "add test subject", "data-test-subj".
---

# Test Selector Healer

Fix test failures at their root by adding `data-test-subj` attributes to UI source code when tests lack reliable selectors. Modifying the application source is the correct fix — not piling up fragile CSS selectors or `.first()` / `.nth()` workarounds in test code.

## When to Activate

Activate when a test failure matches ANY of these patterns:

1. **Strict mode violation** — locator resolves to multiple elements (e.g., `resolved to 5 elements`)
2. **Element not found** — locator times out because no stable selector exists
3. **Brittle selectors** — test uses CSS classes (`.euiButton`), DOM structure (`div > span`), or text content (`getByText`) that breaks on UI changes
4. **Ambiguous locators** — test uses `.first()` / `.nth()` as workaround for missing specificity

## Decision Framework

```
Test fails with selector issue
  │
  ├─ Does a data-test-subj already exist for this element?
  │   ├─ YES → Use it. Fix the test selector, not the component.
  │   └─ NO  → Continue below.
  │
  ├─ Is the element in YOUR codebase (not a third-party lib)?
  │   ├─ YES → Add data-test-subj to the component. Then fix the test.
  │   └─ NO  → Use the best available stable selector (role, aria-label, etc.)
  │
  └─ Is this an EUI component?
      ├─ YES → EUI components accept data-test-subj as a prop. Add it.
      └─ NO  → Wrap the element in a <div data-test-subj="..."> or add the attribute directly.
```

## Adding data-test-subj: The Rules

### Naming convention

- Use `camelCase` for simple names: `data-test-subj="osqueryResultsTable"`
- Use hyphen-separated for compound names: `data-test-subj="save-pack-button"`
- Use dynamic suffixes for list items: `data-test-subj={`play-${item.name}-button`}`
- Prefix with the feature/plugin name to avoid collisions: `osquery`, `fleet`, `security`
- Be descriptive: `savedQueryFlyoutSaveButton` not `btn1`

### Where to add

**React component with props interface:**
```tsx
interface MyComponentProps {
  'data-test-subj'?: string;
  // ... other props
}

const MyComponent: React.FC<MyComponentProps> = ({
  'data-test-subj': dataTestSubj,
  ...rest
}) => (
  <div data-test-subj={dataTestSubj}>
    {/* ... */}
  </div>
);
```

**EUI components (already support it):**
```tsx
// EUI components accept data-test-subj directly
<EuiButton data-test-subj="submitQueryButton" onClick={handleSubmit}>
  Submit
</EuiButton>

<EuiFieldText data-test-subj="queryNameInput" value={name} onChange={onChange} />

<EuiBasicTable data-test-subj="packsTable" items={items} columns={columns} />
```

**Wrapper div for structural grouping:**
```tsx
<div data-test-subj="ecsMappingRow">
  <EcsFieldInput />
  <OsqueryColumnInput />
  <EuiButtonIcon aria-label="Delete ECS mapping row" />
</div>
```

**Dynamic/list items:**
```tsx
{items.map((item) => (
  <EuiTableRow key={item.id} data-test-subj={`pack-row-${item.name}`}>
    {/* ... */}
  </EuiTableRow>
))}
```

### What NOT to do

- Don't add `data-test-subj` to every single element — only where tests need stable anchors
- Don't duplicate existing IDs — check if the element already has a `data-test-subj`
- Don't use dynamic values that change per render (timestamps, random IDs) — use stable identifiers (names, types)
- Don't add test subjects in production-only code paths that won't render during tests

## Workflow

### Step 1: Diagnose the selector issue

Read the test error. Identify:
- Which locator failed
- What it resolved to (or didn't)
- The element's purpose in the UI

### Step 2: Find the UI source component

Search for the component that renders the target element:
```
Grep for the text content, existing partial selector, or component name
in the plugin's public/ directory
```

Common locations in Kibana plugins:
- `public/components/` — shared UI components
- `public/routes/` — page-level components
- `public/forms/` — form fields and editors
- `public/shared_components/` — cross-feature UI

### Step 3: Add data-test-subj to the component

Apply the rules above. Prefer the minimal change:
- If the component already accepts `data-test-subj` in props, just pass it from the parent
- If using an EUI component, add the prop directly
- If it's a custom component, add the prop to its interface and pass it through to the rendered element

### Step 4: Update the test to use the new selector

Replace the brittle selector with:
```ts
// Scout (Playwright)
page.testSubj.locator('myNewTestSubject')

// Cypress
cy.getBySel('myNewTestSubject')
```

### Step 5: Verify both sides

1. Check the component renders correctly (no type errors)
2. Run the test to confirm it passes with the new selector
3. Ensure no other tests broke from the component change

## Kibana-Specific Patterns

### Scout (Playwright) selectors

```ts
// Primary — data-test-subj via Scout helper
page.testSubj.locator('osqueryResultsTable')

// With chaining
page.testSubj.locator('packsTable').locator('[aria-label="Edit"]')

// Dynamic
page.testSubj.locator(`play-${packName}-button`)
```

### Cypress selectors

```ts
// Primary
cy.getBySel('osqueryResultsTable')

// Dynamic
cy.getBySel(`play-${packName}-button`)
```

### Common EUI components and their test-subj support

All EUI components pass through `data-test-subj`. Key ones:
- `EuiButton`, `EuiButtonIcon`, `EuiButtonEmpty` — action buttons
- `EuiFieldText`, `EuiFieldNumber`, `EuiTextArea` — form inputs
- `EuiComboBox` — combobox (use parent `data-test-subj` + inner `comboBoxSearchInput`)
- `EuiBasicTable`, `EuiInMemoryTable` — tables
- `EuiAccordion` — collapsible sections
- `EuiFlyout` — slide-out panels
- `EuiModal` — dialogs
- `EuiTab`, `EuiTabs` — tab navigation
- `EuiSwitch`, `EuiCheckbox` — toggles

## Example: Complete Fix

**Before** (brittle — fails when text changes or multiple buttons exist):
```ts
await page.getByText('Submit').first().click();
```

**Step 1** — Find the component:
```tsx
// public/live_queries/form/index.tsx
<EuiButton onClick={handleSubmit} fill>Submit</EuiButton>
```

**Step 2** — Add data-test-subj:
```tsx
<EuiButton data-test-subj="submitLiveQueryButton" onClick={handleSubmit} fill>
  Submit
</EuiButton>
```

**Step 3** — Update the test:
```ts
await page.testSubj.locator('submitLiveQueryButton').click();
```
