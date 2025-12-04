import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadConfig, loadConfigSync } from '../src/loader';
import { configSchema } from '../src/schema';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Config Loader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evergreen-config-test-'));
    process.chdir(tempDir);
    // Clear env vars that might interfere
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.MEM0_BASE_URL;
    delete process.env.MEM0_API_KEY;
    delete process.env.LANGFUSE_SECRET_KEY;
  });

  it('should load config with defaults when no env vars are set', async () => {
    // Create minimal package.json to make findRootDir work
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

    const config = await loadConfig({ skipInfisical: true });

    expect(config.environment).toBe('dev');
    expect(config.logLevel).toBe('info');
    expect(config.temporal.address).toBe('localhost:7233');
    expect(config.temporal.namespace).toBe('default');
    expect(config.temporal.taskQueue).toBe('evergreen-tasks');
  });

  it('should load config from environment variables', async () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key-123';
    process.env.SUPABASE_SERVICE_KEY = 'service-key-456';
    process.env.MEM0_BASE_URL = 'https://api.mem0.ai';
    process.env.MEM0_API_KEY = 'mem0-key-789';
    process.env.LANGFUSE_SECRET_KEY = 'langfuse-secret-123';
    process.env.TEMPORAL_ADDRESS = 'temporal.example.com:7233';
    process.env.TEMPORAL_NAMESPACE = 'test-namespace';
    process.env.TEMPORAL_TASK_QUEUE = 'test-queue';

    const config = await loadConfig({ skipInfisical: true });

    expect(config.supabase.url).toBe('https://test.supabase.co');
    expect(config.supabase.anonKey).toBe('anon-key-123');
    expect(config.supabase.serviceKey).toBe('service-key-456');
    expect(config.mem0.baseUrl).toBe('https://api.mem0.ai');
    expect(config.mem0.apiKey).toBe('mem0-key-789');
    expect(config.langfuse.secretKey).toBe('langfuse-secret-123');
    expect(config.temporal.address).toBe('temporal.example.com:7233');
    expect(config.temporal.namespace).toBe('test-namespace');
    expect(config.temporal.taskQueue).toBe('test-queue');
  });

  it('should load config from .env file', async () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
    fs.writeFileSync(
      path.join(tempDir, '.env'),
      `SUPABASE_URL=https://env-test.supabase.co
SUPABASE_ANON_KEY=env-anon-key
SUPABASE_SERVICE_KEY=env-service-key
MEM0_BASE_URL=https://env-api.mem0.ai
MEM0_API_KEY=env-mem0-key
LANGFUSE_SECRET_KEY=env-langfuse-secret`
    );

    const config = await loadConfig({ skipInfisical: true });

    expect(config.supabase.url).toBe('https://env-test.supabase.co');
    expect(config.supabase.anonKey).toBe('env-anon-key');
    expect(config.supabase.serviceKey).toBe('env-service-key');
  });

  it('should prioritize .env.local over .env (but process.env takes final precedence)', async () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
    
    // Save original process.env values
    const originalEnv = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
      MEM0_BASE_URL: process.env.MEM0_BASE_URL,
      MEM0_API_KEY: process.env.MEM0_API_KEY,
      LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    };
    
    // Clear process.env for this test to verify .env.local > .env precedence
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.MEM0_BASE_URL;
    delete process.env.MEM0_API_KEY;
    delete process.env.LANGFUSE_SECRET_KEY;

    try {
      fs.writeFileSync(
        path.join(tempDir, '.env'),
        'SUPABASE_URL=https://env.supabase.co\nSUPABASE_ANON_KEY=env-key\nSUPABASE_SERVICE_KEY=env-service-key\nMEM0_BASE_URL=https://env-api.mem0.ai\nMEM0_API_KEY=env-mem0-key\nLANGFUSE_SECRET_KEY=env-langfuse-secret'
      );
      fs.writeFileSync(
        path.join(tempDir, '.env.local'),
        'SUPABASE_URL=https://env-local.supabase.co\nSUPABASE_ANON_KEY=env-local-key\nSUPABASE_SERVICE_KEY=env-local-service-key\nMEM0_BASE_URL=https://env-local-api.mem0.ai\nMEM0_API_KEY=env-local-mem0-key\nLANGFUSE_SECRET_KEY=env-local-langfuse-secret'
      );

      const config = await loadConfig({ skipInfisical: true });

      // According to architecture: .env.local should override .env
      expect(config.supabase.url).toBe('https://env-local.supabase.co');
      expect(config.supabase.anonKey).toBe('env-local-key');
    } finally {
      // Restore process.env
      Object.assign(process.env, originalEnv);
    }
  });

  it('should validate config schema and throw on invalid data', async () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
    process.env.SUPABASE_URL = 'not-a-url';
    process.env.SUPABASE_ANON_KEY = '';
    process.env.SUPABASE_SERVICE_KEY = '';

    await expect(loadConfig({ skipInfisical: true })).rejects.toThrow();
  });

  it('should work with loadConfigSync', () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
    process.env.SUPABASE_URL = 'https://sync-test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'sync-anon-key';
    process.env.SUPABASE_SERVICE_KEY = 'sync-service-key';
    process.env.MEM0_BASE_URL = 'https://sync-api.mem0.ai';
    process.env.MEM0_API_KEY = 'sync-mem0-key';
    process.env.LANGFUSE_SECRET_KEY = 'sync-langfuse-secret';

    const config = loadConfigSync();

    expect(config.supabase.url).toBe('https://sync-test.supabase.co');
    expect(config.mem0.baseUrl).toBe('https://sync-api.mem0.ai');
  });

  it('should handle cryptoBro configuration', async () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon';
    process.env.SUPABASE_SERVICE_KEY = 'service';
    process.env.MEM0_BASE_URL = 'https://api.mem0.ai';
    process.env.MEM0_API_KEY = 'key';
    process.env.LANGFUSE_SECRET_KEY = 'secret';
    process.env.CRYPTOBRO_ENABLED = 'true';
    process.env.CRYPTOBRO_MIKA_COMPLIANCE_LEVEL = 'light';

    const config = await loadConfig({ skipInfisical: true });

    expect(config.cryptoBro.enabled).toBe(true);
    expect(config.cryptoBro.mikaComplianceLevel).toBe('light');
  });

  it('should handle MCP endpoints from JSON', async () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon';
    process.env.SUPABASE_SERVICE_KEY = 'service';
    process.env.MEM0_BASE_URL = 'https://api.mem0.ai';
    process.env.MEM0_API_KEY = 'key';
    process.env.LANGFUSE_SECRET_KEY = 'secret';
    process.env.MCP_ENDPOINTS = JSON.stringify(['https://mcp1.example.com', 'https://mcp2.example.com']);

    const config = await loadConfig({ skipInfisical: true });

    expect(config.mcp.endpoints).toHaveLength(2);
    expect(config.mcp.endpoints).toContain('https://mcp1.example.com');
    expect(config.mcp.endpoints).toContain('https://mcp2.example.com');
  });
});

