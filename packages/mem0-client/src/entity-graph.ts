import type { Mem0Client, Entity } from './client';
import { getLogger } from '@evergreen/shared-utils';

/**
 * Helper functions for working with the mem0 entity graph
 */
export class EntityGraphHelper {
  constructor(private client: Mem0Client) {}

  /**
   * Creates an Asset entity and links it to related entities
   */
  async createAssetEntity(
    assetId: string,
    assetData: {
      name: string;
      type: string;
      strategy: string;
      status: string;
      [key: string]: unknown;
    },
    relatedEntityIds?: string[]
  ): Promise<Entity> {
    const logger = getLogger();
    logger.debug('Creating Asset entity', { assetId, assetData });

    const entity = await this.client.createEntity('Asset', {
      id: assetId,
      ...assetData,
    });

    // Link to related entities if provided
    if (relatedEntityIds) {
      for (const relatedId of relatedEntityIds) {
        await this.client.createRelationship(entity.id, relatedId, 'related_to');
      }
    }

    return entity;
  }

  /**
   * Creates a Scenario entity and links it to assets
   */
  async createScenarioEntity(
    scenarioId: string,
    scenarioData: {
      name: string;
      description?: string;
      parameters: Record<string, unknown>;
      results?: Record<string, unknown>;
    },
    assetIds?: string[]
  ): Promise<Entity> {
    const logger = getLogger();
    logger.debug('Creating Scenario entity', { scenarioId, scenarioData });

    const entity = await this.client.createEntity('Scenario', {
      id: scenarioId,
      ...scenarioData,
    });

    // Link to assets if provided
    if (assetIds) {
      for (const assetId of assetIds) {
        await this.client.createRelationship(entity.id, assetId, 'applies_to');
      }
    }

    return entity;
  }

  /**
   * Creates a Workflow entity and links it to related entities
   */
  async createWorkflowEntity(
    workflowId: string,
    workflowData: {
      type: string;
      status: string;
      startedAt: string;
      endedAt?: string;
      [key: string]: unknown;
    },
    relatedEntityIds?: string[]
  ): Promise<Entity> {
    const logger = getLogger();
    logger.debug('Creating Workflow entity', { workflowId, workflowData });

    const entity = await this.client.createEntity('Workflow', {
      id: workflowId,
      ...workflowData,
    });

    // Link to related entities if provided
    if (relatedEntityIds) {
      for (const relatedId of relatedEntityIds) {
        await this.client.createRelationship(entity.id, relatedId, 'references');
      }
    }

    return entity;
  }

  /**
   * Creates an Investor entity
   */
  async createInvestorEntity(
    investorId: string,
    investorData: {
      name: string;
      classification: string;
      kycStatus: string;
      eligibilityTags?: string[];
      [key: string]: unknown;
    }
  ): Promise<Entity> {
    const logger = getLogger();
    logger.debug('Creating Investor entity', { investorId, investorData });

    return this.client.createEntity('Investor', {
      id: investorId,
      ...investorData,
    });
  }

  /**
   * Creates a Policy entity
   */
  async createPolicyEntity(
    policyId: string,
    policyData: {
      name: string;
      type: string;
      rules: Record<string, unknown>;
      [key: string]: unknown;
    }
  ): Promise<Entity> {
    const logger = getLogger();
    logger.debug('Creating Policy entity', { policyId, policyData });

    return this.client.createEntity('Policy', {
      id: policyId,
      ...policyData,
    });
  }

  /**
   * Queries entities by type
   */
  async getEntitiesByType(type: string, limit?: number): Promise<Entity[]> {
    return this.client.queryEntityGraph({ entityType: type, limit });
  }

  /**
   * Gets all entities related to a given entity
   */
  async getRelatedEntities(
    entityId: string,
    relationshipType?: string,
    limit?: number
  ): Promise<Entity[]> {
    const entity = await this.client.getEntity(entityId);
    const relatedIds = (entity.relationships || [])
      .filter((rel) => !relationshipType || rel.relationshipType === relationshipType)
      .map((rel) => rel.targetId)
      .slice(0, limit);

    const relatedEntities = await Promise.all(
      relatedIds.map((id) => this.client.getEntity(id))
    );

    return relatedEntities;
  }

  /**
   * Finds entities by property value
   */
  async findEntitiesByProperty(
    type: string,
    property: string,
    value: unknown,
    limit?: number
  ): Promise<Entity[]> {
    const allEntities = await this.getEntitiesByType(type, limit ? limit * 2 : undefined);
    return allEntities
      .filter((entity) => entity.properties[property] === value)
      .slice(0, limit);
  }
}

