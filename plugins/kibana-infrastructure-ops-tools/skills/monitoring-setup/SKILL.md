---
name: monitoring-setup
description: Add monitoring and observability to Kibana features including APM tracing, custom metrics, structured logging, dashboards, and alerting.
---

# Monitoring Setup

## Purpose
Add monitoring and observability to Kibana features - APM tracing, custom metrics, logging, dashboards, and alerting.

## Capabilities
- Add APM tracing to critical code paths
- Add custom metrics (counters, histograms, gauges)
- Add structured logging with appropriate levels
- Create Kibana dashboards for monitoring
- Suggest alerts (error rate, latency thresholds)
- Integration with Elastic APM and Metrics

## Triggers
- "add monitoring"
- "set up observability"
- "create metrics"
- "add tracing"
- "monitor this feature"

## Implementation

### 1. APM Tracing in Kibana

Kibana has built-in APM support. Instrument critical paths:

```typescript
// server-side tracing
import type { ElasticsearchClient, Logger } from '@kbn/core/server';

export async function executeQuery(
  esClient: ElasticsearchClient,
  logger: Logger,
  params: QueryParams
) {
  // Start APM span
  const span = apm.startSpan('execute_query', 'db.elasticsearch');

  try {
    logger.debug('Executing query', { params });

    // Your code here
    const result = await esClient.search({
      index: params.index,
      body: params.query,
    });

    // Add metadata to span
    span?.addLabels({
      index: params.index,
      result_count: result.hits.total.value,
    });

    return result;
  } catch (error) {
    // Capture error in APM
    apm.captureError(error);
    logger.error('Query execution failed', { error, params });
    throw error;
  } finally {
    // End span
    span?.end();
  }
}
```

**Key tracing points:**
- API endpoints (request/response)
- Database queries
- External API calls
- Long-running operations
- Background tasks

### 2. Custom Metrics

Kibana uses `@kbn/core-metrics-server` for custom metrics:

```typescript
// In plugin setup
import type { CoreSetup, Plugin, PluginInitializerContext } from '@kbn/core/server';
import { Subject } from 'rxjs';

interface MyPluginMetrics {
  requests_total: number;
  request_duration_ms: number[];
  active_connections: number;
  errors_total: number;
}

export class MyPlugin implements Plugin {
  private metrics$ = new Subject<MyPluginMetrics>();

  constructor(private readonly context: PluginInitializerContext) {}

  public setup(core: CoreSetup) {
    // Register custom metrics
    core.metrics.getOpsMetrics$().subscribe((metrics) => {
      // Emit custom metrics
      this.metrics$.next({
        requests_total: this.requestCounter,
        request_duration_ms: this.durations,
        active_connections: this.activeConnections,
        errors_total: this.errorCounter,
      });
    });

    // Expose metrics for collection
    return {
      metrics$: this.metrics$.asObservable(),
    };
  }
}

// In route handler
router.post(
  {
    path: '/api/my-plugin/action',
    validate: { body: schema.object({ data: schema.string() }) },
  },
  async (context, request, response) => {
    const startTime = Date.now();
    this.requestCounter++;
    this.activeConnections++;

    try {
      const result = await doSomething(request.body.data);

      // Record duration
      const duration = Date.now() - startTime;
      this.durations.push(duration);

      return response.ok({ body: result });
    } catch (error) {
      this.errorCounter++;
      return response.customError({
        statusCode: 500,
        body: { message: error.message },
      });
    } finally {
      this.activeConnections--;
    }
  }
);
```

**Common metrics to track:**
- Request count (counter)
- Request duration (histogram)
- Error count (counter)
- Active connections (gauge)
- Queue size (gauge)
- Cache hit rate (ratio)

### 3. Structured Logging

Use the Logger from `@kbn/core`:

```typescript
import type { Logger } from '@kbn/core/server';

export class MyService {
  constructor(private readonly logger: Logger) {}

  public async processItem(item: Item) {
    // Debug: Verbose details for troubleshooting
    this.logger.debug('Processing item', {
      item_id: item.id,
      item_type: item.type,
    });

    try {
      const result = await this.doWork(item);

      // Info: Important business events
      this.logger.info('Item processed successfully', {
        item_id: item.id,
        duration_ms: result.duration,
      });

      return result;
    } catch (error) {
      // Error: Failures that need attention
      this.logger.error('Failed to process item', {
        item_id: item.id,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  // Warn: Potential issues (not failures)
  public validateConfig(config: Config) {
    if (config.timeout > 30000) {
      this.logger.warn('Timeout is very high', {
        timeout: config.timeout,
        recommended: 30000,
      });
    }
  }
}
```

