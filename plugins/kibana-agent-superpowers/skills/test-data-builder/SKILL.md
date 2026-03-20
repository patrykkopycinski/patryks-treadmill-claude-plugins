# Test Data Builder Agent

## Description
Generate high-quality test data for Kibana tests: create mocks from TypeScript interfaces, generate ES archives for Scout tests, build reusable data factories, and produce schema-driven (not random) fixtures.

## Trigger Patterns
- "generate mock data for [type]"
- "create ES archive for [feature]"
- "build factory for [entity]"
- "generate test fixtures for [package]"
- "create sample data matching [schema]"

## Capabilities

### 1. Mock Generation from Types
- Parse TypeScript interfaces
- Generate realistic mock objects
- Support nested types and generics
- Handle union and discriminated union types

### 2. ES Archive Creation
- Generate Elasticsearch documents
- Create index mappings
- Build realistic datasets (users, alerts, logs)
- Export ES archives for Scout tests

### 3. Data Factories
- Create reusable factory functions
- Support customization and overrides
- Generate sequences and variations
- Maintain referential integrity

### 4. Schema-Driven Data
- Respect field constraints (min/max, regex)
- Generate data matching OpenAPI specs
- Follow Kibana data conventions
- Produce deterministic data (seeded RNG)

### 5. Test Fixtures
- Create JSON fixtures for API tests
- Generate UI component test data
- Build integration test scenarios
- Export fixtures in multiple formats

## Mock Generation from TypeScript Types

### Basic Type Inference
```typescript
interface User {
  id: string;
  email: string;
  createdAt: Date;
  age: number;
  isActive: boolean;
  roles: string[];
  metadata?: Record<string, unknown>;
}

// Generated mock
const mockUser: User = {
  id: 'user-123',
  email: 'test.user@elastic.co',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  age: 32,
  isActive: true,
  roles: ['admin', 'user'],
  // metadata omitted (optional)
};
```

**Type Mapping Rules:**
| TypeScript Type | Mock Value Strategy |
|-----------------|---------------------|
| `string` | Descriptive value (not random chars) |
| `number` | Realistic value based on field name |
| `boolean` | `true` for positive fields, `false` for negative |
| `Date` | Fixed date (deterministic) |
| `string[]` | Array with 2-3 items |
| `T \| null` | Provide `T`, omit `null` (happy path) |
| `T \| undefined` | Provide `T` (required path) |
| `T?` (optional) | Omit (minimal mock) |

### Nested Types
```typescript
interface Alert {
  id: string;
  rule: {
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  tags: string[];
  assignee?: {
    id: string;
    name: string;
  };
}

// Generated mock
const mockAlert: Alert = {
  id: 'alert-456',
  rule: {
    name: 'Suspicious Process Execution',
    severity: 'high',
  },
  tags: ['security', 'endpoint'],
  // assignee omitted (optional)
};
```

### Discriminated Unions
```typescript
type Action =
  | { type: 'create'; payload: { name: string } }
  | { type: 'update'; payload: { id: string; name: string } }
  | { type: 'delete'; payload: { id: string } };

// Generate one variant (default: first)
const mockCreateAction: Action = {
  type: 'create',
  payload: { name: 'New Item' },
};

// Or specify variant
const mockUpdateAction: Action = {
  type: 'update',
  payload: { id: 'item-123', name: 'Updated Item' },
};
```

### Factory Generation
```typescript
// Generate factory function from interface
import { faker } from '@faker-js/faker';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Generated factory
export function createMockUser(overrides?: Partial<User>): User {
  faker.seed(123); // Deterministic

  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    createdAt: faker.date.past(),
    ...overrides,
  };
}

// Usage in tests
const user1 = createMockUser({ email: 'custom@elastic.co' });
const user2 = createMockUser({ name: 'Alice Johnson' });
```

## ES Archive Creation

### Archive Structure
```
x-pack/test/scout/fixtures/es_archives/
└── security_alerts/
    ├── mappings.json          # Index mappings
    └── data.json.gz           # Gzipped documents
```

