import type { Config } from '@evergreen/config';
import type { Memory, Entity } from '@evergreen/mem0-client';

/**
 * Creates a mock config object for testing
 */
export function createMockConfig(overrides?: Partial<Config>): Config {
  return {
    environment: 'test',
    logLevel: 'debug',
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
      serviceKey: 'test-service-key',
    },
    mem0: {
      baseUrl: 'https://api.mem0.test',
      apiKey: 'test-mem0-key',
    },
    langfuse: {
      secretKey: 'test-langfuse-key',
    },
    temporal: {
      address: 'localhost:7233',
      namespace: 'test',
      taskQueue: 'test-queue',
    },
    duckdb: {
      path: './test.duckdb',
    },
    cryptoBro: {
      enabled: false,
      mikaComplianceLevel: 'light',
      chainRpcUrls: {},
    },
    mcp: {
      endpoints: [],
      timeout: 30000,
    },
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
    ...overrides,
  } as Config;
}

/**
 * Creates a mock memory object
 */
export function createMockMemory(overrides?: Partial<Memory>): Memory {
  return {
    id: 'mem-123',
    content: 'Test memory content',
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock entity object
 */
export function createMockEntity(overrides?: Partial<Entity>): Entity {
  return {
    id: 'entity-123',
    type: 'investor',
    properties: {
      name: 'Test Investor',
      email: 'test@example.com',
    },
    relationships: [],
    ...overrides,
  };
}

/**
 * Creates a mock investor data structure
 */
export function createMockInvestor(overrides?: Record<string, unknown>) {
  return {
    id: 'investor-123',
    name: 'Test Investor',
    email: 'test@example.com',
    type: 'retail',
    status: 'active',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock asset data structure
 */
export function createMockAsset(overrides?: Record<string, unknown>) {
  return {
    id: 'asset-123',
    name: 'Test Asset',
    type: 'real_estate',
    value: 1000000,
    currency: 'EUR',
    status: 'active',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock event data structure
 */
export function createMockEvent(overrides?: Record<string, unknown>) {
  return {
    id: 'event-123',
    type: 'asset.created',
    payload: {},
    timestamp: new Date().toISOString(),
    source: 'test',
    ...overrides,
  };
}

/**
 * Creates a mock KYC document
 */
export function createMockKYCDocument(overrides?: Record<string, unknown>) {
  return {
    id: 'doc-123',
    type: 'passport',
    url: 'https://example.com/doc.pdf',
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

