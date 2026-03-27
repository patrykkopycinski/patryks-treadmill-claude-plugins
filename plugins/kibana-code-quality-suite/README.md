# Kibana Code Quality Suite

**6 skills for automated code quality, security, accessibility, and design reviews**

TypeScript healing, security scanning, accessibility auditing, refactoring, design review, and dashboard development orchestration.

---

## Skills

### @type-healer
**Root-cause TypeScript error fixer**

Diagnoses and fixes TypeScript errors at their root cause (never suppresses with @ts-ignore). Runs scoped type checks, categorizes errors, applies fixes, validates in convergence loops.

**Trigger:** "Fix type errors" | "Type check failed" | CI type failures

---

### @refactor-assistant
**Safety-first refactoring**

Refactors code with mandatory test baselines, metrics tracking, and rollback protocol. Ensures no regressions.

**Trigger:** "Refactor this" | Code quality improvements

---

### @security-reviewer
**Vulnerability scanner for Kibana**

Scans for XSS, SQL injection, CSRF, auth bypass, path traversal, command injection. Validates Kibana-specific security patterns (authz, RBAC, input validation).

**Trigger:** "Security review" | Code changes touching auth/input/API boundaries

---

### @accessibility-auditor
**WCAG 2.1 compliance auditor**

Audits and fixes accessibility issues using Scout/axe-core with keyboard navigation validation.

**Trigger:** "Accessibility audit" | "Check a11y" | UI component changes

---

### @design-super-agent
**Comprehensive design review (6 disciplines)**

Integrates UX, UI, microcopy, user research, flows, and accessibility into a single holistic review. Specialized in security operations dashboards, vulnerability posture UIs, and data-dense operational interfaces.

**Trigger:** "Design review" | "Review dashboard design" | Building dashboards with 5+ panels

---

### @dashboard-workflow
**Dashboard development lifecycle orchestrator**

Sequences three phases for building high-quality dashboards:
1. **Design Review** (design-super-agent) -- persona, UX/UI, accessibility
2. **Implementation** (frontend-design) -- EUI components, Emotion, i18n
3. **Testing** (Scout/Jest) -- unit tests, UI tests, accessibility checks

**Trigger:** "Build dashboard" | "Create dashboard" | "Redesign dashboard"

---

## Installation

### Via Marketplace

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install kibana-code-quality-suite@patryks-treadmill
```

### Manual

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Restart Claude Code or run `/reload-plugins`.

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
