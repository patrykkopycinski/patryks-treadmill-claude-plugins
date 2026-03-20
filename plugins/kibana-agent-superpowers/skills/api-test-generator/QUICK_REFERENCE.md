# API Test Generator - Quick Reference

Fast lookup for common scenarios.

## Common Activation Patterns

```
✅ "Generate API tests for x-pack/plugins/alerting/server/routes/create_rule.ts"
✅ "Create tests for POST /api/alerting/rule"
✅ "Test this API" [with file path or code snippet]
✅ "Generate Scout tests for the alerts endpoint"
```

## Quick Schema Mappings

| Schema Type | Valid Example | Invalid Example |
|-------------|---------------|-----------------|
| `schema.string()` | `'test-value'` | `123` |
| `schema.number()` | `42` | `'not-a-number'` |
| `schema.boolean()` | `true` | `'not-a-boolean'` |
| `schema.arrayOf(schema.string())` | `['a', 'b']` | `'not-an-array'` |
| `schema.email()` | `'test@example.com'` | `'not-an-email'` |
| `schema.uri()` | `'https://example.com'` | `'not a uri'` |

## Privilege → Role Quick Map

| Privilege | Viewer | Editor | Admin |
|-----------|--------|--------|-------|
| `read`, `monitor` | ✅ | ✅ | ✅ |
| `write`, `create` | ❌ | ✅ | ✅ |
| `manage`, `all` | ❌ | ❌ | ✅ |

## Test Structure Checklist

```typescript
✅ Valid request test (admin) - 200 OK
✅ RBAC tests (per role) - 200 or 403
✅ Missing auth test - 401 Unauthorized
✅ Invalid request tests - 400 Bad Request
  ✅ Wrong types
  ✅ Missing required fields
  ✅ Constraint violations
✅ Edge cases
  ✅ Empty/max length strings
  ✅ Boundary numeric values
  ✅ Special characters
  ✅ Unicode
```

## Common Test Patterns

### Basic Test
```typescript
apiTest('returns 200 with valid request', async ({ apiClient, requestAuth }) => {
  const creds = await requestAuth.getApiKeyForAdmin();
  const response = await apiClient.post('api/endpoint', {
    headers: { ...COMMON_HEADERS, ...creds.apiKeyHeader },
    body: { /* valid data */ },
  });
  expect(response).toHaveStatusCode(200);
});
```

### RBAC Test
```typescript
apiTest('returns 403 for viewer', async ({ apiClient, requestAuth }) => {
  const creds = await requestAuth.getApiKeyForViewer();
  const response = await apiClient.post('api/endpoint', {
    headers: { ...COMMON_HEADERS, ...creds.apiKeyHeader },
    body: { /* valid data */ },
  });
  expect(response).toHaveStatusCode(403);
});
```

### Validation Test
```typescript
apiTest('returns 400 with invalid data', async ({ apiClient, requestAuth }) => {
  const creds = await requestAuth.getApiKeyForAdmin();
  const response = await apiClient.post('api/endpoint', {
    headers: { ...COMMON_HEADERS, ...creds.apiKeyHeader },
    body: { invalid: 'data' },
  });
  expect(response).toHaveStatusCode(400);
  expect(response.body.message).toContain('validation');
});
```

## File Naming Convention

```
Route: POST /api/alerting/rule
File:  x-pack/test/api_integration/apis/alerting/create_rule.scout.ts

Route: GET /api/cases/{case_id}
File:  x-pack/test/api_integration/apis/cases/get_case.scout.ts

Route: PUT /internal/security/policy/{id}
File:  x-pack/test/api_integration/apis/security/update_policy.scout.ts
```

## Run Tests Command

```bash
# Single test file
node scripts/scout run-tests \
  --arch stateful \
  --domain classic \
  --testFiles x-pack/test/api_integration/apis/<plugin>/<endpoint>.scout.ts

# All tests in plugin
node scripts/scout run-tests \
  --arch stateful \
  --domain classic \
  --config x-pack/test/api_integration/configs/<plugin>.scout.ts
```

## Common Issues & Solutions

### Issue: Route has no schema
**Solution:** Skill cannot generate tests. Add schema to route first.

### Issue: Route uses Zod
**Solution:** Not yet supported. Convert to `@kbn/config-schema` or write tests manually.

### Issue: Route requires complex setup
**Solution:** Generate base tests, then manually add setup in `before()` hooks.

### Issue: Invalid test data not failing
**Solution:** Check route validation logic. Schema may allow unexpected values.

### Issue: RBAC tests failing unexpectedly
**Solution:** Verify privilege mapping. Route may require different roles than expected.

## Test Data Generation Tips

### Domain-Specific Names
```typescript
// Alerting
name: 'CPU Usage Alert'
tags: ['infrastructure', 'monitoring']

// Cases
title: 'Security Incident - Suspicious Login'
tags: ['security', 'authentication']

// Security
username: 'test_user_123'
roles: ['admin', 'editor']
```

### Edge Cases
```typescript
// Strings
empty: ''
maxLength: 'x'.repeat(255)
specialChars: '!@#$%^&*()'
unicode: '测试 テスト тест'

// Numbers
min: 0
max: 100
negative: -10

// Arrays
empty: []
single: ['item']
many: ['a', 'b', 'c', 'd']
```

## Output File Structure

```
/Users/patrykkopycinski/.agents/skills/api-test-generator/
├── SKILL.md              # Main skill instructions (read this)
├── helpers.md            # Detailed patterns and mappings
├── example_output.ts     # Complete example output
├── README.md             # Overview and documentation
└── QUICK_REFERENCE.md    # This file (quick lookup)
```

## Next Steps After Generation

1. **Copy output** to suggested file path
2. **Review test data** for domain-specific accuracy
3. **Add resource setup** if needed (create dependencies)
4. **Add cleanup** if needed (delete test resources)
5. **Run tests**:
   ```bash
   node scripts/scout run-tests --testFiles <path>
   ```
6. **Verify all tests pass** or understand expected failures
7. **Commit** with clear message about test coverage

## Integration Checklist

Before committing generated tests:

- [ ] Tests follow Kibana Scout patterns
- [ ] File name is `snake_case`
- [ ] All imports are correct
- [ ] Test data is realistic
- [ ] RBAC tests match actual privileges
- [ ] Edge cases are appropriate
- [ ] Tests pass locally
- [ ] Constants file created (if new plugin area)
- [ ] Scout config updated (if new plugin area)
- [ ] CI will run tests (added to config)

## Pro Tips

1. **Start simple**: Generate tests for GET endpoints first
2. **Validate schemas**: Ensure route schema is complete before generating
3. **Check privileges**: Verify RBAC config matches actual route logic
4. **Test locally**: Always run generated tests before committing
5. **Iterate**: Generate → review → adjust → regenerate if needed
6. **Document**: Add comments for complex test scenarios
7. **Reuse**: Create constants file for common test data
8. **Clean up**: Add cleanup hooks for tests that create resources
