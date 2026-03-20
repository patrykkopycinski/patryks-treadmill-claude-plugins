# Security Reviewer - Usage Examples

## Example 1: Review Uncommitted Changes

**Scenario:** You've made changes to API routes and want to check for security issues before committing.

**Command:**
```bash
/security-reviewer
```

**Output:**
```markdown
# Security Review Report

**Date:** 2024-03-20
**Scope:** Uncommitted changes (3 files)
**Total findings:** 2 (1 critical, 1 medium)

## 🚨 CRITICAL-001: SQL Injection in Alert Query

**File:** `x-pack/plugins/security_solution/server/routes/alerts.ts:58`
**Severity:** CRITICAL
**CWE:** CWE-89

**Vulnerable code:**
```typescript
const query = {
  query_string: {
    query: `user:${request.body.username}`,
  },
};
```

**Fix:**
```typescript
const query = {
  term: { user: request.body.username },
};
```

## 📝 MEDIUM-001: Weak Input Validation

**File:** `x-pack/plugins/security_solution/server/routes/users.ts:42`
**Severity:** MEDIUM

**Vulnerable code:**
```typescript
body: schema.any(),
```

**Fix:**
```typescript
body: schema.object({
  name: schema.string({ minLength: 1, maxLength: 255 }),
  email: schema.string(),
}),
```

## Recommended Actions

**Before commit:**
1. ✅ Fix CRITICAL-001 (SQL injection)
2. ✅ Fix MEDIUM-001 (weak validation)
```

---

## Example 2: Review Specific Files

**Scenario:** You added new attachment routes and want a security review.

**Command:**
```bash
/security-reviewer x-pack/plugins/agent_builder/server/routes/attachments.ts
```

**Output:**
```markdown
# Security Review Report

**Date:** 2024-03-20
**Scope:** 1 file (attachments.ts)
**Total findings:** 1 (medium)

## 📝 MEDIUM-001: Permissive Schema for Attachment Data

**File:** `attachments.ts:183`
**Pattern:** `data: schema.any()`

**Recommendation:**
Use discriminated union for known attachment types:

```typescript
data: schema.oneOf([
  schema.object({ type: schema.literal('text'), content: schema.string() }),
  schema.object({ type: schema.literal('esql'), query: schema.string() }),
  schema.object({ type: schema.literal('viz'), config: schema.object({}) }),
]),
```

## API Route Security Summary

| Route | Method | Auth | Validation | RBAC | Status |
|-------|--------|------|------------|------|--------|
| `/conversations/{id}/attachments` | GET | ✅ | ✅ | ✅ | ✅ All good |
| `/conversations/{id}/attachments` | POST | ✅ | ⚠️ `schema.any()` | ✅ | **MEDIUM-001** |
| `/conversations/{id}/attachments/{id}` | PUT | ✅ | ⚠️ `schema.any()` | ✅ | **MEDIUM-001** |
| `/conversations/{id}/attachments/{id}` | DELETE | ✅ | ✅ | ✅ | ✅ All good |
```

---

## Example 3: Review PR Branch

**Scenario:** You want to review all changes in a feature branch before creating a PR.

**Command:**
```bash
git checkout feature/user-management
/security-reviewer
```

**Output:**
```markdown
# Security Review Report

**Date:** 2024-03-20
**Scope:** Branch feature/user-management vs origin/main (8 files)
**Total findings:** 4 (2 critical, 1 high, 1 medium)

## 🚨 CRITICAL-001: Command Injection in Export

**File:** `server/lib/export.ts:42`
**Pattern:** User input in `exec()`

**Vulnerable code:**
```typescript
exec(`zip -r ${filename}.zip ${directory}`);
```

**Attack scenario:**
```
POST /api/export
Body: { "directory": "data; rm -rf /" }
→ Executes: zip -r export.zip data; rm -rf /
```

**Fix:**
```typescript
import { spawn } from 'child_process';
spawn('zip', ['-r', `${filename}.zip`, directory], { shell: false });
```

## 🚨 CRITICAL-002: Path Traversal in File Upload

**File:** `server/routes/upload.ts:88`
**Pattern:** Unvalidated file path

**Vulnerable code:**
```typescript
const filePath = path.join('/uploads', request.body.filename);
fs.writeFileSync(filePath, data);
```

**Attack scenario:**
```
POST /api/upload
Body: { "filename": "../../../etc/passwd" }
→ Writes to /etc/passwd instead of /uploads/<file>
```

**Fix:**
```typescript
const basePath = '/uploads';
const requestedPath = path.join(basePath, request.body.filename);
const normalizedPath = path.normalize(requestedPath);

