// Re-export test helpers that respect architecture
export * from './test-helpers';

// Legacy exports for backward compatibility
import type { Config } from '@evergreen/config';
import { createMockConfig } from '../fixtures';
import {
  createMockPrismaClient,
  createMockSupabaseClient,
  createMockMem0Client,
  createMockTemporalClient,
  createMockDuckDBConnection,
} from '../mocks';

/**
 * Legacy test context (use setupTestEnvironment for new tests)
 * @deprecated Use setupTestEnvironment() instead
 */
export interface TestContext {
  config: Config;
  prisma: ReturnType<typeof createMockPrismaClient>;
  supabase: ReturnType<typeof createMockSupabaseClient>;
  mem0: ReturnType<typeof createMockMem0Client>;
  temporal: ReturnType<typeof createMockTemporalClient>;
  duckdb: ReturnType<typeof createMockDuckDBConnection>;
}

/**
 * Legacy test context creator (use setupTestEnvironment for new tests)
 * @deprecated Use setupTestEnvironment() instead
 */
export function createTestContext(overrides?: { config?: Partial<Config> }): TestContext {
  return {
    config: createMockConfig(overrides?.config),
    prisma: createMockPrismaClient(),
    supabase: createMockSupabaseClient(),
    mem0: createMockMem0Client(),
    temporal: createMockTemporalClient(),
    duckdb: createMockDuckDBConnection(),
  };
}

/**
 * Waits for a specified amount of time (useful for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a promise that resolves after a delay (useful for testing timeouts)
 */
export function delayedResolve<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Creates a promise that rejects after a delay (useful for testing errors)
 */
export function delayedReject(error: Error, ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(error), ms));
}

/**
 * Asserts that a function throws an error with a specific message
 */
export async function expectError(
  fn: () => Promise<unknown>,
  expectedMessage?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedMessage) {
      const message = error instanceof Error ? error.message : String(error);
      if (typeof expectedMessage === 'string') {
        if (!message.includes(expectedMessage)) {
          throw new Error(`Expected error message to include "${expectedMessage}", but got "${message}"`);
        }
      } else {
        if (!expectedMessage.test(message)) {
          throw new Error(`Expected error message to match ${expectedMessage}, but got "${message}"`);
        }
      }
    }
  }
}

/**
 * Creates a mock logger
 */
export function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  };
}

