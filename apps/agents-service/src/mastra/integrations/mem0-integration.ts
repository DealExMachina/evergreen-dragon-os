import type { Config } from '@evergreen/config';
import { BaseIntegration, withErrorHandling } from '@evergreen/shared-utils';
import { getMem0Client, type Mem0Client } from '@evergreen/mem0-client';
import type { Mastra } from '@mastra/core';
import type { MemoryStore } from './contracts';

/**
 * mem0 integration for Mastra agents
 * Provides institutional memory and entity graph access
 */
export class Mem0Integration extends BaseIntegration implements MemoryStore {
  private client: Mem0Client | null = null;
  private mastra: Mastra | null = null;

  constructor(mastra?: Mastra) {
    super();
    if (mastra) {
      this.mastra = mastra;
    }
  }

  setMastra(mastra: Mastra): void {
    this.mastra = mastra;
  }

  /**
   * Initialize mem0 integration
   */
  protected async doInitialize(config: Config): Promise<void> {
    this.client = getMem0Client(config);
  }

  /**
   * Cleanup (mem0 client is managed globally, no cleanup needed)
   */
  protected async doCleanup(): Promise<void> {
    // mem0 client is a singleton, no cleanup needed
    this.client = null;
  }

  /**
   * Get mem0 client (throws if not initialized)
   */
  private getClient(): Mem0Client {
    if (!this.client) {
      throw new Error('Mem0 client not initialized');
    }
    return this.client;
  }

  /**
   * Search mem0 for relevant memories
   */
  async searchMemories(
    query: string,
    limit = 10,
    entityTypes?: string[]
  ): Promise<Array<{ content: string; score: number; metadata?: Record<string, unknown> }>> {
    const client = this.getClient();

    return withErrorHandling(
      async () => {
        const results = await client.searchMemories({
          query,
          limit,
          filters: entityTypes ? { entity_type: entityTypes } : undefined,
        });

        return results.map((mem) => ({
          content: mem.content,
          score: 1.0, // mem0 doesn't return scores in current API
          metadata: mem.metadata,
        }));
      },
      { operation: 'search mem0 memories', query, limit }
    );
  }

  /**
   * Store memory after agent action
   */
  async storeMemory(
    content: string,
    entityIds?: string[],
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const client = this.getClient();

    return withErrorHandling(
      async () => {
        const memory = await client.createMemory(content, metadata, entityIds);
        return memory.id;
      },
      { operation: 'store memory in mem0', contentLength: content.length }
    );
  }

  /**
   * Get context for agent reasoning (combines mem0 + RAG)
   */
  async getAgentContext(
    agentName: string,
    query: string,
    includeMemories = true,
    includeRAG = true
  ): Promise<{
    memories: Array<{ content: string; score: number }>;
    documents?: Array<{ content: string; score: number }>;
  }> {
    return withErrorHandling(
      async () => {
        const context: {
          memories: Array<{ content: string; score: number }>;
          documents?: Array<{ content: string; score: number }>;
        } = {
          memories: [],
        };

        if (includeMemories) {
          context.memories = await this.searchMemories(query, 5);
        }

        if (includeRAG && this.mastra?.rag) {
          // TODO: Query RAG system
          // const ragResults = await this.mastra.rag.query(query, { limit: 5 });
          // context.documents = ragResults;
        }

        return context;
      },
      { operation: 'get agent context', agentName, query }
    );
  }

  /**
   * Store agent decision in mem0
   */
  async storeAgentDecision(
    agentName: string,
    situation: string,
    action: string,
    outcome?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const content = `Agent: ${agentName}\nSituation: ${situation}\nAction: ${action}${outcome ? `\nOutcome: ${outcome}` : ''}`;

    return this.storeMemory(content, undefined, {
      agent: agentName,
      type: 'decision',
      ...metadata,
    });
  }

}

