import type { Config } from '@evergreen/config';
import { getLogger, HttpClient, SingletonClientManager } from '@evergreen/shared-utils';
import { EvergreenError } from '@evergreen/shared-utils';

export interface Memory {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Entity {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  relationships?: Array<{
    targetId: string;
    targetType: string;
    relationshipType: string;
  }>;
}

export interface MemorySearchOptions {
  query: string;
  limit?: number;
  threshold?: number;
  filters?: Record<string, unknown>;
}

export interface EntityGraphQuery {
  entityType?: string;
  entityId?: string;
  relationshipType?: string;
  limit?: number;
}

export class Mem0Client {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly logger = getLogger();
  private readonly http: HttpClient;

  constructor(config: Config) {
    this.baseUrl = config.mem0.baseUrl;
    this.apiKey = config.mem0.apiKey;

    if (!this.baseUrl || !this.apiKey) {
      throw new EvergreenError('mem0 configuration missing', 'MEM0_CONFIG_ERROR', {
        hasBaseUrl: !!this.baseUrl,
        hasApiKey: !!this.apiKey,
      });
    }

    this.http = new HttpClient({
      baseUrl: this.baseUrl,
      defaultHeaders: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      retry: {
        maxAttempts: 3,
        delay: 500,
        backoff: 'exponential',
      },
    });
  }

  async createMemory(
    content: string,
    metadata?: Record<string, unknown>,
    referenceIds?: string[]
  ): Promise<Memory> {
    this.logger.debug('Creating memory', { contentLength: content.length, metadata });

    const memory = await this.http.post<Memory>('/api/v1/memories', {
      body: {
        content,
        metadata: metadata || {},
        reference_ids: referenceIds || [],
      },
    });

    this.logger.info('Memory created', { memoryId: memory.id });
    return memory;
  }

  async searchMemories(options: MemorySearchOptions): Promise<Memory[]> {
    this.logger.debug('Searching memories', { query: options.query, limit: options.limit });

    const query: Record<string, string | number | boolean> = {
      query: options.query,
      limit: options.limit ?? 10,
    };

    if (options.threshold !== undefined) {
      query.threshold = options.threshold;
    }

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query[`filters[${key}]`] = String(value);
      });
    }

    const results = await this.http.get<Memory[]>('/api/v1/memories/search', { query });
    this.logger.info('Memory search completed', { resultCount: results.length });
    return results;
  }

  async getMemory(memoryId: string): Promise<Memory> {
    this.logger.debug('Getting memory', { memoryId });
    return this.http.get<Memory>(`/api/v1/memories/${memoryId}`);
  }

  async updateMemory(
    memoryId: string,
    content?: string,
    metadata?: Record<string, unknown>
  ): Promise<Memory> {
    this.logger.debug('Updating memory', { memoryId });
    const memory = await this.http.patch<Memory>(`/api/v1/memories/${memoryId}`, {
      body: {
        ...(content && { content }),
        ...(metadata && { metadata }),
      },
    });
    this.logger.info('Memory updated', { memoryId });
    return memory;
  }

  async deleteMemory(memoryId: string): Promise<void> {
    this.logger.debug('Deleting memory', { memoryId });
    await this.http.delete(`/api/v1/memories/${memoryId}`);
    this.logger.info('Memory deleted', { memoryId });
  }

  async createEntity(
    type: string,
    properties: Record<string, unknown>,
    relationships?: Array<{
      targetId: string;
      targetType: string;
      relationshipType: string;
    }>
  ): Promise<Entity> {
    this.logger.debug('Creating entity', { type, properties });

    const entity = await this.http.post<Entity>('/api/v1/entities', {
      body: {
        type,
        properties,
        relationships: relationships || [],
      },
    });

    this.logger.info('Entity created', { entityId: entity.id, type });
    return entity;
  }

  async queryEntityGraph(query: EntityGraphQuery): Promise<Entity[]> {
    this.logger.debug('Querying entity graph', { query });

    const queryParams: Record<string, string | number | boolean> = {};
    if (query.entityType) queryParams.entity_type = query.entityType;
    if (query.entityId) queryParams.entity_id = query.entityId;
    if (query.relationshipType) queryParams.relationship_type = query.relationshipType;
    if (query.limit) queryParams.limit = query.limit;

    const results = await this.http.get<Entity[]>('/api/v1/entities', { query: queryParams });
    this.logger.info('Entity graph query completed', { resultCount: results.length });
    return results;
  }

  async createRelationship(
    sourceId: string,
    targetId: string,
    relationshipType: string
  ): Promise<void> {
    this.logger.debug('Creating relationship', { sourceId, targetId, relationshipType });

    await this.http.post(`/api/v1/entities/${sourceId}/relationships`, {
      body: {
        target_id: targetId,
        relationship_type: relationshipType,
      },
    });

    this.logger.info('Relationship created', { sourceId, targetId, relationshipType });
  }

  async getEntity(entityId: string): Promise<Entity> {
    this.logger.debug('Getting entity', { entityId });
    return this.http.get<Entity>(`/api/v1/entities/${entityId}`);
  }
}

/**
 * Mem0 client manager using singleton pattern
 */
export const mem0ClientManager = new SingletonClientManager<Mem0Client>(
  (config: Config) => new Mem0Client(config)
);

/**
 * Gets or creates the global mem0 client
 */
export function getMem0Client(config?: Config): Mem0Client {
  return mem0ClientManager.getClient(config);
}

/**
 * Sets the global mem0 client (useful for testing)
 */
export function setMem0Client(client: Mem0Client): void {
  mem0ClientManager.setClient(client);
}

/**
 * Resets the mem0 client manager (useful for testing)
 */
export function resetMem0Client(): void {
  mem0ClientManager.reset();
}
