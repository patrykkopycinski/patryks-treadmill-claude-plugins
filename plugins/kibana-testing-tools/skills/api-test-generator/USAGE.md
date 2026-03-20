# API Test Generator - Usage Guide

Step-by-step guide for using the API Test Generator skill.

## Prerequisites

1. **Target route exists** and uses Kibana versioned routing
2. **Route has schema validation** defined with `@kbn/config-schema`
3. **RBAC configuration** is present (optional but recommended)

## Step-by-Step Usage

### 1. Activate the Skill

Use any of these phrases:
```
"Generate API tests for x-pack/plugins/alerting/server/routes/create_rule.ts"
"Create tests for POST /api/alerting/rule"
"Test this API" [with route file path]
```

### 2. Provide Input

The skill needs:
- **Route file path**: e.g., `x-pack/plugins/alerting/server/routes/create_rule.ts`
- **OR endpoint path**: e.g., `/api/alerting/rule`
- **OR code snippet**: Paste the route definition

### 3. Skill Analyzes Route

The skill will:
1. Read the route file
2. Extract method, path, version
3. Extract request/response schemas
4. Extract RBAC configuration
5. Map privileges to roles

### 4. Review Generated Output

You'll receive:
1. **Complete test file** - Ready to copy/paste
2. **Suggested file path** - Where to save the file
3. **Constants file** - If new plugin area
4. **Scout config** - If new plugin area
5. **Run command** - How to execute tests

### 5. Copy Output

```bash
# Create test file
cat > x-pack/test/api_integration/apis/alerting/create_rule.scout.ts << 'EOF'
[PASTE GENERATED TEST CODE]
EOF

# Create constants file (if provided)
cat > x-pack/test/api_integration/apis/alerting/constants.ts << 'EOF'
[PASTE GENERATED CONSTANTS]
EOF
```

### 6. Review & Adjust

Check for:
- [ ] Test data is realistic for your domain
- [ ] RBAC tests match actual privileges
- [ ] Edge cases are appropriate
- [ ] Resource setup needed (if route requires existing data)
- [ ] Cleanup needed (if tests create resources)

### 7. Run Tests Locally

```bash
node scripts/scout run-tests \
  --arch stateful \
  --domain classic \
  --testFiles x-pack/test/api_integration/apis/alerting/create_rule.scout.ts
```

### 8. Verify Results

- [ ] All tests pass (or expected failures are understood)
- [ ] Valid request test succeeds (200)
- [ ] RBAC tests match expectations
- [ ] Validation tests catch bad data (400)
- [ ] Edge cases behave correctly

### 9. Commit

```bash
git add x-pack/test/api_integration/apis/alerting/
git commit -m "test(alerting): add Scout API tests for create rule endpoint"
```

## Example Session

**You:**
```
Generate API tests for x-pack/plugins/alerting/server/routes/create_rule.ts
```

**Assistant:**
```
I'll analyze the route definition and generate comprehensive Scout API tests.

[Reads route file]
[Extracts schemas and RBAC config]
[Generates complete test suite]

Here's your test file:
[Shows complete test code]

Save to: x-pack/test/api_integration/apis/alerting/create_rule.scout.ts

Run with:
node scripts/scout run-tests --arch stateful --domain classic --testFiles x-pack/test/api_integration/apis/alerting/create_rule.scout.ts
```

## Common Scenarios

### Scenario 1: Simple GET Endpoint

**Input:**
```
Generate tests for GET /api/status
```

**Output:**
```typescript
apiTest.describe('GET /api/status', () => {
  apiTest('returns 200 with status info', async ({ apiClient, requestAuth }) => {
    const creds = await requestAuth.getApiKeyForViewer(); // Read-only
    const response = await apiClient.get('api/status', {
      headers: { ...COMMON_HEADERS, ...creds.apiKeyHeader },
    });
    expect(response).toHaveStatusCode(200);
    expect(response.body).toMatchObject({
      status: expect.any(String),
      uptime: expect.any(Number),
    });
  });
});
```

### Scenario 2: POST with Schema Validation

**Input:**
```
Generate tests for POST /api/alerting/rule with schema validation
```

**Output:**
- Valid request test (200)
- Invalid request tests (400)
  - Wrong types
  - Missing required fields
  - Constraint violations
- RBAC tests (editor succeeds, viewer fails)
- Auth test (401 without credentials)

### Scenario 3: PUT with Path Parameters

**Input:**
```
Generate tests for PUT /api/cases/{case_id}
```

**Output:**
- Tests with concrete case_id value
- Setup to create test case first
- Valid update test (200)
- Not found test (404)
- RBAC tests
- Validation tests

