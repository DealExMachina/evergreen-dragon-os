import { proxyActivities, log } from '@temporalio/workflow';
import type { StressTestInput, WorkflowResult } from './types';

interface StressTestActivities {
  runScenarios: (
    scenarioName: string,
    parameters: Record<string, number>,
    assetIds?: string[]
  ) => Promise<Array<{ assetId: string; result: unknown }>>;
  aggregateResults: (results: Array<{ assetId: string; result: unknown }>) => Promise<{
    summary: Record<string, unknown>;
    alerts: Array<{ level: string; message: string }>;
  }>;
  notifyCommander: (alerts: Array<{ level: string; message: string }>) => Promise<void>;
}

const { runScenarios, aggregateResults, notifyCommander } = proxyActivities<StressTestActivities>({
  startToCloseTimeout: '1h',
  retry: {
    initialInterval: '1s',
    maximumAttempts: 2,
  },
});

/**
 * Stress Test Workflow
 * Runs stress test scenarios and aggregates results
 */
export async function stressTestWorkflow(input: StressTestInput): Promise<WorkflowResult> {
  log.info('Starting stress test workflow', {
    scenarioName: input.scenarioName,
    parameters: input.parameters,
    assetCount: input.assetIds?.length || 0,
  });

  try {
    // Step 1: Run scenarios
    log.info('Running stress test scenarios', { scenarioName: input.scenarioName });
    const results = await runScenarios(input.scenarioName, input.parameters, input.assetIds);

    // Step 2: Aggregate results
    log.info('Aggregating results', { resultCount: results.length });
    const aggregated = await aggregateResults(results);

    // Step 3: Notify Commander if alerts exist
    if (aggregated.alerts.length > 0) {
      log.warn('Stress test generated alerts', { alertCount: aggregated.alerts.length });
      await notifyCommander(aggregated.alerts);
    }

    log.info('Stress test workflow completed', {
      scenarioName: input.scenarioName,
      alertCount: aggregated.alerts.length,
    });

    return {
      success: true,
      data: {
        scenarioName: input.scenarioName,
        summary: aggregated.summary,
        alerts: aggregated.alerts,
        resultCount: results.length,
      },
    };
  } catch (error) {
    log.error('Stress test workflow failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

