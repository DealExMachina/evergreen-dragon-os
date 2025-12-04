import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPrismaClient, createSupabaseClient, getPrismaClient, setPrismaClient } from '../src/client';
import type { Config } from '@evergreen/config';

describe('Supabase Client', () => {
  let mockConfig: Config;

  beforeEach(() => {
    mockConfig = {
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'anon-key',
        serviceKey: 'service-key',
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
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  });

  it('should create a Supabase client', () => {
    const client = createSupabaseClient(mockConfig);
    expect(client).toBeDefined();
  });

  it('should get and set Prisma client', () => {
    // Mock PrismaClient to avoid actual database connection in tests
    const mockPrisma = {
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
    } as any;

    setPrismaClient(mockPrisma);
    const client = getPrismaClient();
    expect(client).toBe(mockPrisma);
  });

  it('should throw error when Prisma client not initialized', () => {
    setPrismaClient(null as any);
    expect(() => getPrismaClient()).toThrow();
  });
});

