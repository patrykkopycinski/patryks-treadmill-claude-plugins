# developer-craft-toolkit

Essential development skills for systematic refactoring, TDD, technical writing, deep-dive research, and frontend design review. Language-agnostic and applicable to any project.

## Skills

| Skill | Description | When to Use |
|-------|-------------|-------------|
| `code-refactor` | Systematic refactoring based on Martin Fowler's methodology | Reducing technical debt, cleaning up legacy code, eliminating code smells |
| `technical-writer` | Creates clear documentation, API references, and guides | Writing READMEs, API docs, tutorials, user guides, changelogs |
| `deep-dive` | Researches a GitHub repo topic and generates a polished HTML reference document | Learning a codebase feature, onboarding to a new area, architecture exploration |
| `frontend-design-review` | Reviews UI for visual quality, UX best practices, accessibility, and responsiveness | After creating UI components, before completing any frontend work |
| `tdd-workflow` | Enforces test-driven development with 80%+ coverage across unit, integration, and E2E tests | Writing new features, fixing bugs, refactoring code |

## Installation

### Via marketplace

```
/plugin marketplace
```

Search for `developer-craft-toolkit` and install.

### Manual

```
/plugin install https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/tree/main/plugins/developer-craft-toolkit
```

## Skills

### code-refactor

A phased, safe refactoring workflow grounded in Martin Fowler's *Refactoring: Improving the Design of Existing Code* (2nd Edition). Guides through research, test coverage assessment, code smell identification, planning, incremental implementation, and post-refactoring review. Requires user approval at each phase. Never combines refactoring with feature work.

### technical-writer

An expert technical writing persona that produces user-centered documentation. Follows a structured style guide covering voice and tone, formatting conventions, code example patterns, and progressive disclosure. Includes templates for READMEs, API docs, and tutorials.

### deep-dive

Researches any topic within a GitHub repository using the `gh` CLI and local file reads, then generates a self-contained HTML reference document from a built-in dark-mode template. Covers architecture, key files, data flow, configuration, and relevant issues and PRs. Includes security rules to prevent prompt injection from untrusted repo content.

### frontend-design-review

A three-phase design review process: visual inspection at multiple breakpoints (desktop, tablet, mobile), code review for semantic HTML and clean CSS, and interactive testing of hover/focus/keyboard states. Includes comprehensive checklists covering layout, typography, color contrast (WCAG AA), component states, and accessibility.

### tdd-workflow

Enforces strict test-first development. Walks through writing user journeys, generating test cases across unit/integration/E2E layers, implementing minimal code to pass tests, and verifying 80%+ coverage thresholds. Includes Jest/Vitest and Playwright patterns, mocking strategies, and common testing mistakes to avoid.
