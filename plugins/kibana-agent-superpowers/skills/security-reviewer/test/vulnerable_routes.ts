/*
 * Test file with known vulnerabilities for security-reviewer skill validation
 * DO NOT USE IN PRODUCTION - Contains intentional security flaws
 */

import { schema } from '@kbn/config-schema';
import type { IRouter } from '@kbn/core/server';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export function registerVulnerableRoutes(router: IRouter) {
  // VULNERABILITY: Missing authz configuration
  router.post({
    path: '/api/vulnerable/no-auth',
    validate: {
      request: {
        body: schema.object({
          data: schema.string(),
        }),
      },
    },
  });

  // VULNERABILITY: authz disabled without reason
  router.delete({
    path: '/api/vulnerable/auth-disabled',
    security: {
      authz: {
        enabled: false,
      },
    },
  });

  // VULNERABILITY: schema.any() - too permissive
  router.versioned
    .post({
      path: '/api/vulnerable/weak-validation',
      security: {
        authz: {
          requiredPrivileges: ['plugin'],
        },
      },
    })
    .addVersion(
      {
        version: '1',
        validate: {
          request: {
            body: schema.any(), // DANGER: Accepts anything
          },
        },
      },
      async (context, request, response) => {
        return response.ok({ body: { data: request.body } });
      }
    );

  // VULNERABILITY: SQL injection via template literal in query
  router.versioned
    .post({
      path: '/api/vulnerable/sql-injection',
      security: {
        authz: {
          requiredPrivileges: ['plugin', 'read'],
        },
      },
    })
    .addVersion(
      {
        version: '1',
        validate: {
          request: {
            body: schema.object({
              username: schema.string(),
            }),
          },
        },
      },
      async (context, request, response) => {
        const esClient = (await context.core).elasticsearch.client.asCurrentUser;

        // DANGER: Template literal in ES query
        const searchResult = await esClient.search({
          index: 'users',
          body: {
            query: {
              query_string: {
                query: `user:${request.body.username}`, // SQL INJECTION RISK
              },
            },
          },
        });

        return response.ok({ body: searchResult.hits.hits });
      }
    );

  // VULNERABILITY: Path traversal
  router.versioned
    .get({
      path: '/api/vulnerable/read-file',
      security: {
        authz: {
          requiredPrivileges: ['plugin', 'read'],
        },
      },
    })
    .addVersion(
      {
        version: '1',
        validate: {
          request: {
            query: schema.object({
              filename: schema.string(),
            }),
          },
        },
      },
      async (context, request, response) => {
        // DANGER: User input directly in file path
        const filePath = path.join('/data', request.query.filename);
        const data = fs.readFileSync(filePath, 'utf-8');

        return response.ok({ body: { content: data } });
      }
    );

  // VULNERABILITY: Command injection
  router.versioned
    .post({
      path: '/api/vulnerable/run-command',
      security: {
        authz: {
          requiredPrivileges: ['plugin', 'admin'],
        },
      },
    })
    .addVersion(
      {
        version: '1',
        validate: {
          request: {
            body: schema.object({
              directory: schema.string(),
            }),
          },
        },
      },
      async (context, request, response) => {
        // DANGER: User input in exec
        exec(`ls ${request.body.directory}`, (error, stdout, stderr) => {
          if (error) {
            return response.customError({
              statusCode: 500,
              body: { message: error.message },
            });
          }
          return response.ok({ body: { output: stdout } });
        });

        return response.ok({ body: { status: 'running' } });
      }
    );

  // VULNERABILITY: CSRF disabled
  router.post({
    path: '/api/vulnerable/no-csrf',
    options: {
      xsrfRequired: false, // DANGER: CSRF protection disabled
    },
    security: {
      authz: {
        requiredPrivileges: ['plugin', 'write'],
      },
    },
    validate: {
      request: {
        body: schema.object({
          action: schema.string(),
        }),
      },
    },
  });

  // VULNERABILITY: No RBAC check in handler
  router.versioned
    .delete({
      path: '/api/vulnerable/no-rbac-check',
      security: {
        authz: {
          requiredPrivileges: ['plugin'], // Route-level check only
        },
      },
    })
    .addVersion(
      {
        version: '1',
        validate: {
          request: {
            params: schema.object({
              id: schema.string(),
            }),
          },
        },
      },
      async (context, request, response) => {
        // DANGER: Privileged operation without handler-level RBAC check
        await deleteAllData(request.params.id); // No privilege check!

        return response.ok({ body: { deleted: true } });
      }
    );
}

// Mock privileged operation
async function deleteAllData(id: string) {
  // Dangerous operation that should have additional RBAC check
  console.log(`Deleting all data for ${id}`);
}
