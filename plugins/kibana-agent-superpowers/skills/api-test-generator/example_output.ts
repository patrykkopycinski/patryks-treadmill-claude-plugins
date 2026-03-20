/**
 * Example output from @api-test-generator skill
 *
 * Input route: POST /api/alerting/rule with requiredPrivileges: ['alerting:write']
 *
 * This file demonstrates the expected test structure and completeness.
 */

import { apiTest, expect } from '@kbn/scout/api';
import { COMMON_HEADERS } from '../constants';

apiTest.describe('POST /api/alerting/rule [v2023-10-31]', () => {
  // ============================================================================
  // Valid Request Tests
  // ============================================================================

  apiTest('returns 200 with valid request (admin)', async ({ apiClient, requestAuth, log }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'Test Alert Rule',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: ['test', 'example'],
        schedule: {
          interval: '1m',
        },
        params: {
          threshold: 90,
        },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(200);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: 'Test Alert Rule',
      enabled: true,
      rule_type_id: 'example.threshold',
    });

    log.info('Created rule:', response.body);
  });

  // ============================================================================
  // RBAC Tests
  // ============================================================================

  apiTest('returns 200 for editor (has alerting:write privilege)', async ({ apiClient, requestAuth }) => {
    const editorCreds = await requestAuth.getApiKeyForEditor();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...editorCreds.apiKeyHeader },
      body: {
        name: 'Editor Test Rule',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '5m' },
        params: { threshold: 80 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(200);
  });

  apiTest('returns 403 for viewer (missing alerting:write privilege)', async ({ apiClient, requestAuth }) => {
    const viewerCreds = await requestAuth.getApiKeyForViewer();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...viewerCreds.apiKeyHeader },
      body: {
        name: 'Viewer Test Rule',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(403);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Unauthorized');
  });

  // ============================================================================
  // Authentication Tests
  // ============================================================================

  apiTest('returns 401 without authentication', async ({ apiClient }) => {
    const response = await apiClient.post('api/alerting/rule', {
      headers: COMMON_HEADERS,
      body: {
        name: 'Unauthenticated Test Rule',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(401);
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  apiTest('returns 400 with invalid request body (wrong type)', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'Invalid Rule',
        rule_type_id: 'example.threshold',
        enabled: 'not-a-boolean', // Invalid: should be boolean
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('validation');
  });

  apiTest('returns 400 with missing required fields', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'Incomplete Rule',
        // Missing: rule_type_id, enabled, consumer, schedule, params
        tags: [],
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(400);
    expect(response.body.message).toContain('rule_type_id');
  });

  apiTest('returns 400 with invalid schedule interval', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'Invalid Schedule Rule',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: 'invalid-interval' }, // Invalid format
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(400);
  });

  // ============================================================================
  // Edge Case Tests
  // ============================================================================

  apiTest('handles empty name', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: '',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(400);
    expect(response.body.message).toContain('name');
  });

  apiTest('handles maximum length name', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();
    const maxLengthName = 'x'.repeat(255); // Assuming max length is 255

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: maxLengthName,
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(200);
    expect(response.body.name).toBe(maxLengthName);
  });

  apiTest('rejects name exceeding maximum length', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();
    const tooLongName = 'x'.repeat(256);

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: tooLongName,
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(400);
  });

  apiTest('handles special characters in name', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'Test Rule!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(200);
  });

  apiTest('handles unicode in name', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'Test Rule 测试规则 ルール テスト',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(200);
  });

  apiTest('handles empty tags array', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'No Tags Rule',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(200);
  });

  apiTest('handles empty actions array', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'No Actions Rule',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: ['test'],
        schedule: { interval: '1m' },
        params: { threshold: 90 },
        actions: [],
      },
    });

    expect(response).toHaveStatusCode(200);
  });

  apiTest('handles threshold boundary values', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    // Test minimum value
    const minResponse = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'Min Threshold Rule',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 0 },
        actions: [],
      },
    });

    expect(minResponse).toHaveStatusCode(200);

    // Test maximum value
    const maxResponse = await apiClient.post('api/alerting/rule', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        name: 'Max Threshold Rule',
        rule_type_id: 'example.threshold',
        enabled: true,
        consumer: 'alerts',
        tags: [],
        schedule: { interval: '1m' },
        params: { threshold: 100 },
        actions: [],
      },
    });

    expect(maxResponse).toHaveStatusCode(200);
  });
});