**Logging levels:**
- `error`: Failures requiring immediate attention
- `warn`: Potential issues, deprecated features
- `info`: Important business events (user actions, state changes)
- `debug`: Detailed troubleshooting information
- `trace`: Very verbose (usually disabled)

**Best practices:**
- Always include context (IDs, params)
- Use structured data, not concatenated strings
- Log errors with stack traces
- Don't log sensitive data (passwords, tokens)
- Use consistent naming (snake_case for fields)

### 4. Create Monitoring Dashboard

Generate a Kibana dashboard for your feature:

```typescript
// generate_monitoring_dashboard.ts
import type { SavedObjectsClientContract } from '@kbn/core/server';

export async function createMonitoringDashboard(
  soClient: SavedObjectsClientContract,
  pluginId: string
) {
  const dashboardId = `${pluginId}-monitoring`;

  // Create index pattern (for logs)
  const indexPattern = await soClient.create('index-pattern', {
    title: `logs-${pluginId}*`,
    timeFieldName: '@timestamp',
  });

  // Create visualizations
  const visualizations = [
    // 1. Request rate (line chart)
    await soClient.create('visualization', {
      title: `${pluginId} - Request Rate`,
      visState: JSON.stringify({
        type: 'line',
        params: {
          type: 'line',
          grid: { categoryLines: false },
          categoryAxes: [{ id: 'CategoryAxis-1', type: 'category', position: 'bottom', show: true }],
          valueAxes: [{ id: 'ValueAxis-1', name: 'LeftAxis-1', type: 'value', position: 'left', show: true }],
          seriesParams: [{ data: { id: '1', label: 'Requests/min' }, type: 'line', mode: 'normal' }],
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            schema: 'segment',
            params: { field: '@timestamp', interval: '1m', timeRange: { from: 'now-15m', to: 'now' } },
          },
        ],
      }),
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: indexPattern.id,
          query: { query: `log.logger:${pluginId}`, language: 'kuery' },
          filter: [],
        }),
      },
    }),

    // 2. Error rate (line chart with threshold)
    await soClient.create('visualization', {
      title: `${pluginId} - Error Rate`,
      visState: JSON.stringify({
        type: 'line',
        params: {
          type: 'line',
          addLegend: true,
          addTooltip: true,
          thresholdLine: { show: true, value: 5, width: 2, style: 'dashed', color: '#E7664C' },
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: {},
          },
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            schema: 'segment',
            params: { field: '@timestamp', interval: '1m' },
          },
        ],
      }),
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: indexPattern.id,
          query: { query: `log.logger:${pluginId} AND log.level:error`, language: 'kuery' },
          filter: [],
        }),
      },
    }),

    // 3. Latency percentiles (area chart)
    await soClient.create('visualization', {
      title: `${pluginId} - Latency Percentiles`,
      visState: JSON.stringify({
        type: 'area',
        params: {
          type: 'area',
          addLegend: true,
          addTooltip: true,
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'percentiles',
            schema: 'metric',
            params: {
              field: 'duration_ms',
              percents: [50, 95, 99],
            },
          },
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            schema: 'segment',
            params: { field: '@timestamp', interval: 'auto' },
          },
        ],
      }),
    }),

    // 4. Recent errors (data table)
    await soClient.create('visualization', {
      title: `${pluginId} - Recent Errors`,
      visState: JSON.stringify({
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMetricsAtAllLevels: false,
          showTotal: false,
          totalFunc: 'sum',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: {},
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'error.message.keyword',
              size: 10,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: indexPattern.id,
          query: { query: `log.logger:${pluginId} AND log.level:error`, language: 'kuery' },
          filter: [],
        }),
      },
    }),
  ];

  // Create dashboard
  await soClient.create('dashboard', {
    title: `${pluginId} - Monitoring`,
    hits: 0,
    description: `Monitoring dashboard for ${pluginId}`,
    panelsJSON: JSON.stringify([
      { gridData: { x: 0, y: 0, w: 24, h: 12, i: '1' }, panelIndex: '1', version: '7.0.0', panelRefName: 'panel_0' },
      { gridData: { x: 24, y: 0, w: 24, h: 12, i: '2' }, panelIndex: '2', version: '7.0.0', panelRefName: 'panel_1' },
      { gridData: { x: 0, y: 12, w: 24, h: 12, i: '3' }, panelIndex: '3', version: '7.0.0', panelRefName: 'panel_2' },
      { gridData: { x: 24, y: 12, w: 24, h: 12, i: '4' }, panelIndex: '4', version: '7.0.0', panelRefName: 'panel_3' },
    ]),
    optionsJSON: JSON.stringify({
      darkTheme: false,
      useMargins: true,
      hidePanelTitles: false,
    }),
    version: 1,
    timeRestore: false,
    kibanaSavedObjectMeta: {
      searchSourceJSON: JSON.stringify({
        query: { query: '', language: 'kuery' },
        filter: [],
      }),
    },
  });

  return dashboardId;
}
```

