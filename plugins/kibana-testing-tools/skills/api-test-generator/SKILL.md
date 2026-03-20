# API Test Generator

Auto-generate comprehensive Scout API tests from Kibana route definitions.

## Purpose

Parse versioned Kibana route definitions and generate complete test suites including:
- Valid/invalid request tests
- RBAC tests (viewer, editor, admin)
- Authorization tests (401/403)
- Schema-driven test data generation

## Activation

Use this skill when:
- User says "generate API tests for [route/endpoint]"
- User says "create tests for new endpoint"
- User provides a file path to a route definition
- User asks to "test this API" with a route file reference

## Instructions

### 1. Parse Route Definition

First, identify the route file. Ask the user for the file path if not provided.

**Expected patterns:**
```typescript
// Versioned routes
router.versioned
  .post({
    path: '/api/plugin_name/endpoint',
    access: 'public' | 'internal',
    security: {
      authz: {
        requiredPrivileges: ['cluster_monitor', 'manage_index_templates'],
      },
    },
  })
  .addVersion({
    version: '2023-10-31',
    validate: {
      request: {
        body: schema.object({
          name: schema.string(),
          value: schema.number(),
        }),
        query: schema.object({
          filter: schema.maybe(schema.string()),
        }),
        params: schema.object({
          id: schema.string(),
        }),
      },
      response: {
        200: {
          body: () => schema.object({
            id: schema.string(),
            status: schema.string(),
          }),
        },
      },
    },
  });
```

**Extract:**
- Method (GET, POST, PUT, DELETE)
- Path
- Access level (public/internal)
- Required privileges from `security.authz.requiredPrivileges`
- Request schema (body, query, params)
- Response schema
- Version

### 2. Analyze RBAC Requirements

Map `requiredPrivileges` to user roles:

**Privilege → Role mapping:**
```typescript
const PRIVILEGE_ROLE_MAP = {
  // Monitoring
  'cluster_monitor': ['viewer', 'editor', 'admin'],
  'monitor': ['viewer', 'editor', 'admin'],

  // Management
  'manage_index_templates': ['editor', 'admin'],
  'manage_ingest_pipelines': ['editor', 'admin'],
  'manage': ['admin'],

  // Write operations
  'write': ['editor', 'admin'],
  'create': ['editor', 'admin'],

  // Read operations
  'read': ['viewer', 'editor', 'admin'],
  'view_index_metadata': ['viewer', 'editor', 'admin'],

  // All
  'all': ['admin'],
};
```

Determine:
- Which roles should succeed (200)
- Which roles should fail with 403 Forbidden
- Whether endpoint requires authentication (401 if missing)

### 3. Generate Test Data

For each schema field, generate:

**Valid data:**
```typescript
// From schema.string()
validString: 'test-value'

// From schema.string({ minLength: 5, maxLength: 50 })
validString: 'valid-test-string'

// From schema.number({ min: 0, max: 100 })
validNumber: 42

// From schema.boolean()
validBoolean: true

// From schema.arrayOf(schema.string())
validArray: ['item1', 'item2']

// From schema.object()
validObject: { nested: 'value' }

// From schema.maybe() or schema.nullable()
optionalField: undefined // or valid value
```

**Invalid data:**
```typescript
// Wrong type
invalidString: 123
invalidNumber: 'not-a-number'
invalidBoolean: 'not-a-boolean'

// Violates constraints
tooShort: 'abc' // when minLength: 5
tooLong: 'x'.repeat(100) // when maxLength: 50
outOfRange: -10 // when min: 0

// Missing required field
missingRequired: { /* omit required field */ }

// Extra fields
extraFields: { validField: 'value', unexpected: 'field' }
```

### 4. Generate Test Suite

Use this template structure:

```typescript
import { apiTest, expect } from '@kbn/scout/api';
import { COMMON_HEADERS } from '../constants';

apiTest.describe('[METHOD] [PATH]', () => {
  // ============================================================================
  // Valid Request Tests
  // ============================================================================

  apiTest('returns 200 with valid request (admin)', async ({ apiClient, requestAuth, log }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        // Valid body data
      },
      query: {
        // Valid query params
      },
      params: {
        // Valid path params (if path has :id style params)
      },
    });

    expect(response).toHaveStatusCode(200);
    expect(response.body).toMatchObject({
      // Expected response shape
    });

    log.info('Response:', response.body);
  });

  // ============================================================================
  // RBAC Tests
  // ============================================================================

  // For each role that SHOULD succeed
  apiTest('returns 200 for [role] (has required privileges)', async ({ apiClient, requestAuth }) => {
    const creds = await requestAuth.getApiKeyFor[Role](); // getApiKeyForEditor, getApiKeyForViewer

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...creds.apiKeyHeader },
      body: { /* valid data */ },
    });

    expect(response).toHaveStatusCode(200);
  });

  // For each role that SHOULD fail
  apiTest('returns 403 for [role] (missing required privileges)', async ({ apiClient, requestAuth }) => {
    const creds = await requestAuth.getApiKeyFor[Role]();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...creds.apiKeyHeader },
      body: { /* valid data */ },
    });

    expect(response).toHaveStatusCode(403);
    expect(response.body).toHaveProperty('message');
  });

  // ============================================================================
  // Authentication Tests
  // ============================================================================

  apiTest('returns 401 without authentication', async ({ apiClient }) => {
    const response = await apiClient.[method]('[path]', {
      headers: COMMON_HEADERS, // No auth headers
      body: { /* valid data */ },
    });

    expect(response).toHaveStatusCode(401);
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  apiTest('returns 400 with invalid request body', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        // Invalid data (wrong type, missing field, constraint violation)
      },
    });

    expect(response).toHaveStatusCode(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('validation'); // or specific error
  });

  apiTest('returns 400 with missing required fields', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        // Omit required field
      },
    });

    expect(response).toHaveStatusCode(400);
  });

  // ============================================================================
  // Edge Case Tests
  // ============================================================================

  apiTest('handles empty strings', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        stringField: '',
      },
    });

    // Expect 400 if empty not allowed, or 200 if allowed
    expect(response).toHaveStatusCode([expectedStatus]);
  });

  apiTest('handles maximum length strings', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        stringField: 'x'.repeat([maxLength]),
      },
    });

    expect(response).toHaveStatusCode(200);
  });

  apiTest('rejects strings exceeding maximum length', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        stringField: 'x'.repeat([maxLength + 1]),
      },
    });

    expect(response).toHaveStatusCode(400);
  });

  // Add more edge cases based on schema (special chars, unicode, boundary values)
});
```

