import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Mem0Client, getMem0Client, setMem0Client } from '../src/client';
import type { Config } from '@evergreen/config';

// Mock fetch globally
global.fetch = vi.fn();

describe('Mem0 Client', () => {
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
      mem0: { baseUrl: 'https://api.mem0.ai', apiKey: 'test-key' },
      langfuse: { secretKey: 'secret' },
      cryptoBro: { mikaComplianceLevel: 'full', enabled: false, chainRpcUrls: {} },
      mcp: { endpoints: [], timeout: 30000 },
      environment: 'dev',
      logLevel: 'info',
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    setMem0Client(null as any);
  });

  it('should create a mem0 client', () => {
    const client = new Mem0Client(mockConfig);
    expect(client).toBeDefined();
  });

  it('should throw error when config missing', () => {
    const invalidConfig = { ...mockConfig, mem0: { baseUrl: '', apiKey: '' } };
    expect(() => new Mem0Client(invalidConfig as Config)).toThrow();
  });

  it('should get and set global client', () => {
    const client1 = new Mem0Client(mockConfig);
    setMem0Client(client1);
    const client2 = getMem0Client();
    expect(client2).toBe(client1);
  });

  it('should throw error when client not initialized', () => {
    setMem0Client(null as any);
    expect(() => getMem0Client()).toThrow();
  });

  it('should create a memory', async () => {
    const client = new Mem0Client(mockConfig);
    const mockMemory = { id: 'mem-1', content: 'Test memory', metadata: {} };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMemory,
    });

    const result = await client.createMemory('Test memory');
    expect(result).toEqual(mockMemory);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/memories'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('test-key'),
        }),
      })
    );
  });

  it('should search memories', async () => {
    const client = new Mem0Client(mockConfig);
    const mockResults = [{ id: 'mem-1', content: 'Result 1' }];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults,
    });

    const results = await client.searchMemories({ query: 'test query' });
    expect(results).toEqual(mockResults);
  });
});

