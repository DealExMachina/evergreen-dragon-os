import { Connection, Client } from '@temporalio/client';
import type { Config } from '@evergreen/config';
import { BaseIntegration, withErrorHandling } from '@evergreen/shared-utils';
import * as workflows from '@evergreen/workflows';
import type { WorkflowScheduler } from './contracts';

/**
 * Temporal integration for Mastra agents
 * Allows agents to trigger and monitor Temporal workflows
 */
export class TemporalIntegration extends BaseIntegration implements WorkflowScheduler {
  private client: Client | null = null;
  private connection: Connection | null = null;

  /**
   * Initialize Temporal connection
   */
  protected async doInitialize(config: Config): Promise<void> {
    this.connection = await withErrorHandling(
      async () => Connection.connect({
        address: config.temporal.address,
      }),
      { operation: 'connect to Temporal', address: config.temporal.address }
    );

    this.client = new Client({
      connection: this.connection,
      namespace: config.temporal.namespace,
    });
  }

  /**
   * Cleanup Temporal connection
   */
  protected async doCleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.close().catch(() => {
        // Ignore errors during cleanup
      });
      this.connection = null;
    }
    this.client = null;
  }

  /**
   * Get Temporal client (throws if not initialized)
   */
  private getClient(): Client {
    if (!this.client) {
      throw new Error('Temporal client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Trigger asset unwind workflow
   */
  async triggerAssetUnwind(assetId: string, reason: string): Promise<string> {
    const client = this.getClient();

    const handle = await withErrorHandling(
      async () => client.workflow.start(workflows.assetUnwindWorkflow, {
      args: [
        {
          assetId,
          reason,
        },
      ],
      taskQueue: 'evergreen-tasks',
      workflowId: `asset-unwind-${assetId}-${Date.now()}`,
      }),
      { operation: 'trigger asset unwind workflow', assetId, reason }
    );

    return handle.workflowId;
  }

  /**
   * Trigger valuation cycle workflow
   */
  async triggerValuationCycle(quarter: string, year: number): Promise<string> {
    const client = this.getClient();

    const handle = await withErrorHandling(
      async () => client.workflow.start(workflows.valuationCycleWorkflow, {
      args: [
        {
          quarter,
          year,
        },
      ],
      taskQueue: 'evergreen-tasks',
      workflowId: `valuation-cycle-${quarter}-${year}-${Date.now()}`,
      }),
      { operation: 'trigger valuation cycle workflow', quarter, year }
    );

    return handle.workflowId;
  }

  /**
   * Trigger stress test workflow
   */
  async triggerStressTest(scenarios: Array<{ name: string; parameters: Record<string, number> }>): Promise<string> {
    const client = this.getClient();

    const handle = await withErrorHandling(
      async () => client.workflow.start(workflows.stressTestWorkflow, {
      args: [
        {
          scenarios,
        },
      ],
      taskQueue: 'evergreen-tasks',
      workflowId: `stress-test-${Date.now()}`,
      }),
      { operation: 'trigger stress test workflow', scenarioCount: scenarios.length }
    );

    return handle.workflowId;
  }

  /**
   * Trigger KYC workflow
   */
  async triggerKYC(investorId: string, documents: Array<{ type: string; url: string }>): Promise<string> {
    const client = this.getClient();

    const handle = await withErrorHandling(
      async () => client.workflow.start(workflows.kycWorkflow, {
      args: [
        {
          investorId,
          documents,
        },
      ],
      taskQueue: 'evergreen-tasks',
      workflowId: `kyc-${investorId}-${Date.now()}`,
      }),
      { operation: 'trigger KYC workflow', investorId, documentCount: documents.length }
    );

    return handle.workflowId;
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<{
    status: string;
    result?: unknown;
    error?: string;
  }> {
    const client = this.getClient();

    const handle = client.workflow.getHandle(workflowId);
    const description = await withErrorHandling(
      async () => handle.describe(),
      { operation: 'get workflow status', workflowId }
    );

    return {
      status: description.status.name,
      result: description.status.result,
      error: description.status.failure?.message,
    };
  }

  /**
   * Signal workflow
   */
  async signalWorkflow(workflowId: string, signalName: string, args?: unknown[]): Promise<void> {
    const client = this.getClient();

    const handle = client.workflow.getHandle(workflowId);
    await withErrorHandling(
      async () => handle.signal(signalName, ...(args || [])),
      { operation: 'signal workflow', workflowId, signalName }
    );
  }
}

