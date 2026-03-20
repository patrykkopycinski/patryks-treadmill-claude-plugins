# API Test Generator Helpers

Reusable patterns and utilities for generating test data and assertions.

## Schema Type Mapping

When parsing Kibana schemas, use these mappings:

### @kbn/config-schema Types

```typescript
// String types
schema.string() → 'test-string-value'
schema.string({ minLength: 5 }) → 'valid-test-string'
schema.string({ maxLength: 10 }) → 'short'
schema.uri() → 'https://example.com'
schema.ip() → '192.168.1.1'
schema.email() → 'test@example.com'

// Numeric types
schema.number() → 42
schema.number({ min: 0, max: 100 }) → 50
schema.number({ min: 0 }) → 10
schema.number({ max: 100 }) → 75

// Boolean
schema.boolean() → true

// Arrays
schema.arrayOf(schema.string()) → ['item1', 'item2']
schema.arrayOf(schema.number()) → [1, 2, 3]

// Objects
schema.object({
  field1: schema.string(),
  field2: schema.number(),
}) → { field1: 'value', field2: 123 }

// Optional/Nullable
schema.maybe(schema.string()) → undefined (or valid value)
schema.nullable(schema.string()) → null (or valid value)

// Enums/Literals
schema.oneOf([schema.literal('a'), schema.literal('b')]) → 'a'

// Conditional
schema.conditional(
  schema.contextRef('is_enabled'),
  schema.literal(true),
  schema.string(),
  schema.never()
) → depends on condition
```

## Privilege to Role Mapping

Default privilege mappings (customize based on actual route requirements):

```typescript
const PRIVILEGE_ROLE_MAP = {
  // Read privileges
  'read': ['viewer', 'editor', 'admin'],
  'monitor': ['viewer', 'editor', 'admin'],
  'cluster_monitor': ['viewer', 'editor', 'admin'],
  'view_index_metadata': ['viewer', 'editor', 'admin'],

  // Write privileges
  'write': ['editor', 'admin'],
  'create': ['editor', 'admin'],
  'index': ['editor', 'admin'],

  // Management privileges
  'manage': ['admin'],
  'manage_index_templates': ['editor', 'admin'],
  'manage_ingest_pipelines': ['editor', 'admin'],
  'manage_ilm': ['admin'],
  'manage_security': ['admin'],

  // Plugin-specific privileges
  'alerting:read': ['viewer', 'editor', 'admin'],
  'alerting:write': ['editor', 'admin'],
  'cases:read': ['viewer', 'editor', 'admin'],
  'cases:write': ['editor', 'admin'],
  'siem:read': ['viewer', 'editor', 'admin'],
  'siem:write': ['editor', 'admin'],

  // Special
  'all': ['admin'],
};
```

## Test Data Generation Patterns

### Domain-Specific Naming

Generate realistic test data based on plugin domain:

```typescript
const DOMAIN_EXAMPLES = {
  alerting: {
    name: 'CPU Usage Alert',
    description: 'Alert when CPU exceeds threshold',
    tags: ['infrastructure', 'cpu', 'monitoring'],
  },
  cases: {
    title: 'Security Incident - Suspicious Login',
    description: 'Multiple failed login attempts detected',
    tags: ['security', 'authentication'],
  },
  security: {
    name: 'Admin User',
    username: 'admin_user',
    roles: ['admin', 'superuser'],
  },
  ml: {
    job_id: 'high-cpu-usage-detection',
    description: 'Detect anomalies in CPU usage',
    analysis_config: { bucket_span: '15m' },
  },
};
```

### Invalid Data Patterns

Common invalid data for validation tests:

```typescript
const INVALID_PATTERNS = {
  // Type mismatches
  stringAsNumber: 123,
  numberAsString: 'not-a-number',
  booleanAsString: 'not-a-boolean',
  arrayAsString: 'not-an-array',
  objectAsString: 'not-an-object',

  // Constraint violations
  emptyString: '',
  tooShortString: 'ab', // when minLength: 5
  tooLongString: 'x'.repeat(1000), // when maxLength: 100
  negativeNumber: -10, // when min: 0
  tooLargeNumber: 1000, // when max: 100

  // Format violations
  invalidEmail: 'not-an-email',
  invalidUri: 'not a uri',
  invalidIp: '999.999.999.999',
  invalidUuid: 'not-a-uuid',

  // Special characters
  specialChars: '!@#$%^&*(){}[]|\\:;"\'<>?,./`~',
  sqlInjection: "'; DROP TABLE users; --",
  xss: '<script>alert("xss")</script>',
  nullByte: 'test\x00value',

  // Edge cases
  unicodeEmoji: '😀🎉🔥',
  unicodeText: '测试 テスト тест',
  longUnicode: '🎉'.repeat(100),
};
```

## Response Assertion Patterns

Common response assertions:

```typescript
// Success responses
expect(response).toHaveStatusCode(200);
expect(response.body).toMatchObject({
  id: expect.any(String),
  created_at: expect.any(String),
  updated_at: expect.any(String),
});

