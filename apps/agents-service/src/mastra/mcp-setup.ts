import { MCPClient } from '@mastra/mcp';
import type { Config } from '@evergreen/config';
import { getLogger } from '@evergreen/shared-utils';

/**
 * Sets up MCP clients for document and pricing servers
 */
export function setupMCPClients(config: Config): MCPClient[] {
  const logger = getLogger();
  const clients: MCPClient[] = [];

  if (!config.mcp.endpoints || config.mcp.endpoints.length === 0) {
    logger.warn('No MCP endpoints configured');
    return clients;
  }

  logger.info('Setting up MCP clients', { endpointCount: config.mcp.endpoints.length });

  for (const endpoint of config.mcp.endpoints) {
    try {
      const client = new MCPClient({
        transport: {
          type: 'http',
          url: endpoint,
        },
        timeout: config.mcp.timeout,
      });

      clients.push(client);
      logger.info('MCP client created', { endpoint });
    } catch (error) {
      logger.error('Failed to create MCP client', { endpoint, error });
    }
  }

  return clients;
}

/**
 * Gets MCP tools from all connected clients
 */
export async function getMCPTools(clients: MCPClient[]): Promise<any[]> {
  const allTools: any[] = [];

  for (const client of clients) {
    try {
      // TODO: Implement actual tool fetching from MCP client
      // const tools = await client.listTools();
      // allTools.push(...tools);
    } catch (error) {
      const logger = getLogger();
      logger.error('Failed to fetch tools from MCP client', { error });
    }
  }

  return allTools;
}