### 5. Output Format

Generate:
1. **Test file path suggestion:**
   ```
   x-pack/test/api_integration/apis/[plugin_name]/[endpoint_name].scout.ts
   ```

2. **Full test file content** (ready to copy-paste)

3. **Test constants file** (if needed):
   ```typescript
   // x-pack/test/api_integration/apis/[plugin_name]/constants.ts
   export const COMMON_HEADERS = {
     'kbn-xsrf': 'kibana',
     'Content-Type': 'application/json',
   };
   ```

4. **Scout config update** (if new test area):
   ```typescript
   // x-pack/test/api_integration/configs/[plugin_name].scout.ts
   import { ScoutServerConfig } from '@kbn/scout';

   export const config: ScoutServerConfig = {
     serverless: false,
     projectType: 'es',
     services: {},
   };
   ```

### 6. Special Cases

**Handle versioned paths:**
```typescript
// If path contains version in URL: /api/v1/endpoint
// Use the path as-is

// If route uses .addVersion(), note the version in test description
apiTest.describe('POST /api/endpoint [v2023-10-31]', () => { ... });
```

**Handle parameterized paths:**
```typescript
// For paths like: '/api/cases/{case_id}/comments'
// Use concrete value in test:
const response = await apiClient.post('api/cases/test-case-123/comments', {
  params: { case_id: 'test-case-123' },
  // ...
});
```

**Handle optional auth:**
```typescript
// If route has access: 'public' and no requiredPrivileges
// Test both authenticated and unauthenticated access
apiTest('works without authentication (public endpoint)', async ({ apiClient }) => {
  const response = await apiClient.get('[path]', {
    headers: COMMON_HEADERS,
  });
  expect(response).toHaveStatusCode(200);
});
```

### 7. Validation

After generating tests:
1. Check that test file path follows Kibana conventions
2. Verify all required imports are present
3. Ensure test data matches schema constraints
4. Validate RBAC test coverage is complete
5. Confirm edge cases are appropriate for schema

### 8. User Interaction

**Ask for clarification when:**
- Route file has multiple route definitions (which one to test?)
- Schema uses custom validators (need example valid/invalid data)
- Privileges are ambiguous (which roles should succeed?)
- Response schema is complex (need specific fields to assert?)

**Provide:**
- Complete, copy-paste-ready test file
- File path suggestion
- Command to run tests:
  ```bash
  node scripts/scout run-tests --arch stateful --domain classic --testFiles x-pack/test/api_integration/apis/[plugin]/[endpoint].scout.ts
  ```

## Example Usage

**User:** "Generate API tests for the alerts API route in x-pack/plugins/alerting/server/routes/create_rule.ts"

**You:**
1. Read the route file
2. Extract method (POST), path (/api/alerting/rule), privileges (['alerting:write'])
3. Map privileges to roles (editor, admin succeed; viewer fails)
4. Generate valid/invalid test data from schema
5. Output complete test file with all test cases
6. Suggest file path: `x-pack/test/api_integration/apis/alerting/create_rule.scout.ts`

## Success Criteria

- Test file is syntactically valid TypeScript
- All Scout imports are correct
- Test data matches schema constraints
- RBAC tests cover all relevant roles
- Tests are self-contained (no manual data setup unless unavoidable)
- Test descriptions are clear and specific
- File follows Kibana naming conventions (snake_case)

## Notes

- Always use `apiTest` from `@kbn/scout/api`, not `test` from Playwright
- Use `requestAuth.getApiKeyForAdmin()`, `getApiKeyForEditor()`, `getApiKeyForViewer()`
- Include `log.info()` in success cases for debugging
- Group tests with comment headers for readability
- Generate realistic test data (not just 'test', 'foo', '123')
- Consider the plugin domain for test data (e.g., alerting → rule names, security → policy names)