// Error responses
expect(response).toHaveStatusCode(400);
expect(response.body).toHaveProperty('message');
expect(response.body).toHaveProperty('statusCode', 400);
expect(response.body.message).toContain('validation');

// RBAC failures
expect(response).toHaveStatusCode(403);
expect(response.body.message).toMatch(/Unauthorized|Forbidden|insufficient privileges/i);

// Auth failures
expect(response).toHaveStatusCode(401);
expect(response.body.message).toMatch(/Unauthorized|Authentication required/i);

// Not found
expect(response).toHaveStatusCode(404);
expect(response.body.message).toMatch(/not found/i);
```

## Test Organization

Order tests in this priority:

1. **Valid requests** (200/201 success cases)
2. **RBAC tests** (role-based access control)
3. **Authentication tests** (401 missing auth)
4. **Validation tests** (400 invalid requests)
5. **Edge cases** (boundary values, special chars, etc.)

Use comment headers to separate sections:

```typescript
// ============================================================================
// Section Name
// ============================================================================
```

## Path Parameter Handling

For parameterized routes:

```typescript
// Route definition: '/api/cases/{case_id}/comments'
// Test implementation:

const caseId = 'test-case-' + Date.now(); // Generate unique ID

// Create the resource first (if needed)
const createResponse = await apiClient.post('api/cases', {
  headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
  body: { title: 'Test Case', description: 'Test' },
});

const caseId = createResponse.body.id;

// Use it in parameterized route
const commentResponse = await apiClient.post(`api/cases/${caseId}/comments`, {
  headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
  body: { comment: 'Test comment' },
});
```

## Query Parameter Handling

For routes with query parameters:

```typescript
// Route: GET /api/cases?status=open&page=1

const response = await apiClient.get('api/cases', {
  headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
  query: {
    status: 'open',
    page: 1,
    perPage: 10,
  },
});
```

## Constants File Template

When generating a new test suite, suggest this constants file:

```typescript
// x-pack/test/api_integration/apis/[plugin_name]/constants.ts

export const COMMON_HEADERS = {
  'kbn-xsrf': 'kibana',
  'Content-Type': 'application/json',
};

export const DEFAULT_TIMEOUT = 60000; // 60 seconds

export const TEST_USER_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin-password' },
  editor: { username: 'editor', password: 'editor-password' },
  viewer: { username: 'viewer', password: 'viewer-password' },
};

// Plugin-specific constants
export const [PLUGIN]_CONSTANTS = {
  // Add plugin-specific constants
};
```

## Scout Config Template

For new plugin test suites:

```typescript
// x-pack/test/api_integration/configs/[plugin_name].scout.ts

import { ScoutServerConfig } from '@kbn/scout';

export const config: ScoutServerConfig = {
  serverless: false,
  projectType: 'es',

  kbnTestServer: {
    serverArgs: [
      '--xpack.security.enabled=true',
      '--xpack.[plugin].enabled=true',
    ],
  },

  services: {
    // Add custom services if needed
  },

  testFiles: [
    require.resolve('../apis/[plugin_name]/[endpoint].scout.ts'),
  ],
};
```

## Error Message Patterns

Common error messages to check for in validation tests:

```typescript
// Required field missing
expect(response.body.message).toMatch(/required|missing/i);

// Type mismatch
expect(response.body.message).toMatch(/expected.*but received|invalid type/i);

// Constraint violation
expect(response.body.message).toMatch(/minimum|maximum|length|range/i);

// Format violation
expect(response.body.message).toMatch(/invalid format|must be a valid/i);

// Business logic violation
expect(response.body.message).toMatch(/cannot|not allowed|forbidden/i);
```

## Cleanup Patterns

For tests that create resources:

```typescript
apiTest.afterEach(async ({ apiClient, requestAuth }) => {
  // Clean up created resources
  const adminCreds = await requestAuth.getApiKeyForAdmin();

  // Delete test resources
  await apiClient.delete(`api/[resource]/${testResourceId}`, {
    headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
  });
});
```

Or use resource isolation:

```typescript
// Generate unique identifiers per test
const uniqueId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const testName = `Test Resource ${uniqueId}`;
```
