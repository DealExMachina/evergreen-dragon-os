import type { DuckDBConnectionManager } from './connection';
import { getLogger } from '@evergreen/shared-utils';
import { DuckDBError } from '@evergreen/shared-utils';

export interface ScenarioParams {
  name: string;
  description?: string;
  parameters: Record<string, number | string | boolean>;
}

export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  results: Record<string, unknown>;
  metadata: {
    executedAt: string;
    executionTimeMs: number;
  };
}

/**
 * Runs analytical scenarios against DuckDB
 */
export class ScenarioRunner {
  constructor(private connectionManager: DuckDBConnectionManager) {}

  /**
   * Executes a scenario with given parameters
   */
  async runScenario(
    scenarioName: string,
    query: string,
    params?: Record<string, unknown>
  ): Promise<ScenarioResult> {
    const logger = getLogger();
    const startTime = Date.now();
    const scenarioId = `${scenarioName}-${Date.now()}`;

    logger.info(`Running scenario: ${scenarioName}`, { scenarioId, params });

    try {
      const connection = this.connectionManager.getConnection();
      
      // Execute query with parameters
      const results = await this.executeQuery(connection, query, params || {});

      const executionTime = Date.now() - startTime;

      logger.info(`Scenario completed: ${scenarioName}`, {
        scenarioId,
        executionTimeMs: executionTime,
        resultCount: Array.isArray(results) ? results.length : 1,
      });

      return {
        scenarioId,
        scenarioName,
        results: Array.isArray(results) ? { rows: results } : results,
        metadata: {
          executedAt: new Date().toISOString(),
          executionTimeMs: executionTime,
        },
      };
    } catch (error) {
      logger.error(`Scenario failed: ${scenarioName}`, error);
      throw new DuckDBError(`Scenario execution failed: ${scenarioName}`, {
        scenarioId,
        scenarioName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Runs multiple scenarios in parallel
   */
  async runScenarios(
    scenarios: Array<{ name: string; query: string; params?: Record<string, unknown> }>
  ): Promise<ScenarioResult[]> {
    const logger = getLogger();
    logger.info(`Running ${scenarios.length} scenarios in parallel`);

    const results = await Promise.all(
      scenarios.map((scenario) => this.runScenario(scenario.name, scenario.query, scenario.params))
    );

    return results;
  }

  /**
   * Executes a stress test scenario
   */
  async runStressTest(
    baseScenario: string,
    stressParams: Array<Record<string, unknown>>
  ): Promise<ScenarioResult[]> {
    const logger = getLogger();
    logger.info(`Running stress test with ${stressParams.length} variations`);

    const scenarios = stressParams.map((params, index) => ({
      name: `${baseScenario}-stress-${index + 1}`,
      query: baseScenario, // Assuming baseScenario is a query template
      params,
    }));

    return this.runScenarios(scenarios);
  }

  /**
   * Executes a query with parameter substitution
   */
  private async executeQuery(
    connection: any,
    query: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      // Replace parameter placeholders in query
      let finalQuery = query;
      const paramValues: unknown[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(params)) {
        const placeholder = `$${paramIndex}`;
        finalQuery = finalQuery.replace(new RegExp(`:${key}`, 'g'), placeholder);
        paramValues.push(value);
        paramIndex++;
      }

      connection.all(finalQuery, ...paramValues, (err: Error | null, result: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Saves scenario results to DuckDB
   */
  async saveScenarioResults(results: ScenarioResult[]): Promise<void> {
    const logger = getLogger();
    const connection = this.connectionManager.getConnection();

    // Ensure scenario_results table exists
    await this.ensureScenarioResultsTable(connection);

    // Insert results
    for (const result of results) {
      await new Promise<void>((resolve, reject) => {
        connection.run(
          `INSERT INTO scenario_results (scenario_id, scenario_name, results, executed_at, execution_time_ms)
           VALUES (?, ?, ?, ?, ?)`,
          [
            result.scenarioId,
            result.scenarioName,
            JSON.stringify(result.results),
            result.metadata.executedAt,
            result.metadata.executionTimeMs,
          ],
          (err: Error | null) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    }

    logger.info(`Saved ${results.length} scenario results to DuckDB`);
  }

  /**
   * Ensures scenario_results table exists
   */
  private async ensureScenarioResultsTable(connection: any): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.run(
        `CREATE TABLE IF NOT EXISTS scenario_results (
          scenario_id VARCHAR PRIMARY KEY,
          scenario_name VARCHAR NOT NULL,
          results JSON,
          executed_at TIMESTAMP NOT NULL,
          execution_time_ms INTEGER NOT NULL
        )`,
        (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}