if (!normalizedPath.startsWith(basePath)) {
  return response.badRequest({ body: { message: 'Invalid path' } });
}
```

## ⚠️ HIGH-001: XSS in User Profile

**File:** `public/components/user_profile.tsx:102`
**Pattern:** Unescaped HTML

**Vulnerable code:**
```typescript
<div dangerouslySetInnerHTML={{ __html: user.bio }} />
```

**Fix:**
```typescript
import DOMPurify from 'dompurify';
const cleanBio = DOMPurify.sanitize(user.bio);
<div dangerouslySetInnerHTML={{ __html: cleanBio }} />
```

## 📝 MEDIUM-001: Missing RBAC Check

**File:** `server/routes/users.ts:155`
**Pattern:** Privileged operation without handler check

**Recommendation:**
```typescript
async (context, request, response) => {
  const hasPrivilege = await checkPrivileges(['deleteUsers']);
  if (!hasPrivilege) {
    return response.forbidden();
  }
  await deleteUser(id);
};
```

## Recommended Actions

**Before PR:**
1. ✅ Fix CRITICAL-001 (command injection)
2. ✅ Fix CRITICAL-002 (path traversal)
3. ✅ Fix HIGH-001 (XSS)

**Before merge:**
4. Fix MEDIUM-001 (RBAC check)
```

---

## Example 4: Review Commit Range

**Scenario:** You want to review security changes between two commits.

**Command:**
```bash
/security-reviewer abc123..def456
```

**Output:**
```markdown
# Security Review Report

**Date:** 2024-03-20
**Scope:** Commits abc123..def456 (5 files changed)
**Total findings:** 0

## ✅ No Security Issues Found

All routes have proper:
- ✅ Authorization configuration
- ✅ Input validation
- ✅ RBAC enforcement
- ✅ No XSS risks
- ✅ No injection vulnerabilities

## API Route Security Summary

| Route | Method | Auth | Validation | RBAC | Status |
|-------|--------|------|------------|------|--------|
| `/api/users` | POST | ✅ | ✅ Zod schema | ✅ | ✅ All good |
| `/api/users/{id}` | GET | ✅ | ✅ Zod schema | ✅ | ✅ All good |
| `/api/users/{id}` | PUT | ✅ | ✅ Zod schema | ✅ | ✅ All good |

**Sign-off:**
- [x] All security checks passed
- [x] Ready for merge
```

---

## Example 5: Security Review with Auto-Trigger

**Scenario:** You add a new API route. The security-reviewer skill auto-triggers because it detects API route changes.

**Code change:**
```typescript
// New file: server/routes/reports.ts
router.post({
  path: '/api/reports/generate',
  validate: {
    request: {
      body: schema.object({
        format: schema.string(),
      }),
    },
  },
});
```

**Auto-trigger detection:**
```
🔍 New API route detected: /api/reports/generate
→ Auto-triggering security review...
```

**Output:**
```markdown
# Security Review Report (Auto-triggered)

**Trigger:** New API route detected
**File:** `server/routes/reports.ts`

## ❌ CRITICAL-001: Missing Authorization

**File:** `server/routes/reports.ts:28`
**Pattern:** No `security.authz` configuration

**Vulnerable code:**
```typescript
router.post({
  path: '/api/reports/generate',
  // No security configuration!
});
```

**Fix:**
```typescript
router.post({
  path: '/api/reports/generate',
  security: {
    authz: {
      requiredPrivileges: ['reporting', 'generate'],
    },
  },
});
```

**Action required:** Add authorization before committing.
```

---

## Example 6: False Positive Handling

**Scenario:** The skill flags `schema.any()` but it's intentional for a legacy API.

**Finding:**
```markdown
## 📝 MEDIUM-001: Permissive Schema

**File:** `plugins/fleet/server/routes/package_policy.ts:42`
**Pattern:** `schema.any()`
```

**Add to allow-list:**

Create `~/.agents/rules/security-patterns.md`:

