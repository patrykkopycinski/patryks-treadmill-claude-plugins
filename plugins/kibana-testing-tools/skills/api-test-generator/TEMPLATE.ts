/**
 * API Test Generator - Base Template
 *
 * This template shows the minimal structure for generated tests.
 * The skill will fill in route-specific details.
 */

import { apiTest, expect } from '@kbn/scout/api';
import { COMMON_HEADERS } from '../constants';

apiTest.describe('[METHOD] [PATH] [VERSION]', () => {
  // ============================================================================
  // Valid Request Tests
  // ============================================================================

  apiTest('returns 200 with valid request (admin)', async ({ apiClient, requestAuth, log }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        // [GENERATED]: Valid request body based on schema
      },
      query: {
        // [GENERATED]: Valid query params based on schema
      },
    });

    expect(response).toHaveStatusCode(200);
    expect(response.body).toMatchObject({
      // [GENERATED]: Expected response shape based on schema
    });

    log.info('Response:', response.body);
  });

  // ============================================================================
  // RBAC Tests
  // ============================================================================

  // [GENERATED]: One test per role that SHOULD succeed
  apiTest('returns 200 for [ROLE] (has required privileges)', async ({ apiClient, requestAuth }) => {
    const creds = await requestAuth.getApiKeyFor[ROLE]();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...creds.apiKeyHeader },
      body: {
        // [GENERATED]: Valid request body
      },
    });

    expect(response).toHaveStatusCode(200);
  });

  // [GENERATED]: One test per role that SHOULD fail
  apiTest('returns 403 for [ROLE] (missing required privileges)', async ({ apiClient, requestAuth }) => {
    const creds = await requestAuth.getApiKeyFor[ROLE]();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...creds.apiKeyHeader },
      body: {
        // [GENERATED]: Valid request body
      },
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
      body: {
        // [GENERATED]: Valid request body
      },
    });

    expect(response).toHaveStatusCode(401);
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  // [GENERATED]: One test per validation scenario
  apiTest('returns 400 with [VALIDATION_SCENARIO]', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        // [GENERATED]: Invalid data for this scenario
      },
    });

    expect(response).toHaveStatusCode(400);
    expect(response.body).toHaveProperty('message');
    // [GENERATED]: Specific assertion about error message
  });

  // ============================================================================
  // Edge Case Tests
  // ============================================================================

  // [GENERATED]: One test per edge case
  apiTest('[EDGE_CASE_DESCRIPTION]', async ({ apiClient, requestAuth }) => {
    const adminCreds = await requestAuth.getApiKeyForAdmin();

    const response = await apiClient.[method]('[path]', {
      headers: { ...COMMON_HEADERS, ...adminCreds.apiKeyHeader },
      body: {
        // [GENERATED]: Edge case data
      },
    });

    // [GENERATED]: Expected status code and assertions
    expect(response).toHaveStatusCode([EXPECTED_STATUS]);
  });
});

/**
 * Constants Template
 *
 * Suggested for new plugin test suites.
 */

// x-pack/test/api_integration/apis/[PLUGIN]/constants.ts
export const COMMON_HEADERS = {
  'kbn-xsrf': 'kibana',
  'Content-Type': 'application/json',
};

/**
 * Scout Config Template
 *
 * Suggested for new plugin test suites.
 */

// x-pack/test/api_integration/configs/[PLUGIN].scout.ts
import { ScoutServerConfig } from '@kbn/scout';

export const config: ScoutServerConfig = {
  serverless: false,
  projectType: 'es',

  kbnTestServer: {
    serverArgs: [
      '--xpack.security.enabled=true',
      // [GENERATED]: Plugin-specific server args
    ],
  },

  testFiles: [
    // [GENERATED]: Test file paths
    require.resolve('../apis/[PLUGIN]/[ENDPOINT].scout.ts'),
  ],
};
