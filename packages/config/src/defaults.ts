import { Config } from './schema';

export const defaultConfig: Partial<Config> = {
  environment: 'dev',
  logLevel: 'info',
  supabase: {
    url: 'http://localhost:54321',
    anonKey: 'default-anon-key',
    serviceKey: 'default-service-key',
  },
  mem0: {
    baseUrl: 'https://api.mem0.ai',
    apiKey: 'default-api-key',
  },
  langfuse: {
    secretKey: 'default-secret-key',
  },
  temporal: {
    address: 'localhost:7233',
    namespace: 'default',
    taskQueue: 'evergreen-tasks',
  },
  duckdb: {
    path: './analytics/dev.duckdb',
  },
  cryptoBro: {
    mikaComplianceLevel: 'full',
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
};

