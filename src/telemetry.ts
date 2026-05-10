import * as applicationinsights from 'applicationinsights';

/**
 * Initialise Azure Application Insights.
 *
 * Must be called **before** any other import so the SDK can monkey-patch
 * Node.js core modules (http, https, pg, ioredis, etc.) for auto-collection.
 *
 * When APPLICATIONINSIGHTS_CONNECTION_STRING is absent the function is a
 * no-op, which keeps local development working without Azure credentials.
 */
export function setupApplicationInsights(): void {
  const connectionString =
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING?.trim();

  if (!connectionString) {
    console.log(
      '[telemetry] APPLICATIONINSIGHTS_CONNECTION_STRING not set – telemetry disabled.',
    );
    return;
  }

  applicationinsights
    .setup(connectionString)
    // Collect outgoing HTTP/HTTPS calls (axios, fetch, pg, ioredis …)
    .setAutoCollectDependencies(true)
    // Collect unhandled exceptions and rejections
    .setAutoCollectExceptions(true)
    // Collect console.log / console.error as traces
    .setAutoCollectConsole(true, true)
    // Collect process-level performance counters (CPU, memory)
    .setAutoCollectPerformance(true, true)
    // Collect incoming HTTP requests automatically
    .setAutoCollectRequests(true)
    .start();

  console.log('[telemetry] Application Insights initialised.');
}

/**
 * Flush any buffered telemetry and close the SDK.
 * Call this in your graceful-shutdown handler so the last events
 * are not lost when the container stops.
 */
export function shutdownApplicationInsights(): Promise<void> {
  return new Promise((resolve) => {
    const client = applicationinsights.defaultClient;
    if (!client) {
      resolve();
      return;
    }
    client.flush();
    resolve();
  });
}