### Mappings Generation
```json
{
  "type": "index",
  "value": {
    "index": ".alerts-security.alerts-default",
    "mappings": {
      "properties": {
        "kibana.alert.rule.name": { "type": "keyword" },
        "kibana.alert.severity": { "type": "keyword" },
        "kibana.alert.status": { "type": "keyword" },
        "kibana.alert.workflow_status": { "type": "keyword" },
        "@timestamp": { "type": "date" },
        "host.name": { "type": "keyword" },
        "user.name": { "type": "keyword" }
      }
    },
    "settings": {
      "index": {
        "number_of_shards": 1,
        "number_of_replicas": 0
      }
    }
  }
}
```

### Data Generation
```typescript
// Generate realistic alert documents
interface AlertDocument {
  '@timestamp': string;
  'kibana.alert.rule.name': string;
  'kibana.alert.severity': 'low' | 'medium' | 'high' | 'critical';
  'kibana.alert.status': 'open' | 'acknowledged' | 'closed';
  'kibana.alert.workflow_status': 'open' | 'acknowledged' | 'closed';
  'host.name': string;
  'user.name': string;
  'kibana.alert.uuid': string;
}

function generateAlertDocuments(count: number): AlertDocument[] {
  const alerts: AlertDocument[] = [];
  const baseTime = new Date('2024-01-15T10:00:00Z').getTime();

  for (let i = 0; i < count; i++) {
    alerts.push({
      '@timestamp': new Date(baseTime + i * 60000).toISOString(),
      'kibana.alert.rule.name': `Rule ${i % 5}`,
      'kibana.alert.severity': ['low', 'medium', 'high', 'critical'][i % 4] as any,
      'kibana.alert.status': 'open',
      'kibana.alert.workflow_status': 'open',
      'host.name': `host-${i % 10}`,
      'user.name': `user${i % 5}`,
      'kibana.alert.uuid': `alert-${i}`,
    });
  }

  return alerts;
}

// Generate data.json
const documents = generateAlertDocuments(100);
const dataJson = documents
  .map((doc) => JSON.stringify({ type: 'doc', value: { index: '.alerts-security.alerts-default', source: doc } }))
  .join('\n');

// Gzip and save
import { gzipSync } from 'zlib';
import { writeFileSync } from 'fs';

const compressed = gzipSync(dataJson);
writeFileSync('x-pack/test/scout/fixtures/es_archives/security_alerts/data.json.gz', compressed);
```

### Loading ES Archives in Scout Tests
```typescript
import { expect, test } from '@playwright/test';
import { createScoutInstance } from '@kbn/scout';

test.describe('Security Alerts', () => {
  test.beforeEach(async ({ page }) => {
    const scout = await createScoutInstance(page);

    // Load ES archive
    await scout.powerBar.loadEsArchive('security_alerts');
  });

  test.afterEach(async ({ page }) => {
    const scout = await createScoutInstance(page);

    // Unload ES archive
    await scout.powerBar.unloadEsArchive('security_alerts');
  });

  test('should display 100 alerts', async ({ page }) => {
    const scout = await createScoutInstance(page);
    await scout.common.navigateTo('securitySolution', { path: '/alerts' });

    await expect(page.getByTestId('alerts-table')).toBeVisible();
    await expect(page.getByTestId('alerts-count')).toContainText('100');
  });
});
```

## Data Factories

### Factory Pattern
```typescript
// x-pack/test/security_solution/factories/alert_factory.ts

import { faker } from '@faker-js/faker';

export interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'closed';
  timestamp: Date;
  host: string;
  user: string;
}

let alertCounter = 0;

export function createAlert(overrides?: Partial<Alert>): Alert {
  faker.seed(alertCounter++); // Deterministic but unique

  return {
    id: `alert-${alertCounter}`,
    name: faker.helpers.arrayElement([
      'Suspicious Process Execution',
      'Unusual Network Activity',
      'Privilege Escalation Detected',
      'Malware Detected',
    ]),
    severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
    status: 'open',
    timestamp: faker.date.recent({ days: 7 }),
    host: `host-${faker.number.int({ min: 1, max: 10 })}`,
    user: `user${faker.number.int({ min: 1, max: 5 })}`,
    ...overrides,
  };
}

// Usage: Generate multiple alerts
export function createAlerts(count: number, overrides?: Partial<Alert>): Alert[] {
  return Array.from({ length: count }, () => createAlert(overrides));
}

// Usage: Generate alerts with relationships
export function createAlertsByHost(hostName: string, count: number): Alert[] {
  return createAlerts(count, { host: hostName });
}
```

