import { configSchema, Config } from './schema';
import { defaultConfig } from './defaults';
import { fetchInfisicalSecrets, InfisicalConfig } from './infisical';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Loads environment variables from .env files.
 * Reads .env first, then .env.local, so .env.local values override .env values.
 */
function loadEnvFiles(): Record<string, string> {
  const env: Record<string, string> = {};
  const envFiles = ['.env', '.env.local']; // Read .env first, then .env.local (higher precedence)
  const rootDir = findRootDir();

  for (const file of envFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Simple env file parser (handles KEY=value format)
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const equalIndex = trimmed.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim();
            const value = trimmed.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
            env[key] = value;
          }
        }
      }
    }
  }

  // Also merge process.env (runtime overrides take precedence)
  // This is merged here for .env file parsing, but process.env will be applied again
  // at the end of loadConfig with final precedence
  Object.assign(env, process.env);
  return env;
}

/**
 * Finds the project root directory by looking for package.json or pnpm-workspace.yaml
 */
function findRootDir(): string {
  let current = process.cwd();
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    const packageJson = path.join(current, 'package.json');
    const workspaceYaml = path.join(current, 'pnpm-workspace.yaml');
    if (fs.existsSync(packageJson) || fs.existsSync(workspaceYaml)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
    depth++;
  }

  return process.cwd();
}

/**
 * Maps environment variable names to config keys.
 */
function mapEnvToConfig(env: Record<string, string>): Partial<Config> {
  const config: Partial<Config> = {};

  if (env.SUPABASE_URL || env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_KEY) {
    config.supabase = { ...(config.supabase || {}) } as any;
    if (env.SUPABASE_URL) (config.supabase as any).url = env.SUPABASE_URL;
    if (env.SUPABASE_ANON_KEY) (config.supabase as any).anonKey = env.SUPABASE_ANON_KEY;
    if (env.SUPABASE_SERVICE_KEY) (config.supabase as any).serviceKey = env.SUPABASE_SERVICE_KEY;
  }

  if (env.DUCKDB_FILE || env.DUCKDB_S3_ACCESS_KEY || env.DUCKDB_S3_SECRET_KEY || env.DUCKDB_S3_REGION || env.DUCKDB_S3_ENDPOINT) {
    config.duckdb = { ...(config.duckdb || {}) } as any;
    if (env.DUCKDB_FILE) (config.duckdb as any).path = env.DUCKDB_FILE;
    if (env.DUCKDB_S3_ACCESS_KEY) (config.duckdb as any).s3AccessKey = env.DUCKDB_S3_ACCESS_KEY;
    if (env.DUCKDB_S3_SECRET_KEY) (config.duckdb as any).s3SecretKey = env.DUCKDB_S3_SECRET_KEY;
    if (env.DUCKDB_S3_REGION) (config.duckdb as any).s3Region = env.DUCKDB_S3_REGION;
    if (env.DUCKDB_S3_ENDPOINT) (config.duckdb as any).s3Endpoint = env.DUCKDB_S3_ENDPOINT;
  }

  if (env.TEMPORAL_ADDRESS || env.TEMPORAL_NAMESPACE || env.TEMPORAL_TASK_QUEUE) {
    config.temporal = { ...(config.temporal || {}) } as any;
    if (env.TEMPORAL_ADDRESS) (config.temporal as any).address = env.TEMPORAL_ADDRESS;
    if (env.TEMPORAL_NAMESPACE) (config.temporal as any).namespace = env.TEMPORAL_NAMESPACE;
    if (env.TEMPORAL_TASK_QUEUE) (config.temporal as any).taskQueue = env.TEMPORAL_TASK_QUEUE;
  }

  if (env.MEM0_BASE_URL || env.MEM0_API_KEY) {
    config.mem0 = { ...(config.mem0 || {}) } as any;
    if (env.MEM0_BASE_URL) (config.mem0 as any).baseUrl = env.MEM0_BASE_URL;
    if (env.MEM0_API_KEY) (config.mem0 as any).apiKey = env.MEM0_API_KEY;
  }

  if (env.LANGFUSE_BASE_URL || env.LANGFUSE_SECRET_KEY || env.LANGFUSE_PUBLIC_KEY) {
    config.langfuse = { ...(config.langfuse || {}) } as any;
    if (env.LANGFUSE_BASE_URL) (config.langfuse as any).baseUrl = env.LANGFUSE_BASE_URL;
    if (env.LANGFUSE_SECRET_KEY) (config.langfuse as any).secretKey = env.LANGFUSE_SECRET_KEY;
    if (env.LANGFUSE_PUBLIC_KEY) (config.langfuse as any).publicKey = env.LANGFUSE_PUBLIC_KEY;
  }

  if (env.INFISICAL_PROJECT_TOKEN) {
    config.infisical = { ...config.infisical } as any;
    (config.infisical as any).projectToken = env.INFISICAL_PROJECT_TOKEN;
    if (env.INFISICAL_PROJECT_ID) (config.infisical as any).projectId = env.INFISICAL_PROJECT_ID;
    if (env.INFISICAL_ENVIRONMENT) (config.infisical as any).environment = env.INFISICAL_ENVIRONMENT;
    if (env.INFISICAL_API_URL) (config.infisical as any).apiUrl = env.INFISICAL_API_URL;
  }

  if (env.CRYPTOBRO_ENABLED || env.CRYPTOBRO_MIKA_COMPLIANCE_LEVEL) {
    config.cryptoBro = { ...(config.cryptoBro || { chainRpcUrls: {} }) } as any;
    if (env.CRYPTOBRO_ENABLED) (config.cryptoBro as any).enabled = env.CRYPTOBRO_ENABLED === 'true';
    if (env.CRYPTOBRO_MIKA_COMPLIANCE_LEVEL) (config.cryptoBro as any).mikaComplianceLevel = env.CRYPTOBRO_MIKA_COMPLIANCE_LEVEL as 'light' | 'full';
    if (!(config.cryptoBro as any).chainRpcUrls) (config.cryptoBro as any).chainRpcUrls = {};
  }

  if (env.MCP_ENDPOINTS) {
    try {
      const endpoints = JSON.parse(env.MCP_ENDPOINTS);
      config.mcp = { ...config.mcp } as any;
      (config.mcp as any).endpoints = endpoints;
    } catch {
      // Invalid JSON, ignore
    }
  }

  if (env.NODE_ENV) {
    const envMap: Record<string, 'dev' | 'staging' | 'production'> = {
      development: 'dev',
      staging: 'staging',
      production: 'production',
    };
    config.environment = envMap[env.NODE_ENV] || 'dev';
  }

  if (env.LOG_LEVEL) {
    config.logLevel = env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
  }

  return config;
}