```markdown
## Allow-list for schema.any()

**File:** `plugins/fleet/server/routes/package_policy.ts:42`
**Pattern:** `schema.any()`
**Reason:** Legacy API, deprecated in v10.0, no new usage allowed
**Accepted by:** @security-team
**Date:** 2024-03-20
```

**Next run:** Skill will skip this false positive.

---

## Example 7: Integration with Pre-commit Hook

**Setup:**

`.git/hooks/pre-commit`:
```bash
#!/bin/bash

echo "Running security review on staged files..."
STAGED_FILES=$(git diff --cached --name-only)

if [ -n "$STAGED_FILES" ]; then
  /security-reviewer $STAGED_FILES

  if [ $? -ne 0 ]; then
    echo "❌ Security review found issues. Fix before committing."
    exit 1
  fi
fi

echo "✅ Security review passed"
```

**Result:**
```bash
$ git commit -m "Add user management API"

Running security review on staged files...

# Security Review Report
**Total findings:** 1 (critical)

## 🚨 CRITICAL-001: Missing Authorization
...

❌ Security review found issues. Fix before committing.
```

**After fix:**
```bash
$ git commit -m "Add user management API"

Running security review on staged files...
✅ Security review passed
[feature/user-management abc123] Add user management API
```

---

## Example 8: Review Multi-file Feature

**Scenario:** You built a new feature spanning multiple files (backend + UI).

**Command:**
```bash
/security-reviewer \
  x-pack/plugins/security_solution/server/routes/alerts.ts \
  x-pack/plugins/security_solution/public/components/alerts/alert_table.tsx \
  x-pack/plugins/security_solution/server/lib/alert_processor.ts
```

**Output:**
```markdown
# Security Review Report

**Date:** 2024-03-20
**Scope:** Multi-file feature review (3 files)
**Total findings:** 2 (1 high, 1 medium)

## ⚠️ HIGH-001: XSS in Alert Table

**File:** `public/components/alerts/alert_table.tsx:102`
**Pattern:** Unescaped user content

**Vulnerable code:**
```typescript
<div dangerouslySetInnerHTML={{ __html: alert.description }} />
```

**Fix:**
```typescript
import { EuiMarkdownFormat } from '@elastic/eui';
<EuiMarkdownFormat>{alert.description}</EuiMarkdownFormat>
```

## 📝 MEDIUM-001: Weak Validation in Alert Processor

**File:** `server/lib/alert_processor.ts:58`
**Pattern:** No input length limits

**Recommendation:**
```typescript
if (alert.description.length > 10000) {
  throw new Error('Description too long');
}
```

## Cross-File Security Summary

**Backend → UI Data Flow:**
1. `routes/alerts.ts` → Fetches alert data (✅ auth OK)
2. `lib/alert_processor.ts` → Processes data (⚠️ no length limits)
3. `public/components/alerts/alert_table.tsx` → Renders data (❌ XSS risk)

**Recommendation:** Add validation at ingestion (step 2) and sanitization at render (step 3).
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `/security-reviewer` | Review uncommitted changes |
| `/security-reviewer file.ts` | Review specific file |
| `/security-reviewer file1.ts file2.tsx` | Review multiple files |
| `/security-reviewer abc123..def456` | Review commit range |
| `./test/validate.sh` | Run validation tests |

## Expected Findings Per Vulnerability Type

| Vulnerability | Severity | Typical Finding Count |
|---------------|----------|----------------------|
| SQL Injection | CRITICAL | 0-1 per codebase |
| Command Injection | CRITICAL | 0-1 per codebase |
| Path Traversal | CRITICAL | 0-2 per codebase |
| Auth Bypass | CRITICAL | 0-3 per feature |
| XSS | HIGH | 1-5 per UI-heavy feature |
| CSRF | HIGH | 0-1 per codebase |
| Weak Validation | MEDIUM | 2-10 per feature |
| Missing RBAC | MEDIUM | 1-5 per feature |

## Tips

1. **Run early, run often** - Catch issues before code review
2. **Review API routes first** - Highest risk surface
3. **Check UI components for XSS** - Second highest risk
4. **Use allow-list for false positives** - Keep signal-to-noise high
5. **Integrate with CI/CD** - Automate security checks
6. **Update skill patterns** - Add new vulnerability patterns as discovered