### Factory Composition
```typescript
// Compose factories for complex scenarios
import { createAlert, Alert } from './alert_factory';
import { createUser, User } from './user_factory';

export interface Investigation {
  id: string;
  alerts: Alert[];
  assignee: User;
  createdAt: Date;
  status: 'open' | 'in_progress' | 'closed';
}

export function createInvestigation(overrides?: Partial<Investigation>): Investigation {
  const alerts = createAlerts(5);
  const assignee = createUser({ roles: ['analyst'] });

  return {
    id: `investigation-${Date.now()}`,
    alerts,
    assignee,
    createdAt: new Date(),
    status: 'open',
    ...overrides,
  };
}

// Usage in tests
test('should display investigation with 5 alerts', async () => {
  const investigation = createInvestigation({
    alerts: createAlerts(5, { severity: 'high' }),
  });

  // Use investigation in test
});
```

## Schema-Driven Data

### OpenAPI to Mock
```yaml
# openapi.yaml
components:
  schemas:
    Alert:
      type: object
      required:
        - id
        - rule_name
        - severity
      properties:
        id:
          type: string
          format: uuid
        rule_name:
          type: string
          minLength: 3
          maxLength: 100
        severity:
          type: string
          enum: [low, medium, high, critical]
        tags:
          type: array
          items:
            type: string
          maxItems: 10
```

```typescript
// Generated mock respecting schema constraints
import { faker } from '@faker-js/faker';

export function createAlertFromSchema(): Alert {
  return {
    id: faker.string.uuid(), // format: uuid
    rule_name: faker.lorem.words(3), // minLength: 3
    severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']), // enum
    tags: faker.helpers.arrayElements(['security', 'network', 'endpoint'], { min: 1, max: 10 }), // maxItems: 10
  };
}
```

### Elasticsearch Field Types
```typescript
// Respect ES field type constraints
interface ESDocument {
  '@timestamp': Date; // ES date type
  'host.name': string; // ES keyword (no spaces, <256 chars)
  'event.duration': number; // ES long (integer)
  'message': string; // ES text (can be long)
  'tags': string[]; // ES keyword array
}

export function createESDocument(): ESDocument {
  return {
    '@timestamp': new Date(), // ISO string for ES
    'host.name': 'host-01', // No spaces, short
    'event.duration': 1234567, // Integer (nanoseconds)
    'message': 'User logged in successfully', // Human-readable
    'tags': ['auth', 'success'], // Short keywords
  };
}
```

## Test Fixture Generation

### API Test Fixtures
```typescript
// x-pack/test/security_solution/fixtures/alerts_api.json
export const alertsApiFixtures = {
  // GET /api/detection_engine/rules
  listRules: {
    status: 200,
    body: {
      data: [
        {
          id: 'rule-123',
          name: 'Suspicious Process',
          enabled: true,
          severity: 'high',
        },
        {
          id: 'rule-456',
          name: 'Network Anomaly',
          enabled: false,
          severity: 'medium',
        },
      ],
      total: 2,
      page: 1,
      perPage: 20,
    },
  },

  // POST /api/detection_engine/rules
  createRule: {
    request: {
      name: 'Test Rule',
      description: 'A test rule',
      severity: 'low',
      riskScore: 21,
      type: 'query',
      query: '*:*',
    },
    response: {
      status: 201,
      body: {
        id: 'rule-789',
        name: 'Test Rule',
        enabled: true,
      },
    },
  },
};
```

### Component Test Fixtures
```typescript
// x-pack/solutions/security/plugins/security_solution/public/alerts/components/alert_table.test.tsx

import { createAlerts } from '../factories/alert_factory';

describe('AlertTable', () => {
  it('should render 10 alerts', () => {
    const alerts = createAlerts(10);

    render(<AlertTable alerts={alerts} />);

    expect(screen.getAllByRole('row')).toHaveLength(11); // +1 header
  });

  it('should filter by severity', () => {
    const alerts = [
      ...createAlerts(5, { severity: 'high' }),
      ...createAlerts(5, { severity: 'low' }),
    ];

    render(<AlertTable alerts={alerts} />);

    fireEvent.change(screen.getByLabelText('Severity'), { target: { value: 'high' } });

    expect(screen.getAllByRole('row')).toHaveLength(6); // +1 header
  });
});
```

