import { NativeConnection, Worker } from '@temporalio/worker';
import type { Config } from '@evergreen/config';
import { ServiceLifecycle, ServiceRunner, withErrorHandling } from '@evergreen/shared-utils';
import * as activities from './activities';

/**
 * Temporal Worker Service
 * Runs workflows and activities for Evergreen Dragon OS
 */
class WorkflowsService implements ServiceLifecycle {
  private connection: NativeConnection | null = null;
  private worker: Worker | null = null;

  getName(): string {
    return 'workflows-service';
  }

  async initialize(config: Config): Promise<void> {
    // Connect to Temporal
    this.connection = await withErrorHandling(
      async () => NativeConnection.connect({
        address: config.temporal.address,
      }),
      { operation: 'connect to Temporal', address: config.temporal.address }
    );

    // Create worker
    this.worker = await withErrorHandling(
      async () => Worker.create({
        connection: this.connection!,
        namespace: config.temporal.namespace,
        taskQueue: config.temporal.taskQueue,
        workflowsPath: require.resolve('../../workflows/src'),
        activities,
        maxConcurrentActivityTaskExecutions: 10,
        maxConcurrentWorkflowTaskExecutions: 10,
      }),
      { operation: 'create Temporal worker', namespace: config.temporal.namespace }
    );
  }

  async start(): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    // Start worker (this blocks until shutdown)
    await this.worker.run();
  }

  async cleanup(): Promise<void> {
    // Worker shutdown is handled by Temporal
    // Connection cleanup happens automatically
    if (this.connection) {
      await this.connection.close().catch(() => {
        // Ignore errors during cleanup
      });
    }
  }
}

// Run the service
new ServiceRunner(new WorkflowsService()).run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

