# Security Reviewer Skill

Automated security review of code changes for Kibana with focus on common vulnerabilities and Kibana-specific security patterns.

## Quick Start

```bash
# Review uncommitted changes
/security-reviewer

# Review specific files
/security-reviewer path/to/routes/alerts.ts path/to/ui/component.tsx

# Review a PR branch
git checkout feature-branch
/security-reviewer
```

## What It Checks

### Vulnerability Patterns

| Vulnerability | Pattern | Severity |
|---------------|---------|----------|
| **XSS** | `dangerouslySetInnerHTML`, `.innerHTML`, `document.write` | HIGH |
| **SQL Injection** | Template literals in ES queries, string concat | CRITICAL |
| **Auth Bypass** | Missing `security.authz`, `enabled: false` | CRITICAL |
| **Weak Validation** | `schema.any()`, `unknowns: 'allow'` | MEDIUM |
| **Path Traversal** | User input in `path.join`, `fs.*` operations | CRITICAL |
| **Command Injection** | User input in `exec()`, `spawn()` | CRITICAL |
| **CSRF** | `xsrfRequired: false` on state-changing endpoints | HIGH |

### Kibana-Specific Checks

- **Route authorization:** `security.authz.requiredPrivileges`
- **Input validation:** Zod/@kbn/config-schema usage
- **RBAC enforcement:** Privilege checks in handlers
- **Safe defaults:** Feature flags, public endpoints

## Output

Generates a structured security report with:

1. **Executive Summary** - Severity counts and risk assessment
2. **Critical Findings** - Must-fix vulnerabilities with exploits
3. **High/Medium Findings** - Should-fix issues
4. **API Route Checklist** - Table of all routes with security status
5. **Recommended Actions** - Prioritized fix list

## Example Report

```markdown
# Security Review Report

**Scope:** PR #12345 (Add user management API)
**Total findings:** 3 (1 critical, 1 high, 1 medium)

## 🚨 CRITICAL-001: SQL Injection in User Search

**File:** `routes/users.ts:42`
**Pattern:** Template literal in ES query

**Vulnerable code:**
```typescript
const query = { query_string: { query: `user:${username}` } };
```

**Fix:**
```typescript
const query = { term: { user: username } };
```

## API Route Security Summary

| Route | Auth | Validation | RBAC | Status |
|-------|------|------------|------|--------|
| `POST /api/users` | ✅ | ❌ `schema.any()` | ✅ | **MEDIUM** |
| `GET /api/users/{id}` | ✅ | ✅ | ✅ | ✅ All good |
```

## Integration

### With Pre-commit Checks

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Run security review on staged files
/security-reviewer $(git diff --cached --name-only)
```

### With GitHub PR Workflow

Add to `.github/workflows/security-review.yml`:

```yaml
- name: Security Review
  run: |
    /security-reviewer $(git diff --name-only origin/main...HEAD)
```

### With api-authz Skill

```
/api-authz path/to/routes/alerts.ts  # Detailed authz review
/security-reviewer path/to/routes/alerts.ts  # Full security review
```

## Configuration

### Custom Allow-list

Create `~/.agents/rules/security-patterns.md`:

```markdown
## Allow-list for schema.any() usage

**File:** `plugins/fleet/server/routes/package_policy.ts:42`
**Reason:** Legacy API, deprecated in v10.0
**Accepted by:** @security-team
**Date:** 2024-03-20
```

### Severity Thresholds

Create `~/.agents/config/security-reviewer.yml`:

```yaml
severity:
  critical:
    - "SQL injection"
    - "Command injection"
    - "Auth bypass"
  high:
    - "XSS"
    - "Path traversal"
    - "CSRF"
  medium:
    - "Weak validation"
    - "Missing RBAC check"
```

## Common Fixes

### Fix XSS

```typescript
// Before
<div dangerouslySetInnerHTML={{ __html: comment.body }} />

// After
import DOMPurify from 'dompurify';
const cleanBody = DOMPurify.sanitize(comment.body);
<div dangerouslySetInnerHTML={{ __html: cleanBody }} />

// Or use EUI
import { EuiMarkdownFormat } from '@elastic/eui';
<EuiMarkdownFormat>{comment.body}</EuiMarkdownFormat>
```

### Fix SQL Injection

```typescript
// Before
const query = {
  query_string: {
    query: `user:${username}`,
  },
};

// After
const query = {
  term: {
    user: username,
  },
};
```

### Fix Auth Bypass

```typescript
// Before
router.post({
  path: '/api/plugin/sensitive',
  // No security config!
});

// After
router.post({
  path: '/api/plugin/sensitive',
  security: {
    authz: {
      requiredPrivileges: ['plugin', 'write'],
    },
  },
});
```

### Fix Weak Validation

```typescript
// Before
validate: {
  request: {
    body: schema.any(),
  },
}

// After
validate: {
  request: {
    body: schema.object({
      name: schema.string({ minLength: 1, maxLength: 255 }),
      email: schema.string(),
      role: schema.oneOf([
        schema.literal('admin'),
        schema.literal('editor'),
        schema.literal('viewer'),
      ]),
    }),
  },
}
```

### Fix Path Traversal

```typescript
// Before
const filePath = path.join('/data', request.body.filename);
fs.readFile(filePath);

// After
const basePath = '/data/uploads';
const requestedPath = path.join(basePath, request.body.filename);

// Validate path is within base directory
const normalizedPath = path.normalize(requestedPath);
if (!normalizedPath.startsWith(basePath)) {
  return response.badRequest({
    body: { message: 'Invalid file path' },
  });
}
```

### Fix Command Injection

```typescript
// Before
child_process.exec(`convert ${inputFile} output.png`);

// After
import { spawn } from 'child_process';
const sanitizedInput = path.basename(inputFile);
spawn('convert', [sanitizedInput, 'output.png'], { shell: false });

// Or use library
import sharp from 'sharp';
await sharp(inputFile).toFile('output.png');
```

## Tips

1. **Run early and often** - Catch vulnerabilities before code review
2. **Review API routes first** - Highest risk surface
3. **Check user input handlers** - Second highest risk
4. **Use allow-list for false positives** - Avoid noise
5. **Integrate with CI/CD** - Automate security checks

## Resources

- [Kibana Security Best Practices](https://www.elastic.co/guide/en/kibana/current/security-best-practices.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Kibana RBAC Documentation](https://www.elastic.co/guide/en/kibana/current/kibana-role-management.html)
- [CWE Common Weakness Enumeration](https://cwe.mitre.org/)

## Maintenance

### Adding New Patterns

Edit `SKILL.md` and add new scan section:

```markdown
#### Scan 2.X: [Vulnerability Name]

**Pattern:** [Description]

**Search patterns:**
```typescript
// DANGER: [Pattern]
```

**Scan command:**
```bash
# [Command to find pattern]
```

**Safe patterns:**
```typescript
// SAFE: [Safe alternative]
```
```

### Testing

Create test files in `~/.agents/skills/security-reviewer/test/`:

```typescript
// test/vulnerable.ts - Known vulnerable patterns
const query = { query_string: { query: `user:${username}` } };
<div dangerouslySetInnerHTML={{ __html: userInput }} />
child_process.exec(`ls ${userDir}`);
```

Run skill against test files:

```bash
/security-reviewer ~/.agents/skills/security-reviewer/test/vulnerable.ts
# Should flag all known vulnerabilities
```

## Changelog

- **v1.0.0** (2024-03-20) - Initial release
  - XSS, SQL injection, auth bypass, validation, path traversal, command injection, CSRF checks
  - Kibana-specific patterns (authz, RBAC, schema validation)
  - Structured security report generation