### Scenario 4: DELETE with Authorization

**Input:**
```
Generate tests for DELETE /api/data/{id} with admin-only access
```

**Output:**
- Admin succeeds (204)
- Editor fails (403)
- Viewer fails (403)
- Without auth fails (401)
- Not found test (404)

## Customization Tips

### Add Resource Setup

If route requires existing data:

```typescript
apiTest.before(async ({ apiClient, requestAuth }) => {
  const adminCreds = await requestAuth.getApiKeyForAdmin();

  // Create test resource
  const response = await apiClient.post('api/test-resource', {
    headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
    body: { name: 'Test Resource' },
  });

  testResourceId = response.body.id;
});
```

### Add Cleanup

If tests create resources:

```typescript
apiTest.afterEach(async ({ apiClient, requestAuth }) => {
  const adminCreds = await requestAuth.getApiKeyForAdmin();

  // Delete test resource
  await apiClient.delete(`api/test-resource/${testResourceId}`, {
    headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
  });
});
```

### Adjust Test Data

Make data more realistic:

```typescript
// Generated (generic)
body: { name: 'test-value', threshold: 50 }

// Adjusted (domain-specific)
body: {
  name: 'High CPU Usage Alert',
  threshold: 90,
  description: 'Alert when CPU exceeds 90% for 5 minutes',
  tags: ['infrastructure', 'cpu', 'critical'],
}
```

### Add Custom Assertions

For complex responses:

```typescript
expect(response.body).toMatchObject({
  id: expect.any(String),
  created_at: expect.any(String),
});

// Add custom assertions
expect(response.body.id).toMatch(/^alert-[a-f0-9]{8}-/);
expect(new Date(response.body.created_at).getTime()).toBeGreaterThan(Date.now() - 60000);
expect(response.body.tags).toHaveLength(3);
```

## Troubleshooting

### Issue: Generated tests don't match route behavior

**Cause:** Schema might not reflect actual validation logic.

**Solution:**
1. Check route handler code for additional validation
2. Adjust test data to match actual requirements
3. Add comments explaining discrepancies

### Issue: RBAC tests failing unexpectedly

**Cause:** Privilege mapping might be incorrect.

**Solution:**
1. Check actual route RBAC config
2. Verify role definitions in Kibana
3. Adjust expected status codes in tests
4. Add comments about actual privilege requirements

### Issue: Can't run tests - Scout not configured

**Cause:** Scout config missing for plugin.

**Solution:**
1. Use generated Scout config template
2. Add test files to config
3. Add plugin-specific server args
4. Register config in test runner

### Issue: Tests create too much test data

**Cause:** No cleanup hooks.

**Solution:**
1. Add `afterEach` or `after` hooks
2. Delete created resources
3. Use unique identifiers per test
4. Consider using test isolation

## Best Practices

1. **Review before committing** - Always review generated tests
2. **Run locally first** - Verify tests pass before pushing
3. **Adjust test data** - Make it realistic and meaningful
4. **Add comments** - Explain non-obvious test scenarios
5. **Group related tests** - Use describe blocks effectively
6. **Keep tests focused** - One assertion per test when possible
7. **Use constants** - Extract common values to constants file
8. **Document edge cases** - Explain why specific edge cases are tested
9. **Clean up resources** - Don't leave test data in system
10. **Follow conventions** - Match existing test patterns in codebase

## Quick Commands

```bash
# Generate tests
"Generate API tests for [route-file-path]"

# Run single test file
node scripts/scout run-tests --testFiles [path]

# Run all tests for plugin
node scripts/scout run-tests --config [config-path]

# Run with specific test pattern
node scripts/scout run-tests --testFiles [path] --grep "[pattern]"

# Run in watch mode (if supported)
node scripts/scout run-tests --testFiles [path] --watch

# Run with debug logging
DEBUG=scout:* node scripts/scout run-tests --testFiles [path]
```

## Next Steps

After generating and running tests:

1. **Create PR** with generated tests
2. **Link to route implementation** in PR description
3. **Document test coverage** (what's tested, what's not)
4. **Update test docs** if introducing new patterns
5. **Share learnings** with team about any issues found

## Getting Help

- **Skill issues**: Review `SKILL.md` for instructions
- **Pattern questions**: Check `helpers.md` for mappings
- **Example needed**: See `example_output.ts`
- **Quick lookup**: Use `QUICK_REFERENCE.md`
- **Template needed**: See `TEMPLATE.ts`

## Feedback

If you find issues or have suggestions:
1. Document the gap
2. Propose a solution
3. Submit feedback to DevEx: `echo "..." | scripts/devex_feedback.sh`
