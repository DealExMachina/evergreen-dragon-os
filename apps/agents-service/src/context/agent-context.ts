import type { Config } from '@evergreen/config';
import type { Logger } from '@evergreen/shared-utils';
import { getLogger } from '@evergreen/shared-utils';
import { getPrismaClient, type PrismaClient } from '@evergreen/supabase-client';
import { getMem0Client, type Mem0Client } from '@evergreen/mem0-client';
import type { AgentIntegrations } from '../mastra/integrations/contracts';

export interface AgentContext {
  config: Config;
  logger: Logger;
  prisma: PrismaClient;
  mem0: Mem0Client;
  integrations: AgentIntegrations;
}

export function createAgentContext(
  config: Config,
  integrations: AgentIntegrations,
  logger: Logger = getLogger()
): AgentContext {
  return {
    config,
    logger,
    prisma: getPrismaClient(config),
    mem0: getMem0Client(config),
    integrations,
  };
}

