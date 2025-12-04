import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseIntegration } from '../src/integration-base';
import { createMockConfig } from '@tests/fixtures';
import { createMockLogger } from '@tests/utils';
import { setLogger } from '../src/logger';

// Set up logger mock
beforeEach(() => {
  setLogger(createMockLogger());
});

// Mock error handling
vi.mock('../src/error-handling', () => ({
  withErrorHandling: (fn: () => Promise<unknown>) => fn(),
}));

class TestIntegration extends BaseIntegration {
  protected async doInitialize(): Promise<void> {
    // Test implementation
  }

  protected async doCleanup(): Promise<void> {
    // Test implementation
  }
}

describe('BaseIntegration', () => {
  let integration: TestIntegration;
  let config: ReturnType<typeof createMockConfig>;
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    // Set up logger BEFORE creating integration instance
    logger = createMockLogger();
    setLogger(logger);
    integration = new TestIntegration();
    config = createMockConfig();
  });

  it('should initialize successfully', async () => {
    await integration.initialize(config);

    expect(integration.isInitialized()).toBe(true);
  });

  it('should not initialize twice', async () => {
    await integration.initialize(config);
    // Clear previous calls
    logger.warn.mockClear();
    await integration.initialize(config);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('already initialized')
    );
  });

  it('should cleanup successfully', async () => {
    await integration.initialize(config);
    await integration.cleanup();

    expect(integration.isInitialized()).toBe(false);
  });

  it('should handle cleanup when not initialized', async () => {
    await integration.cleanup();

    expect(integration.isInitialized()).toBe(false);
  });

  it('should throw error when accessing config before initialization', () => {
    expect(() => {
      // Access protected method via type assertion for testing
      (integration as any).getConfig();
    }).toThrow('not initialized');
  });

  it('should provide config after initialization', async () => {
    await integration.initialize(config);

    const retrievedConfig = (integration as any).getConfig();
    expect(retrievedConfig).toBe(config);
  });
});