## Tools & Commands

### Parse TypeScript Types
```bash
# Extract type definition from file
cat src/core/server/http/types.ts | grep -A 20 "interface HttpServer"

# Use TypeScript compiler API to parse types
npx ts-node <<EOF
import * as ts from 'typescript';
import * as fs from 'fs';

const sourceFile = ts.createSourceFile(
  'types.ts',
  fs.readFileSync('src/core/server/http/types.ts', 'utf8'),
  ts.ScriptTarget.Latest
);

ts.forEachChild(sourceFile, (node) => {
  if (ts.isInterfaceDeclaration(node)) {
    console.log('Interface:', node.name.text);
    node.members.forEach((member) => {
      if (ts.isPropertySignature(member)) {
        console.log('  -', member.name?.getText(), ':', member.type?.getText());
      }
    });
  }
});
EOF
```

### Generate ES Archive
```bash
# Step 1: Generate mappings.json
cat > mappings.json <<EOF
{
  "type": "index",
  "value": {
    "index": ".alerts-security.alerts-default",
    "mappings": { /* ... */ }
  }
}
EOF

# Step 2: Generate data.json (from TypeScript)
npx ts-node generate_alerts.ts > data.json

# Step 3: Gzip data
gzip data.json

# Step 4: Move to ES archives directory
mkdir -p x-pack/test/scout/fixtures/es_archives/my_archive
mv mappings.json x-pack/test/scout/fixtures/es_archives/my_archive/
mv data.json.gz x-pack/test/scout/fixtures/es_archives/my_archive/
```

### Validate ES Archive
```bash
# Check archive can be loaded
node scripts/scout run-tests --config x-pack/test/scout_functional/apps/my_feature/config.ts

# If errors, check:
# - Mappings match data fields
# - Data is valid JSON
# - Gzip format is correct

# Extract and inspect data
gunzip -c x-pack/test/scout/fixtures/es_archives/my_archive/data.json.gz | head -20
```

## Integration with Other Skills

### With `@kibana-precommit-checks`
```bash
# Validate generated test data before committing
@kibana-precommit-checks --scope test

# Ensures:
# - Generated types are valid
# - Test fixtures are well-formed
# - ES archives are not corrupt
```

### With `@migration-planner`
```bash
# Generate test data for migration validation
@migration-planner create migration for Alerts API v2
@test-data-builder generate ES archive for Alerts API v1 and v2

# Compare data schemas between versions
```

### With `@qa-browser-verification`
```bash
# Generate test data for browser testing
@test-data-builder create ES archive for 1000 alerts
@qa-browser-verification test pagination with large dataset
```

## Examples

### Example 1: Generate Mock from Interface
**User:** "generate mock data for Alert interface in security_solution"

**Agent Actions:**
```typescript
// 1. Find interface definition
// x-pack/solutions/security/plugins/security_solution/common/types/alert.ts

interface Alert {
  id: string;
  'kibana.alert.rule.name': string;
  'kibana.alert.severity': 'low' | 'medium' | 'high' | 'critical';
  '@timestamp': Date;
}

// 2. Generate mock
const mockAlert: Alert = {
  id: 'alert-123',
  'kibana.alert.rule.name': 'Suspicious Process Execution',
  'kibana.alert.severity': 'high',
  '@timestamp': new Date('2024-01-15T10:00:00Z'),
};

// 3. Generate factory
export function createMockAlert(overrides?: Partial<Alert>): Alert {
  return {
    id: faker.string.uuid(),
    'kibana.alert.rule.name': faker.helpers.arrayElement([
      'Suspicious Process',
      'Network Anomaly',
      'Privilege Escalation',
    ]),
    'kibana.alert.severity': faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
    '@timestamp': faker.date.recent({ days: 7 }),
    ...overrides,
  };
}
```

**Output:** Factory function saved to `alert_factory.ts`.

### Example 2: Create ES Archive for Scout Tests
**User:** "create ES archive for 100 security alerts"

