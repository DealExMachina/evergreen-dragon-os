import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLogger, getLogger, setLogger, Logger, LogLevel } from '../src/logger';
import type { Config } from '@evergreen/config';

describe('Logger', () => {
  let mockConfig: Config;

  beforeEach(() => {
    mockConfig = {
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'anon',
        serviceKey: 'service',
      },
      duckdb: { path: './test.duckdb' },
      temporal: { address: 'localhost:7233', namespace: 'default', taskQueue: 'tasks' },
      mem0: { baseUrl: 'https://api.mem0.ai', apiKey: 'key' },
      langfuse: { secretKey: 'secret' },
      cryptoBro: { mikaComplianceLevel: 'full', enabled: false, chainRpcUrls: {} },
      mcp: { endpoints: [], timeout: 30000 },
      agentRouting: {
        eventToAgent: {
          ASSET_ONBOARD: 'simulation',
          VALUATION_CYCLE: 'simulation',
          MARKET_SHOCK: 'commander',
          LIQUIDITY_STRESS: 'commander',
          STRATEGIC_REQUEST: 'commander',
          RISK_ALERT: 'commander',
          COMPLIANCE_BREACH: 'commander',
          UNWIND_ASSET: 'commander',
        },
      },
      environment: 'dev',
      logLevel: 'info',
    };
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock langfuse to avoid import errors
    vi.mock('langfuse', () => ({
      Langfuse: vi.fn().mockImplementation(() => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    }));
  });

  it('should create a console logger', () => {
    const logger = createLogger(mockConfig);
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should respect log level', () => {
    vi.clearAllMocks();
    // Use config without langfuse to get ConsoleLogger
    const debugConfig = { ...mockConfig, langfuse: undefined as any, logLevel: 'debug' as LogLevel };
    const logger = createLogger(debugConfig);
    logger.debug('debug message');
    expect(console.debug).toHaveBeenCalled();

    vi.clearAllMocks();
    const errorConfig = { ...mockConfig, langfuse: undefined as any, logLevel: 'error' as LogLevel };
    const errorLogger = createLogger(errorConfig);
    errorLogger.info('info message');
    expect(console.info).not.toHaveBeenCalled();
  });

  it('should log with context', () => {
    // Use a config without langfuse to avoid LangfuseLogger
    const configWithoutLangfuse = { ...mockConfig, langfuse: undefined as any };
    const logger = createLogger(configWithoutLangfuse);
    logger.info('test message', { userId: '123', action: 'test' });
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('test message')
    );
  });

  it('should log errors with stack traces', () => {
    // Use a config without langfuse to avoid LangfuseLogger
    const configWithoutLangfuse = { ...mockConfig, langfuse: undefined as any };
    const logger = createLogger(configWithoutLangfuse);
    const error = new Error('test error');
    logger.error('error message', error, { context: 'test' });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('error message')
    );
  });

  it('should get and set global logger', () => {
    const logger1 = createLogger(mockConfig);
    setLogger(logger1);
    const logger2 = getLogger();
    expect(logger2).toBe(logger1);
  });
});

