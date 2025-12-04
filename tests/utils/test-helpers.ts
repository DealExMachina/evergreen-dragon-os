/**
 * Test helpers that respect the architecture patterns
 * 
 * These utilities follow the dependency injection and client manager patterns
 * defined in the engineering principles.
 * 
 * NOTE: This file does NOT import from packages to avoid circular dependencies.
 * Tests should import the actual functions and pass them to these helpers.
 */

import { vi } from 'vitest';
import type { Config } from '@evergreen/config';
import { createMockConfig } from '../fixtures';

// Synchronous version that uses direct imports (for non-circular cases)
// Uses require() to avoid circular dependency issues with vitest
export function setupTestEnvironmentSync(configOverrides?: Partial<Config>): {
  config: Config;
  logger: any;
  context: TestAgentContext;
} {
  // Use require() to avoid ES module circular dependency issues
  // These are runtime imports, not compile-time, so they work in test environment
  const sharedUtils = require('../../packages/shared-utils/src');
  const supabaseClient = require('../../packages/supabase-client/src');
  const mem0Client = require('../../packages/mem0-client/src');
  const mocks = require('../mocks');
  
  const setLoggerSync = sharedUtils.setLogger;
  const setPrismaClientSync = supabaseClient.setPrismaClient;
  const resetPrismaClientSync = supabaseClient.resetPrismaClient;
  const setMem0ClientSync = mem0Client.setMem0Client;
  const resetMem0ClientSync = mem0Client.resetMem0Client;
  const createMockPrismaClientSync = mocks.createMockPrismaClient;
  const createMockMem0ClientSync = mocks.createMockMem0Client;
  const createMockLoggerSync = mocks.createMockLogger;
  
  const config = createMockConfig(configOverrides);
  const logger = createMockLoggerSync();
  setLoggerSync(logger);
  
  resetPrismaClientSync();
  resetMem0ClientSync();
  
  const mockPrisma = createMockPrismaClientSync();
  const mockMem0 = createMockMem0ClientSync();
  
  setPrismaClientSync(mockPrisma);
  setMem0ClientSync(mockMem0);
  
  const context: TestAgentContext = {
    config,
    logger,
    prisma: mockPrisma,
    mem0: mockMem0,
    integrations: {
      temporal: { execute: vi.fn() },
      supabase: { from: vi.fn() },
      duckdb: { query: vi.fn() },
    },
  };
  
  return { config, logger, context };
}

export function cleanupTestEnvironmentSync(): void {
  const supabaseClient = require('../../packages/supabase-client/src');
  const mem0Client = require('../../packages/mem0-client/src');
  supabaseClient.resetPrismaClient();
  mem0Client.resetMem0Client();
}

export function setupActivityTestEnvironmentSync(configOverrides?: Partial<Config>): {
  config: Config;
  logger: any;
  prisma: any;
  mem0: any;
} {
  const sharedUtils = require('../../packages/shared-utils/src');
  const supabaseClient = require('../../packages/supabase-client/src');
  const mem0Client = require('../../packages/mem0-client/src');
  const mocks = require('../mocks');
  
  const setLoggerSync = sharedUtils.setLogger;
  const setPrismaClientSync = supabaseClient.setPrismaClient;
  const resetPrismaClientSync = supabaseClient.resetPrismaClient;
  const setMem0ClientSync = mem0Client.setMem0Client;
  const resetMem0ClientSync = mem0Client.resetMem0Client;
  const createMockPrismaClientSync = mocks.createMockPrismaClient;
  const createMockMem0ClientSync = mocks.createMockMem0Client;
  const createMockLoggerSync = mocks.createMockLogger;
  
  const config = createMockConfig(configOverrides);
  const logger = createMockLoggerSync();
  setLoggerSync(logger);
  
  resetPrismaClientSync();
  resetMem0ClientSync();
  
  const mockPrisma = createMockPrismaClientSync();
  const mockMem0 = createMockMem0ClientSync();
  
  setPrismaClientSync(mockPrisma);
  setMem0ClientSync(mockMem0);
  
  return { config, logger, prisma: mockPrisma, mem0: mockMem0 };
}

/**
 * Test context that matches AgentContext structure
 */
export interface TestAgentContext {
  config: Config;
  logger: any;
  prisma: any;
  mem0: any;
  integrations: {
    temporal: any;
    supabase: any;
    duckdb: any;
  };
}

/**
 * Sets up test environment respecting architecture patterns:
 * 1. Sets mock logger (required for error handling)
 * 2. Resets all client managers (ensures isolation)
 * 3. Sets mock clients in managers (respects singleton pattern)
 * 4. Returns test context ready for dependency injection
 */
export async function setupTestEnvironment(configOverrides?: Partial<Config>): Promise<{
  config: Config;
  logger: ReturnType<typeof createMockLogger>;
  context: TestAgentContext;
}> {
  await loadDependencies();
  // 1. Create mock config
  const config = createMockConfig(configOverrides);
  
  // 2. Create and set mock logger (required before any operation)
  const logger = createMockLogger();
  setLogger(logger);
  
  // 3. Reset all client managers (ensures test isolation)
  resetPrismaClient();
  resetMem0Client();
  
  // 4. Create mock clients
  const mockPrisma = createMockPrismaClient() as unknown as PrismaClient;
  const mockMem0 = createMockMem0Client() as unknown as Mem0Client;
  
  // 5. Set clients in managers (respects singleton pattern)
  setPrismaClient(mockPrisma);
  setMem0Client(mockMem0);
  
  // 6. Create test context matching AgentContext structure
  const context: TestAgentContext = {
    config,
    logger,
    prisma: mockPrisma,
    mem0: mockMem0,
    integrations: {
      temporal: { execute: vi.fn() },
      supabase: { from: vi.fn() },
      duckdb: { query: vi.fn() },
    },
  };
  
  return { config, logger, context };
}

/**
 * Cleans up test environment
 * Resets all client managers and clears logger
 */
export async function cleanupTestEnvironment(): Promise<void> {
  await loadDependencies();
  resetPrismaClient();
  resetMem0Client();
  // Note: We don't reset logger as it might be needed for error handling
  // Individual tests should set their own logger if needed
}

/**
 * Creates a test context for activities
 * Activities use withActivityContext which calls getPrismaClient/getMem0Client
 * So we need to set the clients in the managers
 */
export async function setupActivityTestEnvironment(configOverrides?: Partial<Config>): Promise<{
  config: Config;
  logger: ReturnType<typeof createMockLogger>;
  prisma: ReturnType<typeof createMockPrismaClient>;
  mem0: ReturnType<typeof createMockMem0Client>;
}> {
  await loadDependencies();
  const config = createMockConfig(configOverrides);
  const logger = createMockLogger();
  setLogger(logger);
  
  // Reset and set clients in managers (activities use getPrismaClient/getMem0Client)
  resetPrismaClient();
  resetMem0Client();
  
  const mockPrisma = createMockPrismaClient();
  const mockMem0 = createMockMem0Client();
  
  setPrismaClient(mockPrisma as unknown as PrismaClient);
  setMem0Client(mockMem0 as unknown as Mem0Client);
  
  return { config, logger, prisma: mockPrisma, mem0: mockMem0 };
}

/**
 * Test suite setup helper
 * Use this in describe blocks to set up/tear down test environment
 */
export function useTestEnvironment() {
  beforeEach(async () => {
    // Setup is done per-test via setupTestEnvironment()
    // This ensures each test gets a fresh environment
  });
  
  afterEach(async () => {
    await cleanupTestEnvironment();
    vi.clearAllMocks();
  });
}