**Dashboard should include:**
- Request rate (requests/min)
- Error rate (errors/min)
- Latency percentiles (p50, p95, p99)
- Recent errors (top 10)
- Active users/sessions (gauge)
- Cache hit rate

### 5. Create Alerts

Set up alerts for critical conditions:

```typescript
// create_monitoring_alerts.ts
import type { RulesClient } from '@kbn/alerting-plugin/server';

export async function createMonitoringAlerts(
  rulesClient: RulesClient,
  pluginId: string
) {
  // Alert 1: High error rate
  await rulesClient.create({
    data: {
      name: `${pluginId} - High Error Rate`,
      tags: ['monitoring', pluginId],
      alertTypeId: '.es-query',
      consumer: 'alerts',
      schedule: { interval: '1m' },
      actions: [
        {
          group: 'query matched',
          id: 'webhook-action-id',  // Pre-configured webhook
          params: {
            message: 'High error rate detected in {{context.pluginId}}',
          },
        },
      ],
      params: {
        index: [`logs-${pluginId}*`],
        timeField: '@timestamp',
        esQuery: JSON.stringify({
          query: {
            bool: {
              must: [
                { match: { 'log.level': 'error' } },
                { match: { 'log.logger': pluginId } },
              ],
            },
          },
        }),
        size: 0,
        thresholdComparator: '>',
        threshold: [10],  // More than 10 errors in 1 minute
        timeWindowSize: 1,
        timeWindowUnit: 'm',
      },
      throttle: '5m',  // Don't alert more than once per 5 min
      notifyWhen: 'onActionGroupChange',
    },
  });

  // Alert 2: High latency
  await rulesClient.create({
    data: {
      name: `${pluginId} - High Latency`,
      tags: ['monitoring', pluginId],
      alertTypeId: '.es-query',
      consumer: 'alerts',
      schedule: { interval: '5m' },
      actions: [
        {
          group: 'query matched',
          id: 'webhook-action-id',
          params: {
            message: 'High latency detected in {{context.pluginId}}: {{context.value}}ms',
          },
        },
      ],
      params: {
        index: [`apm-*`],
        timeField: '@timestamp',
        esQuery: JSON.stringify({
          query: {
            bool: {
              must: [
                { match: { 'service.name': 'kibana' } },
                { match: { 'transaction.name': `/${pluginId}/*` } },
              ],
            },
          },
          aggs: {
            avg_duration: {
              avg: { field: 'transaction.duration.us' },
            },
          },
        }),
        size: 0,
        thresholdComparator: '>',
        threshold: [5000000],  // 5 seconds in microseconds
        timeWindowSize: 5,
        timeWindowUnit: 'm',
      },
      throttle: '15m',
      notifyWhen: 'onActionGroupChange',
    },
  });

  // Alert 3: No data (service down)
  await rulesClient.create({
    data: {
      name: `${pluginId} - No Data`,
      tags: ['monitoring', pluginId],
      alertTypeId: '.es-query',
      consumer: 'alerts',
      schedule: { interval: '5m' },
      actions: [
        {
          group: 'query matched',
          id: 'webhook-action-id',
          params: {
            message: 'No data received from {{context.pluginId}} in last 5 minutes',
          },
        },
      ],
      params: {
        index: [`logs-${pluginId}*`],
        timeField: '@timestamp',
        esQuery: JSON.stringify({
          query: {
            match: { 'log.logger': pluginId },
          },
        }),
        size: 0,
        thresholdComparator: '<',
        threshold: [1],  // Less than 1 log in 5 minutes
        timeWindowSize: 5,
        timeWindowUnit: 'm',
      },
      throttle: '10m',
      notifyWhen: 'onActionGroupChange',
    },
  });
}
```

**Recommended alerts:**
- Error rate > threshold (e.g., 10 errors/min)
- Latency p99 > threshold (e.g., 5 seconds)
- No data received (service down)
- Queue size > threshold (backlog)
- Memory usage > threshold (memory leak)

### 6. Integration Tests with Monitoring

```typescript
// my_feature.monitoring.test.ts
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');
  const es = getService('es');

  describe('My Feature - Monitoring', () => {
    it('should emit metrics for successful requests', async () => {
      // Make request
      await supertest
        .post('/api/my-plugin/action')
        .send({ data: 'test' })
        .expect(200);

      // Wait for metrics to be indexed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify metrics in Elasticsearch
      const result = await es.search({
        index: '.monitoring-kibana-*',
        body: {
          query: {
            bool: {
              must: [
                { match: { 'kibana.plugin': 'myPlugin' } },
                { match: { 'kibana.metrics.requests_total': { gte: 1 } } },
              ],
            },
          },
        },
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
    });

    it('should log errors with proper context', async () => {
      // Trigger error
      await supertest
        .post('/api/my-plugin/action')
        .send({ data: 'invalid' })
        .expect(500);

      // Wait for logs to be indexed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify error logs
      const result = await es.search({
        index: 'logs-kibana*',
        body: {
          query: {
            bool: {
              must: [
                { match: { 'log.logger': 'myPlugin' } },
                { match: { 'log.level': 'error' } },
              ],
            },
          },
        },
      });

      expect(result.hits.total.value).toBeGreaterThan(0);

      // Verify error has context
      const errorLog = result.hits.hits[0]._source;
      expect(errorLog).toHaveProperty('error.message');
      expect(errorLog).toHaveProperty('error.stack');
    });

    it('should create APM traces', async () => {
      // Make request
      await supertest
        .post('/api/my-plugin/action')
        .send({ data: 'test' })
        .expect(200);

      // Wait for APM to index
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify APM transaction
      const result = await es.search({
        index: 'apm-*',
        body: {
          query: {
            bool: {
              must: [
                { match: { 'service.name': 'kibana' } },
                { match: { 'transaction.name': '/api/my-plugin/action' } },
              ],
            },
          },
        },
      });

      expect(result.hits.total.value).toBeGreaterThan(0);

      // Verify trace has spans
      const transaction = result.hits.hits[0]._source;
      expect(transaction).toHaveProperty('transaction.duration.us');
      expect(transaction).toHaveProperty('transaction.result', 'success');
    });
  });
}
```

## Example Workflow

### User: "add monitoring to my feature"

**Step 1: Add APM tracing to critical paths**
```typescript
// Identify critical code paths (slow, called frequently, error-prone)
// Add tracing:
import apm from 'elastic-apm-node';

const span = apm.startSpan('feature_name', 'custom');
try {
  // ... code ...
} finally {
  span?.end();
}
```

**Step 2: Add custom metrics**
```typescript
// Add counters, gauges, histograms
private requestCounter = 0;
private errorCounter = 0;
private durations: number[] = [];

// In request handler:
this.requestCounter++;
const start = Date.now();
try {
  // ... code ...
  this.durations.push(Date.now() - start);
} catch (error) {
  this.errorCounter++;
  throw error;
}
```

**Step 3: Add structured logging**
```typescript
// Add logs at appropriate levels
this.logger.info('Feature executed', { user_id, duration_ms });
this.logger.error('Feature failed', { error: error.message, context });
```

**Step 4: Create monitoring dashboard**
```bash
# Generate dashboard JSON
node scripts/generate_monitoring_dashboard.js --plugin myPlugin

# Import to Kibana
curl -X POST "http://localhost:5601/api/saved_objects/_import" \
  -H "kbn-xsrf: true" \
  --form file=@monitoring_dashboard.ndjson
```

**Step 5: Set up alerts**
```typescript
// Create alerts for critical conditions
await createMonitoringAlerts(rulesClient, 'myPlugin');
```

**Step 6: Document monitoring**
```markdown
# My Feature - Monitoring

## Metrics
- `myPlugin.requests_total`: Total requests
- `myPlugin.errors_total`: Total errors
- `myPlugin.duration_ms`: Request duration

## Logs
- Logger: `myPlugin`
- Index: `logs-kibana*`

## Dashboard
- URL: /app/dashboards#/view/myPlugin-monitoring
- Panels: Request rate, Error rate, Latency, Recent errors

## Alerts
- High error rate: >10 errors/min
- High latency: p99 >5s
- No data: <1 log in 5min

## Troubleshooting
1. Check dashboard for anomalies
2. Search logs: `log.logger:myPlugin AND log.level:error`
3. Check APM traces: service.name:kibana AND transaction.name:/api/myPlugin/*
```

## Integration with Other Skills
- **spike-builder**: Add monitoring during implementation phase
- **buildkite-ci-debugger**: Check monitoring data when CI fails
- **pr-optimizer**: Ensure monitoring is included in feature PRs

## Quality Principles
- Monitor what matters (user impact, not vanity metrics)
- Set actionable alerts (clear remediation steps)
- Include context in logs (IDs, params)
- Use percentiles (p95, p99) not averages for latency
- Test monitoring in integration tests

## References
- Kibana monitoring: https://www.elastic.co/guide/en/kibana/current/monitoring-kibana.html
- APM Node.js agent: https://www.elastic.co/guide/en/apm/agent/nodejs/current/index.html
- Elastic APM: https://www.elastic.co/observability/application-performance-monitoring
- Kibana alerting: https://www.elastic.co/guide/en/kibana/current/alerting-getting-started.html
