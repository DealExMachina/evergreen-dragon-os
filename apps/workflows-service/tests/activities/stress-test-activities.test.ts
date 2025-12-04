import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  runScenarios,
  aggregateResults,
  notifyCommander,
} from '../../src/activities/stress-test-activities';
import { createMockAsset } from '../../../../tests/fixtures';
import { setupActivityTestEnvironmentSync, cleanupTestEnvironmentSync } from '../../../../tests/utils/test-helpers';

// Mock activity context to avoid calling loadConfig()
vi.mock('../../src/activities/activity-context', () => ({
  withActivityContext: async (operation: string, fn: (ctx: any) => Promise<any>) => {
    const mockContext = {
      config: {} as any,
      prisma: {} as any,
      mem0: {} as any,
      logger: {} as any,
    };
    return fn(mockContext);
  },
}));

// Mock DuckDB
vi.mock('@evergreen/duckdb-kit', () => ({
  getDuckDBConnectionManager: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    query: vi.fn(),
  })),
}));

describe('Stress Test Activities', () => {
  beforeEach(() => {
    setupActivityTestEnvironmentSync();
  });

  afterEach(() => {
    cleanupTestEnvironmentSync();
    vi.clearAllMocks();
  });

  describe('runScenarios', () => {
    it('should run scenarios for given assets', async () => {
      const scenarioName = 'liquidity_stress';
      const parameters = { stressLevel: 0.2 };
      const assetIds = ['asset-1', 'asset-2', 'asset-3'];

      const results = await runScenarios(scenarioName, parameters, assetIds);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('assetId', 'asset-1');
      expect(results[0]).toHaveProperty('result');
      expect(results[0].result).toHaveProperty('scenario', scenarioName);
      expect(results[0].result).toHaveProperty('parameters', parameters);
      expect(results[0].result).toHaveProperty('impact');
    });

    it('should handle empty asset list', async () => {
      const results = await runScenarios('test_scenario', {}, []);

      expect(results).toHaveLength(0);
    });

    it('should handle undefined asset list', async () => {
      const results = await runScenarios('test_scenario', {});

      expect(results).toHaveLength(0);
    });
  });

  describe('aggregateResults', () => {
    it('should aggregate results and generate summary', async () => {
      const results = [
        { assetId: 'asset-1', result: { impact: { nav: -0.05, liquidity: -0.1 } } },
        { assetId: 'asset-2', result: { impact: { nav: -0.03, liquidity: -0.05 } } },
        { assetId: 'asset-3', result: { impact: { nav: -0.15, liquidity: -0.2 } } },
      ];

      const aggregated = await aggregateResults(results);

      expect(aggregated).toHaveProperty('summary');
      expect(aggregated).toHaveProperty('alerts');
      expect(aggregated.summary).toHaveProperty('totalAssets', 3);
      expect(Array.isArray(aggregated.alerts)).toBe(true);
    });

    it('should generate alerts for significant impacts', async () => {
      const results = [
        { assetId: 'asset-1', result: { impact: { nav: -0.15, liquidity: -0.1 } } },
        { assetId: 'asset-2', result: { impact: { nav: -0.05, liquidity: -0.05 } } },
      ];

      const aggregated = await aggregateResults(results);

      expect(aggregated.alerts.length).toBeGreaterThan(0);
      expect(aggregated.alerts[0]).toHaveProperty('level');
      expect(aggregated.alerts[0]).toHaveProperty('message');
      expect(aggregated.alerts[0].level).toBe('high');
      expect(aggregated.alerts[0].message).toContain('asset-1');
    });

    it('should handle empty results', async () => {
      const aggregated = await aggregateResults([]);

      expect(aggregated.summary.totalAssets).toBe(0);
      expect(aggregated.alerts).toHaveLength(0);
    });
  });

  describe('notifyCommander', () => {
    it('should notify commander with alerts', async () => {
      const alerts = [
        { level: 'high', message: 'Test alert 1' },
        { level: 'medium', message: 'Test alert 2' },
      ];

      await expect(notifyCommander(alerts)).resolves.not.toThrow();
    });

    it('should handle empty alerts', async () => {
      await expect(notifyCommander([])).resolves.not.toThrow();
    });
  });
});

