import { z } from 'zod';

export const supabaseConfigSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
  serviceKey: z.string().min(1),
});

export const duckdbConfigSchema = z.object({
  path: z.string(),
  s3AccessKey: z.string().optional(),
  s3SecretKey: z.string().optional(),
  s3Region: z.string().optional(),
  s3Endpoint: z.string().url().optional(),
});

export const temporalConfigSchema = z.object({
  address: z.string(),
  namespace: z.string(),
  taskQueue: z.string(),
  clientCertPath: z.string().optional(),
  clientKeyPath: z.string().optional(),
});

export const mem0ConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
});

export const langfuseConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  secretKey: z.string().min(1),
  publicKey: z.string().optional(),
});

export const infisicalConfigSchema = z.object({
  projectToken: z.string().min(1),
  projectId: z.string().optional(),
  environment: z.enum(['dev', 'staging', 'production']).default('dev'),
  apiUrl: z.string().url().optional(),
});

export const cryptoBroConfigSchema = z.object({
  mikaComplianceLevel: z.enum(['light', 'full']).default('full'),
  chainRpcUrls: z.record(z.string(), z.string().url()),
  enabled: z.boolean().default(false),
});

export const mcpConfigSchema = z.object({
  endpoints: z.array(z.string().url()).default([]),
  timeout: z.number().positive().default(30000),
});

export const agentRoutingConfigSchema = z.object({
  eventToAgent: z
    .record(z.string(), z.string())
    .default({
      ASSET_ONBOARD: 'simulation',
      VALUATION_CYCLE: 'simulation',
      MARKET_SHOCK: 'commander',
      LIQUIDITY_STRESS: 'commander',
      STRATEGIC_REQUEST: 'commander',
      RISK_ALERT: 'commander',
      COMPLIANCE_BREACH: 'commander',
      UNWIND_ASSET: 'commander',
    }),
});

export const configSchema = z.object({
  supabase: supabaseConfigSchema,
  duckdb: duckdbConfigSchema,
  temporal: temporalConfigSchema,
  mem0: mem0ConfigSchema,
  langfuse: langfuseConfigSchema,
  infisical: infisicalConfigSchema.optional(),
  cryptoBro: cryptoBroConfigSchema,
  mcp: mcpConfigSchema,
  agentRouting: agentRoutingConfigSchema,
  environment: z.enum(['dev', 'staging', 'production']).default('dev'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof configSchema>;
export type SupabaseConfig = z.infer<typeof supabaseConfigSchema>;
export type DuckDBConfig = z.infer<typeof duckdbConfigSchema>;
export type TemporalConfig = z.infer<typeof temporalConfigSchema>;
export type Mem0Config = z.infer<typeof mem0ConfigSchema>;
export type LangfuseConfig = z.infer<typeof langfuseConfigSchema>;
export type InfisicalConfig = z.infer<typeof infisicalConfigSchema>;
export type CryptoBroConfig = z.infer<typeof cryptoBroConfigSchema>;
export type MCPConfig = z.infer<typeof mcpConfigSchema>;
export type AgentRoutingConfig = z.infer<typeof agentRoutingConfigSchema>;