/**
 * Loads configuration with the following precedence:
 * 1. Defaults
 * 2. .env files
 * 3. Infisical secrets (if configured)
 * 4. Runtime environment variables
 */
export async function loadConfig(options?: {
  skipInfisical?: boolean;
  infisicalConfig?: InfisicalConfig;
}): Promise<Config> {
  // Start with defaults
  let config: Partial<Config> = { ...defaultConfig };

  // Load from .env files
  const env = loadEnvFiles();
  const envConfig = mapEnvToConfig(env);
  config = { ...config, ...envConfig };

  // Load from Infisical if configured and not skipped
  if (!options?.skipInfisical && config.infisical) {
    try {
      const secrets = await fetchInfisicalSecrets(config.infisical);
      // Map Infisical secrets to config (same mapping as env vars)
      const infisicalConfig = mapEnvToConfig(secrets);
      config = { ...config, ...infisicalConfig };
    } catch (error) {
      console.warn('Failed to load secrets from Infisical:', error);
      // Continue with existing config
    }
  }

  // Apply runtime overrides (process.env takes final precedence)
  const runtimeConfig = mapEnvToConfig(process.env);
  config = { ...config, ...runtimeConfig };

  // Validate and return
  return configSchema.parse(config);
}

/**
 * Synchronous version that skips Infisical (for use in environments where async is not possible)
 */
export function loadConfigSync(): Config {
  let config: Partial<Config> = { ...defaultConfig };
  const env = loadEnvFiles();
  const envConfig = mapEnvToConfig(env);
  config = { ...config, ...envConfig };
  const runtimeConfig = mapEnvToConfig(process.env);
  config = { ...config, ...runtimeConfig };
  return configSchema.parse(config);
}

