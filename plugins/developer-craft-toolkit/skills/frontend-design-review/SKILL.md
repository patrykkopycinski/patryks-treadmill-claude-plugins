---
name: frontend-design-review
description: Review and improve frontend UI for visual quality, UX best practices, accessibility, and responsiveness. Use when building UI components, reviewing frontend code, creating dashboards, or when the user asks about design quality, styling, layout, or user experience.
---

# Frontend Design Review

Ensure UI built by agents meets professional design standards through visual inspection, code review, and iterative refinement.

## When to Use

- After creating or modifying UI components
- When building dashboards, forms, tables, or data displays
- When the user asks to "make it look good", "improve the design", or "review the UI"
- Before considering any frontend work complete

## Design Principles Checklist

Before reviewing, internalize these priorities (ordered):

1. **Functional** - Does it work? Can users complete their tasks?
2. **Accessible** - Can everyone use it? Keyboard nav, screen readers, contrast
3. **Clear** - Is the information hierarchy obvious? Can users find what they need?
4. **Consistent** - Does it match the rest of the application?
5. **Beautiful** - Is it visually polished and professional?

## Review Process

### Phase 1: Visual Inspection (Browser)

Open the page and take screenshots at key breakpoints:

```
1. browser_navigate → target URL (take_screenshot_afterwards: true)
2. browser_take_screenshot (fullPage: true) → capture complete layout
3. browser_resize → { width: 768, height: 1024 } → screenshot (tablet)
4. browser_resize → { width: 375, height: 812 } → screenshot (mobile)
5. browser_resize → { width: 1440, height: 900 } → restore desktop
```

For each screenshot, evaluate against the design checklist below.

### Phase 2: Code Review

Review the component source for:

```
Code Quality:
- [ ] Semantic HTML (section, nav, main, article - not div soup)
- [ ] CSS/Tailwind classes are clean and consistent
- [ ] No inline styles (except dynamic values)
- [ ] Components are reasonably sized (< 200 lines)
- [ ] Responsive utilities used correctly (not hardcoded breakpoints)
```

### Phase 3: Interactive Review

Test interactions in the browser:

```
1. browser_snapshot (interactive: true) → list all interactive elements
2. Test each: hover states, focus rings, click feedback
3. Tab through the page → verify focus order is logical
4. Check loading/empty/error states render properly
```

## Design Checklist

### Layout & Spacing

| Check | What to Look For |
|-------|-----------------|
| Consistent spacing | Use spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px) |
| Alignment | Elements align to a grid; no random offsets |
| Breathing room | Content not cramped against edges; adequate padding |
| Max-width | Text lines don't exceed ~70-80 characters |
| Responsive | Layout adapts gracefully; no horizontal scroll |
| Content flow | Logical reading order top-to-bottom, left-to-right |

### Typography

| Check | What to Look For |
|-------|-----------------|
| Hierarchy | Clear distinction between h1 > h2 > h3 > body > caption |
| Font sizes | Minimum 14px body text; 12px minimum for secondary text |
| Line height | 1.4-1.6 for body text; 1.2-1.3 for headings |
| Weight contrast | Bold for emphasis, not color alone |
| Consistency | Same font family throughout (max 2 families) |

### Color & Contrast

| Check | What to Look For |
|-------|-----------------|
| Contrast ratio | 4.5:1 minimum for normal text; 3:1 for large text (WCAG AA) |
| Color meaning | Don't rely on color alone (add icons/labels for status) |
| Palette | Max 5-6 colors; consistent use of primary/secondary/accent |
| Dark backgrounds | Text readable on all background colors |
| Status colors | Green=success, Red=error, Yellow=warning, Blue=info |

### Components

| Check | What to Look For |
|-------|-----------------|
| Buttons | Clear primary/secondary hierarchy; adequate click targets (44px min) |
| Forms | Labels for all inputs; clear error states; logical tab order |
| Tables | Header row distinct; alternating rows or borders; sortable columns indicated |
| Cards | Consistent padding; clear content grouping; hover state if clickable |
| Navigation | Current page indicated; all links working; breadcrumbs if deep |
| Modals/Dialogs | Overlay dims background; close button visible; escape key works |

### States & Feedback

| Check | What to Look For |
|-------|-----------------|
| Empty state | Helpful message, not blank space; suggest action |
| Loading state | Skeleton or spinner; content doesn't jump on load |
| Error state | Clear error message; recovery action available |
| Hover/Focus | Visual feedback on interactive elements |
| Disabled | Visually distinct; tooltip explaining why |
| Success | Confirmation message; clear next step |

### Accessibility

| Check | What to Look For |
|-------|-----------------|
| Keyboard nav | All functionality reachable via keyboard |
| Focus visible | Clear focus ring on interactive elements |
| Alt text | Images have meaningful alt text |
| ARIA labels | Icons and non-text elements have aria-labels |
| Skip links | "Skip to content" link for screen readers |
| Form labels | Every input has an associated label |

## Common Fixes

### Spacing Problems

```css
/* Bad: Magic numbers */
.card { margin: 13px; padding: 7px 11px; }

/* Good: Spacing scale */
.card { margin: theme(spacing.3); padding: theme(spacing.2) theme(spacing.3); }
```

### Typography Problems

```css
/* Bad: Too many sizes */
h1 { font-size: 28px; } h2 { font-size: 23px; } h3 { font-size: 19px; }

/* Good: Type scale (1.25 ratio) */
h1 { font-size: 2.441rem; } h2 { font-size: 1.953rem; } h3 { font-size: 1.563rem; }
```

### Responsive Problems

```html
<!-- Bad: Fixed widths -->
<div style="width: 800px">

<!-- Good: Fluid + max-width -->
<div class="w-full max-w-4xl mx-auto">
```

### Empty State Pattern

```tsx
{items.length === 0 ? (
  <div className="text-center py-12 text-gray-500">
    <Icon className="mx-auto h-12 w-12 mb-4" />
    <h3 className="text-lg font-medium">No items yet</h3>
    <p className="mt-1">Get started by creating your first item.</p>
    <Button className="mt-4" onClick={onCreate}>Create Item</Button>
  </div>
) : (
  <ItemList items={items} />
)}
```

## Iterative Refinement

When issues are found:

1. **Categorize** each issue as Critical / Important / Nice-to-have
2. **Fix Critical first** - broken layouts, unreadable text, inaccessible elements
3. **Screenshot after each fix** - verify improvement, check for regressions
4. **Compare before/after** - use `browser_snapshot(includeDiff: true)` to see changes

For design iteration loops (3+ rounds of fixes), use the `design-iterator` subagent to handle screenshot-analyze-improve cycles efficiently.

## Framework-Specific Guidelines

### React + Tailwind CSS

- Use Tailwind utility classes; avoid `@apply` for one-off styles
- Use `className` merging via `clsx` or `cn` for conditional styles
- Extract repeated patterns into components, not utility classes
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) consistently

### Shadcn/ui

- Use the design system's components before custom ones
- Follow the variant pattern (default, destructive, outline, secondary, ghost)
- Keep consistent with the project's `tailwind.config` theme values

### General React

- Prefer `aria-*` attributes over custom data attributes for semantics
- Use `<button>` for clickable actions, `<a>` for navigation
- Keep component props focused; don't pass styling concerns through props

## Integration

- **qa-browser-verification**: After design review, verify functionality still works
- **brainstorming**: Design review criteria should inform the design phase
- **verification-before-completion**: Screenshots from design review serve as evidence
