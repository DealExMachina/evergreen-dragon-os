import { describe, it, expect } from 'vitest';
import { configSchema } from '../src/schema';

describe('Config Schema', () => {
  it('should validate a complete valid config', () => {
    const validConfig = {
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'anon-key',
        serviceKey: 'service-key',
      },
      duckdb: {
        path: './analytics/test.duckdb',
      },
      temporal: {
        address: 'localhost:7233',
        namespace: 'default',
        taskQueue: 'tasks',
      },
      mem0: {
        baseUrl: 'https://api.mem0.ai',
        apiKey: 'mem0-key',
      },
      langfuse: {
        secretKey: 'langfuse-secret',
      },
      cryptoBro: {
        mikaComplianceLevel: 'full' as const,
        enabled: false,
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
      environment: 'dev' as const,
      logLevel: 'info' as const,
    };

    expect(() => configSchema.parse(validConfig)).not.toThrow();
    const parsed = configSchema.parse(validConfig);
    expect(parsed.supabase.url).toBe('https://test.supabase.co');
  });

  it('should reject invalid URLs', () => {
    const invalidConfig = {
      supabase: {
        url: 'not-a-url',
        anonKey: 'anon-key',
        serviceKey: 'service-key',
      },
      duckdb: { path: './test.duckdb' },
      temporal: { address: 'localhost:7233', namespace: 'default', taskQueue: 'tasks' },
      mem0: { baseUrl: 'https://api.mem0.ai', apiKey: 'key' },
      langfuse: { secretKey: 'secret' },
      cryptoBro: { mikaComplianceLevel: 'full' as const, enabled: false, chainRpcUrls: {} },
      mcp: { endpoints: [], timeout: 30000 },
      environment: 'dev' as const,
      logLevel: 'info' as const,
    };

    expect(() => configSchema.parse(invalidConfig)).toThrow();
  });

  it('should reject empty required strings', () => {
    const invalidConfig = {
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: '',
        serviceKey: 'service-key',
      },
      duckdb: { path: './test.duckdb' },
      temporal: { address: 'localhost:7233', namespace: 'default', taskQueue: 'tasks' },
      mem0: { baseUrl: 'https://api.mem0.ai', apiKey: 'key' },
      langfuse: { secretKey: 'secret' },
      cryptoBro: { mikaComplianceLevel: 'full' as const, enabled: false, chainRpcUrls: {} },
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
      environment: 'dev' as const,
      logLevel: 'info' as const,
    };

    expect(() => configSchema.parse(invalidConfig)).toThrow();
  });

  it('should accept optional DuckDB S3 configuration', () => {
    const configWithS3 = {
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'anon-key',
        serviceKey: 'service-key',
      },
      duckdb: {
        path: 's3://bucket/test.duckdb',
        s3AccessKey: 'access-key',
        s3SecretKey: 'secret-key',
        s3Region: 'us-east-1',
        s3Endpoint: 'https://s3.amazonaws.com',
      },
      temporal: { address: 'localhost:7233', namespace: 'default', taskQueue: 'tasks' },
      mem0: { baseUrl: 'https://api.mem0.ai', apiKey: 'key' },
      langfuse: { secretKey: 'secret' },
      cryptoBro: { mikaComplianceLevel: 'full' as const, enabled: false, chainRpcUrls: {} },
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
      environment: 'dev' as const,
      logLevel: 'info' as const,
    };

    expect(() => configSchema.parse(configWithS3)).not.toThrow();
    const parsed = configSchema.parse(configWithS3);
    expect(parsed.duckdb.s3AccessKey).toBe('access-key');
    expect(parsed.duckdb.s3Region).toBe('us-east-1');
  });

  it('should validate cryptoBro chain RPC URLs', () => {
    const configWithChains = {
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'anon-key',
        serviceKey: 'service-key',
      },
      duckdb: { path: './test.duckdb' },
      temporal: { address: 'localhost:7233', namespace: 'default', taskQueue: 'tasks' },
      mem0: { baseUrl: 'https://api.mem0.ai', apiKey: 'key' },
      langfuse: { secretKey: 'secret' },
      cryptoBro: {
        mikaComplianceLevel: 'full' as const,
        enabled: true,
        chainRpcUrls: {
          base: 'https://base-rpc.example.com',
          polygon: 'https://polygon-rpc.example.com',
        },
      },
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
      environment: 'dev' as const,
      logLevel: 'info' as const,
    };

    expect(() => configSchema.parse(configWithChains)).not.toThrow();
    const parsed = configSchema.parse(configWithChains);
    expect(parsed.cryptoBro.chainRpcUrls.base).toBe('https://base-rpc.example.com');
  });

  it('should reject invalid cryptoBro chain URLs', () => {
    const invalidConfig = {
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'anon-key',
        serviceKey: 'service-key',
      },
      duckdb: { path: './test.duckdb' },
      temporal: { address: 'localhost:7233', namespace: 'default', taskQueue: 'tasks' },
      mem0: { baseUrl: 'https://api.mem0.ai', apiKey: 'key' },
      langfuse: { secretKey: 'secret' },
      cryptoBro: {
        mikaComplianceLevel: 'full' as const,
        enabled: true,
        chainRpcUrls: {
          base: 'not-a-url',
        },
      },
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
      environment: 'dev' as const,
      logLevel: 'info' as const,
    };

    expect(() => configSchema.parse(invalidConfig)).toThrow();
  });
});

