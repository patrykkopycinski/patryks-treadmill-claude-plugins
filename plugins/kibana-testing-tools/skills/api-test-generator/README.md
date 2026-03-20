# API Test Generator Skill

Auto-generate comprehensive Scout API tests from Kibana route definitions.

## Overview

This skill analyzes Kibana versioned route definitions and generates complete test suites including:
- ✅ Valid request tests (200 OK)
- ❌ Invalid request tests (400 Bad Request)
- 🔒 RBAC tests (viewer, editor, admin)
- 🚫 Authorization tests (401/403)
- 🎯 Edge case tests (boundaries, special chars, unicode)

## Usage

### Activation Phrases

- "Generate API tests for [route/endpoint]"
- "Create tests for new endpoint"
- "Generate Scout tests for this route"
- "Test this API"

### Input

Provide one of:
1. **File path** to route definition: `x-pack/plugins/alerting/server/routes/create_rule.ts`
2. **Endpoint path**: `/api/alerting/rule`
3. **Code snippet** of route definition

### Output

Complete Scout test file with:
1. Valid request test (admin)
2. RBAC tests (all roles)
3. Authentication tests (401)
4. Validation tests (400)
5. Edge case tests (boundaries, special chars)

Plus:
- Suggested file path
- Constants file (if new plugin area)
- Scout config (if new plugin area)
- Command to run tests

## Example

**Input:**
```
Generate API tests for x-pack/plugins/alerting/server/routes/create_rule.ts
```

**Output:**
```typescript
// x-pack/test/api_integration/apis/alerting/create_rule.scout.ts

import { apiTest, expect } from '@kbn/scout/api';
import { COMMON_HEADERS } from '../constants';

apiTest.describe('POST /api/alerting/rule [v2023-10-31]', () => {
  apiTest('returns 200 with valid request (admin)', async ({ apiClient, requestAuth, log }) => {
    // ... complete test implementation
  });

  // ... 15+ comprehensive test cases
});
```

## Features

### 1. Schema-Driven Test Data

Automatically generates valid and invalid test data from route schemas:

- Extracts types, constraints, and requirements
- Generates realistic domain-specific values
- Creates boundary-case test data
- Handles optional/nullable fields

### 2. RBAC Coverage

Maps route privileges to user roles:

```typescript
requiredPrivileges: ['alerting:write']
→ Editor succeeds (200)
→ Viewer fails (403)
→ Admin succeeds (200)
```

### 3. Edge Cases

Automatically generates edge case tests:
- Empty strings
- Maximum length strings
- Boundary numeric values
- Special characters
- Unicode text
- Null/undefined values

### 4. Validation Tests

Generates tests for all validation scenarios:
- Missing required fields
- Wrong types
- Constraint violations
- Invalid formats

## Files

- **`SKILL.md`** - Main skill instructions
- **`helpers.md`** - Reusable patterns and mappings
- **`example_output.ts`** - Complete example of generated tests
- **`README.md`** - This file

## Requirements

- Target route must use Kibana versioned routing
- Route must have schema validation defined
- RBAC configuration must be present (or skip RBAC tests)

## Limitations

- Only supports `@kbn/config-schema` (not Zod yet)
- Cannot generate tests for routes without schemas
- May need manual adjustments for complex custom validators
- Resource setup (creating test data) may need manual implementation

## Tips

### For Simple CRUD Routes

The skill generates ready-to-run tests. Just:
1. Run the skill
2. Copy the output to the suggested file path
3. Run tests: `node scripts/scout run-tests --testFiles <path>`

### For Complex Routes

You may need to:
1. Add resource setup (create dependencies first)
2. Add cleanup (delete test resources)
3. Adjust test data for business logic constraints
4. Add plugin-specific assertions

### For Routes with External Dependencies

Add service mocks or setup:

```typescript
apiTest.before(async ({ kbnClient }) => {
  // Set up external service or mock
  await kbnClient.savedObjects.create('alert-rule-type', { ... });
});
```

## Integration with Kibana

Generated tests follow Kibana conventions:
- ✅ Scout API test patterns
- ✅ `snake_case` filenames
- ✅ Versioned route handling
- ✅ RBAC with `requestAuth` service
- ✅ Standard test structure

Run tests with:
```bash
node scripts/scout run-tests \
  --arch stateful \
  --domain classic \
  --testFiles x-pack/test/api_integration/apis/<plugin>/<endpoint>.scout.ts
```

## Future Enhancements

- [ ] Support Zod schemas
- [ ] Auto-detect resource dependencies
- [ ] Generate integration tests (multi-endpoint flows)
- [ ] Support WebSocket/streaming endpoints
- [ ] Generate performance/load tests
- [ ] Auto-run tests and report results

## Contributing

To improve this skill:
1. Update `SKILL.md` with new patterns
2. Add examples to `example_output.ts`
3. Update `helpers.md` with new mappings
4. Test with diverse route types

## Support

For issues or questions:
- Check `helpers.md` for common patterns
- Review `example_output.ts` for complete example
- Consult Kibana test docs: `x-pack/test/README.md`
