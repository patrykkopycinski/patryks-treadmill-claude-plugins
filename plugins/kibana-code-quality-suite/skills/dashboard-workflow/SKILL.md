---
name: dashboard-workflow
description: Orchestrates the full dashboard development lifecycle for Kibana operational dashboards. Sequences three phases - design review (design-super-agent), implementation (frontend-design), and testing (Scout/Jest). Use when building, redesigning, or significantly modifying any dashboard UI, especially security operations dashboards, vulnerability posture views, or data-heavy monitoring interfaces. Triggers on "build dashboard", "create dashboard", "redesign dashboard", "dashboard workflow", or when starting any dashboard-related feature work.
---

# Dashboard Development Workflow

End-to-end orchestration for building high-quality Kibana operational dashboards. Enforces a three-phase sequence to ensure dashboards are well-designed before implementation and thoroughly tested after.

## When to Trigger

- Building a new dashboard or dashboard page
- Redesigning an existing dashboard with significant layout changes
- Adding 3+ new panels to an existing dashboard
- Any work explicitly involving "dashboard" in the user's request
- Vulnerability posture, security operations, or monitoring UI work

## The Three-Phase Sequence

```
Phase 1: Design Review          Phase 2: Implementation         Phase 3: Testing
(design-super-agent)            (frontend-design)               (Scout/Jest)
+---------------------+         +---------------------+         +---------------------+
| Persona definition  |         | EUI component build  |         | Jest unit tests     |
| UX/UI analysis      |    ->   | Responsive layout    |    ->   | Component rendering |
| Accessibility audit |         | Emotion styling      |         | Accessibility checks|
| Layout blueprint    |         | i18n integration     |         | Scout UI tests      |
| Prioritized fixes   |         | Hook wiring          |         | Visual regression   |
+---------------------+         +---------------------+         +---------------------+
```

## Phase 1: Design Review

**Invoke skill:** `design-super-agent`

**Input required:**
- Current dashboard code or mockup
- Target user persona (SOC analyst, security engineer, etc.)
- Use context (real-time monitoring, periodic review, incident response)

**Output:**
- Structured design review document
- Prioritized list of improvements
- Panel layout blueprint
- Accessibility gaps identified

**Gate:** User must review and approve the design recommendations before moving to Phase 2. Ask: "Design review complete. Shall I proceed with implementation using the approved recommendations?"

## Phase 2: Implementation

**Invoke skill:** `frontend-design` (from superpowers plugin)

**Input:** Design review recommendations from Phase 1 + existing codebase

**Implementation standards:**
- EUI components only (no custom HTML/CSS unless EUI lacks the primitive)
- Emotion for all custom styling (`@emotion/react`)
- `useEuiTheme()` for theme tokens
- Functional components with typed props
- i18n wrapping for all user-visible strings
- Responsive design (EUI breakpoints)

**Gate:** Code review of the implementation. Check:
- [ ] All design review recommendations addressed
- [ ] EUI components used correctly
- [ ] No accessibility regressions
- [ ] i18n complete
- [ ] Responsive at all breakpoints

## Phase 3: Testing

**Testing strategy based on component type:**

### Jest Unit Tests (always)
```
yarn test:jest <path-to-component-test>
```
- Component renders without errors
- Props/data flow correctly
- Empty states render correctly
- Loading states render correctly
- Error states render correctly
- Conditional panels show/hide correctly

### Scout UI Tests (for full-page dashboards)
```
node scripts/scout run-tests --arch stateful --domain classic --config <config>
```
- Page loads successfully
- All panels render with data
- Filters work correctly
- Drill-down navigation works
- Responsive layout at different viewports

### Accessibility Tests
- `axe-core` checks pass
- Keyboard navigation works (Tab, Enter, Escape)
- Screen reader announces panel content

**Gate:** All tests pass before declaring the dashboard complete.

## Quick Reference

| Phase | Skill | Focus | Gate |
|-------|-------|-------|------|
| 1 | design-super-agent | Design quality | User approves recommendations |
| 2 | frontend-design | Implementation | Code review passes |
| 3 | Scout/Jest | Testing | All tests green |

## Skipping Phases

- **Minor changes** (1-2 panels, styling tweaks): Skip Phase 1, do Phase 2+3
- **Design-only review** (no code changes): Phase 1 only
- **Bug fixes in existing dashboards**: Phase 2+3 only

Always ask the user if they want to skip any phase for smaller changes.
