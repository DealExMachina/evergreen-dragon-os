import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DuckDBConnectionManager, getDuckDBConnectionManager, setDuckDBConnectionManager } from '../src/connection';
import type { Config } from '@evergreen/config';

describe('DuckDB Connection Manager', () => {
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
      environment: 'dev',
      logLevel: 'info',
    };
  });

  afterEach(() => {
    setDuckDBConnectionManager(null as any);
  });

  it('should create a connection manager', () => {
    const manager = new DuckDBConnectionManager(mockConfig);
    expect(manager).toBeDefined();
    expect(manager.isConnected()).toBe(false);
  });

  it('should get and set global connection manager', () => {
    const manager1 = new DuckDBConnectionManager(mockConfig);
    setDuckDBConnectionManager(manager1);
    const manager2 = getDuckDBConnectionManager();
    expect(manager2).toBe(manager1);
  });

  it('should throw error when manager not initialized', () => {
    setDuckDBConnectionManager(null as any);
    expect(() => getDuckDBConnectionManager()).toThrow();
  });

  it('should throw error when getting connection before connect', () => {
    const manager = new DuckDBConnectionManager(mockConfig);
    expect(() => manager.getConnection()).toThrow();
    expect(() => manager.getDatabase()).toThrow();
  });
});

