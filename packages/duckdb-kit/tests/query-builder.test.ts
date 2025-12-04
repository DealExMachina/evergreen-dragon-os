import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryBuilder } from '../src/query-builder';
import { DuckDBConnectionManager } from '../src/connection';
import type { Config } from '@evergreen/config';

describe('Query Builder', () => {
  let mockConnectionManager: DuckDBConnectionManager;
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
    mockConnectionManager = new DuckDBConnectionManager(mockConfig);
  });

  it('should build a simple SELECT query', () => {
    const builder = new QueryBuilder(mockConnectionManager);
    const { sql } = builder.select('*').from('assets').build();

    expect(sql).toContain('SELECT *');
    expect(sql).toContain('FROM assets');
  });

  it('should build query with WHERE clause', () => {
    const builder = new QueryBuilder(mockConnectionManager);
    const { sql, params } = builder
      .select(['id', 'name'])
      .from('assets')
      .where('status', '=', 'active')
      .build();

    expect(sql).toContain('WHERE');
    expect(sql).toContain('status');
    expect(params).toContain('active');
  });

  it('should build query with JOIN', () => {
    const builder = new QueryBuilder(mockConnectionManager);
    const { sql } = builder
      .select('*')
      .from('assets')
      .join('asset_snapshots', 'assets.id = asset_snapshots.asset_id', 'LEFT')
      .build();

    expect(sql).toContain('LEFT JOIN');
    expect(sql).toContain('asset_snapshots');
  });

  it('should build query with ORDER BY and LIMIT', () => {
    const builder = new QueryBuilder(mockConnectionManager);
    const { sql } = builder
      .select('*')
      .from('assets')
      .orderBy('created_at', 'DESC')
      .limit(10)
      .build();

    expect(sql).toContain('ORDER BY');
    expect(sql).toContain('DESC');
    expect(sql).toContain('LIMIT 10');
  });

  it('should throw error when FROM is missing', () => {
    const builder = new QueryBuilder(mockConnectionManager);
    expect(() => builder.select('*').build()).toThrow();
  });
});

