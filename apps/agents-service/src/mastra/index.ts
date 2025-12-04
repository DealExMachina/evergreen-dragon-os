import { Mastra } from '@mastra/core';
import type { Config } from '@evergreen/config';
import { getLogger } from '@evergreen/shared-utils';
import { commanderAgent } from './agents/commander';
import { simulationAgent } from './agents/simulation';
import { setupMCPClients, getMCPTools } from './mcp-setup';
import { setupRAG } from './rag-setup';
import { SupabaseRealtimeIntegration } from './integrations/supabase-realtime';
import { S3StorageIntegration } from './integrations/s3-storage';
import { Mem0Integration } from './integrations/mem0-integration';
import { TemporalIntegration } from './integrations/temporal-integration';
import { CopilotKitBridge } from './integrations/copilotkit-bridge';
import { createAgentContext } from '../context/agent-context';
import type { AgentIntegrations } from './integrations/contracts';

/**
 * Mastra integration context
 * Holds all integrations for agents to use
 */
export interface MastraIntegrationContext {
  mastra: Mastra;
  supabaseRealtime: SupabaseRealtimeIntegration;
  s3Storage: S3StorageIntegration;
  mem0: Mem0Integration;
  temporal: TemporalIntegration;
  copilotKit: CopilotKitBridge;
}

/**
 * Creates and configures Mastra instance with all agents, tools, RAG, and integrations
 */
export async function createMastra(config: Config): Promise<MastraIntegrationContext> {
  const logger = getLogger();
  logger.info('Creating Mastra instance with integrations');

  // Setup MCP clients for external tools (documents, pricing, etc.)
  const mcpClients = setupMCPClients(config);
  const mcpTools = await getMCPTools(mcpClients);

  // Setup RAG for document retrieval and context augmentation
  const rag = setupRAG(config);

  // Setup integrations
  const supabaseRealtime = new SupabaseRealtimeIntegration();
  const s3Storage = new S3StorageIntegration(process.env.S3_BUCKET || 'evergreen-documents');
  const mem0 = new Mem0Integration();
  const temporal = new TemporalIntegration();

  // Initialize all integrations (using BaseIntegration pattern)
  await Promise.all([
    supabaseRealtime.initialize(config),
    s3Storage.initialize(config),
    mem0.initialize(config),
    temporal.initialize(config),
  ]);

  const agentIntegrations: AgentIntegrations = {
    workflowScheduler: temporal,
    documentStorage: s3Storage,
    memoryStore: mem0,
    eventRouter: supabaseRealtime,
  };

  const agentContext = createAgentContext(config, agentIntegrations, logger);

  // Create Mastra instance with agents and tools
  const mastra = new Mastra({
    name: 'evergreen-dragon-os',
    agents: [
      commanderAgent(agentContext),
      simulationAgent(agentContext),
    ],
    tools: mcpTools,
    rag,
  });

  logger.info('Mastra instance created', {
    agentCount: mastra.agents.length,
    toolCount: mcpTools.length,
    mcpClientCount: mcpClients.length,
  });

  supabaseRealtime.setMastra(mastra);
  mem0.setMastra(mastra);
  const copilotKit = new CopilotKitBridge(mastra, supabaseRealtime);

  // Setup Supabase Realtime subscriptions
  supabaseRealtime.subscribeToEvents(async (payload) => {
    await supabaseRealtime.routeEventToAgent(payload.new.event_type as string, payload.new);
  });

  logger.info('All integrations initialized');

  return {
    mastra,
    supabaseRealtime,
    s3Storage,
    mem0,
    temporal,
    copilotKit,
  };
}