**Agent Actions:**
```bash
# 1. Generate mappings
cat > mappings.json <<EOF
{
  "type": "index",
  "value": {
    "index": ".alerts-security.alerts-default",
    "mappings": {
      "properties": {
        "kibana.alert.rule.name": { "type": "keyword" },
        "kibana.alert.severity": { "type": "keyword" },
        "@timestamp": { "type": "date" }
      }
    }
  }
}
EOF

# 2. Generate data (TypeScript script)
npx ts-node <<EOF
import { gzipSync } from 'zlib';
import { writeFileSync } from 'fs';

const alerts = Array.from({ length: 100 }, (_, i) => ({
  type: 'doc',
  value: {
    index: '.alerts-security.alerts-default',
    source: {
      'kibana.alert.rule.name': \`Rule \${i % 5}\`,
      'kibana.alert.severity': ['low', 'medium', 'high', 'critical'][i % 4],
      '@timestamp': new Date(Date.now() - i * 60000).toISOString(),
    },
  },
}));

const dataJson = alerts.map((doc) => JSON.stringify(doc)).join('\n');
writeFileSync('data.json.gz', gzipSync(dataJson));
EOF

# 3. Move to ES archives
mkdir -p x-pack/test/scout/fixtures/es_archives/security_alerts_100
mv mappings.json data.json.gz x-pack/test/scout/fixtures/es_archives/security_alerts_100/

# 4. Test archive loading
node scripts/scout run-tests --config x-pack/test/scout_functional/apps/security/config.ts
```

**Output:** ES archive ready for Scout tests.

### Example 3: Generate Reusable Factory
**User:** "build factory for Investigation entity with nested alerts"

**Agent Actions:**
```typescript
// 1. Define types
interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Investigation {
  id: string;
  alerts: Alert[];
  assignee: string;
  status: 'open' | 'closed';
}

// 2. Create alert factory
function createAlert(overrides?: Partial<Alert>): Alert {
  return {
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(['Suspicious Process', 'Network Anomaly']),
    severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
    ...overrides,
  };
}

// 3. Create investigation factory
export function createInvestigation(overrides?: Partial<Investigation>): Investigation {
  return {
    id: faker.string.uuid(),
    alerts: Array.from({ length: 5 }, () => createAlert()),
    assignee: faker.person.fullName(),
    status: 'open',
    ...overrides,
  };
}

// 4. Usage in tests
const investigation = createInvestigation({
  alerts: [
    createAlert({ severity: 'high' }),
    createAlert({ severity: 'critical' }),
  ],
});
```

**Output:** Composable factories for nested entities.

## Best Practices

### Mock Data
- ✅ Use descriptive values (not random strings)
- ✅ Make data deterministic (seeded RNG)
- ✅ Respect type constraints (enums, lengths)
- ✅ Provide factory functions for reusability
- ❌ Don't use truly random data (flaky tests)
- ❌ Don't hardcode mocks in tests (use factories)

### ES Archives
- ✅ Generate realistic document counts (100-1000)
- ✅ Include variety (different severities, hosts)
- ✅ Use correct field types (keyword vs text)
- ✅ Gzip data files (reduce repo size)
- ❌ Don't include PII or sensitive data
- ❌ Don't create huge archives (>10MB)

### Factories
- ✅ Support partial overrides (flexibility)
- ✅ Use faker for realistic data
- ✅ Maintain referential integrity (IDs match)
- ✅ Compose factories for complex scenarios
- ❌ Don't expose faker directly (encapsulate)
- ❌ Don't create circular dependencies

## Anti-Patterns

### ❌ Don't Do This
```typescript
// Random strings (hard to debug)
const user = { name: 'asdjkl123', email: 'qwerty@xyz.com' };

// Truly random (non-deterministic tests)
const count = Math.floor(Math.random() * 100);

// Hardcoded in tests (not reusable)
const alert = { id: '123', name: 'Test Alert', severity: 'high' };
```

### ✅ Do This Instead
```typescript
// Descriptive values
const user = { name: 'Test User', email: 'test.user@elastic.co' };

// Deterministic (seeded faker)
faker.seed(123);
const count = faker.number.int({ min: 10, max: 100 });

// Factory function (reusable)
const alert = createAlert({ severity: 'high' });
```

## Notes
- Use `@faker-js/faker` for data generation (install if missing)
- ES archives must be gzipped (save repo space)
- Factories should be in `test/factories/` directory
- Seed faker for deterministic tests (`faker.seed(123)`)
- Respect Kibana data conventions (ECS fields, naming)
